import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Star, TrendingUp, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TestResultsPreviewProps {
  testType: string;
  sessionId: string;
  previewData?: {
    overallScore?: number;
    topTraits?: string[];
    feedback?: string;
  };
}

export const TestResultsPreview: React.FC<TestResultsPreviewProps> = ({ 
  testType, 
  sessionId, 
  previewData 
}) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-2 border-dashed border-yellow-300 bg-yellow-50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-yellow-800">
            Your {testType.toUpperCase()} Test Results Preview
          </CardTitle>
          <CardDescription className="text-yellow-700">
            This is a limited preview. Sign up to see your complete analysis!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {previewData?.overallScore && (
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {previewData.overallScore}/10
              </div>
              <p className="text-sm text-gray-600">Overall Performance Score</p>
            </div>
          )}
          
          {previewData?.topTraits && previewData.topTraits.length > 0 && (
            <div className="p-4 bg-white rounded-lg border">
              <h3 className="font-semibold mb-2 flex items-center">
                <Star className="w-4 h-4 mr-2 text-yellow-500" />
                Top Traits Identified (Preview)
              </h3>
              <div className="flex flex-wrap gap-2">
                {previewData.topTraits.slice(0, 2).map((trait, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm"
                  >
                    {trait}
                  </span>
                ))}
                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-sm flex items-center">
                  <Lock className="w-3 h-3 mr-1" />
                  +{Math.max(0, (previewData.topTraits.length - 2))} more
                </span>
              </div>
            </div>
          )}

          {previewData?.feedback && (
            <div className="p-4 bg-white rounded-lg border relative">
              <h3 className="font-semibold mb-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                AI Analysis Preview
              </h3>
              <div className="relative">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {previewData.feedback.substring(0, 150)}...
                </p>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white flex items-end justify-center">
                  <div className="bg-white px-4 py-2 rounded-lg border shadow-sm flex items-center text-sm text-gray-600">
                    <Lock className="w-4 h-4 mr-2" />
                    Complete analysis locked
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-3">
              🚀 Unlock Your Complete Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Star className="w-4 h-4 text-blue-500 mr-2" />
                  <span>Detailed trait breakdown</span>
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                  <span>Personalized improvement tips</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Eye className="w-4 h-4 text-purple-500 mr-2" />
                  <span>Complete psychological profile</span>
                </div>
                <div className="flex items-center text-sm">
                  <Lock className="w-4 h-4 text-orange-500 mr-2" />
                  <span>Progress tracking over time</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate('/sign-up')}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Sign Up & Get Full Analysis
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};