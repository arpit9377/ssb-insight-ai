
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Clock, Target, Users, BookOpen, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const testModules = [
    {
      id: 'ppdt',
      title: 'PPDT',
      description: 'Picture Perception & Discussion Test',
      duration: '30s viewing + 4min writing',
      icon: Target,
      color: 'bg-blue-500',
      available: true
    },
    {
      id: 'tat',
      title: 'TAT',
      description: 'Thematic Apperception Test',
      duration: '12 images, 30s + 4min each',
      icon: BookOpen,
      color: 'bg-green-500',
      available: true
    },
    {
      id: 'wat',
      title: 'WAT',
      description: 'Word Association Test',
      duration: '60 words, 15s each',
      icon: Brain,
      color: 'bg-purple-500',
      available: true
    },
    {
      id: 'srt',
      title: 'SRT',
      description: 'Situation Reaction Test',
      duration: '60 situations, 30min total',
      icon: Users,
      color: 'bg-orange-500',
      available: true
    }
  ];

  const handleTestStart = (testId: string) => {
    navigate(`/test/${testId}`);
  };

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
              <Button variant="outline" onClick={() => navigate('/progress')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Progress
              </Button>
              <Button variant="outline">Settings</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to SSB Psychological Test Preparation
          </h2>
          <p className="text-gray-600 text-lg">
            Master all four psychological tests with AI-powered feedback and detailed analysis
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">12</p>
                  <p className="text-gray-600">Tests Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">8.2/10</p>
                  <p className="text-gray-600">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Brain className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">15</p>
                  <p className="text-gray-600">Traits Analyzed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">85%</p>
                  <p className="text-gray-600">Improvement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testModules.map((test) => {
            const IconComponent = test.icon;
            return (
              <Card key={test.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-lg ${test.color} flex items-center justify-center mb-4`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{test.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {test.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {test.duration}
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => handleTestStart(test.id)}
                      disabled={!test.available}
                    >
                      Start Practice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest test sessions and improvements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">PPDT Practice Session</p>
                      <p className="text-sm text-gray-600">Completed 2 hours ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">8.5/10</p>
                    <p className="text-sm text-gray-600">Score</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">TAT Full Test</p>
                      <p className="text-sm text-gray-600">Completed yesterday</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">9.1/10</p>
                    <p className="text-sm text-gray-600">Score</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
