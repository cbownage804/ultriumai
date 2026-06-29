import { MessageSquare, History, Settings, User, LogOut, Bot, Crown, Zap, Star, Check, BarChart3, Users, TrendingUp, Key, Palette, Shield, Home, ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { NavLink, useNavigate, useLocation, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ultraiumAiLogo from "/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";
import aiStudioLogo from "@/assets/ai-studio-logo.png";


import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";

// General GPT section items (always visible)
const gptGeneralItems = [
  { title: "GPT Dashboard", url: "/dashboard/gpt", icon: Bot, tooltip: "Custom GPT overview and analytics" },
  { title: "Templates", url: "/dashboard/gpt/templates", icon: Star, tooltip: "Browse pre-built GPT templates for common use cases" },
  { title: "Build New", url: "/ai-studio/gpt-builder", icon: Bot, tooltip: "Create a new custom AI assistant" },
];

// GPT-specific items (only visible when a GPT is selected)
const getGptSpecificItems = (gptId: string) => [
  { title: "Chat", url: `/chat/${gptId}`, icon: MessageSquare, tooltip: "Chat with this GPT" },
  { title: "Edit", url: `/ai-studio/gpt-builder/${gptId}`, icon: Bot, tooltip: "Edit GPT configuration" },
  { title: "Personalize", url: `/ai-studio/settings/${gptId}`, icon: User, tooltip: "Customize appearance and behavior" },
  { title: "Actions", url: `/ai-studio/actions/${gptId}`, icon: Zap, tooltip: "Configure custom actions" },
  { title: "Analyze", url: `/ai-studio/analytics/${gptId}`, icon: BarChart3, tooltip: "View performance metrics" },
  { title: "Deploy", url: `/ai-studio/deploy/${gptId}`, icon: Settings, tooltip: "Deploy and share this GPT" },
];

// Management items removed - all functionality now lives per-GPT
// (Integrations tab for API, Branding tab for white-label, Team tab for team management, Analytics tab for analytics)

const accountItems = [
  { title: "Profile", url: "/dashboard/profile", icon: User, tooltip: "Manage your account profile and personal information" },
  { title: "Security", url: "/dashboard/security", icon: Shield, tooltip: "Configure security settings and two-factor authentication" },
];

const adminItems = [
  { title: "Platform Admin", url: "/admin", icon: Crown, tooltip: "Platform-wide administration and management" },
];

// Helper to extract GPT ID from various route patterns
const extractGptIdFromPath = (pathname: string, searchParams: string): string | null => {
  // Check for /chat/:gptId pattern
  const chatMatch = pathname.match(/^\/chat\/([^/]+)/);
  if (chatMatch) return chatMatch[1];
  
  // Check for /ai-studio/*/gptId patterns
  const aiStudioMatch = pathname.match(/^\/ai-studio\/[^/]+\/([^/]+)/);
  if (aiStudioMatch) return aiStudioMatch[1];
  
  // Check for ?edit=gptId query param
  const params = new URLSearchParams(searchParams);
  const editId = params.get('edit');
  if (editId) return editId;
  
  return null;
};

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  
  // Extract GPT ID from current route
  const currentGptId = extractGptIdFromPath(location.pathname, location.search);
  const gptSpecificItems = currentGptId ? getGptSpecificItems(currentGptId) : [];
  
  // Check if user is admin (UltriumAI employee with confirmed email)
  const isAdmin = user?.email?.endsWith('@ultriumai.com') && user?.email_confirmed_at != null;
  
  const [openSections, setOpenSections] = useState({
    gpt: true,
    gptSpecific: true
  });
  
  const isCollapsed = state === "collapsed";

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
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
    navigate('/');
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const getPlanLabel = (tier?: string | null) => {
    if (!tier) return null;
    const labels: Record<string, string> = {
      free: "Free",
      enterprise: "Enterprise",
      professional: "Professional",
      starter: "Starter",
      msp_starter: "MSP Starter",
      msp_pro: "MSP Pro",
      msp_elite: "MSP Elite",
      platform_pro: "Platform Pro",
      team_basic: "Team Basic",
      team_plus: "Team Plus",
      website_basic: "Website Basic",
      website_pro: "Website Pro",
      safesuite_pro: "Wrayth Pro",
      safesuite_business: "Wrayth Business",
      safesuite_enterprise: "Wrayth Enterprise",
    };

    return labels[tier] || tier;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3">
          <NavLink to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 rounded-lg overflow-hidden bg-black p-1">
              <img src={aiStudioLogo} alt="AI Studio" className="h-full w-full object-contain" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold text-foreground">AI Studio</span>
            )}
          </NavLink>
        </div>
        {/* Back to Product Hub */}
        {!isCollapsed && (
          <div className="mt-2">
            <NavLink 
              to="/hub" 
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Product Hub
            </NavLink>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Main dashboard overview and summary">
                  <NavLink to="/dashboard" end className={getNavClass}>
                    <Home className="h-4 w-4" />
                    {!isCollapsed && <span className="ml-2">Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="GPT Builder - Build custom AI chatbots">
                  <NavLink to="/ai-studio/gpt-builder" className={getNavClass}>
                    <Bot className="h-4 w-4 text-primary" />
                    {!isCollapsed && <span className="ml-2 font-semibold text-primary">GPT Builder</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="AI App Builder - Build full apps with AI">
                  <NavLink to="/ai-studio/app-builder" className={getNavClass}>
                    <Zap className="h-4 w-4 text-cyan-400" />
                    {!isCollapsed && <span className="ml-2 font-semibold text-cyan-400">App Builder</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Custom GPTs Section - General Items */}
        <Collapsible open={openSections.gpt} onOpenChange={() => toggleSection('gpt')}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 rounded-md px-2 py-1">
                <span className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  {!isCollapsed && "Custom GPTs"}
                </span>
                {!isCollapsed && (
                  openSections.gpt ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {gptGeneralItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.tooltip}>
                        <NavLink to={item.url} className={getNavClass}>
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span className="ml-2">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* GPT-Specific Section - Only visible when a GPT is selected */}
        {currentGptId && (
          <Collapsible open={openSections.gptSpecific} onOpenChange={() => toggleSection('gptSpecific')}>
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 rounded-md px-2 py-1">
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    {!isCollapsed && "Current GPT"}
                  </span>
                  {!isCollapsed && (
                    openSections.gptSpecific ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {gptSpecificItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild tooltip={item.tooltip}>
                          <NavLink to={item.url} className={getNavClass}>
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span className="ml-2">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}


        {/* Management section removed - all functionality now lives per-GPT */}


        {/* Premium Upgrade Section removed - users can access pricing via menu if needed */}

        {/* Account Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {!isCollapsed && "Account"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.tooltip}>
                    <NavLink to={item.url} className={getNavClass}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Admin link for UltriumAI employees */}
              {isAdmin && adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.tooltip}>
                    <NavLink to={item.url} className={getNavClass}>
                      <item.icon className="h-4 w-4 text-amber-500" />
                      {!isCollapsed && <span className="ml-2 text-amber-500">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Sign out of your account">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">Sign Out</span>}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* User info */}
        {!isCollapsed && user && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            {subscription.subscription_tier && (
              <p className="text-xs text-primary font-medium">
                {getPlanLabel(subscription.subscription_tier)} Plan
              </p>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
