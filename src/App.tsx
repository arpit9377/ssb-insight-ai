
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import TestModule from "./pages/TestModule";
import Progress from "./pages/Progress";
import Subscription from "./pages/Subscription";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/dashboard"
              element={
                <SignedIn>
                  <Dashboard />
                </SignedIn>
              }
            />
            <Route
              path="/test/:testId"
              element={
                <SignedIn>
                  <TestModule />
                </SignedIn>
              }
            />
            <Route
              path="/progress"
              element={
                <SignedIn>
                  <Progress />
                </SignedIn>
              }
            />
            <Route
              path="/subscription"
              element={
                <SignedIn>
                  <Subscription />
                </SignedIn>
              }
            />
            <Route
              path="/profile"
              element={
                <SignedIn>
                  <Profile />
                </SignedIn>
              }
            />
            <Route
              path="/admin"
              element={
                <SignedIn>
                  <AdminDashboard />
                </SignedIn>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
