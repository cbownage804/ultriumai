import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { VanguardTabs, VanguardTabContent, VanguardTab } from './shared';
import { useHorizonStats } from '@/hooks/useHorizonStats';
import { DeviceQuickActions } from './horizon/DeviceQuickActions';
import { AutomationProfileSelector } from './horizon/AutomationProfileSelector';
import { DeviceTypeBreakdown } from './horizon/DeviceTypeBreakdown';
import { ResourceTrendingChart } from './horizon/ResourceTrendingChart';
import { BulkActionsPanel } from './horizon/BulkActionsPanel';
import { AlertThresholdManager } from './horizon/AlertThresholdManager';
import { MaintenanceWindowManager } from './horizon/MaintenanceWindowManager';
import { CommandQueuePanel } from './horizon/CommandQueuePanel';
import { FleetPerformanceGrid } from './horizon/FleetPerformanceGrid';
import { RMMReportingDashboard } from './horizon/RMMReportingDashboard';
import { SoftwareAuditPanel } from './horizon/SoftwareAuditPanel';
import { NetworkTopologyView } from './horizon/NetworkTopologyView';
import { PatchManagementPanel } from './horizon/PatchManagementPanel';
import { FleetScriptLibrary } from './horizon/FleetScriptLibrary';
import { FleetConfigPolicies } from './horizon/FleetConfigPolicies';
import { FleetRemoteAccess } from './horizon/FleetRemoteAccess';
import { BackupIntegrationHub } from './horizon/BackupIntegrationHub';
import { LicenseManagementPanel } from './horizon/LicenseManagementPanel';
import { RunbookAutomation } from './horizon/RunbookAutomation';
import { SLAUptimeMonitoring } from './horizon/SLAUptimeMonitoring';
import { AssetLifecycleManager } from './horizon/AssetLifecycleManager';
import { EndpointComplianceDashboard } from './horizon/EndpointComplianceDashboard';
import { 
  Monitor, 
  Server, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  WifiOff,
  Cpu,
  HardDrive,
  MemoryStick,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Ticket,
  RefreshCw,
  Download,
  Users,
  Package,
  TrendingUp,
  Clock,
  Zap,
  Settings,
  FileCode,
  Layers,
  MonitorPlay,
  Cloud,
  Key,
  Workflow,
  Timer,
  LayoutDashboard,
  Gauge,
  Box,
  ClipboardCheck,
  ScrollText,
  Network,
  Bell,
  Play,
  AppWindow,
  FileBarChart,
  TriangleAlert,
} from 'lucide-react';

// Tab configuration for Horizon
const horizonTabs: VanguardTab[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'performance', label: 'Performance', icon: Gauge },
  { id: 'assets', label: 'Assets', icon: Box },
  { id: 'compliance', label: 'Compliance', icon: ClipboardCheck },
  { id: 'patches', label: 'Patches', icon: Package },
  { id: 'scripts', label: 'Scripts', icon: FileCode },
  { id: 'policies', label: 'Policies', icon: ScrollText },
  { id: 'remote', label: 'Remote', icon: MonitorPlay },
  { id: 'backups', label: 'Backups', icon: Cloud },
  { id: 'licenses', label: 'Licenses', icon: Key },
  { id: 'runbooks', label: 'Runbooks', icon: Workflow },
  { id: 'sla', label: 'SLA', icon: Timer },
  { id: 'alerting', label: 'Alerting', icon: Bell },
  { id: 'automation', label: 'Automation', icon: Play },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'software', label: 'Software', icon: AppWindow },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
  { id: 'attention', label: 'Attention', icon: TriangleAlert },
];
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ModuleLogo } from './ModuleLogo';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

