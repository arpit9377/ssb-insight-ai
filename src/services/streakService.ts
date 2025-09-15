import { supabase } from '@/integrations/supabase/client';

export interface UserStreak {
  id: string;
  user_id: string;
  current_login_streak: number;
  best_login_streak: number;
  current_test_streak: number;
  best_test_streak: number;
  last_login_date: string | null;
  last_test_date: string | null;
  streak_freeze_count: number;
  total_points: number;
  level_rank: string;
  badges: any;
  created_at: string;
  updated_at: string;
}

export interface StreakUpdate {
  currentStreak: number;
  bestStreak: number;
  pointsEarned: number;
  levelUp?: boolean;
  newBadges?: string[];
}

class StreakService {
  async getUserStreak(userId: string): Promise<UserStreak | null> {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting user streak:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserStreak:', error);
      return null;
    }
  }

  async updateLoginStreak(userId: string): Promise<StreakUpdate | null> {
    try {
      // Call the database function to update streak
      const { data, error } = await supabase.rpc('update_user_streak', {
        target_user_id: userId,
        activity_type: 'login'
      });

      if (error) {
        console.error('Error updating login streak:', error);
        return null;
      }

      // Get updated streak data
      const updatedStreak = await this.getUserStreak(userId);
      if (!updatedStreak) return null;

      return {
        currentStreak: updatedStreak.current_login_streak,
        bestStreak: updatedStreak.best_login_streak,
        pointsEarned: updatedStreak.current_login_streak * 10,
        levelUp: this.checkLevelUp(updatedStreak.total_points),
        newBadges: this.checkNewBadges(updatedStreak)
      };
    } catch (error) {
      console.error('Error in updateLoginStreak:', error);
      return null;
    }
  }

  async updateTestStreak(userId: string): Promise<StreakUpdate | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get current streak data
      let currentStreak = await this.getUserStreak(userId);
      
      if (!currentStreak) {
        // Create new streak record
        const { data, error } = await supabase
          .from('user_streaks')
          .insert({
            user_id: userId,
            current_test_streak: 1,
            best_test_streak: 1,
            last_test_date: today,
            total_points: 20
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating test streak:', error);
          return null;
        }

        return {
          currentStreak: 1,
          bestStreak: 1,
          pointsEarned: 20,
          levelUp: false,
          newBadges: []
        };
      }

      // Update existing streak
      const lastTestDate = currentStreak.last_test_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newTestStreak = 1;
      if (lastTestDate === yesterdayStr) {
        newTestStreak = currentStreak.current_test_streak + 1;
      } else if (lastTestDate === today) {
        newTestStreak = currentStreak.current_test_streak;
      }

      const newBestStreak = Math.max(currentStreak.best_test_streak, newTestStreak);
      const pointsEarned = newTestStreak * 20;

      const { data, error } = await supabase
        .from('user_streaks')
        .update({
          current_test_streak: newTestStreak,
          best_test_streak: newBestStreak,
          last_test_date: today,
          total_points: currentStreak.total_points + pointsEarned,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating test streak:', error);
        return null;
      }

      return {
        currentStreak: newTestStreak,
        bestStreak: newBestStreak,
        pointsEarned,
        levelUp: this.checkLevelUp(data.total_points),
        newBadges: this.checkNewBadges(data)
      };
    } catch (error) {
      console.error('Error in updateTestStreak:', error);
      return null;
    }
  }

  private checkLevelUp(totalPoints: number): boolean {
    // Simple level up logic based on points
    const levels = [
      { rank: 'Cadet', minPoints: 0 },
      { rank: 'Private', minPoints: 500 },
      { rank: 'Corporal', minPoints: 1000 },
      { rank: 'Sergeant', minPoints: 1500 },
      { rank: 'Lieutenant', minPoints: 2000 },
      { rank: 'Captain', minPoints: 3000 },
      { rank: 'Major', minPoints: 5000 },
      { rank: 'Colonel', minPoints: 8000 },
      { rank: 'General', minPoints: 12000 }
    ];

    // Implementation would check if user just crossed a threshold
    return false; // Simplified for now
  }

  private checkNewBadges(streak: UserStreak): string[] {
    const newBadges: string[] = [];
    const currentBadges = streak.badges || [];

    // Check for streak milestones
    if (streak.current_login_streak >= 7 && !currentBadges.includes('week_warrior')) {
      newBadges.push('week_warrior');
    }
    if (streak.current_login_streak >= 30 && !currentBadges.includes('month_master')) {
      newBadges.push('month_master');
    }
    if (streak.current_test_streak >= 10 && !currentBadges.includes('test_champion')) {
      newBadges.push('test_champion');
    }

    return newBadges;
  }

  async getStreakLeaderboard(limit: number = 10): Promise<UserStreak[]> {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .order('current_login_streak', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting streak leaderboard:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStreakLeaderboard:', error);
      return [];
    }
  }

  getRankInfo(points: number): { rank: string; nextRank: string; pointsToNext: number } {
    const levels = [
      { rank: 'Cadet', minPoints: 0 },
      { rank: 'Private', minPoints: 500 },
      { rank: 'Corporal', minPoints: 1000 },
      { rank: 'Sergeant', minPoints: 1500 },
      { rank: 'Lieutenant', minPoints: 2000 },
      { rank: 'Captain', minPoints: 3000 },
      { rank: 'Major', minPoints: 5000 },
      { rank: 'Colonel', minPoints: 8000 },
      { rank: 'General', minPoints: 12000 }
    ];

    let currentRank = levels[0];
    let nextRank = levels[1];

    for (let i = 0; i < levels.length - 1; i++) {
      if (points >= levels[i].minPoints && points < levels[i + 1].minPoints) {
        currentRank = levels[i];
        nextRank = levels[i + 1];
        break;
      }
    }

    if (points >= levels[levels.length - 1].minPoints) {
      currentRank = levels[levels.length - 1];
      nextRank = currentRank; // Max rank reached
    }

    return {
      rank: currentRank.rank,
      nextRank: nextRank.rank,
      pointsToNext: Math.max(0, nextRank.minPoints - points)
    };
  }
}

export const streakService = new StreakService();