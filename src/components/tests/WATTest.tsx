
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, ArrowRight } from 'lucide-react';

const WATTest = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Word Association Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            <div className="bg-gray-100 rounded-lg p-8">
              <p className="text-gray-600">WAT Test Implementation</p>
              <p className="text-sm text-gray-500 mt-2">
                60 words with 15 seconds each for rapid response
              </p>
            </div>
            <Button>
              <ArrowRight className="h-4 w-4 mr-2" />
              Start WAT Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WATTest;
