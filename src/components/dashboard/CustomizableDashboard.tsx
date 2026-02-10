import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GripVertical, X, Plus, BarChart3, Activity, Shield, 
  Headphones, Bot, Monitor, TrendingUp, Users, Clock
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  size: 'sm' | 'md' | 'lg';
}

interface WidgetTemplate {
  type: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  defaultSize: 'sm' | 'md' | 'lg';
}

const WIDGET_ROUTES: Record<string, string> = {
  'kpi-tickets': '/vanguard/tickets',
  'kpi-devices': '/vanguard/devices',
  'kpi-threats': '/vanguard/threats',
  'kpi-users': '/vanguard/customers',
  'chart-tickets': '/vanguard/tickets',
  'chart-security': '/vanguard/vulnscan',
  'kpi-ai-usage': '/ai-studio',
  'kpi-uptime': '/vanguard/analytics',
  'chart-revenue': '/vanguard/executive',
  'kpi-response-time': '/vanguard/tickets',
};

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  { type: 'kpi-tickets', title: 'Open Tickets', icon: Headphones, description: 'Current open ticket count', defaultSize: 'sm' },
  { type: 'kpi-devices', title: 'Active Devices', icon: Monitor, description: 'Online endpoints count', defaultSize: 'sm' },
  { type: 'kpi-threats', title: 'Active Threats', icon: Shield, description: 'Unresolved security alerts', defaultSize: 'sm' },
  { type: 'kpi-users', title: 'Active Users', icon: Users, description: 'Portal users online', defaultSize: 'sm' },
  { type: 'chart-tickets', title: 'Ticket Trend', icon: TrendingUp, description: '7-day ticket volume chart', defaultSize: 'md' },
  { type: 'chart-security', title: 'Security Score', icon: Shield, description: 'Overall security posture', defaultSize: 'md' },
  { type: 'kpi-ai-usage', title: 'AI Credits Used', icon: Bot, description: 'Monthly AI credit consumption', defaultSize: 'sm' },
  { type: 'kpi-uptime', title: 'System Uptime', icon: Activity, description: 'Platform availability', defaultSize: 'sm' },
  { type: 'chart-revenue', title: 'MRR Overview', icon: BarChart3, description: 'Monthly recurring revenue', defaultSize: 'md' },
  { type: 'kpi-response-time', title: 'Avg Response', icon: Clock, description: 'Average ticket response time', defaultSize: 'sm' },
];

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'w1', type: 'kpi-tickets', title: 'Open Tickets', size: 'sm' },
  { id: 'w2', type: 'kpi-devices', title: 'Active Devices', size: 'sm' },
  { id: 'w3', type: 'kpi-threats', title: 'Active Threats', size: 'sm' },
  { id: 'w4', type: 'kpi-uptime', title: 'System Uptime', size: 'sm' },
  { id: 'w5', type: 'chart-tickets', title: 'Ticket Trend', size: 'md' },
  { id: 'w6', type: 'chart-security', title: 'Security Score', size: 'md' },
];

type KPIValue = { value: string; change: string; positive: boolean };

