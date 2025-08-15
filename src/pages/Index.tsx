import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Target, Users, BookOpen, Clock, CheckCircle, Menu } from 'lucide-react';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const isMobile = useIsMobile();

  // Use the same hardcoded key as in main.tsx
  const PUBLISHABLE_KEY = "pk_test_cXVpZXQtd3Jlbi05My5jbGVyay5hY2NvdW50cy5kZXYk";
  const isClerkAvailable = !!PUBLISHABLE_KEY;
  
  // Check if current user is admin
  const isAdmin = user?.emailAddresses?.[0]?.emailAddress === 'editkarde@gmail.com';

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
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">PsychSir.ai</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <Button variant="ghost" onClick={() => navigate('/about')}>About</Button>
              <Button variant="ghost" onClick={() => navigate('/services')}>Services</Button>
              <Button variant="ghost" onClick={() => navigate('/subscription')}>Subscription</Button>
              <Button variant="ghost" onClick={() => navigate('/contact')}>Contact</Button>
              {isAdmin && (
                <Button variant="ghost" onClick={() => navigate('/admin')}>Admin</Button>
              )}
              {isClerkAvailable ? (
                <>
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
                </>
              ) : (
                <Button variant="outline" disabled>
                  Authentication Setup Required
                </Button>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="flex lg:hidden items-center space-x-2">
              {isClerkAvailable ? (
                <>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button variant="outline" size="sm">Sign In</Button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Button size="sm" onClick={() => navigate('/dashboard')}>
                      Dashboard
                    </Button>
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                </>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Setup Required
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="lg:hidden bg-white border-b mb-4 rounded-lg">
            <div className="flex justify-center space-x-4 py-2 text-sm">
              <Button variant="link" size="sm" onClick={() => navigate('/about')}>About</Button>
              <Button variant="link" size="sm" onClick={() => navigate('/services')}>Services</Button>
              <Button variant="link" size="sm" onClick={() => navigate('/contact')}>Contact</Button>
            </div>
          </nav>
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Master SSB Psychological Tests with AI
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
              Prepare for PPDT, TAT, WAT, and SRT tests with our comprehensive AI-powered platform. 
              Get detailed feedback on your personality traits and officer-like qualities.
            </p>
            {isClerkAvailable ? (
                <>
                  <SignedOut>
                    <SignUpButton mode="modal">
                      <Button 
                        size={isMobile ? "default" : "lg"} 
                        className={isMobile ? "px-6 py-3 text-base" : "px-8 py-4 text-lg"}
                      >
                        Start Your Preparation Today
                      </Button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <Button 
                      size={isMobile ? "default" : "lg"} 
                      className={isMobile ? "px-6 py-3 text-base" : "px-8 py-4 text-lg"} 
                      onClick={() => navigate('/dashboard')}
                    >
                      Go to Dashboard
                    </Button>
                  </SignedIn>
                </>
              ) : (
                <Button 
                  size={isMobile ? "default" : "lg"} 
                  className={isMobile ? "px-6 py-3 text-base" : "px-8 py-4 text-lg"} 
                  disabled
                >
                  Setup Authentication to Get Started
                </Button>
              )}
          </div>
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
              {isClerkAvailable ? (
                <>
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
                </>
              ) : (
                <Button className="w-full" disabled>
                  Authentication Setup Required
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-8 w-8 text-blue-400" />
                <h3 className="text-2xl font-bold">PsychSir.ai</h3>
              </div>
              <p className="text-gray-400 max-w-md">
                Empowering future officers with AI-powered psychological test preparation
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/about')}>About</Button>
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/services')}>Services</Button>
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/subscription')}>Subscription</Button>
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/contact')}>Contact</Button>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <div className="space-y-2">
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/terms')}>Terms & Conditions</Button>
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/privacy')}>Privacy Policy</Button>
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/refunds')}>Refunds</Button>
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/faq')}>FAQ</Button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PsychSir.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
