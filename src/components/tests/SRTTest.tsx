import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestContentService } from '@/services/testContentService';
import { testAnalysisService } from '@/services/testAnalysisService';
import { setupTestTables } from '@/services/databaseSetup';
import AnalysisLoadingScreen from '@/components/analysis/AnalysisLoadingScreen';
import { toast } from 'sonner';

const SRTTest = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [currentSituationIndex, setCurrentSituationIndex] = useState(0);
  const [situations, setSituations] = useState<any[]>([]);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    initializeTest();
  }, [user]);

  const initializeTest = async () => {
    try {
      if (!user?.id) {
        toast.error('Please log in to take the test');
        navigate('/');
        return;
      }

      console.log('Initializing SRT test for user:', user.id);
      
      await setupTestTables();
      
      const testSituations = await TestContentService.getRandomSRTSituations(60);
      if (!testSituations || testSituations.length === 0) {
        throw new Error('No SRT situations found');
      }

      const sessionId = await testAnalysisService.createTestSession(
        user.id,
        'srt',
        testSituations.length
      );

      setSituations(testSituations);
      setSessionId(sessionId);
      setResponses(new Array(testSituations.length).fill(''));
      setStartTime(Date.now());
      setIsLoading(false);
      
      console.log('SRT test initialized successfully with session:', sessionId);
      
    } catch (error) {
      console.error('Failed to initialize SRT test:', error);
      toast.error('Failed to initialize the test. Please try again.');
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (!currentResponse.trim()) {
      toast.error('Please provide a response before continuing');
      return;
    }

    if (!user?.id || !sessionId) {
      toast.error('Missing required information. Please refresh and try again.');
      return;
    }

    try {
      const timeTaken = Date.now() - startTime;
      
      await testAnalysisService.storeResponse(
        user.id,
        sessionId,
        situations[currentSituationIndex].id,
        currentResponse.trim(),
        timeTaken,
        'srt'
      );

      const newResponses = [...responses];
      newResponses[currentSituationIndex] = currentResponse.trim();
      setResponses(newResponses);

      await testAnalysisService.updateTestSession(sessionId, currentSituationIndex + 1);

      if (currentSituationIndex < situations.length - 1) {
        setCurrentSituationIndex(currentSituationIndex + 1);
        setCurrentResponse('');
        setStartTime(Date.now());
      } else {
        await handleTestCompletion();
      }
    } catch (error) {
      console.error('Error saving response:', error);
      toast.error('Failed to save response. Please try again.');
    }
  };

  const handleTestCompletion = async () => {
    if (!user?.id || !sessionId) {
      toast.error('Missing required information');
      return;
    }

    try {
      setIsAnalyzing(true);
      
      await testAnalysisService.updateTestSession(sessionId, situations.length, 'completed');

      const canGetFree = await testAnalysisService.canUserGetFreeAnalysis(user.id);
      const hasSubscription = await testAnalysisService.getUserSubscription(user.id);
      const isPremium = hasSubscription || !canGetFree;

      console.log(`Starting analysis - Premium: ${isPremium}, Can get free: ${canGetFree}`);

      await testAnalysisService.analyzeTestSession(user.id, sessionId, isPremium);

      toast.success('Test completed and analyzed successfully!');
      
      // Navigate to results page instead of dashboard
      setTimeout(() => {
        navigate(`/test-results/${sessionId}`);
      }, 2000);

    } catch (error) {
      console.error('Error completing test:', error);
      toast.error('Test completed but analysis failed. Please check your dashboard.');
      navigate('/dashboard');
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              Situation Reaction Test (SRT)
            </CardTitle>
            <p className="text-center text-gray-600">
              Situation {currentSituationIndex + 1} of {situations.length}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-blue-900 mb-2">Instructions:</p>
              <p className="text-blue-800">
                Read the situation carefully and write what you would do in this situation.
                Be honest and write your immediate reaction.
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
              />
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Progress: {currentSituationIndex + 1}/{situations.length}
                </p>
                <Button 
                  onClick={handleNext}
                  disabled={!currentResponse.trim()}
                  className="px-8"
                >
                  {currentSituationIndex === situations.length - 1 ? 'Submit Test' : 'Next'}
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
