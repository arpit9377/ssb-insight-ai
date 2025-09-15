import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/contexts/AuthContext';
import { streakService } from '@/services/streakService';
import { toast } from 'sonner';

export const StreakTester: React.FC = () => {
  const { user, isAuthenticated } = useAuthContext();

  const testLoginStreak = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    console.log('🧪 Testing login streak update for user:', user.id);
    try {
      const result = await streakService.updateLoginStreak(user.id);
      console.log('🧪 Login streak test result:', result);
      
      if (result) {
        toast.success(`✅ Login streak updated! Current: ${result.currentStreak}, Points: ${result.pointsEarned}`);
      } else {
        toast.error('❌ Failed to update login streak');
      }
    } catch (error) {
      console.error('🧪 Login streak test error:', error);
      toast.error('❌ Error testing login streak');
    }
  };

  const testTestStreak = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    console.log('🧪 Testing test streak update for user:', user.id);
    try {
      const result = await streakService.updateTestStreak(user.id);
      console.log('🧪 Test streak test result:', result);
      
      if (result) {
        toast.success(`✅ Test streak updated! Current: ${result.currentStreak}, Points: ${result.pointsEarned}`);
      } else {
        toast.error('❌ Failed to update test streak');
      }
    } catch (error) {
      console.error('🧪 Test streak test error:', error);
      toast.error('❌ Error testing test streak');
    }
  };

  const getUserStreak = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    console.log('🧪 Getting user streak for:', user.id);
    try {
      const streak = await streakService.getUserStreak(user.id);
      console.log('🧪 Current user streak:', streak);
      
      if (streak) {
        toast.success(`Current streaks - Login: ${streak.current_login_streak}, Test: ${streak.current_test_streak}, Points: ${streak.total_points}`);
      } else {
        toast.info('No streak data found for user');
      }
    } catch (error) {
      console.error('🧪 Get streak error:', error);
      toast.error('❌ Error getting streak data');
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Streak Tester</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to test streak functionality</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>🧪 Streak Tester</CardTitle>
        <p className="text-sm text-muted-foreground">
          Test streak functionality (User ID: {user?.id?.substring(0, 8)}...)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={getUserStreak} variant="outline" className="w-full">
          📊 Get Current Streak Data
        </Button>
        
        <Button onClick={testLoginStreak} className="w-full">
          🔥 Test Login Streak Update
        </Button>
        
        <Button onClick={testTestStreak} className="w-full">
          🎯 Test Test Streak Update
        </Button>
        
        <div className="text-xs text-muted-foreground">
          Check browser console for detailed logs
        </div>
      </CardContent>
    </Card>
  );
};