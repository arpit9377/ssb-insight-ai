
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Target, Users, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Target,
      title: 'PPDT Practice',
      description: 'Picture Perception & Discussion Test with timed sessions'
    },
    {
      icon: BookOpen,
      title: 'TAT Analysis',
      description: 'Thematic Apperception Test with comprehensive feedback'
    },
    {
      icon: Brain,
      title: 'WAT Training',
      description: 'Word Association Test with rapid response training'
    },
    {
      icon: Users,
      title: 'SRT Scenarios',
      description: 'Situation Reaction Test with real-world situations'
    }
  ];

  const benefits = [
    'AI-powered personality trait analysis',
    'Detailed feedback on 15 SSB traits',
    'Officer Like Qualities assessment',
    'Progress tracking and analytics',
    'Unlimited practice sessions',
    'Expert-designed test scenarios'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">PsychSir.ai</h1>
            </div>
            <div className="flex items-center space-x-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="outline">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button>Get Started</Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Button onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Master SSB Psychological Tests with AI
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Prepare for PPDT, TAT, WAT, and SRT tests with our comprehensive AI-powered platform. 
            Get detailed feedback on your personality traits and officer-like qualities.
          </p>
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg" className="px-8 py-4 text-lg">
                Start Your Preparation Today
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Button size="lg" className="px-8 py-4 text-lg" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </SignedIn>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Complete SSB Test Preparation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose PsychSir.ai?
              </h3>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h4 className="text-xl font-bold text-gray-900 mb-4">Ready to Excel?</h4>
              <p className="text-gray-600 mb-6">
                Join thousands of successful candidates who have used our platform to ace their SSB tests.
              </p>
              <SignedOut>
                <SignUpButton mode="modal">
                  <Button className="w-full">Start Free Trial</Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Button className="w-full" onClick={() => navigate('/dashboard')}>
                  Access Your Dashboard
                </Button>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="h-8 w-8 text-blue-400" />
            <h3 className="text-2xl font-bold">PsychSir.ai</h3>
          </div>
          <p className="text-gray-400">
            Empowering future officers with AI-powered psychological test preparation
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
