
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Users, Clock } from 'lucide-react';
import { TestContentService } from '@/services/testContentService';

const SRTTest = () => {
  const [phase, setPhase] = useState<'loading' | 'active' | 'completed'>('loading');
  const [currentSituationIndex, setCurrentSituationIndex] = useState(0);
  const [situations, setSituations] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes total
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const totalSituations = 60;

  useEffect(() => {
    loadRandomSituations();
  }, []);

  const loadRandomSituations = async () => {
    const fetchedSituations = await TestContentService.getRandomSRTSituations(60);
    if (fetchedSituations && fetchedSituations.length > 0) {
      setSituations(fetchedSituations);
      setPhase('active');
    } else {
      console.error('No SRT situations available');
    }
  };

  useEffect(() => {
    if (phase === 'active') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setPhase('completed');
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

  const handleNext = () => {
    const newResponses = [...responses];
    newResponses[currentSituationIndex] = currentResponse || '';
    setResponses(newResponses);
    setCurrentResponse('');
    
    if (currentSituationIndex < totalSituations - 1) {
      setCurrentSituationIndex(prev => prev + 1);
    } else {
      setPhase('completed');
    }
  };

  const handleSubmit = () => {
    const finalResponses = [...responses];
    finalResponses[currentSituationIndex] = currentResponse;
    setResponses(finalResponses);
    console.log('SRT Responses:', finalResponses);
    setPhase('completed');
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

              {timeLeft <= 300 && ( // Last 5 minutes
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-semibold">
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
                    <Button onClick={handleSubmit}>Finish Test</Button>
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

export default SRTTest;
