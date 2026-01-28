import { Button } from "@/components/ui/button";
import { Menu, LogOut, Phone, X, ChevronDown, Package, Shield, Cpu, Monitor, Headphones, Sparkles, ArrowRight } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserProfileDropdown from "./UserProfileDropdown";
import ultraiumAiLogo from "/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";
import aiStudioLogo from "@/assets/ai-studio-logo.png";
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
    // Clear local storage even if server returns error (e.g., session already expired)
    if (error && error.message !== 'Session not found') {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    handleNavigation('/');
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
              onClick={() => handleNavigation('/dashboard')}
              className="transition-transform duration-200 hover:scale-105"
              title="AI Studio™"
            >
              <div className="h-16 w-16 rounded-lg bg-black flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20 p-1">
                <img src={aiStudioLogo} alt="AI Studio" className="h-full w-full object-contain scale-150" />
              </div>
            </button>
            
            <button 
              onClick={() => handleNavigation('/vanguard')}
              className="transition-transform duration-200 hover:scale-105"
              title="Vanguard™"
            >
              <div className="h-16 w-16 rounded-lg bg-black flex items-center justify-center overflow-hidden shadow-lg shadow-cyan-500/20">
                <img src={vanguardLogo} alt="Vanguard" className="h-full w-full object-contain" />
              </div>
            </button>
            
            <button 
              onClick={() => handleNavigation('/safesuite')}
              className="transition-transform duration-200 hover:scale-105"
              title="SafeSuite™"
            >
              <div className="h-16 w-16 rounded-lg bg-black flex items-center justify-center overflow-hidden shadow-lg shadow-emerald-500/20 p-1">
                <img src={safesuiteLogo} alt="SafeSuite" className="h-full w-full object-contain scale-150" />
              </div>
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200 flex items-center gap-1.5 group">
                  <Sparkles className="h-4 w-4 text-primary group-hover:text-primary" />
                  Products
                  <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                sideOffset={12}
                className="w-[90vw] max-w-[520px] p-0 bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-primary/10 via-transparent to-cyan-500/10 border-b border-border/30">
                  <h3 className="text-sm font-semibold text-foreground">Our Products</h3>
                  <p className="text-xs text-muted-foreground">AI-powered security & operations tools</p>
                </div>
                
                {/* Products Grid - responsive columns */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                  {/* SafeSuite */}
                  <button
                    onClick={() => handleNavigation('/safesuite')}
                    className="group/item flex items-start gap-3 p-3 rounded-xl hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition-all duration-200 text-left"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-black flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden">
                      <img src={safesuiteLogo} alt="SafeSuite" className="w-10 h-10 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-foreground group-hover/item:text-emerald-500 transition-colors">SafeSuite™</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">Password vault, threat scanning, dark web monitoring</p>
                    </div>
                  </button>

                  {/* AI Studio */}
                  <button
                    onClick={() => handleNavigation('/dashboard')}
                    className="group/item flex items-start gap-3 p-3 rounded-xl hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all duration-200 text-left"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-black flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
                      <img src={aiStudioLogo} alt="AI Studio" className="w-10 h-10 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-foreground group-hover/item:text-primary transition-colors">AI Studio™</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">Business AI Control Plane for governed AI assistants</p>
                    </div>
                  </button>

                  {/* Vanguard Suite */}
                  <button
                    onClick={() => handleNavigation('/vanguard')}
                    className="group/item col-span-2 flex items-start gap-3 p-3 rounded-xl hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all duration-200 text-left"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-black flex items-center justify-center shadow-lg shadow-cyan-500/20 overflow-hidden">
                      <img src={vanguardLogo} alt="Vanguard" className="w-10 h-10 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-foreground group-hover/item:text-cyan-500 transition-colors">Vanguard Suite™</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">AI-powered security & operations platform with RMM, helpdesk, and compliance</p>
                    </div>
                  </button>
                </div>

                {/* Footer CTA */}
                <div className="px-5 py-3 bg-muted/30 border-t border-border/30 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Enterprise solutions available</span>
                  <button 
                    onClick={() => handleNavigation('/pricing')}
                    className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                  >
                    Compare plans <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <button 
              onClick={() => handleNavigation('/pricing')}
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
            >
              Pricing
            </button>
            
            <button 
              onClick={() => handleNavigation('/docs')}
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
            >
              Docs
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
                  onClick={() => handleNavigation('/hub')}
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
                onClick={() => handleNavigationWithMenuClose('/dashboard')} 
                className="flex items-center gap-3 w-full text-left px-3 py-2 text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md"
              >
                <div className="h-8 w-8 rounded-md bg-black p-0.5 flex items-center justify-center overflow-hidden">
                  <img src={aiStudioLogo} alt="AI Studio" className="h-full w-full object-contain" />
                </div>
                AI Studio™
              </button>
              
              <button 
                onClick={() => handleNavigationWithMenuClose('/vanguard')} 
                className="flex items-center gap-3 w-full text-left px-3 py-2 text-foreground/80 hover:text-cyan-500 hover:bg-muted/50 rounded-md"
              >
                <div className="h-8 w-8 rounded-md bg-black p-0.5 flex items-center justify-center overflow-hidden">
                  <img src={vanguardLogo} alt="Vanguard" className="h-full w-full object-contain" />
                </div>
                Vanguard™
              </button>
              
              <button 
                onClick={() => handleNavigationWithMenuClose('/safesuite')} 
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
              
              <button onClick={() => handleNavigationWithMenuClose('/docs')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md">
                Docs
              </button>
              
              <button onClick={() => handleNavigationWithMenuClose('/contact')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md">
                Contact
              </button>

              {user && (
                <>
                  <button onClick={() => handleNavigationWithMenuClose('/hub')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md">
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
