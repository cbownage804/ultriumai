import { Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

// Lazy load Vanguard pages for better performance
const VanguardHome = lazy(() => import('@/pages/vanguard/VanguardHome'));
const VanguardDashboard = lazy(() => import('@/pages/VanguardDashboard'));
const VanguardDevices = lazy(() => import('@/pages/VanguardDevices'));
const VanguardDeviceDetail = lazy(() => import('@/pages/VanguardDeviceDetail'));
const VanguardSetup = lazy(() => import('@/pages/VanguardSetup'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));

// Loading component for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Wrapper component for lazy loading with protection
const LazyProtectedPage = ({ component: Component }: { component: React.ComponentType }) => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  </ProtectedRoute>
);

// Export routes as an array to be spread into Routes
export const getVanguardRoutes = () => [
  <Route key="vanguard-auth" path="auth" element={
    <Suspense fallback={<PageLoader />}>
      <AuthPage />
    </Suspense>
  } />,
  <Route key="vanguard-index" index element={<LazyProtectedPage component={VanguardHome} />} />,
  <Route key="vanguard-dashboard" path="dashboard" element={<LazyProtectedPage component={VanguardDashboard} />} />,
  <Route key="vanguard-devices" path="devices" element={<LazyProtectedPage component={VanguardDevices} />} />,
  <Route key="vanguard-device-detail" path="devices/:deviceId" element={<LazyProtectedPage component={VanguardDeviceDetail} />} />,
  <Route key="vanguard-setup" path="setup" element={<LazyProtectedPage component={VanguardSetup} />} />,
  <Route key="vanguard-threats" path="threats" element={<LazyProtectedPage component={VanguardDashboard} />} />,
  <Route key="vanguard-soc" path="soc" element={<LazyProtectedPage component={VanguardDashboard} />} />,
  <Route key="vanguard-pentest" path="pentest" element={<LazyProtectedPage component={VanguardDashboard} />} />,
  <Route key="vanguard-compliance" path="compliance" element={<LazyProtectedPage component={VanguardDashboard} />} />,
  <Route key="vanguard-reports" path="reports" element={<LazyProtectedPage component={VanguardDashboard} />} />,
];
