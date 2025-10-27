import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Feature flag: Set to true to enable image upload, false for typing interface
const USE_IMAGE_UPLOAD = false;

const WATTest = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState<any[]>([]);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  
  // New state for instructions and upload
  const [showInstructions, setShowInstructions] = useState(true);
  const [showUploadScreen, setShowUploadScreen] = useState(false);
  const [showTypingScreen, setShowTypingScreen] = useState(false);
  const [inputMethod, setInputMethod] = useState<'typed' | 'handwritten'>('typed');
  const [typedResponses, setTypedResponses] = useState<string[]>([]);
  const MINIMUM_RESPONSES = 20;

  // Don't initialize test automatically - wait for user to click "Start Test"
  const handleStartTest = (method: 'typed' | 'handwritten') => {
    setInputMethod(method);
    setShowInstructions(false);
    
    // Initialize test for both methods
    if (user) {
      initializeTest();
    }
  };

  // Check if user can finish early
  const completedCount = responses.filter(r => r && r.trim()).length;
  const canFinishEarly = completedCount >= MINIMUM_RESPONSES;

  const initializeTest = async () => {
    try {
      console.log('Initializing WAT test...');
      await setupTestTables();

      const testWords = await TestContentService.getRandomWATWords(60);
      console.log('Retrieved WAT words:', testWords?.length || 0);
      
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

  const handleTimeUp = () => {
    if (inputMethod === 'handwritten') {
      // Auto-advance for handwritten mode
      handleNext(true);
    } else {
      // Typed mode - check if response exists
      if (currentResponse.trim()) {
        handleNext();
      } else {
        toast.warning('Time is up! Moving to next word...');
        setTimeout(() => {
          handleNext(true);
        }, 1000);
      }
    }
  };

  const handleNext = async (forceNext = false) => {
    // For typed mode, validate response
    if (inputMethod === 'typed' && !forceNext && !currentResponse.trim()) {
      toast.error('Please provide a response before continuing');
      return;
    }

    // Store response locally (only for typed mode)
    if (inputMethod === 'typed') {
      const newResponses = [...responses];
      newResponses[currentWordIndex] = currentResponse.trim() || 'No response provided';
      setResponses(newResponses);
    }

    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setCurrentResponse('');
      setStartTime(Date.now());
    } else {
      // Test completed - show typing or upload screen based on feature flag
      handleTestCompletion();
    }
  };

  const handleTestCompletion = async () => {
    if (inputMethod === 'typed') {
      // User typed during test - save responses to DB then analyze
      await saveTypedResponsesAndAnalyze();
    } else if (USE_IMAGE_UPLOAD && inputMethod === 'handwritten') {
      setShowUploadScreen(true);
    } else {
      // Handwritten mode - show typing screen
      const attemptedCount = currentWordIndex + 1;
      setTypedResponses(new Array(attemptedCount).fill(''));
      setShowTypingScreen(true);
    }
  };

  const saveTypedResponsesAndAnalyze = async () => {
    const currentUserId = user?.id;
    if (!currentUserId || !sessionId) {
      toast.error('Missing required information');
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // Build complete responses array including current response
      const completeResponses = [...responses];
      if (currentResponse.trim()) {
        completeResponses[currentWordIndex] = currentResponse.trim();
      }
      
      // Store all typed responses that were entered during the test
      const attemptedCount = currentWordIndex + 1;
      for (let i = 0; i < attemptedCount; i++) {
        if (completeResponses[i]) {
          await testAnalysisService.storeResponse(
            user.id,
            sessionId,
            words[i].id,
            completeResponses[i],
            0,
            'wat'
          );
        }
      }

      await completeAnalysis();
    } catch (error) {
      console.error('Error saving typed responses:', error);
      toast.error('Failed to save responses. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const handleFinishEarly = () => {
    if (currentWordIndex === 0 && !currentResponse.trim()) {
      toast.error('Please complete at least one word before finishing');
      return;
    }
    // Save current response if exists (for handwritten mode)
    if (inputMethod === 'handwritten' && currentResponse.trim()) {
      const newResponses = [...responses];
      newResponses[currentWordIndex] = currentResponse.trim();
      setResponses(newResponses);
    }
    handleTestCompletion();
  };


  const handleTypedSubmit = async () => {
    const currentUserId = user?.id;
    if (!currentUserId || !sessionId) {
      toast.error('Missing required information');
      return;
    }

    // Validate that all responses are filled
    const emptyResponses = typedResponses.filter(r => !r.trim());
    if (emptyResponses.length > 0) {
      toast.error(`Please fill in all ${emptyResponses.length} remaining responses`);
      return;
    }

    try {
      setIsAnalyzing(true);
      setShowTypingScreen(false);
      
      // Store all typed responses (only attempted ones)
      const attemptedCount = currentWordIndex + 1;
      for (let i = 0; i < attemptedCount; i++) {
        await testAnalysisService.storeResponse(
          user.id,
          sessionId,
          words[i].id,
          typedResponses[i],
          0,
          'wat'
        );
      }

      await completeAnalysis();
    } catch (error) {
      console.error('Error completing test:', error);
      toast.error('Failed to complete test. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const handleHandwrittenUpload = async (imageUrls: string[]) => {
    const currentUserId = user?.id;
    if (!currentUserId || !sessionId) {
      toast.error('Missing required information');
      return;
    }

    try {
      setIsAnalyzing(true);
      setShowUploadScreen(false);
      
      toast.info('Extracting text from images... This may take a moment.');
      
      // Import Tesseract.js dynamically
      const Tesseract = (await import('tesseract.js')).default;
      
      const extractedResponses: string[] = [];
      
      // Process each uploaded image
      for (let i = 0; i < imageUrls.length; i++) {
        try {
          console.log(`Processing image ${i + 1}/${imageUrls.length}...`);
          
          // Perform OCR on the image
          const result = await Tesseract.recognize(
            imageUrls[i],
            'eng',
            {
              logger: (m) => {
                if (m.status === 'recognizing text') {
                  console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
              }
            }
          );
          
          // Extract text and split by lines
          const text = result.data.text;
          const lines = text.split('\n').filter(line => line.trim().length > 0);
          
          console.log(`Extracted ${lines.length} lines from image ${i + 1}`);
          
          // Add each line as a response
          lines.forEach(line => {
            const cleaned = line.trim();
            if (cleaned && cleaned.length > 1) {
              extractedResponses.push(cleaned);
            }
          });
          
        } catch (error) {
          console.error(`Error processing image ${i + 1}:`, error);
          toast.error(`Failed to extract text from image ${i + 1}`);
        }
      }
      
      console.log(`Total extracted responses: ${extractedResponses.length}`);
      console.log('Extracted responses:', extractedResponses);
      
      if (extractedResponses.length === 0) {
        toast.error('No text could be extracted from the images. Please ensure handwriting is clear.');
        setIsAnalyzing(false);
        setShowUploadScreen(true);
        return;
      }
      
      // Store extracted responses
      const storePromises = [];
      const responsesToStore = Math.min(extractedResponses.length, words.length);
      
      for (let i = 0; i < responsesToStore; i++) {
        console.log(`Storing response ${i + 1}: "${extractedResponses[i]}" for word: "${words[i].word}"`);
        storePromises.push(
          testAnalysisService.storeResponse(
            user.id,
            sessionId,
            words[i].id,
            extractedResponses[i],
            0,
            'wat'
          )
        );
      }
      
      await Promise.all(storePromises);
      console.log(`Successfully stored ${storePromises.length} extracted responses`);
      
      toast.success(`Extracted and stored ${storePromises.length} responses!`);
      
      await completeAnalysis();
    } catch (error) {
      console.error('Error processing handwritten responses:', error);
      toast.error('Failed to process handwritten responses. Please try again.');
      setIsAnalyzing(false);
    }
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
      console.log('Storing responses for analysis...');
      console.log('Total responses:', responses.length);
      console.log('Total words:', words.length);
      
      const storePromises = [];
      for (let i = 0; i < responses.length; i++) {
        if (responses[i] && responses[i].trim()) {
          console.log(`Storing response ${i + 1}: "${responses[i]}" for word: "${words[i].word}"`);
          storePromises.push(
            testAnalysisService.storeResponse(
              user.id,
              sessionId,
              words[i].id,
              responses[i].trim(), // Store plain text response
              0,
              'wat'
            )
          );
        }
      }
      
      // Wait for all responses to be stored
      await Promise.all(storePromises);
      console.log(`Successfully stored ${storePromises.length} responses`);
      
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
      console.log('Storing responses (skipped upload)...');
      console.log('Total responses:', responses.length);
      
      const storePromises = [];
      for (let i = 0; i < responses.length; i++) {
        if (responses[i] && responses[i].trim()) {
          console.log(`Storing response ${i + 1}: "${responses[i]}" for word: "${words[i].word}"`);
          storePromises.push(
            testAnalysisService.storeResponse(
              user.id,
              sessionId,
              words[i].id,
              responses[i].trim(),
              0,
              'wat'
            )
          );
        }
      }
      
      // Wait for all responses to be stored
      await Promise.all(storePromises);
      console.log(`Successfully stored ${storePromises.length} responses`);

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
      console.log('Fetching stored responses from database...');
      const { data: storedResponses, error: fetchError } = await supabase
        .from('user_responses')
        .select('response_text')
        .eq('test_session_id', sessionId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error fetching responses:', fetchError);
      }
      
      console.log('Stored responses from DB:', storedResponses);
      console.log('Number of stored responses:', storedResponses?.length || 0);
      
      const finalResponses = storedResponses?.map(r => r.response_text) || responses.filter(r => r);
      console.log('Final responses for analysis:', finalResponses);
      console.log('Number of final responses:', finalResponses.length);

      // Only analyze attempted words (match array lengths)
      const attemptedWords = words.slice(0, finalResponses.length);
      console.log(`Analyzing ${finalResponses.length} attempted words out of ${words.length} total`);

      // Send all responses for batch analysis
      await testAnalysisService.analyzeWATBatch(user.id, sessionId, isPremium, attemptedWords, finalResponses);

      // Decrement test count
      const decrementSuccess = await testLimitService.decrementTestLimit(user.id, 'wat');
      if (!decrementSuccess) {
        console.warn('Failed to decrement WAT test limit');
      }

      toast.success('Test completed and analyzed successfully!');
      
      setTimeout(() => {
        navigate(`/test-results/${sessionId}`);
      }, 2000);

    } catch (error) {
      console.error('Error completing WAT test:', error);
      toast.error(`WAT test completion failed: ${error.message || 'Unknown error'}`);
      navigate('/dashboard');
    }
  };

  // Show instructions first
  if (showInstructions) {
    return (
      <PreTestInstructions
        testType="wat"
        onStart={handleStartTest}
        onCancel={() => navigate('/dashboard')}
      />
    );
  }

  // Show typing screen for post-test response entry
  if (showTypingScreen) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Type Your WAT Responses</CardTitle>
              <p className="text-center text-gray-600">
                Please type the responses you wrote on paper during the test
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  📝 <strong>Instructions:</strong> Type each response exactly as you wrote it on paper. 
                  This helps us provide accurate AI analysis of your word associations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {words.slice(0, currentWordIndex + 1).map((word, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                        <span className="font-semibold text-lg">{word.word}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        typedResponses[index]?.trim() ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {typedResponses[index]?.trim() ? '✓' : '○'}
                      </span>
                    </div>
                    <Input
                      placeholder="Your response..."
                      value={typedResponses[index] || ''}
                      onChange={(e) => {
                        const newTypedResponses = [...typedResponses];
                        newTypedResponses[index] = e.target.value;
                        setTypedResponses(newTypedResponses);
                      }}
                      className="text-base"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-6 border-t">
                <div className="text-sm text-gray-600">
                  {typedResponses.filter(r => r?.trim()).length} of {currentWordIndex + 1} responses completed
                </div>
                <Button 
                  onClick={handleTypedSubmit}
                  disabled={typedResponses.filter(r => r?.trim()).length !== (currentWordIndex + 1)}
                  size="lg"
                >
                  Submit for Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // For handwritten method, show upload screen after viewing words
  if (showUploadScreen) {
    return (
      <BatchImageUpload
        testType="wat"
        allowDynamicSlots={true}
        totalSlots={3}
        minSlots={1}
        maxSlots={5}
        slotLabels={['Sheet 1', 'Sheet 2', 'Sheet 3']}
        onUploadComplete={inputMethod === 'handwritten' ? handleHandwrittenUpload : handleUploadComplete}
        onSkip={inputMethod === 'typed' ? handleSkipUpload : () => {
          toast.error('You must upload images for handwritten responses');
        }}
        allowSkip={inputMethod === 'typed'}
      />
    );
  }

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

  if (showUploadScreen) {
    return (
      <BatchImageUpload
        testType="wat"
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

  // Both modes: Show one word at a time
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              Word Association Test (WAT)
            </CardTitle>
            <p className="text-center text-gray-600">
              Word {currentWordIndex + 1} of {words.length}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Timer */}
            <TestTimer 
              key={currentWordIndex}
              totalTime={15}
              isActive={true}
              onTimeUp={handleTimeUp}
              label="Time per word"
            />

            {/* Current Word Display */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
              <p className="text-sm text-blue-600 mb-2">Word:</p>
              <p className="text-4xl font-bold text-blue-900">{currentWord.word}</p>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                💡 <strong>Tip:</strong> {inputMethod === 'typed' 
                  ? 'Write your first spontaneous thought and type it below.'
                  : 'Write your response on paper. The word will change automatically after 15 seconds.'}
              </p>
            </div>

            {/* Response Input - Only show for typed mode */}
            {inputMethod === 'typed' && (
              <div className="space-y-4">
                <Input
                  placeholder="Your immediate response..."
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && currentResponse.trim()) {
                      handleNext();
                    }
                  }}
                  className="text-lg p-6"
                  autoFocus
                />
              </div>
            )}

            {/* Handwritten mode message */}
            {inputMethod === 'handwritten' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-800">
                  ✍️ Write this word and your response on paper. The next word will appear automatically.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {inputMethod === 'typed' ? (
                <>
                  <Button 
                    onClick={() => handleNext()}
                    disabled={!currentResponse.trim()}
                    className="flex-1"
                  >
                    Next Word
                  </Button>
                  
                  {currentWordIndex > 0 && (
                    <Button
                      onClick={handleFinishEarly}
                      variant="outline"
                      className="flex-1 border-green-500 text-green-700 hover:bg-green-50"
                    >
                      Finish Test ({completedCount} responses)
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {/* Handwritten mode buttons */}
                  {currentWordIndex > 0 && (
                    <Button
                      onClick={handleFinishEarly}
                      variant="outline"
                      className="flex-1 border-green-500 text-green-700 hover:bg-green-50"
                    >
                      Finish Early ({currentWordIndex + 1} words)
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Progress Info */}
            <div className="text-center text-sm text-gray-600">
              <p>Words viewed: {currentWordIndex + 1} / {words.length}</p>
              {inputMethod === 'typed' && (
                <p>Responses typed: {completedCount}</p>
              )}
              {currentWordIndex + 1 >= MINIMUM_RESPONSES && (
                <p className="text-green-600 font-medium">
                  ✓ Minimum {MINIMUM_RESPONSES} words viewed - You can finish
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WATTest;
