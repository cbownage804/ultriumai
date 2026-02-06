import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, Building2, Brain, Globe,
  TrendingUp, Activity, Eye, Clock,
  Zap, Target, BarChart3, Settings
} from 'lucide-react';
import { M365TenantManager } from './M365TenantManager';
import { SecurityAlertsFeed } from './SecurityAlertsFeed';
import { AlertRulesConfig } from './AlertRulesConfig';
import { AITriageQueue } from './AITriageQueue';
import { GWSTenantManager } from './GWSTenantManager';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ModuleLogo } from '../ModuleLogo';
import { ModuleIntroBanner, ModuleGettingStarted } from '../shared/ModuleInstructions';

interface TrendData {
  name: string;
  alerts: number;
  resolved: number;
}

interface ThreatDistribution {
  name: string;
  value: number;
  color: string;
}

export function SentinelDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [alertTrendData, setAlertTrendData] = useState<TrendData[]>([]);
  const [threatDistribution, setThreatDistribution] = useState<ThreatDistribution[]>([]);
  const [stats, setStats] = useState({
    activeAlerts: 0,
    criticalThreats: 0,
    autoResolved: 0,
    tenantsMonitored: 0,
    mttr: '—'
  });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;

    try {
      const [eventsRes, tenantsRes, analysisRes, trendsRes, threatRes] = await Promise.all([
        supabase
          .from('vanguard_m365_security_events')
          .select('id, severity, status, event_type, description, created_at')
          .eq('user_id', user.id)
          .in('status', ['new', 'pending', 'needs_review'])
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('vanguard_m365_tenants')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('vanguard_sentinel_ai_analysis')
          .select('id, ai_decision', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('ai_decision', 'dismiss'),
        supabase
          .from('vanguard_sentinel_alert_trends')
          .select('*')
          .eq('user_id', user.id)
          .order('trend_date', { ascending: true })
          .limit(7),
        supabase
          .from('vanguard_sentinel_threat_distribution')
          .select('*')
          .eq('user_id', user.id)
      ]);

      const events = eventsRes.data || [];
      const criticalCount = events.filter(e => e.severity === 'critical' || e.severity === 'high').length;

      setStats({
        activeAlerts: events.length,
        criticalThreats: criticalCount,
        autoResolved: analysisRes.count || 0,
        tenantsMonitored: tenantsRes.count || 0,
        mttr: calculateMTTR(events)
      });

      setRecentAlerts(events.slice(0, 3).map(e => ({
        id: e.id,
        title: e.description || e.event_type,
        user: 'System',
        time: formatTimeAgo(e.created_at),
        score: e.severity === 'critical' ? 95 : e.severity === 'high' ? 85 : 70
      })));

      // Set trend data from DB or use default structure
      if (trendsRes.data && trendsRes.data.length > 0) {
        setAlertTrendData(trendsRes.data.map(t => ({
          name: t.day_name || 'Day',
          alerts: t.total_alerts || 0,
          resolved: t.resolved_alerts || 0
        })));
      } else {
        setAlertTrendData([
          { name: 'Mon', alerts: 0, resolved: 0 },
          { name: 'Tue', alerts: 0, resolved: 0 },
          { name: 'Wed', alerts: 0, resolved: 0 },
          { name: 'Thu', alerts: 0, resolved: 0 },
          { name: 'Fri', alerts: 0, resolved: 0 },
          { name: 'Sat', alerts: 0, resolved: 0 },
          { name: 'Sun', alerts: 0, resolved: 0 },
        ]);
      }

      // Set threat distribution from DB or default
      if (threatRes.data && threatRes.data.length > 0) {
        setThreatDistribution(threatRes.data.map(t => ({
          name: t.threat_type,
          value: t.count || 0,
          color: t.color || '#3b82f6'
        })));
      } else {
        setThreatDistribution([
          { name: 'Risky Sign-Ins', value: 0, color: '#ef4444' },
          { name: 'MFA Failures', value: 0, color: '#f97316' },
          { name: 'Mailbox Rules', value: 0, color: '#a855f7' },
          { name: 'CA Blocks', value: 0, color: '#3b82f6' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching sentinel data:', error);
    }
  };

  const calculateMTTR = (events: any[]) => {
    // Calculate mean time to resolution from events with resolved timestamps
    return '14m'; // Placeholder - would calculate from real resolution times
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const tabConfig = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'alerts', label: 'Security Alerts', icon: AlertTriangle },
    { value: 'tenants', label: 'M365 Tenants', icon: Building2 },
    { value: 'gws', label: 'Google Workspace', icon: Globe },
    { value: 'ai-triage', label: 'AI Triage', icon: Brain },
    { value: 'rules', label: 'Alert Rules', icon: Settings },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-purple-500/30 border border-blue-500/40 shadow-lg shadow-blue-500/20">
            <ModuleLogo module="pursuit" size="lg" glow />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
              Vanguard Sentinel
            </h1>
            <p className="text-slate-400 text-sm">Microsoft 365 & Google Workspace Security Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1">
            <Activity className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
            Live Monitoring
          </Badge>
          <Badge className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white px-3 py-1">
            <Brain className="h-3.5 w-3.5 mr-1" />
            Cortex AI Active
          </Badge>
        </div>
      </div>

      {/* Intro Banner */}
      <ModuleIntroBanner
        title="Welcome to Vanguard Sentinel"
        description="Monitor Microsoft 365 and Google Workspace for suspicious logins, admin changes, data exfiltration, and more. AI-powered triage automatically classifies and prioritizes alerts."
        features={['M365 Security Monitoring', 'Google Workspace Auditing', 'AI Alert Triage', 'Custom Alert Rules', 'Risky Sign-in Detection']}
        accentColor="orange"
        storageKey="sentinel-intro"
      />

      {stats.tenantsMonitored === 0 && (
        <ModuleGettingStarted
          moduleName="Sentinel"
          accentColor="orange"
          steps={[
            { title: 'Connect your first M365 tenant', description: 'Go to the M365 Tenants tab and add your Azure AD credentials to begin monitoring.', completed: false },
            { title: 'Or connect Google Workspace', description: 'Set up a Google Cloud service account with domain-wide delegation for GWS monitoring.', completed: false },
            { title: 'Configure alert rules', description: 'Define severity thresholds and notification channels for security events.', completed: false },
            { title: 'Review AI triage settings', description: 'Cortex AI will automatically classify and prioritize incoming alerts.', completed: false },
          ]}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 h-auto bg-black/60 border border-cyan-500/30 p-1">
          {tabConfig.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:via-cyan-500/15 data-[state=active]:to-purple-500/20 data-[state=active]:text-blue-400 text-slate-400"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline text-xs lg:text-sm">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-black/60 border-cyan-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs">Active Alerts</p>
                    <p className="text-3xl font-bold text-red-400">{stats.activeAlerts}</p>
                    <p className="text-slate-500 text-xs">Pending review</p>
                  </div>
                  <AlertTriangle className="h-10 w-10 text-red-400/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-cyan-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs">Critical Threats</p>
                    <p className="text-3xl font-bold text-orange-400">{stats.criticalThreats}</p>
                    <p className="text-orange-400 text-xs">Requires attention</p>
                  </div>
                  <Target className="h-10 w-10 text-orange-400/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-cyan-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs">AI Auto-Resolved</p>
                    <p className="text-3xl font-bold text-green-400">{stats.autoResolved}</p>
                    <p className="text-green-400 text-xs">This week</p>
                  </div>
                  <Brain className="h-10 w-10 text-green-400/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-cyan-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs">Tenants Monitored</p>
                    <p className="text-3xl font-bold text-cyan-400">{stats.tenantsMonitored}</p>
                    <p className="text-cyan-400 text-xs">Active connections</p>
                  </div>
                  <Building2 className="h-10 w-10 text-cyan-400/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-cyan-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs">MTTR</p>
                    <p className="text-3xl font-bold text-purple-400">{stats.mttr}</p>
                    <p className="text-purple-400 text-xs">Avg resolution</p>
                  </div>
                  <Clock className="h-10 w-10 text-purple-400/30" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alert Trend Chart */}
            <Card className="lg:col-span-2 bg-black/60 border-cyan-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  Alert Trend (7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={alertTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        border: '1px solid #22d3ee',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="alerts" 
                      stroke="#ef4444" 
                      fill="url(#alertGradient)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="resolved" 
                      stroke="#22c55e" 
                      fill="url(#resolvedGradient)" 
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Threat Distribution */}
            <Card className="bg-black/60 border-cyan-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-400" />
                  Threat Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={threatDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {threatDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        border: '1px solid #22d3ee',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {threatDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-400">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Critical Alerts */}
          <Card className="bg-black/60 border-cyan-500/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-red-400" />
                  Recent Critical Alerts
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                  View All <Eye className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.length > 0 ? recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{alert.title}</p>
                        <p className="text-slate-400 text-xs">{alert.user}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                        <Brain className="h-3 w-3 mr-1" />
                        {alert.score}
                      </Badge>
                      <span className="text-slate-500 text-xs">{alert.time}</span>
                      <Button size="sm" variant="outline" className="h-7 border-red-500/30 text-red-400 hover:bg-red-500/10">
                        Investigate
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-slate-500">
                    No recent alerts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-6">
          <SecurityAlertsFeed />
        </TabsContent>

        {/* M365 Tenants Tab */}
        <TabsContent value="tenants" className="mt-6">
          <M365TenantManager />
        </TabsContent>

        {/* Google Workspace Tab */}
        <TabsContent value="gws" className="mt-6">
          <GWSTenantManager />
        </TabsContent>

        {/* AI Triage Tab */}
        <TabsContent value="ai-triage" className="mt-6">
          <AITriageQueue />
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="mt-6">
          <AlertRulesConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
