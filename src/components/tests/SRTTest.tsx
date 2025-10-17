
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestContentService } from '@/services/testContentService';
import { testAnalysisService } from '@/services/testAnalysisService';
import { testLimitService } from '@/services/testLimitService';
import { setupTestTables } from '@/services/databaseSetup';
import { supabase } from '@/integrations/supabase/client';
import AnalysisLoadingScreen from '@/components/analysis/AnalysisLoadingScreen';
import TestTimer from '@/components/tests/TestTimer';
import { Camera, Upload, X, Edit } from 'lucide-react';
import { toast } from 'sonner';

const SRTTest = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const [situations, setSituations] = useState<any[]>([]);
  const [responses, setResponses] = useState<{[key: number]: string}>({});
  const [currentSituationIndex, setCurrentSituationIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [isTestActive, setIsTestActive] = useState(false);
  
  // Upload functionality
  const [responseMode, setResponseMode] = useState<'type' | 'upload'>('type');
  const [uploadedImages, setUploadedImages] = useState<{[key: number]: string}>({});
  const [imageFiles, setImageFiles] = useState<{[key: number]: File}>({});
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      initializeTest();
    }
  }, [user]);

  const initializeTest = async () => {
    try {
      if (!user?.id) {
        toast.error('Please sign in to take tests.');
        navigate('/dashboard');
        return;
      }

      const userId = user.id;
      console.log('Initializing SRT test for user:', userId);
      
      // Check database setup
      const dbSetup = await setupTestTables();
      console.log('Database setup result:', dbSetup);
      
      console.log('Fetching SRT situations...');
      const testSituations = await TestContentService.getRandomSRTSituations(60);
      console.log('Retrieved SRT situations:', testSituations?.length || 0);
      
      if (!testSituations || testSituations.length === 0) {
        console.error('No SRT situations retrieved from database');
        throw new Error('No SRT situations found in database');
      }

      console.log('Creating test session...');
      const sessionId = await testAnalysisService.createTestSession(
        user.id,
        'srt',
        testSituations.length
      );
      console.log('Session created:', sessionId);

      setSituations(testSituations);
      setSessionId(sessionId);
      setTestStartTime(Date.now());
      setIsTestActive(true);
      setIsLoading(false);
      
      toast.success(`SRT test initialized with ${testSituations.length} situations!`);
      console.log('SRT test initialized successfully with session:', sessionId);
      
    } catch (error) {
      console.error('Failed to initialize SRT test:', error);
      toast.error(`Test initialization failed: ${error.message}`);
      setIsLoading(false);
    }
  };

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
        setUploadedImages(prev => ({ ...prev, [currentSituationIndex]: imageDataUrl }));
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'srt-response.jpg', { type: 'image/jpeg' });
            setImageFiles(prev => ({ ...prev, [currentSituationIndex]: file }));
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
      
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Image is too large. Please select an image under 10MB.');
        return;
      }
      
      try {
        const processedFile = await compressImage(file);
        setImageFiles(prev => ({ ...prev, [currentSituationIndex]: processedFile }));
        
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedImages(prev => ({ ...prev, [currentSituationIndex]: e.target?.result as string }));
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
    setUploadedImages(prev => {
      const newImages = { ...prev };
      delete newImages[currentSituationIndex];
      return newImages;
    });
    setImageFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[currentSituationIndex];
      return newFiles;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTestTimeUp = async () => {
    toast.warning('Time is up! Submitting your responses for analysis...');
    setTimeout(() => {
      handleTestCompletion();
    }, 2000);
  };

  const saveCurrentResponse = async () => {
    const currentUserId = user?.id;
    
    if (responseMode === 'type' && currentResponse.trim()) {
      setResponses(prev => ({
        ...prev,
        [currentSituationIndex]: currentResponse.trim()
      }));
      setCurrentResponse('');
    } else if (responseMode === 'upload' && imageFiles[currentSituationIndex] && currentUserId) {
      try {
        const imageFile = imageFiles[currentSituationIndex];
        const fileName = `srt-responses/${currentUserId}/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('test-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('test-images')
          .getPublicUrl(fileName);

        setResponses(prev => ({
          ...prev,
          [currentSituationIndex]: JSON.stringify({ mode: 'uploaded', imageUrl: publicUrl })
        }));
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image. Please try again.');
      }
    }
  };

  const handleNext = async () => {
    await saveCurrentResponse();
    if (currentSituationIndex < situations.length - 1) {
      const nextIndex = currentSituationIndex + 1;
      setCurrentSituationIndex(nextIndex);
      
      // Load existing response for next situation
      const existingResponse = responses[nextIndex];
      if (existingResponse) {
        try {
          const parsed = JSON.parse(existingResponse);
          if (parsed.mode === 'uploaded') {
            setResponseMode('upload');
            setCurrentResponse('');
          } else {
            setResponseMode('type');
            setCurrentResponse(existingResponse);
          }
        } catch {
          setResponseMode('type');
          setCurrentResponse(existingResponse);
        }
      } else {
        setResponseMode('type');
        setCurrentResponse('');
      }
    }
  };

  const handlePrevious = async () => {
    await saveCurrentResponse();
    if (currentSituationIndex > 0) {
      const prevIndex = currentSituationIndex - 1;
      setCurrentSituationIndex(prevIndex);
      
      // Load existing response for previous situation
      const existingResponse = responses[prevIndex];
      if (existingResponse) {
        try {
          const parsed = JSON.parse(existingResponse);
          if (parsed.mode === 'uploaded') {
            setResponseMode('upload');
            setCurrentResponse('');
          } else {
            setResponseMode('type');
            setCurrentResponse(existingResponse);
          }
        } catch {
          setResponseMode('type');
          setCurrentResponse(existingResponse);
        }
      } else {
        setResponseMode('type');
        setCurrentResponse('');
      }
    }
  };

  const handleSubmitTest = async () => {
    await saveCurrentResponse();
    handleTestCompletion();
  };

  const handleTestCompletion = async () => {
    const currentUserId = user?.id;
    if (!currentUserId || !sessionId) {
      toast.error('Missing required information');
      return;
    }

    try {
      setIsAnalyzing(true);
      setIsTestActive(false);
      
      // Prepare responses array with all situations and their responses
      const finalResponses: string[] = [];
      const answeredSituations: any[] = [];
      
      for (let i = 0; i < situations.length; i++) {
        const response = responses[i] || 'No response provided';
        finalResponses.push(response);
        if (responses[i]) {
          answeredSituations.push(situations[i]);
        }
      }

      // Store all responses in database
      for (let i = 0; i < situations.length; i++) {
        if (responses[i]) {
          await testAnalysisService.storeResponse(
            currentUserId,
            sessionId,
            situations[i].id,
            responses[i],
            0, // Time taken per response not tracked in batch mode
            'srt'
          );
        }
      }

      const completedCount = Object.keys(responses).length;
      await testAnalysisService.updateTestSession(sessionId, completedCount, 'completed', currentUserId);

      const canGetFree = await testAnalysisService.canUserGetFreeAnalysis(currentUserId);
      const hasSubscription = await testAnalysisService.getUserSubscription(currentUserId);
      const isPremium = hasSubscription || !canGetFree;

      console.log(`Starting SRT batch analysis - Premium: ${isPremium}, Completed: ${completedCount}/${situations.length}`);

      // Send only answered situations for batch analysis
      await testAnalysisService.analyzeSRTBatch(user.id, sessionId, isPremium, answeredSituations, Object.values(responses));

      // Analyze test session to track streaks and update leaderboard
      await testAnalysisService.analyzeTestSession(currentUserId, sessionId, isPremium);

      // Decrement test count
      const decrementSuccess = await testLimitService.decrementTestLimit(user.id, 'srt');
      if (!decrementSuccess) {
        console.warn('Failed to decrement SRT test limit');
      }

      toast.success(`Test completed! Analyzed ${completedCount} responses successfully.`);
      
      setTimeout(() => {
        navigate(`/test-results/${sessionId}`);
      }, 2000);

    } catch (error) {
      console.error('Error completing SRT test:', error);
      console.error('Error details:', error.message, error.stack);
      toast.error(`SRT test completion failed: ${error.message || 'Unknown error'}`);
      navigate('/dashboard');
    }
  };

  // Update current response when situation changes
  useEffect(() => {
    const existingResponse = responses[currentSituationIndex];
    if (existingResponse) {
      try {
        const parsed = JSON.parse(existingResponse);
        if (parsed.mode === 'uploaded') {
          setResponseMode('upload');
          setCurrentResponse('');
        } else {
          setResponseMode('type');
          setCurrentResponse(existingResponse);
        }
      } catch {
        setResponseMode('type');
        setCurrentResponse(existingResponse);
      }
    } else {
      setCurrentResponse('');
    }
  }, [currentSituationIndex, responses]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Initializing SRT Test...</p>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return <AnalysisLoadingScreen testType="srt" isVisible={isAnalyzing} />;
  }

  if (situations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <p className="text-lg text-red-600">No SRT situations available. Please contact support.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSituation = situations[currentSituationIndex];
  const answeredCount = Object.keys(responses).length;
  const hasResponse = responses[currentSituationIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              Situation Reaction Test (SRT)
            </CardTitle>
            <div className="text-center space-y-2">
              <p className="text-gray-600">
                Situation {currentSituationIndex + 1} of {situations.length}
              </p>
              <div className="flex justify-center gap-4">
                <Badge variant="outline">
                  Answered: {answeredCount}/{situations.length}
                </Badge>
                {hasResponse && <Badge variant="secondary">Response Saved</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isTestActive && (
              <TestTimer 
                totalTime={1800} // 30 minutes = 1800 seconds
                isActive={true}
                onTimeUp={handleTestTimeUp}
                showWarning={true}
              />
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-blue-900 mb-2">Instructions:</p>
              <p className="text-blue-800">
                You have 30 minutes to answer as many situations as possible. Read each situation carefully 
                and write what you would do. Navigate between situations using the Previous/Next buttons. 
                Your responses are automatically saved.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Situation:</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                {currentSituation.situation}
              </p>
            </div>

            {/* Response Mode Toggle */}
            <div className="flex justify-center gap-4 mb-6">
              <Button
                variant={responseMode === 'type' ? 'default' : 'outline'}
                onClick={() => setResponseMode('type')}
                disabled={!isTestActive}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Type Response
              </Button>
              <Button
                variant={responseMode === 'upload' ? 'default' : 'outline'}
                onClick={() => setResponseMode('upload')}
                disabled={!isTestActive}
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
                  placeholder="Write your response to this situation..."
                  className="min-h-32"
                  disabled={!isTestActive}
                  autoFocus
                />
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button 
                      onClick={handlePrevious}
                      disabled={currentSituationIndex === 0 || !isTestActive}
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <Button 
                      onClick={handleNext}
                      disabled={currentSituationIndex === situations.length - 1 || !isTestActive}
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={handleSubmitTest}
                    disabled={!isTestActive || answeredCount === 0}
                    className="px-8"
                    variant={answeredCount > 0 ? "default" : "secondary"}
                  >
                    Submit Test ({answeredCount} responses)
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Upload Mode */}
                {!uploadedImages[currentSituationIndex] ? (
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
                        <p className="text-lg font-medium">Upload your handwritten response</p>
                        <div className="text-center bg-blue-50 p-4 rounded-lg mb-2">
                          <p className="text-sm font-medium text-blue-900">
                            Situation: {currentSituation.situation}
                          </p>
                        </div>
                        <div className="flex gap-4">
                          <Button onClick={startCamera} size="lg" disabled={!isTestActive}>
                            <Camera className="mr-2 h-5 w-5" />
                            Open Camera
                          </Button>
                          <Button 
                            onClick={() => fileInputRef.current?.click()} 
                            variant="outline" 
                            size="lg"
                            disabled={!isTestActive}
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
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button 
                          onClick={handlePrevious}
                          disabled={currentSituationIndex === 0 || !isTestActive}
                          variant="outline"
                        >
                          Previous
                        </Button>
                        <Button 
                          onClick={handleNext}
                          disabled={currentSituationIndex === situations.length - 1 || !isTestActive}
                          variant="outline"
                        >
                          Next
                        </Button>
                      </div>
                      
                      <Button 
                        onClick={handleSubmitTest}
                        disabled={!isTestActive || answeredCount === 0}
                        className="px-8"
                        variant={answeredCount > 0 ? "default" : "secondary"}
                      >
                        Submit Test ({answeredCount} responses)
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img 
                        src={uploadedImages[currentSituationIndex]} 
                        alt="Uploaded response" 
                        className="w-full max-h-96 object-contain rounded-lg border-2 border-green-200"
                      />
                      <Button 
                        onClick={removeImage} 
                        variant="destructive" 
                        size="icon"
                        className="absolute top-2 right-2"
                        disabled={!isTestActive}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button 
                          onClick={handlePrevious}
                          disabled={currentSituationIndex === 0 || !isTestActive}
                          variant="outline"
                        >
                          Previous
                        </Button>
                        <Button 
                          onClick={handleNext}
                          disabled={currentSituationIndex === situations.length - 1 || !isTestActive}
                          variant="outline"
                        >
                          Next
                        </Button>
                      </div>
                      
                      <Button 
                        onClick={handleSubmitTest}
                        disabled={!isTestActive || answeredCount === 0}
                        className="px-8"
                        variant={answeredCount > 0 ? "default" : "secondary"}
                      >
                        Submit Test ({answeredCount} responses)
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SRTTest;
