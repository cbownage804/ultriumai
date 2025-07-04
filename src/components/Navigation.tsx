import { Button } from "@/components/ui/button";
import { Menu, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ultraiumAiLogo from "/lovable-uploads/cc68d96a-bf0b-43b8-9da8-995a765fb472.png";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate('/');
    }
  };

  const handleNavigation = (path: string) => {
    if (path.startsWith('#')) {
      // Handle anchor links - navigate to home first if not already there
      if (location.pathname !== '/') {
        navigate('/');
        // Wait for navigation to complete, then scroll
        setTimeout(() => {
          const element = document.querySelector(path);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        // Already on home page, just scroll
        const element = document.querySelector(path);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      // Handle regular page navigation
      navigate(path);
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 animate-fade-in cursor-pointer" onClick={() => handleNavigation('/')}>
            <img src={ultraiumAiLogo} alt="UltriumAI" className="h-10 w-auto transition-transform duration-300 hover:scale-110" />
            <span className="text-xl font-bold text-foreground hover:text-gradient transition-all duration-300">UltriumAI</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => handleNavigation('#about')} className="text-foreground/80 hover:text-foreground transition-all duration-300 hover:scale-105 relative group">
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => handleNavigation('/ultriumgpt')} className="text-foreground/80 hover:text-foreground transition-all duration-300 hover:scale-105 relative group">
              UltriumGPT
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => handleNavigation('#features')} className="text-foreground/80 hover:text-foreground transition-all duration-300 hover:scale-105 relative group">
              Solutions
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => handleNavigation('#security')} className="text-foreground/80 hover:text-foreground transition-all duration-300 hover:scale-105 relative group">
              AI Security Apps
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => handleNavigation('#demo')} className="text-foreground/80 hover:text-foreground transition-all duration-300 hover:scale-105 relative group">
              Live Demos
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => handleNavigation('#contact')} className="text-foreground/80 hover:text-foreground transition-all duration-300 hover:scale-105 relative group">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </button>
          </div>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="hover:scale-105 transition-all duration-300">
              804-821-1410
            </Button>
            {user ? (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="hover:scale-110 transition-all duration-300">
                  <User className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:scale-110 transition-all duration-300 hover:text-destructive">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button variant="hero" onClick={() => navigate('/auth')} className="btn-glow hover:scale-105 transition-all duration-300">
                Sign In
              </Button>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-md border-t border-border/50">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button onClick={() => handleNavigation('#about')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                About
              </button>
              <button onClick={() => handleNavigation('/ultriumgpt')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                UltriumGPT
              </button>
              <button onClick={() => handleNavigation('#features')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                Solutions
              </button>
              <button onClick={() => handleNavigation('#security')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                AI Security Apps
              </button>
              <button onClick={() => handleNavigation('#demo')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                Live Demos
              </button>
              <button onClick={() => handleNavigation('#contact')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                Contact
              </button>
              <div className="flex flex-col space-y-2 pt-4 px-3">
                <Button variant="ghost" className="w-full">
                  804-821-1410
                </Button>
                {user ? (
                  <div className="flex flex-col space-y-2">
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button variant="hero" className="w-full" onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;