
import { supabase } from '@/lib/supabase';

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
    price: 999,
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
  private loadCashfreeScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Cashfree) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.sandbox.js'; // Use production URL for live
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async createCashfreeOrder(planId: string, userId: string, amount: number) {
    try {
      const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
        body: {
          amount,
          currency: 'INR',
          planType: planId,
          userId
        }
      });

      if (error) {
        console.error('Error creating Cashfree order:', error);
        throw new Error('Failed to create payment order');
      }

      return data;
    } catch (error) {
      console.error('Payment order creation error:', error);
      throw error;
    }
  }

  async verifyPayment(paymentData: any, userId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('verify-cashfree-payment', {
        body: {
          ...paymentData,
          userId
        }
      });

      if (error) {
        console.error('Error verifying payment:', error);
        throw new Error('Payment verification failed');
      }

      return data;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  async processPayment(planId: string, userId: string, userEmail: string) {
    try {
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      // Load Cashfree script
      const scriptLoaded = await this.loadCashfreeScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create order
      const orderData = await this.createCashfreeOrder(planId, userId, plan.price);

      // Configure Cashfree options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'SSB Preparation Platform',
        description: `${plan.name} Subscription`,
        order_id: orderData.orderId,
        prefill: {
          email: userEmail,
        },
        theme: {
          color: '#3b82f6'
        },
        handler: async (response: any) => {
          try {
            await this.verifyPayment(response, userId);
            window.location.reload(); // Refresh to show updated subscription
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment cancelled by user');
          }
        }
      };

      const cashfree = new window.Cashfree(options);
      cashfree.open();

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
