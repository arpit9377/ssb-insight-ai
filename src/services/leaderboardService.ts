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
      let query = supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('category', category)
        .limit(limit);

      // Order by different criteria based on category
      switch (category) {
        case 'weekly':
          query = query.order('weekly_points', { ascending: false });
          break;
        case 'monthly':
          query = query.order('monthly_points', { ascending: false });
          break;
        case 'streaks':
          query = query.order('current_streak', { ascending: false });
          break;
        default:
          query = query.order('total_points', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting leaderboard:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      return [];
    }
  }

  async getUserRank(userId: string, category: LeaderboardCategory = 'overall'): Promise<{ rank: number; total: number } | null> {
    try {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('rank_position')
        .eq('user_id', userId)
        .eq('category', category)
        .single();

      if (error) {
        console.error('Error getting user rank:', error);
        return null;
      }

      // Also get total count
      const { count } = await supabase
        .from('leaderboard_entries')
        .select('*', { count: 'exact', head: true })
        .eq('category', category);

      return {
        rank: data.rank_position || 0,
        total: count || 0
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