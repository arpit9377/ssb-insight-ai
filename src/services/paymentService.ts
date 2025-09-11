
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
  comingSoon?: boolean;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    popular: false,
    features: [
      'Access to 2 test modules',
      'Basic feedback',
      'Limited analysis per month',
      'Community support'
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 299,
    popular: true,
    features: [
      'Access to all test modules',
      'Detailed analysis and feedback',
      'Progress tracking',
      'Monthly reports',
      'Email support'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    popular: false,
    comingSoon: true,
    features: [
      'Everything in Basic',
      'Advanced AI analysis',
      'Detailed personality insights',
      'Custom study recommendations',
      'Priority support',
      'Mock interviews',
      'One-on-one coaching'
    ]
  }
];

declare global {
  interface Window {
    Cashfree: any;
  }
}

class PaymentService {
  async processPayment(planId: string, userId: string, userEmail: string) {
    try {
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      console.log('Creating Stripe checkout session...');
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planId,
          amount: plan.price
        }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        throw new Error(`Failed to create checkout session: ${error.message}`);
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  async checkSubscriptionStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return { data, error };
    } catch (error) {
      console.error('Subscription check error:', error);
      return { data: null, error };
    }
  }
}

export const paymentService = new PaymentService();
