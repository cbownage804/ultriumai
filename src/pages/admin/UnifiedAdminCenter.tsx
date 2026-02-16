import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft, LayoutDashboard, Sparkles, Shield, Zap, Settings, Users, FileText,
  Building2, Share2, UserPlus, TrendingUp, ShieldCheck, ToggleLeft, CreditCard,
  Activity, Headset, UserCog, Eye, MessageSquare, Bug, Radio, Bell,
  Search, Layers, CalendarClock, Palette, Database, Cloud, HardDrive, Key,
  Webhook, Mail, AlertTriangle, Trash2, Calendar, ShieldBan, Monitor, BookOpen,
  Compass, BellRing, Gauge, Building, Settings2, GitBranch, Wifi, Zap as ZapIcon
} from 'lucide-react';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

// Lazy-load all tabs to prevent OOM build errors
const AdminOverviewTab = lazy(() => import('@/components/admin/unified/AdminOverviewTab').then(m => ({ default: m.AdminOverviewTab })));
const AllUsersAdminTab = lazy(() => import('@/components/admin/unified/AllUsersAdminTab').then(m => ({ default: m.AllUsersAdminTab })));
const AIStudioAdminTab = lazy(() => import('@/components/admin/unified/AIStudioAdminTab').then(m => ({ default: m.AIStudioAdminTab })));
const SafeSuiteAdminTab = lazy(() => import('@/components/admin/unified/SafeSuiteAdminTab').then(m => ({ default: m.SafeSuiteAdminTab })));
const VanguardAdminTab = lazy(() => import('@/components/admin/unified/VanguardAdminTab').then(m => ({ default: m.VanguardAdminTab })));
const AdminAuditLogTab = lazy(() => import('@/components/admin/unified/AdminAuditLogTab').then(m => ({ default: m.AdminAuditLogTab })));
const MSPCapacityReportingTab = lazy(() => import('@/components/admin/unified/MSPCapacityReportingTab').then(m => ({ default: m.MSPCapacityReportingTab })));

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
const GlobalSearchTab = lazy(() => import('@/components/admin/unified/GlobalSearchTab'));
const BulkActionsTab = lazy(() => import('@/components/admin/unified/BulkActionsTab'));
const ScheduledReportsTab = lazy(() => import('@/components/admin/unified/ScheduledReportsTab'));
const BrandingControlsTab = lazy(() => import('@/components/admin/unified/BrandingControlsTab'));
const TableBrowserTab = lazy(() => import('@/components/admin/unified/TableBrowserTab'));
const EdgeFunctionManagerTab = lazy(() => import('@/components/admin/unified/EdgeFunctionManagerTab'));
const StorageManagerTab = lazy(() => import('@/components/admin/unified/StorageManagerTab'));
const ApiKeyOversightTab = lazy(() => import('@/components/admin/unified/ApiKeyOversightTab'));
const WebhookManagerTab = lazy(() => import('@/components/admin/unified/WebhookManagerTab'));
const EmailTemplateEditorTab = lazy(() => import('@/components/admin/unified/EmailTemplateEditorTab'));
const MaintenanceModeTab = lazy(() => import('@/components/admin/unified/MaintenanceModeTab'));
const DataRetentionTab = lazy(() => import('@/components/admin/unified/DataRetentionTab'));
const CronSchedulerTab = lazy(() => import('@/components/admin/unified/CronSchedulerTab'));
const IpAllowlistTab = lazy(() => import('@/components/admin/unified/IpAllowlistTab'));
const UserSessionManagerTab = lazy(() => import('@/components/admin/unified/UserSessionManagerTab'));
const PlatformChangelogTab = lazy(() => import('@/components/admin/unified/PlatformChangelogTab'));
const OnboardingWizardTab = lazy(() => import('@/components/admin/unified/OnboardingWizardTab'));
const NotificationCenterTab = lazy(() => import('@/components/admin/unified/NotificationCenterTab'));
const RateLimitingTab = lazy(() => import('@/components/admin/unified/RateLimitingTab'));
const MultiTenantTab = lazy(() => import('@/components/admin/unified/MultiTenantTab'));
const EnvironmentConfigTab = lazy(() => import('@/components/admin/unified/EnvironmentConfigTab'));
const MigrationHistoryTab = lazy(() => import('@/components/admin/unified/MigrationHistoryTab'));
const RealtimeMonitorTab = lazy(() => import('@/components/admin/unified/RealtimeMonitorTab'));
const PerformanceProfilerTab = lazy(() => import('@/components/admin/unified/PerformanceProfilerTab'));
const AdminAnalyticsDashboard = lazy(() => import('@/components/admin/unified/AdminAnalyticsDashboard'));
const UserSessionInsights = lazy(() => import('@/components/admin/unified/UserSessionInsights'));
const BugReportsTab = lazy(() => import('@/components/admin/unified/BugReportsTab'));
const TabLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const SIDEBAR_GROUPS = [
  { label: 'Core', items: [
    { value: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { value: 'health', icon: Activity, label: 'System Health' },
    { value: 'search', icon: Search, label: 'Global Search' },
    { value: 'all-users', icon: Users, label: 'Users' },
    { value: 'roles', icon: ShieldCheck, label: 'Roles' },
    { value: 'sessions', icon: Monitor, label: 'Sessions' },
    { value: 'notifications', icon: BellRing, label: 'Notifications' },
  ]},
  { label: 'Support', items: [
    { value: 'tickets', icon: Headset, label: 'Tickets' },
    { value: 'bug-reports', icon: Bug, label: 'Bug Reports' },
    { value: 'accounts', icon: UserCog, label: 'Accounts' },
    { value: 'impersonate', icon: Eye, label: 'Impersonate' },
    { value: 'announcements', icon: MessageSquare, label: 'Announcements' },
  ]},
  { label: 'Monitoring', items: [
    { value: 'analytics', icon: TrendingUp, label: 'Analytics' },
    { value: 'user-insights', icon: Activity, label: 'User Insights' },
    { value: 'errors', icon: Bug, label: 'Error Tracking' },
    { value: 'activity-feed', icon: Radio, label: 'Activity Feed' },
    { value: 'alerts-config', icon: Bell, label: 'Alert Config' },
    { value: 'realtime', icon: Wifi, label: 'Realtime Monitor' },
    { value: 'performance', icon: Gauge, label: 'Performance' },
  ]},
  { label: 'Business', items: [
    { value: 'subscriptions', icon: CreditCard, label: 'Billing' },
    { value: 'feature-flags', icon: ToggleLeft, label: 'Feature Flags' },
    { value: 'branding', icon: Palette, label: 'Branding' },
    { value: 'leads', icon: UserPlus, label: 'Leads' },
    { value: 'conversions', icon: TrendingUp, label: 'Conversions' },
    { value: 'multi-tenant', icon: Building, label: 'Tenants' },
    { value: 'rate-limiting', icon: Gauge, label: 'Rate Limits' },
    { value: 'onboarding', icon: Compass, label: 'Onboarding' },
  ]},
  { label: 'Operations', items: [
    { value: 'bulk-actions', icon: Layers, label: 'Bulk Actions' },
    { value: 'reports', icon: CalendarClock, label: 'Reports' },
    { value: 'table-browser', icon: Database, label: 'Table Browser' },
    { value: 'edge-functions', icon: Cloud, label: 'Edge Functions' },
    { value: 'storage', icon: HardDrive, label: 'Storage' },
    { value: 'api-keys', icon: Key, label: 'API Keys' },
    { value: 'cron', icon: Calendar, label: 'Cron Jobs' },
    { value: 'webhooks', icon: Webhook, label: 'Webhooks' },
    { value: 'maintenance', icon: AlertTriangle, label: 'Maintenance' },
  ]},
  { label: 'Platform', items: [
    { value: 'email-templates', icon: Mail, label: 'Email Templates' },
    { value: 'data-retention', icon: Trash2, label: 'Data Retention' },
    { value: 'ip-access', icon: ShieldBan, label: 'IP Access Control' },
    { value: 'changelog', icon: BookOpen, label: 'Changelog' },
    { value: 'env-config', icon: Settings2, label: 'Env Config' },
    { value: 'migrations', icon: GitBranch, label: 'Migrations' },
  ]},
  { label: 'Products', items: [
    { value: 'ai-studio', icon: Sparkles, label: 'AI Studio' },
    { value: 'safesuite', icon: Shield, label: 'SafeSuite' },
    { value: 'vanguard', icon: Zap, label: 'Vanguard' },
    { value: 'msp-capacity', icon: Building2, label: 'MSP Capacity' },
    
  ]},
  { label: 'Audit', items: [
    { value: 'audit-log', icon: FileText, label: 'Audit Log' },
  ]},
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CONTENT_MAP: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  'overview': AdminOverviewTab,
  'health': SystemHealthTab,
  'search': GlobalSearchTab,
  'all-users': AllUsersAdminTab,
  'roles': RoleManagementTab,
  'tickets': TicketOversightTab,
  'bug-reports': BugReportsTab,
  'accounts': CustomerAccountsTab,
  'impersonate': UserImpersonationTab,
  'announcements': AnnouncementsTab,
  'errors': ErrorTrackingTab,
  'activity-feed': ActivityFeedTab,
  'alerts-config': AlertsConfigTab,
  'subscriptions': SubscriptionManagementTab,
  'feature-flags': FeatureFlagsTab,
  'branding': BrandingControlsTab,
  'leads': LeadManagementTab,
  'conversions': ConversionAnalyticsTab,
  'bulk-actions': BulkActionsTab,
  'reports': ScheduledReportsTab,
  'table-browser': TableBrowserTab,
  'edge-functions': EdgeFunctionManagerTab,
  'storage': StorageManagerTab,
  'api-keys': ApiKeyOversightTab,
  'ai-studio': AIStudioAdminTab,
  'safesuite': SafeSuiteAdminTab,
  'vanguard': VanguardAdminTab,
  'msp-capacity': MSPCapacityReportingTab,
  
  'audit-log': AdminAuditLogTab,
  'webhooks': WebhookManagerTab,
  'email-templates': EmailTemplateEditorTab,
  'maintenance': MaintenanceModeTab,
  'data-retention': DataRetentionTab,
  'cron': CronSchedulerTab,
  'ip-access': IpAllowlistTab,
  'sessions': UserSessionManagerTab,
  'changelog': PlatformChangelogTab,
  'onboarding': OnboardingWizardTab,
  'notifications': NotificationCenterTab,
  'rate-limiting': RateLimitingTab,
  'multi-tenant': MultiTenantTab,
  'env-config': EnvironmentConfigTab,
  'migrations': MigrationHistoryTab,
  'realtime': RealtimeMonitorTab,
  'performance': PerformanceProfilerTab,
  'analytics': AdminAnalyticsDashboard,
  'user-insights': UserSessionInsights,
};

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

  const ActiveComponent = CONTENT_MAP[activeTab];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" /> Admin Center
              </h1>
              <p className="text-xs text-muted-foreground">Unified management for all UltriumAI products</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Internal Admin</Badge>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar
          groups={SIDEBAR_GROUPS}
          activeItem={activeTab}
          onSelect={setActiveTab}
        />

        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-73px)]">
            <div className="p-6">
              <Suspense fallback={<TabLoader />}>
                {ActiveComponent && (
                  activeTab === 'overview'
                    ? <ActiveComponent onNavigateToTab={setActiveTab} key={activeTab} />
                    : <ActiveComponent key={activeTab} />
                )}
              </Suspense>
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
};

export default UnifiedAdminCenter;
