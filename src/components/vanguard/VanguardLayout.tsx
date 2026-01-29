import { Outlet } from 'react-router-dom';
import { VanguardNavigation } from './VanguardNavigation';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VanguardAIChat } from './VanguardAIChat';
import { VanguardAccessGate } from './VanguardAccessGate';

export function VanguardLayout() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
   await signOut();
   toast({
     title: "Signed out",
     description: "You have been successfully signed out.",
   });
    // signOut now handles navigation with full page reload
  };

  return (
    <VanguardAccessGate>
      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Navigation Sidebar */}
        <VanguardNavigation />

        {/* Main Content Area - responsive margin for sidebar */}
        <div className="md:ml-64 transition-all duration-300">
          {/* Top Header Bar - mobile optimized with safe areas */}
          <header className="sticky top-0 z-30 h-14 md:h-16 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 md:px-6 safe-area-inset-top">
            <div className="flex items-center gap-2 ml-12 md:ml-0">
              <span className="text-xs md:text-sm text-white/50">Ultrium</span>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-semibold text-sm md:text-base animate-glow">Vanguard</span>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              {user && (
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="hidden md:flex items-center gap-2 text-sm text-white/60 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline max-w-[150px] truncate">{user.email}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleSignOut}
                    className="hover:text-red-400 hover:bg-red-500/10 h-10 w-10 md:h-9 md:w-9 text-white/60 touch-target rounded-xl"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </header>

          {/* Page Content - responsive padding with safe areas */}
          <main className="min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)] pb-20 md:pb-0 safe-area-inset-bottom animate-fade-in">
            <Outlet />
          </main>
        </div>

        <Toaster />
        <VanguardAIChat />
      </div>
    </VanguardAccessGate>
  );
}
