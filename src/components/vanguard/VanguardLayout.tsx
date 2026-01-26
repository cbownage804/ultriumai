import { Outlet } from 'react-router-dom';
import { VanguardNavigation } from './VanguardNavigation';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { VanguardAIChat } from './VanguardAIChat';

export function VanguardLayout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    // Always proceed with sign out - session might already be expired on server
    const isSessionGone = !error || 
      error.message?.toLowerCase().includes('session') || 
      (error as any)?.code === 'session_not_found';
    
    if (!isSessionGone) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
    
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navigation Sidebar */}
      <VanguardNavigation />

      {/* Main Content Area - responsive margin for sidebar */}
      <div className="md:ml-64 transition-all duration-300">
        {/* Top Header Bar - mobile optimized */}
        <header className="sticky top-0 z-30 h-14 md:h-16 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 ml-10 md:ml-0">
            <span className="text-xs md:text-sm text-white/50">Ultrium</span>
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-semibold text-sm md:text-base">Vanguard</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            {user && (
              <div className="flex items-center gap-1 md:gap-2">
                <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
                  <User className="h-4 w-4" />
                  <span className="hidden lg:inline max-w-[150px] truncate">{user.email}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut}
                  className="hover:text-red-400 hover:bg-red-500/10 h-8 w-8 md:h-9 md:w-9 text-white/60"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content - responsive padding */}
        <main className="min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)] pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      <Toaster />
      <VanguardAIChat />
    </div>
  );
}
