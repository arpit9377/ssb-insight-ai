import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, BookOpen, Users, Clock, CheckCircle, BarChart3, MessageSquare, Brain, Trophy, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Footer } from '@/components/layout/Footer';

const Services = () => {
  const navigate = useNavigate();

  const mainServices = [
    {
      icon: Target,
      title: 'PPDT (Picture Perception & Discussion Test)',
      description: 'Master the art of story creation and group discussion with our comprehensive PPDT training module.',
      features: [
        'High-quality psychological images from real SSB tests',
        'Timed writing sessions (4 minutes story writing)',
        'AI-powered story analysis and feedback',
        'Group discussion simulation and tips',
        'Personality trait assessment from your stories',
        'Detailed scoring based on military standards'
      ],
      color: 'bg-blue-500',
      practiceLink: '/test/ppdt'
    },
    {
      icon: BookOpen,
      title: 'TAT (Thematic Apperception Test)',
      description: 'Develop compelling narratives that showcase your leadership potential through professional TAT analysis.',
      features: [
        'Professional TAT cards used in actual SSB',
        'Story theme and character analysis',
        'Motivation and personality assessment',
        'Leadership quality identification',
        'Psychological trait mapping',
        'Comprehensive feedback on narrative skills'
      ],
      color: 'bg-green-500',
      practiceLink: '/test/tat'
    },
    {
      icon: Users,
      title: 'WAT (Word Association Test)',
      description: 'Train your subconscious mind to respond positively with our advanced WAT practice system.',
      features: [
        '60 words in 15 minutes - real test simulation',
        'Response time tracking and optimization',
        'Positive thinking pattern assessment',
        'Subconscious response analysis',
        'Military leadership word associations',
        'Personalized improvement suggestions'
      ],
      color: 'bg-purple-500',
      practiceLink: '/test/wat'
    },
    {
      icon: MessageSquare,
      title: 'SRT (Situation Reaction Test)',
      description: 'Practice real-world military scenarios and develop quick decision-making skills.',
      features: [
        'Practical military situation scenarios',
        'Quick decision-making training',
        'Leadership response evaluation',
        'Problem-solving skill assessment',
        'Military ethics and values testing',
        'Reaction time and quality analysis'
      ],
      color: 'bg-orange-500',
      practiceLink: '/test/srt'
    }
  ];

  const additionalFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced machine learning algorithms analyze your responses to provide detailed psychological insights and personality assessments.',
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking',
      description: 'Comprehensive dashboards track your improvement over time with detailed analytics and performance metrics.',
    },
    {
      icon: Trophy,
      title: 'Competitive Features',
      description: 'Leaderboards, badges, and streak tracking to keep you motivated and engaged in your preparation journey.',
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      description: 'Get immediate, actionable feedback on every test attempt with specific recommendations for improvement.',
    }
  ];

  const processSteps = [
    {
      step: '1',
      title: 'Choose Your Test',
      description: 'Select from TAT, WAT, PPDT, or SRT based on your preparation needs.'
    },
    {
      step: '2',
      title: 'Complete the Test',
      description: 'Take timed tests in conditions that simulate the actual SSB environment.'
    },
    {
      step: '3',
      title: 'Get AI Analysis',
      description: 'Our AI analyzes your responses and provides detailed psychological insights.'
    },
    {
      step: '4',
      title: 'Improve & Repeat',
      description: 'Use the feedback to improve and track your progress over multiple attempts.'
    }
  ];

  return (
    <AppLayout 
      title="Our Services" 
      showBackButton={true}
      backTo="/"
    >
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        {/* Hero Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Comprehensive SSB Test Preparation
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Master all four major psychological tests with AI-powered feedback and analysis. 
              Our comprehensive platform provides everything you need to excel in your SSB interview 
              and develop the leadership qualities required for military service.
            </p>
            <Button size="lg" onClick={() => navigate('/dashboard')} className="px-8 py-3">
              Start Your Practice Now
            </Button>
          </div>
        </section>

        {/* Main Services */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Test Modules</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Each test module is designed to simulate real SSB conditions and provide comprehensive analysis of your performance.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              {mainServices.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <Card key={index} className="hover:shadow-xl transition-shadow bg-white">
                    <CardHeader className="pb-4">
                      <div className={`w-16 h-16 rounded-2xl ${service.color} flex items-center justify-center mb-4`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                      <CardDescription className="text-gray-600 text-base leading-relaxed">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {service.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <Button 
                        onClick={() => navigate(service.practiceLink)} 
                        className="w-full mt-6"
                      >
                        Start {service.title.split(' ')[0]} Practice
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our simple 4-step process ensures you get the most out of your preparation time.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {processSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Advanced Features</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Beyond basic test practice, we offer advanced features to accelerate your preparation.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {additionalFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow bg-white">
                    <CardHeader>
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Excel in Your SSB?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Start with our free tests or upgrade to premium for unlimited access and advanced features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={() => navigate('/dashboard')} className="px-8 py-3">
                Try Free Tests
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/subscription')} className="px-8 py-3 text-white border-white hover:bg-white hover:text-blue-600">
                View Premium Plans
              </Button>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </AppLayout>
  );
};

export default Services;