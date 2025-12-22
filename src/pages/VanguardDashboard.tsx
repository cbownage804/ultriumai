import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Shield, Search, Bug, AlertTriangle, CheckCircle, Clock, Target, TrendingUp, Eye, Network } from "lucide-react";
import { VulnerabilityScanner } from "@/components/security/VulnerabilityScanner";
import { ThreatDetection } from "@/components/security/ThreatDetection";
import { SecurityReports } from "@/components/security/SecurityReports";
import { ComplianceAuditor } from "@/components/security/ComplianceAuditor";
import { NetworkConnectors } from "@/components/security/NetworkConnectors";
import { VanguardOverview } from "@/components/vanguard/VanguardOverview";
import { VanguardSOC } from "@/components/vanguard/VanguardSOC";
import { VanguardServiceDesk } from "@/components/vanguard/VanguardServiceDesk";
import { VanguardAICopilot } from "@/components/vanguard/VanguardAICopilot";
import { VanguardPentest } from "@/components/vanguard/VanguardPentest";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";

interface SecurityScan {
  id: string;
  target: string;
  scan_type: string;
  status: string;
  findings_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  started_at: string;
  completed_at?: string;
}

const VanguardDashboard = () => {
  const [recentScans, setRecentScans] = useState<SecurityScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const { agents } = useVanguardAgents();

  useEffect(() => {
    loadRecentScans();
  }, []);

  const loadRecentScans = async () => {
    try {
      const { data, error } = await supabase
        .from('security_scans')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentScans(data || []);
    } catch (error) {
      console.error('Error loading scans:', error);
      toast({
        title: "Error",
        description: "Failed to load recent scans",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const totalFindings = recentScans.reduce((sum, scan) => sum + scan.findings_count, 0);
  const criticalFindings = recentScans.reduce((sum, scan) => sum + scan.critical_count, 0);
  const highFindings = recentScans.reduce((sum, scan) => sum + scan.high_count, 0);

  // Calculate online agents (last heartbeat within 5 minutes)
  const onlineAgentCount = agents.filter(agent => {
    if (!agent.last_heartbeat) return false;
    const lastHeartbeat = new Date(agent.last_heartbeat).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return lastHeartbeat > fiveMinutesAgo;
  }).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Ultrium Vanguard</h1>
              <p className="text-muted-foreground mt-1">Elite AI-Powered Cybersecurity Operations Platform</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Agents</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.length}</div>
              <p className="text-xs text-muted-foreground">
                {onlineAgentCount} online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{criticalFindings}</div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <Bug className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{highFindings}</div>
              <p className="text-xs text-muted-foreground">
                High severity findings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentScans.length}</div>
              <p className="text-xs text-muted-foreground">
                {totalFindings} findings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex h-10 w-max items-center justify-start gap-1 rounded-md bg-muted p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="servicedesk">Service Desk</TabsTrigger>
              <TabsTrigger value="copilot">AI Copilot</TabsTrigger>
              <TabsTrigger value="soc">SOC</TabsTrigger>
              <TabsTrigger value="scanner">Threats</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="pentest">Pentest</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="threats">Advanced</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="overview" className="space-y-6">
            <VanguardOverview 
              metrics={{
                totalScans: recentScans.length,
                criticalIssues: criticalFindings,
                highPriorityIssues: highFindings,
                totalFindings: totalFindings,
                agentCount: agents.length,
                onlineAgentCount: onlineAgentCount
              }}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Security Operations Center</CardTitle>
                <CardDescription>Launch advanced security modules for comprehensive protection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => setActiveTab("soc")}
                    className="h-auto p-4 flex-col gap-2"
                  >
                    <Eye className="h-6 w-6" />
                    <span>SOC Dashboard</span>
                  </Button>

                  <Button 
                    onClick={() => setActiveTab("scanner")}
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2"
                  >
                    <Search className="h-6 w-6" />
                    <span>Threat Detection</span>
                  </Button>

                  <Button 
                    onClick={() => setActiveTab("network")}
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2"
                  >
                    <Network className="h-6 w-6" />
                    <span>Network Security</span>
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab("pentest")}
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2"
                  >
                    <Target className="h-6 w-6" />
                    <span>Penetration Testing</span>
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab("compliance")}
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2"
                  >
                    <CheckCircle className="h-6 w-6" />
                    <span>Compliance</span>
                  </Button>

                  <Button 
                    onClick={() => setActiveTab("threats")}
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2"
                  >
                    <AlertTriangle className="h-6 w-6" />
                    <span>Advanced Threats</span>
                  </Button>

                  <Button 
                    onClick={() => setActiveTab("reports")}
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2"
                  >
                    <TrendingUp className="h-6 w-6" />
                    <span>Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servicedesk">
            <VanguardServiceDesk />
          </TabsContent>

          <TabsContent value="copilot">
            <VanguardAICopilot />
          </TabsContent>

          <TabsContent value="soc">
            <VanguardSOC />
          </TabsContent>

          <TabsContent value="scanner">
            <VulnerabilityScanner onScanComplete={loadRecentScans} />
          </TabsContent>


          <TabsContent value="network">
            <NetworkConnectors />
          </TabsContent>

          <TabsContent value="pentest">
            <VanguardPentest />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceAuditor onScanComplete={loadRecentScans} />
          </TabsContent>

          <TabsContent value="threats">
            <ThreatDetection />
          </TabsContent>

          <TabsContent value="reports">
            <SecurityReports scans={recentScans} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VanguardDashboard;
