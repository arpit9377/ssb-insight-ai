import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Zap, Target, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SignupPromptProps {
  testType: string;
  onClose?: () => void;
}

export const SignupPrompt: React.FC<SignupPromptProps> = ({ testType, onClose }) => {
  const navigate = useNavigate();

  const handleSignup = () => {
    // Navigate to Clerk sign up
    navigate('/sign-up');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">Ready for More Tests?</CardTitle>
          <CardDescription>
            You've completed your free {testType.toUpperCase()} test! Sign up to continue your SSB preparation journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Sign up and get:</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Zap className="w-4 h-4 text-blue-500 mr-2" />
                <span>1 more test for each type (TAT, PPDT, WAT, SRT)</span>
              </div>
              <div className="flex items-center text-sm">
                <Target className="w-4 h-4 text-green-500 mr-2" />
                <span>Detailed AI-powered analysis</span>
              </div>
              <div className="flex items-center text-sm">
                <Star className="w-4 h-4 text-purple-500 mr-2" />
                <span>Track your progress over time</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={handleSignup}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Sign Up & Continue
            </Button>
            {onClose && (
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full"
              >
                Maybe Later
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};