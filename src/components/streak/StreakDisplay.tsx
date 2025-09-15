import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Trophy, Target, Calendar, Award } from 'lucide-react';
import { UserStreak } from '@/services/streakService';

interface StreakDisplayProps {
  streak: UserStreak;
  compact?: boolean;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ streak, compact = false }) => {
  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      'Cadet': 'bg-slate-500',
      'Private': 'bg-amber-600',
      'Corporal': 'bg-amber-500',
      'Sergeant': 'bg-orange-500',
      'Lieutenant': 'bg-blue-500',
      'Captain': 'bg-purple-500',
      'Major': 'bg-red-500',
      'Colonel': 'bg-emerald-500',
      'General': 'bg-gradient-to-r from-yellow-400 to-orange-500'
    };
    return colors[rank] || 'bg-gray-500';
  };

  const getBadgeIcon = (badge: string) => {
    const icons: Record<string, React.ReactNode> = {
      'streak_master': <Flame className="w-3 h-3" />,
      'top_performer': <Trophy className="w-3 h-3" />,
      'consistent_learner': <Target className="w-3 h-3" />,
      'daily_warrior': <Calendar className="w-3 h-3" />,
      'dedicated_student': <Award className="w-3 h-3" />
    };
    return icons[badge] || <Award className="w-3 h-3" />;
  };

  const getBadgeLabel = (badge: string) => {
    const labels: Record<string, string> = {
      'streak_master': 'Streak Master',
      'top_performer': 'Top Performer',
      'consistent_learner': 'Consistent Learner',
      'daily_warrior': 'Daily Warrior',
      'dedicated_student': 'Dedicated Student',
      'legend': 'Legend'
    };
    return labels[badge] || badge;
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center space-x-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="font-bold text-lg">{streak.current_login_streak}</span>
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
        <div className="flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium">{streak.total_points} pts</span>
        </div>
        <Badge className={`${getRankColor(streak.level_rank)} text-white`}>
          {streak.level_rank}
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <span>Your Streak</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streaks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">
              {streak.current_login_streak}
            </div>
            <div className="text-sm text-muted-foreground">Login Streak</div>
            <div className="text-xs text-muted-foreground">
              Best: {streak.best_login_streak}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {streak.current_test_streak}
            </div>
            <div className="text-sm text-muted-foreground">Test Streak</div>
            <div className="text-xs text-muted-foreground">
              Best: {streak.best_test_streak}
            </div>
          </div>
        </div>

        {/* Points and Rank */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Points</span>
            <span className="font-bold">{streak.total_points}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Rank</span>
            <Badge className={`${getRankColor(streak.level_rank)} text-white`}>
              {streak.level_rank}
            </Badge>
          </div>
        </div>

        {/* Progress to next rank */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to Next Rank</span>
            <span>75%</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>

        {/* Badges */}
        {streak.badges && Array.isArray(streak.badges) && streak.badges.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Badges</div>
            <div className="flex flex-wrap gap-2">
              {streak.badges.map((badge: string, index: number) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  {getBadgeIcon(badge)}
                  <span className="text-xs">{getBadgeLabel(badge)}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Streak Freezes */}
        <div className="text-xs text-muted-foreground text-center">
          Streak Freezes Available: {streak.streak_freeze_count}
        </div>
      </CardContent>
    </Card>
  );
};