import { Outlet } from 'react-router-dom';
import { VanguardNavigation } from './VanguardNavigation';
import { Toaster } from '@/components/ui/toaster';
import { VanguardAccessGate } from './VanguardAccessGate';

export function VanguardLayout() {
  return (
    <VanguardAccessGate>
      <div className="min-h-screen bg-gradient-to-br from-[#0a1a1a] via-[#0f2525] to-[#0a1a1a]">
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
