import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Clock, Target, Users, BookOpen, BarChart3, User, CreditCard, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { testAnalysisService } from '@/services/testAnalysisService';
import { testLimitService } from '@/services/testLimitService';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, subscription } = useAuthContext();
  const { toast } = useToast();
  const [userStats, setUserStats] = useState({
    testsCompleted: 0,
    avgScore: 0,
    traitsAnalyzed: 0,
  });
  const [testLimits, setTestLimits] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (user) {
      loadUserStats();
      loadRecentActivity();
      loadTestLimits();
    }
  }, [user]);

  const loadTestLimits = async () => {
    if (!user) return;
    try {
      const limits = await testLimitService.getTestLimits(user.id);
      setTestLimits(limits);
    } catch (error) {
      console.error('Error loading test limits:', error);
    }
  };

  const loadUserStats = async () => {
    if (!user) return;

    try {
      // Get total completed test sessions (not individual responses)
      const { count: testsCount } = await supabase
        .from('test_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');

      // Get session analyses for average score calculation
      const { data: analyses } = await supabase
        .from('ai_analyses')
        .select('processed_feedback, raw_analysis, overall_score, trait_scores')
        .eq('user_id', user.id)
        .eq('analysis_type', 'session_summary');

      let avgScore = 0;
      let traitsAnalyzed = 0;

      if (analyses && analyses.length > 0) {
        // Calculate average score from session analyses
        const scoresWithFeedback = analyses.filter(a => 
          (a.processed_feedback || a.raw_analysis || a.overall_score)
        );
        
        if (scoresWithFeedback.length > 0) {
          const totalScore = scoresWithFeedback.reduce((sum, analysis) => {
            // Try multiple sources for the score
            const score = analysis.overall_score || 
                         (analysis.processed_feedback?.overallScore) ||
                         (analysis.raw_analysis?.overallScore) || 0;
            return sum + score;
          }, 0);
          avgScore = totalScore / scoresWithFeedback.length;
        }

        // Count unique traits from all analyses using the trait_scores column
        const allTraits = new Set();
        analyses.forEach(analysis => {
          // Check trait_scores column first (array format)
          if (analysis.trait_scores && Array.isArray(analysis.trait_scores)) {
            analysis.trait_scores.forEach((trait: any) => {
              if (trait.trait) allTraits.add(trait.trait);
            });
          }
          
          // Also check in processed_feedback and raw_analysis
          const feedback = analysis.processed_feedback || analysis.raw_analysis || {};
          if (feedback.traitScores && Array.isArray(feedback.traitScores)) {
            feedback.traitScores.forEach((trait: any) => {
              if (trait.trait) allTraits.add(trait.trait);
            });
          }
        });
        traitsAnalyzed = allTraits.size;
      }

      setUserStats({
        testsCompleted: testsCount || 0,
        avgScore: Math.round(avgScore * 10) / 10,
        traitsAnalyzed,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    if (!user) return;

    try {
      const activity = await testAnalysisService.getRecentActivity(user.id);
      setRecentActivity(activity.slice(0, 3)); // Only last 3 activities
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const viewTestResults = (sessionId: string) => {
    navigate(`/test-results/${sessionId}`);
  };

  // Check if current user should have premium access
  const isPrivilegedUser = user?.primaryEmailAddress?.emailAddress === 'editkarde@gmail.com';

  const testModules = [
    {
      id: 'ppdt',
      title: 'PPDT',
      description: 'Picture Perception & Discussion Test',
      duration: '30s viewing + 4min writing',
      icon: Target,
      color: 'bg-blue-500',
      available: true
    },
    {
      id: 'tat',
      title: 'TAT',
      description: 'Thematic Apperception Test',
      duration: '12 images, 30s + 4min each',
      icon: BookOpen,
      color: 'bg-green-500',
      available: true
    },
    {
      id: 'wat',
      title: 'WAT',
      description: 'Word Association Test',
      duration: '60 words, 15s each',
      icon: Brain,
      color: 'bg-purple-500',
      available: isPrivilegedUser || subscription?.status === 'active' || false
    },
    {
      id: 'srt',
      title: 'SRT',
      description: 'Situation Reaction Test',
      duration: '60 situations, 30min total',
      icon: Users,
      color: 'bg-orange-500',
      available: isPrivilegedUser || subscription?.status === 'active' || false
    }
  ];

  const handleTestStart = async (testId: string) => {
    if (!user) return;
    
    // Check if user has remaining tests
    const canTake = await testLimitService.checkTestAvailability(user.id, testId);
    if (!canTake) {
      const limits = await testLimitService.getTestLimits(user.id);
      const remaining = limits?.[testId as keyof typeof limits] || 0;
      
      if (typeof remaining === 'number' && remaining <= 0) {
        toast({
          title: "No Tests Remaining",
          description: `You have used all your ${testId.toUpperCase()} tests. Please upgrade to continue.`,
          variant: "destructive"
        });
        navigate('/subscription');
        return;
      }
    }
    
    navigate(`/test/${testId}`);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  };

  const getTestIcon = (testType: string) => {
    switch (testType) {
      case 'PPDT': return Target;
      case 'TAT': return BookOpen;
      case 'WAT': return Brain;
      case 'SRT': return Users;
      default: return Target;
    }
  };

  const getTestColor = (testType: string) => {
    switch (testType) {
      case 'PPDT': return 'bg-blue-500';
      case 'TAT': return 'bg-green-500';
      case 'WAT': return 'bg-purple-500';
      case 'SRT': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">PsychSir.ai</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/progress')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Progress
              </Button>
              <Button variant="outline" onClick={() => navigate('/subscription')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Subscription
              </Button>
              <Button variant="outline" onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName || 'Cadet'}!
          </h2>
          <p className="text-gray-600 text-lg">
            Continue your SSB psychological test preparation journey
          </p>
          {isPrivilegedUser && (
            <p className="text-green-600 font-semibold mt-2">
              ✅ All features unlocked for testing
            </p>
          )}
        </div>

        {/* Subscription Status */}
        {!subscription && !isPrivilegedUser && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-yellow-800">Upgrade to Premium</h3>
                  <p className="text-yellow-700">
                    Get access to all tests and advanced AI feedback
                  </p>
                </div>
                <Button onClick={() => navigate('/subscription')}>
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Limits Display */}
        {testLimits && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Test Limits</CardTitle>
              <CardDescription>
                {testLimits.subscription_type === 'paid' ? 
                  `Paid Access - Valid until ${new Date(testLimits.subscription_expires_at).toLocaleDateString()}` :
                  'Free Access - Upgrade for unlimited tests'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{testLimits.tat}</p>
                  <p className="text-sm text-gray-600">TAT Tests Left</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{testLimits.ppdt}</p>
                  <p className="text-sm text-gray-600">PPDT Tests Left</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{testLimits.wat}</p>
                  <p className="text-sm text-gray-600">WAT Tests Left</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{testLimits.srt}</p>
                  <p className="text-sm text-gray-600">SRT Tests Left</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{userStats.testsCompleted}</p>
                  <p className="text-gray-600">Tests Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {userStats.avgScore > 0 ? `${userStats.avgScore}/10` : 'N/A'}
                  </p>
                  <p className="text-gray-600">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Brain className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <Button 
                    variant="ghost" 
                    className="p-0 h-auto font-normal w-full text-left"
                    onClick={() => navigate('/trait-analysis')}
                  >
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{userStats.traitsAnalyzed}</p>
                      <p className="text-gray-600">Traits Analyzed</p>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {isPrivilegedUser ? 'Testing' : testLimits?.subscription_type === 'paid' ? 'Paid' : 'Free'}
                  </p>
                  <p className="text-gray-600">Plan Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testModules.map((test) => {
            const IconComponent = test.icon;
            return (
              <Card key={test.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-lg ${test.color} flex items-center justify-center mb-4`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{test.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {test.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {test.duration}
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => handleTestStart(test.id)}
                      disabled={!test.available && !isPrivilegedUser}
                    >
                      {test.available || isPrivilegedUser ? 'Start Practice' : 'Premium Only'}
                    </Button>
                    {testLimits && (
                      <p className="text-xs text-center mt-1 text-gray-500">
                        {testLimits[test.id] || 0} tests remaining
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity (Last 3 Tests)</CardTitle>
              <CardDescription>Your latest test sessions with feedback access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity: any, index) => {
                    const testType = activity.test_type || 'unknown';
                    const IconComponent = getTestIcon(testType.toUpperCase());
                    const colorClass = getTestColor(testType.toUpperCase());
                    const overallScore = activity.processed_feedback?.overallScore || activity.overall_score || 0;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center`}>
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{testType.toUpperCase()} Practice Session</p>
                            <p className="text-sm text-gray-600">{formatTimeAgo(activity.created_at)}</p>
                            <p className="text-sm text-green-600 font-medium">
                              Score: {overallScore}/10
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewTestResults(activity.test_session_id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Feedback
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No test sessions yet. Start your first test!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
