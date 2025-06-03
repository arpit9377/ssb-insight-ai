
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { paymentService, subscriptionPlans } from '@/services/paymentService';

const Subscription = () => {
  const { user, subscription } = useAuthContext();

  const handleSubscribe = async (priceId: string) => {
    if (!user) return;
    await paymentService.createCheckoutSession(priceId, user.id);
  };

  const handleManageSubscription = async () => {
    if (!subscription?.stripe_customer_id) return;
    await paymentService.createCustomerPortalSession(subscription.stripe_customer_id);
  };

  const getIcon = (planId: string) => {
    switch (planId) {
      case 'basic': return <Zap className="h-6 w-6" />;
      case 'premium': return <Star className="h-6 w-6" />;
      case 'pro': return <Crown className="h-6 w-6" />;
      default: return <Check className="h-6 w-6" />;
    }
  };

  const getColor = (planId: string) => {
    switch (planId) {
      case 'basic': return 'bg-blue-500';
      case 'premium': return 'bg-purple-500';
      case 'pro': return 'bg-gold-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Select the perfect plan for your SSB preparation journey
          </p>
        </div>

        {subscription && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Current Subscription</CardTitle>
              <CardDescription>
                You are currently subscribed to the {subscription.plan_type} plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleManageSubscription} variant="outline">
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {subscriptionPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${subscription?.plan_type === plan.id ? 'border-green-500 shadow-lg' : ''}`}
            >
              {subscription?.plan_type === plan.id && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Current Plan
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className={`w-12 h-12 rounded-lg ${getColor(plan.id)} flex items-center justify-center mx-auto mb-4`}>
                  <div className="text-white">
                    {getIcon(plan.id)}
                  </div>
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  onClick={() => handleSubscribe(plan.priceId)}
                  disabled={subscription?.plan_type === plan.id}
                  variant={plan.id === 'premium' ? 'default' : 'outline'}
                >
                  {subscription?.plan_type === plan.id ? 'Current Plan' : 'Subscribe Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            All plans include a 7-day free trial. Cancel anytime.
          </p>
          <p className="text-sm text-gray-500">
            Secure payment processing powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
