import React from 'react';
import { Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useNavigate } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  actions?: React.ReactNode;
}

export function MobileHeader({ title, showBackButton = false, actions }: MobileHeaderProps) {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center space-x-2 flex-1">
          <SidebarTrigger className="h-8 w-8" />
          
          <div className="flex items-center space-x-2">
            <img src="/lovable-uploads/d3dbc8a1-8206-42d0-8106-40fc4d962c94.png" alt="PsychSirAi Logo" className="h-6 w-6" />
            <div className="hidden sm:block">
              <h1 className="font-semibold text-lg">
                {title || 'PsychSirAi'}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {actions}
          
          {/* Notification Bell - Hidden on very small screens */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hidden sm:inline-flex"
          >
            <Bell className="h-4 w-4" />
          </Button>

          {/* User Button with enhanced mobile styling */}
          <div className="flex items-center">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}