function useLiveKPIs() {
  const [data, setData] = useState<Record<string, KPIValue>>({});
  const [ticketTrend, setTicketTrend] = useState<number[]>([]);
  const [securityScore, setSecurityScore] = useState(0);

  useEffect(() => {
    // Stagger dashboard queries to avoid Supabase rate limits
    const timer = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Split into two batches to avoid Supabase rate limits
      const [ticketsRes, devicesRes, threatsRes, creditsRes, usersRes] = await Promise.all([
        supabase.from('tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress', 'new', 'pending']),
        supabase.from('vanguard_agents').select('id', { count: 'exact', head: true }).eq('status', 'online'),
        supabase.from('security_events').select('id', { count: 'exact', head: true }).eq('status', 'open').in('severity', ['critical', 'high']),
        supabase.from('ai_credit_ledger').select('credits_used').eq('user_id', user.id),
        supabase.from('client_portal_users').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      const [totalDevicesRes, resolvedTicketsRes, patchesRes, alertsAllRes] = await Promise.all([
        supabase.from('vanguard_agents').select('id', { count: 'exact', head: true }),
        supabase.from('helpdesk_tickets').select('actual_hours').not('actual_hours', 'is', null).gt('actual_hours', 0),
        supabase.from('rmm_patches').select('status'),
        supabase.from('rmm_alerts').select('id, status'),
      ]);

      const openTickets = ticketsRes.count ?? 0;
      const activeDevices = devicesRes.count ?? 0;
      const activeThreats = threatsRes.count ?? 0;
      const totalCredits = (creditsRes.data ?? []).reduce((sum, r) => sum + (r.credits_used || 0), 0);
      const activeUsers = usersRes.count ?? 0;
      const totalDevicesAll = totalDevicesRes.count ?? 0;
      const uptimePercent = totalDevicesAll > 0 ? Math.round((activeDevices / totalDevicesAll) * 100) : 100;

      // Avg response time
      const resolvedData = resolvedTicketsRes.data ?? [];
      const avgHours = resolvedData.length > 0
        ? resolvedData.reduce((sum, t) => sum + (t.actual_hours || 0), 0) / resolvedData.length
        : 0;
      const avgResponseStr = avgHours > 0 ? (avgHours < 1 ? `${Math.round(avgHours * 60)}m` : `${avgHours.toFixed(1)}h`) : '—';

      // Compute real security score (0-100)
      const patches = patchesRes.data ?? [];
      const totalPatches = patches.length;
      const installedPatches = patches.filter((p: any) => p.status === 'installed').length;
      const patchScore = totalPatches > 0 ? (installedPatches / totalPatches) * 100 : 100;

      const allAlerts = alertsAllRes.data ?? [];
      const totalAlerts = allAlerts.length;
      const resolvedAlerts = allAlerts.filter((a: any) => a.status === 'resolved').length;
      const alertScore = totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 100;

      const uptimeScore = uptimePercent;
      const threatPenalty = Math.min(activeThreats * 5, 30); // Max 30 point penalty
      const compositeScore = Math.max(0, Math.round((patchScore * 0.3 + alertScore * 0.3 + uptimeScore * 0.4) - threatPenalty));
      setSecurityScore(compositeScore);

      setData({
        'kpi-tickets': { value: String(openTickets), change: '', positive: true },
        'kpi-devices': { value: String(activeDevices), change: '', positive: true },
        'kpi-threats': { value: String(activeThreats), change: activeThreats === 0 ? 'No threats' : '', positive: activeThreats === 0 },
        'kpi-users': { value: String(activeUsers), change: '', positive: true },
        'kpi-ai-usage': { value: totalCredits.toLocaleString(), change: '', positive: true },
        'kpi-uptime': { value: `${uptimePercent}%`, change: '', positive: uptimePercent >= 90 },
        'kpi-response-time': { value: avgResponseStr, change: '', positive: avgHours < 4 },
      });

      // Fetch 7-day ticket trend
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: recentTickets } = await supabase
        .from('tickets')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      const dayCounts = [0, 0, 0, 0, 0, 0, 0];
      (recentTickets ?? []).forEach(t => {
        const dayIndex = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86400000);
        if (dayIndex >= 0 && dayIndex < 7) {
          dayCounts[6 - dayIndex]++;
        }
      });
      const maxCount = Math.max(...dayCounts, 1);
      setTicketTrend(dayCounts.map(c => Math.round((c / maxCount) * 100) || 5));
    }, 500); // Delay 500ms to stagger with other page-load queries

    return () => clearTimeout(timer);
  }, []);

  return { data, ticketTrend, securityScore };
}

function KPIWidget({ widget, kpiData }: { widget: DashboardWidget; kpiData: Record<string, KPIValue> }) {
  const data = kpiData[widget.type];
  const template = WIDGET_TEMPLATES.find(t => t.type === widget.type);
  const Icon = template?.icon || Activity;

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-2xl font-bold text-foreground">{data?.value ?? '—'}</p>
        {data?.change && (
          <p className={`text-xs font-medium ${data.positive ? 'text-emerald-500' : 'text-amber-500'}`}>
            {data.change}
          </p>
        )}
      </div>
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </div>
  );
}

