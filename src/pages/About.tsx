import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Target, Users, Award, BookOpen, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

const About = () => {
  const navigate = useNavigate();

  const teamValues = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'Empowering future officers with cutting-edge AI technology for comprehensive SSB preparation.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to delivering the highest quality psychological test preparation experience.'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Continuously evolving our AI models to provide the most accurate and helpful feedback.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building a supportive community of aspiring officers helping each other succeed.'
    }
  ];

  return (
    <AppLayout 
      title="About Us" 
      showBackButton={true}
      backTo="/"
    >
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            About PsychSirAi
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            We are dedicated to revolutionizing SSB preparation through advanced AI technology, 
            helping aspiring officers develop the psychological competencies required for military leadership.
          </p>
        </div>
      </section>

      {/* ... keep existing code (all sections) ... */}

      </div>
    </AppLayout>
  );
};

export default About;