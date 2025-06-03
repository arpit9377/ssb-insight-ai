
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';

const TATTest = () => {
  const [currentImage, setCurrentImage] = useState(1);
  const totalImages = 12;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              TAT Test - Image {currentImage} of {totalImages}
            </CardTitle>
            <div className="text-sm text-gray-600">
              Progress: {currentImage}/{totalImages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            <div className="bg-gray-100 rounded-lg p-8">
              <p className="text-gray-600">TAT Test Implementation</p>
              <p className="text-sm text-gray-500 mt-2">
                This will include the full TAT test sequence with 12 images
              </p>
            </div>
            <Button>
              <ArrowRight className="h-4 w-4 mr-2" />
              Start TAT Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TATTest;
