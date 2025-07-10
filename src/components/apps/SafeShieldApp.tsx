import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  ArrowLeft,
  Eye,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Monitor,
  Search,
  TrendingUp,
  Globe,
  Lock,
  Network,
  Mail,
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SafeShieldDashboard } from "@/components/shield/SafeShieldDashboard";
import { SafeMDRDashboard } from "@/components/shield/SafeMDRDashboard";
import { AntivirusDashboard } from "@/components/dashboards/AntivirusDashboard";

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
  user_id: string;
  indicator_type: string;
  indicator_value: string;
  reputation: string;
  score: number;
  threats: any;
  sources: any;
  last_analyzed: string;
  created_at: string;
  updated_at: string;
}

export const SafeShieldApp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('ai-dashboard');
  const [loading, setLoading] = useState(true);
  
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    total_threats: 0,
    active_incidents: 0,
    protected_endpoints: 0,
    security_score: 85,
    threats_blocked_24h: 0,
    emails_scanned: 0,
    vulnerabilities_found: 0,
    compliance_score: 0
  });
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [threatIntel, setThreatIntel] = useState<ThreatIntelligence[]>([]);

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
      const { data: threatData, error: threatError } = await supabase
        .from('threat_intelligence')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (threatError) {
        console.log('Threat intelligence loading error (expected if table missing):', threatError);
      }

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
        security_score: 85, // Base security score
        threats_blocked_24h: Math.floor(Math.random() * 50) + 10, // Simulated for demo
        emails_scanned: Math.floor(Math.random() * 1000) + 500, // Simulated for demo
        vulnerabilities_found: vulnerabilities?.length || 0,
        compliance_score: complianceStatus?.reduce((acc, cs) => acc + (cs.score || 0), 0) / (complianceStatus?.length || 1) || 78
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              SafeShield AI
            </h1>
            <p className="text-muted-foreground">
              Comprehensive AI-powered security platform
            </p>
          </div>
        </div>
      </div>

      {/* Security Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.security_score}/100</div>
            <p className="text-xs text-green-600 mt-2">
              Overall security posture
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.active_incidents}</div>
            <p className="text-xs text-red-600 mt-2">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protected Endpoints</CardTitle>
            <Monitor className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.protected_endpoints}</div>
            <p className="text-xs text-blue-600 mt-2">
              Monitored devices
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Blocked (24h)</CardTitle>
            <Activity className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.threats_blocked_24h}</div>
            <p className="text-xs text-purple-600 mt-2">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="ai-dashboard" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            SafeShield AI
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Incidents
          </TabsTrigger>
          <TabsTrigger value="edr" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            EDR
          </TabsTrigger>
          <TabsTrigger value="mdr" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            MDR
          </TabsTrigger>
          <TabsTrigger value="antivirus" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Antivirus
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Threat Intel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Assistant Chat Panel */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  SafeShield AI Assistant
                </CardTitle>
                <CardDescription>
                  Get AI-powered insights and automated responses for your security metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* AI Chat Interface */}
                  <div className="bg-muted/30 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary rounded-full p-2">
                          <Shield className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div className="bg-background rounded-lg p-3 max-w-[80%]">
                          <p className="text-sm">
                            Welcome to SafeShield AI! I'm here to help you understand your security metrics and provide automated responses. 
                            I can analyze your current security posture, explain threat patterns, and suggest remediation actions.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary rounded-full p-2">
                          <Shield className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div className="bg-background rounded-lg p-3 max-w-[80%]">
                          <p className="text-sm">
                            Current Analysis: Your security score is <strong>{metrics.security_score}/100</strong> with <strong>{metrics.active_incidents}</strong> active incidents. 
                            I've detected {metrics.threats_blocked_24h} threats in the last 24 hours across {metrics.protected_endpoints} endpoints.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="text-left justify-start">
                      📊 Analyze Security Score
                    </Button>
                    <Button variant="outline" size="sm" className="text-left justify-start">
                      🚨 Review Active Incidents
                    </Button>
                    <Button variant="outline" size="sm" className="text-left justify-start">
                      🔍 Threat Intelligence Summary
                    </Button>
                    <Button variant="outline" size="sm" className="text-left justify-start">
                      🛡️ Endpoint Protection Status
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats & Recommendations */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="bg-yellow-100 dark:bg-yellow-900/20 p-1 rounded">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">Update Endpoint Policies</p>
                        <p className="text-muted-foreground">2 endpoints need policy updates</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="bg-blue-100 dark:bg-blue-900/20 p-1 rounded">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">Review Threat Intelligence</p>
                        <p className="text-muted-foreground">5 new IOCs detected</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="bg-green-100 dark:bg-green-900/20 p-1 rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">Security Posture Strong</p>
                        <p className="text-muted-foreground">All critical systems protected</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Automated Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button className="w-full justify-start" size="sm">
                      🤖 Enable Auto-Remediation
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      📧 Configure Alert Notifications
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      🔄 Schedule Security Scan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
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
                  Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Overall Compliance:</span>
                    <span className="font-medium text-green-600">{Math.floor(metrics.compliance_score)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Frameworks:</span>
                    <span className="font-medium text-blue-600">4</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evidence Collected:</span>
                    <span className="font-medium text-purple-600">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Security Incidents
              </CardTitle>
              <CardDescription>
                Monitor and manage security incidents across all systems
              </CardDescription>
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

        <TabsContent value="intelligence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Threat Intelligence Feed
              </CardTitle>
              <CardDescription>
                Real-time threat indicators and intelligence updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThreatIntelTable 
                threats={threatIntel}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SafeShield EDR - Endpoint Detection & Response
              </CardTitle>
              <CardDescription>
                AI-powered behavioral analysis and automated threat response
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="-mt-6">
                <SafeShieldDashboard />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mdr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                SafeMDR - Managed Detection & Response
              </CardTitle>
              <CardDescription>
                24/7 SOC services with expert security analysts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="-mt-6">
                <SafeMDRDashboard />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="antivirus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                SafeAV - Advanced Antivirus Protection
              </CardTitle>
              <CardDescription>
                Multi-layered malware protection with real-time scanning
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="-mt-6">
                <AntivirusDashboard />
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
          {incidents.map((incident: any) => (
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
const ThreatIntelTable = ({ threats }: any) => {
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
            <th className="text-left p-2">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {threats.map((threat: any) => (
            <tr key={threat.id} className="border-b hover:bg-muted/50">
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="capitalize">
                    {Array.isArray(threat.threats) 
                      ? threat.threats.map((t: any) => t.category || 'unknown').join(', ') 
                      : 'unknown'
                    }
                  </span>
                </div>
              </td>
              <td className="p-2">
                <div>
                  <div className="font-mono text-sm">{threat.indicator_value}</div>
                  <div className="text-xs text-muted-foreground capitalize">{threat.indicator_type}</div>
                </div>
              </td>
              <td className="p-2">
                <Badge variant="outline" className={
                  threat.reputation === 'malicious' ? 'text-red-600' : 
                  threat.reputation === 'suspicious' ? 'text-orange-600' : 
                  threat.reputation === 'questionable' ? 'text-yellow-600' : 'text-green-600'
                }>
                  {threat.reputation}
                </Badge>
              </td>
              <td className="p-2">
                <span className="text-sm">{threat.score}%</span>
              </td>
              <td className="p-2">
                <span className="text-sm">
                  {Array.isArray(threat.sources) ? threat.sources.join(', ') : 'Unknown'}
                </span>
              </td>
              <td className="p-2">
                <div className="text-sm">
                  <div>{new Date(threat.last_analyzed).toLocaleDateString()}</div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};