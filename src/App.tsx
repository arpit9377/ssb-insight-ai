
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import TestModule from '@/pages/TestModule';
import Progress from '@/pages/Progress';
import TraitAnalysis from '@/pages/TraitAnalysis';
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/tests" element={<TestModule />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/trait-analysis" element={<TraitAnalysis />} />
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
        </AuthProvider>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
