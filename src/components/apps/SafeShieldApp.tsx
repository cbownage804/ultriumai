import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityAIAssistant } from "@/components/security/SecurityAIAssistant";
import { ThreatPredictionEngine } from "@/components/security/ThreatPredictionEngine";
import { ThreatAnalysisEngine } from "@/components/security/ThreatAnalysisEngine";
import { AutomatedActions } from "@/components/security/AutomatedActions";
import { SafePassDashboard } from "@/components/shield/SafePassDashboard";
import { SafeMailDashboard } from "@/components/shield/SafeMailDashboard";
import { SafeNetDashboard } from "@/components/shield/SafeNetDashboard";
import { SecurityDashboard } from "@/components/shield/SecurityDashboard";
import { SafeWebDashboard } from "@/components/SafeWebDashboard";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Bot,
  Zap,
  Eye,
  Settings,
  Activity,
  Users,
  Lock,
  ArrowLeft,
  Mail,
  Network,
  Key,
  Search,
  Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const SafeShieldApp = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAIMinimized, setIsAIMinimized] = useState(false);
  const [securityMetrics, setSecurityMetrics] = useState({
    activeAlerts: 0,
    criticalThreats: 0,
    openIncidents: 0,
    complianceScore: 85
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecurityMetrics();
    
    // Set up real-time subscriptions for live data updates
    const securityEventsChannel = supabase
      .channel('security-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'security_events'
        },
        () => loadSecurityMetrics()
      )
      .subscribe();

    const edrAlertsChannel = supabase
      .channel('edr-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'edr_realtime_alerts'
        },
        () => loadSecurityMetrics()
      )
      .subscribe();

    const incidentsChannel = supabase
      .channel('incidents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents'
        },
        () => loadSecurityMetrics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(securityEventsChannel);
      supabase.removeChannel(edrAlertsChannel);
      supabase.removeChannel(incidentsChannel);
    };
  }, []);

  const loadSecurityMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSecurityMetrics({
          activeAlerts: 0,
          criticalThreats: 0,
          openIncidents: 0,
          complianceScore: 0
        });
        return;
      }

      // Get real security events
      const { data: securityEvents } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Get real EDR alerts
      const { data: edrAlerts } = await supabase
        .from('edr_realtime_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'new');

      // Get real incidents
      const { data: incidents } = await supabase
        .from('incidents')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['open', 'investigating', 'escalated']);

      // Get compliance status
      const { data: compliance } = await supabase
        .from('compliance_status')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      const activeAlerts = (securityEvents?.length || 0) + (edrAlerts?.length || 0);
      const criticalThreats = [
        ...(securityEvents?.filter(e => e.severity === 'critical') || []),
        ...(edrAlerts?.filter(a => a.severity === 'critical') || [])
      ].length;
      
      setSecurityMetrics({
        activeAlerts,
        criticalThreats,
        openIncidents: incidents?.length || 0,
        complianceScore: compliance?.[0]?.score || 0
      });
    } catch (error) {
      console.error('Error loading security metrics:', error);
      // For live environment, show actual zero state when no data
      setSecurityMetrics({
        activeAlerts: 0,
        criticalThreats: 0,
        openIncidents: 0,
        complianceScore: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: "Real-Time Threat Analysis",
      description: "Continuously monitors and analyzes security events, identifying threats as they emerge with AI-powered detection algorithms."
    },
    {
      icon: <Eye className="h-8 w-8 text-blue-500" />,
      title: "Contextual Security Intelligence",
      description: "Provides security insights based on your current infrastructure, policies, and threat landscape for personalized recommendations."
    },
    {
      icon: <Bot className="h-8 w-8 text-green-500" />,
      title: "Automated Response Actions",
      description: "Suggests and can execute automated security responses, from quarantining files to blocking network traffic."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-purple-500" />,
      title: "Predictive Security Analytics",
      description: "Uses machine learning to predict potential security incidents and recommend proactive mitigation strategies."
    },
    {
      icon: <Users className="h-8 w-8 text-orange-500" />,
      title: "Multi-Tenant Awareness",
      description: "Understands MSP environments with role-based intelligence for different security contexts and client needs."
    },
    {
      icon: <Lock className="h-8 w-8 text-red-500" />,
      title: "Compliance Automation",
      description: "Continuously monitors compliance status and generates automated reports for various security frameworks."
    }
  ];

  const aiCapabilities = [
    "🔍 **Threat Hunting**: Proactively searches for advanced persistent threats",
    "🛡️ **Incident Response**: Guides through structured incident response procedures",
    "📊 **Risk Assessment**: Calculates and prioritizes security risks across your environment", 
    "📋 **Compliance Monitoring**: Tracks adherence to security frameworks (SOC2, ISO27001, etc.)",
    "🔒 **Vulnerability Management**: Identifies and prioritizes security vulnerabilities",
    "📈 **Security Reporting**: Generates executive and technical security reports",
    "⚡ **Automated Remediation**: Suggests and implements security fixes automatically",
    "🌐 **Network Security**: Monitors and analyzes network traffic for anomalies"
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">SafeShield</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Comprehensive AI-powered security platform with integrated threat detection, 
          email security, password management, and dark web monitoring.
        </p>
      </div>

      {/* Security Apps Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="safepass" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            SafePass
          </TabsTrigger>
          <TabsTrigger value="safemail" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            SafeMail
          </TabsTrigger>
          <TabsTrigger value="safenet" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            SafeNet
          </TabsTrigger>
          <TabsTrigger value="safeintel" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            SafeIntel
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 mt-8">
          {/* Current Security Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Current Security Status
              </CardTitle>
              <CardDescription>
                Real-time security metrics from your environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg border">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold">{securityMetrics.activeAlerts}</div>
                  <div className="text-sm text-muted-foreground">Active Alerts</div>
                </div>
                <div className="text-center p-4 rounded-lg border">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <div className="text-2xl font-bold">{securityMetrics.criticalThreats}</div>
                  <div className="text-sm text-muted-foreground">Critical Threats</div>
                </div>
                <div className="text-center p-4 rounded-lg border">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{securityMetrics.openIncidents}</div>
                  <div className="text-sm text-muted-foreground">Open Incidents</div>
                </div>
                <div className="text-center p-4 rounded-lg border">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{securityMetrics.complianceScore}%</div>
                  <div className="text-sm text-muted-foreground">Compliance Score</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Security Capabilities
              </CardTitle>
              <CardDescription>
                Advanced security operations powered by artificial intelligence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiCapabilities.map((capability, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="text-sm">{capability}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Threat Analysis */}
          <ThreatAnalysisEngine securityContext={securityMetrics} />

          {/* Automated Actions */}
          <AutomatedActions />

          {/* Threat Prediction Engine */}
          <ThreatPredictionEngine securityContext={securityMetrics} />

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {feature.icon}
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Security Actions</CardTitle>
              <CardDescription>
                Common security tasks you can ask SafeShield AI about
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => setIsAIMinimized(false)}
                >
                  <div className="text-left">
                    <div className="font-medium">Security Health Check</div>
                    <div className="text-sm text-muted-foreground">Get overall security status</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => setIsAIMinimized(false)}
                >
                  <div className="text-left">
                    <div className="font-medium">Threat Investigation</div>
                    <div className="text-sm text-muted-foreground">Analyze current threats</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => setIsAIMinimized(false)}
                >
                  <div className="text-left">
                    <div className="font-medium">Compliance Report</div>
                    <div className="text-sm text-muted-foreground">Generate compliance summary</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => setIsAIMinimized(false)}
                >
                  <div className="text-left">
                    <div className="font-medium">Incident Response</div>
                    <div className="text-sm text-muted-foreground">Get response guidance</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => setIsAIMinimized(false)}
                >
                  <div className="text-left">
                    <div className="font-medium">Risk Assessment</div>
                    <div className="text-sm text-muted-foreground">Calculate security risks</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => setIsAIMinimized(false)}
                >
                  <div className="text-left">
                    <div className="font-medium">Security Recommendations</div>
                    <div className="text-sm text-muted-foreground">Get actionable advice</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safepass" className="mt-8">
          <SafePassDashboard />
        </TabsContent>

        <TabsContent value="safemail" className="mt-8">
          <SafeMailDashboard />
        </TabsContent>

        <TabsContent value="safenet" className="mt-8">
          <SafeNetDashboard />
        </TabsContent>

        <TabsContent value="safeintel" className="mt-8">
          <SafeWebDashboard />
        </TabsContent>

        <TabsContent value="security" className="mt-8">
          <SecurityDashboard />
        </TabsContent>
      </Tabs>

      {/* AI Assistant - Available on all tabs */}
      <SecurityAIAssistant 
        isMinimized={isAIMinimized}
        onToggleMinimize={() => setIsAIMinimized(!isAIMinimized)}
        securityContext={securityMetrics}
      />
    </div>
  );
};