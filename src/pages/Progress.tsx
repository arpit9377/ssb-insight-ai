
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Calendar, Award, BarChart3, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

const Progress = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [stats, setStats] = useState({
    totalTests: 0,
    averageScore: 0,
    testsThisWeek: 0,
    testsThisMonth: 0,
    strongestTrait: '',
    weakestTrait: '',
    recentScores: [] as number[],
    testsByType: {} as Record<string, number>,
    weeklyProgress: [] as Array<{ week: string, tests: number, avgScore: number }>,
    traitBreakdown: [] as Array<{ trait: string, avgScore: number, count: number }>,
    improvementRate: null as number | null,
    scoreChartData: [] as Array<{ test: string, score: number }>,
    testTypeChartData: [] as Array<{ type: string, count: number }>,
    radarChartData: [] as Array<{ trait: string, score: number, fullMark: number }>
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

      // Tests this week and month
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      
      const testsThisWeek = sessions.filter(s => 
        new Date(s.completed_at || s.created_at) > weekAgo
      ).length;
      
      const testsThisMonth = sessions.filter(s => 
        new Date(s.completed_at || s.created_at) > monthAgo
      ).length;

      // Trait analysis with type safety
      interface TraitScore {
        trait: string;
        score: number;
      }
      
      const traitScoresMap = new Map<string, number[]>();
      analyses.forEach(analysis => {
        if (analysis.trait_scores && Array.isArray(analysis.trait_scores)) {
          analysis.trait_scores.forEach((trait: TraitScore | any) => {
            if (trait && typeof trait === 'object' && 'trait' in trait && 'score' in trait) {
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

      // Weekly progress (last 4 weeks)
      const weeklyProgress = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        
        const weekSessions = sessions.filter(s => {
          const date = new Date(s.completed_at || s.created_at);
          return date >= weekStart && date <= weekEnd;
        });
        
        const weekAnalyses = analyses.filter(a => {
          const date = new Date(a.created_at);
          return date >= weekStart && date <= weekEnd && a.overall_score > 0;
        });
        
        const avgScore = weekAnalyses.length > 0 
          ? weekAnalyses.reduce((sum, a) => sum + a.overall_score, 0) / weekAnalyses.length 
          : 0;
          
        weeklyProgress.push({
          week: `Week ${4 - i}`,
          tests: weekSessions.length,
          avgScore: Math.round(avgScore * 10) / 10
        });
      }

      // Trait breakdown
      const traitBreakdown: Array<{ trait: string, avgScore: number, count: number }> = [];
      traitScoresMap.forEach((scores, trait) => {
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        traitBreakdown.push({
          trait,
          avgScore: Math.round(avgScore * 10) / 10,
          count: scores.length
        });
      });
      traitBreakdown.sort((a, b) => b.avgScore - a.avgScore);

      // Improvement rate (compare first vs recent scores)
      let improvementRate: number | null = null;
      if (validScores.length >= 3) {
        const firstThree = validScores.slice(-3);
        const lastThree = validScores.slice(0, 3);
        const firstAvg = firstThree.reduce((sum, a) => sum + a.overall_score, 0) / firstThree.length;
        const lastAvg = lastThree.reduce((sum, a) => sum + a.overall_score, 0) / lastThree.length;
        if (firstAvg > 0) {
          improvementRate = Math.round(((lastAvg - firstAvg) / firstAvg) * 100);
        }
      }

      // Prepare chart data for score trends
      const scoreChartData = validScores.slice(0, 10).reverse().map((analysis, index) => ({
        test: `Test ${index + 1}`,
        score: analysis.overall_score
      }));

      // Prepare chart data for test types
      const testTypeChartData = Object.entries(testsByType).map(([type, count]) => ({
        type: type.toUpperCase(),
        count: count
      }));

      // Prepare radar chart data for traits
      const radarChartData = traitBreakdown.slice(0, 8).map(trait => ({
        trait: trait.trait.length > 15 ? trait.trait.substring(0, 15) + '...' : trait.trait,
        score: trait.avgScore,
        fullMark: 10
      }));

      setStats({
        totalTests,
        averageScore: Math.round(averageScore * 10) / 10,
        testsThisWeek,
        testsThisMonth,
        strongestTrait,
        weakestTrait,
        recentScores,
        testsByType,
        weeklyProgress,
        traitBreakdown,
        improvementRate,
        scoreChartData,
        testTypeChartData,
        radarChartData
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
    <TooltipProvider>
    <div className="bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Your Progress</h1>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="traits">Traits</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Overview */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
                    <CardTitle className="text-sm font-medium">This Month</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.testsThisMonth}</div>
                    <p className="text-xs text-muted-foreground">
                      Monthly progress
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-1">
                      Improvement
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Compares your last 3 tests vs first 3 tests</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      stats.improvementRate === null ? '' :
                      stats.improvementRate > 0 ? 'text-green-600' : 
                      stats.improvementRate < 0 ? 'text-red-600' : ''
                    }`}>
                      {stats.improvementRate === null ? 'N/A' : 
                       `${stats.improvementRate > 0 ? '+' : ''}${stats.improvementRate}%`}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.improvementRate === null ? 'Need 3+ tests' : 'Recent progress'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Test Types Bar Chart */}
              {stats.testTypeChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Test Types Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.testTypeChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Test Types Breakdown */}
              {Object.keys(stats.testsByType).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Test Types Summary
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
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {/* Score Trend Chart */}
              {stats.scoreChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Score Trend Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats.scoreChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="test" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

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
                          <div className="text-sm font-medium w-20">Test {index + 1}</div>
                          <div className="flex-1">
                            <ProgressBar value={(score / 10) * 100} className="h-3" />
                          </div>
                          <div className="text-sm font-bold w-12">{score}/10</div>
                          <Badge variant={score >= 7 ? 'default' : score >= 5 ? 'secondary' : 'destructive'}>
                            {score >= 7 ? 'Good' : score >= 5 ? 'Fair' : 'Needs Work'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Weekly Progress */}
              {stats.weeklyProgress.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.weeklyProgress.map((week, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <div className="font-medium">{week.week}</div>
                            <div className="text-sm text-muted-foreground">{week.tests} tests</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{week.avgScore || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">Avg Score</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="traits" className="space-y-6">
              {/* Radar Chart for Traits */}
              {stats.radarChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Trait Analysis Radar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={stats.radarChartData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="trait" />
                        <PolarRadiusAxis angle={90} domain={[0, 10]} />
                        <Radar 
                          name="Your Score" 
                          dataKey="score" 
                          stroke="#8b5cf6" 
                          fill="#8b5cf6" 
                          fillOpacity={0.6}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Trait Analysis */}
              {stats.strongestTrait && stats.weakestTrait && (
                <div className="grid gap-6 md:grid-cols-2 mb-6">
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

              {/* Detailed Trait Breakdown */}
              {stats.traitBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Trait Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.traitBreakdown.map((trait, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{trait.trait}</span>
                              <span className="text-sm text-muted-foreground">{trait.avgScore}/10 ({trait.count} tests)</span>
                            </div>
                            <ProgressBar value={(trait.avgScore / 10) * 100} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              {stats.totalTests > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800">Test Frequency</h4>
                        <p className="text-sm text-blue-600 mt-1">
                          You average {Math.round((stats.totalTests / Math.max(1, Math.ceil(stats.totalTests / 7))) * 10) / 10} tests per week
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-800">Consistency</h4>
                        <p className="text-sm text-green-600 mt-1">
                          {stats.testsThisWeek >= 2 ? 'Great consistency!' : 'Try to maintain regular practice'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* No Data Message */}
          {stats.totalTests === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <img src="/lovable-uploads/d3dbc8a1-8206-42d0-8106-40fc4d962c94.png" alt="PsychSirAi Logo" className="h-12 w-12 mx-auto mb-4" />
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
    </TooltipProvider>
    </AppLayout>
  );
};

export default Progress;
