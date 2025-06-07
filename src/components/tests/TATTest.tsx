
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Clock, Eye, PenTool } from 'lucide-react';
import { TestContentService } from '@/services/testContentService';
import { testAnalysisService } from '@/services/testAnalysisService';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AnalysisLoadingScreen from '@/components/analysis/AnalysisLoadingScreen';
import { useToast } from '@/hooks/use-toast';

const TATTest = () => {
  const [phase, setPhase] = useState<'loading' | 'viewing' | 'writing' | 'analyzing' | 'completed'>('loading');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const totalImages = 12;

  useEffect(() => {
    loadRandomImages();
    initializeSession();
  }, []);

  const initializeSession = async () => {
    if (!user) return;
    
    try {
      const newSessionId = await testAnalysisService.createTestSession(
        user.id, 
        'tat', 
        totalImages
      );
      setSessionId(newSessionId);
      console.log('TAT session created:', newSessionId);
    } catch (error) {
      console.error('Error creating test session:', error);
      toast({
        title: "Error",
        description: "Failed to initialize test session. Please refresh and try again.",
        variant: "destructive"
      });
    }
  };

  const loadRandomImages = async () => {
    const fetchedImages = await TestContentService.getRandomTATImages(12);
    if (fetchedImages && fetchedImages.length > 0) {
      setImages(fetchedImages);
      setPhase('viewing');
    } else {
      console.error('No TAT images available');
      toast({
        title: "Error",
        description: "No test images available. Please contact support.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (phase === 'viewing' || phase === 'writing') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (phase === 'viewing') {
              setPhase('writing');
              return 240; // 4 minutes for writing
            } else if (phase === 'writing') {
              handleAutoAdvance();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase, currentImageIndex, currentResponse, responses]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAutoAdvance = async () => {
    try {
      // Save current response
      const newResponses = [...responses];
      newResponses[currentImageIndex] = currentResponse;
      setResponses(newResponses);

      // Store response in database
      if (currentResponse.trim()) {
        await testAnalysisService.storeResponse(
          user!.id,
          sessionId,
          `image_${currentImageIndex + 1}`,
          currentResponse,
          240 - timeLeft, // Time taken
          'tat'
        );
      }

      // Update session progress
      await testAnalysisService.updateTestSession(sessionId, currentImageIndex + 1);

      setCurrentResponse('');
      
      if (currentImageIndex < totalImages - 1) {
        setCurrentImageIndex(prev => prev + 1);
        setPhase('viewing');
        setTimeLeft(30); // 30 seconds viewing for next image
      } else {
        await handleTestCompletion();
      }
    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: "Error",
        description: "Failed to save response. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTestCompletion = async () => {
    if (!user || !sessionId) {
      toast({
        title: "Error",
        description: "Missing required information. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setPhase('analyzing');

    try {
      console.log('Completing TAT test');
      
      // Mark session as completed
      await testAnalysisService.updateTestSession(sessionId, totalImages, 'completed');

      // Check if user can get free analysis
      const canGetFree = await testAnalysisService.canUserGetFreeAnalysis(user.id);
      const isPremium = user.primaryEmailAddress?.emailAddress === 'editkarde@gmail.com' || !canGetFree;

      console.log('Analysis type:', isPremium ? 'Premium' : 'Free');

      // Analyze the complete session
      await testAnalysisService.analyzeTestSession(user.id, sessionId, isPremium);

      console.log('TAT analysis completed');
      
      toast({
        title: "Analysis Complete!",
        description: "Your TAT responses have been analyzed. Check your dashboard for results.",
        variant: "default"
      });

      setPhase('completed');
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error completing test:', error);
      toast({
        title: "Analysis Error",
        description: "Test completed but analysis failed. You can retry from your dashboard.",
        variant: "destructive"
      });
      setPhase('completed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    handleTestCompletion();
  };

  const currentImage = images[currentImageIndex];

  if (phase === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading test images...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'analyzing') {
    return (
      <AnalysisLoadingScreen 
        testType="tat" 
        isVisible={true}
      />
    );
  }

  if (phase === 'viewing') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                TAT Test - Image {currentImageIndex + 1} of {totalImages}
              </CardTitle>
              <div className="flex items-center text-2xl font-bold text-blue-600">
                <Clock className="h-6 w-6 mr-2" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-8 mb-4">
                {currentImage ? (
                  <img 
                    src={currentImage.image_url} 
                    alt={`TAT Test Image ${currentImageIndex + 1}`}
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Blank Slide - Create your own story</p>
                  </div>
                )}
              </div>
              <p className="text-gray-600">
                Study this image carefully. You have {timeLeft} seconds remaining.
              </p>
              {timeLeft <= 10 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 font-semibold">
                    ⚠️ Last {timeLeft} seconds! Prepare for writing phase.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'writing') {
    const wordCount = currentResponse.trim().split(/\s+/).filter(word => word.length > 0).length;

    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <PenTool className="h-5 w-5 mr-2" />
                TAT Test - Writing for Image {currentImageIndex + 1} of {totalImages}
              </CardTitle>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Words: {wordCount}</span>
                <div className="flex items-center text-2xl font-bold text-orange-600">
                  <Clock className="h-6 w-6 mr-2" />
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Writing Guidelines:</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Write a complete story with beginning, middle, and end</li>
                  <li>• Include what led to the situation shown in the image</li>
                  <li>• Describe what is currently happening</li>
                  <li>• Predict what will happen next</li>
                  <li>• Focus on positive themes and leadership qualities</li>
                </ul>
              </div>

              <Textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Write your story for this image..."
                className="min-h-64 text-base"
                autoFocus
                disabled={isSubmitting}
              />

              {timeLeft <= 30 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-semibold">
                    ⏰ Only {timeLeft} seconds remaining!
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Progress: {currentImageIndex + 1}/{totalImages} images
                </span>
                <div className="space-x-2">
                  {currentImageIndex === totalImages - 1 ? (
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Finish Test'}
                    </Button>
                  ) : (
                    <span className="text-sm text-gray-600">Auto-advancing to next image...</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>TAT Test Completed!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Test Successfully Submitted</h3>
            <p className="text-gray-600">
              Your TAT responses have been analyzed by our AI system.
              You'll be redirected to your dashboard shortly to view the detailed feedback.
            </p>
            <div className="flex justify-center space-x-4 mt-6">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Go to Dashboard Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TATTest;
