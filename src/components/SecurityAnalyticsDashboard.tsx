import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Users,
  Globe,
  Target,
  Brain,
  Zap,
  Download,
  Bell,
  Settings,
  Eye,
  Lock,
  Gauge,
  FileText,
  Mail,
  Link,
  Key,
  Network
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SecurityMetrics {
  overall_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  threats_blocked: number;
  vulnerabilities_found: number;
  compliance_score: number;
  incidents_resolved: number;
}

interface AppMetrics {
  safedoc: {
    scans_today: number;
    threats_found: number;
    files_processed: number;
    risk_score: number;
  };
  safemail: {
    emails_scanned: number;
    phishing_blocked: number;
    spam_filtered: number;
    risk_score: number;
  };
  safelink: {
    urls_scanned: number;
    malicious_blocked: number;
    categories_filtered: number;
    risk_score: number;
  };
  safepass: {
    passwords_managed: number;
    weak_passwords: number;
    breached_accounts: number;
    risk_score: number;
  };
  safenet: {
    devices_monitored: number;
    vulnerabilities_found: number;
    network_uptime: number;
    risk_score: number;
  };
}

interface ThreatIntelligence {
  active_campaigns: Array<{
    id: string;
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    targets: string[];
    first_seen: string;
    last_activity: string;
  }>;
  iocs: Array<{
    type: 'ip' | 'domain' | 'hash' | 'url';
    value: string;
    confidence: number;
    source: string;
    first_seen: string;
  }>;
  feeds: Array<{
    name: string;
    status: 'active' | 'inactive' | 'error';
    last_update: string;
    indicators_count: number;
  }>;
}

