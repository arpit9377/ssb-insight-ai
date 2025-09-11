
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { testAnalysisService } from '@/services/testAnalysisService';
import { TrendingUp, Target, Lightbulb, ArrowLeft, BookOpen, History } from 'lucide-react';
import { toast } from 'sonner';

const TestResultsPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { user, isAuthenticated, isGuestMode, guestId } = useAuthContext();
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadAnalysis();
    loadRecentActivity();
  }, [sessionId, user, guestId]);

  const loadAnalysis = async () => {
    try {
      const currentUserId = user?.id || guestId;
      if (!sessionId || !currentUserId) {
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
      
      // Store in recent activity
      if (currentUserId) {
        await testAnalysisService.addToRecentActivity(currentUserId, analysisData);
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
      toast.error('Failed to load analysis');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      if (!user?.id) return;
      const activity = await testAnalysisService.getRecentActivity(user.id);
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const viewPreviousAnalysis = (activitySessionId: string) => {
    navigate(`/test-results/${activitySessionId}`);
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
                <img src="/lovable-uploads/d3dbc8a1-8206-42d0-8106-40fc4d962c94.png" alt="PsychSirAi Logo" className="h-6 w-6" />
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

          {/* Word-by-Word Suggestions */}
          {feedback.wordSuggestions && feedback.wordSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  How Your Responses Could Be Improved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {feedback.wordSuggestions.map((suggestion: any, index: number) => (
                    <AccordionItem key={index} value={`word-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex flex-col items-start">
                          <span className="font-semibold">{suggestion.word}</span>
                          <span className="text-sm text-gray-600">Your response: "{suggestion.response}"</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-700 font-medium text-sm">Your response:</p>
                            <p className="text-gray-800 italic">"{suggestion.response}"</p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="text-purple-900 font-medium text-sm">Better approach:</p>
                            <p className="text-purple-800 italic leading-relaxed">"{suggestion.betterResponse}"</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Sample Examples */}
          {feedback.sampleExamples && feedback.sampleExamples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Your Response Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {feedback.sampleExamples.map((example: any, index: number) => (
                    <AccordionItem key={index} value={`example-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex flex-col items-start">
                          <span className="font-semibold">
                            {example.word ? `Word: ${example.word}` : 
                             example.situation ? `Situation ${index + 1}` : 
                             example.imageNumber ? `Story ${example.imageNumber}` : 
                             `Example ${index + 1}`}
                          </span>
                          <span className="text-sm text-gray-600 truncate max-w-xs">
                            "{example.response.length > 50 ? example.response.substring(0, 50) + '...' : example.response}"
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {example.situation && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-gray-700 font-medium text-sm">Situation:</p>
                              <p className="text-gray-800">{example.situation}</p>
                            </div>
                          )}
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-blue-900 font-medium text-sm">Your response:</p>
                            <p className="text-blue-800 italic">"{example.response}"</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-green-900 font-medium text-sm">Analysis:</p>
                            <p className="text-green-800 leading-relaxed">{example.analysis}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Sample Response (fallback) */}
          {feedback.sampleResponse && (!feedback.wordSuggestions || feedback.wordSuggestions.length === 0) && (!feedback.sampleExamples || feedback.sampleExamples.length === 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Sample Ideal Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-purple-900 font-medium mb-2">How it could have been written:</p>
                  <p className="text-purple-800 italic leading-relaxed">"{feedback.sampleResponse}"</p>
                </div>
              </CardContent>
            </Card>
          )}

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
                  <img src="/lovable-uploads/d3dbc8a1-8206-42d0-8106-40fc4d962c94.png" alt="PsychSirAi Logo" className="h-5 w-5" />
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

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-gray-600" />
                  Recent Activity (Last 3 Tests)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {activity.test_type ? activity.test_type.toUpperCase() : 'Unknown'} Test
                        </p>
                        <p className="text-sm text-gray-600">
                          Score: {activity.processed_feedback?.overallScore || activity.overall_score || 0}/10
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => viewPreviousAnalysis(activity.test_session_id)}
                      >
                        View Details
                      </Button>
                    </div>
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
