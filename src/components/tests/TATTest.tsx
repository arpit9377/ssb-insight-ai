import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestContentService } from '@/services/testContentService';
import { testAnalysisService } from '@/services/testAnalysisService';
import { testLimitService } from '@/services/testLimitService';
import { setupTestTables } from '@/services/databaseSetup';
import { supabase } from '@/integrations/supabase/client';
import AnalysisLoadingScreen from '@/components/analysis/AnalysisLoadingScreen';
import TestTimer from '@/components/tests/TestTimer';
import { Camera, Upload, X, Edit } from 'lucide-react';
import { toast } from 'sonner';

const TATTest = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<any[]>([]);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [viewingTime, setViewingTime] = useState(30);
  const [canRespond, setCanRespond] = useState(false);
  const [isWritingPhase, setIsWritingPhase] = useState(false);
  
  // Upload functionality
  const [responseMode, setResponseMode] = useState<'type' | 'upload'>('type');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      initializeTest();
    }
  }, [user]);

  // Timer for viewing phase (30 seconds)
  useEffect(() => {
    const currentImage = images[currentImageIndex];
    const isBlankSlide = currentImage?.id === 'blank-slide';
    
    if (!isWritingPhase && viewingTime > 0 && !isBlankSlide) {
      const timer = setTimeout(() => {
        setViewingTime(viewingTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!isWritingPhase && (viewingTime === 0 || isBlankSlide)) {
      setCanRespond(true);
      setIsWritingPhase(true);
    }
  }, [viewingTime, isWritingPhase, currentImageIndex, images]);

  // Reset timers when moving to next image
  useEffect(() => {
    const currentImage = images[currentImageIndex];
    const isBlankSlide = currentImage?.id === 'blank-slide';
    
    setViewingTime(30);
    setCanRespond(isBlankSlide); // Allow immediate response for blank slide
    setIsWritingPhase(isBlankSlide);
    setResponseMode('type');
    setUploadedImage(null);
    setImageFile(null);
    stopCamera();
  }, [currentImageIndex, images]);
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Unable to access camera. Please use file upload instead.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setUploadedImage(imageDataUrl);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'tat-response.jpg', { type: 'image/jpeg' });
            setImageFile(file);
          }
        }, 'image/jpeg');
      }
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      // If file is already under 5MB, return it
      if (file.size <= maxSize) {
        resolve(file);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions (max 1920px)
          const maxDimension = 1920;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                  console.log(`Compressed image from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                  resolve(compressedFile);
                } else {
                  reject(new Error('Failed to compress image'));
                }
              },
              'image/jpeg',
              0.8
            );
          }
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Check file size
      const maxSize = 10 * 1024 * 1024; // 10MB hard limit
      if (file.size > maxSize) {
        toast.error('Image is too large. Please select an image under 10MB.');
        return;
      }
      
      try {
        // Compress if needed
        const processedFile = await compressImage(file);
        setImageFile(processedFile);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedImage(e.target?.result as string);
        };
        reader.readAsDataURL(processedFile);
        
        if (processedFile.size < file.size) {
          toast.success('Image compressed for optimal processing');
        }
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error('Failed to process image. Please try another image.');
      }
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const initializeTest = async () => {
    try {
      if (!user?.id) {
        toast.error('Please sign in to take tests.');
        navigate('/dashboard');
        return;
      }

      const userId = user.id;
      console.log('Initializing TAT test for user:', userId);
      
      // Check database setup
      const dbSetup = await setupTestTables();
      console.log('Database setup result:', dbSetup);
      
      // Get 12 random images + add blank slide
      console.log('Fetching TAT images...');
      const testImages = await TestContentService.getRandomTATImages(12);
      console.log('Retrieved TAT images:', testImages?.length || 0);
      
      if (!testImages || testImages.length === 0) {
        console.error('No TAT images retrieved from database');
        throw new Error('No TAT images found in database');
      }

      // Add blank slide as 13th image
      const blankSlide = {
        id: 'blank-slide',
        image_url: '',
        prompt: 'This is a blank slide. Write a story of your own choice based on your imagination.',
        test_type: 'tat'
      };
      
      const allImages = [...testImages, blankSlide];
      console.log('Total images including blank slide:', allImages.length);

      console.log('Creating test session...');
      const sessionId = await testAnalysisService.createTestSession(
        user.id,
        'tat',
        allImages.length
      );
      console.log('Session created:', sessionId);

      setImages(allImages);
      setSessionId(sessionId);
      setResponses(new Array(allImages.length).fill(''));
      setStartTime(Date.now());
      setIsLoading(false);
      
      toast.success(`TAT test initialized with ${allImages.length} images!`);
      console.log('TAT test initialized successfully with session:', sessionId);
      
    } catch (error) {
      console.error('Failed to initialize TAT test:', error);
      toast.error(`Test initialization failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleWritingTimeUp = () => {
    if (currentResponse.trim()) {
      handleNext();
    } else {
      toast.warning('Time is up! Moving to next image...');
      setTimeout(() => {
        handleNext(true); // Force next even without response
      }, 1000);
    }
  };

  const handleNext = async (forceNext = false) => {
    if (!forceNext) {
      if (responseMode === 'type' && !currentResponse.trim()) {
        toast.error('Please provide a response before continuing');
        return;
      }
      if (responseMode === 'upload' && !uploadedImage) {
        toast.error('Please upload your response image');
        return;
      }
    }

    const currentUserId = user?.id;
    if (!currentUserId || !sessionId) {
      toast.error('Missing required information');
      return;
    }

    try {
      let imageUrl = null;
      
      // Upload image if in upload mode
      if (responseMode === 'upload' && imageFile) {
        const fileName = `tat-responses/${currentUserId}/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('test-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('test-images')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrl;
      }

      // Store response locally (don't send to AI yet)
      const newResponses = [...responses];
      const responseData = responseMode === 'type'
        ? currentResponse.trim() || 'No response provided'
        : JSON.stringify({ mode: 'uploaded', imageUrl });
        
      newResponses[currentImageIndex] = responseData;
      setResponses(newResponses);

      if (currentImageIndex < images.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
        setCurrentResponse('');
        setStartTime(Date.now());
      } else {
        await handleTestCompletion(newResponses);
      }
    } catch (error) {
      console.error('Error processing response:', error);
      toast.error('Failed to process response. Please try again.');
    }
  };

  const handleTestCompletion = async (finalResponses: string[]) => {
    const currentUserId = user?.id;
    if (!currentUserId || !sessionId) {
      toast.error('Missing required information');
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // Store all responses in database first
      for (let i = 0; i < images.length; i++) {
        await testAnalysisService.storeResponse(
          user.id,
          sessionId,
          images[i].id,
          finalResponses[i],
          0, // Time taken per response not tracked in batch mode
          'tat'
        );
      }

      await testAnalysisService.updateTestSession(sessionId, images.length, 'completed', user.id);

      const canGetFree = await testAnalysisService.canUserGetFreeAnalysis(user.id);
      const hasSubscription = await testAnalysisService.getUserSubscription(user.id);
      const isPremium = hasSubscription || !canGetFree;

      console.log(`Starting batch analysis - Premium: ${isPremium}`);

      // Send all responses for batch analysis
      await testAnalysisService.analyzeTATSession(user.id, sessionId, isPremium, images, finalResponses);

      // Decrement test count
      const decrementSuccess = await testLimitService.decrementTestLimit(user.id, 'tat');
      if (!decrementSuccess) {
        console.warn('Failed to decrement TAT test limit');
      }

      toast.success('Test completed and analyzed successfully!');
      
      setTimeout(() => {
        navigate(`/test-results/${sessionId}`);
      }, 2000);

    } catch (error) {
      console.error('Error completing TAT test:', error);
      console.error('Error details:', error.message, error.stack);
      toast.error(`TAT test completion failed: ${error.message || 'Unknown error'}`);
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Initializing TAT Test...</p>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return <AnalysisLoadingScreen testType="tat" isVisible={isAnalyzing} />;
  }

  if (images.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <p className="text-lg text-red-600">No TAT images available. Please contact support.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];
  const isBlankSlide = currentImage?.id === 'blank-slide';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              Thematic Apperception Test (TAT)
            </CardTitle>
            <p className="text-center text-gray-600">
              {isBlankSlide ? 'Blank Slide' : `Image ${currentImageIndex + 1}`} of {images.length}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isBlankSlide ? (
              <div className="flex justify-center">
                <img
                  src={currentImage.image_url}
                  alt={`TAT Image ${currentImageIndex + 1}`}
                  className="max-w-full h-auto max-h-96 rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-full max-w-md h-64 bg-gray-100 rounded-lg shadow-lg flex items-center justify-center">
                  <p className="text-gray-500 text-lg">Blank Slide - Use Your Imagination</p>
                </div>
              </div>
            )}
            
            {!canRespond && !isBlankSlide ? (
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p className="text-lg font-medium text-yellow-900 mb-2">
                  Observe the image carefully
                </p>
                <TestTimer 
                  totalTime={30}
                  isActive={true}
                  showWarning={false}
                  key={`tat-viewing-timer-${currentImageIndex}`}
                />
              </div>
            ) : (
              <TestTimer 
                totalTime={240}
                isActive={canRespond || isBlankSlide}
                onTimeUp={handleWritingTimeUp}
                showWarning={true}
                key={`tat-writing-timer-${currentImageIndex}`}
              />
            )}
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-blue-900 mb-2">Instructions:</p>
              <p className="text-blue-800">{currentImage.prompt}</p>
            </div>

            {(canRespond || isBlankSlide) && (
              <>
                {/* Response Mode Toggle */}
                <div className="flex justify-center gap-4 mb-6">
                  <Button
                    variant={responseMode === 'type' ? 'default' : 'outline'}
                    onClick={() => setResponseMode('type')}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Type Response
                  </Button>
                  <Button
                    variant={responseMode === 'upload' ? 'default' : 'outline'}
                    onClick={() => setResponseMode('upload')}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Response
                  </Button>
                </div>

                {responseMode === 'type' ? (
                  <div className="space-y-4">
                    <Textarea
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      placeholder="Write your story here..."
                      className="min-h-32"
                      autoFocus
                    />
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        Progress: {currentImageIndex + 1}/{images.length}
                      </p>
                      <Button 
                        onClick={() => handleNext()}
                        className="px-8"
                      >
                        {currentImageIndex === images.length - 1 ? 'Submit All Stories for Analysis' : 'Next'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Upload Mode */}
                    {!uploadedImage ? (
                      <div className="space-y-4">
                        {showCamera ? (
                          <div className="relative">
                            <video 
                              ref={videoRef} 
                              autoPlay 
                              playsInline
                              className="w-full max-h-96 rounded-lg"
                            />
                            <div className="flex justify-center gap-4 mt-4">
                              <Button onClick={capturePhoto} size="lg">
                                <Camera className="mr-2 h-5 w-5" />
                                Capture Photo
                              </Button>
                              <Button onClick={stopCamera} variant="outline" size="lg">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg">
                            <p className="text-lg font-medium">Upload your handwritten story</p>
                            {!isBlankSlide && (
                              <div className="text-center bg-blue-50 p-4 rounded-lg mb-2">
                                <p className="text-sm font-medium text-blue-900">
                                  Write your story about this image
                                </p>
                              </div>
                            )}
                            <div className="flex gap-4">
                              <Button onClick={startCamera} size="lg">
                                <Camera className="mr-2 h-5 w-5" />
                                Open Camera
                              </Button>
                              <Button 
                                onClick={() => fileInputRef.current?.click()} 
                                variant="outline" 
                                size="lg"
                              >
                                <Upload className="mr-2 h-5 w-5" />
                                Upload Image
                              </Button>
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative">
                          <img 
                            src={uploadedImage} 
                            alt="Uploaded response" 
                            className="w-full max-h-96 object-contain rounded-lg border-2 border-green-200"
                          />
                          <Button 
                            onClick={removeImage} 
                            variant="destructive" 
                            size="icon"
                            className="absolute top-2 right-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-green-600 font-medium">
                            ✓ Response image uploaded
                          </p>
                          <Button onClick={() => handleNext()} size="lg">
                            {currentImageIndex === images.length - 1 ? 'Submit All Stories for Analysis' : 'Next'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TATTest;
