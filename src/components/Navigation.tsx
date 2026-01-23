import { Button } from "@/components/ui/button";
import { Menu, LogOut, Phone, X, ChevronDown, Package } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { useToast } from "@/hooks/use-toast";
import { createNavigationHandler } from "@/hooks/useScrollToTop";
import ThemeToggle from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserProfileDropdown from "./UserProfileDropdown";
import ultraiumAiLogo from "/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";
import ultriumGPTLogo from "@/assets/ultrium-gpt-logo.png";
import vanguardLogo from "@/assets/vanguard-logo.png";
import { safesuiteLogo } from "@/components/safesuite/SafeSuiteProductIcons";
import { safeWindowOpen } from "@/utils/security";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isUltriumEmployee } = useAccountType();
  const { toast } = useToast();
  
  const handleNavigation = createNavigationHandler(navigate);
  
  const handleNavigationWithMenuClose = (path: string) => {
    handleNavigation(path);
    setIsMenuOpen(false);
  };

  const handleExternalLink = (url: string) => {
    window.location.href = url;
    setIsMenuOpen(false);
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigationWithMenuClose('/')}>
            <img src={ultraiumAiLogo} alt="UltriumAI" className="h-8 w-auto transition-transform duration-300 hover:scale-110" />
            <span className="text-lg font-bold text-foreground">UltriumAI</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => handleNavigation('/ai-studio')}
              className="transition-transform duration-200 hover:scale-105"
              title="AI Studio™"
            >
              <div className="h-12 w-12 rounded-lg bg-black flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
                <img src={ultriumGPTLogo} alt="AI Studio" className="h-full w-full object-contain scale-110" />
              </div>
            </button>
            
            <button 
              onClick={() => handleExternalLink('https://vanguard.ultriumai.com')}
              className="transition-transform duration-200 hover:scale-105"
              title="Vanguard™"
            >
              <div className="h-12 w-12 rounded-lg bg-black flex items-center justify-center overflow-hidden shadow-lg shadow-cyan-500/20">
                <img src={vanguardLogo} alt="Vanguard" className="h-full w-full object-contain" />
              </div>
            </button>
            
            <button 
              onClick={() => handleExternalLink('https://safesuite.ultriumai.com')}
              className="transition-transform duration-200 hover:scale-105"
              title="SafeSuite™"
            >
              <div className="h-12 w-12 rounded-lg bg-black flex items-center justify-center overflow-hidden shadow-lg shadow-emerald-500/20">
                <img src={safesuiteLogo} alt="SafeSuite" className="h-full w-full object-contain scale-110" />
              </div>
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200 flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  Products
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Security Suite</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleNavigation('/products/safescan')}>
                  SafeScan™ - Vulnerability Scanner
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/products/safepass')}>
                  SafePass™ - Password Manager
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/products/safeweb')}>
                  SafeWeb™ - Dark Web Monitoring
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/products/safelink')}>
                  SafeLink™ - URL Scanner
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/products/safemail')}>
                  SafeMail™ - Email Security
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/products/safedoc')}>
                  SafeDoc™ - Document Scanner
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Operations</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleNavigation('/products/rmm')}>
                  SafeOps™ - Remote Monitoring
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/products/helpdesk')}>
                  SafeDesk™ - IT Service Desk
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/products/safetrack')}>
                  SafeTrack™ - Asset Management
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">AI Platform</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleNavigation('/ai-studio')}>
                  AI Studio™ - Custom AI Builder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <button 
              onClick={() => handleNavigation('/pricing')}
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
            >
              Pricing
            </button>
            
            <button 
              onClick={() => handleNavigation('/contact')}
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
            >
              Contact
            </button>

            {user && (
              <>
                <button 
                  onClick={() => handleNavigation('/dashboard')}
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
                >
                  Dashboard
                </button>
                {isUltriumEmployee && (
                  <button 
                    onClick={() => handleNavigation('/admin')}
                    className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
                  >
                    Admin
                  </button>
                )}
              </>
            )}
          </div>
          
          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            <a href="tel:888-884-1410" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Phone className="h-4 w-4" />
              888-884-1410
            </a>
            
            {user ? (
              <div className="flex items-center gap-2">
                <UserProfileDropdown />
                <ThemeToggle />
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:text-destructive h-8 w-8">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button onClick={() => handleNavigation('/auth')} size="sm">
                  Sign In
                </Button>
              </div>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background border-t border-border/50 py-4">
            <div className="space-y-1">
              <button 
                onClick={() => handleNavigationWithMenuClose('/ai-studio')} 
                className="flex items-center gap-3 w-full text-left px-3 py-2 text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md"
              >
                <div className="h-8 w-8 rounded-md bg-black p-0.5 flex items-center justify-center overflow-hidden">
                  <img src={ultriumGPTLogo} alt="AI Studio" className="h-full w-full object-contain" />
                </div>
                AI Studio™
              </button>
              
              <button 
                onClick={() => handleExternalLink('https://vanguard.ultriumai.com')} 
                className="flex items-center gap-3 w-full text-left px-3 py-2 text-foreground/80 hover:text-destructive hover:bg-muted/50 rounded-md"
              >
                <div className="h-8 w-8 rounded-md bg-black p-0.5 flex items-center justify-center overflow-hidden">
                  <img src={vanguardLogo} alt="Vanguard" className="h-full w-full object-contain" />
                </div>
                Vanguard™
              </button>
              
              <button 
                onClick={() => handleExternalLink('https://safesuite.ultriumai.com')} 
                className="flex items-center gap-3 w-full text-left px-3 py-2 text-foreground/80 hover:text-emerald-500 hover:bg-muted/50 rounded-md"
              >
                <div className="h-8 w-8 rounded-md bg-black p-0.5 flex items-center justify-center overflow-hidden">
                  <img src={safesuiteLogo} alt="SafeSuite" className="h-full w-full object-contain" />
                </div>
                SafeSuite™
              </button>
              
              <button onClick={() => handleNavigationWithMenuClose('/portfolio')} className="flex items-center gap-2 w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md">
                <Package className="h-4 w-4" />
                Products
              </button>
              
              <button onClick={() => handleNavigationWithMenuClose('/pricing')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md">
                Pricing
              </button>
              
              <button onClick={() => handleNavigationWithMenuClose('/contact')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md">
                Contact
              </button>

              {user && (
                <>
                  <button onClick={() => handleNavigationWithMenuClose('/dashboard')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md">
                    Dashboard
                  </button>
                  {isUltriumEmployee && (
                    <button onClick={() => handleNavigationWithMenuClose('/admin')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md">
                      Admin
                    </button>
                  )}
                </>
              )}
              
              <div className="pt-4 px-3 space-y-2">
                <a href="tel:888-884-1410" className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  888-884-1410
                </a>
                
                {user ? (
                  <Button variant="outline" className="w-full" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => handleNavigationWithMenuClose('/auth')}>
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
