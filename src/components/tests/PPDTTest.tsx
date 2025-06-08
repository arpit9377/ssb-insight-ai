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

const PPDTTest = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<any[]>([]);
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

      console.log('Initializing PPDT test for user:', user.id);
      
      // Setup database tables first
      await setupTestTables();
      
      // Load test images
      const testImages = await TestContentService.getRandomPPDTImages(1);
      if (!testImages || testImages.length === 0) {
        throw new Error('No PPDT images found');
      }

      // Create test session
      const sessionId = await testAnalysisService.createTestSession(
        user.id,
        'ppdt',
        testImages.length
      );

      setImages(testImages);
      setSessionId(sessionId);
      setResponses(new Array(testImages.length).fill(''));
      setStartTime(Date.now());
      setIsLoading(false);
      
      console.log('PPDT test initialized successfully with session:', sessionId);
      
    } catch (error) {
      console.error('Failed to initialize PPDT test:', error);
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
      // Calculate time taken
      const timeTaken = Date.now() - startTime;
      
      // Store the response
      await testAnalysisService.storeResponse(
        user.id,
        sessionId,
        images[currentImageIndex].id,
        currentResponse.trim(),
        timeTaken,
        'ppdt'
      );

      // Update responses array
      const newResponses = [...responses];
      newResponses[currentImageIndex] = currentResponse.trim();
      setResponses(newResponses);

      // Update session progress
      await testAnalysisService.updateTestSession(sessionId, currentImageIndex + 1);

      if (currentImageIndex < images.length - 1) {
        // Move to next image
        setCurrentImageIndex(currentImageIndex + 1);
        setCurrentResponse('');
        setStartTime(Date.now());
      } else {
        // Test completed - start analysis
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
      
      // Mark session as completed
      await testAnalysisService.updateTestSession(sessionId, images.length, 'completed');

      // Check if user can get free analysis
      const canGetFree = await testAnalysisService.canUserGetFreeAnalysis(user.id);
      const hasSubscription = await testAnalysisService.getUserSubscription(user.id);
      const isPremium = hasSubscription || !canGetFree;

      console.log(`Starting analysis - Premium: ${isPremium}, Can get free: ${canGetFree}`);

      // Trigger comprehensive analysis
      await testAnalysisService.analyzeTestSession(user.id, sessionId, isPremium);

      toast.success('Test completed and analyzed successfully!');
      
      // Navigate to dashboard after analysis
      setTimeout(() => {
        navigate('/dashboard');
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
          <p className="mt-4 text-lg">Initializing PPDT Test...</p>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return <AnalysisLoadingScreen testType="ppdt" isVisible={isAnalyzing} />;
  }

  if (images.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <p className="text-lg text-red-600">No PPDT images available. Please contact support.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              Picture Perception and Description Test (PPDT)
            </CardTitle>
            <p className="text-center text-gray-600">
              Image {currentImageIndex + 1} of {images.length}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <img
                src={currentImage.image_url}
                alt={`PPDT Image ${currentImageIndex + 1}`}
                className="max-w-full h-auto max-h-96 rounded-lg shadow-lg"
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-blue-900 mb-2">Instructions:</p>
              <p className="text-blue-800">{currentImage.prompt}</p>
            </div>

            <div className="space-y-4">
              <Textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Write your response here..."
                className="min-h-32"
              />
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Progress: {currentImageIndex + 1}/{images.length}
                </p>
                <Button 
                  onClick={handleNext}
                  disabled={!currentResponse.trim()}
                  className="px-8"
                >
                  {currentImageIndex === images.length - 1 ? 'Submit Test' : 'Next'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PPDTTest;
