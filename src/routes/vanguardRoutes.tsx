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

// Loading component for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Wrapper component for lazy loading
const LazyPage = ({ component: Component }: { component: React.ComponentType }) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const vanguardRoutes = [
  {
    path: '',
    element: (
      <ProtectedRoute>
        <LazyPage component={VanguardHome} />
      </ProtectedRoute>
    ),
    index: true
  },
  {
    path: 'dashboard',
    element: (
      <ProtectedRoute>
        <LazyPage component={VanguardDashboard} />
      </ProtectedRoute>
    )
  },
  {
    path: 'devices',
    element: (
      <ProtectedRoute>
        <LazyPage component={VanguardDevices} />
      </ProtectedRoute>
    )
  },
  {
    path: 'devices/:deviceId',
    element: (
      <ProtectedRoute>
        <LazyPage component={VanguardDeviceDetail} />
      </ProtectedRoute>
    )
  },
  {
    path: 'setup',
    element: (
      <ProtectedRoute>
        <LazyPage component={VanguardSetup} />
      </ProtectedRoute>
    )
  },
  {
    path: 'threats',
    element: (
      <ProtectedRoute>
        <LazyPage component={VanguardDashboard} />
      </ProtectedRoute>
    )
  },
  {
    path: 'soc',
    element: (
      <ProtectedRoute>
        <LazyPage component={VanguardDashboard} />
      </ProtectedRoute>
    )
  },
  {
    path: 'pentest',
    element: (
      <ProtectedRoute>
        <LazyPage component={VanguardDashboard} />
      </ProtectedRoute>
    )
  },
  {
    path: 'compliance',
    element: (
      <ProtectedRoute>
        <LazyPage component={VanguardDashboard} />
      </ProtectedRoute>
    )
  },
  {
    path: 'reports',
    element: (
      <ProtectedRoute>
        <LazyPage component={VanguardDashboard} />
      </ProtectedRoute>
    )
  }
];

// Helper to generate Route components
export function VanguardRouteElements() {
  return (
    <>
      {vanguardRoutes.map((route, index) => (
        <Route
          key={route.path || 'index'}
          index={route.index}
          path={route.index ? undefined : route.path}
          element={route.element}
        />
      ))}
    </>
  );
}
