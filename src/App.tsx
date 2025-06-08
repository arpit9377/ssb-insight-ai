
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import TestModule from '@/pages/TestModule';
import Progress from '@/pages/Progress';
import Subscription from '@/pages/Subscription';
import AdminDashboard from '@/pages/AdminDashboard';
import NotFound from '@/pages/NotFound';
import TATTest from '@/components/tests/TATTest';
import PPDTTest from '@/components/tests/PPDTTest';
import WATTest from '@/components/tests/WATTest';
import SRTTest from '@/components/tests/SRTTest';
import TestResultsPage from '@/components/analysis/TestResultsPage';
import './App.css';

const queryClient = new QueryClient();

// Use the same hardcoded key as in main.tsx and other files
const PUBLISHABLE_KEY = "pk_test_cXVpZXQtd3Jlbi05My5jbGVyay5hY2NvdW50cy5kZXYk";

function App() {
  const AppContent = () => (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tests" element={<TestModule />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/test/tat" element={<TATTest />} />
        <Route path="/test/ppdt" element={<PPDTTest />} />
        <Route path="/test/wat" element={<WATTest />} />
        <Route path="/test/srt" element={<SRTTest />} />
        <Route path="/test-results/:sessionId" element={<TestResultsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {PUBLISHABLE_KEY ? (
          <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
            <AppContent />
          </ClerkProvider>
        ) : (
          <AppContent />
        )}
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
