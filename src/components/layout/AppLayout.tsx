import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MobileNavigation } from './MobileNavigation';
import { MobileHeader } from './MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  headerActions?: React.ReactNode;
}

export function AppLayout({ children, title, showBackButton, headerActions }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider 
      defaultOpen={!isMobile} 
      className="min-h-screen"
    >
      <div className="flex min-h-screen w-full bg-background">
        <MobileNavigation />
        
        <div className="flex-1 flex flex-col min-w-0">
          <MobileHeader 
            title={title}
            showBackButton={showBackButton}
            actions={headerActions}
          />
          
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}