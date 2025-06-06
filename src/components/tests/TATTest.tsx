
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Clock, Eye, PenTool } from 'lucide-react';
import { TestContentService } from '@/services/testContentService';

const TATTest = () => {
  const [phase, setPhase] = useState<'loading' | 'viewing' | 'writing' | 'completed'>('loading');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const totalImages = 12;

  useEffect(() => {
    loadRandomImages();
  }, []);

  const loadRandomImages = async () => {
    const fetchedImages = await TestContentService.getRandomTATImages(12);
    if (fetchedImages && fetchedImages.length > 0) {
      setImages(fetchedImages);
      setPhase('viewing');
    } else {
      console.error('No TAT images available');
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
              // Save current response and move to next image
              const newResponses = [...responses];
              newResponses[currentImageIndex] = currentResponse;
              setResponses(newResponses);
              setCurrentResponse('');
              
              if (currentImageIndex < totalImages - 1) {
                setCurrentImageIndex(prev => prev + 1);
                setPhase('viewing');
                return 30; // 30 seconds viewing for next image
              } else {
                setPhase('completed');
                return 0;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase, currentImageIndex, currentResponse, responses]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    console.log('TAT Responses:', responses);
    setPhase('completed');
  };

  const currentImage = images[currentImageIndex];

  if (phase === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading test images...</p>
            </div>
          </CardContent>
        </Card>
      </div>
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
                TAT Test - Image {currentImageIndex + 1} of {totalImages}
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
                    alt={`TAT Test Image ${currentImageIndex + 1}`}
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Blank Slide - Create your own story</p>
                  </div>
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
    const wordCount = currentResponse.trim().split(/\s+/).filter(word => word.length > 0).length;

    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <PenTool className="h-5 w-5 mr-2" />
                TAT Test - Writing for Image {currentImageIndex + 1} of {totalImages}
              </CardTitle>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Words: {wordCount}</span>
                <div className="flex items-center text-2xl font-bold text-orange-600">
                  <Clock className="h-6 w-6 mr-2" />
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Write your story for this image..."
                className="min-h-64 text-base"
                autoFocus
              />

              {timeLeft <= 30 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-semibold">
                    ⏰ Only {timeLeft} seconds remaining!
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Progress: {currentImageIndex + 1}/{totalImages} images
                </span>
                <div className="space-x-2">
                  {currentImageIndex === totalImages - 1 ? (
                    <Button onClick={handleSubmit}>Finish Test</Button>
                  ) : (
                    <span className="text-sm text-gray-600">Auto-advancing to next image...</span>
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
          <CardTitle>TAT Test Completed!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Test Successfully Submitted</h3>
            <p className="text-gray-600">
              All {totalImages} stories have been completed and saved.
            </p>
            <div className="flex justify-center space-x-4 mt-6">
              <Button variant="outline">View My Responses</Button>
              <Button>Go to Dashboard</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TATTest;
