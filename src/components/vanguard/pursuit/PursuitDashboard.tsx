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
  PlayCircle,
  GitBranch,
  Search,
  FileText,
  Archive,
  TestTube,
  RotateCcw,
  Anchor,
  UserX
} from "lucide-react";
import { useXDRStats } from "@/hooks/usePursuitXDR";
import { ThreatDetectionPanel } from "./ThreatDetectionPanel";
import { ThreatHuntingPanel } from "./ThreatHuntingPanel";
import { IOCManagement } from "./IOCManagement";
import { YaraRulesPanel } from "./YaraRulesPanel";
import { NetworkSecurityPanel } from "./NetworkSecurityPanel";
import { RansomwareDefensePanel } from "./RansomwareDefensePanel";
import { RansomwareRollbackEngine } from "./RansomwareRollbackEngine";
import { EDRTimelinePanel } from "./EDRTimelinePanel";
import { PersistenceDetectionPanel } from "./PersistenceDetectionPanel";
import { IdentityThreatDetection } from "./IdentityThreatDetection";
import { ForensicsPanel } from "./ForensicsPanel";
import { AutomationPoliciesPanel } from "./AutomationPoliciesPanel";
import { ResponseActionsPanel } from "./ResponseActionsPanel";
import { ThreatIntelligencePanel } from "./ThreatIntelligencePanel";
import { AttackChainVisualization } from "./AttackChainVisualization";
import { RealtimeAlertsIndicator } from "./RealtimeAlertsIndicator";
import { ThreatIntelLookup } from "./ThreatIntelLookup";
import { ThreatReportsExport } from "./ThreatReportsExport";
import { QuarantineManager } from "./QuarantineManager";
import { AgentTestingPanel } from "./AgentTestingPanel";

