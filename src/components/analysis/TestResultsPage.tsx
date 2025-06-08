
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { testAnalysisService } from '@/services/testAnalysisService';
import { Brain, TrendingUp, Target, Lightbulb, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const TestResultsPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { user } = useUser();
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalysis();
  }, [sessionId, user]);

  const loadAnalysis = async () => {
    try {
      if (!sessionId || !user?.id) {
        toast.error('Invalid session or user');
        navigate('/dashboard');
        return;
      }

      const analysisData = await testAnalysisService.getSessionAnalysis(sessionId);
      if (!analysisData) {
        toast.error('Analysis not found');
        navigate('/dashboard');
        return;
      }

      setAnalysis(analysisData);
    } catch (error) {
      console.error('Error loading analysis:', error);
      toast.error('Failed to load analysis');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <p className="text-lg text-red-600">Analysis not available</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const feedback = analysis.processed_feedback || analysis.raw_analysis || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Analysis Results</h1>
            <p className="text-gray-600">Your psychological assessment feedback</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                Overall Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {feedback.overallScore || 0}/10
              </div>
              <Progress value={(feedback.overallScore || 0) * 10} className="w-full max-w-xs mx-auto" />
            </CardContent>
          </Card>

          {/* Strengths */}
          {feedback.strengths && feedback.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {feedback.strengths.map((strength: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-sm p-2 bg-green-50 text-green-800">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Areas for Improvement */}
          {feedback.improvements && feedback.improvements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {feedback.improvements.map((improvement: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-sm p-2 bg-orange-50 text-orange-800">
                      {improvement}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {feedback.recommendations && feedback.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feedback.recommendations.map((recommendation: string, index: number) => (
                    <div key={index} className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-purple-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Officer-like Qualities */}
          {feedback.officerLikeQualities && feedback.officerLikeQualities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  Officer-like Qualities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {feedback.officerLikeQualities.map((quality: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-sm p-2 bg-blue-50 text-blue-800">
                      {quality}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Premium Upgrade Prompt */}
          {!analysis.is_premium_analysis && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="text-center p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Upgrade for Detailed Analysis
                </h3>
                <p className="text-yellow-700 mb-4">
                  Get comprehensive trait analysis, detailed feedback, and personalized recommendations
                </p>
                <Button onClick={() => navigate('/subscription')} className="bg-yellow-600 hover:bg-yellow-700">
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestResultsPage;
