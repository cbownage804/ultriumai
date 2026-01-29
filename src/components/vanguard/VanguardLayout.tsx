import { Outlet } from 'react-router-dom';
import { VanguardNavigation } from './VanguardNavigation';
import { Toaster } from '@/components/ui/toaster';
import { VanguardAccessGate } from './VanguardAccessGate';

export function VanguardLayout() {
  return (
    <VanguardAccessGate>
      <div className="min-h-screen bg-[#f5f5f5]">
        {/* Navigation Sidebar */}
        <VanguardNavigation />

        {/* Main Content Area - offset for sidebar */}
        <div className="md:ml-56 transition-all duration-300">
          <main className="min-h-screen">
            <Outlet />
          </main>
        </div>

        <Toaster />
      </div>
    </VanguardAccessGate>
  );
}
