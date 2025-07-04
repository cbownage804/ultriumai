import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import GPTChat from '@/pages/GPTChat';
import NotFound from '@/pages/NotFound';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import Pricing from '@/pages/Pricing';
import UltriumGPT from '@/pages/UltriumGPT';
import LiveDemos from '@/pages/LiveDemos';
import SafeEmailDemoPage from '@/pages/demos/SafeEmailDemoPage';
import SafeLinkDemoPage from '@/pages/demos/SafeLinkDemoPage';
import SafeDocDemoPage from '@/pages/demos/SafeDocDemoPage';
import SafePassDemoPage from '@/pages/demos/SafePassDemoPage';
import SafeCompDemoPage from '@/pages/demos/SafeCompDemoPage';
import SafeNetDemoPage from '@/pages/demos/SafeNetDemoPage';
import UltriumGPTDemoPage from '@/pages/demos/UltriumGPTDemoPage';
import DarkWebDemoPage from '@/pages/demos/DarkWebDemoPage';
import { Loader2 } from 'lucide-react';

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/ultriumgpt" element={<UltriumGPT />} />
      <Route path="/demos" element={<LiveDemos />} />
      <Route path="/demos/safeemail" element={<SafeEmailDemoPage />} />
      <Route path="/demos/safelink" element={<SafeLinkDemoPage />} />
      <Route path="/demos/safescan" element={<SafeDocDemoPage />} />
      <Route path="/demos/safepass" element={<SafePassDemoPage />} />
      <Route path="/demos/safedoc" element={<SafeDocDemoPage />} />
      <Route path="/demos/ultriumgpt" element={<UltriumGPTDemoPage />} />
      <Route path="/demos/safecomp" element={<SafeCompDemoPage />} />
      <Route path="/demos/safenet" element={<SafeNetDemoPage />} />
      <Route path="/demos/safeweb" element={<DarkWebDemoPage />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/chat/:gptId" element={
        <ProtectedRoute>
          <GPTChat />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRouter />
      <Toaster />
    </Router>
  );
}