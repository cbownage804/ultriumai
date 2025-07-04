import { MessageSquare, History, Settings, User, LogOut, Bot, Crown, Zap, Star, Check, BarChart3, Users, TrendingUp, Key, Palette, Shield } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ultraiumAiLogo from "/lovable-uploads/cc68d96a-bf0b-43b8-9da8-995a765fb472.png";

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

const chatItems = [
  { title: "Chat", url: "/dashboard", icon: MessageSquare },
  { title: "History", url: "/dashboard/history", icon: History },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
];

const customGPTItems = [
  { title: "Templates", url: "/dashboard/templates", icon: Star },
  { title: "Build", url: "/dashboard/custom-gpts/build", icon: Bot },
  { title: "Personalize", url: "/dashboard/custom-gpts/personalize", icon: User },
  { title: "Actions", url: "/dashboard/custom-gpts/actions", icon: Settings, badge: "Beta" },
  { title: "Ask", url: "/dashboard/custom-gpts/ask", icon: MessageSquare },
  { title: "Deploy", url: "/dashboard/custom-gpts/deploy", icon: Settings },
  { title: "Analyze", url: "/dashboard/custom-gpts/analyze", icon: Settings },
];

const managementItems = [
  { title: "API Management", url: "/dashboard/api-management", icon: Key },
  { title: "White-label", url: "/dashboard/white-label", icon: Palette },
];

const teamItems = [
  { title: "Team Management", url: "/dashboard/teams", icon: Users },
  { title: "Team Analytics", url: "/dashboard/team-analytics", icon: TrendingUp },
];

const settingsItems = [
  { title: "Profile", url: "/dashboard/profile", icon: User },
  { title: "Security", url: "/dashboard/security", icon: Shield },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  
  const isCollapsed = state === "collapsed";

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
          <img src={ultraiumAiLogo} alt="UltriumAI" className="h-8 w-auto" />
          {!isCollapsed && (
            <span className="text-lg font-bold text-foreground">UltriumGPT</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chat</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavClass}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Custom GPTs</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {customGPTItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && (
                        <span className="ml-2 flex items-center gap-2">
                          {item.title}
                          {item.badge && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                              {item.badge}
                            </span>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
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
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teamItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
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

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
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