import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, TrendingUp, Users, Zap, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Progress } from '@/components/ui/progress';

const OLQ_FACTORS = {
  'Planning & Organizing': {
    icon: Brain,
    color: 'bg-blue-500',
    olqs: [
      'Effective Intelligence',
      'Reasoning Ability', 
      'Organizing Ability',
      'Power of Expression'
    ]
  },
  'Social Adjustment': {
    icon: Users,
    color: 'bg-green-500',
    olqs: [
      'Social Adaptability',
      'Cooperation',
      'Sense of Responsibility'
    ]
  },
  'Social Effectiveness': {
    icon: TrendingUp,
    color: 'bg-purple-500',
    olqs: [
      'Initiative',
      'Self-Confidence',
      'Speed of Decision',
      'Ability to Influence the Group',
      'Liveliness'
    ]
  },
  'Dynamic': {
    icon: Zap,
    color: 'bg-orange-500',
    olqs: [
      'Determination',
      'Courage',
      'Stamina'
    ]
  }
};

const OLQAnalysis = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [olqData, setOlqData] = useState<Record<string, { score: number; count: number; descriptions: string[] }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOLQData();
    }
  }, [user]);

  const loadOLQData = async () => {
    try {
      const { data: analyses } = await supabase
        .from('ai_analyses')
        .select('trait_scores, created_at')
        .eq('user_id', user.id)
        .not('trait_scores', 'is', null)
        .order('created_at', { ascending: false });

      if (!analyses) return;

      const olqMap: Record<string, { score: number; count: number; descriptions: string[] }> = {};

      // Initialize all OLQs
      Object.values(OLQ_FACTORS).forEach(factor => {
        factor.olqs.forEach(olq => {
          olqMap[olq] = { score: 0, count: 0, descriptions: [] };
        });
      });

      // Process analyses
      analyses.forEach(analysis => {
        if (analysis.trait_scores && Array.isArray(analysis.trait_scores)) {
          analysis.trait_scores.forEach((trait: any) => {
            if (trait.trait && olqMap[trait.trait] !== undefined) {
              olqMap[trait.trait].score += trait.score || 0;
              olqMap[trait.trait].count += 1;
              if (trait.description) {
                olqMap[trait.trait].descriptions.push(trait.description);
              }
            }
          });
        }
      });

      // Calculate averages
      Object.keys(olqMap).forEach(olq => {
        if (olqMap[olq].count > 0) {
          olqMap[olq].score = olqMap[olq].score / olqMap[olq].count;
        }
      });

      setOlqData(olqMap);
    } catch (error) {
      console.error('Error loading OLQ data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFactorAverage = (factor: keyof typeof OLQ_FACTORS) => {
    const olqs = OLQ_FACTORS[factor].olqs;
    const scores = olqs.map(olq => olqData[olq]?.score || 0);
    const validScores = scores.filter(score => score > 0);
    return validScores.length > 0 ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
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
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Officer Like Qualities (OLQ) Analysis</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(OLQ_FACTORS).map(([factorName, factor]) => {
              const IconComponent = factor.icon;
              const factorAverage = getFactorAverage(factorName as keyof typeof OLQ_FACTORS);
              
              return (
                <Card key={factorName} className="h-fit">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${factor.color} text-white`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{factorName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold">
                            {factorAverage > 0 ? factorAverage.toFixed(1) : 'N/A'}
                          </span>
                          {factorAverage > 0 && <span className="text-sm text-muted-foreground">/10</span>}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {factor.olqs.map(olq => {
                      const olqScore = olqData[olq]?.score || 0;
                      const olqCount = olqData[olq]?.count || 0;
                      
                      return (
                        <div key={olq} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{olq}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {olqScore > 0 ? olqScore.toFixed(1) : 'Not analyzed'}
                              </span>
                              {olqCount > 0 && (
                                <span className="text-xs text-muted-foreground">({olqCount} tests)</span>
                              )}
                            </div>
                          </div>
                          <Progress 
                            value={olqScore > 0 ? (olqScore / 10) * 100 : 0} 
                            className="h-2"
                          />
                          {olqData[olq]?.descriptions.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {olqData[olq].descriptions[olqData[olq].descriptions.length - 1]}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>OLQ Development Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-700">Strengths to Leverage</h4>
                  {Object.entries(olqData)
                    .filter(([_, data]) => data.score >= 7)
                    .slice(0, 3)
                    .map(([olq, data]) => (
                      <div key={olq} className="text-sm text-green-600">
                        • {olq} ({data.score.toFixed(1)}/10)
                      </div>
                    ))}
                  {Object.entries(olqData).filter(([_, data]) => data.score >= 7).length === 0 && (
                    <p className="text-sm text-muted-foreground">Take more tests to identify strengths</p>
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-orange-700">Areas for Development</h4>
                  {Object.entries(olqData)
                    .filter(([_, data]) => data.score > 0 && data.score < 6)
                    .slice(0, 3)
                    .map(([olq, data]) => (
                      <div key={olq} className="text-sm text-orange-600">
                        • {olq} ({data.score.toFixed(1)}/10)
                      </div>
                    ))}
                  {Object.entries(olqData).filter(([_, data]) => data.score > 0 && data.score < 6).length === 0 && (
                    <p className="text-sm text-muted-foreground">Take more tests to identify development areas</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OLQAnalysis;