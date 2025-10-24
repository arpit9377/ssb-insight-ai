import React, { useState, useEffect } from 'react';
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
import { BatchImageUpload } from '@/components/tests/BatchImageUpload';
import { PreTestInstructions } from '@/components/tests/PreTestInstructions';
import TestTimer from '@/components/tests/TestTimer';
import { toast } from 'sonner';

const SRTTest = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [currentSituationIndex, setCurrentSituationIndex] = useState(0);
  const [situations, setSituations] = useState<any[]>([]);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  
  // New state for instructions and upload
  const [showInstructions, setShowInstructions] = useState(true);
  const [showUploadScreen, setShowUploadScreen] = useState(false);
  const MINIMUM_RESPONSES = 15;

  // Don't initialize test automatically - wait for user to click "Start Test"
  const handleStartTest = () => {
    setShowInstructions(false);
    if (user) {
      initializeTest();
    }
  };

  // Check if user can finish early
  const completedCount = responses.filter(r => r && r.trim()).length;
  const canFinishEarly = completedCount >= MINIMUM_RESPONSES;

  const initializeTest = async () => {
    try {
      console.log('Initializing SRT test...');
      await setupTestTables();

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
      setResponses(new Array(testSituations.length).fill(''));
      setStartTime(Date.now());
      setIsLoading(false);
      
      toast.success(`SRT test initialized with ${testSituations.length} situations!`);
      console.log('SRT test initialized successfully with session:', sessionId);
      
    } catch (error) {
      console.error('Failed to initialize SRT test:', error);
      toast.error(`Test initialization failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleNext = async (forceNext = false) => {
    if (!forceNext && !currentResponse.trim()) {
      toast.error('Please provide a response before continuing');
      return;
    }

    // Store response locally
    const newResponses = [...responses];
    newResponses[currentSituationIndex] = currentResponse.trim() || 'No response provided';
    setResponses(newResponses);

    if (currentSituationIndex < situations.length - 1) {
      setCurrentSituationIndex(currentSituationIndex + 1);
      setCurrentResponse('');
      setStartTime(Date.now());
    } else {
      // Test completed - show upload option
      setShowUploadScreen(true);
    }
  };

  const handleFinishEarly = () => {
    if (completedCount < MINIMUM_RESPONSES) {
      toast.error(`Minimum ${MINIMUM_RESPONSES} responses required`);
      return;
    }
    setShowUploadScreen(true);
  };

  const handleUploadComplete = async (imageUrls: string[]) => {
    const currentUserId = user?.id;
    if (!currentUserId || !sessionId) {
      toast.error('Missing required information');
      return;
    }

    try {
      setIsAnalyzing(true);
      setShowUploadScreen(false);
      
      // Store all typed responses (images are just for reference/verification)
      for (let i = 0; i < responses.length; i++) {
        if (responses[i]) {
          // Store the actual typed response text, not JSON
          await testAnalysisService.storeResponse(
            user.id,
            sessionId,
            situations[i].id,
            responses[i], // Store plain text response
            0,
            'srt'
          );
        }
      }
      
      // Store image URLs as metadata for reference
      console.log('Uploaded images for verification:', imageUrls);

      await completeAnalysis();
    } catch (error) {
      console.error('Error processing uploaded images:', error);
      toast.error('Failed to process images. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const handleSkipUpload = async () => {
    const currentUserId = user?.id;
    if (!currentUserId || !sessionId) {
      toast.error('Missing required information');
      return;
    }

    try {
      setIsAnalyzing(true);
      setShowUploadScreen(false);
      
      // Store all typed responses
      for (let i = 0; i < responses.length; i++) {
        if (responses[i]) {
          await testAnalysisService.storeResponse(
            user.id,
            sessionId,
            situations[i].id,
            responses[i],
            0,
            'srt'
          );
        }
      }

      await completeAnalysis();
    } catch (error) {
      console.error('Error completing test:', error);
      toast.error('Failed to complete test. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const completeAnalysis = async () => {
    const currentUserId = user?.id;
    if (!currentUserId || !sessionId) return;

    try {
      const completedResponses = responses.filter(r => r && r.trim());
      await testAnalysisService.updateTestSession(sessionId, completedResponses.length, 'completed', user.id);

      const canGetFree = await testAnalysisService.canUserGetFreeAnalysis(user.id);
      const hasSubscription = await testAnalysisService.getUserSubscription(user.id);
      const isPremium = hasSubscription || !canGetFree;

      console.log(`Starting batch analysis - Premium: ${isPremium}`);

      // Get stored responses from database
      const { data: storedResponses } = await supabase
        .from('user_responses')
        .select('response_text')
        .eq('test_session_id', sessionId)
        .order('created_at', { ascending: true });

      const finalResponses = storedResponses?.map(r => r.response_text) || responses.filter(r => r);

      // Send all responses for batch analysis
      await testAnalysisService.analyzeSRTBatch(user.id, sessionId, isPremium, situations, finalResponses);

      // Decrement test count
      const decrementSuccess = await testLimitService.decrementTestLimit(user.id, 'srt');
      if (!decrementSuccess) {
        console.warn('Failed to decrement SRT test limit');
      }

      toast.success('Test completed and analyzed successfully!');
      
      setTimeout(() => {
        navigate(`/test-results/${sessionId}`);
      }, 2000);

    } catch (error) {
      console.error('Error completing SRT test:', error);
      toast.error(`SRT test completion failed: ${error.message || 'Unknown error'}`);
      navigate('/dashboard');
    }
  };

  // Show instructions first
  if (showInstructions) {
    return (
      <PreTestInstructions
        testType="srt"
        onStart={handleStartTest}
        onCancel={() => navigate('/dashboard')}
      />
    );
  }

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

  if (showUploadScreen) {
    return (
      <BatchImageUpload
        testType="srt"
        totalSlots={3}
        allowDynamicSlots={true}
        minSlots={1}
        maxSlots={5}
        slotLabels={['Sheet 1', 'Sheet 2', 'Sheet 3']}
        onUploadComplete={handleUploadComplete}
        onSkip={handleSkipUpload}
        allowSkip={true}
      />
    );
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
            {/* Timer - 30 minutes total for entire test */}
            <TestTimer 
              totalTime={1800}
              isActive={true}
              onTimeUp={() => {
                toast.warning('Time is up! Submitting your responses...');
                setTimeout(() => setShowUploadScreen(true), 1000);
              }}
              label="Total time remaining"
            />

            {/* Current Situation Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-blue-600 mb-2 font-semibold">Situation:</p>
              <p className="text-lg text-blue-900">{currentSituation.situation}</p>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                💡 <strong>Tip:</strong> Describe what action you would take. Be practical and show leadership. Type here OR write on paper and upload all sheets at the end.
              </p>
            </div>

            {/* Response Input */}
            <div className="space-y-4">
              <Textarea
                placeholder="What would you do in this situation?"
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                className="min-h-[120px] text-base"
                autoFocus
              />

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleNext()}
                  disabled={!currentResponse.trim()}
                  className="flex-1"
                >
                  {currentSituationIndex < situations.length - 1 ? 'Next Situation' : 'Complete Test'}
                </Button>
                
                {canFinishEarly && currentSituationIndex < situations.length - 1 && (
                  <Button
                    variant="outline"
                    onClick={handleFinishEarly}
                  >
                    Finish Test ({completedCount} responses)
                  </Button>
                )}
              </div>

              {/* Progress Info */}
              <div className="text-center text-sm text-gray-600">
                <p>Completed: {completedCount} / {situations.length}</p>
                {completedCount >= MINIMUM_RESPONSES && (
                  <p className="text-green-600 font-medium">
                    ✓ Minimum {MINIMUM_RESPONSES} responses met - You can finish early
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SRTTest;
