import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
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
import Solutions from '@/pages/Solutions';
import LiveDemos from '@/pages/LiveDemos';
import Docs from '@/pages/Docs';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import CreditsPurchase from '@/pages/CreditsPurchase';
import OnboardingFlow from '@/components/OnboardingFlow';
import SafeEmailDemoPage from '@/pages/demos/SafeEmailDemoPage';
import SafeLinkDemoPage from '@/pages/demos/SafeLinkDemoPage';
import SafeDocDemoPage from '@/pages/demos/SafeDocDemoPage';
import SafePassDemoPage from '@/pages/demos/SafePassDemoPage';
import SafeCompDemoPage from '@/pages/demos/SafeCompDemoPage';
import SafeNetDemoPage from '@/pages/demos/SafeNetDemoPage';
import UltriumGPTDemoPage from '@/pages/demos/UltriumGPTDemoPage';
import DarkWebDemoPage from '@/pages/demos/DarkWebDemoPage';
import SafeEmailPage from '@/pages/products/SafeEmailPage';
import SafeLinkPage from '@/pages/products/SafeLinkPage';
import SafeDocPage from '@/pages/products/SafeDocPage';
import SafePassPage from '@/pages/products/SafePassPage';
import SafeWebPage from '@/pages/products/SafeWebPage';
import SafeCompPage from '@/pages/products/SafeCompPage';
import SafeNetPage from '@/pages/products/SafeNetPage';
import { Loader2 } from 'lucide-react';

function AppRouter() {
  const { user, loading } = useAuth();
  
  // Automatically scroll to top on route changes
  useScrollToTop();

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
      <Route path="/credits" element={<CreditsPurchase />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <OnboardingFlow />
        </ProtectedRoute>
      } />
      <Route path="/ultriumgpt" element={<UltriumGPT />} />
      <Route path="/solutions" element={<Solutions />} />
      <Route path="/demos" element={<LiveDemos />} />
      <Route path="/docs" element={
        <ProtectedRoute>
          <Docs />
        </ProtectedRoute>
      } />
      <Route path="/demos/safeemail" element={<SafeEmailDemoPage />} />
      <Route path="/demos/safelink" element={<SafeLinkDemoPage />} />
      <Route path="/demos/safescan" element={<SafeDocDemoPage />} />
      <Route path="/demos/safepass" element={<SafePassDemoPage />} />
      <Route path="/demos/safedoc" element={<SafeDocDemoPage />} />
      <Route path="/demos/ultriumgpt" element={<UltriumGPTDemoPage />} />
      <Route path="/demos/safecomp" element={<SafeCompDemoPage />} />
      <Route path="/demos/safenet" element={<SafeNetDemoPage />} />
      <Route path="/demos/safeweb" element={<DarkWebDemoPage />} />
      
      {/* Product Pages */}
      <Route path="/products/safeemail" element={<SafeEmailPage />} />
      <Route path="/products/safelink" element={<SafeLinkPage />} />
      <Route path="/products/safedoc" element={<SafeDocPage />} />
      <Route path="/products/safepass" element={<SafePassPage />} />
      <Route path="/products/safeweb" element={<SafeWebPage />} />
      <Route path="/products/safecomp" element={<SafeCompPage />} />
      <Route path="/products/safenet" element={<SafeNetPage />} />
      
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
  // Initialize dark mode as default on app startup
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    // Ensure page starts at top on initial load
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <Router>
      <AppRouter />
      <Toaster />
    </Router>
  );
}