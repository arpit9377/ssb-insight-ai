import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  display_name: string;
  total_tests_completed: number;
  average_score: number;
  total_points: number;
  current_streak: number;
  weekly_points: number;
  monthly_points: number;
  city: string | null;
  avatar_url: string | null;
  rank_position: number | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export type LeaderboardCategory = 'overall' | 'weekly' | 'monthly' | 'streaks' | 'tat' | 'ppdt' | 'wat' | 'srt';

class LeaderboardService {
  async getLeaderboard(category: LeaderboardCategory = 'overall', limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      // Sync data first to ensure we have latest points
      await this.syncLeaderboardData();

      let query = supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('category', category)
        .limit(limit);

      // Order by different criteria based on category
      switch (category) {
        case 'weekly':
          query = query.order('weekly_points', { ascending: false }).order('total_points', { ascending: false });
          break;
        case 'monthly':
          query = query.order('monthly_points', { ascending: false }).order('total_points', { ascending: false });
          break;
        case 'streaks':
          query = query.order('current_streak', { ascending: false }).order('total_points', { ascending: false });
          break;
        default:
          query = query.order('total_points', { ascending: false }).order('created_at', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting leaderboard:', error);
        return [];
      }

      // Add rank positions based on sort order
      const rankedData = (data || []).map((entry, index) => ({
        ...entry,
        rank_position: index + 1
      }));

      return rankedData;
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      return [];
    }
  }

  async getUserRank(userId: string, category: LeaderboardCategory = 'overall'): Promise<{ rank: number; total: number } | null> {
    try {
      // Sync data first
      await this.syncLeaderboardData();

      // Get all entries for this category, ordered properly
      let query = supabase
        .from('leaderboard_entries')
        .select('user_id, total_points, weekly_points, monthly_points, current_streak')
        .eq('category', category);

      // Order by the same criteria as getLeaderboard
      switch (category) {
        case 'weekly':
          query = query.order('weekly_points', { ascending: false }).order('total_points', { ascending: false });
          break;
        case 'monthly':
          query = query.order('monthly_points', { ascending: false }).order('total_points', { ascending: false });
          break;
        case 'streaks':
          query = query.order('current_streak', { ascending: false }).order('total_points', { ascending: false });
          break;
        default:
          query = query.order('total_points', { ascending: false }).order('created_at', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting leaderboard for rank calculation:', error);
        return null;
      }

      // Find user's position in the ordered list
      const userIndex = data?.findIndex(entry => entry.user_id === userId);
      
      if (userIndex === -1 || userIndex === undefined) {
        return null;
      }

      return {
        rank: userIndex + 1,
        total: data?.length || 0
      };
    } catch (error) {
      console.error('Error in getUserRank:', error);
      return null;
    }
  }

  async updateUserStats(userId: string, stats: {
    testsCompleted?: number;
    averageScore?: number;
    totalPoints?: number;
    currentStreak?: number;
    weeklyPoints?: number;
    monthlyPoints?: number;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('leaderboard_entries')
        .upsert({
          user_id: userId,
          display_name: 'User', // This should be updated with actual name
          total_tests_completed: stats.testsCompleted || 0,
          average_score: stats.averageScore || 0,
          total_points: stats.totalPoints || 0,
          current_streak: stats.currentStreak || 0,
          weekly_points: stats.weeklyPoints || 0,
          monthly_points: stats.monthlyPoints || 0,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating user stats:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserStats:', error);
      return false;
    }
  }

  async getTopPerformers(testType?: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const category = testType || 'overall';
      return await this.getLeaderboard(category as LeaderboardCategory, limit);
    } catch (error) {
      console.error('Error in getTopPerformers:', error);
      return [];
    }
  }

  async getWeeklyChampions(limit: number = 10): Promise<LeaderboardEntry[]> {
    return await this.getLeaderboard('weekly', limit);
  }

  async getStreakLeaders(limit: number = 10): Promise<LeaderboardEntry[]> {
    return await this.getLeaderboard('streaks', limit);
  }

  async searchUsers(query: string, limit: number = 20): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .ilike('display_name', `%${query}%`)
        .limit(limit);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return [];
    }
  }

