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

// Feature flag: Set to true to enable image upload, false for typing interface
const USE_IMAGE_UPLOAD = false;

const TATTest = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<any[]>([]);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [viewingTime, setViewingTime] = useState(30);
  const [canRespond, setCanRespond] = useState(false);
  const [isWritingPhase, setIsWritingPhase] = useState(false);
  
  // New state for post-test upload and instructions
  const [showInstructions, setShowInstructions] = useState(true);
  const [showUploadScreen, setShowUploadScreen] = useState(false);
  const [showTypingScreen, setShowTypingScreen] = useState(false);
  const [useHandwrittenResponses, setUseHandwrittenResponses] = useState(false);
  const [typedResponses, setTypedResponses] = useState<string[]>([]);
  const [inputMethod, setInputMethod] = useState<'typed' | 'handwritten'>('handwritten');

  // Don't initialize test automatically - wait for user to click "Start Test"
  const handleStartTest = (method: 'typed' | 'handwritten') => {
    setInputMethod(method);
    setShowInstructions(false);
    if (user) {
      initializeTest();
    }
  };

  // Timer for viewing phase (30 seconds)
  useEffect(() => {
    const currentImage = images[currentImageIndex];
    const isBlankSlide = currentImage?.id === 'blank-slide';
    
    if (!isWritingPhase && viewingTime > 0 && !isBlankSlide) {
      const timer = setTimeout(() => {
        setViewingTime(viewingTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!isWritingPhase && (viewingTime === 0 || isBlankSlide)) {
      setCanRespond(true);
      setIsWritingPhase(true);
    }
  }, [viewingTime, isWritingPhase, currentImageIndex, images]);

  // Reset timers when moving to next image
  useEffect(() => {
    const currentImage = images[currentImageIndex];
    const isBlankSlide = currentImage?.id === 'blank-slide';
    
    setViewingTime(30);
    setCanRespond(isBlankSlide);
    setIsWritingPhase(isBlankSlide);
  }, [currentImageIndex, images]);

  const initializeTest = async () => {
    try {
      console.log('Initializing TAT test...');
      await setupTestTables();

      const testImages = await TestContentService.getRandomTATImages(12);
      console.log('Retrieved TAT images:', testImages?.length || 0);
      
      if (!testImages || testImages.length === 0) {
        console.error('No TAT images retrieved from database');
        throw new Error('No TAT images found in database');
      }

      const blankSlide = {
        id: 'blank-slide',
        image_url: '',
        prompt: 'This is a blank slide. Write a story of your own choice based on your imagination.',
        test_type: 'tat'
      };
      
      const allImages = [...testImages, blankSlide];
      console.log('Total images including blank slide:', allImages.length);

      console.log('Creating test session...');
      const sessionId = await testAnalysisService.createTestSession(
        user.id,
        'tat',
        allImages.length
      );
      console.log('Session created:', sessionId);

      setImages(allImages);
      setSessionId(sessionId);
      setResponses(new Array(allImages.length).fill(''));
      setStartTime(Date.now());
      setIsLoading(false);
      
      toast.success(`TAT test initialized with ${allImages.length} images!`);
      console.log('TAT test initialized successfully with session:', sessionId);
      
    } catch (error) {
      console.error('Failed to initialize TAT test:', error);
      toast.error(`Test initialization failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleWritingTimeUp = () => {
    // Timer is just informational - user can proceed anytime
    toast.info('Writing time is up, but you can continue or move to next image');
  };

  const handleNext = async (forceNext = false) => {
    // Only require typed response if user selected 'typed' mode
    if (!forceNext && inputMethod === 'typed' && !currentResponse.trim()) {
      toast.error('Please provide a response before continuing');
      return;
    }

    // Store response locally (don't upload yet)
    const newResponses = [...responses];
    newResponses[currentImageIndex] = currentResponse.trim() || 'No response provided';
    setResponses(newResponses);

    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
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
    } else if (USE_IMAGE_UPLOAD) {
      setShowUploadScreen(true);
    } else {
      // Handwritten mode - show typing screen
      const attemptedCount = currentImageIndex + 1;
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
        completeResponses[currentImageIndex] = currentResponse.trim();
      }
      
      // Store all typed responses that were entered during the test
      const attemptedCount = currentImageIndex + 1;
      for (let i = 0; i < attemptedCount; i++) {
        if (completeResponses[i]) {
          await testAnalysisService.storeResponse(
            user.id,
            sessionId,
            images[i].id,
            completeResponses[i],
            0,
            'tat'
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
    // Only check for typed response if user selected 'typed' mode
    if (inputMethod === 'typed' && currentImageIndex === 0 && !currentResponse.trim()) {
      toast.error('Please complete at least one story before finishing');
      return;
    }
    // Save current response if exists (for handwritten mode)
    if (inputMethod === 'handwritten' && currentResponse.trim()) {
      const newResponses = [...responses];
      newResponses[currentImageIndex] = currentResponse.trim();
      setResponses(newResponses);
    }
    handleTestCompletion();
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
      
      // Store all responses with uploaded images
      for (let i = 0; i < images.length; i++) {
        const responseData = JSON.stringify({ 
          mode: 'uploaded', 
          imageUrl: imageUrls[i],
          typedResponse: responses[i] // Keep typed response as backup
        });
        
        await testAnalysisService.storeResponse(
          user.id,
          sessionId,
          images[i].id,
          responseData,
          0,
          'tat'
        );
      }

      await completeAnalysis();
    } catch (error) {
      console.error('Error processing uploaded images:', error);
      toast.error('Failed to process images. Please try again.');
      setIsAnalyzing(false);
    }
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
      const attemptedCount = currentImageIndex + 1;
      for (let i = 0; i < attemptedCount; i++) {
        await testAnalysisService.storeResponse(
          user.id,
          sessionId,
          images[i].id,
          typedResponses[i],
          0,
          'tat'
        );
      }

      await completeAnalysis();
    } catch (error) {
      console.error('Error completing test:', error);
      toast.error('Failed to complete test. Please try again.');
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
      for (let i = 0; i < images.length; i++) {
        await testAnalysisService.storeResponse(
          user.id,
          sessionId,
          images[i].id,
          responses[i],
          0,
          'tat'
        );
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
      await testAnalysisService.updateTestSession(sessionId, images.length, 'completed', user.id);

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

      const finalResponses = storedResponses?.map(r => r.response_text) || responses;

      // Only analyze attempted images (match array lengths)
      const attemptedImages = images.slice(0, finalResponses.length);
      console.log(`Analyzing ${finalResponses.length} attempted images out of ${images.length} total`);
      
      // Send all responses for batch analysis
      await testAnalysisService.analyzeTATSession(user.id, sessionId, isPremium, attemptedImages, finalResponses);

      // Decrement test count
      const decrementSuccess = await testLimitService.decrementTestLimit(user.id, 'tat');
      if (!decrementSuccess) {
        console.warn('Failed to decrement TAT test limit');
      }

      toast.success('Test completed and analyzed successfully!');
      
      setTimeout(() => {
        navigate(`/test-results/${sessionId}`);
      }, 2000);

    } catch (error) {
      console.error('Error completing TAT test:', error);
      toast.error(`TAT test completion failed: ${error.message || 'Unknown error'}`);
      navigate('/dashboard');
    }
  };

  // Show instructions first
  if (showInstructions) {
    return (
      <PreTestInstructions
        testType="tat"
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
          <p className="mt-4 text-lg">Initializing TAT Test...</p>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return <AnalysisLoadingScreen testType="tat" isVisible={isAnalyzing} />;
  }

  // Show typing screen for post-test response entry
  if (showTypingScreen) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Type Your TAT Stories</CardTitle>
              <p className="text-center text-gray-600">
                Please type the stories you wrote on paper during the test
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  📝 <strong>Instructions:</strong> Type each story exactly as you wrote it on paper. 
                  This helps us provide accurate AI analysis of your responses.
                </p>
              </div>

              {images.slice(0, currentImageIndex + 1).map((image, index) => (
                <div key={index} className="space-y-2 pb-6 border-b last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        Story {index + 1} {image.id === 'blank-slide' && '(Blank Slide)'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{image.prompt}</p>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded ${
                      typedResponses[index]?.trim() ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {typedResponses[index]?.trim() ? '✓ Done' : 'Pending'}
                    </span>
                  </div>
                  <Textarea
                    placeholder={`Type your story for ${image.id === 'blank-slide' ? 'blank slide' : `image ${index + 1}`}...`}
                    value={typedResponses[index] || ''}
                    onChange={(e) => {
                      const newTypedResponses = [...typedResponses];
                      newTypedResponses[index] = e.target.value;
                      setTypedResponses(newTypedResponses);
                    }}
                    className="min-h-[150px] text-base"
                  />
                  <span className="text-xs text-gray-500">
                    {typedResponses[index]?.length || 0} characters
                  </span>
                </div>
              ))}

              <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-gray-600">
                  {typedResponses.filter(r => r?.trim()).length} of {currentImageIndex + 1} stories completed
                </div>
                <Button 
                  onClick={handleTypedSubmit}
                  disabled={typedResponses.filter(r => r?.trim()).length !== (currentImageIndex + 1)}
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

  if (showUploadScreen) {
    return (
      <BatchImageUpload
        testType="tat"
        totalSlots={images.length}
        slotLabels={images.map((_, i) => `Story ${i + 1}`)}
        onUploadComplete={handleUploadComplete}
        onSkip={handleSkipUpload}
        allowSkip={true}
      />
    );
  }

  if (images.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <p className="text-lg text-red-600">No TAT images available. Please contact support.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];
  const isBlankSlide = currentImage?.id === 'blank-slide';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              Thematic Apperception Test (TAT)
            </CardTitle>
            <p className="text-center text-gray-600">
              {isBlankSlide ? 'Blank Slide' : `Image ${currentImageIndex + 1}`} of {images.length}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Viewing Phase Timer */}
            {!canRespond && !isBlankSlide && (
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">View the image carefully</p>
                <div className="text-4xl font-bold text-blue-600">{viewingTime}s</div>
                <p className="text-sm text-gray-600">Writing will begin after viewing time</p>
              </div>
            )}

            {/* Image Display - Only show during viewing phase */}
            {!isBlankSlide && currentImage?.image_url && !canRespond && (
              <div className="flex justify-center">
                <img 
                  src={currentImage.image_url} 
                  alt={`TAT Image ${currentImageIndex + 1}`}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            )}

            {/* Blank Slide Message */}
            {isBlankSlide && (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <p className="text-xl font-semibold text-gray-700">Blank Slide</p>
                <p className="text-gray-600 mt-2">Write a story based on your imagination</p>
              </div>
            )}

            {/* Prompt */}
            {canRespond && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900">{currentImage.prompt}</p>
              </div>
            )}

            {/* Writing Phase */}
            {canRespond && (
              <>
                <TestTimer 
                  totalTime={240}
                  isActive={true}
                  onTimeUp={handleWritingTimeUp}
                  label="Writing Time (informational only)"
                />

                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Tip:</strong> {inputMethod === 'typed'
                        ? 'Write your story directly here. Be creative and descriptive.'
                        : 'Write your story on paper. After completing all stories, you will type them for AI analysis.'}
                    </p>
                  </div>

                  <Textarea
                    placeholder={inputMethod === 'typed'
                      ? "Write your story here..."
                      : "Write your story on paper (you'll type it after the test)"}
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    className="min-h-[300px] text-base"
                    disabled={inputMethod === 'handwritten'}
                    autoFocus={inputMethod === 'typed'}
                  />

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {inputMethod === 'typed' ? `${currentResponse.length} characters` : 'Write on paper'}
                    </span>
                    <div className="flex gap-2">
                      {currentImageIndex > 0 && (
                        <Button 
                          onClick={handleFinishEarly}
                          variant="outline"
                        >
                          Finish Early ({currentImageIndex + 1} stories)
                        </Button>
                      )}
                      <Button 
                        onClick={() => handleNext()}
                        disabled={inputMethod === 'typed' && !currentResponse.trim()}
                      >
                        {currentImageIndex < images.length - 1 ? 'Next Image' : 'Complete Test'}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TATTest;
