
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Star, Zap, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { paymentService, subscriptionPlans } from '@/services/paymentService';
import { useToast } from '@/hooks/use-toast';

const Subscription = () => {
  const { user, subscription, checkSubscription } = useAuthContext();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      toast({
        title: "Free Plan",
        description: "You are already on the free plan.",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive"
      });
      return;
    }

    setLoadingPlan(planId);
    
    try {
      const userEmail = user.emailAddresses?.[0]?.emailAddress || '';
      await paymentService.processPayment(planId, user.id, userEmail);
      
      // Refresh subscription status after successful payment
      await checkSubscription();
      
      toast({
        title: "Payment Initiated",
        description: "Please complete the payment process.",
      });
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const getIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Crown className="h-6 w-6" />;
      case 'basic': return <Zap className="h-6 w-6" />;
      case 'premium': return <Star className="h-6 w-6" />;
      default: return <Crown className="h-6 w-6" />;
    }
  };

  const getColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'bg-green-500';
      case 'basic': return 'bg-blue-500';
      case 'premium': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const isCurrentPlan = (planId: string) => {
    if (planId === 'free') {
      return !subscription || subscription?.status !== 'active';
    }
    return subscription?.plan_type === planId && subscription?.status === 'active';
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

        {subscription && subscription.status === 'active' && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Current Subscription</CardTitle>
              <CardDescription>
                You are currently subscribed to the {subscription.plan_type} plan
                {subscription.current_period_end && (
                  <span className="block mt-1">
                    Valid until: {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {subscriptionPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${isCurrentPlan(plan.id) ? 'border-green-500 shadow-lg' : ''} ${plan.popular ? 'border-purple-500 shadow-lg' : ''} ${plan.comingSoon ? 'opacity-60' : ''}`}
            >
              {plan.popular && !isCurrentPlan(plan.id) && !plan.comingSoon && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              {plan.comingSoon && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Coming Soon
                  </span>
                </div>
              )}
              
              {isCurrentPlan(plan.id) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Current Plan
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className={`w-12 h-12 rounded-lg ${getColor(plan.id)} flex items-center justify-center mx-auto mb-4 ${plan.comingSoon ? 'bg-gray-400' : ''}`}>
                  <div className="text-white">
                    {getIcon(plan.id)}
                  </div>
                </div>
                <CardTitle className={`text-2xl ${plan.comingSoon ? 'text-gray-500' : ''}`}>{plan.name}</CardTitle>
                <CardDescription>
                  <span className={`text-3xl font-bold ${plan.comingSoon ? 'text-gray-500' : 'text-gray-900'}`}>
                    {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className={`${plan.comingSoon ? 'text-gray-400' : 'text-gray-600'}`}>/month</span>}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <Check className={`h-5 w-5 flex-shrink-0 ${plan.comingSoon ? 'text-gray-400' : 'text-green-500'}`} />
                      <span className={`${plan.comingSoon ? 'text-gray-500' : 'text-gray-700'}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular && !plan.comingSoon ? 'bg-purple-600 hover:bg-purple-700' : ''} ${plan.comingSoon ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' : ''}`}
                  onClick={() => !plan.comingSoon && handleSubscribe(plan.id)}
                  disabled={isCurrentPlan(plan.id) || loadingPlan === plan.id || plan.comingSoon}
                  variant={plan.popular && !plan.comingSoon ? 'default' : 'outline'}
                >
                  {plan.comingSoon ? (
                    'Coming Soon'
                  ) : loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan(plan.id) ? (
                    'Current Plan'
                  ) : plan.id === 'free' ? (
                    'Current Plan'
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            All plans are billed monthly. Cancel anytime from your account settings.
          </p>
          <p className="text-sm text-gray-500">
            Secure payment processing powered by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
