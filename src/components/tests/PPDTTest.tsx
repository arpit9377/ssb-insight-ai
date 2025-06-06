
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Eye, PenTool } from 'lucide-react';
import { TestContentService } from '@/services/testContentService';

const PPDTTest = () => {
  const [phase, setPhase] = useState<'loading' | 'viewing' | 'writing' | 'completed'>('loading');
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds for viewing
  const [response, setResponse] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [currentImage, setCurrentImage] = useState<any>(null);

  useEffect(() => {
    loadRandomImage();
  }, []);

  const loadRandomImage = async () => {
    const images = await TestContentService.getRandomPPDTImages(1);
    if (images && images.length > 0) {
      setCurrentImage(images[0]);
      setPhase('viewing');
    } else {
      console.error('No PPDT images available');
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
              setPhase('completed');
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase]);

  useEffect(() => {
    const words = response.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [response]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    // In real implementation, save to database and navigate to feedback
    console.log('PPDT Response:', response);
    setPhase('completed');
  };

  if (phase === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading test image...</p>
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
                Viewing Phase
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
                    alt="PPDT Test Image" 
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                  />
                ) : (
                  <p className="text-gray-500">Image not available</p>
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
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <PenTool className="h-5 w-5 mr-2" />
                Writing Phase
              </CardTitle>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Words: {wordCount}
                </span>
                <div className="flex items-center text-2xl font-bold text-orange-600">
                  <Clock className="h-6 w-6 mr-2" />
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Writing Guidelines:</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Write a complete story with beginning, middle, and end</li>
                  <li>• Include what led to the situation shown in the image</li>
                  <li>• Describe what is currently happening</li>
                  <li>• Predict what will happen next</li>
                  <li>• Focus on positive themes and leadership qualities</li>
                </ul>
              </div>

              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Write your story here..."
                className="min-h-96 text-base"
                autoFocus
              />

              {timeLeft <= 30 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-semibold">
                    ⏰ Only {timeLeft} seconds remaining! Finish your story.
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Auto-saving every 30 seconds...
                </span>
                <Button onClick={handleSubmit} disabled={response.trim().length < 50}>
                  Submit Response
                </Button>
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
          <CardTitle>PPDT Test Completed!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <PenTool className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Test Successfully Submitted</h3>
            <p className="text-gray-600">
              Your response has been saved and will be analyzed by our AI system.
              You'll receive detailed feedback on your personality traits and areas for improvement.
            </p>
            <div className="flex justify-center space-x-4 mt-6">
              <Button variant="outline">View My Response</Button>
              <Button>Go to Dashboard</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PPDTTest;
