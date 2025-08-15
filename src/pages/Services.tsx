import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Target, BookOpen, Users, Clock, CheckCircle, BarChart3, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

const Services = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: Target,
      title: 'PPDT Practice',
      description: 'Picture Perception & Discussion Test with timed sessions and detailed feedback',
      features: [
        'High-quality psychological images',
        'Timed writing sessions',
        'Story analysis and feedback',
        'Group discussion simulation'
      ]
    },
    {
      icon: BookOpen,
      title: 'TAT Analysis',
      description: 'Thematic Apperception Test with comprehensive psychological evaluation',
      features: [
        'Professional TAT cards',
        'Story theme analysis',
        'Character motivation assessment',
        'Psychological trait mapping'
      ]
    },
    {
      icon: Brain,
      title: 'WAT Training',
      description: 'Word Association Test with rapid response training and pattern analysis',
      features: [
        '60 words in 15 minutes',
        'Response time tracking',
        'Positive thinking assessment',
        'Suggestion patterns analysis'
      ]
    },
    {
      icon: Users,
      title: 'SRT Scenarios',
      description: 'Situation Reaction Test with real-world military scenarios',
      features: [
        'Practical situation scenarios',
        'Leadership assessment',
        'Decision-making evaluation',
        'Action-oriented feedback'
      ]
    }
  ];

  const additionalServices = [
    {
      icon: BarChart3,
      title: 'Progress Analytics',
      description: 'Comprehensive tracking of your improvement across all psychological tests',
      features: [
        'Performance trend analysis',
        'Strength and weakness identification',
        'Comparative scoring',
        'Goal-setting recommendations'
      ]
    },
    {
      icon: MessageSquare,
      title: 'AI Feedback System',
      description: 'Advanced AI analysis providing detailed feedback on 15 Officer Like Qualities',
      features: [
        'OLQ assessment (15 traits)',
        'Personalized improvement suggestions',
        'Behavioral pattern analysis',
        'Leadership potential evaluation'
      ]
    }
  ];

  return (
    <AppLayout 
      title="Our Services" 
      showBackButton={true}
      backTo="/"
    >
      <div className="space-y-16">
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Our Services
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive SSB psychological test preparation with AI-powered analysis and feedback. 
            Master all four major psychological tests with our expert-designed platform.
          </p>
        </section>

        {/* Main Services */}
        <section>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Core Psychological Tests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                    <CardDescription className="text-base">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Advanced Features */}
        <section>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Advanced Features
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {additionalServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                    <CardDescription className="text-base">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white rounded-lg p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Choose Test</h4>
              <p className="text-gray-600">Select from PPDT, TAT, WAT, or SRT based on your preparation needs.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Take Test</h4>
              <p className="text-gray-600">Complete the timed psychological test with realistic scenarios and conditions.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis</h4>
              <p className="text-gray-600">Our AI analyzes your responses for psychological traits and OLQs.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">4</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Get Feedback</h4>
              <p className="text-gray-600">Receive detailed feedback and actionable improvement suggestions.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-blue-600 rounded-lg p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Start Your Preparation?</h3>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of successful candidates who have used our platform to excel in their SSB tests.
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate('/subscription')}>
              View Pricing Plans
            </Button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Services;