export const SecurityAnalyticsDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    overall_score: 85,
    risk_level: 'medium',
    threats_blocked: 1247,
    vulnerabilities_found: 23,
    compliance_score: 92,
    incidents_resolved: 156
  });
  
  const [appMetrics, setAppMetrics] = useState<AppMetrics>({
    safedoc: { scans_today: 45, threats_found: 3, files_processed: 127, risk_score: 7.2 },
    safemail: { emails_scanned: 2341, phishing_blocked: 15, spam_filtered: 89, risk_score: 6.8 },
    safelink: { urls_scanned: 856, malicious_blocked: 12, categories_filtered: 34, risk_score: 7.5 },
    safepass: { passwords_managed: 234, weak_passwords: 12, breached_accounts: 3, risk_score: 8.1 },
    safenet: { devices_monitored: 67, vulnerabilities_found: 8, network_uptime: 99.2, risk_score: 7.8 }
  });

  const [threatIntel, setThreatIntel] = useState<ThreatIntelligence>({
    active_campaigns: [
      {
        id: 'camp-001',
        name: 'Operation PhishStorm',
        severity: 'high',
        targets: ['Financial Services', 'Healthcare'],
        first_seen: '2024-01-15',
        last_activity: '2024-01-20'
      }
    ],
    iocs: [
      { type: 'domain', value: 'malicious-site.com', confidence: 95, source: 'VirusTotal', first_seen: '2024-01-20' },
      { type: 'ip', value: '192.168.1.100', confidence: 87, source: 'Internal', first_seen: '2024-01-19' }
    ],
    feeds: [
      { name: 'MITRE ATT&CK', status: 'active', last_update: '2024-01-20T10:30:00Z', indicators_count: 15420 },
      { name: 'AlienVault OTX', status: 'active', last_update: '2024-01-20T09:15:00Z', indicators_count: 8930 }
    ]
  });

  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('24h');

  useEffect(() => {
    loadAnalyticsData();
  }, [user, selectedTimeRange]);

  const loadAnalyticsData = async () => {
    try {
      // Load security metrics from various sources
      const { data: safedocData } = await supabase
        .from('safedoc_scans')
        .select('threat_level, threats_found, file_size')
        .eq('user_email', user?.email);

      const { data: analyticsData } = await supabase
        .from('gpt_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', getTimeRangeStart());

      // Process and aggregate data
      if (safedocData) {
        const threatsFound = safedocData.reduce((sum, scan) => sum + (scan.threats_found || 0), 0);
        const totalScans = safedocData.length;
        
        setAppMetrics(prev => ({
          ...prev,
          safedoc: {
            ...prev.safedoc,
            scans_today: totalScans,
            threats_found: threatsFound
          }
        }));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const getTimeRangeStart = () => {
    const now = new Date();
    switch (selectedTimeRange) {
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    if (score >= 4) return 'text-orange-500';
    return 'text-red-500';
  };

  const generateReport = async (type: 'executive' | 'technical' | 'compliance') => {
    toast({
      title: "Report Generated",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} security report is ready for download`,
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Security Analytics
          </h1>
          <p className="text-muted-foreground">
            Unified security intelligence and threat analysis across all platforms
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button variant="outline" onClick={() => generateReport('executive')}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Security Score */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-center">
            <div className="md:col-span-2 text-center">
              <div className="text-6xl font-bold text-primary mb-2">{metrics.overall_score}</div>
              <div className="text-lg text-muted-foreground">Overall Security Score</div>
              <Badge variant={metrics.risk_level === 'low' ? 'default' : 
                           metrics.risk_level === 'medium' ? 'secondary' : 'destructive'}>
                {metrics.risk_level.toUpperCase()} RISK
              </Badge>
            </div>
            <div className="md:col-span-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-500">{metrics.threats_blocked}</div>
                  <div className="text-sm text-muted-foreground">Threats Blocked</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-red-500">{metrics.vulnerabilities_found}</div>
                  <div className="text-sm text-muted-foreground">Vulnerabilities</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">{metrics.compliance_score}%</div>
                  <div className="text-sm text-muted-foreground">Compliance</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{metrics.incidents_resolved}</div>
                  <div className="text-sm text-muted-foreground">Incidents Resolved</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Apps Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              SafeDoc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appMetrics.safedoc.scans_today}</div>
            <p className="text-xs text-muted-foreground mb-2">Scans Today</p>
            <div className={`text-sm font-medium ${getRiskColor(appMetrics.safedoc.risk_score)}`}>
              Risk: {appMetrics.safedoc.risk_score}/10
            </div>
            <Progress value={appMetrics.safedoc.risk_score * 10} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              SafeMail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appMetrics.safemail.emails_scanned}</div>
            <p className="text-xs text-muted-foreground mb-2">Emails Scanned</p>
            <div className={`text-sm font-medium ${getRiskColor(appMetrics.safemail.risk_score)}`}>
              Risk: {appMetrics.safemail.risk_score}/10
            </div>
            <Progress value={appMetrics.safemail.risk_score * 10} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link className="h-4 w-4" />
              SafeLink
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appMetrics.safelink.urls_scanned}</div>
            <p className="text-xs text-muted-foreground mb-2">URLs Scanned</p>
            <div className={`text-sm font-medium ${getRiskColor(appMetrics.safelink.risk_score)}`}>
              Risk: {appMetrics.safelink.risk_score}/10
            </div>
            <Progress value={appMetrics.safelink.risk_score * 10} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              SafePass
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appMetrics.safepass.passwords_managed}</div>
            <p className="text-xs text-muted-foreground mb-2">Passwords Managed</p>
            <div className={`text-sm font-medium ${getRiskColor(appMetrics.safepass.risk_score)}`}>
              Risk: {appMetrics.safepass.risk_score}/10
            </div>
            <Progress value={appMetrics.safepass.risk_score * 10} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Network className="h-4 w-4" />
              SafeNet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appMetrics.safenet.devices_monitored}</div>
            <p className="text-xs text-muted-foreground mb-2">Devices Monitored</p>
            <div className={`text-sm font-medium ${getRiskColor(appMetrics.safenet.risk_score)}`}>
              Risk: {appMetrics.safenet.risk_score}/10
            </div>
            <Progress value={appMetrics.safenet.risk_score * 10} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="threats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
          <TabsTrigger value="incidents">Incident Management</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="threats" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Active Threat Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {threatIntel.active_campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <Badge variant={campaign.severity === 'critical' ? 'destructive' : 
                                   campaign.severity === 'high' ? 'secondary' : 'default'}>
                        {campaign.severity}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Targets: {campaign.targets.join(', ')}</div>
                      <div>Last Activity: {new Date(campaign.last_activity).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Threat Intelligence Feeds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {threatIntel.feeds.map((feed, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{feed.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {feed.indicators_count.toLocaleString()} indicators
                      </div>
                    </div>
                    <Badge variant={feed.status === 'active' ? 'default' : 'secondary'}>
                      {feed.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Executive Dashboard</CardTitle>
                <CardDescription>High-level security overview for leadership</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => generateReport('executive')} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Executive Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Report</CardTitle>
                <CardDescription>Detailed technical analysis and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => generateReport('technical')} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Technical Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Report</CardTitle>
                <CardDescription>Regulatory compliance status and evidence</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => generateReport('compliance')} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Compliance Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};