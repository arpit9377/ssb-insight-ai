import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { guestUserService } from '@/services/guestUserService';
import { streakService } from '@/services/streakService';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
  subscription: any;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use the same hardcoded key as in main.tsx
  const PUBLISHABLE_KEY = "pk_test_cXVpZXQtd3Jlbi05My5jbGVyay5hY2NvdW50cy5kZXYk";
  const isClerkAvailable = !!PUBLISHABLE_KEY;

  // Always call hooks unconditionally - Clerk handles the provider availability internally
  const clerkAuth = useAuth();
  const clerkUser = useUser();

  const checkSubscription = async () => {
    if (!clerkUser?.user) return;
    
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', clerkUser.user.id) // Clerk user ID is already a string
        .eq('status', 'active')
        .single();
      
      if (!error && data) {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const createUserProfile = async () => {
    if (!clerkUser?.user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: clerkUser.user.id, // Clerk user ID is already a string
          email: clerkUser.user.emailAddresses[0]?.emailAddress || '',
          full_name: clerkUser.user.fullName || '',
          age: 0,
          education: '',
          background: '',
          subscription_status: 'free',
        });

      if (error) {
        console.error('Error creating user profile:', error);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  const updateLoginStreak = async () => {
    if (!clerkUser?.user) return;

    try {
      const streakUpdate = await streakService.updateLoginStreak(clerkUser.user.id);
      
      if (streakUpdate) {
        if (streakUpdate.currentStreak === 1) {
          toast.success("🔥 Streak started! Come back tomorrow to continue!", {
            description: "You've earned 10 points"
          });
        } else if (streakUpdate.currentStreak > 1) {
          toast.success(`🔥 ${streakUpdate.currentStreak} day streak! +${streakUpdate.pointsEarned} points`, {
            description: streakUpdate.levelUp ? "🎉 You leveled up!" : "Keep it going!"
          });
        }
        
        // Show badge notifications
        if (streakUpdate.newBadges && streakUpdate.newBadges.length > 0) {
          setTimeout(() => {
            streakUpdate.newBadges?.forEach(badge => {
              toast.success(`🏆 New Badge Earned: ${badge}!`);
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error updating login streak:', error);
    }
  };

  useEffect(() => {
    if (isClerkAvailable && clerkAuth?.isLoaded) {
      // Add a small delay to ensure proper auth state synchronization
      const timer = setTimeout(() => {
        setIsLoading(false);
        if (clerkAuth.isSignedIn && clerkUser?.user) {
          createUserProfile();
          checkSubscription();
          updateLoginStreak(); // Track login streak
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else if (!isClerkAvailable) {
      setIsLoading(false);
    }
  }, [isClerkAvailable, clerkAuth?.isLoaded, clerkAuth?.isSignedIn, clerkUser?.user]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isClerkAvailable ? (clerkAuth?.isSignedIn || false) : false,
        user: isClerkAvailable ? clerkUser?.user : null,
        isLoading,
        subscription,
        checkSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
