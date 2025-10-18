import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, BookOpen, Clock, CheckCircle, Menu, Star, X, Trophy } from 'lucide-react';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { UploadFeatureAnnouncement } from '@/components/announcement/UploadFeatureAnnouncement';
import { UnderDevelopment } from '@/components/UnderDevelopment';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const isMobile = useIsMobile();

  // Use the same hardcoded key as in main.tsx
  const PUBLISHABLE_KEY = "pk_test_cXVpZXQtd3Jlbi05My5jbGVyay5hY2NvdW50cy5kZXYk";
  const isClerkAvailable = !!PUBLISHABLE_KEY;
  
  // Check if current user is admin
  const isAdmin = user?.emailAddresses?.[0]?.emailAddress === 'editkarde@gmail.com';

  // ============================================
  // TEMPORARY: Under Development Mode
  // ============================================
  // Set to false when ready to launch the full site
  // This allows you to develop behind the scenes while showing maintenance page
  const SHOW_UNDER_DEVELOPMENT = true;
  
  // Admin bypass: Allow admin (editkarde@gmail.com) to see the real site for testing
  if (SHOW_UNDER_DEVELOPMENT && !isAdmin) {
    return <UnderDevelopment />;
  }
  // ============================================

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
      icon: BookOpen,
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

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Recommended SSB Bhopal",
      rating: 5,
      content: "PsychSirAi completely transformed my SSB preparation. The AI analysis helped me understand my personality traits better and I cleared my SSB on the first attempt!"
    },
    {
      name: "Priya Sharma", 
      role: "OTA Gaya",
      rating: 5,
      content: "The TAT and PPDT practice sessions were incredibly realistic. The detailed feedback helped me improve my responses significantly. Highly recommended!"
    },
    {
      name: "Vikram Singh",
      role: "NDA Khadakwasla",
      rating: 5,
      content: "I was struggling with WAT tests but PsychSirAi's training module made me confident. The progress tracking feature is amazing!"
    },
    {
      name: "Anjali Verma",
      role: "Recommended SSB Allahabad",
      rating: 5,
      content: "The SRT scenarios were spot on with real SSB tests. The AI analysis gave me insights I never knew I had. Worth every penny!"
    },
    {
      name: "Arjun Patel",
      role: "IMA Dehradun",
      rating: 5,
      content: "The personality trait analysis was spot-on! It helped me identify my strengths and work on areas of improvement before my actual SSB."
    },
    {
      name: "Kavya Reddy",
      role: "Recommended SSB Bangalore",
      rating: 5,
      content: "Amazing platform! The AI feedback is incredibly detailed and helped me understand exactly what SSB assessors look for."
    },
    {
      name: "Rohit Gupta",
      role: "Naval Academy Ezhimala",
      rating: 5,
      content: "The mock tests felt exactly like the real SSB! The AI's personality insights helped me present my best self during the interview."
    },
    {
      name: "Sneha Joshi",
      role: "Air Force Academy Dundigal",
      rating: 5,
      content: "Best investment for SSB preparation! The detailed analysis after each test helped me improve consistently. Cleared SSB in my second attempt!"
    },
    {
      name: "Kiran Das",
      role: "OTA Chennai",
      rating: 5,
      content: "The WAT and SRT modules are exceptional. The AI coaching is like having a personal mentor guiding you through each test type."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <UploadFeatureAnnouncement storageKey="hasSeenUploadFeatureAnnouncement_landing" />
      {/* Launch Offer Banner */}
      <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white py-3 px-4 text-center relative">
        <div className="flex items-center justify-center space-x-4 flex-wrap">
          <span className="font-bold text-lg">🎉 Limited Time Launch Offer!</span>
          <span className="text-xl">Premium Plan Just ₹199</span>
          <span className="font-semibold">(Save 80%!)</span>
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white text-red-600 hover:bg-gray-100 font-bold"
            onClick={() => navigate('/subscription')}
          >
            Claim Now
          </Button>
        </div>
      </div>
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/d3dbc8a1-8206-42d0-8106-40fc4d962c94.png" alt="PsychSirAi Logo" className="h-8 w-8" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">PsychSirAi</h1>
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
                      <Button>
                        Get Started
                      </Button>
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
                    <SignUpButton mode="modal">
                      <Button size="sm">
                        Sign Up
                      </Button>
                    </SignUpButton>
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

      {/* Top Testimonials Slider */}
      <section className="py-6 bg-white border-b overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Trusted by Future Officers</h3>
          </div>
          <div className="relative">
            <div className="flex animate-slide-left-right space-x-8">
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <div key={index} className="flex-shrink-0 w-80 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border">
                  <div className="flex items-center mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                    <p className="text-green-600 text-xs font-medium">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isClerkAvailable ? (
                <>
                  <SignedOut>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <SignUpButton mode="modal">
                        <Button 
                          size={isMobile ? "default" : "lg"} 
                          className={isMobile ? "px-6 py-3 text-base" : "px-8 py-4 text-lg"}
                        >
                          Try it for Free - 2 Tests
                        </Button>
                      </SignUpButton>
                      <SignUpButton mode="modal">
                        <Button 
                          variant="outline"
                          size={isMobile ? "default" : "lg"} 
                          className={isMobile ? "px-6 py-3 text-base" : "px-8 py-4 text-lg"}
                        >
                          Start Your Preparation Today
                        </Button>
                      </SignUpButton>
                    </div>
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
            
            {/* Free Trial Info */}
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto border-2 border-green-200">
              <div className="text-center">
                <h3 className="text-lg font-bold text-green-600 mb-2">🎁 Free Trial Included!</h3>
                <p className="text-gray-700 text-sm">
                  2 free tests • Instant AI feedback
                </p>
                <SignUpButton mode="modal">
                  <Button 
                    variant="outline" 
                    className="mt-3 border-green-500 text-green-600 hover:bg-green-50"
                  >
                    Start Free Trial Now
                  </Button>
                </SignUpButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard & Competition Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-4">
            Join 10,000+ Competitive Candidates
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Track your progress, compete with peers, and climb the leaderboard
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-2">🏆</div>
              <h4 className="font-semibold mb-2">Global Leaderboard</h4>
              <p className="text-sm opacity-90">See how you rank against other aspirants nationwide</p>
            </div>
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-2">🔥</div>
              <h4 className="font-semibold mb-2">Daily Streaks</h4>
              <p className="text-sm opacity-90">Build consistency and earn military ranks</p>
            </div>
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-2">🎖️</div>
              <h4 className="font-semibold mb-2">Achievement Badges</h4>
              <p className="text-sm opacity-90">Unlock special badges as you progress</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isClerkAvailable ? (
              <>
                <SignedOut>
                  <SignUpButton mode="modal">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                      Start Competing Today
                    </Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" onClick={() => navigate('/leaderboard')}>
                    View Leaderboard
                  </Button>
                </SignedIn>
              </>
            ) : (
              <Button size="lg" className="bg-white text-blue-600" disabled>
                Setup Required
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
                Why Choose PsychSirAi?
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
                     <Button className="w-full">
                       Start Free Trial
                     </Button>
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

      {/* Testimonials Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by 10,000+ Future Officers
            </h3>
            <p className="text-lg text-gray-600">
              See what our successful candidates have to say about their experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="border-t pt-3">
                    <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                    <p className="text-green-600 text-xs font-medium">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-lg text-gray-700 font-semibold">
              Join them today and start your success story!
            </p>
             {isClerkAvailable ? (
               <SignedOut>
             <SignUpButton mode="modal">
               <Button 
                 size="lg" 
                 className="mt-4 px-8 py-3"
               >
                 Start Free Trial Now
               </Button>
             </SignUpButton>
               </SignedOut>
             ) : null}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Main Footer Content - Single Row */}
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-12">
            
            {/* Brand Section */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-8">
              <div className="flex items-center space-x-3">
                <img src="/lovable-uploads/d3dbc8a1-8206-42d0-8106-40fc4d962c94.png" alt="PsychSirAi Logo" className="h-8 w-8" />
                <h3 className="text-2xl font-bold">PsychSirAi</h3>
              </div>
              <p className="text-gray-400 text-center lg:text-left max-w-md">
                Empowering future officers with AI-powered psychological test preparation.
              </p>
            </div>
            
            {/* Navigation Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8">
              <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto text-sm" onClick={() => navigate('/about')}>
                About
              </Button>
              <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto text-sm" onClick={() => navigate('/services')}>
                Services
              </Button>
              <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto text-sm" onClick={() => navigate('/subscription')}>
                Pricing
              </Button>
              <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto text-sm" onClick={() => navigate('/contact')}>
                Contact
              </Button>
              <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto text-sm" onClick={() => navigate('/terms')}>
                Terms
              </Button>
              <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto text-sm" onClick={() => navigate('/privacy')}>
                Privacy
              </Button>
              <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto text-sm" onClick={() => navigate('/faq')}>
                FAQ
              </Button>
            </div>
            
            {/* Social Media */}
            <div className="flex items-center space-x-4">
              <a 
                href="https://www.instagram.com/psychsirai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-400 hover:text-pink-400 transition-colors group"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium hidden sm:block">Instagram</span>
              </a>
              
              <a 
                href="https://t.me/+SMwk9YpvS8Q5MTZl" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors group"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium hidden sm:block">Telegram</span>
              </a>
            </div>
          </div>
          
          {/* Copyright Section */}
          <div className="border-t border-gray-800 mt-8 pt-6 text-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 PsychSirAi. All rights reserved. | Made with ❤️ for future officers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
