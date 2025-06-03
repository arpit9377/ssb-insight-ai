
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
  subscription: any;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
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
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          full_name: user.fullName || '',
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
    if (isLoaded) {
      setIsLoading(false);
      if (isSignedIn && user) {
        createUserProfile();
        checkSubscription();
      }
    }
  }, [isLoaded, isSignedIn, user]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isSignedIn || false,
        user,
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
