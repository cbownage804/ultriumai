import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle,
  Eye,
  Zap,
  Globe,
  FileSearch,
  Mail,
  Users,
  TrendingUp,
  Activity,
  Bell,
  Search
} from "lucide-react";

interface SecurityMetrics {
  totalThreats: number;
  activeMonitors: number;
  complianceScore: number;
  vulnerabilities: number;
  incidentCount: number;
  scanResults: number;
}

interface ThreatEvent {
  id: string;
  title: string;
  severity: string;
  source: string;
  timestamp: string;
  status: string;
}

export const SecurityDashboard = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalThreats: 0,
    activeMonitors: 0,
    complianceScore: 0,
    vulnerabilities: 0,
    incidentCount: 0,
    scanResults: 0
  });
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);

      // Load security events
      const { data: securityEvents, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventsError) throw eventsError;

      // Load darkweb monitors
      const { data: monitors, error: monitorsError } = await supabase
        .from('darkweb_monitors')
        .select('*');

      if (monitorsError) throw monitorsError;

      // Load compliance status
      const { data: compliance, error: complianceError } = await supabase
        .from('compliance_status')
        .select('score');

      if (complianceError) throw complianceError;

      // Load document scans
      const { data: scans, error: scansError } = await supabase
        .from('document_scans')
        .select('*')
        .order('created_at', { ascending: false });

      if (scansError) throw scansError;

      const avgComplianceScore = compliance?.length 
        ? compliance.reduce((sum, item) => sum + (item.score || 0), 0) / compliance.length
        : 0;

      const threatData = securityEvents?.map(event => ({
        id: event.id,
        title: event.title || 'Security Event',
        severity: event.severity || 'medium',
        source: event.source_app || 'Unknown',
        timestamp: event.created_at,
        status: event.status || 'open'
      })) || [];

      setMetrics({
        totalThreats: securityEvents?.length || 0,
        activeMonitors: monitors?.filter(m => m.status === 'monitoring').length || 0,
        complianceScore: Math.round(avgComplianceScore),
        vulnerabilities: securityEvents?.filter(e => e.severity === 'high' || e.severity === 'critical').length || 0,
        incidentCount: securityEvents?.filter(e => e.status === 'open').length || 0,
        scanResults: scans?.length || 0
      });

      setThreats(threatData);
    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScanAction = async (scanType: string) => {
    try {
      const { error } = await supabase.functions.invoke(`safescan-ai-analyzer`, {
        body: { action: 'start_scan', scanType }
      });

      if (error) throw error;

      toast({
        title: "Scan Started",
        description: `${scanType} scan has been initiated`,
      });
    } catch (error) {
      console.error('Error starting scan:', error);
      toast({
        title: "Error",
        description: "Failed to start security scan",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SafeSOC</h1>
          <div className="text-muted-foreground">
            Comprehensive security monitoring and threat intelligence
          </div>
        </div>
        <Button onClick={loadSecurityData} disabled={loading}>
          <Activity className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.totalThreats}</div>
            <div className="text-xs text-muted-foreground">Security events</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dark Web Monitors</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.activeMonitors}</div>
            <div className="text-xs text-muted-foreground">Active monitoring</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.complianceScore}%</div>
            <Progress value={metrics.complianceScore} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.vulnerabilities}</div>
            <div className="text-xs text-muted-foreground">High/Critical</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <Bell className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.incidentCount}</div>
            <div className="text-xs text-muted-foreground">Requiring attention</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scan Results</CardTitle>
            <Search className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{metrics.scanResults}</div>
            <div className="text-xs text-muted-foreground">Documents scanned</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="threats" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
          <TabsTrigger value="scanning">Security Scanning</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="monitoring">Dark Web Monitoring</TabsTrigger>
          <TabsTrigger value="incidents">Incident Response</TabsTrigger>
        </TabsList>

        <TabsContent value="threats" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Recent Threats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {threats.length > 0 ? threats.map((threat) => (
                  <div key={threat.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{threat.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {threat.source} • {new Date(threat.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        threat.severity === 'critical' ? 'destructive' :
                        threat.severity === 'high' ? 'destructive' :
                        threat.severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {threat.severity}
                      </Badge>
                      <Badge variant={threat.status === 'open' ? 'destructive' : 'secondary'}>
                        {threat.status}
                      </Badge>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent threats detected
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Threat Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Email Threats</span>
                    <span className="font-bold">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Web Threats</span>
                    <span className="font-bold">15</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Network Intrusions</span>
                    <span className="font-bold">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Malware Detections</span>
                    <span className="font-bold">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scanning" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5" />
                  Document Scanning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  AI-powered document analysis for threats and sensitive data
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleScanAction('document')}
                >
                  Start Document Scan
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Web Asset Scanning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Comprehensive web application security assessment
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleScanAction('web')}
                >
                  Start Web Scan
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Advanced email threat detection and analysis
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleScanAction('email')}
                >
                  Start Email Scan
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Framework Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>SOC 2 Type II</span>
                    <span className="font-bold">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>ISO 27001</span>
                    <span className="font-bold">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>NIST Cybersecurity Framework</span>
                    <span className="font-bold">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>GDPR Compliance</span>
                    <span className="font-bold">88%</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Dark Web Monitoring Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Email Addresses</div>
                      <div className="text-sm text-muted-foreground">15 monitored</div>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Domain Names</div>
                      <div className="text-sm text-muted-foreground">8 monitored</div>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Credentials</div>
                      <div className="text-sm text-muted-foreground">23 monitored</div>
                    </div>
                    <Badge variant="destructive">2 Found</Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-sm font-medium">Recent Findings</div>
                  <div className="space-y-2">
                    <div className="p-2 border rounded text-sm">
                      <div className="font-medium text-red-600">Credential Found</div>
                      <div className="text-muted-foreground">admin@company.com found on breach database</div>
                    </div>
                    <div className="p-2 border rounded text-sm">
                      <div className="font-medium text-orange-600">Domain Mention</div>
                      <div className="text-muted-foreground">company.com discussed in hacker forum</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Incident Response Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">3</div>
                  <div className="text-sm text-muted-foreground">Critical Incidents</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">8</div>
                  <div className="text-sm text-muted-foreground">High Priority</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">15</div>
                  <div className="text-sm text-muted-foreground">Under Investigation</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};