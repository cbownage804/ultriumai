import { Button } from "@/components/ui/button";
import { Menu, LogOut, X, ChevronDown, Package, Shield, Cpu, Monitor, Headphones, Sparkles, ArrowRight, DollarSign, Code2, Layers } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { WhatsNewSidebar } from "@/components/changelog/WhatsNewSidebar";
import { AIStudioMegaMenu } from "@/components/marketing/AIStudioMegaMenu";
import { AppSwitcher } from "@/components/AppSwitcher";
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
  
  // Get the correct dashboard path based on subdomain
  const getDashboardPath = () => {
    return '/hub';
  };
  
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with enhanced hover */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => handleNavigationWithMenuClose('/')}
          >
            <img 
              src={ultraiumAiLogo} 
              alt="UltriumAI" 
              className="h-9 w-auto transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" 
            />
            <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-foreground transition-all duration-300">
              UltriumAI
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-5">
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
                className="w-[90vw] max-w-[720px] p-0 bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-primary/10 via-transparent to-cyan-500/10 border-b border-border/30">
                  <h3 className="text-sm font-semibold text-foreground">Our Products</h3>
                  <p className="text-xs text-muted-foreground">AI-powered security & operations tools</p>
                </div>
                
                {/* Mega-menu grid: Products + AI Studio tools */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
                  {/* Left — Core Products (marketing pages) */}
                  <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Platforms</span>
                    
                    {/* SafeSuite */}
                    <button
                      onClick={() => handleNavigation('/products/safesuite')}
                      className="group/item flex items-start gap-3 p-3 rounded-xl hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition-all duration-200 text-left w-full"
                    >
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-black flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden">
                        <img src={safesuiteLogo} alt="SafeSuite" className="w-8 h-8 object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-foreground group-hover/item:text-emerald-500 transition-colors">SafeSuite™</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">Password vault, scanning, dark web</p>
                      </div>
                    </button>

                    {/* Vanguard Suite */}
                    <button
                      onClick={() => handleNavigation('/products/vanguard')}
                      className="group/item flex items-start gap-3 p-3 rounded-xl hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all duration-200 text-left w-full"
                    >
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-black flex items-center justify-center shadow-lg shadow-cyan-500/20 overflow-hidden">
                        <img src={vanguardLogo} alt="Vanguard" className="w-8 h-8 object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-foreground group-hover/item:text-cyan-500 transition-colors">Vanguard™</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">RMM, helpdesk, security & compliance</p>
                      </div>
                    </button>

                    {/* AI Studio */}
                    <button
                      onClick={() => handleNavigation('/products/ai-studio')}
                      className="group/item flex items-start gap-3 p-3 rounded-xl hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all duration-200 text-left w-full"
                    >
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-black flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
                        <img src={aiStudioLogo} alt="AI Studio" className="w-6 h-6 object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-foreground group-hover/item:text-primary transition-colors">AI Studio™</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">App Builder, GPT Builder, custom AI</p>
                      </div>
                    </button>
                  </div>

                  {/* Right — AI Studio Mega Menu */}
                  <div className="border-l border-border/30">
                    <AIStudioMegaMenu onNavigate={handleNavigation} />
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="px-5 py-3 bg-muted/30 border-t border-border/30 flex items-center justify-between">
                  <button
                    onClick={() => handleNavigation('/auth')}
                    className="text-xs font-medium text-foreground/60 hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <LogOut className="h-3 w-3 rotate-180" /> Log in to Apps
                  </button>
                  <button 
                    onClick={() => handleNavigation('/pricing')}
                    className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                  >
                    Compare plans <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200 flex items-center gap-1.5 group">
                  <DollarSign className="h-4 w-4 text-primary group-hover:text-primary" />
                  Pricing
                  <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                sideOffset={12}
                className="w-72 p-0 bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 bg-gradient-to-r from-primary/10 via-transparent to-cyan-500/10 border-b border-border/30">
                  <h3 className="text-sm font-semibold text-foreground">Pricing Plans</h3>
                  <p className="text-xs text-muted-foreground">Choose a product to view pricing</p>
                </div>
                <div className="p-2 space-y-0.5">
                  <button
                    onClick={() => handleNavigation('/pricing/vanguard')}
                    className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left group/item"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-md bg-black flex items-center justify-center overflow-hidden">
                      <img src={vanguardLogo} alt="Vanguard" className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground group-hover/item:text-cyan-500 transition-colors">Vanguard Suite</div>
                      <div className="text-xs text-muted-foreground">Per-technician plans & add-ons</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleNavigation('/pricing/ai-studio')}
                    className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left group/item"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-md bg-black flex items-center justify-center overflow-hidden">
                      <img src={aiStudioLogo} alt="AI Studio" className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground group-hover/item:text-primary transition-colors">AI Studio</div>
                      <div className="text-xs text-muted-foreground">AI capacity plans for teams & MSPs</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleNavigation('/pricing/safesuite')}
                    className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left group/item"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-md bg-black flex items-center justify-center overflow-hidden">
                      <img src={safesuiteLogo} alt="SafeSuite" className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground group-hover/item:text-emerald-500 transition-colors">SafeSuite</div>
                      <div className="text-xs text-muted-foreground">Security tools for businesses</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleNavigation('/pricing/custom-apps')}
                    className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left group/item"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-md bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <Code2 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground group-hover/item:text-amber-500 transition-colors">Custom Apps</div>
                      <div className="text-xs text-muted-foreground">We build your app from scratch</div>
                    </div>
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <button 
              onClick={() => handleNavigation('/docs')}
              className="relative text-sm font-medium text-foreground/70 hover:text-primary transition-all duration-300 group"
            >
              Docs
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary rounded-full group-hover:w-full transition-all duration-300" />
            </button>
            
            <button 
              onClick={() => handleNavigation('/contact')}
              className="relative text-sm font-medium text-foreground/70 hover:text-primary transition-all duration-300 group"
            >
              Contact
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary rounded-full group-hover:w-full transition-all duration-300" />
            </button>

            {user && (
              <>
                <button 
                  onClick={() => navigate(getDashboardPath())}
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
                >
                  My Hub
                </button>
                {isUltriumEmployee && (
                  <button 
                    onClick={() => navigate('/admin')}
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
              <div className="flex items-center gap-1.5">
                <AppSwitcher />
                <WhatsNewSidebar />
                <NotificationCenter />
                <ThemeToggle />
                <UserProfileDropdown />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button 
                  onClick={() => handleNavigation('/auth')} 
                  size="sm"
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
                >
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
                onClick={() => handleNavigationWithMenuClose('/products/ai-studio')} 
                className="flex items-center gap-3 w-full text-left px-3 py-2 text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md"
              >
                <div className="h-8 w-8 rounded-md bg-black p-0.5 flex items-center justify-center overflow-hidden">
                  <img src={aiStudioLogo} alt="AI Studio" className="h-full w-full object-contain" />
                </div>
                AI Studio™
              </button>
              
              <button 
                onClick={() => handleNavigationWithMenuClose('/products/vanguard')} 
                className="flex items-center gap-3 w-full text-left px-3 py-2 text-foreground/80 hover:text-cyan-500 hover:bg-muted/50 rounded-md"
              >
                <div className="h-8 w-8 rounded-md bg-black p-0.5 flex items-center justify-center overflow-hidden">
                  <img src={vanguardLogo} alt="Vanguard" className="h-full w-full object-contain" />
                </div>
                Vanguard™
              </button>
              
              <button 
                onClick={() => handleNavigationWithMenuClose('/products/safesuite')} 
                className="flex items-center gap-3 w-full text-left px-3 py-2 text-foreground/80 hover:text-emerald-500 hover:bg-muted/50 rounded-md"
              >
                <div className="h-8 w-8 rounded-md bg-black p-0.5 flex items-center justify-center overflow-hidden">
                  <img src={safesuiteLogo} alt="SafeSuite" className="h-full w-full object-contain" />
                </div>
                SafeSuite™
              </button>
              
              <button onClick={() => handleNavigationWithMenuClose('/hub')} className="flex items-center gap-2 w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md">
                <Package className="h-4 w-4" />
                Products
              </button>
              
              <div className="pl-3 space-y-0.5">
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing</p>
                <button onClick={() => handleNavigationWithMenuClose('/pricing/vanguard')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md text-sm">
                  Vanguard Suite
                </button>
                <button onClick={() => handleNavigationWithMenuClose('/pricing/ai-studio')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md text-sm">
                  AI Studio
                </button>
                <button onClick={() => handleNavigationWithMenuClose('/pricing/safesuite')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md text-sm">
                  SafeSuite
                </button>
                <button onClick={() => handleNavigationWithMenuClose('/pricing/custom-apps')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md text-sm">
                  Custom Apps
                </button>
              </div>
              
              <button onClick={() => handleNavigationWithMenuClose('/docs')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md">
                Docs
              </button>
              
              <button onClick={() => handleNavigationWithMenuClose('/contact')} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md">
                Contact
              </button>

              {user && (
                <>
                  <button onClick={() => { navigate(getDashboardPath()); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md">
                    My Hub
                  </button>
                  {isUltriumEmployee && (
                    <button onClick={() => { navigate('/admin'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md">
                      Admin
                    </button>
                  )}
                </>
              )}
              
              <div className="pt-4 px-3 space-y-2">
                
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
