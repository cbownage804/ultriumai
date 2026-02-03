import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useHorizonStats } from '@/hooks/useHorizonStats';
import { DeviceQuickActions } from './horizon/DeviceQuickActions';
import { AutomationProfileSelector } from './horizon/AutomationProfileSelector';
import { DeviceTypeBreakdown } from './horizon/DeviceTypeBreakdown';
import { ResourceTrendingChart } from './horizon/ResourceTrendingChart';
import { BulkActionsPanel } from './horizon/BulkActionsPanel';
import { HorizonOperationsCenter } from './horizon/HorizonOperationsCenter';
import { XDRAlertsSummary } from './horizon/XDRAlertsSummary';
import { 
  Server, 
  Activity, 
  AlertTriangle, 
  WifiOff,
  Ticket,
  RefreshCw,
  Download,
  Users,
  Package,
  Zap,
  Settings,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { getVanguardBasePath } from '@/utils/subdomain';
import { ModuleLogo } from './ModuleLogo';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
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
  const basePath = getVanguardBasePath();

  // Calculate health score
  const healthScore = Math.round(
    ((stats.onlineDevices / Math.max(stats.totalDevices, 1)) * 40) +
    ((stats.patchCompliance / 100) * 30) +
    ((1 - (stats.criticalAlerts / Math.max(stats.totalDevices, 1))) * 30)
  );

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
          <Button size="sm" onClick={() => navigate(`${basePath}/setup`)}>
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
          onClick={() => navigate(`${basePath}/devices`)}
        />
        <StatCard
          title="Offline"
          value={stats.offlineDevices}
          subtitle="Requires attention"
          icon={<WifiOff className="h-5 w-5" />}
          variant={stats.offlineDevices > 0 ? 'warning' : 'default'}
          onClick={() => navigate(`${basePath}/devices`)}
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
          onClick={() => navigate(`${basePath}/patches`)}
        />
        <StatCard
          title="Open Tickets"
          value={stats.openTickets}
          subtitle={`${stats.urgentTickets} urgent`}
          icon={<Ticket className="h-5 w-5" />}
          variant={stats.urgentTickets > 0 ? 'warning' : 'default'}
          onClick={() => navigate(`${basePath}/tickets`)}
        />
        <StatCard
          title="Clients"
          value={stats.activeClients}
          subtitle={`of ${stats.totalClients} total`}
          icon={<Users className="h-5 w-5" />}
          onClick={() => navigate(`${basePath}/customers`)}
        />
      </div>

      {/* Overview Content - Device Status & Patch Compliance */}
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

      {/* XDR Alerts Integration */}
      <div className="grid gap-6 lg:grid-cols-2">
        <XDRAlertsSummary />
        <DeviceTypeBreakdown devices={devices} />
      </div>

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
            <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/devices`)}>
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
                  onClick={() => navigate(`${basePath}/devices/${device.id}`)}
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
                  onClick={() => navigate(`${basePath}/setup`)}
                >
                  Deploy your first agent
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Operations Center - All Modules */}
      <HorizonOperationsCenter />

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
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate(`${basePath}/devices`)}>
              <Server className="h-5 w-5" />
              <span>Manage Devices</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate(`${basePath}/setup`)}>
              <Download className="h-5 w-5" />
              <span>Deploy Agent</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate(`${basePath}/tickets`)}>
              <Ticket className="h-5 w-5" />
              <span>Open Ticket</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate(`${basePath}/alerts`)}>
              <AlertTriangle className="h-5 w-5" />
              <span>View Alerts</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
