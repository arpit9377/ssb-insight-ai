
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Loader2 } from 'lucide-react';

interface AnalysisLoadingScreenProps {
  testType: string;
  isVisible: boolean;
}

const AnalysisLoadingScreen: React.FC<AnalysisLoadingScreenProps> = ({ testType, isVisible }) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const loadingMessages = [
    "AI Psych Sir is analyzing your responses...",
    "Hold on, evaluating your psychological traits...", 
    "Sir is assessing your leadership potential...",
    "Analyzing your SSB officer-like qualities...",
    "Processing your emotional stability patterns...",
    "Sir is reviewing your decision-making approach...",
    "Evaluating your initiative and determination...",
    "Almost done, preparing your personalized feedback..."
  ];

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible, loadingMessages.length]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96 mx-4">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">
                Analyzing {testType.toUpperCase()} Results
              </h3>
              
              <div className="min-h-[60px] flex items-center justify-center">
                <p className="text-gray-600 text-center leading-relaxed animate-pulse">
                  {loadingMessages[currentMessage]}
                </p>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ 
                    width: `${((currentMessage + 1) / loadingMessages.length) * 100}%` 
                  }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-500">
                This may take 30-60 seconds...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisLoadingScreen;