  getPointsForActivity(activity: string): number {
    const pointsMap: Record<string, number> = {
      'test_completed': 100,
      'daily_login': 10,
      'streak_milestone': 50,
      'perfect_score': 200,
      'first_test': 25,
      'profile_completed': 30
    };

    return pointsMap[activity] || 0;
  }

  async syncLeaderboardData(): Promise<void> {
    try {
      // Get all user streaks with profiles data
      const { data: streaks, error: streaksError } = await supabase
        .from('user_streaks')
        .select(`
          *,
          profiles!inner(display_name:full_name, city, avatar_url)
        `);

      if (streaksError) {
        console.error('Error getting user streaks for sync:', streaksError);
        return;
      }

      // Get test statistics for each user
      const { data: userStats, error: statsError } = await supabase
        .from('user_responses')
        .select('user_id, test_type, trait_scores');

      const testCompletionStats = this.calculateTestStats(userStats || []);

      // Sync each user's data to ALL leaderboard categories
      const categories: LeaderboardCategory[] = ['overall', 'weekly', 'monthly', 'streaks'];
      
      for (const streak of streaks || []) {
        const profile = (streak as any).profiles;
        const displayName = profile?.display_name || 'Anonymous User';
        const userTestStats = testCompletionStats[streak.user_id] || { total: 0, avgScore: 0 };
        
        // Calculate weekly/monthly points (simplified - in real app, would be time-based)
        const weeklyPoints = Math.floor(streak.total_points * 0.1); // 10% of total as weekly
        const monthlyPoints = Math.floor(streak.total_points * 0.3); // 30% of total as monthly
        const currentStreak = Math.max(streak.current_login_streak, streak.current_test_streak);

        // Upsert for each category
        for (const category of categories) {
          await supabase
            .from('leaderboard_entries')
            .upsert({
              user_id: streak.user_id,
              display_name: displayName,
              total_points: streak.total_points,
              current_streak: currentStreak,
              weekly_points: weeklyPoints,
              monthly_points: monthlyPoints,
              city: profile?.city,
              avatar_url: profile?.avatar_url,
              category: category,
              total_tests_completed: userTestStats.total,
              average_score: userTestStats.avgScore,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,category'
            });
        }
      }

      console.log('✅ Leaderboard data synced successfully for all categories');
    } catch (error) {
      console.error('Error syncing leaderboard data:', error);
    }
  }

  private calculateTestStats(responses: any[]): Record<string, { total: number; avgScore: number }> {
    const stats: Record<string, { scores: number[]; count: number }> = {};

    responses.forEach(response => {
      if (!stats[response.user_id]) {
        stats[response.user_id] = { scores: [], count: 0 };
      }
      
      stats[response.user_id].count++;
      
      // Extract score from trait_scores if available
      if (response.trait_scores?.overall_score) {
        stats[response.user_id].scores.push(response.trait_scores.overall_score);
      }
    });

    // Calculate averages
    const result: Record<string, { total: number; avgScore: number }> = {};
    Object.keys(stats).forEach(userId => {
      const userStats = stats[userId];
      const avgScore = userStats.scores.length > 0
        ? userStats.scores.reduce((a, b) => a + b, 0) / userStats.scores.length
        : 0;
      
      result[userId] = {
        total: userStats.count,
        avgScore: Math.round(avgScore * 10) / 10
      };
    });

    return result;
  }

  getCategoryDisplayName(category: LeaderboardCategory): string {
    const displayNames: Record<LeaderboardCategory, string> = {
      'overall': 'Overall Champions',
      'weekly': 'Weekly Leaders',
      'monthly': 'Monthly Stars',
      'streaks': 'Streak Masters',
      'tat': 'TAT Experts',
      'ppdt': 'PPDT Specialists',
      'wat': 'WAT Champions',
      'srt': 'SRT Masters'
    };

    return displayNames[category] || 'Leaderboard';
  }
}

export const leaderboardService = new LeaderboardService();