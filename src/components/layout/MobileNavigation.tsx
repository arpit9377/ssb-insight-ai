import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Brain, Home, Target, BookOpen, Users, BarChart3, User, CreditCard, Settings, LogOut } from 'lucide-react';
import { useUser, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const navigationItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Dashboard', url: '/dashboard', icon: BarChart3, requiresAuth: true },
  { title: 'Tests', url: '/tests', icon: Target, requiresAuth: true },
  { title: 'Progress', url: '/progress', icon: BarChart3, requiresAuth: true },
  { title: 'Profile', url: '/profile', icon: User, requiresAuth: true },
  { title: 'Subscription', url: '/subscription', icon: CreditCard, requiresAuth: true },
];

const testItems = [
  { title: 'PPDT Test', url: '/test/ppdt', icon: Target, requiresAuth: true },
  { title: 'TAT Test', url: '/test/tat', icon: BookOpen, requiresAuth: true },
  { title: 'WAT Test', url: '/test/wat', icon: Brain, requiresAuth: true },
  { title: 'SRT Test', url: '/test/srt', icon: Users, requiresAuth: true },
];

const publicItems = [
  { title: 'About', url: '/about', icon: BookOpen },
  { title: 'Services', url: '/services', icon: Target },
  { title: 'Contact', url: '/contact', icon: User },
];

export function MobileNavigation() {
  const { user } = useUser();
  const { open, openMobile, setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => location.pathname === path;
  const getNavClasses = (path: string) => 
    isActive(path) ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent/50";

  // Check if current user is admin
  const isAdmin = user?.emailAddresses?.[0]?.emailAddress === 'editkarde@gmail.com';

  return (
    <Sidebar className={!open ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8 text-primary" />
          {open && (
            <div>
              <h2 className="text-lg font-bold">PsychSir.ai</h2>
              <p className="text-xs text-muted-foreground">SSB Test Prep</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems
                .filter(item => !item.requiresAuth || user)
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) => 
                          isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent/50"
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Test Modules - Only for authenticated users */}
        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Tests</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {testItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url}
                          className={({ isActive }) => 
                            isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent/50"
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          {open && <span>{item.title}</span>}
                        </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Public Pages */}
        <SidebarGroup>
          <SidebarGroupLabel>Information</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {publicItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        className={({ isActive }) => 
                          isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent/50"
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                      <NavLink 
                        to="/admin"
                        className={({ isActive }) => 
                          isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent/50"
                        }
                      >
                        <Settings className="h-4 w-4" />
                        {open && <span>Admin Panel</span>}
                      </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="space-y-2">
          <SignedOut>
            <div className="space-y-2">
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  {open && <span>Sign In</span>}
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  {open && <span>Get Started</span>}
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            {open ? (
              <div className="flex items-center space-x-2">
                <UserButton afterSignOutUrl="/" />
                <div className="flex-1 text-xs">
                  <p className="font-medium">{user?.firstName || 'User'}</p>
                  <p className="text-muted-foreground truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
            ) : (
              <UserButton afterSignOutUrl="/" />
            )}
          </SignedIn>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}