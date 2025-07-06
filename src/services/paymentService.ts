
import { supabase } from '@/lib/supabase';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 299,
    features: ['5 Tests per month', 'Basic AI Feedback', 'Progress Tracking', 'Email Support'],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 999,
    features: ['Unlimited Tests', 'Advanced AI Feedback', 'Detailed Analytics', 'Study Materials', 'Priority Support'],
    popular: true,
  },
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

class PaymentService {
  private loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async createRazorpayOrder(planId: string, userId: string, amount: number) {
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount,
          currency: 'INR',
          planType: planId,
          userId
        }
      });

      if (error) {
        console.error('Error creating Razorpay order:', error);
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
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
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

      // Load Razorpay script
      const scriptLoaded = await this.loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create order
      const orderData = await this.createRazorpayOrder(planId, userId, plan.price);

      // Configure Razorpay options
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

      const razorpay = new window.Razorpay(options);
      razorpay.open();

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