function StatCard({ title, value, subtitle, icon, variant = 'default', onClick }: StatCardProps) {
  const variantStyles = {
    default: 'border-border/50',
    success: 'border-green-500/30 bg-green-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    danger: 'border-red-500/30 bg-red-500/5',
    info: 'border-cyan-500/30 bg-cyan-500/5',
  };
  
  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
    info: 'text-cyan-500',
  };

  return (
    <Card 
      className={cn(
        'transition-all hover:shadow-md cursor-pointer',
        variantStyles[variant]
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn('p-2 rounded-lg bg-background/50', iconStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function HorizonDashboard() {
  const { stats, devices, isLoading, refetch } = useHorizonStats();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate health score
  const healthScore = Math.round(
    ((stats.onlineDevices / Math.max(stats.totalDevices, 1)) * 40) +
    ((stats.patchCompliance / 100) * 30) +
    ((1 - (stats.criticalAlerts / Math.max(stats.totalDevices, 1))) * 30)
  );

  // Get devices needing attention
  const criticalDevices = devices.filter(d => d.status === 'critical' || d.status === 'warning');
  const offlineDevices = devices.filter(d => d.status === 'offline');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <ModuleLogo module="horizon" size="lg" glow />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">
              Vanguard Horizon
            </h1>
            <p className="text-muted-foreground">
              Operational visibility and device health monitoring
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/vanguard/setup')}>
            <Download className="h-4 w-4 mr-2" />
            Deploy Agent
          </Button>
        </div>
      </div>

      {/* Health Score Banner */}
      <Card className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-cyan-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${healthScore * 2.51} 251`}
                    className={cn(
                      healthScore >= 80 ? 'text-green-500' :
                      healthScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{healthScore}%</span>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Fleet Health Score</h2>
                <p className="text-sm text-muted-foreground">
                  Based on uptime, patch compliance, and security posture
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-green-500">{stats.onlineDevices}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-500">{stats.warningDevices}</p>
                <p className="text-xs text-muted-foreground">Warning</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-500">{stats.criticalDevices + stats.offlineDevices}</p>
                <p className="text-xs text-muted-foreground">Attention</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Devices"
          value={stats.totalDevices}
          subtitle={`${stats.onlineDevices} online`}
          icon={<Server className="h-5 w-5" />}
          variant="info"
          onClick={() => navigate('/vanguard/devices')}
        />
        <StatCard
          title="Offline"
          value={stats.offlineDevices}
          subtitle="Requires attention"
          icon={<WifiOff className="h-5 w-5" />}
          variant={stats.offlineDevices > 0 ? 'warning' : 'default'}
          onClick={() => navigate('/vanguard/devices')}
        />
        <StatCard
          title="Critical"
          value={stats.criticalDevices}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={stats.criticalDevices > 0 ? 'danger' : 'success'}
        />
        <StatCard
          title="Pending Patches"
          value={stats.pendingPatches}
          subtitle={`${stats.criticalPatches} critical`}
          icon={<Package className="h-5 w-5" />}
          variant={stats.criticalPatches > 0 ? 'danger' : 'default'}
        />
        <StatCard
          title="Open Tickets"
          value={stats.openTickets}
          subtitle={`${stats.urgentTickets} urgent`}
          icon={<Ticket className="h-5 w-5" />}
          variant={stats.urgentTickets > 0 ? 'warning' : 'default'}
          onClick={() => navigate('/vanguard/tickets')}
        />
        <StatCard
          title="Clients"
          value={stats.activeClients}
          subtitle={`of ${stats.totalClients} total`}
          icon={<Users className="h-5 w-5" />}
          onClick={() => navigate('/vanguard/customers')}
        />
      </div>

      {/* Tabs for different views */}
      <VanguardTabs
        tabs={horizonTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme="cyan"
      >

        {/* Overview Tab */}
        <VanguardTabContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Device Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-500" />
                  Device Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{stats.onlineDevices}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round((stats.onlineDevices / Math.max(stats.totalDevices, 1)) * 100)}%)
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(stats.onlineDevices / Math.max(stats.totalDevices, 1)) * 100} 
                    className="h-2 bg-green-500/20" 
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span>Warning</span>
                    </div>
                    <span className="font-semibold">{stats.warningDevices}</span>
                  </div>
                  <Progress 
                    value={(stats.warningDevices / Math.max(stats.totalDevices, 1)) * 100} 
                    className="h-2 bg-yellow-500/20" 
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Critical</span>
                    </div>
                    <span className="font-semibold">{stats.criticalDevices}</span>
                  </div>
                  <Progress 
                    value={(stats.criticalDevices / Math.max(stats.totalDevices, 1)) * 100} 
                    className="h-2 bg-red-500/20" 
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500" />
                      <span>Offline</span>
                    </div>
                    <span className="font-semibold">{stats.offlineDevices}</span>
                  </div>
                  <Progress 
                    value={(stats.offlineDevices / Math.max(stats.totalDevices, 1)) * 100} 
                    className="h-2 bg-gray-500/20" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Patch Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-cyan-500" />
                  Patch Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-muted/20"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${stats.patchCompliance * 3.52} 352`}
                        className={cn(
                          stats.patchCompliance >= 90 ? 'text-green-500' :
                          stats.patchCompliance >= 70 ? 'text-yellow-500' : 'text-red-500'
                        )}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{stats.patchCompliance}%</span>
                      <span className="text-xs text-muted-foreground">Compliant</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                  <div className="p-3 rounded-lg bg-muted/20">
                    <p className="text-lg font-semibold text-red-500">{stats.criticalPatches}</p>
                    <p className="text-xs text-muted-foreground">Critical</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20">
                    <p className="text-lg font-semibold text-yellow-500">{stats.pendingPatches}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Device Type Breakdown */}
          <DeviceTypeBreakdown devices={devices} />

          {/* Resource Trending */}
          <ResourceTrendingChart />

          {/* Bulk Actions */}
          <BulkActionsPanel devices={devices} onActionComplete={refetch} />

          {/* Recent Devices */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-cyan-500" />
                  Recent Device Activity
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/vanguard/devices')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {devices.slice(0, 5).map(device => (
                  <div 
                    key={device.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group"
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => navigate(`/vanguard/devices/${device.id}`)}
                    >
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        device.status === 'online' ? 'bg-green-500' :
                        device.status === 'warning' ? 'bg-yellow-500' :
                        device.status === 'critical' ? 'bg-red-500' : 'bg-gray-500'
                      )} />
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {device.ip_address || 'No IP'} • {device.location || 'Unknown location'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                          {device.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {device.last_heartbeat 
                            ? formatDistanceToNow(new Date(device.last_heartbeat), { addSuffix: true })
                            : 'Never'}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <AutomationProfileSelector 
                          deviceId={device.id} 
                          deviceName={device.name}
                          currentProfiles={device.config as any}
                          onUpdate={refetch}
                        >
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </AutomationProfileSelector>
                        <DeviceQuickActions 
                          deviceId={device.id} 
                          deviceName={device.name}
                          onActionComplete={refetch}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {devices.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No devices connected yet</p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => navigate('/vanguard/setup')}
                    >
                      Deploy your first agent
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </VanguardTabContent>

        {/* Performance Tab */}
        <VanguardTabContent value="performance" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-cyan-500" />
                  Average CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">{stats.avgCpuUsage}</span>
                  <span className="text-muted-foreground pb-1">%</span>
                </div>
                <Progress 
                  value={stats.avgCpuUsage} 
                  className={cn(
                    'h-2 mt-3',
                    stats.avgCpuUsage > 80 ? 'bg-red-500/20' : 'bg-cyan-500/20'
                  )} 
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-purple-500" />
                  Average Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">{stats.avgMemoryUsage}</span>
                  <span className="text-muted-foreground pb-1">%</span>
                </div>
                <Progress 
                  value={stats.avgMemoryUsage} 
                  className={cn(
                    'h-2 mt-3',
                    stats.avgMemoryUsage > 80 ? 'bg-red-500/20' : 'bg-purple-500/20'
                  )} 
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-blue-500" />
                  Average Disk Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">{stats.avgDiskUsage}</span>
                  <span className="text-muted-foreground pb-1">%</span>
                </div>
                <Progress 
                  value={stats.avgDiskUsage} 
                  className={cn(
                    'h-2 mt-3',
                    stats.avgDiskUsage > 90 ? 'bg-red-500/20' : 'bg-blue-500/20'
                  )} 
                />
              </CardContent>
            </Card>
          </div>

          {/* Device Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Device Performance Overview</CardTitle>
              <CardDescription>Real-time resource utilization across all devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {devices.filter(d => d.status === 'online').slice(0, 10).map(device => (
                  <div key={device.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.ip_address}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>CPU</span>
                          <span>{device.cpu_usage ?? 0}%</span>
                        </div>
                        <Progress value={device.cpu_usage ?? 0} className="h-1.5" />
                      </div>
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>RAM</span>
                          <span>{device.memory_usage ?? 0}%</span>
                        </div>
                        <Progress value={device.memory_usage ?? 0} className="h-1.5" />
                      </div>
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Disk</span>
                          <span>{device.disk_usage ?? 0}%</span>
                        </div>
                        <Progress value={device.disk_usage ?? 0} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </VanguardTabContent>

        {/* Patches Tab */}
        <VanguardTabContent value="patches" className="space-y-6 mt-6">
          <PatchManagementPanel />
        </VanguardTabContent>

        {/* Scripts Tab */}
        <VanguardTabContent value="scripts" className="space-y-6 mt-6">
          <FleetScriptLibrary />
        </VanguardTabContent>

        {/* Policies Tab */}
        <VanguardTabContent value="policies" className="space-y-6 mt-6">
          <FleetConfigPolicies />
        </VanguardTabContent>

        {/* Remote Access Tab */}
        <VanguardTabContent value="remote" className="space-y-6 mt-6">
          <FleetRemoteAccess />
        </VanguardTabContent>

        {/* Backups Tab */}
        <VanguardTabContent value="backups" className="space-y-6 mt-6">
          <BackupIntegrationHub />
        </VanguardTabContent>

        {/* Licenses Tab */}
        <VanguardTabContent value="licenses" className="space-y-6 mt-6">
          <LicenseManagementPanel />
        </VanguardTabContent>

        {/* Runbooks Tab */}
        <VanguardTabContent value="runbooks" className="space-y-6 mt-6">
          <RunbookAutomation />
        </VanguardTabContent>

        {/* SLA Tab */}
        <VanguardTabContent value="sla" className="space-y-6 mt-6">
          <SLAUptimeMonitoring />
        </VanguardTabContent>

        {/* Alerting Tab */}
        <VanguardTabContent value="alerting" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cyan-500" />
                  Security Protection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <span>Antivirus Active</span>
                  </div>
                  <span className="text-xl font-bold text-green-500">{stats.devicesWithAV}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <span>MDR Enabled</span>
                  </div>
                  <span className="text-xl font-bold text-blue-500">{stats.devicesWithMDR}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <span>High Risk Devices</span>
                  </div>
                  <span className="text-xl font-bold text-red-500">{stats.highRiskDevices}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-cyan-500" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/20 mb-4">
                    <span className="text-3xl font-bold">{stats.activeAlerts}</span>
                  </div>
                  <p className="text-muted-foreground">Active alerts across your fleet</p>
                  {stats.criticalAlerts > 0 && (
                    <Badge variant="destructive" className="mt-3">
                      {stats.criticalAlerts} Critical
                    </Badge>
                  )}
                </div>
                <Button className="w-full" variant="outline" onClick={() => navigate('/vanguard/alerts')}>
                  View All Alerts
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Alert Threshold Manager */}
          <AlertThresholdManager />
        </VanguardTabContent>

        {/* Automation Tab */}
        <VanguardTabContent value="automation" className="space-y-6 mt-6">
          {/* Fleet Performance Grid */}
          <FleetPerformanceGrid />

          {/* Command Queue */}
          <CommandQueuePanel />

          {/* Maintenance Windows */}
          <MaintenanceWindowManager />
        </VanguardTabContent>

        {/* Network Tab */}
        <VanguardTabContent value="network" className="space-y-6 mt-6">
          <NetworkTopologyView />
        </VanguardTabContent>

        {/* Software Tab */}
        <VanguardTabContent value="software" className="space-y-6 mt-6">
          <SoftwareAuditPanel />
        </VanguardTabContent>

        {/* Reports Tab */}
        <VanguardTabContent value="reports" className="space-y-6 mt-6">
          <RMMReportingDashboard />
        </VanguardTabContent>

        {/* Assets Tab */}
        <VanguardTabContent value="assets" className="space-y-6 mt-6">
          <AssetLifecycleManager />
        </VanguardTabContent>

        {/* Compliance Tab */}
        <VanguardTabContent value="compliance" className="space-y-6 mt-6">
          <EndpointComplianceDashboard />
        </VanguardTabContent>

        {/* Needs Attention Tab */}
        <VanguardTabContent value="attention" className="space-y-6 mt-6">
          {criticalDevices.length === 0 && offlineDevices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">All Systems Operational</h3>
                <p className="text-muted-foreground mt-2">
                  No devices require immediate attention
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {criticalDevices.length > 0 && (
                <Card className="border-red-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-500">
                      <AlertTriangle className="h-5 w-5" />
                      Critical & Warning Devices ({criticalDevices.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {criticalDevices.map(device => (
                        <div 
                          key={device.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 cursor-pointer hover:bg-red-500/20 transition-colors"
                          onClick={() => navigate(`/vanguard/devices/${device.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <AlertTriangle className={cn(
                              'h-5 w-5',
                              device.status === 'critical' ? 'text-red-500' : 'text-yellow-500'
                            )} />
                            <div>
                              <p className="font-medium">{device.name}</p>
                              <p className="text-xs text-muted-foreground">{device.ip_address}</p>
                            </div>
                          </div>
                          <Badge variant={device.status === 'critical' ? 'destructive' : 'outline'}>
                            {device.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {offlineDevices.length > 0 && (
                <Card className="border-gray-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-muted-foreground">
                      <WifiOff className="h-5 w-5" />
                      Offline Devices ({offlineDevices.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {offlineDevices.map(device => (
                        <div 
                          key={device.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => navigate(`/vanguard/devices/${device.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <WifiOff className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{device.name}</p>
                              <p className="text-xs text-muted-foreground">{device.ip_address}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">Offline</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Last seen: {device.last_heartbeat 
                                ? formatDistanceToNow(new Date(device.last_heartbeat), { addSuffix: true })
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </VanguardTabContent>
      </VanguardTabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-cyan-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/vanguard/devices')}>
              <Server className="h-5 w-5" />
              <span>Manage Devices</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/vanguard/setup')}>
              <Download className="h-5 w-5" />
              <span>Deploy Agent</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/vanguard/tickets')}>
              <Ticket className="h-5 w-5" />
              <span>Open Ticket</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/vanguard/alerts')}>
              <AlertTriangle className="h-5 w-5" />
              <span>View Alerts</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
