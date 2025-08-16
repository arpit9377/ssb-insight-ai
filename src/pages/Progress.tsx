
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Brain, Calendar, Award, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { AppLayout } from '@/components/layout/AppLayout';

const Progress = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [stats, setStats] = useState({
    totalTests: 0,
    averageScore: 0,
    testsThisWeek: 0,
    strongestTrait: '',
    weakestTrait: '',
    recentScores: [] as number[],
    testsByType: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProgressData();
    }
  }, [user]);

  const loadProgressData = async () => {
    try {
      // Get test sessions
      const { data: sessions } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      // Get AI analyses
      const { data: analyses } = await supabase
        .from('ai_analyses')
        .select('overall_score, trait_scores, created_at')
        .eq('user_id', user.id)
        .eq('analysis_type', 'session_summary')
        .order('created_at', { ascending: false });

      if (!sessions || !analyses) return;

      // Calculate stats
      const totalTests = sessions.length;
      
      // Average score
      const validScores = analyses.filter(a => a.overall_score > 0);
      const averageScore = validScores.length > 0 
        ? validScores.reduce((sum, a) => sum + a.overall_score, 0) / validScores.length 
        : 0;

      // Tests this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const testsThisWeek = sessions.filter(s => 
        new Date(s.completed_at || s.created_at) > weekAgo
      ).length;

      // Trait analysis
      const traitScoresMap = new Map<string, number[]>();
      analyses.forEach(analysis => {
        if (analysis.trait_scores && Array.isArray(analysis.trait_scores)) {
          analysis.trait_scores.forEach((trait: any) => {
            if (trait.trait && trait.score) {
              if (!traitScoresMap.has(trait.trait)) {
                traitScoresMap.set(trait.trait, []);
              }
              traitScoresMap.get(trait.trait)!.push(trait.score);
            }
          });
        }
      });

      // Find strongest and weakest traits
      let strongestTrait = '';
      let weakestTrait = '';
      let highestAvg = 0;
      let lowestAvg = 10;

      traitScoresMap.forEach((scores, trait) => {
        const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        if (avg > highestAvg) {
          highestAvg = avg;
          strongestTrait = trait;
        }
        if (avg < lowestAvg) {
          lowestAvg = avg;
          weakestTrait = trait;
        }
      });

      // Recent scores (last 5)
      const recentScores = validScores.slice(0, 5).map(a => a.overall_score);

      // Tests by type
      const testsByType = sessions.reduce((acc, session) => {
        acc[session.test_type] = (acc[session.test_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setStats({
        totalTests,
        averageScore: Math.round(averageScore * 10) / 10,
        testsThisWeek,
        strongestTrait,
        weakestTrait,
        recentScores,
        testsByType
      });
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout 
      title="Your Progress" 
      showBackButton={true}
      backTo="/dashboard"
    >
    <div className="bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Your Progress</h1>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTests}</div>
                <p className="text-xs text-muted-foreground">
                  Completed tests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageScore || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">
                  Out of 10
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.testsThisWeek}</div>
                <p className="text-xs text-muted-foreground">
                  Tests completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Trait</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">{stats.strongestTrait || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">
                  Strongest area
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Performance */}
          {stats.recentScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentScores.map((score, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="text-sm font-medium w-16">Test {index + 1}</div>
                      <div className="flex-1">
                        <ProgressBar value={(score / 10) * 100} className="h-2" />
                      </div>
                      <div className="text-sm font-bold w-12">{score}/10</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Types Breakdown */}
          {Object.keys(stats.testsByType).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Test Types Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(stats.testsByType).map(([testType, count]) => (
                    <div key={testType} className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{count}</div>
                      <div className="text-sm font-medium uppercase tracking-wider">
                        {testType}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trait Analysis */}
          {stats.strongestTrait && stats.weakestTrait && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Strongest Trait</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stats.strongestTrait}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This is your most developed characteristic based on your test results.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-600">Area for Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stats.weakestTrait}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Focus on developing this trait for overall improvement.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* No Data Message */}
          {stats.totalTests === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Progress Data Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start taking tests to see your progress and insights here.
                </p>
                <Button onClick={() => navigate('/tests')}>
                  Take Your First Test
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
    </AppLayout>
  );
};

export default Progress;
