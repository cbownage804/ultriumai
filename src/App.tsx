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
import Security from '@/pages/Security';
import SmallBusiness from '@/pages/SmallBusiness';
import MediumBusiness from '@/pages/MediumBusiness';
import Enterprise from '@/pages/Enterprise';
import MSPs from '@/pages/MSPs';
import MSSPs from '@/pages/MSSPs';
import CreditsPurchase from '@/pages/CreditsPurchase';
import Contact from '@/pages/Contact';
import OnboardingFlow from '@/components/OnboardingFlow';
import SafeMailDemoPage from '@/pages/demos/SafeMailDemoPage';
import SafeLinkDemoPage from '@/pages/demos/SafeLinkDemoPage';
import SafeDocDemoPage from '@/pages/demos/SafeDocDemoPage';
import SafePassDemoPage from '@/pages/demos/SafePassDemoPage';
import SafeCompDemoPage from '@/pages/demos/SafeCompDemoPage';
import SafeNetDemoPage from '@/pages/demos/SafeNetDemoPage';
import UltriumGPTDemoPage from '@/pages/demos/UltriumGPTDemoPage';
import DarkWebDemoPage from '@/pages/demos/DarkWebDemoPage';
import SafeMailPage from '@/pages/products/SafeMailPage';
import SafeMailEmbedDemo from '@/pages/SafeMailEmbedDemo';
import SafeLinkPage from '@/pages/products/SafeLinkPage';
import SafeDocPage from '@/pages/products/SafeDocPage';
import SafePassPage from '@/pages/products/SafePassPage';
import SafeWebPage from '@/pages/products/SafeWebPage';
import SafeCompPage from '@/pages/products/SafeCompPage';
import SafeNetPage from '@/pages/products/SafeNetPage';
import EmbedDemo from '@/pages/EmbedDemo';
import SafeDocEmbedDemo from '@/pages/SafeDocEmbedDemo';
import MSPDemos from '@/pages/MSPDemos';
import MSPControlCenter from '@/pages/MSPDashboard';
import SafeNetConnectorPage from '@/pages/SafeNetConnectorPage';
import SafeNetMSPPage from '@/pages/SafeNetMSPPage';
import SafeNetMobilePage from '@/pages/SafeNetMobilePage';
import SafeSIEM from '@/pages/SafeSIEM';
import SafeSIEMAlertRules from '@/pages/SafeSIEMAlertRules';
import SafeSIEMIncidents from '@/pages/SafeSIEMIncidents';
import SafeSIEMAnalytics from '@/pages/SafeSIEMAnalytics';
import SecurityDashboard from '@/pages/SecurityDashboard';
import SafeWebDashboard from '@/pages/SafeWebDashboard';
import SafeWebMSPDashboard from '@/pages/SafeWebMSPDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
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
      <Route path="/contact" element={<Contact />} />
      <Route path="/credits" element={<CreditsPurchase />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/security" element={<Security />} />
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <OnboardingFlow />
        </ProtectedRoute>
      } />
      <Route path="/ultriumgpt" element={<UltriumGPT />} />
      <Route path="/small-business" element={<SmallBusiness />} />
      <Route path="/medium-business" element={<MediumBusiness />} />
      <Route path="/enterprise" element={<Enterprise />} />
      <Route path="/msps" element={<MSPs />} />
      <Route path="/mssps" element={<MSSPs />} />
      <Route path="/solutions" element={<Solutions />} />
      <Route path="/demos" element={<LiveDemos />} />
      <Route path="/msp-demos" element={<MSPDemos />} />
        <Route path="/msp-control-center" element={
          <ProtectedRoute>
            <MSPControlCenter />
          </ProtectedRoute>
        } />
      <Route path="/docs" element={
        <ProtectedRoute>
          <Docs />
        </ProtectedRoute>
      } />
      <Route path="/demos/safemail" element={<SafeMailDemoPage />} />
      <Route path="/demos/safelink" element={<SafeLinkDemoPage />} />
      <Route path="/demos/safescan" element={<SafeDocDemoPage />} />
      <Route path="/demos/safepass" element={<SafePassDemoPage />} />
      <Route path="/demos/safedoc" element={<SafeDocDemoPage />} />
      <Route path="/demos/ultriumgpt" element={<UltriumGPTDemoPage />} />
      <Route path="/demos/safecomp" element={<SafeCompDemoPage />} />
      <Route path="/demos/safenet" element={<SafeNetDemoPage />} />
      <Route path="/demos/safeweb" element={<DarkWebDemoPage />} />
      <Route path="/embed-demo" element={<EmbedDemo />} />
      <Route path="/safedoc-embed-demo" element={<SafeDocEmbedDemo />} />
      <Route path="/safemail-embed-demo" element={<SafeMailEmbedDemo />} />
      
      {/* SafeNet App Routes */}
      <Route path="/safenet-connector" element={
        <ProtectedRoute>
          <SafeNetConnectorPage />
        </ProtectedRoute>
      } />
      <Route path="/safenet-msp-dashboard" element={
        <ProtectedRoute>
          <SafeNetMSPPage />
        </ProtectedRoute>
      } />
      <Route path="/safenet-mobile" element={<SafeNetMobilePage />} />
      <Route path="/safesiem" element={
        <ProtectedRoute>
          <SafeSIEM />
        </ProtectedRoute>
      } />
      <Route path="/safesiem/alert-rules" element={
        <ProtectedRoute>
          <SafeSIEMAlertRules />
        </ProtectedRoute>
      } />
      <Route path="/safesiem/incidents" element={
        <ProtectedRoute>
          <SafeSIEMIncidents />
        </ProtectedRoute>
      } />
      <Route path="/safesiem/analytics" element={
        <ProtectedRoute>
          <SafeSIEMAnalytics />
        </ProtectedRoute>
      } />
      <Route path="/security-dashboard" element={
        <ProtectedRoute>
          <SecurityDashboard />
        </ProtectedRoute>
      } />
      <Route path="/safeweb-dashboard" element={
        <ProtectedRoute>
          <SafeWebDashboard />
        </ProtectedRoute>
      } />
      <Route path="/safeweb-msp-dashboard" element={
        <ProtectedRoute>
          <SafeWebMSPDashboard />
        </ProtectedRoute>
      } />
      
      {/* Product Pages */}
      <Route path="/products/safemail" element={<SafeMailPage />} />
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