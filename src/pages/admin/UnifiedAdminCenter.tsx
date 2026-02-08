import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, LayoutDashboard, Sparkles, Shield, Zap, Settings, Users, FileText,
  Building2, Share2, UserPlus, TrendingUp, ShieldCheck, ToggleLeft, CreditCard,
  Activity, Headset, UserCog, Eye, MessageSquare, Bug, Radio, Bell
} from 'lucide-react';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// Lazy-load all tabs to prevent OOM build errors
const AdminOverviewTab = lazy(() => import('@/components/admin/unified/AdminOverviewTab').then(m => ({ default: m.AdminOverviewTab })));
const AllUsersAdminTab = lazy(() => import('@/components/admin/unified/AllUsersAdminTab').then(m => ({ default: m.AllUsersAdminTab })));
const AIStudioAdminTab = lazy(() => import('@/components/admin/unified/AIStudioAdminTab').then(m => ({ default: m.AIStudioAdminTab })));
const SafeSuiteAdminTab = lazy(() => import('@/components/admin/unified/SafeSuiteAdminTab').then(m => ({ default: m.SafeSuiteAdminTab })));
const VanguardAdminTab = lazy(() => import('@/components/admin/unified/VanguardAdminTab').then(m => ({ default: m.VanguardAdminTab })));
const AdminAuditLogTab = lazy(() => import('@/components/admin/unified/AdminAuditLogTab').then(m => ({ default: m.AdminAuditLogTab })));
const MSPCapacityReportingTab = lazy(() => import('@/components/admin/unified/MSPCapacityReportingTab').then(m => ({ default: m.MSPCapacityReportingTab })));
const SocialMediaManager = lazy(() => import('@/components/social/SocialMediaManager').then(m => ({ default: m.SocialMediaManager })));
const LeadManagementTab = lazy(() => import('@/components/admin/unified/LeadManagementTab').then(m => ({ default: m.LeadManagementTab })));
const ConversionAnalyticsTab = lazy(() => import('@/components/admin/unified/ConversionAnalyticsTab').then(m => ({ default: m.ConversionAnalyticsTab })));
const RoleManagementTab = lazy(() => import('@/components/admin/unified/RoleManagementTab').then(m => ({ default: m.RoleManagementTab })));
const FeatureFlagsTab = lazy(() => import('@/components/admin/unified/FeatureFlagsTab').then(m => ({ default: m.FeatureFlagsTab })));
const SubscriptionManagementTab = lazy(() => import('@/components/admin/unified/SubscriptionManagementTab').then(m => ({ default: m.SubscriptionManagementTab })));
const SystemHealthTab = lazy(() => import('@/components/admin/unified/SystemHealthTab').then(m => ({ default: m.SystemHealthTab })));
const TicketOversightTab = lazy(() => import('@/components/admin/unified/TicketOversightTab'));
const CustomerAccountsTab = lazy(() => import('@/components/admin/unified/CustomerAccountsTab'));
const UserImpersonationTab = lazy(() => import('@/components/admin/unified/UserImpersonationTab'));
const AnnouncementsTab = lazy(() => import('@/components/admin/unified/AnnouncementsTab'));
const ErrorTrackingTab = lazy(() => import('@/components/admin/unified/ErrorTrackingTab'));
const ActivityFeedTab = lazy(() => import('@/components/admin/unified/ActivityFeedTab'));
const AlertsConfigTab = lazy(() => import('@/components/admin/unified/AlertsConfigTab'));

const TabLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const TAB_GROUPS = [
  { label: 'Core', tabs: [
    { value: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { value: 'health', icon: Activity, label: 'Health' },
    { value: 'all-users', icon: Users, label: 'Users' },
    { value: 'roles', icon: ShieldCheck, label: 'Roles' },
  ]},
  { label: 'Support', tabs: [
    { value: 'tickets', icon: Headset, label: 'Tickets' },
    { value: 'accounts', icon: UserCog, label: 'Accounts' },
    { value: 'impersonate', icon: Eye, label: 'Impersonate' },
    { value: 'announcements', icon: MessageSquare, label: 'Announce' },
  ]},
  { label: 'Monitoring', tabs: [
    { value: 'errors', icon: Bug, label: 'Errors' },
    { value: 'activity-feed', icon: Radio, label: 'Activity' },
    { value: 'alerts-config', icon: Bell, label: 'Alerts' },
  ]},
  { label: 'Business', tabs: [
    { value: 'subscriptions', icon: CreditCard, label: 'Billing' },
    { value: 'feature-flags', icon: ToggleLeft, label: 'Flags' },
    { value: 'leads', icon: UserPlus, label: 'Leads' },
    { value: 'conversions', icon: TrendingUp, label: 'Conversions' },
  ]},
  { label: 'Products', tabs: [
    { value: 'ai-studio', icon: Sparkles, label: 'AI Studio' },
    { value: 'safesuite', icon: Shield, label: 'SafeSuite' },
    { value: 'vanguard', icon: Zap, label: 'Vanguard' },
    { value: 'msp-capacity', icon: Building2, label: 'MSP' },
    { value: 'social', icon: Share2, label: 'Social' },
  ]},
  { label: 'Audit', tabs: [
    { value: 'audit-log', icon: FileText, label: 'Audit Log' },
  ]},
];

const UnifiedAdminCenter = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminAccess();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" /> Admin Center
                </h1>
                <p className="text-sm text-muted-foreground">Unified management for all UltriumAI products</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Internal Admin</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <ScrollArea className="w-full">
            <TabsList className="bg-muted/50 p-1 inline-flex w-auto min-w-full gap-1">
              {TAB_GROUPS.map((group) => (
                <div key={group.label} className="flex items-center gap-0.5">
                  {group.tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs data-[state=active]:bg-background">
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                  <div className="w-px h-5 bg-border mx-1 last:hidden" />
                </div>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="overview"><AdminOverviewTab onNavigateToTab={setActiveTab} /></TabsContent>
            <TabsContent value="health"><SystemHealthTab /></TabsContent>
            <TabsContent value="all-users"><AllUsersAdminTab /></TabsContent>
            <TabsContent value="roles"><RoleManagementTab /></TabsContent>
            <TabsContent value="tickets"><TicketOversightTab /></TabsContent>
            <TabsContent value="accounts"><CustomerAccountsTab /></TabsContent>
            <TabsContent value="impersonate"><UserImpersonationTab /></TabsContent>
            <TabsContent value="announcements"><AnnouncementsTab /></TabsContent>
            <TabsContent value="errors"><ErrorTrackingTab /></TabsContent>
            <TabsContent value="activity-feed"><ActivityFeedTab /></TabsContent>
            <TabsContent value="alerts-config"><AlertsConfigTab /></TabsContent>
            <TabsContent value="subscriptions"><SubscriptionManagementTab /></TabsContent>
            <TabsContent value="feature-flags"><FeatureFlagsTab /></TabsContent>
            <TabsContent value="leads"><LeadManagementTab /></TabsContent>
            <TabsContent value="conversions"><ConversionAnalyticsTab /></TabsContent>
            <TabsContent value="ai-studio"><AIStudioAdminTab /></TabsContent>
            <TabsContent value="safesuite"><SafeSuiteAdminTab /></TabsContent>
            <TabsContent value="vanguard"><VanguardAdminTab /></TabsContent>
            <TabsContent value="msp-capacity"><MSPCapacityReportingTab /></TabsContent>
            <TabsContent value="social"><SocialMediaManager /></TabsContent>
            <TabsContent value="audit-log"><AdminAuditLogTab /></TabsContent>
          </Suspense>
        </Tabs>
      </main>
    </div>
  );
};

export default UnifiedAdminCenter;
