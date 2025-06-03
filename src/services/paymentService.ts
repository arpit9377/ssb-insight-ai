
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  priceId: string;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 299,
    features: ['5 Tests per month', 'Basic AI Feedback', 'Progress Tracking'],
    priceId: 'price_basic_monthly',
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 499,
    features: ['Unlimited Tests', 'Advanced AI Feedback', 'Detailed Analytics', 'Study Materials'],
    priceId: 'price_premium_monthly',
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 999,
    features: ['Everything in Premium', 'Personal Mentor', '1-on-1 Sessions', 'Interview Preparation'],
    priceId: 'price_pro_monthly',
  },
];

class PaymentService {
  async createCheckoutSession(priceId: string, userId: string) {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Stripe redirect error:', error);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  }

  async createCustomerPortalSession(customerId: string) {
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Portal session error:', error);
    }
  }

  async checkSubscriptionStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      return { data, error };
    } catch (error) {
      console.error('Subscription check error:', error);
      return { data: null, error };
    }
  }
}

export const paymentService = new PaymentService();
