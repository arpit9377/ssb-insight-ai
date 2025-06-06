
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, Clock } from 'lucide-react';
import { TestContentService } from '@/services/testContentService';

const WATTest = () => {
  const [phase, setPhase] = useState<'loading' | 'active' | 'completed'>('loading');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const totalWords = 60;

  useEffect(() => {
    loadRandomWords();
  }, []);

  const loadRandomWords = async () => {
    const fetchedWords = await TestContentService.getRandomWATWords(60);
    if (fetchedWords && fetchedWords.length > 0) {
      setWords(fetchedWords);
      setPhase('active');
    } else {
      console.error('No WAT words available');
    }
  };

  useEffect(() => {
    if (phase === 'active') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Save current response and move to next word
            const newResponses = [...responses];
            newResponses[currentWordIndex] = currentResponse || '';
            setResponses(newResponses);
            setCurrentResponse('');
            
            if (currentWordIndex < totalWords - 1) {
              setCurrentWordIndex(prev => prev + 1);
              return 15; // 15 seconds for next word
            } else {
              setPhase('completed');
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase, currentWordIndex, currentResponse, responses]);

  const handleSubmit = () => {
    const finalResponses = [...responses];
    finalResponses[currentWordIndex] = currentResponse;
    setResponses(finalResponses);
    console.log('WAT Responses:', finalResponses);
    setPhase('completed');
  };

  const handleNext = () => {
    const newResponses = [...responses];
    newResponses[currentWordIndex] = currentResponse || '';
    setResponses(newResponses);
    setCurrentResponse('');
    
    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setTimeLeft(15);
    } else {
      setPhase('completed');
    }
  };

  const currentWord = words[currentWordIndex];

  if (phase === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading test words...</p>
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
                <Brain className="h-5 w-5 mr-2" />
                WAT Test - Word {currentWordIndex + 1} of {totalWords}
              </CardTitle>
              <div className="flex items-center text-2xl font-bold text-blue-600">
                <Clock className="h-6 w-6 mr-2" />
                {timeLeft}s
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-8">
              <div className="bg-blue-50 rounded-lg p-8">
                <h2 className="text-4xl font-bold text-blue-800 mb-4">
                  {currentWord?.word || 'Loading...'}
                </h2>
                <p className="text-gray-600">
                  Write the first meaningful thought that comes to mind
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <Input
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  placeholder="Your response..."
                  className="text-center text-lg"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleNext();
                    }
                  }}
                />
              </div>

              {timeLeft <= 5 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 font-semibold">
                    ⚠️ {timeLeft} seconds left!
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Progress: {currentWordIndex + 1}/{totalWords}
                </span>
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleNext}>
                    Skip
                  </Button>
                  {currentWordIndex === totalWords - 1 ? (
                    <Button onClick={handleSubmit}>Finish Test</Button>
                  ) : (
                    <Button onClick={handleNext}>Next Word</Button>
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
          <CardTitle>WAT Test Completed!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Test Successfully Submitted</h3>
            <p className="text-gray-600">
              All {totalWords} word associations have been completed and saved.
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

export default WATTest;
