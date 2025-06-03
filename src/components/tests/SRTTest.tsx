
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight } from 'lucide-react';

const SRTTest = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Situation Reaction Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            <div className="bg-gray-100 rounded-lg p-8">
              <p className="text-gray-600">SRT Test Implementation</p>
              <p className="text-sm text-gray-500 mt-2">
                60 situations with 30 minutes total time limit
              </p>
            </div>
            <Button>
              <ArrowRight className="h-4 w-4 mr-2" />
              Start SRT Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SRTTest;
