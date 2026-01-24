import { MessageSquare, History, Settings, User, LogOut, Bot, Crown, Zap, Star, Check, BarChart3, Users, TrendingUp, Key, Palette, Shield, Home, ArrowLeft, ChevronDown, ChevronRight, Brain, Mic, Eye, ExternalLink } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ultraiumAiLogo from "/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";
import ultriumGPTLogo from "@/assets/ultrium-gpt-logo.png";
import vanguardLogo from "@/assets/vanguard-logo.png";

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
import { useState } from "react";

const gptItems = [
  { title: "GPT Dashboard", url: "/dashboard/gpt", icon: Bot, tooltip: "Custom GPT overview and analytics" },
  { title: "Templates", url: "/dashboard/gpt/templates", icon: Star, tooltip: "Browse pre-built GPT templates for common use cases" },
  { title: "Build", url: "/dashboard/gpt/build", icon: Bot, tooltip: "Create and configure custom AI assistants" },
  { title: "Personalize", url: "/dashboard/gpt/personalize", icon: User, tooltip: "Customize GPT appearance, behavior, and branding" },
  { title: "Actions", url: "/dashboard/gpt/actions", icon: Zap, tooltip: "Add custom actions and integrations" },
  { title: "Chat", url: "/dashboard/gpt/chat", icon: MessageSquare, tooltip: "Test and interact with your custom GPTs" },
  { title: "Analyze", url: "/dashboard/gpt/analyze", icon: BarChart3, tooltip: "View GPT performance and analytics" },
  { title: "Deploy", url: "/dashboard/gpt/deploy", icon: Settings, tooltip: "Publish and share your GPTs with others" },
];

const aiItems = [
  { title: "AI Intelligence Hub", url: "/dashboard/ai/intelligence", icon: Brain, tooltip: "Advanced AI analysis and automation" },
  { title: "AI Voice Interface", url: "/dashboard/ai/voice", icon: Mic, tooltip: "Voice-to-text and text-to-speech AI" },
  { title: "AI Vision Analyzer", url: "/dashboard/ai/vision", icon: Eye, tooltip: "Computer vision and image analysis" },
];

const managementItems = [
  { title: "API Management", url: "/dashboard/api-management", icon: Key, tooltip: "Manage API keys, usage limits, and access permissions" },
  { title: "White-label", url: "/dashboard/white-label", icon: Palette, tooltip: "Customize branding and white-label your solutions" },
  { title: "Team Management", url: "/dashboard/teams", icon: Users, tooltip: "Manage team members, roles, and permissions" },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, tooltip: "View usage statistics and performance metrics" },
];

const accountItems = [
  { title: "Profile", url: "/dashboard/profile", icon: User, tooltip: "Manage your account profile and personal information" },
  { title: "Security", url: "/dashboard/security", icon: Shield, tooltip: "Configure security settings and two-factor authentication" },
];

const adminItems = [
  { title: "Platform Admin", url: "/admin", icon: Crown, tooltip: "Platform-wide administration and management" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  
  // Check if user is admin (UltriumAI employee with confirmed email)
  const isAdmin = user?.email?.endsWith('@ultriumai.com') && user?.email_confirmed_at != null;
  
  const [openSections, setOpenSections] = useState({
    gpt: true,
    ai: true,
    management: false
  });
  
  const isCollapsed = state === "collapsed";

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
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
      navigate('/');
    }
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3">
          <NavLink to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 rounded-lg overflow-hidden bg-black p-1">
              <img src={ultriumGPTLogo} alt="AI Studio" className="h-full w-full object-contain" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold text-foreground">AI Studio</span>
            )}
          </NavLink>
        </div>
        {/* Back to Marketing Link */}
        {!isCollapsed && (
          <div className="mt-2">
            <NavLink 
              to="/" 
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to UltriumAI
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
                <SidebarMenuButton asChild tooltip="Ultrium GPT Platform - Your intelligent business intelligence co-pilot">
                  <NavLink to="/dashboard/ultrium-gpt" className={getNavClass}>
                    <Bot className="h-4 w-4 text-primary" />
                    {!isCollapsed && <span className="ml-2 font-semibold text-primary">Ultrium GPT</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Custom GPTs Section */}
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
                  {gptItems.map((item) => (
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

        {/* AI Features Section */}
        <Collapsible open={openSections.ai} onOpenChange={() => toggleSection('ai')}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 rounded-md px-2 py-1">
                <span className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  {!isCollapsed && "AI Features"}
                </span>
                {!isCollapsed && (
                  openSections.ai ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {aiItems.map((item) => (
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

        {/* Management & Analytics Section */}
        <Collapsible open={openSections.management} onOpenChange={() => toggleSection('management')}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 rounded-md px-2 py-1">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {!isCollapsed && "Management"}
                </span>
                {!isCollapsed && (
                  openSections.management ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementItems.map((item) => (
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

        {/* Vanguard Link */}
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <Card className="mx-2 mb-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <img src={vanguardLogo} alt="Vanguard" className="h-6 w-6 rounded object-contain bg-black" />
                    Vanguard
                  </CardTitle>
                  <CardDescription className="text-xs">
                    AI-powered cybersecurity platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full text-xs"
                    onClick={() => window.location.href = 'https://vanguard.ultriumai.com'}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open Vanguard
                  </Button>
                </CardContent>
              </Card>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Premium Upgrade Section */}
        {subscription.subscription_tier === "free" && !isCollapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <Card className="mx-2 mb-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Crown className="h-4 w-4" />
                    Upgrade to Pro
                  </CardTitle>
                  <CardDescription className="text-xs text-purple-600 dark:text-purple-400">
                    Unlock advanced AI features
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <ul className="text-xs space-y-1 mb-3 text-purple-600 dark:text-purple-400">
                    <li className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      5,000 monthly credits
                    </li>
                    <li className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Unlimited GPT builds
                    </li>
                    <li className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Priority support
                    </li>
                  </ul>
                  <Button 
                    size="sm" 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-xs"
                    onClick={() => navigate('/pricing')}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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
              <p className="text-xs text-primary font-medium capitalize">
                {subscription.subscription_tier} Plan
              </p>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
