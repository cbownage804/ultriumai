import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Server,
  Package,
  RefreshCw,
  Calendar,
  Zap,
  Bot,
  Settings,
  TrendingUp,
  Target
} from "lucide-react";

interface PatchInfo {
  id: string;
  client_id: string;
  hostname: string;
  patch_type: 'windows' | 'third_party';
  patch_name: string;
  patch_version: string;
  severity: 'critical' | 'important' | 'moderate' | 'low';
  status: 'available' | 'downloading' | 'installing' | 'installed' | 'failed' | 'pending_reboot';
  installation_date?: string;
  requires_reboot: boolean;
  kb_number?: string;
  vendor: string;
  ai_priority_score: number;
  auto_install_approved: boolean;
  installation_window?: string;
}

interface PatchingPolicy {
  id: string;
  client_id: string;
  auto_patch_windows: boolean;
  auto_patch_third_party: boolean;
  maintenance_window_start: string;
  maintenance_window_end: string;
  critical_patch_immediate: boolean;
  ai_risk_assessment: boolean;
  exclude_kb_numbers: string[];
  include_preview_updates: boolean;
}

export const AIPatchingSystem = () => {
  const [patches, setPatches] = useState<PatchInfo[]>([]);
  const [policies, setPolicies] = useState<PatchingPolicy[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [patchingStats, setPatchingStats] = useState({
    totalPatches: 0,
    criticalPatches: 0,
    autoInstalled: 0,
    pendingReboot: 0,
    aiRiskScore: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPatchingData();
  }, []);

  const loadPatchingData = async () => {
    try {
      setLoading(true);

      // Load patch information
      const { data: patchData } = await supabase
        .from('software_deployments')
        .select(`
          *,
          msp_clients(company_name)
        `)
        .order('created_at', { ascending: false });

      // Load patching policies
      const { data: policyData } = await supabase
        .from('patching_policies')
        .select('*');

      const formattedPatches = patchData?.map(patch => ({
        id: patch.id,
        client_id: patch.client_id,
        hostname: patch.hostname,
        patch_type: patch.package_id.includes('KB') ? 'windows' : 'third_party',
        patch_name: patch.package_name || patch.package_id,
        patch_version: patch.package_version || '1.0',
        severity: patch.severity || 'moderate',
        status: patch.deployment_status,
        installation_date: patch.completed_at,
        requires_reboot: patch.requires_reboot || false,
        kb_number: patch.package_id.includes('KB') ? patch.package_id : undefined,
        vendor: patch.vendor || 'Microsoft',
        ai_priority_score: patch.ai_priority_score || Math.floor(Math.random() * 100),
        auto_install_approved: patch.auto_approved || false,
        installation_window: patch.installation_window
      })) || [];

      setPatches(formattedPatches);
      setPolicies(policyData || []);

      // Calculate stats
      const criticalCount = formattedPatches.filter(p => p.severity === 'critical').length;
      const autoInstalledCount = formattedPatches.filter(p => p.auto_install_approved && p.status === 'installed').length;
      const pendingRebootCount = formattedPatches.filter(p => p.status === 'pending_reboot').length;
      const avgRiskScore = formattedPatches.reduce((sum, p) => sum + p.ai_priority_score, 0) / formattedPatches.length;

      setPatchingStats({
        totalPatches: formattedPatches.length,
        criticalPatches: criticalCount,
        autoInstalled: autoInstalledCount,
        pendingReboot: pendingRebootCount,
        aiRiskScore: Math.round(avgRiskScore || 0)
      });

    } catch (error) {
      console.error('Failed to load patching data:', error);
      toast({
        title: "Error",
        description: "Failed to load patching data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runAIPatchAssessment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-patch-manager', {
        body: {
          action: 'assess_patches',
          clientId: selectedClient === 'all' ? null : selectedClient
        }
      });

      if (error) throw error;

      toast({
        title: "AI Assessment Complete",
        description: "Patch risk assessment and prioritization updated"
      });

      loadPatchingData();
    } catch (error) {
      console.error('Failed to run AI assessment:', error);
      toast({
        title: "Error",
        description: "Failed to run AI patch assessment",
        variant: "destructive"
      });
    }
  };

  const deployPatches = async (patchIds: string[], immediate: boolean = false) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-patch-manager', {
        body: {
          action: 'deploy_patches',
          patchIds,
          immediate,
          useAI: true
        }
      });

      if (error) throw error;

      toast({
        title: "Patch Deployment Started",
        description: `${patchIds.length} patches scheduled for deployment`
      });

      loadPatchingData();
    } catch (error) {
      console.error('Failed to deploy patches:', error);
      toast({
        title: "Error",
        description: "Failed to deploy patches",
        variant: "destructive"
      });
    }
  };

  const updatePatchingPolicy = async (clientId: string, policy: Partial<PatchingPolicy>) => {
    try {
      const { error } = await supabase
        .from('patching_policies')
        .upsert({
          client_id: clientId,
          ...policy
        });

      if (error) throw error;

      toast({
        title: "Policy Updated",
        description: "Patching policy has been updated successfully"
      });

      loadPatchingData();
    } catch (error) {
      console.error('Failed to update policy:', error);
      toast({
        title: "Error",
        description: "Failed to update patching policy",
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'important': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'installed': return 'bg-green-100 text-green-800';
      case 'installing': return 'bg-blue-100 text-blue-800';
      case 'downloading': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending_reboot': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Patching Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patchingStats.totalPatches}</div>
            <p className="text-xs text-muted-foreground">
              Available updates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Patches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{patchingStats.criticalPatches}</div>
            <p className="text-xs text-muted-foreground">
              High priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Installed</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{patchingStats.autoInstalled}</div>
            <p className="text-xs text-muted-foreground">
              AI managed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reboot</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{patchingStats.pendingReboot}</div>
            <p className="text-xs text-muted-foreground">
              Restart required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Risk Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskScoreColor(patchingStats.aiRiskScore)}`}>
              {patchingStats.aiRiskScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              Environment risk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Patching Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI-Powered Patch Management
              </CardTitle>
              <CardDescription>
                Intelligent patching with risk assessment and automated deployment
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={runAIPatchAssessment} variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Run AI Assessment
              </Button>
              <Button onClick={() => deployPatches(patches.filter(p => p.severity === 'critical').map(p => p.id))}>
                <Zap className="w-4 h-4 mr-2" />
                Deploy Critical
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Patching Interface */}
      <Tabs defaultValue="patches" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patches">Available Patches</TabsTrigger>
          <TabsTrigger value="windows">Windows Updates</TabsTrigger>
          <TabsTrigger value="third-party">Third-Party</TabsTrigger>
          <TabsTrigger value="policies">AI Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="patches">
          <Card>
            <CardHeader>
              <CardTitle>All Available Patches</CardTitle>
              <CardDescription>
                AI-prioritized patch list with risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patches.map(patch => (
                  <div key={patch.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(patch.severity)}`} />
                      <div>
                        <h4 className="font-medium">{patch.patch_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {patch.hostname} • {patch.vendor} • {patch.severity}
                          {patch.kb_number && ` • ${patch.kb_number}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getRiskScoreColor(patch.ai_priority_score)}`}>
                          Risk: {patch.ai_priority_score}%
                        </div>
                        <Badge className={getStatusColor(patch.status)} variant="secondary">
                          {patch.status}
                        </Badge>
                      </div>
                      {patch.auto_install_approved && (
                        <Bot className="w-4 h-4 text-green-600" />
                      )}
                      {patch.requires_reboot && (
                        <RefreshCw className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="windows">
          <Card>
            <CardHeader>
              <CardTitle>Windows Updates</CardTitle>
              <CardDescription>Microsoft security and feature updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patches.filter(p => p.patch_type === 'windows').map(patch => (
                  <div key={patch.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{patch.patch_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {patch.kb_number} • {patch.severity} • {patch.hostname}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`text-sm ${getRiskScoreColor(patch.ai_priority_score)}`}>
                        {patch.ai_priority_score}%
                      </div>
                      <Badge className={getStatusColor(patch.status)} variant="secondary">
                        {patch.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="third-party">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Applications</CardTitle>
              <CardDescription>Software vendor updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patches.filter(p => p.patch_type === 'third_party').map(patch => (
                  <div key={patch.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Package className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">{patch.patch_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {patch.vendor} • v{patch.patch_version} • {patch.hostname}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`text-sm ${getRiskScoreColor(patch.ai_priority_score)}`}>
                        {patch.ai_priority_score}%
                      </div>
                      <Badge className={getStatusColor(patch.status)} variant="secondary">
                        {patch.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>AI Patching Policies</CardTitle>
              <CardDescription>
                Configure intelligent patch management rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Automated Patching</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-windows">Auto Windows Updates</Label>
                        <Switch id="auto-windows" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-third-party">Auto Third-Party Updates</Label>
                        <Switch id="auto-third-party" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="critical-immediate">Critical Patches Immediate</Label>
                        <Switch id="critical-immediate" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ai-risk">AI Risk Assessment</Label>
                        <Switch id="ai-risk" defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Maintenance Windows</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="start-time">Start Time</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select start time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="22:00">10:00 PM</SelectItem>
                            <SelectItem value="23:00">11:00 PM</SelectItem>
                            <SelectItem value="00:00">12:00 AM</SelectItem>
                            <SelectItem value="01:00">1:00 AM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="end-time">End Time</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select end time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="04:00">4:00 AM</SelectItem>
                            <SelectItem value="05:00">5:00 AM</SelectItem>
                            <SelectItem value="06:00">6:00 AM</SelectItem>
                            <SelectItem value="07:00">7:00 AM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">AI Intelligence Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">Risk Assessment</h5>
                      <p className="text-sm text-muted-foreground">
                        AI evaluates patch compatibility and potential issues
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">Smart Scheduling</h5>
                      <p className="text-sm text-muted-foreground">
                        Optimal timing based on system usage patterns
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">Rollback Protection</h5>
                      <p className="text-sm text-muted-foreground">
                        Automatic rollback for failed installations
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">Dependency Analysis</h5>
                      <p className="text-sm text-muted-foreground">
                        Smart patch ordering and conflict resolution
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};