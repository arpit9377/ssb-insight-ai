import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, X, Crown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';

const Pricing = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free Plan',
      price: '₹0',
      duration: 'after signup',
      description: 'Perfect for getting started',
      features: [
        '2 PPDT tests',
        '2 TAT sessions',
        '2 WAT attempts',
        '2 SRT scenarios',
        'Basic AI feedback',
        'Progress tracking',
        'Performance analytics'
      ],
      limitations: [
        'Limited test attempts',
        'Basic analysis only'
      ],
      cta: 'Sign Up Free',
      popular: false,
      icon: Star
    },
    {
      name: 'Premium Plan',
      price: '₹199',
      duration: 'one-time payment',
      description: 'Complete preparation package',
      features: [
        '30 PPDT tests',
        '30 TAT sessions',
        '30 WAT attempts',
        '30 SRT scenarios',
        'Detailed AI feedback',
        'Full OLQ analysis',
        'Progress tracking',
        'Performance analytics',
        'Advanced insights',
        'Downloadable reports'
      ],
      limitations: [],
      cta: 'Upgrade Now',
      popular: true,
      icon: Crown
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/d3dbc8a1-8206-42d0-8106-40fc4d962c94.png" alt="PsychSirAi Logo" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-gray-900">PsychSirAi</h1>
            </div>
            <div className="flex items-center space-x-6">
              <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
              <Button variant="ghost" onClick={() => navigate('/about')}>About</Button>
              <Button variant="ghost" onClick={() => navigate('/services')}>Services</Button>
              <Button variant="ghost" onClick={() => navigate('/contact')}>Contact</Button>
              <Button onClick={() => navigate('/dashboard')}>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Select the perfect plan for your SSB preparation journey. Start with our free trial 
            or choose a plan that fits your preparation timeline and goals.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon;
              return (
                <Card key={index} className={`relative h-full ${plan.popular ? 'border-blue-500 border-2 shadow-lg scale-105' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className={`w-12 h-12 ${plan.popular ? 'bg-blue-500' : 'bg-gray-500'} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-500">/{plan.duration}</span>
                    </div>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Included:</h4>
                        <ul className="space-y-2">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-gray-600 text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {plan.limitations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Not included:</h4>
                          <ul className="space-y-2">
                            {plan.limitations.map((limitation, limitationIndex) => (
                              <li key={limitationIndex} className="flex items-center space-x-2">
                                <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                                <span className="text-gray-500 text-sm">{limitation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <Button 
                      className={`w-full mt-6 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => navigate('/subscription')}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h3>
          <div className="space-y-6">
            <div className="p-6 border rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Can I switch plans anytime?</h4>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Is there a refund policy?</h4>
              <p className="text-gray-600">Since our product is digital, we do not offer refunds once purchased. However, you can cancel your subscription at any time.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-600">We accept all major credit/debit cards, UPI, net banking, and digital wallets through Cashfree.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h4 className="font-semibient text-gray-900 mb-2">Do you offer student discounts?</h4>
              <p className="text-gray-600">We offer special pricing for defense academy students. Contact our support team with your student ID for more information.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Pricing;