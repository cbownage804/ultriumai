import { Outlet } from 'react-router-dom';
import { VanguardNavigation } from './VanguardNavigation';
import { VanguardCommandPalette } from './VanguardCommandPalette';
import { Toaster } from '@/components/ui/toaster';
import { VanguardAccessGate } from './VanguardAccessGate';
import { RealtimeNotificationCenter } from './RealtimeNotificationCenter';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { VanguardTrialBanner } from './VanguardTrialBanner';
import { MobileBottomNav } from './MobileBottomNav';

import { CortexFeaturesProvider } from '@/hooks/useCortexFeatures';
import { VanguardSubscriptionProvider } from '@/contexts/VanguardSubscriptionContext';
import { CrossModuleSyncTrigger } from './CrossModuleSyncTrigger';

export function VanguardLayout() {
  return (
    <LanguageProvider>
    <CortexFeaturesProvider>
    <VanguardSubscriptionProvider>
      <CrossModuleSyncTrigger />
      <VanguardAccessGate>
        {/* Force dark theme for Vanguard - Pure Black with Cyan & Purple Accents */}
        <div className="dark min-h-screen bg-[#050a0a]">
          {/* Subtle gradient overlay with cyan and purple */}
          <div className="fixed inset-0 bg-gradient-to-br from-cyan-500/[0.02] via-purple-500/[0.01] to-teal-500/[0.02] pointer-events-none" />
          
          {/* Global Command Palette */}
          <VanguardCommandPalette />
          
          {/* Navigation Sidebar */}
          <VanguardNavigation />

          {/* Main Content Area - offset for sidebar */}
          <div className="md:ml-56 transition-all duration-300 relative">
            {/* Trial Banner */}
            <VanguardTrialBanner />
            <main className="min-h-screen pt-12 md:pt-0 pb-16 md:pb-0">
              <Outlet />
            </main>
          </div>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />

          <Toaster />
        </div>
      </VanguardAccessGate>
    </VanguardSubscriptionProvider>
    </CortexFeaturesProvider>
    </LanguageProvider>
  );
}
