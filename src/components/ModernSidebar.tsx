import { useState } from "react";
import { 
  Shield, 
  BarChart3, 
  Settings, 
  Users, 
  Bell, 
  Search,
  Home,
  Bot,
  Network,
  Lock,
  Eye,
  FileText,
  Mail,
  Globe,
  Activity,
  ChevronRight,
  Zap
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    badge: null,
  },
  {
    title: "Security Center",
    icon: Shield,
    badge: { text: "3", variant: "destructive" as const },
    items: [
      { title: "SafeShield", url: "/dashboard/safeshield", icon: Shield },
      { title: "Security Monitoring", url: "/dashboard/security-monitoring", icon: Activity },
      { title: "SafeWeb", url: "/dashboard/safeweb", icon: Eye },
      { title: "Vulnerability Scan", url: "/dashboard/safescan", icon: Search },
    ],
  },
  {
    title: "AI Assistant",
    icon: Bot,
    items: [
      { title: "Studio Assistant", url: "/ai-studio/assistant", icon: Bot },
      { title: "App Builder", url: "/ai-studio/app-builder", icon: Bot },
      { title: "Voice Assistant", url: "/dashboard/voice-assistant", icon: Bot },
      { title: "AI Intelligence", url: "/dashboard/ai/intelligence", icon: Bot },
      { title: "Vision Analyzer", url: "/dashboard/ai/vision", icon: Eye },
    ],
  },
  {
    title: "Network & Assets",
    icon: Network,
    items: [
      { title: "SafeNet Monitor", url: "/dashboard/safenet", icon: Network },
      { title: "Network Scans", url: "/dashboard/network-scans", icon: Search },
      { title: "Asset Management", url: "/dashboard/assets", icon: FileText },
    ],
  },
  {
    title: "Security Tools",
    icon: Lock,
    items: [
      { title: "SafePass Manager", url: "/dashboard/safepass", icon: Lock },
      { title: "SafeMail Security", url: "/dashboard/safemail", icon: Mail },
      { title: "SafeDoc Scanner", url: "/dashboard/safedoc", icon: FileText },
      { title: "SafeLink Checker", url: "/dashboard/safelink", icon: Globe },
    ],
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
    badge: null,
  },
  {
    title: "Team Management",
    url: "/dashboard/teams",
    icon: Users,
    badge: null,
  },
];

const settingsItems = [
  { title: "Security Settings", url: "/dashboard/security", icon: Shield },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { title: "API Keys", url: "/dashboard/api-keys", icon: Settings },
  { title: "Profile", url: "/dashboard/profile", icon: Users },
];

export function ModernSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(['Security Center']);

  const isActive = (path: string) => location.pathname === path;
  
  const isGroupActive = (items: Array<{ url: string }>) => 
    items.some(item => location.pathname === item.url);

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(group => group !== title)
        : [...prev, title]
    );
  };

  const getNavClassName = (isActive: boolean) =>
    `group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground ${
      isActive 
        ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90' 
        : 'text-muted-foreground'
    }`;

  return (
    <Sidebar className={`${collapsed ? 'w-16' : 'w-72'} transition-all duration-300 border-r border-border/40 backdrop-blur-xl bg-sidebar/80`}>
      {/* Header */}
      <div className="flex h-16 items-center px-4 border-b border-border/40">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center animate-glow">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gradient">UltriumAI</h2>
              <p className="text-xs text-muted-foreground">Security Platform</p>
            </div>
          </div>
        )}
        <SidebarTrigger className={`ml-auto hover-scale ${collapsed ? 'mx-auto' : ''}`} />
      </div>

      <SidebarContent className="px-2 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'sr-only' : ''}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible 
                      open={!collapsed && openGroups.includes(item.title)}
                      onOpenChange={() => !collapsed && toggleGroup(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          className={`group w-full justify-between ${
                            isGroupActive(item.items) ? 'bg-accent text-accent-foreground' : ''
                          }`}
                          tooltip={collapsed ? item.title : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                            {!collapsed && <span>{item.title}</span>}
                          </div>
                          {!collapsed && (
                            <div className="flex items-center gap-2">
                              {item.badge && (
                                <Badge variant={item.badge.variant} className="h-5 text-xs animate-pulse">
                                  {item.badge.text}
                                </Badge>
                              )}
                              <ChevronRight className={`h-4 w-4 transition-transform ${
                                openGroups.includes(item.title) ? 'rotate-90' : ''
                              }`} />
                            </div>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!collapsed && (
                        <CollapsibleContent>
                          <SidebarMenuSub className="ml-4 border-l border-border/40 pl-4 space-y-1">
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <NavLink
                                    to={subItem.url}
                                    className={({ isActive }) => getNavClassName(isActive)}
                                  >
                                    <subItem.icon className="h-4 w-4 mr-3 transition-transform group-hover:scale-110" />
                                    {subItem.title}
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                      <NavLink
                        to={item.url!}
                        className={({ isActive }) => getNavClassName(isActive)}
                      >
                        <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                        {!collapsed && (
                          <div className="flex items-center justify-between w-full">
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge variant={item.badge.variant} className="h-5 text-xs animate-pulse">
                                {item.badge.text}
                              </Badge>
                            )}
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className={collapsed ? 'sr-only' : ''}>
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) => getNavClassName(isActive)}
                    >
                      <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        {!collapsed && (
          <SidebarGroup className="mt-8">
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50 hover:bg-accent transition-colors hover-scale text-xs">
                  <Zap className="h-4 w-4" />
                  Scan
                </button>
                <button className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50 hover:bg-accent transition-colors hover-scale text-xs">
                  <Bell className="h-4 w-4" />
                  Alerts
                </button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}