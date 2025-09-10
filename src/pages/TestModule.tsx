
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Play, Pause } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { SignupPrompt } from '@/components/auth/SignupPrompt';
import { guestUserService } from '@/services/guestUserService';
import PPDTTest from '@/components/tests/PPDTTest';
import TATTest from '@/components/tests/TATTest';
import WATTest from '@/components/tests/WATTest';
import SRTTest from '@/components/tests/SRTTest';

const TestModule = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [isStarted, setIsStarted] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const { isAuthenticated, isGuestMode, enableGuestMode } = useAuthContext();

  const testConfig = {
    ppdt: {
      title: 'Picture Perception & Discussion Test',
      description: 'View an image for 30 seconds, then write a story in 4 minutes',
      instructions: [
        'You will see an image for exactly 30 seconds',
        'After viewing, you have 4 minutes to write a story',
        'Include what led to the situation, what is happening, and what will happen next',
        'Focus on positive themes and leadership qualities'
      ]
    },
    tat: {
      title: 'Thematic Apperception Test',
      description: '12 images with 30 seconds viewing and 4 minutes writing each',
      instructions: [
        'You will see 12 images in sequence (11 pictures + 1 blank slide)',
        'Each image: 30 seconds viewing + 4 minutes writing',
        'Write a complete story for each image',
        'The blank slide is for a self-choice story'
      ]
    },
    wat: {
      title: 'Word Association Test',
      description: '60 words with 15 seconds each for viewing and response',
      instructions: [
        'You will see 60 words one by one',
        'Each word appears for 15 seconds total',
        'Write the first meaningful thought that comes to mind',
        'Avoid negative associations, focus on positive responses'
      ]
    },
    srt: {
      title: 'Situation Reaction Test',
      description: '60 situations with 30 minutes total time',
      instructions: [
        'You will face 60 different situations',
        'Total time limit: 30 minutes for all situations',
        'Write your immediate reaction to each situation',
        'Focus on practical and positive solutions'
      ]
    }
  };

  const currentTest = testConfig[testId as keyof typeof testConfig];

  const handleStartTest = () => {
    if (!isAuthenticated && !isGuestMode) {
      // Enable guest mode for unauthenticated users
      enableGuestMode();
    }
    setIsStarted(true);
  };

  const handleSignupPromptClose = () => {
    setShowSignupPrompt(false);
    navigate('/dashboard');
  };

  if (!currentTest) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold mb-4">Test Not Found</h2>
              <Button onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
        {showSignupPrompt && (
          <SignupPrompt 
            testType={testId || 'test'} 
            onClose={handleSignupPromptClose}
          />
        )}
      </>
    );
  }

  const renderTestComponent = () => {
    switch (testId) {
      case 'ppdt':
        return <PPDTTest />;
      case 'tat':
        return <TATTest />;
      case 'wat':
        return <WATTest />;
      case 'srt':
        return <SRTTest />;
      default:
        return null;
    }
  };

  if (isStarted) {
    return (
      <>
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white shadow-sm border-b px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <h1 className="text-lg font-semibold">{currentTest.title}</h1>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setIsStarted(false);
                  navigate('/dashboard');
                }}
              >
                Exit Test
              </Button>
            </div>
          </div>
          {renderTestComponent()}
        </div>
        {showSignupPrompt && (
          <SignupPrompt 
            testType={testId || 'test'} 
            onClose={handleSignupPromptClose}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">{currentTest.title}</CardTitle>
              <p className="text-gray-600">{currentTest.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Instructions:</h3>
                  <ul className="space-y-2">
                    {currentTest.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-sm rounded-full mr-3 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Important Notes:</h4>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>• Ensure you have a stable internet connection</li>
                    <li>• Find a quiet environment without distractions</li>
                    <li>• The test will auto-save your responses</li>
                    <li>• You cannot pause once started - plan accordingly</li>
                    {!isAuthenticated && (
                      <li className="text-blue-700 font-medium">• This is a free trial test with limited analysis</li>
                    )}
                  </ul>
                </div>

                <div className="flex justify-center">
                  <Button 
                    size="lg" 
                    onClick={handleStartTest}
                    className="px-8 py-3"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {!isAuthenticated ? `Try ${testId?.toUpperCase()} Test Free` : `Start ${testId?.toUpperCase()} Test`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {showSignupPrompt && (
        <SignupPrompt 
          testType={testId || 'test'} 
          onClose={handleSignupPromptClose}
        />
      )}
    </>
  );
};

export default TestModule;
