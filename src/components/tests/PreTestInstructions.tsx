import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, FileText, Camera, CheckCircle, AlertCircle, Keyboard, PenTool } from 'lucide-react';

interface PreTestInstructionsProps {
  testType: 'tat' | 'wat' | 'srt';
  onStart: (inputMethod: 'typed' | 'handwritten') => void;
  onCancel: () => void;
}

export const PreTestInstructions: React.FC<PreTestInstructionsProps> = ({
  testType,
  onStart,
  onCancel
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'typed' | 'handwritten' | null>(null);

  const getInstructions = () => {
    switch (testType) {
      case 'tat':
        return {
          title: 'Thematic Apperception Test (TAT)',
          subtitle: 'Picture Story Writing Test',
          duration: '30 seconds viewing + 4 minutes writing per image',
          total: '12 images + 1 blank slide',
          minimum: '13 stories required',
          description: 'You will be shown images one by one. Write a story for each image with a clear beginning, middle, and end.',
          responseOptions: [
            'Type your stories directly in the text area',
            'Write on paper and upload all images at the end'
          ],
          uploadInfo: [
            'Upload 13 images at the end (one per story)',
            'Each image should contain one complete story',
            'Ensure handwriting is clear and legible',
            'Good lighting and focus required'
          ],
          tips: [
            'Create a protagonist with clear character',
            'Show leadership and problem-solving',
            'Include positive outcomes',
            'Demonstrate Officer-Like Qualities'
          ]
        };
      
      case 'wat':
        return {
          title: 'Word Association Test (WAT)',
          subtitle: 'Quick Word Response Test',
          duration: '15 seconds per word',
          total: '60 words',
          minimum: '20 responses required (can finish early)',
          description: 'A word will be shown. Write the first thought that comes to your mind immediately.',
          responseOptions: [
            'Type your responses directly',
            'Write on paper and upload sheets at the end'
          ],
          uploadInfo: [
            'Upload 1-3 response sheets at the end',
            'Each sheet can contain 1-20 word responses',
            'Write clearly in a grid or list format',
            'Number your responses for clarity'
          ],
          tips: [
            'Write your first spontaneous thought',
            'Keep responses positive and action-oriented',
            'Avoid negative or passive associations',
            'Show leadership mindset'
          ]
        };
      
      case 'srt':
        return {
          title: 'Situation Reaction Test (SRT)',
          subtitle: 'Problem-Solving Response Test',
          duration: '30 seconds per situation',
          total: '60 situations',
          minimum: '15 responses required (can finish early)',
          description: 'A situation will be presented. Write what action you would take to resolve it.',
          responseOptions: [
            'Type your responses directly',
            'Write on paper and upload sheets at the end'
          ],
          uploadInfo: [
            'Upload 1-4 response sheets at the end',
            'Each sheet can contain 1-15 situation responses',
            'Write situation number and your response',
            'Keep responses concise and action-oriented'
          ],
          tips: [
            'Take immediate and practical action',
            'Show leadership and responsibility',
            'Be specific about what you would do',
            'Demonstrate problem-solving ability'
          ]
        };
    }
  };

  const instructions = getInstructions();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl">{instructions.title}</CardTitle>
            <p className="text-gray-600 mt-2">{instructions.subtitle}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Test Overview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Test Overview
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Duration:</strong> {instructions.duration}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Total:</strong> {instructions.total}</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Minimum:</strong> {instructions.minimum}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What to Expect:</h3>
              <p className="text-gray-700">{instructions.description}</p>
            </div>

            {/* Response Options */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Response Options
              </h3>
              <div className="space-y-2">
                {instructions.responseOptions.map((option, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-gray-700">{option}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Upload Information */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Image Upload (If Writing on Paper)
              </h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                {instructions.uploadInfo.map((info, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>{info}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">💡 Tips for Success:</h3>
              <ul className="space-y-2 text-sm text-green-800">
                {instructions.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Important Note */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>⚠️ Important:</strong> Once you start the test, the timer will begin immediately. 
                Make sure you're ready and in a quiet environment with good internet connection.
              </p>
            </div>

            {/* Input Method Selection */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Choose Your Input Method:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Typed Response Option */}
                <button
                  onClick={() => setSelectedMethod('typed')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedMethod === 'typed'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedMethod === 'typed' ? 'bg-blue-500' : 'bg-gray-200'
                    }`}>
                      <Keyboard className={`h-6 w-6 ${
                        selectedMethod === 'typed' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Type Responses</h4>
                      <p className="text-sm text-gray-600">
                        Type your responses directly during the test. Faster and easier to analyze.
                      </p>
                      {selectedMethod === 'typed' && (
                        <div className="mt-2 text-sm text-blue-600 font-medium">
                          ✓ Selected
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Handwritten Response Option */}
                <button
                  onClick={() => setSelectedMethod('handwritten')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedMethod === 'handwritten'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedMethod === 'handwritten' ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      <PenTool className={`h-6 w-6 ${
                        selectedMethod === 'handwritten' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Write on Paper</h4>
                      <p className="text-sm text-gray-600">
                        Write responses on paper and type the handwritten responses at the end.
                      </p>
                      {selectedMethod === 'handwritten' && (
                        <div className="mt-2 text-sm text-green-600 font-medium">
                          ✓ Selected
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedMethod && onStart(selectedMethod)}
                disabled={!selectedMethod}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedMethod ? "I'm Ready - Start Test" : "Select Input Method First"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
