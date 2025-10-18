import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction, Instagram, Send } from 'lucide-react';

export const UnderDevelopment = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-2 border-yellow-400">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="flex justify-center">
            <div className="relative">
              <Construction className="h-24 w-24 text-yellow-500 animate-pulse" />
              <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2">
                <span className="text-2xl">🚧</span>
              </div>
            </div>
          </div>
          <CardTitle className="text-4xl font-bold text-gray-900">
            Under Development
          </CardTitle>
          <p className="text-xl text-gray-600">
            We're building something amazing for you!
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <h3 className="font-bold text-lg mb-3 text-gray-900">
              🎯 What's Coming?
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>AI-powered SSB psychological test analysis</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>TAT, PPDT, WAT, and SRT practice modules</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Detailed 15-trait personality feedback</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Progress tracking and leaderboards</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-center text-gray-700 font-medium">
              🚀 <strong>Expected Launch:</strong> Coming Very Soon
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              className="flex items-center gap-2"
              onClick={() => window.open('https://www.instagram.com/psychsirai/', '_blank')}
            >
              <Instagram className="h-4 w-4" />
              Follow on Instagram
            </Button>
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => window.open('https://t.me/+SMwk9YpvS8Q5MTZl', '_blank')}
            >
              <Send className="h-4 w-4" />
              Join Telegram
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-500">
              For inquiries: <a href="mailto:support@psychsirai.ai" className="text-blue-600 hover:underline">support@psychsirai.ai</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
