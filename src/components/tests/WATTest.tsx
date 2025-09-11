
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestContentService } from '@/services/testContentService';
import { testAnalysisService } from '@/services/testAnalysisService';
import { testLimitService } from '@/services/testLimitService';
import { setupTestTables } from '@/services/databaseSetup';
import AnalysisLoadingScreen from '@/components/analysis/AnalysisLoadingScreen';
import TestTimer from '@/components/tests/TestTimer';
import { toast } from 'sonner';

const WATTest = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState<any[]>([]);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

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
      console.log('Initializing WAT test for user:', userId);
      
      // Check database setup
      const dbSetup = await setupTestTables();
      console.log('Database setup result:', dbSetup);
      
      // Test database connection
      const testWords = await TestContentService.getRandomWATWords(60);
      console.log('Retrieved words:', testWords?.length || 0);
      
      if (!testWords || testWords.length === 0) {
        console.error('No WAT words retrieved from database');
        throw new Error('No WAT words found in database');
      }

      console.log('Creating test session...');
      const sessionId = await testAnalysisService.createTestSession(
        user.id,
        'wat',
        testWords.length
      );
      console.log('Session created:', sessionId);

      setWords(testWords);
      setSessionId(sessionId);
      setResponses(new Array(testWords.length).fill(''));
      setStartTime(Date.now());
      setIsLoading(false);
      
      toast.success(`WAT test initialized with ${testWords.length} words!`);
      console.log('WAT test initialized successfully with session:', sessionId);
      
    } catch (error) {
      console.error('Failed to initialize WAT test:', error);
      toast.error(`Test initialization failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleTimeUp = useCallback(() => {
    console.log('Timer finished for word:', currentWordIndex + 1);
    if (currentResponse.trim()) {
      handleNext();
    } else {
      toast.warning('Time is up! Moving to next word...');
      setTimeout(() => {
        handleNext(true); // Force next even without response
      }, 1000);
    }
  }, [currentResponse, currentWordIndex, words.length]);

  const handleNext = async (forceNext = false) => {
    if (!forceNext && !currentResponse.trim()) {
      toast.error('Please provide a response before continuing');
      return;
    }

    // Store response locally (don't send to AI yet)
    const newResponses = [...responses];
    newResponses[currentWordIndex] = currentResponse.trim() || 'No response provided';
    setResponses(newResponses);

    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setCurrentResponse('');
      setStartTime(Date.now());
    } else {
      await handleTestCompletion(newResponses);
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
      
      // Filter out only the responses we actually have (up to current index)
      const actualResponses = finalResponses.slice(0, currentWordIndex + 1);
      const actualWords = words.slice(0, currentWordIndex + 1);
      
      console.log(`Storing ${actualResponses.length} responses for analysis`);
      
      // Store all responses in database first
      for (let i = 0; i < actualResponses.length; i++) {
        if (actualResponses[i] && actualResponses[i] !== '') {
          console.log(`Storing response ${i + 1}: ${actualResponses[i]}`);
          await testAnalysisService.storeResponse(
            currentUserId,
            sessionId,
            actualWords[i].id,
            actualResponses[i],
            0, // Time taken per response not tracked in batch mode
            'wat'
          );
        }
      }

      await testAnalysisService.updateTestSession(sessionId, actualResponses.length, 'completed');

      const canGetFree = await testAnalysisService.canUserGetFreeAnalysis(currentUserId);
      const hasSubscription = await testAnalysisService.getUserSubscription(currentUserId);
      const isPremium = hasSubscription || !canGetFree;

      console.log(`Starting WAT batch analysis - Premium: ${isPremium}, Responses: ${actualResponses.length}`);

      // Send all responses for batch analysis
      await testAnalysisService.analyzeWATBatch(currentUserId, sessionId, isPremium, actualWords, actualResponses);

      // Decrement test count
      const decrementSuccess = await testLimitService.decrementTestLimit(currentUserId, 'wat');
      if (!decrementSuccess) {
        console.warn('Failed to decrement WAT test limit');
      }

      toast.success('Test completed and analyzed successfully!');
      
      setTimeout(() => {
        navigate(`/test-results/${sessionId}`);
      }, 2000);

    } catch (error) {
      console.error('Error completing test:', error);
      console.error('Error details:', error.message, error.stack);
      toast.error(`Test completion failed: ${error.message || 'Unknown error'}`);
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Initializing WAT Test...</p>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return <AnalysisLoadingScreen testType="wat" isVisible={isAnalyzing} />;
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <p className="text-lg text-red-600">No WAT words available. Please contact support.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentWord = words[currentWordIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              Word Association Test (WAT)
            </CardTitle>
            <p className="text-center text-gray-600">
              Word {currentWordIndex + 1} of {words.length}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <TestTimer 
              totalTime={15}
              isActive={true}
              onTimeUp={handleTimeUp}
              showWarning={true}
              key={`timer-${currentWordIndex}-${startTime}`} // More unique key to force reset
            />

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-blue-900 mb-2">Instructions:</p>
              <p className="text-blue-800">
                Write the first thought or sentence that comes to your mind when you see this word.
                You have 15 seconds per word. There are no right or wrong answers.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white p-8 rounded-lg border-2 border-blue-200 shadow-sm">
                <h2 className="text-4xl font-bold text-blue-900">
                  {currentWord.word}
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Write your immediate response..."
                className="text-lg p-4"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && currentResponse.trim()) {
                    handleNext();
                  }
                }}
                autoFocus
              />
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Progress: {currentWordIndex + 1}/{words.length}
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleNext()}
                    className="px-8"
                  >
                    {currentWordIndex === words.length - 1 ? 'Submit All Responses for Analysis' : 'Next'}
                  </Button>
                  {currentWordIndex >= 9 && (
                    <Button 
                      onClick={async () => {
                        const newResponses = [...responses];
                        newResponses[currentWordIndex] = currentResponse.trim() || 'No response provided';
                        await handleTestCompletion(newResponses);
                      }}
                      variant="outline"
                      className="px-6"
                    >
                      Submit Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WATTest;
