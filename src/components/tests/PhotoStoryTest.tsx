import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testAnalysisService } from '@/services/testAnalysisService';
import { testLimitService } from '@/services/testLimitService';
import { supabase } from '@/integrations/supabase/client';
import AnalysisLoadingScreen from '@/components/analysis/AnalysisLoadingScreen';
import TestTimer from '@/components/tests/TestTimer';
import { Camera, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const PhotoStoryTest = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [story, setStory] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setCapturedImage(imageDataUrl);
        
        // Convert to File object
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setCapturedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTimeUp = () => {
    if (story.trim() && capturedImage) {
      handleSubmit();
    } else {
      toast.warning('Time is up! Please complete your response.');
    }
  };

  const handleSubmit = async () => {
    if (!story.trim()) {
      toast.error('Please write your story before submitting');
      return;
    }

    if (!capturedImage || !imageFile) {
      toast.error('Please capture or upload an image');
      return;
    }

    if (!user?.id) {
      toast.error('Please sign in to submit');
      return;
    }

    try {
      setIsAnalyzing(true);

      // Create test session
      const newSessionId = await testAnalysisService.createTestSession(
        user.id,
        'photo_story',
        1
      );
      setSessionId(newSessionId);

      // Upload image to Supabase Storage
      const fileName = `photo-story/${user.id}/${Date.now()}-${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('test-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('test-images')
        .getPublicUrl(fileName);

      // Store response with image URL
      const responseId = await testAnalysisService.storeResponse(
        user.id,
        newSessionId,
        'photo-story-1',
        story,
        0,
        'photo_story'
      );

      // Update session
      await testAnalysisService.updateTestSession(newSessionId, 1, 'completed', user.id);

      // Check if premium
      const canGetFree = await testAnalysisService.canUserGetFreeAnalysis(user.id);
      const hasSubscription = await testAnalysisService.getUserSubscription(user.id);
      const isPremium = hasSubscription || !canGetFree;

      // Analyze response with image
      await testAnalysisService.analyzeIndividualResponse(
        user.id,
        responseId,
        'photo_story',
        story,
        'Write a creative story based on the image you captured/uploaded',
        publicUrl,
        isPremium
      );

      // Decrement test limit
      await testLimitService.decrementTestLimit(user.id, 'tat'); // Using TAT limit for now

      toast.success('Photo story submitted and analyzed successfully!');
      
      setTimeout(() => {
        navigate(`/test-results/${newSessionId}`);
      }, 2000);

    } catch (error) {
      console.error('Error submitting photo story:', error);
      toast.error(`Submission failed: ${error.message}`);
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return <AnalysisLoadingScreen testType="photo_story" isVisible={isAnalyzing} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              Photo Story Test
            </CardTitle>
            <p className="text-center text-gray-600">
              Capture or upload an image, then write a creative story
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Camera/Upload Section */}
            {!capturedImage ? (
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
                    <p className="text-sm text-gray-500">
                      Take a photo or upload an image to begin
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full max-h-96 object-contain rounded-lg"
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

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-lg font-medium text-blue-900 mb-2">
                    Write Your Story
                  </p>
                  <p className="text-blue-800 text-sm">
                    Create a creative story based on the image. Include characters, setting, and plot.
                  </p>
                </div>

                <TestTimer 
                  totalTime={300}
                  isActive={true}
                  onTimeUp={handleTimeUp}
                  showWarning={true}
                />

                <Textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Write your creative story here... (minimum 100 words recommended)"
                  className="min-h-40"
                  maxLength={2000}
                />
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {story.length} / 2000 characters
                  </p>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!story.trim() || story.length < 50}
                    size="lg"
                  >
                    Submit Story for Analysis
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PhotoStoryTest;