export function PursuitDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: stats, isLoading } = useXDRStats();

  return (
    <div className="space-y-6">
      {/* Header with realtime alerts */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
            <Shield className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent">
              Pursuit XDR
            </h2>
            <p className="text-sm text-white/50">Extended detection and response</p>
          </div>
        </div>
        <RealtimeAlertsIndicator />
      </div>

      {/* Header Stats - Premium Dark Glass Theme */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="relative overflow-hidden rounded-xl bg-red-500/10 border border-red-500/30 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Critical</span>
          </div>
          <div className="text-2xl font-bold text-red-400">
            {isLoading ? "..." : stats?.criticalThreats || 0}
          </div>
          <p className="text-xs text-white/50 mt-1">Active threats</p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 blur-2xl" />
        </div>

        <div className="relative overflow-hidden rounded-xl bg-orange-500/10 border border-orange-500/30 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-orange-400" />
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">High</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {isLoading ? "..." : stats?.highThreats || 0}
          </div>
          <p className="text-xs text-white/50 mt-1">High severity</p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 blur-2xl" />
        </div>

        <div className="relative overflow-hidden rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Active</span>
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {isLoading ? "..." : stats?.activeThreats || 0}
          </div>
          <p className="text-xs text-white/50 mt-1">Under investigation</p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 blur-2xl" />
        </div>

        <div className="relative overflow-hidden rounded-xl bg-purple-500/10 border border-purple-500/30 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <Skull className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Ransomware</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {isLoading ? "..." : stats?.ransomwareEvents || 0}
          </div>
          <p className="text-xs text-white/50 mt-1">Events detected</p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 blur-2xl" />
        </div>

        <div className="relative overflow-hidden rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <PlayCircle className="h-4 w-4 text-yellow-400" />
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Pending</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {isLoading ? "..." : stats?.pendingActions || 0}
          </div>
          <p className="text-xs text-white/50 mt-1">Awaiting approval</p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 blur-2xl" />
        </div>

        <div className="relative overflow-hidden rounded-xl bg-blue-500/10 border border-blue-500/30 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Total</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {isLoading ? "..." : stats?.totalThreats || 0}
          </div>
          <p className="text-xs text-white/50 mt-1">All time threats</p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl" />
        </div>
      </div>

      {/* Main Tabs - Dark Glass Theme */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-xl">
          <TabsTrigger value="overview" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <Shield className="h-3.5 w-3.5" />
            Threat Detection
          </TabsTrigger>
          <TabsTrigger value="hunting" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <Crosshair className="h-3.5 w-3.5" />
            Threat Hunting
          </TabsTrigger>
          <TabsTrigger value="iocs" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <Target className="h-3.5 w-3.5" />
            IOC Management
          </TabsTrigger>
          <TabsTrigger value="yara" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <FileCode className="h-3.5 w-3.5" />
            YARA Rules
          </TabsTrigger>
          <TabsTrigger value="intel" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <Brain className="h-3.5 w-3.5" />
            Threat Intel
          </TabsTrigger>
          <TabsTrigger value="lookup" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <Search className="h-3.5 w-3.5" />
            IOC Lookup
          </TabsTrigger>
          <TabsTrigger value="network" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <Network className="h-3.5 w-3.5" />
            Network Security
          </TabsTrigger>
          <TabsTrigger value="ransomware" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <Skull className="h-3.5 w-3.5" />
            Ransomware
          </TabsTrigger>
          <TabsTrigger value="rollback" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <RotateCcw className="h-3.5 w-3.5" />
            Rollback Engine
          </TabsTrigger>
          <TabsTrigger value="edr-timeline" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <Activity className="h-3.5 w-3.5" />
            EDR Timeline
          </TabsTrigger>
          <TabsTrigger value="persistence" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <Anchor className="h-3.5 w-3.5" />
            Persistence
          </TabsTrigger>
          <TabsTrigger value="identity" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <UserX className="h-3.5 w-3.5" />
            Identity Threats
          </TabsTrigger>
          <TabsTrigger value="forensics" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <HardDrive className="h-3.5 w-3.5" />
            Forensics
          </TabsTrigger>
          <TabsTrigger value="quarantine" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <Archive className="h-3.5 w-3.5" />
            Quarantine
          </TabsTrigger>
          <TabsTrigger value="response" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <PlayCircle className="h-3.5 w-3.5" />
            Response
          </TabsTrigger>
          <TabsTrigger value="automation" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <Settings className="h-3.5 w-3.5" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="attack-chains" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <GitBranch className="h-3.5 w-3.5" />
            Attack Chains
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <FileText className="h-3.5 w-3.5" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="testing" className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30">
            <TestTube className="h-3.5 w-3.5" />
            Agent Testing
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="overview"><ThreatDetectionPanel /></TabsContent>
          <TabsContent value="hunting"><ThreatHuntingPanel /></TabsContent>
          <TabsContent value="iocs"><IOCManagement /></TabsContent>
          <TabsContent value="yara"><YaraRulesPanel /></TabsContent>
          <TabsContent value="intel"><ThreatIntelligencePanel /></TabsContent>
          <TabsContent value="lookup"><ThreatIntelLookup /></TabsContent>
          <TabsContent value="network"><NetworkSecurityPanel /></TabsContent>
          <TabsContent value="ransomware"><RansomwareDefensePanel /></TabsContent>
          <TabsContent value="rollback"><RansomwareRollbackEngine /></TabsContent>
          <TabsContent value="edr-timeline"><EDRTimelinePanel /></TabsContent>
          <TabsContent value="persistence"><PersistenceDetectionPanel /></TabsContent>
          <TabsContent value="identity"><IdentityThreatDetection /></TabsContent>
          <TabsContent value="forensics"><ForensicsPanel /></TabsContent>
          <TabsContent value="quarantine"><QuarantineManager /></TabsContent>
          <TabsContent value="response"><ResponseActionsPanel /></TabsContent>
          <TabsContent value="automation"><AutomationPoliciesPanel /></TabsContent>
          <TabsContent value="attack-chains"><AttackChainVisualization /></TabsContent>
          <TabsContent value="reports"><ThreatReportsExport /></TabsContent>
          <TabsContent value="testing"><AgentTestingPanel /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
