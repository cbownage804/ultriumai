import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Target, 
  FileCode, 
  Network, 
  HardDrive,
  Settings,
  Skull,
  Crosshair,
  Brain,
  PlayCircle
} from "lucide-react";
import { useXDRStats } from "@/hooks/usePursuitXDR";
import { ThreatDetectionPanel } from "./ThreatDetectionPanel";
import { ThreatHuntingPanel } from "./ThreatHuntingPanel";
import { IOCManagement } from "./IOCManagement";
import { YaraRulesPanel } from "./YaraRulesPanel";
import { NetworkSecurityPanel } from "./NetworkSecurityPanel";
import { RansomwareDefensePanel } from "./RansomwareDefensePanel";
import { ForensicsPanel } from "./ForensicsPanel";
import { AutomationPoliciesPanel } from "./AutomationPoliciesPanel";
import { ResponseActionsPanel } from "./ResponseActionsPanel";
import { ThreatIntelligencePanel } from "./ThreatIntelligencePanel";

export function PursuitDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: stats, isLoading } = useXDRStats();

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-destructive/10 border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {isLoading ? "..." : stats?.criticalThreats || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active threats</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-500" />
              High
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {isLoading ? "..." : stats?.highThreats || 0}
            </div>
            <p className="text-xs text-muted-foreground">High severity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats?.activeThreats || 0}
            </div>
            <p className="text-xs text-muted-foreground">Under investigation</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Skull className="h-4 w-4 text-purple-500" />
              Ransomware
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {isLoading ? "..." : stats?.ransomwareEvents || 0}
            </div>
            <p className="text-xs text-muted-foreground">Events detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {isLoading ? "..." : stats?.pendingActions || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {isLoading ? "..." : stats?.totalThreats || 0}
            </div>
            <p className="text-xs text-muted-foreground">All time threats</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="text-xs gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Threat Detection
          </TabsTrigger>
          <TabsTrigger value="hunting" className="text-xs gap-1.5">
            <Crosshair className="h-3.5 w-3.5" />
            Threat Hunting
          </TabsTrigger>
          <TabsTrigger value="iocs" className="text-xs gap-1.5">
            <Target className="h-3.5 w-3.5" />
            IOC Management
          </TabsTrigger>
          <TabsTrigger value="yara" className="text-xs gap-1.5">
            <FileCode className="h-3.5 w-3.5" />
            YARA Rules
          </TabsTrigger>
          <TabsTrigger value="intel" className="text-xs gap-1.5">
            <Brain className="h-3.5 w-3.5" />
            Threat Intel
          </TabsTrigger>
          <TabsTrigger value="network" className="text-xs gap-1.5">
            <Network className="h-3.5 w-3.5" />
            Network Security
          </TabsTrigger>
          <TabsTrigger value="ransomware" className="text-xs gap-1.5">
            <Skull className="h-3.5 w-3.5" />
            Ransomware Defense
          </TabsTrigger>
          <TabsTrigger value="forensics" className="text-xs gap-1.5">
            <HardDrive className="h-3.5 w-3.5" />
            Forensics
          </TabsTrigger>
          <TabsTrigger value="response" className="text-xs gap-1.5">
            <PlayCircle className="h-3.5 w-3.5" />
            Response Actions
          </TabsTrigger>
          <TabsTrigger value="automation" className="text-xs gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Automation
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="overview">
            <ThreatDetectionPanel />
          </TabsContent>
          <TabsContent value="hunting">
            <ThreatHuntingPanel />
          </TabsContent>
          <TabsContent value="iocs">
            <IOCManagement />
          </TabsContent>
          <TabsContent value="yara">
            <YaraRulesPanel />
          </TabsContent>
          <TabsContent value="intel">
            <ThreatIntelligencePanel />
          </TabsContent>
          <TabsContent value="network">
            <NetworkSecurityPanel />
          </TabsContent>
          <TabsContent value="ransomware">
            <RansomwareDefensePanel />
          </TabsContent>
          <TabsContent value="forensics">
            <ForensicsPanel />
          </TabsContent>
          <TabsContent value="response">
            <ResponseActionsPanel />
          </TabsContent>
          <TabsContent value="automation">
            <AutomationPoliciesPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
