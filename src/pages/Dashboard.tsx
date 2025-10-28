import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Target, Users, BookOpen, BarChart3, User, CreditCard, Eye, UserPlus, Trophy, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { testAnalysisService } from '@/services/testAnalysisService';
import { testLimitService } from '@/services/testLimitService';
import { streakService, UserStreak } from '@/services/streakService';
import { leaderboardService, LeaderboardEntry } from '@/services/leaderboardService';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { SignInButton } from '@clerk/clerk-react';
import { StreakTester } from '@/components/testing/StreakTester';
import { UploadFeatureAnnouncement } from '@/components/announcement/UploadFeatureAnnouncement';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, subscription, isAuthenticated } = useAuthContext();
  const { toast } = useToast();
  const [userStats, setUserStats] = useState({
    testsCompleted: 0,
    avgScore: 0,
    traitsAnalyzed: 0,
  });
  const [testLimits, setTestLimits] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
  const [topLeaders, setTopLeaders] = useState<LeaderboardEntry[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [daysUntilExam, setDaysUntilExam] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadUserStats();
      loadRecentActivity(); 
      loadTestLimits();
      loadUserStreak();
      loadTopLeaders();
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setProfileData(data);
        // Check if mandatory fields are complete
        const complete = !!(data.full_name && data.phone_number && data.target_exam && data.target_exam_date);
        setIsProfileComplete(complete);

        // Calculate days until exam
        if (data.target_exam_date) {
          const examDate = new Date(data.target_exam_date);
          const today = new Date();
          const diffTime = examDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysUntilExam(diffDays);
        }
      } else {
        setIsProfileComplete(false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadTestLimits = async () => {
    if (!user) return;
    try {
      const limits = await testLimitService.getTestLimits(user.id);
      setTestLimits(limits);
    } catch (error) {
      console.error('Error loading test limits:', error);
    }
  };

  const loadUserStreak = async () => {
    if (!user) return;
    try {
      const streak = await streakService.getUserStreak(user.id);
      setUserStreak(streak);
    } catch (error) {
      console.error('Error loading user streak:', error);
    }
  };

  const loadTopLeaders = async () => {
    try {
      const leaders = await leaderboardService.getLeaderboard('overall', 3);
      setTopLeaders(leaders);
    } catch (error) {
      console.error('Error loading top leaders:', error);
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
                         (typeof analysis.processed_feedback === 'object' && analysis.processed_feedback && 'overallScore' in analysis.processed_feedback ? (analysis.processed_feedback as any).overallScore : 0) ||
                         (typeof analysis.raw_analysis === 'object' && analysis.raw_analysis && 'overallScore' in analysis.raw_analysis ? (analysis.raw_analysis as any).overallScore : 0) || 0;
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
          if (typeof feedback === 'object' && feedback && 'traitScores' in feedback && Array.isArray((feedback as any).traitScores)) {
            (feedback as any).traitScores.forEach((trait: any) => {
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

  const welcomeMsg = {
    title: `Welcome back, ${user?.firstName || 'Cadet'}!`,
    subtitle: "Continue your SSB psychological test preparation journey"
  };

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
      icon: BookOpen,
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
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to take tests.",
        variant: "destructive"
      });
      return;
    }
    
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
      case 'WAT': return Target;
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

  const headerActions = (
    <>
      <Button variant="outline" size="sm" onClick={() => navigate('/leaderboard')} className="hidden sm:flex">
        <Trophy className="h-4 w-4 mr-2" />
        Leaderboard
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/progress')} className="hidden sm:flex">
        <BarChart3 className="h-4 w-4 mr-2" />
        Progress
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/subscription')} className="hidden md:flex">
        <CreditCard className="h-4 w-4 mr-2" />
        Subscription
      </Button>
    </>
  );

  // Show signup prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <AppLayout title="Sign In Required">
        <div className="max-w-2xl mx-auto text-center py-16">
          <img src="/lovable-uploads/d3dbc8a1-8206-42d0-8106-40fc4d962c94.png" alt="PsychSirAi Logo" className="h-16 w-16 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Sign In to Access Your Dashboard
          </h2>
          <p className="text-gray-600 mb-8">
            Create your free account to start taking psychological tests and track your progress.
          </p>
          <div className="space-y-4">
            <SignInButton mode="modal">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Sign In / Sign Up
              </Button>
            </SignInButton>
            <p className="text-sm text-gray-500">
              Free plan includes 2 tests from each type after signup
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard" headerActions={headerActions}>
      <UploadFeatureAnnouncement storageKey="hasSeenUploadFeatureAnnouncement_dashboard" />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {welcomeMsg.title}
          </h2>
          <p className="text-gray-600 text-lg">
            {welcomeMsg.subtitle}
          </p>
          {isPrivilegedUser && (
            <p className="text-green-600 font-semibold mt-2">
              ✅ All features unlocked for testing
            </p>
          )}
        </div>

        {/* Profile Completion Banner */}
        {!isProfileComplete && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">Complete Your Profile</h3>
                  <p className="text-orange-800 text-sm mb-3">
                    Please complete your profile with phone number, target exam, and exam date to unlock personalized features and exam countdown.
                  </p>
                  <Button 
                    onClick={() => navigate('/profile')} 
                    variant="default"
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Complete Profile Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exam Countdown Widget */}
        {isProfileComplete && daysUntilExam !== null && profileData?.target_exam && (
          <Card className="mb-6 border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {profileData.target_exam} Exam Countdown
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Target Date: {new Date(profileData.target_exam_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-primary">
                    {daysUntilExam > 0 ? daysUntilExam : 0}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {daysUntilExam > 0 ? 'days remaining' : daysUntilExam === 0 ? 'Exam Today!' : 'days overdue'}
                  </p>
                  {daysUntilExam > 0 && daysUntilExam <= 30 && (
                    <div className="flex items-center gap-1 text-orange-600 text-xs mt-1">
                      <TrendingUp className="h-3 w-3" />
                      Final sprint!
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Status - only show for authenticated users */}
        {!subscription && !isPrivilegedUser && isAuthenticated && (
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

        {/* Quick Stats - only show for authenticated users */}
        {isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                <img src="/lovable-uploads/d3dbc8a1-8206-42d0-8106-40fc4d962c94.png" alt="PsychSirAi Logo" className="h-8 w-8" />
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
                <Trophy className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900 flex items-center">
                    🔥 {userStreak?.current_login_streak || 0}
                  </p>
                  <p className="text-gray-600">Day Streak</p>
                  {userStreak && (
                    <p className="text-xs text-muted-foreground">Best: {userStreak.best_login_streak}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {isPrivilegedUser ? 'Testing' : testLimits?.subscription_type === 'paid' ? 'Paid' : 'Free'}
                  </p>
                  <p className="text-gray-600">Plan Status</p>
                  {userStreak && (
                    <p className="text-xs text-muted-foreground">{userStreak.level_rank}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Top Leaders Section */}
        {topLeaders.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                Top Performers
              </CardTitle>
              <CardDescription>Leading candidates this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topLeaders.map((leader, index) => (
                  <div key={leader.user_id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{leader.display_name}</p>
                        {leader.city && <p className="text-sm text-gray-500">{leader.city}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{leader.total_points}</p>
                      <p className="text-sm text-gray-500">points</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => navigate('/leaderboard')}>
                  View Full Leaderboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Recent Activity - only show for authenticated users */}
        {isAuthenticated && (
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
        )}

        {/* Development Testing Component */}
        {isAuthenticated && (
          <StreakTester />
        )}

      </div>
    </AppLayout>
  );
};

export default Dashboard;
