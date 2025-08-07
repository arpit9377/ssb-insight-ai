
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Target, Brain, Calendar, Award, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Progress as ProgressBar } from '@/components/ui/progress';

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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Your Progress</h1>
          </div>

          {/* Overview Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTests}</div>
                <p className="text-xs text-muted-foreground">
                  Completed assessments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageScore}/10</div>
                <p className="text-xs text-muted-foreground">
                  Overall performance
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
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <ProgressBar value={(stats.averageScore / 10) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {Math.round((stats.averageScore / 10) * 100)}% to excellence
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* OLQ Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  OLQ Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.strongestTrait && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800">Strongest OLQ</h4>
                    <p className="text-green-700 capitalize">{stats.strongestTrait}</p>
                  </div>
                )}
                {stats.weakestTrait && (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-800">Area for Improvement</h4>
                    <p className="text-orange-700 capitalize">{stats.weakestTrait}</p>
                  </div>
                )}
                {!stats.strongestTrait && !stats.weakestTrait && (
                  <p className="text-muted-foreground">Take more tests to see OLQ analysis</p>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/olq-analysis')}
                  className="w-full"
                >
                  View Detailed OLQ Analysis
                </Button>
              </CardContent>
            </Card>

            {/* Test Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Test Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.testsByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(count / stats.totalTests) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                    </div>
                  ))}
                  {Object.keys(stats.testsByType).length === 0 && (
                    <p className="text-muted-foreground">No tests completed yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Performance */}
          {stats.recentScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 h-32">
                  {stats.recentScores.map((score, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <div 
                        className="bg-primary rounded-t w-8 min-h-[4px]"
                        style={{ height: `${(score / 10) * 100}px` }}
                      />
                      <span className="text-xs text-muted-foreground">{score}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Your last {stats.recentScores.length} test scores
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Progress;
