import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { StreakDisplay } from '@/components/streak/StreakDisplay';
import { leaderboardService, LeaderboardEntry, LeaderboardCategory } from '@/services/leaderboardService';
import { streakService, UserStreak } from '@/services/streakService';
import { useUser } from '@clerk/clerk-react';
import { Trophy, Search, Crown, Calendar, TrendingUp, Flame, Target, Users, Medal } from 'lucide-react';
import { toast } from 'sonner';

const Leaderboard: React.FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>('overall');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
  const [userRank, setUserRank] = useState<{ rank: number; total: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboardData();
    if (user) {
      loadUserData();
    }
  }, [activeTab, user]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      const data = await leaderboardService.getLeaderboard(activeTab, 50);
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast.error('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!user?.id) return;

    try {
      const [streak, rank] = await Promise.all([
        streakService.getUserStreak(user.id),
        leaderboardService.getUserRank(user.id, activeTab)
      ]);

      setUserStreak(streak);
      setUserRank(rank);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await leaderboardService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const getTabIcon = (tab: LeaderboardCategory) => {
    const icons = {
      overall: Trophy,
      weekly: Calendar,
      monthly: TrendingUp,
      streaks: Flame,
      tat: Target,
      ppdt: Users,
      wat: Medal,
      srt: Crown
    };
    return icons[tab] || Trophy;
  };

  const stats = [
    {
      title: 'Your Rank',
      value: userRank ? `#${userRank.rank}` : '--',
      subtitle: userRank ? `of ${userRank.total} users` : 'Not ranked yet',
      icon: Trophy,
      color: 'text-yellow-500'
    },
    {
      title: 'Current Streak',
      value: userStreak ? `${userStreak.current_login_streak}` : '0',
      subtitle: 'days in a row',
      icon: Flame,
      color: 'text-orange-500'
    },
    {
      title: 'Total Points',
      value: userStreak ? userStreak.total_points.toLocaleString() : '0',
      subtitle: 'points earned',
      icon: Medal,
      color: 'text-blue-500'
    },
    {
      title: 'Rank Title',
      value: userStreak ? userStreak.level_rank : 'Cadet',
      subtitle: 'military rank',
      icon: Crown,
      color: 'text-purple-500'
    }
  ];

  return (
    <AppLayout 
      title="Leaderboard"
    >
      <div className="space-y-6">
        {/* User Stats Overview */}
        {user && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.subtitle}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* User Streak Display */}
        {userStreak && (
          <StreakDisplay streak={userStreak} compact />
        )}

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Find Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline">
                Search
              </Button>
              {searchResults.length > 0 && (
                <Button onClick={clearSearch} variant="ghost">
                  Clear
                </Button>
              )}
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-4">
                <LeaderboardTable
                  entries={searchResults}
                  title="Search Results"
                  currentUserId={user?.id}
                  category={activeTab}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span>Leaderboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LeaderboardCategory)}>
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                {(['overall', 'weekly', 'monthly', 'streaks', 'tat', 'ppdt', 'wat', 'srt'] as LeaderboardCategory[]).map((tab) => {
                  const Icon = getTabIcon(tab);
                  return (
                    <TabsTrigger key={tab} value={tab} className="flex items-center space-x-1">
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{leaderboardService.getCategoryDisplayName(tab).split(' ')[0]}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {(['overall', 'weekly', 'monthly', 'streaks', 'tat', 'ppdt', 'wat', 'srt'] as LeaderboardCategory[]).map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-6">
                  <LeaderboardTable
                    entries={leaderboardData}
                    title={leaderboardService.getCategoryDisplayName(tab)}
                    currentUserId={user?.id}
                    category={tab}
                    showStreak={tab !== 'streaks'}
                    userRank={userRank}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Competitive Features Coming Soon */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <h4 className="font-semibold">Weekly Tournaments</h4>
                <p className="text-sm text-muted-foreground">Compete in special weekly competitions</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <h4 className="font-semibold">Friend Challenges</h4>
                <p className="text-sm text-muted-foreground">Challenge friends to beat your scores</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Medal className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <h4 className="font-semibold">Achievement System</h4>
                <p className="text-sm text-muted-foreground">Unlock special badges and rewards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Leaderboard;