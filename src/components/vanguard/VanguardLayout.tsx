import { Outlet } from 'react-router-dom';
import { VanguardNavigation } from './VanguardNavigation';
import { VanguardCommandPalette } from './VanguardCommandPalette';
import { Toaster } from '@/components/ui/toaster';
import { VanguardAccessGate } from './VanguardAccessGate';
import { RealtimeNotificationCenter } from './RealtimeNotificationCenter';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LanguageProvider } from '@/contexts/LanguageContext';

export function VanguardLayout() {
  return (
    <LanguageProvider>
      <VanguardAccessGate>
        {/* Force dark theme for Vanguard - Pure Black with Cyan & Purple Accents */}
        <div className="dark min-h-screen bg-[#050a0a]">
          {/* Subtle gradient overlay with cyan and purple */}
          <div className="fixed inset-0 bg-gradient-to-br from-cyan-500/[0.02] via-purple-500/[0.01] to-teal-500/[0.02] pointer-events-none" />
          
          {/* Global Command Palette */}
          <VanguardCommandPalette />
          
          {/* Top Bar with Notifications & Language */}
          <div className="fixed top-0 right-0 z-40 p-3 flex items-center gap-2">
            <LanguageSwitcher />
            <RealtimeNotificationCenter />
          </div>
          
          {/* Navigation Sidebar */}
          <VanguardNavigation />

          {/* Main Content Area - offset for sidebar */}
          <div className="md:ml-56 transition-all duration-300 relative">
            <main className="min-h-screen pt-12 md:pt-0">
              <Outlet />
            </main>
          </div>

          <Toaster />
        </div>
      </VanguardAccessGate>
    </LanguageProvider>
  );
}
