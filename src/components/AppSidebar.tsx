import { MessageSquare, History, Settings, User, LogOut, Bot, Crown, Zap, Star, Check, BarChart3, Users, TrendingUp, Key, Palette, Shield, Home, ArrowLeft, Video, Mail, FileText, Link, Network, Server, Activity, Eye, HeadphonesIcon, ChevronDown, ChevronRight } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ultraiumAiLogo from "/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
  { title: "Ask", url: "/dashboard/gpt/ask", icon: MessageSquare, tooltip: "Test and refine your GPT responses" },
  { title: "Analyze", url: "/dashboard/gpt/analyze", icon: BarChart3, tooltip: "View GPT performance and analytics" },
  { title: "Chat", url: "/dashboard/gpt/chat", icon: MessageSquare, tooltip: "Test and interact with your custom GPTs" },
  { title: "Deploy", url: "/dashboard/gpt/deploy", icon: Settings, tooltip: "Publish and share your GPTs with others" },
];

const securityItems = [
  { title: "SafeShield", url: "/dashboard/safeshield", icon: Shield, tooltip: "AI-powered endpoint detection and response platform" },
  { title: "SafePass", url: "/dashboard/safepass", icon: Key, tooltip: "Password security analysis and breach detection" },
  { title: "SafeMail", url: "/dashboard/safemail", icon: Mail, tooltip: "Email security scanning and threat detection" },
  { title: "SafeDoc", url: "/dashboard/safedoc", icon: FileText, tooltip: "Document security analysis and malware scanning" },
  { title: "SafeLink", url: "/dashboard/safelink", icon: Link, tooltip: "URL safety checking and phishing protection" },
  { title: "SafeWeb", url: "/dashboard/safeweb", icon: Shield, tooltip: "Dark web monitoring and threat intelligence" },
  { title: "SafeSIEM", url: "/safesiem", icon: Shield, tooltip: "Security Information and Event Management dashboard" },
];

const managedServicesItems = [
  { title: "RMM", url: "/dashboard/rmm", icon: Server, tooltip: "Remote Monitoring and Management" },
  { title: "Antivirus", url: "/dashboard/antivirus", icon: Shield, tooltip: "AI-powered antivirus protection and threat detection" },
  { title: "MDR", url: "/dashboard/mdr", icon: Eye, tooltip: "Managed Detection and Response services" },
  { title: "Helpdesk", url: "/dashboard/helpdesk", icon: HeadphonesIcon, tooltip: "AI-powered helpdesk and ticketing system" },
  { title: "Network Monitoring", url: "/dashboard/safenet", icon: Network, tooltip: "Network security monitoring and analysis" },
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
  { title: "Settings", url: "/dashboard/settings", icon: Settings, tooltip: "General application settings and preferences" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  
  const [openSections, setOpenSections] = useState({
    gpt: true,
    security: true,
    managed: true,
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
            <img src={ultraiumAiLogo} alt="UltriumAI" className="h-12 w-auto" />
            {!isCollapsed && (
              <span className="text-lg font-bold text-foreground">Ultrium AI</span>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* UltriumGPT Assistant */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="AI assistant that integrates with all your tools - ask questions, request reports, get IT support">
                  <NavLink to="/dashboard/ultrium-gpt" className={getNavClass}>
                    <Zap className="h-4 w-4" />
                    {!isCollapsed && <span className="ml-2">UltriumGPT</span>}
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

        {/* Security Tools Section */}
        <Collapsible open={openSections.security} onOpenChange={() => toggleSection('security')}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 rounded-md px-2 py-1">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {!isCollapsed && "Security Tools"}
                </span>
                {!isCollapsed && (
                  openSections.security ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {securityItems.map((item) => (
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

        {/* Managed Services Section */}
        <Collapsible open={openSections.managed} onOpenChange={() => toggleSection('managed')}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 rounded-md px-2 py-1">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {!isCollapsed && "Managed Services"}
                </span>
                {!isCollapsed && (
                  openSections.managed ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managedServicesItems.map((item) => (
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

        {/* Premium Upgrade Section */}
        {subscription.subscription_tier === "free" && !isCollapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <Card className="mx-2 mb-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-black">
                    <Star className="h-4 w-4 text-purple-500" />
                    Go Premium
                  </CardTitle>
                  <CardDescription className="text-xs text-black/70">
                    Unlock advanced features
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-xs text-black">
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="flex items-center gap-2">
                        Document Upload
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Premium</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-black">
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="flex items-center gap-2">
                        API Access
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Premium</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-black">
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="flex items-center gap-2">
                        Embed Widgets
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Premium</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-black">
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="flex items-center gap-2">
                        Custom Branding
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Premium</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-black">
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="flex items-center gap-2">
                        Export Conversations
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Premium</span>
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => navigate('/pricing')}
                  >
                    <Star className="h-3 w-3 mr-2" />
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Enterprise Upgrade Section */}
        {subscription.subscription_tier !== "enterprise" && !isCollapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <Card className="mx-2 mb-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-black">
                    <Crown className="h-4 w-4 text-orange-500" />
                    Go Enterprise
                  </CardTitle>
                  <CardDescription className="text-xs text-black/70">
                    Maximum power & flexibility
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-xs text-black">
                      <Check className="h-3 w-3 text-green-500" />
                      <span>Everything in Premium</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-black">
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="flex items-center gap-2">
                        GPT Integrations
                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Enterprise</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-black">
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="flex items-center gap-2">
                        AI Model Selection
                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Enterprise</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-black">
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="flex items-center gap-2">
                        Priority Support
                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Enterprise</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-black">
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="flex items-center gap-2">
                        Advanced Analytics
                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Enterprise</span>
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => navigate('/pricing')}
                  >
                    <Crown className="h-3 w-3 mr-2" />
                    Go Enterprise
                  </Button>
                </CardContent>
              </Card>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && user && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.user_metadata?.full_name || user.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <SidebarMenuButton onClick={handleSignOut} className="shrink-0">
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}