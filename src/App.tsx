
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Index from '@/pages/Index';
import About from '@/pages/About';
import Services from '@/pages/Services';
import Pricing from '@/pages/Pricing';
import Contact from '@/pages/Contact';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import Refunds from '@/pages/Refunds';
import ShippingPolicy from '@/pages/ShippingPolicy';
import FAQ from '@/pages/FAQ';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import TestModule from '@/pages/TestModule';
import Tests from '@/pages/Tests';
import Progress from '@/pages/Progress';
import TraitAnalysis from '@/pages/TraitAnalysis';
import Leaderboard from '@/pages/Leaderboard';
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
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/pricing" element={<Navigate to="/subscription" replace />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refunds" element={<Refunds />} />
              <Route path="/shipping" element={<ShippingPolicy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/tests" element={<Tests />} />
              <Route path="/progress" element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              } />
              <Route path="/trait-analysis" element={
                <ProtectedRoute>
                  <TraitAnalysis />
                </ProtectedRoute>
              } />
              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/test" element={<Navigate to="/tests" replace />} />
              <Route path="/test/tat" element={
                <ProtectedRoute>
                  <TATTest />
                </ProtectedRoute>
              } />
              <Route path="/test/ppdt" element={
                <ProtectedRoute>
                  <PPDTTest />
                </ProtectedRoute>
              } />
              <Route path="/test/wat" element={
                <ProtectedRoute>
                  <WATTest />
                </ProtectedRoute>
              } />
              <Route path="/test/srt" element={
                <ProtectedRoute>
                  <SRTTest />
                </ProtectedRoute>
              } />
              <Route path="/test-results/:sessionId" element={
                <ProtectedRoute>
                  <TestResultsPage />
                </ProtectedRoute>
              } />
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
