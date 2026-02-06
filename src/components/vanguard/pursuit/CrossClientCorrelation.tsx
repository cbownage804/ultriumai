import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Network, Shield, AlertTriangle, Target, Globe, Activity, 
  Search, RefreshCw, TrendingUp, Users, Zap, Eye, Siren
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CorrelatedCampaign {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedClients: string[];
  commonIndicators: {
    type: string;
    value: string;
    count: number;
  }[];
  mitreTactics: string[];
  firstSeen: string;
  lastSeen: string;
  status: 'active' | 'monitoring' | 'resolved';
  confidence: number;
}

interface CrossClientIOC {
  indicator: string;
  type: 'ip' | 'domain' | 'hash' | 'email' | 'url';
  clientsAffected: number;
  clients: string[];
  severity: string;
  firstSeen: string;
  lastSeen: string;
}

export function CrossClientCorrelation() {
  const [search, setSearch] = useState('');
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('campaigns');

  // Fetch real campaigns from xdr_cross_client_campaigns
  const { data: realCampaigns, isLoading: campaignsLoading, refetch: refetchCampaigns } = useQuery({
    queryKey: ['xdr-campaigns', timeRange],
    queryFn: async () => {
      const daysAgo = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const since = new Date(Date.now() - daysAgo * 86400000).toISOString();
      
      const { data, error } = await supabase
        .from('xdr_cross_client_campaigns')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch threats across all clients
  const { data: threats, isLoading: threatsLoading, refetch } = useQuery({
    queryKey: ['cross-client-threats', timeRange],
    queryFn: async () => {
      const daysAgo = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const since = new Date(Date.now() - daysAgo * 86400000).toISOString();
      
      const { data, error } = await supabase
        .from('safeweb_threats')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch security incidents across clients
  const { data: incidents } = useQuery({
    queryKey: ['cross-client-incidents', timeRange],
    queryFn: async () => {
      const daysAgo = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const since = new Date(Date.now() - daysAgo * 86400000).toISOString();
      
      const { data, error } = await supabase
        .from('security_incidents')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch MDR alerts
  const { data: mdrAlerts } = useQuery({
    queryKey: ['cross-client-mdr', timeRange],
    queryFn: async () => {
      const daysAgo = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const since = new Date(Date.now() - daysAgo * 86400000).toISOString();
      
      const { data, error } = await supabase
        .from('safe_mdr_alerts')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Correlate threats across clients to detect campaigns
  const correlatedCampaigns = useMemo<CorrelatedCampaign[]>(() => {
    if (!threats?.length && !incidents?.length) return [];

    // Group by common indicators (threat_type, similar titles, shared IOCs)
    const typeGroups = new Map<string, typeof threats>();
    
    threats?.forEach(threat => {
      const key = threat.threat_type || 'unknown';
      if (!typeGroups.has(key)) typeGroups.set(key, []);
      typeGroups.get(key)!.push(threat);
    });

    const campaigns: CorrelatedCampaign[] = [];
    
    typeGroups.forEach((groupThreats, threatType) => {
      // Only flag as campaign if multiple distinct users affected
      const uniqueUsers = new Set(groupThreats.map(t => t.user_id));
      if (uniqueUsers.size >= 2 || groupThreats.length >= 3) {
        const indicators = extractCommonIndicators(groupThreats);
        const severities = groupThreats.map(t => t.severity).filter(Boolean);
        const highestSeverity = getHighestSeverity(severities);
        
        campaigns.push({
          id: `campaign-${threatType}-${Date.now()}`,
          name: `${threatType} Campaign`,
          severity: highestSeverity as CorrelatedCampaign['severity'],
          affectedClients: Array.from(uniqueUsers).map((_, i) => `Client-${i + 1}`),
          commonIndicators: indicators,
          mitreTactics: extractMitreTactics(groupThreats),
          firstSeen: groupThreats[groupThreats.length - 1]?.created_at || '',
          lastSeen: groupThreats[0]?.created_at || '',
          status: groupThreats.some(t => t.status === 'active') ? 'active' : 'monitoring',
          confidence: Math.min(95, 60 + uniqueUsers.size * 10 + indicators.length * 5),
        });
      }
    });

    // Also correlate from incidents
    if (incidents?.length) {
      const incidentTypes = new Map<string, typeof incidents>();
      incidents.forEach(inc => {
        const key = inc.incident_type || 'unknown';
        if (!incidentTypes.has(key)) incidentTypes.set(key, []);
        incidentTypes.get(key)!.push(inc);
      });

      incidentTypes.forEach((groupInc, incType) => {
        const uniqueUsers = new Set(groupInc.map(i => i.user_id));
        if (uniqueUsers.size >= 2) {
          campaigns.push({
            id: `campaign-inc-${incType}-${Date.now()}`,
            name: `${incType} - Multi-Client Incident`,
            severity: getHighestSeverity(groupInc.map(i => i.severity)) as CorrelatedCampaign['severity'],
            affectedClients: Array.from(uniqueUsers).map((_, i) => `Client-${i + 1}`),
            commonIndicators: [{ type: 'incident_type', value: incType, count: groupInc.length }],
            mitreTactics: [],
            firstSeen: groupInc[groupInc.length - 1]?.created_at || '',
            lastSeen: groupInc[0]?.created_at || '',
            status: 'active',
            confidence: Math.min(90, 50 + uniqueUsers.size * 15),
          });
        }
      });
    }

    return campaigns.sort((a, b) => {
      const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (sevOrder[a.severity] || 3) - (sevOrder[b.severity] || 3);
    });
  }, [threats, incidents]);

  // Cross-client IOC overlap
  const crossClientIOCs = useMemo<CrossClientIOC[]>(() => {
    if (!threats?.length) return [];
    
    const iocMap = new Map<string, { users: Set<string>; type: string; severity: string; first: string; last: string }>();
    
    threats.forEach(threat => {
      const indicators = threat.threat_indicators as Record<string, string[]> | null;
      if (!indicators) return;
      
      Object.entries(indicators).forEach(([type, values]) => {
        if (!Array.isArray(values)) return;
        values.forEach(val => {
          if (!val) return;
          const key = `${type}:${val}`;
          if (!iocMap.has(key)) {
            iocMap.set(key, { 
              users: new Set(), 
              type, 
              severity: threat.severity || 'medium',
              first: threat.created_at,
              last: threat.created_at 
            });
          }
          const entry = iocMap.get(key)!;
          entry.users.add(threat.user_id);
          if (threat.created_at < entry.first) entry.first = threat.created_at;
          if (threat.created_at > entry.last) entry.last = threat.created_at;
        });
      });
    });

    return Array.from(iocMap.entries())
      .filter(([_, v]) => v.users.size >= 2)
      .map(([key, v]) => ({
        indicator: key.split(':').slice(1).join(':'),
        type: key.split(':')[0] as CrossClientIOC['type'],
        clientsAffected: v.users.size,
        clients: Array.from(v.users).map((_, i) => `Client-${i + 1}`),
        severity: v.severity,
        firstSeen: v.first,
        lastSeen: v.last,
      }))
      .sort((a, b) => b.clientsAffected - a.clientsAffected);
  }, [threats]);

  // Stats
  const stats = useMemo(() => ({
    totalThreats: (threats?.length || 0) + (incidents?.length || 0),
    activeCampaigns: (realCampaigns?.filter(c => c.status === 'active').length || 0) + correlatedCampaigns.filter(c => c.status === 'active').length,
    sharedIOCs: crossClientIOCs.length,
    criticalCampaigns: (realCampaigns?.filter(c => c.severity === 'critical').length || 0) + correlatedCampaigns.filter(c => c.severity === 'critical').length,
    clientsAtRisk: new Set([
      ...correlatedCampaigns.flatMap(c => c.affectedClients),
      ...(realCampaigns?.flatMap(c => c.affected_user_ids || []) || [])
    ]).size,
    mdrAlertCount: mdrAlerts?.length || 0,
  }), [threats, incidents, correlatedCampaigns, crossClientIOCs, mdrAlerts, realCampaigns]);

  const filteredCampaigns = correlatedCampaigns.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredIOCs = crossClientIOCs.filter(ioc =>
    !search || ioc.indicator.toLowerCase().includes(search.toLowerCase())
  );

  const severityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Campaign Alert Banner */}
      {(realCampaigns?.filter(c => c.status === 'active').length || 0) > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-pulse">
          <Siren className="h-5 w-5 text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400">
              {realCampaigns!.filter(c => c.status === 'active').length} Active Cross-Client Campaign{realCampaigns!.filter(c => c.status === 'active').length > 1 ? 's' : ''} Detected
            </p>
            <p className="text-xs text-red-300/70">Auto-correlated from live threat ingestion — coordinated attack activity across multiple managed clients</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <Network className="h-6 w-6" />
            Cross-Client Threat Correlation
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Detect coordinated campaigns targeting multiple clients simultaneously
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-slate-800/50 border-cyan-500/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Threats', value: stats.totalThreats, icon: Shield, color: 'text-cyan-400' },
          { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Target, color: 'text-red-400' },
          { label: 'Shared IOCs', value: stats.sharedIOCs, icon: Globe, color: 'text-purple-400' },
          { label: 'Critical', value: stats.criticalCampaigns, icon: AlertTriangle, color: 'text-red-500' },
          { label: 'Clients at Risk', value: stats.clientsAtRisk, icon: Users, color: 'text-orange-400' },
          { label: 'MDR Alerts', value: stats.mdrAlertCount, icon: Zap, color: 'text-yellow-400' },
        ].map(stat => (
          <Card key={stat.label} className="bg-slate-900/60 border-cyan-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <stat.icon className={cn("h-4 w-4", stat.color)} />
                <span className={cn("text-2xl font-bold", stat.color)}>{stat.value}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search campaigns, IOCs, indicators..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-slate-800/50 border-cyan-500/20"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-cyan-500/20">
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Target className="h-4 w-4 mr-1" />
            Campaigns ({correlatedCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="iocs" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <Globe className="h-4 w-4 mr-1" />
            Shared IOCs ({crossClientIOCs.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
            <Activity className="h-4 w-4 mr-1" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-3">
          {/* Real auto-detected campaigns from backend */}
          {realCampaigns?.map(campaign => (
            <Card key={campaign.id} className="bg-slate-900/60 border-red-500/20 hover:border-red-500/40 transition-colors ring-1 ring-red-500/10">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <Siren className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        {campaign.campaign_name}
                        <Badge className="bg-red-500/30 text-red-300 border-red-500/50 text-[10px]">AUTO-DETECTED</Badge>
                      </h3>
                      <p className="text-xs text-slate-400">
                        First seen: {new Date(campaign.first_seen).toLocaleDateString()} • 
                        Last activity: {new Date(campaign.last_seen).toLocaleDateString()} •
                        {(campaign.affected_user_ids as string[])?.length || 0} organizations affected
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={severityColor(campaign.severity)}>{campaign.severity?.toUpperCase()}</Badge>
                    <Badge variant="outline" className={cn(
                      campaign.status === 'active' ? 'border-red-500/50 text-red-400' : 'border-slate-500/50 text-slate-400'
                    )}>{campaign.status}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Shared Indicators</p>
                    <div className="flex flex-wrap gap-1">
                      {((campaign.shared_indicators as any[]) || []).slice(0, 4).map((si: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs border-purple-500/30 text-purple-400 font-mono">
                          {si.type}: {String(si.value).substring(0, 20)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Related Threats</p>
                    <span className="text-sm text-white">{(campaign.related_threat_ids as string[])?.length || 0} correlated events</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Confidence</p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", campaign.confidence >= 80 ? 'bg-red-400' : 'bg-orange-400')}
                            style={{ width: `${campaign.confidence}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{campaign.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                {(campaign.mitre_tactics as string[])?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-1">MITRE ATT&CK</p>
                    <div className="flex flex-wrap gap-1">
                      {(campaign.mitre_tactics as string[]).map(t => (
                        <Badge key={t} variant="outline" className="text-xs border-blue-500/30 text-blue-400 font-mono">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Client-side correlated campaigns */}
          {(campaignsLoading || threatsLoading) ? (
            <Card className="bg-slate-900/60 border-cyan-500/10 p-8 text-center">
              <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin mx-auto mb-2" />
              <p className="text-slate-400">Correlating threats across clients...</p>
            </Card>
          ) : filteredCampaigns.length === 0 ? (
            <Card className="bg-slate-900/60 border-cyan-500/10 p-8 text-center">
              <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 font-medium">No coordinated campaigns detected</p>
              <p className="text-sm text-slate-500 mt-1">All client threats appear isolated — no multi-client attack patterns found</p>
            </Card>
          ) : (
            filteredCampaigns.map(campaign => (
              <Card key={campaign.id} className="bg-slate-900/60 border-cyan-500/10 hover:border-cyan-500/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        campaign.severity === 'critical' ? 'bg-red-500/20' : 
                        campaign.severity === 'high' ? 'bg-orange-500/20' : 'bg-yellow-500/20'
                      )}>
                        <Target className={cn(
                          "h-5 w-5",
                          campaign.severity === 'critical' ? 'text-red-400' : 
                          campaign.severity === 'high' ? 'text-orange-400' : 'text-yellow-400'
                        )} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{campaign.name}</h3>
                        <p className="text-xs text-slate-400">
                          First seen: {new Date(campaign.firstSeen).toLocaleDateString()} • 
                          Last activity: {new Date(campaign.lastSeen).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={severityColor(campaign.severity)}>
                        {campaign.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={cn(
                        campaign.status === 'active' ? 'border-red-500/50 text-red-400' : 'border-slate-500/50 text-slate-400'
                      )}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Affected Clients</p>
                      <div className="flex flex-wrap gap-1">
                        {campaign.affectedClients.map(client => (
                          <Badge key={client} variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                            <Users className="h-3 w-3 mr-1" />
                            {client}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Common Indicators</p>
                      <div className="flex flex-wrap gap-1">
                        {campaign.commonIndicators.slice(0, 3).map((ioc, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                            {ioc.type}: {ioc.value} ({ioc.count}x)
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Confidence</p>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                campaign.confidence >= 80 ? 'bg-red-400' : 
                                campaign.confidence >= 60 ? 'bg-orange-400' : 'bg-yellow-400'
                              )}
                              style={{ width: `${campaign.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{campaign.confidence}%</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                        <Eye className="h-3 w-3 mr-1" />
                        Investigate
                      </Button>
                    </div>
                  </div>

                  {campaign.mitreTactics.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-1">MITRE ATT&CK</p>
                      <div className="flex flex-wrap gap-1">
                        {campaign.mitreTactics.map(tactic => (
                          <Badge key={tactic} variant="outline" className="text-xs border-blue-500/30 text-blue-400 font-mono">
                            {tactic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Shared IOCs Tab */}
        <TabsContent value="iocs" className="space-y-3">
          {filteredIOCs.length === 0 ? (
            <Card className="bg-slate-900/60 border-cyan-500/10 p-8 text-center">
              <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 font-medium">No shared IOCs across clients</p>
              <p className="text-sm text-slate-500 mt-1">No indicators of compromise appear across multiple client environments</p>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-700/50">
                    <th className="text-left py-2 px-3">Indicator</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-center py-2 px-3">Clients</th>
                    <th className="text-left py-2 px-3">Severity</th>
                    <th className="text-left py-2 px-3">First Seen</th>
                    <th className="text-left py-2 px-3">Last Seen</th>
                    <th className="text-right py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIOCs.map((ioc, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-mono text-xs text-cyan-400">{ioc.indicator}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs">{ioc.type}</Badge>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          {ioc.clientsAffected} clients
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <Badge className={severityColor(ioc.severity)}>{ioc.severity}</Badge>
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-400">
                        {new Date(ioc.firstSeen).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-400">
                        {new Date(ioc.lastSeen).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Button size="sm" variant="ghost" className="text-cyan-400 hover:bg-cyan-500/10 h-7 text-xs">
                          <Search className="h-3 w-3 mr-1" />
                          Hunt
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-3">
          <Card className="bg-slate-900/60 border-cyan-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300">Cross-Client Event Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {(threats?.length || incidents?.length) ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {[...(threats || []), ...(incidents || [])]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 50)
                    .map((event, i) => {
                      const isIncident = 'incident_type' in event;
                      return (
                        <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-800/30 last:border-0">
                          <div className="w-1.5 h-1.5 rounded-full mt-2 bg-cyan-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium text-white truncate">
                                {event.title || (isIncident ? (event as any).incident_type : (event as any).threat_type)}
                              </span>
                              <Badge className={severityColor(event.severity || 'medium')} >
                                {event.severity}
                              </Badge>
                              <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                                {isIncident ? 'Incident' : 'Threat'}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{event.description}</p>
                          </div>
                          <span className="text-xs text-slate-600 whitespace-nowrap">
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">No events in selected time range</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function extractCommonIndicators(threats: any[]): { type: string; value: string; count: number }[] {
  const indicatorCounts = new Map<string, number>();
  
  threats.forEach(t => {
    if (t.threat_type) {
      const key = `threat_type:${t.threat_type}`;
      indicatorCounts.set(key, (indicatorCounts.get(key) || 0) + 1);
    }
    const indicators = t.threat_indicators as Record<string, string[]> | null;
    if (indicators) {
      Object.entries(indicators).forEach(([type, values]) => {
        if (Array.isArray(values)) {
          values.forEach(v => {
            if (v) {
              const key = `${type}:${v}`;
              indicatorCounts.set(key, (indicatorCounts.get(key) || 0) + 1);
            }
          });
        }
      });
    }
  });

  return Array.from(indicatorCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([key, count]) => {
      const [type, ...rest] = key.split(':');
      return { type, value: rest.join(':'), count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function extractMitreTactics(threats: any[]): string[] {
  const tactics = new Set<string>();
  threats.forEach(t => {
    const data = t.raw_data as any;
    if (data?.ai_analysis?.mitre_tactics) {
      data.ai_analysis.mitre_tactics.forEach((tac: string) => tactics.add(tac));
    }
  });
  return Array.from(tactics);
}

function getHighestSeverity(severities: string[]): string {
  const order = ['critical', 'high', 'medium', 'low'];
  for (const sev of order) {
    if (severities.includes(sev)) return sev;
  }
  return 'medium';
}
