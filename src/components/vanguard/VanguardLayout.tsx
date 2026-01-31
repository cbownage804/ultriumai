import { Outlet } from 'react-router-dom';
import { VanguardNavigation } from './VanguardNavigation';
import { VanguardCommandPalette } from './VanguardCommandPalette';
import { Toaster } from '@/components/ui/toaster';
import { VanguardAccessGate } from './VanguardAccessGate';
import { RealtimeNotificationCenter } from './RealtimeNotificationCenter';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { FloatingHelpButton } from '@/components/help/FloatingHelpButton';

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
          
          {/* Top Bar with Notifications & Language - positioned to avoid overlap */}
          <div className="fixed top-4 right-4 z-40 flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-cyan-500/20">
            <LanguageSwitcher />
            <div className="w-px h-5 bg-cyan-500/30" />
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

          {/* Floating Help Button */}
          <FloatingHelpButton />

          <Toaster />
        </div>
      </VanguardAccessGate>
    </LanguageProvider>
  );
}
