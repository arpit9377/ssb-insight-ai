import { supabase } from '@/integrations/supabase/client';
import { guestUserService } from './guestUserService';

export interface TestLimits {
  tat: number;
  ppdt: number;
  wat: number;
  srt: number;
  subscription_type: 'paid' | 'unpaid';
  subscription_expires_at?: string;
}

class TestLimitService {
  async getTestLimits(userId: string): Promise<TestLimits | null> {
    // Handle guest users
    if (guestUserService.isGuestUser(userId)) {
      const guestLimits = guestUserService.getGuestLimits();
      return {
        tat: guestLimits.tat,
        ppdt: guestLimits.ppdt,
        wat: guestLimits.wat,
        srt: guestLimits.srt,
        subscription_type: 'unpaid'
      };
    }

    try {
      const { data, error } = await supabase.rpc('get_test_limits', {
        target_user_id: userId
      });

      if (error) {
        console.error('Error getting test limits:', error);
        return null;
      }

      // Parse the JSON response
      if (typeof data === 'string') {
        return JSON.parse(data);
      }

      return data as unknown as TestLimits;
    } catch (error) {
      console.error('Error in getTestLimits:', error);
      return null;
    }
  }

  async checkTestAvailability(userId: string, testType: string): Promise<boolean> {
    // Handle guest users
    if (guestUserService.isGuestUser(userId)) {
      return guestUserService.checkGuestTestAvailability(testType);
    }

    try {
      const limits = await this.getTestLimits(userId);
      if (!limits) return false;

      const remaining = limits[testType as keyof TestLimits];
      return typeof remaining === 'number' && remaining > 0;
    } catch (error) {
      console.error('Error checking test availability:', error);
      return false;
    }
  }

  async decrementTestLimit(userId: string, testType: string): Promise<boolean> {
    // Handle guest users
    if (guestUserService.isGuestUser(userId)) {
      return guestUserService.decrementGuestTestLimit(testType);
    }

    try {
      const { data, error } = await supabase.rpc('decrement_test_limit', {
        target_user_id: userId,
        test_type: testType
      });

      if (error) {
        console.error('Error decrementing test limit:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in decrementTestLimit:', error);
      return false;
    }
  }

  async activatePaidSubscription(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('activate_paid_subscription', {
        target_user_id: userId
      });

      if (error) {
        console.error('Error activating paid subscription:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in activatePaidSubscription:', error);
      return false;
    }
  }

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error getting user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }
}

export const testLimitService = new TestLimitService();