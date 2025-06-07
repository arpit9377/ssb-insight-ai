
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, Clock } from 'lucide-react';
import { TestContentService } from '@/services/testContentService';
import { testAnalysisService } from '@/services/testAnalysisService';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AnalysisLoadingScreen from '@/components/analysis/AnalysisLoadingScreen';
import { useToast } from '@/hooks/use-toast';

const WATTest = () => {
  const [phase, setPhase] = useState<'loading' | 'active' | 'analyzing' | 'completed'>('loading');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const totalWords = 60;

  useEffect(() => {
    loadRandomWords();
    initializeSession();
  }, []);

  const initializeSession = async () => {
    if (!user) return;
    
    try {
      const newSessionId = await testAnalysisService.createTestSession(
        user.id, 
        'wat', 
        totalWords
      );
      setSessionId(newSessionId);
      console.log('WAT session created:', newSessionId);
    } catch (error) {
      console.error('Error creating test session:', error);
      toast({
        title: "Error",
        description: "Failed to initialize test session. Please refresh and try again.",
        variant: "destructive"
      });
    }
  };

  const loadRandomWords = async () => {
    const fetchedWords = await TestContentService.getRandomWATWords(60);
    if (fetchedWords && fetchedWords.length > 0) {
      setWords(fetchedWords);
      setPhase('active');
    } else {
      console.error('No WAT words available');
      toast({
        title: "Error",
        description: "No test words available. Please contact support.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (phase === 'active') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoAdvance();
            return 15; // Reset for next word
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase, currentWordIndex, currentResponse, responses]);

  const handleAutoAdvance = async () => {
    try {
      // Save current response and move to next word
      const newResponses = [...responses];
      newResponses[currentWordIndex] = currentResponse || '';
      setResponses(newResponses);

      // Store response in database
      if (currentResponse.trim()) {
        await testAnalysisService.storeResponse(
          user!.id,
          sessionId,
          `word_${currentWordIndex + 1}`,
          currentResponse,
          15 - timeLeft, // Time taken
          'wat'
        );
      }

      // Update session progress
      await testAnalysisService.updateTestSession(sessionId, currentWordIndex + 1);

      setCurrentResponse('');
      
      if (currentWordIndex < totalWords - 1) {
        setCurrentWordIndex(prev => prev + 1);
        setTimeLeft(15); // 15 seconds for next word
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
      console.log('Completing WAT test');
      
      // Mark session as completed
      await testAnalysisService.updateTestSession(sessionId, totalWords, 'completed');

      // Check if user can get free analysis
      const canGetFree = await testAnalysisService.canUserGetFreeAnalysis(user.id);
      const isPremium = user.primaryEmailAddress?.emailAddress === 'editkarde@gmail.com' || !canGetFree;

      console.log('Analysis type:', isPremium ? 'Premium' : 'Free');

      // Analyze the complete session
      await testAnalysisService.analyzeTestSession(user.id, sessionId, isPremium);

      console.log('WAT analysis completed');
      
      toast({
        title: "Analysis Complete!",
        description: "Your WAT responses have been analyzed. Check your dashboard for results.",
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

  const handleNext = () => {
    handleAutoAdvance();
  };

  const currentWord = words[currentWordIndex];

  if (phase === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading test words...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'analyzing') {
    return (
      <AnalysisLoadingScreen 
        testType="wat" 
        isVisible={true}
      />
    );
  }

  if (phase === 'active') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                WAT Test - Word {currentWordIndex + 1} of {totalWords}
              </CardTitle>
              <div className="flex items-center text-2xl font-bold text-blue-600">
                <Clock className="h-6 w-6 mr-2" />
                {timeLeft}s
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-8">
              <div className="bg-blue-50 rounded-lg p-8">
                <h2 className="text-4xl font-bold text-blue-800 mb-4">
                  {currentWord?.word || 'Loading...'}
                </h2>
                <p className="text-gray-600">
                  Write the first meaningful thought that comes to mind
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <Input
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  placeholder="Your response..."
                  className="text-center text-lg"
                  autoFocus
                  disabled={isSubmitting}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleNext();
                    }
                  }}
                />
              </div>

              {timeLeft <= 5 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 font-semibold">
                    ⚠️ {timeLeft} seconds left!
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Progress: {currentWordIndex + 1}/{totalWords}
                </span>
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleNext} disabled={isSubmitting}>
                    Skip
                  </Button>
                  {currentWordIndex === totalWords - 1 ? (
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting ? 'Finishing...' : 'Finish Test'}
                    </Button>
                  ) : (
                    <Button onClick={handleNext} disabled={isSubmitting}>
                      Next Word
                    </Button>
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
          <CardTitle>WAT Test Completed!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Test Successfully Submitted</h3>
            <p className="text-gray-600">
              Your WAT responses have been analyzed by our AI system.
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

export default WATTest;
