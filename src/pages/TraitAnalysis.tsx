import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Users, Zap, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

const TRAIT_CATEGORIES = {
  'Leadership & Social': {
    icon: Target,
    color: 'bg-blue-500',
    traits: [
      'Leadership',
      'Initiative', 
      'Social Skills',
      'Teamwork'
    ]
  },
  'Communication & Intelligence': {
    icon: Users,
    color: 'bg-green-500',
    traits: [
      'Communication',
      'Intelligence',
      'Problem Solving',
      'Planning'
    ]
  },
  'Personal Qualities': {
    icon: TrendingUp,
    color: 'bg-purple-500',
    traits: [
      'Confidence',
      'Emotional Stability',
      'Adaptability',
      'Responsibility'
    ]
  },
  'Action Oriented': {
    icon: Zap,
    color: 'bg-orange-500',
    traits: [
      'Decision Making',
      'Courage',
      'Determination'
    ]
  }
};

const TraitAnalysis = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [traitData, setTraitData] = useState<Record<string, { score: number; count: number; descriptions: string[] }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTraitData();
    }
  }, [user]);

  const loadTraitData = async () => {
    try {
      const { data: analyses } = await supabase
        .from('ai_analyses')
        .select('trait_scores, created_at')
        .eq('user_id', user.id)
        .not('trait_scores', 'is', null)
        .order('created_at', { ascending: false });

      if (!analyses) return;

      const traitMap: Record<string, { score: number; count: number; descriptions: string[] }> = {};

      // Initialize all traits
      Object.values(TRAIT_CATEGORIES).forEach(category => {
        category.traits.forEach(trait => {
          traitMap[trait] = { score: 0, count: 0, descriptions: [] };
        });
      });

      // Process analyses
      analyses.forEach(analysis => {
        if (analysis.trait_scores && Array.isArray(analysis.trait_scores)) {
          analysis.trait_scores.forEach((trait: any) => {
            if (trait.trait && traitMap[trait.trait] !== undefined) {
              traitMap[trait.trait].score += trait.score || 0;
              traitMap[trait.trait].count += 1;
              if (trait.description) {
                traitMap[trait.trait].descriptions.push(trait.description);
              }
            }
          });
        }
      });

      // Calculate averages
      Object.keys(traitMap).forEach(trait => {
        if (traitMap[trait].count > 0) {
          traitMap[trait].score = traitMap[trait].score / traitMap[trait].count;
        }
      });

      setTraitData(traitMap);
    } catch (error) {
      console.error('Error loading trait data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryAverage = (category: keyof typeof TRAIT_CATEGORIES) => {
    const traits = TRAIT_CATEGORIES[category].traits;
    const scores = traits.map(trait => traitData[trait]?.score || 0);
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
            <h1 className="text-3xl font-bold">Trait Analysis</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(TRAIT_CATEGORIES).map(([categoryName, category]) => {
              const IconComponent = category.icon;
              const categoryAverage = getCategoryAverage(categoryName as keyof typeof TRAIT_CATEGORIES);
              
              return (
                <Card key={categoryName} className="h-fit">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.color} text-white`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{categoryName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold">
                            {categoryAverage > 0 ? categoryAverage.toFixed(1) : 'N/A'}
                          </span>
                          {categoryAverage > 0 && <span className="text-sm text-muted-foreground">/10</span>}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {category.traits.map(trait => {
                      const traitScore = traitData[trait]?.score || 0;
                      const traitCount = traitData[trait]?.count || 0;
                      
                      return (
                        <div key={trait} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{trait}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {traitScore > 0 ? traitScore.toFixed(1) : 'Not analyzed'}
                              </span>
                              {traitCount > 0 && (
                                <span className="text-xs text-muted-foreground">({traitCount} tests)</span>
                              )}
                            </div>
                          </div>
                          <Progress 
                            value={traitScore > 0 ? (traitScore / 10) * 100 : 0} 
                            className="h-2"
                          />
                          {traitData[trait]?.descriptions.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {traitData[trait].descriptions[traitData[trait].descriptions.length - 1]}
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
              <CardTitle>Trait Development Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-700">Strengths to Leverage</h4>
                  {Object.entries(traitData)
                    .filter(([_, data]) => data.score >= 7)
                    .slice(0, 3)
                    .map(([trait, data]) => (
                      <div key={trait} className="text-sm text-green-600">
                        • {trait} ({data.score.toFixed(1)}/10)
                      </div>
                    ))}
                  {Object.entries(traitData).filter(([_, data]) => data.score >= 7).length === 0 && (
                    <p className="text-sm text-muted-foreground">Take more tests to identify strengths</p>
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-orange-700">Areas for Development</h4>
                  {Object.entries(traitData)
                    .filter(([_, data]) => data.score > 0 && data.score < 6)
                    .slice(0, 3)
                    .map(([trait, data]) => (
                      <div key={trait} className="text-sm text-orange-600">
                        • {trait} ({data.score.toFixed(1)}/10)
                      </div>
                    ))}
                  {Object.entries(traitData).filter(([_, data]) => data.score > 0 && data.score < 6).length === 0 && (
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

export default TraitAnalysis;