import { Button } from "@/components/ui/button";
import { Menu, LogOut, User, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createNavigationHandler } from "@/hooks/useScrollToTop";
import ThemeToggle from "./ThemeToggle";
import UserProfileDropdown from "./UserProfileDropdown";
import ultraiumAiLogo from "/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSecurityDropdownOpen, setIsSecurityDropdownOpen] = useState(false);
  const [isBusinessDropdownOpen, setIsBusinessDropdownOpen] = useState(false);
  const [isDemosDropdownOpen, setIsDemosDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use the navigation utility for consistent scroll behavior
  const handleNavigation = createNavigationHandler(navigate);
  
  // Close menu when navigating
  const handleNavigationWithMenuClose = (path: string) => {
    handleNavigation(path);
    setIsMenuOpen(false);
    setIsSecurityDropdownOpen(false);
    setIsBusinessDropdownOpen(false);
    setIsDemosDropdownOpen(false);
  };

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
      handleNavigation('/');
    }
  };

  // Remove the old handleNavigation function since we're using the utility now

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigationWithMenuClose('/')}>
            <img src={ultraiumAiLogo} alt="UltriumAI - AI-powered knowledge management platform for MSPs and MSSPs" className="h-12 w-auto transition-transform duration-300 hover:scale-110" />
            <span className="text-xl font-bold text-foreground transition-colors duration-300">UltriumAI</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setIsSecurityDropdownOpen(!isSecurityDropdownOpen)}
                className="text-base font-medium text-foreground/70 hover:text-foreground transition-colors duration-200 relative group flex items-center gap-1"
              >
                MSPs
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isSecurityDropdownOpen ? 'rotate-180' : ''}`} />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </button>
              {isSecurityDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <button onClick={() => { handleNavigationWithMenuClose('/msps'); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-muted/50">MSPs</button>
                    <button onClick={() => { handleNavigationWithMenuClose('/mssps'); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-muted/50">MSSPs</button>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsBusinessDropdownOpen(!isBusinessDropdownOpen)}
                className="text-base font-medium text-foreground/70 hover:text-foreground transition-colors duration-200 relative group flex items-center gap-1"
              >
                Business
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isBusinessDropdownOpen ? 'rotate-180' : ''}`} />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </button>
              {isBusinessDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <button onClick={() => { handleNavigationWithMenuClose('/small-business'); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-muted/50">Small Business</button>
                    <button onClick={() => { handleNavigationWithMenuClose('/medium-business'); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-muted/50">Medium Business</button>
                    <button onClick={() => { handleNavigationWithMenuClose('/enterprise'); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-muted/50">Enterprise</button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => handleNavigation('/ultriumgpt')} className="text-base font-medium text-foreground/70 hover:text-foreground transition-colors duration-200 relative group">
              UltriumGPT
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => handleNavigation('/solutions')} className="text-base font-medium text-foreground/70 hover:text-foreground transition-colors duration-200 relative group">
              Solutions
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsDemosDropdownOpen(!isDemosDropdownOpen)}
                className="text-base font-medium text-foreground/70 hover:text-foreground transition-colors duration-200 relative group flex items-center gap-1"
              >
                Demos
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isDemosDropdownOpen ? 'rotate-180' : ''}`} />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </button>
              {isDemosDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <button onClick={() => { handleNavigationWithMenuClose('/demos'); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-muted/50">Business Demos</button>
                    <button onClick={() => { handleNavigationWithMenuClose('/msp-demos'); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-muted/50">MSP Demos</button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => handleNavigation('/msp-control-center')} className="text-base font-medium text-foreground/70 hover:text-foreground transition-colors duration-200 relative group">
              MSP Control Center
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => handleNavigation('/contact')} className="text-base font-medium text-foreground/70 hover:text-foreground transition-colors duration-200 relative group">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </button>
            {user ? (
              <button onClick={() => handleNavigation('/docs')} className="text-base font-medium text-foreground/70 hover:text-foreground transition-colors duration-200 relative group">
                KB
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </button>
            ) : null}
          </div>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="hover:scale-105 transition-all duration-300">
              804-821-1410
            </Button>
            {user ? (
              <div className="flex items-center space-x-2">
                <UserProfileDropdown />
                <ThemeToggle />
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:scale-110 transition-all duration-300 hover:text-destructive">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <Button variant="hero" onClick={() => handleNavigation('/auth')} className="btn-glow hover:scale-105 transition-all duration-300">
                  Sign In
                </Button>
              </div>
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
              <button onClick={() => handleNavigationWithMenuClose('/msps')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                MSPs
              </button>
              <button onClick={() => handleNavigationWithMenuClose('/mssps')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                MSSPs
              </button>
              <button onClick={() => handleNavigationWithMenuClose('/small-business')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                Small Business
              </button>
              <button onClick={() => handleNavigationWithMenuClose('/medium-business')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                Medium Business
              </button>
              <button onClick={() => handleNavigationWithMenuClose('/enterprise')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                Enterprise
              </button>
              <button onClick={() => handleNavigationWithMenuClose('/ultriumgpt')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                UltriumGPT
              </button>
              <button onClick={() => handleNavigationWithMenuClose('/solutions')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                Solutions
              </button>
              <button onClick={() => handleNavigationWithMenuClose('#security')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                AI Security Apps
              </button>
              <button onClick={() => handleNavigationWithMenuClose('/demos')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                Business Demos
              </button>
              <button onClick={() => handleNavigationWithMenuClose('/msp-demos')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                MSP Demos
              </button>
              <button onClick={() => handleNavigationWithMenuClose('/msp-control-center')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                MSP Control Center
              </button>
              <button onClick={() => handleNavigationWithMenuClose('/contact')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                Contact
              </button>
              {user ? (
                <button onClick={() => handleNavigationWithMenuClose('/docs')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground">
                  KB
                </button>
              ) : null}
              <div className="flex flex-col space-y-2 pt-4 px-3">
                <Button variant="ghost" className="w-full">
                  804-821-1410
                </Button>
                {user ? (
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" className="w-full" onClick={() => handleNavigationWithMenuClose('/dashboard')}>
                      Dashboard
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    <div className="flex items-center justify-center py-2">
                      <ThemeToggle />
                    </div>
                    <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-center py-2">
                      <ThemeToggle />
                    </div>
                    <Button variant="hero" className="w-full" onClick={() => handleNavigationWithMenuClose('/auth')}>
                      Sign In
                    </Button>
                  </div>
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