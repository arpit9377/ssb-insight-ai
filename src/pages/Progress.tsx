
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

          {/* ... keep existing code (all sections) ... */}

        </div>
      </div>
    </div>
    </AppLayout>
  );
};

export default Progress;
