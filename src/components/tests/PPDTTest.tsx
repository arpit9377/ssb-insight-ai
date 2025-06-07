
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Eye, PenTool } from 'lucide-react';
import { TestContentService } from '@/services/testContentService';
import { testAnalysisService } from '@/services/testAnalysisService';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AnalysisLoadingScreen from '@/components/analysis/AnalysisLoadingScreen';
import { useToast } from '@/hooks/use-toast';

const PPDTTest = () => {
  const [phase, setPhase] = useState<'loading' | 'viewing' | 'writing' | 'analyzing' | 'completed'>('loading');
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds for viewing
  const [response, setResponse] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [currentImage, setCurrentImage] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadRandomImage();
    initializeSession();
  }, []);

  const initializeSession = async () => {
    if (!user) return;
    
    try {
      const newSessionId = await testAnalysisService.createTestSession(
        user.id, 
        'ppdt', 
        1 // PPDT has 1 question
      );
      setSessionId(newSessionId);
      console.log('PPDT session created:', newSessionId);
    } catch (error) {
      console.error('Error creating test session:', error);
      toast({
        title: "Error",
        description: "Failed to initialize test session. Please refresh and try again.",
        variant: "destructive"
      });
    }
  };

  const loadRandomImage = async () => {
    const images = await TestContentService.getRandomPPDTImages(1);
    if (images && images.length > 0) {
      setCurrentImage(images[0]);
      setPhase('viewing');
    } else {
      console.error('No PPDT images available');
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
              handleAutoSubmit();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase]);

  useEffect(() => {
    const words = response.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [response]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAutoSubmit = () => {
    if (response.trim().length >= 10) {
      handleSubmit();
    } else {
      toast({
        title: "Warning",
        description: "Your response is too short. Please write at least a few words.",
        variant: "destructive"
      });
      setPhase('completed');
    }
  };

  const handleSubmit = async () => {
    if (!user || !sessionId || !currentImage) {
      toast({
        title: "Error",
        description: "Missing required information. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }

    if (response.trim().length < 10) {
      toast({
        title: "Response too short",
        description: "Please write at least a few words before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setPhase('analyzing');

    try {
      console.log('Submitting PPDT response:', response);
      
      // Calculate time taken (240 seconds - remaining time)
      const timeTaken = phase === 'writing' ? 240 - timeLeft : 240;
      
      // Store the response
      const responseId = await testAnalysisService.storeResponse(
        user.id,
        sessionId,
        currentImage.id,
        response,
        timeTaken,
        'ppdt'
      );

      console.log('Response stored:', responseId);

      // Update session as completed
      await testAnalysisService.updateTestSession(sessionId, 1, 'completed');

      // Check if user can get free analysis
      const canGetFree = await testAnalysisService.canUserGetFreeAnalysis(user.id);
      const isPremium = user.primaryEmailAddress?.emailAddress === 'editkarde@gmail.com' || !canGetFree;

      console.log('Analysis type:', isPremium ? 'Premium' : 'Free');

      // Analyze the individual response
      await testAnalysisService.analyzeIndividualResponse(
        user.id,
        responseId,
        'ppdt',
        response,
        currentImage.prompt,
        currentImage.image_url,
        isPremium
      );

      // Analyze the complete session (for PPDT it's just one response)
      await testAnalysisService.analyzeTestSession(user.id, sessionId, isPremium);

      console.log('PPDT analysis completed');
      
      toast({
        title: "Analysis Complete!",
        description: "Your PPDT response has been analyzed. Check your dashboard for results.",
        variant: "default"
      });

      setPhase('completed');
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit your response. Please try again.",
        variant: "destructive"
      });
      setPhase('writing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (phase === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading test image...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'analyzing') {
    return (
      <AnalysisLoadingScreen 
        testType="ppdt" 
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
                Viewing Phase
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
                    alt="PPDT Test Image" 
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                  />
                ) : (
                  <p className="text-gray-500">Image not available</p>
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
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <PenTool className="h-5 w-5 mr-2" />
                Writing Phase
              </CardTitle>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Words: {wordCount}
                </span>
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
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Write your story here..."
                className="min-h-96 text-base"
                autoFocus
                disabled={isSubmitting}
              />

              {timeLeft <= 30 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-semibold">
                    ⏰ Only {timeLeft} seconds remaining! Finish your story.
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Response will be analyzed by AI after submission
                </span>
                <Button 
                  onClick={handleSubmit} 
                  disabled={response.trim().length < 10 || isSubmitting}
                  className="min-w-[140px]"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Response'}
                </Button>
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
          <CardTitle>PPDT Test Completed!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <PenTool className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Test Successfully Submitted</h3>
            <p className="text-gray-600">
              Your response has been analyzed by our AI system.
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

export default PPDTTest;
