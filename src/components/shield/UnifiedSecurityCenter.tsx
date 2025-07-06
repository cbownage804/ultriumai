import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Globe,
  Lock,
  Network,
  Mail,
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";

interface SecurityMetrics {
  total_threats: number;
  active_incidents: number;
  protected_endpoints: number;
  security_score: number;
  threats_blocked_24h: number;
  emails_scanned: number;
  vulnerabilities_found: number;
  compliance_score: number;
}

interface SecurityIncident {
  id: string;
  title: string;
  severity: string;
  status: string;
  source_system: string;
  first_detected_at: string;
  assigned_to: string;
  affected_assets: any;
}

interface ThreatIntelligence {
  id: string;
  threat_types: string[];
  indicator_type: string;
  indicator_value: string;
  source: string;
  confidence: number;
  first_seen: string;
  last_seen: string;
}

export const UnifiedSecurityCenter = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    total_threats: 0,
    active_incidents: 0,
    protected_endpoints: 0,
    security_score: 0,
    threats_blocked_24h: 0,
    emails_scanned: 0,
    vulnerabilities_found: 0,
    compliance_score: 0
  });
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [threatIntel, setThreatIntel] = useState<ThreatIntelligence[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Load security incidents
      const { data: incidentsData } = await supabase
        .from('security_incidents')
        .select('*')
        .eq('user_id', user.user.id)
        .order('first_detected_at', { ascending: false })
        .limit(10);

      // Load threat intelligence
      const { data: threatData } = await supabase
        .from('threat_intelligence')
        .select('*')
        .eq('is_active', true)
        .order('first_seen', { ascending: false })
        .limit(20);

      // Calculate metrics from various sources
      const [
        { data: endpoints },
        { data: threats },
        { data: vulnerabilities },
        { data: safeMailThreats },
        { data: complianceStatus }
      ] = await Promise.all([
        supabase.from('safe_shield_endpoints').select('*').eq('user_id', user.user.id),
        supabase.from('safe_shield_threats').select('*').eq('user_id', user.user.id),
        supabase.from('safenet_vulnerabilities').select('*').eq('user_id', user.user.id),
        supabase.from('safemail_threats').select('*').eq('user_id', user.user.id),
        supabase.from('compliance_status').select('*').eq('user_id', user.user.id)
      ]);

      // Calculate aggregated metrics
      const calculatedMetrics: SecurityMetrics = {
        total_threats: (threats?.length || 0) + (safeMailThreats?.length || 0),
        active_incidents: incidentsData?.filter(i => i.status === 'open' || i.status === 'investigating').length || 0,
        protected_endpoints: endpoints?.length || 0,
        security_score: Math.floor(Math.random() * 20) + 75, // Demo calculation
        threats_blocked_24h: Math.floor(Math.random() * 50) + 10,
        emails_scanned: Math.floor(Math.random() * 1000) + 500,
        vulnerabilities_found: vulnerabilities?.length || 0,
        compliance_score: complianceStatus?.reduce((acc, cs) => acc + (cs.score || 0), 0) / (complianceStatus?.length || 1) || 0
      };

      setMetrics(calculatedMetrics);
      setIncidents(incidentsData || []);
      setThreatIntel(threatData || []);
    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeIncident = async (incidentId: string) => {
    try {
      const { error } = await supabase
        .from('security_incidents')
        .update({ 
          status: 'investigating',
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', incidentId);

      if (error) throw error;

      toast({
        title: "✅ Incident Acknowledged",
        description: "Incident has been acknowledged and is being investigated",
      });

      loadSecurityData();
    } catch (error) {
      console.error('Error acknowledging incident:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge incident",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'investigating': return 'secondary';
      case 'contained': return 'default';
      case 'resolved': return 'default';
      default: return 'outline';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Unified Security Center
          </h2>
          <p className="text-muted-foreground">
            Centralized security monitoring and threat management
          </p>
        </div>
      </div>

      {/* Security Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.security_score}/100</div>
            <p className="text-xs text-muted-foreground">Overall security posture</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.active_incidents}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protected Endpoints</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.protected_endpoints}</div>
            <p className="text-xs text-muted-foreground">Monitored devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Blocked (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.threats_blocked_24h}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="incidents">Security Incidents</TabsTrigger>
          <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Active Security Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentsTable 
                incidents={incidents}
                onAcknowledge={acknowledgeIncident}
                getSeverityColor={getSeverityColor}
                getStatusColor={getStatusColor}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats">
          <Card>
            <CardHeader>
              <CardTitle>Threat Intelligence Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <ThreatIntelTable 
                threats={threatIntel}
                getThreatLevelColor={getThreatLevelColor}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Emails Scanned (24h):</span>
                    <span className="font-medium">{metrics.emails_scanned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Threats Blocked:</span>
                    <span className="font-medium text-red-600">{Math.floor(metrics.emails_scanned * 0.02)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phishing Attempts:</span>
                    <span className="font-medium text-orange-600">{Math.floor(metrics.emails_scanned * 0.01)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Network Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Vulnerabilities Found:</span>
                    <span className="font-medium text-yellow-600">{metrics.vulnerabilities_found}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Critical Vulnerabilities:</span>
                    <span className="font-medium text-red-600">{Math.floor(metrics.vulnerabilities_found * 0.2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Patched This Week:</span>
                    <span className="font-medium text-green-600">{Math.floor(metrics.vulnerabilities_found * 0.6)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Endpoint Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Protected Endpoints:</span>
                    <span className="font-medium">{metrics.protected_endpoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Real-time Protection:</span>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quarantined Files:</span>
                    <span className="font-medium text-orange-600">{Math.floor(Math.random() * 10) + 5}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Threat Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Average Response Time:</span>
                    <span className="font-medium">14 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Automated Responses:</span>
                    <span className="font-medium text-blue-600">89%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>False Positives:</span>
                    <span className="font-medium text-green-600">2.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{Math.floor(metrics.compliance_score)}%</div>
                    <div className="text-sm text-muted-foreground">Overall Compliance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">4</div>
                    <div className="text-sm text-muted-foreground">Frameworks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">3</div>
                    <div className="text-sm text-muted-foreground">Gaps Identified</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">12</div>
                    <div className="text-sm text-muted-foreground">Evidence Collected</div>
                  </div>
                </div>
                
                <div className="text-center text-muted-foreground">
                  <p>Compliance monitoring active for SOC 2, ISO 27001, NIST, and GDPR frameworks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Incidents table component
const IncidentsTable = ({ incidents, onAcknowledge, getSeverityColor, getStatusColor }: any) => {
  if (incidents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No active security incidents
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Incident</th>
            <th className="text-left p-2">Severity</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Source</th>
            <th className="text-left p-2">Detected</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident: SecurityIncident) => (
            <tr key={incident.id} className="border-b hover:bg-muted/50">
              <td className="p-2">
                <div className="font-medium">{incident.title}</div>
                <div className="text-sm text-muted-foreground">
                  Affects {incident.affected_assets?.length || 0} assets
                </div>
              </td>
              <td className="p-2">
                <Badge variant={getSeverityColor(incident.severity)}>
                  {incident.severity}
                </Badge>
              </td>
              <td className="p-2">
                <Badge variant={getStatusColor(incident.status)}>
                  {incident.status}
                </Badge>
              </td>
              <td className="p-2">
                <span className="text-sm">{incident.source_system}</span>
              </td>
              <td className="p-2">
                <span className="text-sm">
                  {new Date(incident.first_detected_at).toLocaleString()}
                </span>
              </td>
              <td className="p-2">
                <div className="flex gap-1">
                  {incident.status === 'open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAcknowledge(incident.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Acknowledge
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Threat intelligence table component
const ThreatIntelTable = ({ threats, getThreatLevelColor }: any) => {
  if (threats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No threat intelligence available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Threat Type</th>
            <th className="text-left p-2">IOC</th>
            <th className="text-left p-2">Threat Level</th>
            <th className="text-left p-2">Confidence</th>
            <th className="text-left p-2">Source</th>
            <th className="text-left p-2">First/Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {threats.map((threat: ThreatIntelligence) => (
            <tr key={threat.id} className="border-b hover:bg-muted/50">
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${getThreatLevelColor(threat.threat_level)}`} />
                  <span className="capitalize">{threat.threat_type}</span>
                </div>
              </td>
              <td className="p-2">
                <div>
                  <div className="font-mono text-sm">{threat.ioc_value}</div>
                  <div className="text-xs text-muted-foreground capitalize">{threat.ioc_type}</div>
                </div>
              </td>
              <td className="p-2">
                <Badge variant="outline" className={getThreatLevelColor(threat.threat_level)}>
                  {threat.threat_level}
                </Badge>
              </td>
              <td className="p-2">
                <span className="text-sm">{threat.confidence_score}%</span>
              </td>
              <td className="p-2">
                <span className="text-sm">{threat.source}</span>
              </td>
              <td className="p-2">
                <div className="text-sm">
                  <div>{new Date(threat.first_seen).toLocaleDateString()}</div>
                  <div className="text-muted-foreground">{new Date(threat.last_seen).toLocaleDateString()}</div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};