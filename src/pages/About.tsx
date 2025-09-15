import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, Award, BookOpen, Lightbulb, Shield, Zap, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Footer } from '@/components/layout/Footer';

const About = () => {
  const navigate = useNavigate();

  const teamValues = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'Empowering future officers with cutting-edge AI technology for comprehensive SSB preparation that builds real leadership skills.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to delivering the highest quality psychological test preparation with personalized feedback and detailed analysis.'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Continuously evolving our AI models using advanced machine learning to provide the most accurate and helpful feedback.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building a supportive community of aspiring officers helping each other succeed through shared knowledge and encouragement.'
    }
  ];

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Our advanced AI analyzes your responses across TAT, WAT, PPDT, and SRT tests to provide detailed psychological insights and personality trait assessments.'
    },
    {
      icon: Shield,
      title: 'Military Standards',
      description: 'All test scenarios and evaluation criteria are based on actual SSB testing protocols and military leadership requirements used by defense forces.'
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      description: 'Get immediate, comprehensive feedback on your performance with specific recommendations for improvement and skill development strategies.'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Active Users' },
    { number: '50,000+', label: 'Tests Completed' },
    { number: '85%', label: 'Success Rate' },
    { number: '4.8/5', label: 'User Rating' }
  ];

  return (
    <AppLayout 
      title="About Us" 
      showBackButton={true}
      backTo="/"
    >
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        {/* Hero Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              About PsychSirAi
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              We are dedicated to revolutionizing SSB preparation through advanced AI technology, 
              helping aspiring officers develop the psychological competencies required for military leadership.
              Our platform combines cutting-edge artificial intelligence with deep understanding of military psychology 
              to provide comprehensive test preparation that goes beyond traditional methods.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/services')} className="px-8 py-3">
                Explore Our Services
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')} className="px-8 py-3">
                Start Your Journey
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
                <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                  <p>
                    PsychSirAi was born from the vision of making high-quality SSB preparation accessible to every aspiring officer. 
                    Recognizing that traditional coaching methods often fall short in providing personalized feedback and comprehensive analysis, 
                    our team of military psychologists and AI experts came together to create something revolutionary.
                  </p>
                  <p>
                    Our platform leverages advanced machine learning algorithms trained on thousands of successful SSB candidates' responses 
                    to provide insights that were previously only available through expensive one-on-one coaching. We believe that every 
                    candidate deserves access to world-class preparation tools, regardless of their geographical location or financial constraints.
                  </p>
                  <p>
                    Today, PsychSirAi serves thousands of aspiring officers across the globe, helping them not just pass their SSB tests, 
                    but truly develop the leadership qualities and psychological resilience required for military service.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">What Makes Us Different</h3>
                <div className="space-y-6">
                  {features.map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <IconComponent className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                          <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                These principles guide everything we do and shape our commitment to helping aspiring officers succeed.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamValues.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="h-8 w-8 text-blue-600" />
                      </div>
                      <CardTitle className="text-xl">{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Begin Your Journey?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join thousands of successful candidates who have used PsychSirAi to master their SSB preparation 
              and develop the leadership skills needed for military service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={() => navigate('/dashboard')} className="px-8 py-3">
                Start Free Practice
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/subscription')} className="px-8 py-3 text-white border-white hover:bg-white hover:text-blue-600">
                View Pricing Plans
              </Button>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </AppLayout>
  );
};

export default About;