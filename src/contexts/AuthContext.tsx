import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { guestUserService } from '@/services/guestUserService';

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

  useEffect(() => {
    if (isClerkAvailable && clerkAuth?.isLoaded) {
      // Add a small delay to ensure proper auth state synchronization
      const timer = setTimeout(() => {
        setIsLoading(false);
        if (clerkAuth.isSignedIn && clerkUser?.user) {
          createUserProfile();
          checkSubscription();
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
