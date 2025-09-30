import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, BookOpen, Users, Clock, FileText, Camera } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

const testData = [
  {
    id: 'ppdt',
    title: 'PPDT Test',
    subtitle: 'Picture Perception & Discussion Test',
    description: 'View an image for 30 seconds, then write a story in 4 minutes',
    duration: '5 minutes',
    icon: Target,
    difficulty: 'Medium',
    color: 'bg-blue-500'
  },
  {
    id: 'tat',
    title: 'TAT Test', 
    subtitle: 'Thematic Apperception Test',
    description: '12 images with 30 seconds viewing and 4 minutes writing each',
    duration: '60 minutes',
    icon: BookOpen,
    difficulty: 'High',
    color: 'bg-purple-500'
  },
  {
    id: 'wat',
    title: 'WAT Test',
    subtitle: 'Word Association Test', 
    description: '60 words with 15 seconds each for viewing and response',
    duration: '15 minutes',
    icon: Target,
    difficulty: 'Easy',
    color: 'bg-green-500'
  },
  {
    id: 'srt',
    title: 'SRT Test',
    subtitle: 'Situation Reaction Test',
    description: '60 situations with 30 minutes total time',
    duration: '30 minutes', 
    icon: Users,
    difficulty: 'Medium',
    color: 'bg-orange-500'
  },
  {
    id: 'photo_story',
    title: 'Photo Story Test',
    subtitle: 'Image-based Story Writing',
    description: 'Capture or upload an image, then write a creative story',
    duration: '10 minutes',
    icon: Camera,
    difficulty: 'Medium',
    color: 'bg-pink-500'
  }
];

const Tests = () => {
  const navigate = useNavigate();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-orange-600 bg-orange-50';
      case 'High': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <AppLayout 
      title="Available Tests" 
      showBackButton={true}
      backTo="/dashboard"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Available Tests</h1>
          <p className="text-muted-foreground mt-2">
            Choose from our comprehensive psychological assessment tests
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {testData.map((test) => {
            const IconComponent = test.icon;
            
            return (
              <Card key={test.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`${test.color} p-3 rounded-lg text-white`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {test.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground font-medium">
                          {test.subtitle}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.difficulty)}`}>
                      {test.difficulty}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {test.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{test.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>Written</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => navigate(`/test/${test.id}`)}
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    Start {test.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <img src="/lovable-uploads/d3dbc8a1-8206-42d0-8106-40fc4d962c94.png" alt="PsychSirAi Logo" className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">More Tests Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              We're continuously adding new psychological assessment tools to help you prepare better.
            </p>
            <Button variant="outline" onClick={() => navigate('/contact')}>
              Request New Test
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Tests;