function SecurityScoreWidget({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  const bgColor = score >= 80 ? 'from-emerald-500/20 to-emerald-500/5' : score >= 60 ? 'from-amber-500/20 to-amber-500/5' : 'from-red-500/20 to-red-500/5';
  const label = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'At Risk';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Security Posture</span>
        </div>
        <span className={`text-xs font-medium ${color}`}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <p className={`text-3xl font-bold ${color}`}>{score}</p>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${bgColor}`} 
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">Based on patch compliance, alert resolution & uptime</p>
    </div>
  );
}

function ChartWidget({ widget, ticketTrend, securityScore }: { widget: DashboardWidget; ticketTrend: number[]; securityScore: number }) {
  if (widget.type === 'chart-security') {
    return <SecurityScoreWidget score={securityScore} />;
  }

  const bars = ticketTrend.length > 0 ? ticketTrend : [5, 5, 5, 5, 5, 5, 5];
  const template = WIDGET_TEMPLATES.find(t => t.type === widget.type);
  const Icon = template?.icon || BarChart3;
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().getDay();
  const orderedLabels = [];
  for (let i = 6; i >= 0; i--) {
    const d = (today - i + 7) % 7;
    orderedLabels.push(dayLabels[d === 0 ? 6 : d - 1]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>Last 7 days</span>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-gradient-to-t from-primary/60 to-primary/20 transition-all hover:from-primary hover:to-primary/40"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {orderedLabels.map((l, i) => <span key={i}>{l}</span>)}
      </div>
    </div>
  );
}

export function CustomizableDashboard() {
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem('hub_dashboard_widgets');
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { data: kpiData, ticketTrend, securityScore } = useLiveKPIs();

  const saveWidgets = useCallback((updated: DashboardWidget[]) => {
    setWidgets(updated);
    localStorage.setItem('hub_dashboard_widgets', JSON.stringify(updated));
  }, []);

  const removeWidget = (id: string) => {
    saveWidgets(widgets.filter(w => w.id !== id));
  };

  const addWidget = (template: WidgetTemplate) => {
    const newWidget: DashboardWidget = {
      id: `w${Date.now()}`,
      type: template.type,
      title: template.title,
      size: template.defaultSize,
    };
    saveWidgets([...widgets, newWidget]);
    setAddDialogOpen(false);
  };

  const resetToDefault = () => {
    saveWidgets(DEFAULT_WIDGETS);
    setIsEditing(false);
  };

  const sizeClass = (size: string) => {
    switch (size) {
      case 'sm': return 'col-span-1';
      case 'md': return 'col-span-1 md:col-span-2';
      case 'lg': return 'col-span-1 md:col-span-3';
      default: return 'col-span-1';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          <InfoTooltip content="Live KPI widgets showing real-time data from your connected services. Click any widget to navigate to its detail page. Use 'Customize' to add, remove, or rearrange widgets." />
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add Widget
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Widget</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {WIDGET_TEMPLATES.filter(t => !widgets.some(w => w.type === t.type)).map(template => (
                      <button
                        key={template.type}
                        onClick={() => addWidget(template)}
                        className="flex items-start gap-2.5 p-3 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 text-left transition-all"
                      >
                        <template.icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{template.title}</p>
                          <p className="text-[10px] text-muted-foreground">{template.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm" onClick={resetToDefault} className="text-muted-foreground text-xs">
                Reset
              </Button>
            </>
          )}
          <Button 
            variant={isEditing ? "default" : "outline"} 
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
            className="gap-1.5"
          >
            <GripVertical className="h-3.5 w-3.5" />
            {isEditing ? 'Done' : 'Customize'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {widgets.map(widget => {
          const route = WIDGET_ROUTES[widget.type];
          return (
            <Card 
              key={widget.id} 
              className={`${sizeClass(widget.size)} relative group border-border/30 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all ${
                isEditing ? 'ring-1 ring-dashed ring-border/50' : ''
              } ${!isEditing && route ? 'cursor-pointer hover:shadow-md hover:shadow-primary/5' : ''}`}
              onClick={() => { if (!isEditing && route) navigate(route); }}
            >
              {isEditing && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeWidget(widget.id); }}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {widget.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                {widget.type.startsWith('chart-') ? (
                  <ChartWidget widget={widget} ticketTrend={ticketTrend} securityScore={securityScore} />
                ) : (
                  <KPIWidget widget={widget} kpiData={kpiData} />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
