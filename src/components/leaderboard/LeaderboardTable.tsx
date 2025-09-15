import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, MapPin, Flame } from 'lucide-react';
import { LeaderboardEntry } from '@/services/leaderboardService';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  title: string;
  currentUserId?: string;
  showCity?: boolean;
  showStreak?: boolean;
  category?: string;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  title,
  currentUserId,
  showCity = true,
  showStreak = true,
  category = 'overall'
}) => {
  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{position}</div>;
    }
  };

  const getRankBadgeColor = (position: number) => {
    if (position <= 3) return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
    if (position <= 10) return 'bg-blue-500 text-white';
    return 'bg-secondary';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatScore = (score: number) => {
    return score.toFixed(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const position = index + 1;
            const isCurrentUser = entry.user_id === currentUserId;
            
            return (
              <div
                key={entry.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isCurrentUser 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-muted/50'
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(position)}
                </div>

                {/* Avatar */}
                <Avatar className="w-10 h-10">
                  <AvatarImage src={entry.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(entry.display_name)}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                      {entry.display_name}
                      {isCurrentUser && (
                        <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                      )}
                    </span>
                  </div>
                  {showCity && entry.city && (
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{entry.city}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-4 text-sm">
                  {category === 'weekly' ? (
                    <div className="text-center">
                      <div className="font-bold text-blue-500">{entry.weekly_points}</div>
                      <div className="text-xs text-muted-foreground">Weekly Pts</div>
                    </div>
                  ) : category === 'monthly' ? (
                    <div className="text-center">
                      <div className="font-bold text-purple-500">{entry.monthly_points}</div>
                      <div className="text-xs text-muted-foreground">Monthly Pts</div>
                    </div>
                  ) : category === 'streaks' ? (
                    <div className="text-center">
                      <div className="font-bold text-orange-500 flex items-center space-x-1">
                        <Flame className="w-4 h-4" />
                        <span>{entry.current_streak}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Streak</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-center">
                        <div className="font-bold">{entry.total_points}</div>
                        <div className="text-xs text-muted-foreground">Points</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{entry.total_tests_completed}</div>
                        <div className="text-xs text-muted-foreground">Tests</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{formatScore(entry.average_score)}</div>
                        <div className="text-xs text-muted-foreground">Avg Score</div>
                      </div>
                    </>
                  )}
                  
                  {showStreak && category !== 'streaks' && (
                    <div className="text-center">
                      <div className="font-bold text-orange-500 flex items-center space-x-1">
                        <Flame className="w-3 h-3" />
                        <span>{entry.current_streak}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Streak</div>
                    </div>
                  )}
                </div>

                {/* Rank Badge */}
                <Badge className={getRankBadgeColor(position)}>
                  #{position}
                </Badge>
              </div>
            );
          })}
          
          {entries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No data available yet</p>
              <p className="text-sm">Complete some tests to see the leaderboard!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};