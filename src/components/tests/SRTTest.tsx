
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestContentService } from '@/services/testContentService';
import { testAnalysisService } from '@/services/testAnalysisService';
import { setupTestTables } from '@/services/databaseSetup';
import AnalysisLoadingScreen from '@/components/analysis/AnalysisLoadingScreen';
import TestTimer from '@/components/tests/TestTimer';
import { toast } from 'sonner';

const SRTTest = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [situations, setSituations] = useState<any[]>([]);
  const [responses, setResponses] = useState<{[key: number]: string}>({});
  const [currentSituationIndex, setCurrentSituationIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [isTestActive, setIsTestActive] = useState(false);

  useEffect(() => {
    initializeTest();
  }, [user]);

  const initializeTest = async () => {
    try {
      if (!user?.id) {
        console.error('No user ID found:', user);
        toast.error('Please log in to take the test');
        navigate('/');
        return;
      }

      console.log('Initializing SRT test for user:', user.id);
      
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

  const handleTestTimeUp = async () => {
    toast.warning('Time is up! Submitting your responses for analysis...');
    setTimeout(() => {
      handleTestCompletion();
    }, 2000);
  };

  const saveCurrentResponse = () => {
    if (currentResponse.trim()) {
      setResponses(prev => ({
        ...prev,
        [currentSituationIndex]: currentResponse.trim()
      }));
      setCurrentResponse('');
    }
  };

  const handleNext = () => {
    saveCurrentResponse();
    if (currentSituationIndex < situations.length - 1) {
      setCurrentSituationIndex(currentSituationIndex + 1);
    }
  };

  const handlePrevious = () => {
    saveCurrentResponse();
    if (currentSituationIndex > 0) {
      setCurrentSituationIndex(currentSituationIndex - 1);
      setCurrentResponse(responses[currentSituationIndex - 1] || '');
    }
  };

  const handleSubmitTest = () => {
    saveCurrentResponse();
    handleTestCompletion();
  };

  const handleTestCompletion = async () => {
    if (!user?.id || !sessionId) {
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
            user.id,
            sessionId,
            situations[i].id,
            responses[i],
            0, // Time taken per response not tracked in batch mode
            'srt'
          );
        }
      }

      const completedCount = Object.keys(responses).length;
      await testAnalysisService.updateTestSession(sessionId, completedCount, 'completed');

      const canGetFree = await testAnalysisService.canUserGetFreeAnalysis(user.id);
      const hasSubscription = await testAnalysisService.getUserSubscription(user.id);
      const isPremium = hasSubscription || !canGetFree;

      console.log(`Starting SRT batch analysis - Premium: ${isPremium}, Completed: ${completedCount}/${situations.length}`);

      // Send only answered situations for batch analysis
      await testAnalysisService.analyzeSRTBatch(user.id, sessionId, isPremium, answeredSituations, Object.values(responses));

      toast.success(`Test completed! Analyzed ${completedCount} responses successfully.`);
      
      setTimeout(() => {
        navigate(`/test-results/${sessionId}`);
      }, 2000);

    } catch (error) {
      console.error('Error completing test:', error);
      toast.error('Test completed but analysis failed. Please check your dashboard.');
      navigate('/dashboard');
    }
  };

  // Update current response when situation changes
  useEffect(() => {
    setCurrentResponse(responses[currentSituationIndex] || '');
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

            <div className="space-y-4">
              <Textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Write your response to this situation..."
                className="min-h-32"
                disabled={!isTestActive}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SRTTest;
