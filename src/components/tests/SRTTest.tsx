
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Users, Clock } from 'lucide-react';
import { TestContentService } from '@/services/testContentService';
import { testAnalysisService } from '@/services/testAnalysisService';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AnalysisLoadingScreen from '@/components/analysis/AnalysisLoadingScreen';
import { useToast } from '@/hooks/use-toast';

const SRTTest = () => {
  const { user, subscription } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [phase, setPhase] = useState<'loading' | 'active' | 'analyzing' | 'completed'>('loading');
  const [currentSituationIndex, setCurrentSituationIndex] = useState(0);
  const [situations, setSituations] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes total
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [canAnalyze, setCanAnalyze] = useState(true);
  
  const totalSituations = 60;
  const isPrivilegedUser = user?.primaryEmailAddress?.emailAddress === 'editkarde@gmail.com';
  const isPremium = isPrivilegedUser || subscription?.status === 'active';

  useEffect(() => {
    if (user) {
      initializeTest();
    }
  }, [user]);

  const initializeTest = async () => {
    try {
      // Check if user can get analysis
      const canGetFreeAnalysis = await testAnalysisService.canUserGetFreeAnalysis(user!.id);
      if (!canGetFreeAnalysis && !isPremium) {
        setCanAnalyze(false);
        toast({
          title: "Analysis Limit Reached",
          description: "You've used your 2 free analyses. Upgrade to Premium for unlimited access.",
          variant: "destructive"
        });
      }

      // Load situations and create session
      const fetchedSituations = await TestContentService.getRandomSRTSituations(60);
      if (fetchedSituations && fetchedSituations.length > 0) {
        setSituations(fetchedSituations);
        
        // Create test session
        const newSessionId = await testAnalysisService.createTestSession(
          user!.id, 
          'srt', 
          totalSituations
        );
        setSessionId(newSessionId);
        setPhase('active');
      } else {
        console.error('No SRT situations available');
        toast({
          title: "Error",
          description: "Unable to load test content. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error initializing test:', error);
      toast({
        title: "Error",
        description: "Failed to initialize test. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (phase === 'active') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTestCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = async () => {
    try {
      // Store current response
      const responseText = currentResponse || '';
      const newResponses = [...responses];
      newResponses[currentSituationIndex] = responseText;
      setResponses(newResponses);

      // Save response to database
      if (responseText.trim()) {
        await testAnalysisService.storeResponse(
          user!.id,
          sessionId,
          `situation_${currentSituationIndex + 1}`,
          responseText,
          30, // Time taken per situation (can be calculated more precisely)
          'srt'
        );
      }

      // Update session progress
      await testAnalysisService.updateTestSession(sessionId, currentSituationIndex + 1);

      setCurrentResponse('');
      
      if (currentSituationIndex < totalSituations - 1) {
        setCurrentSituationIndex(prev => prev + 1);
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
    try {
      // Save final response if exists
      if (currentResponse.trim()) {
        const finalResponses = [...responses];
        finalResponses[currentSituationIndex] = currentResponse;
        setResponses(finalResponses);

        await testAnalysisService.storeResponse(
          user!.id,
          sessionId,
          `situation_${currentSituationIndex + 1}`,
          currentResponse,
          30,
          'srt'
        );
      }

      // Mark session as completed
      await testAnalysisService.updateTestSession(
        sessionId, 
        Math.min(currentSituationIndex + 1, totalSituations), 
        'completed'
      );

      if (canAnalyze) {
        // Start analysis
        setPhase('analyzing');
        
        try {
          await testAnalysisService.analyzeTestSession(user!.id, sessionId, isPremium);
          
          toast({
            title: "Analysis Complete!",
            description: "Your SRT test has been analyzed successfully.",
          });

          // Navigate to results page (we'll create this next)
          navigate(`/test-results/${sessionId}`);
        } catch (error) {
          console.error('Analysis error:', error);
          toast({
            title: "Analysis Failed",
            description: "Test completed but analysis failed. You can retry from your dashboard.",
            variant: "destructive"
          });
          setPhase('completed');
        }
      } else {
        setPhase('completed');
      }
    } catch (error) {
      console.error('Error completing test:', error);
      toast({
        title: "Error",
        description: "Failed to complete test. Please try again.",
        variant: "destructive"
      });
    }
  };

  const currentSituation = situations[currentSituationIndex];

  if (phase === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading test situations...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'active') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                SRT Test - Situation {currentSituationIndex + 1} of {totalSituations}
              </CardTitle>
              <div className="flex items-center text-2xl font-bold text-orange-600">
                <Clock className="h-6 w-6 mr-2" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Situation:</h3>
                <p className="text-gray-800 leading-relaxed">
                  {currentSituation?.situation || 'Loading situation...'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Reaction:
                </label>
                <Textarea
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  placeholder="Write your immediate reaction and what you would do in this situation..."
                  className="min-h-32"
                  autoFocus
                />
              </div>

              {!canAnalyze && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-semibold">
                    ⚠️ You've reached your free analysis limit. Complete the test, but upgrade to Premium for AI feedback.
                  </p>
                </div>
              )}

              {timeLeft <= 300 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-semibold">
                    ⏰ Only {formatTime(timeLeft)} remaining for the entire test!
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Progress: {currentSituationIndex + 1}/{totalSituations} situations
                </span>
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleNext}>
                    Skip
                  </Button>
                  {currentSituationIndex === totalSituations - 1 ? (
                    <Button onClick={handleTestCompletion}>Finish Test</Button>
                  ) : (
                    <Button onClick={handleNext}>Next Situation</Button>
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
    <>
      <AnalysisLoadingScreen testType="SRT" isVisible={phase === 'analyzing'} />
      
      {phase === 'completed' && (
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>SRT Test Completed!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Test Successfully Submitted</h3>
                <p className="text-gray-600">
                  All {totalSituations} situation reactions have been completed and saved.
                </p>
                {!canAnalyze && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800">
                      Upgrade to Premium to get AI analysis of your responses and track your progress over time.
                    </p>
                  </div>
                )}
                <div className="flex justify-center space-x-4 mt-6">
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                  {!canAnalyze && (
                    <Button onClick={() => navigate('/subscription')}>
                      Upgrade to Premium
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default SRTTest;
