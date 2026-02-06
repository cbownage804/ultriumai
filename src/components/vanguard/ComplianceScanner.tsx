import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Shield, Play, FileCheck, AlertTriangle, CheckCircle, XCircle,
  Download, RefreshCw, Clock, BarChart3, FileText, Settings,
  Server, Laptop, ChevronRight, ChevronDown, Wrench, Wifi, Network
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";
import { AgentlessScanDialog } from "./AgentlessScanDialog";
import { VanguardEmptyState } from "./VanguardEmptyState";

interface ComplianceScanJob {
  id: string;
  agent_id: string | null;
  framework_type: string;
  scan_status: string;
  started_at: string | null;
  completed_at: string | null;
  total_checks: number | null;
  passed_checks: number | null;
  failed_checks: number | null;
  warning_checks: number | null;
  compliance_score: number | null;
  created_at: string;
}

interface ComplianceCheckResult {
  id: string;
  job_id: string | null;
  check_id: string;
  check_name: string;
  check_description: string | null;
  category: string | null;
  framework_type: string;
  status: string;
  severity: string;
  actual_value: string | null;
  expected_value: string | null;
  remediation_steps: string | null;
  is_remediated: boolean | null;
}

interface ComplianceBenchmark {
  id: string;
  framework_type: string;
  check_id: string;
  check_name: string;
  category: string;
  severity: string;
  os_type: string | null;
}

const FRAMEWORKS = [
  { id: 'soc2', name: 'SOC 2', icon: BarChart3, color: 'bg-cyan-500' },
  { id: 'hipaa', name: 'HIPAA', icon: FileText, color: 'bg-red-500' },
  { id: 'pci_dss', name: 'PCI DSS', icon: FileCheck, color: 'bg-green-500' },
  { id: 'iso_27001', name: 'ISO 27001', icon: Shield, color: 'bg-indigo-500' },
  { id: 'nist_800_53', name: 'NIST 800-53', icon: Shield, color: 'bg-purple-500' },
  { id: 'gdpr', name: 'GDPR', icon: Shield, color: 'bg-blue-600' },
  { id: 'ccpa', name: 'CCPA / CPRA', icon: Shield, color: 'bg-sky-500' },
  { id: 'cmmc', name: 'CMMC 2.0', icon: Shield, color: 'bg-amber-600' },
  { id: 'fedramp', name: 'FedRAMP', icon: Shield, color: 'bg-emerald-600' },
  { id: 'glba', name: 'GLBA', icon: FileCheck, color: 'bg-teal-600' },
  { id: 'wisp', name: 'WISP', icon: FileText, color: 'bg-rose-600' },
  { id: 'cis_linux', name: 'CIS Linux Benchmark', icon: Server, color: 'bg-orange-500' },
  { id: 'cis_windows', name: 'CIS Windows Benchmark', icon: Laptop, color: 'bg-blue-500' },
];

export function ComplianceScanner() {
  const { user } = useAuth();
  const { agents } = useVanguardAgents();
  const [scanJobs, setScanJobs] = useState<ComplianceScanJob[]>([]);
  const [checkResults, setCheckResults] = useState<ComplianceCheckResult[]>([]);
  const [benchmarks, setBenchmarks] = useState<ComplianceBenchmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<ComplianceScanJob | null>(null);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAgentlessDialog, setShowAgentlessDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load scan jobs
      const { data: jobs, error: jobsError } = await (supabase as any)
        .from('compliance_scan_jobs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (jobsError) throw jobsError;
      setScanJobs((jobs || []) as ComplianceScanJob[]);

      // Load benchmarks
      const { data: benchData, error: benchError } = await (supabase as any)
        .from('compliance_benchmarks')
        .select('*')
        .eq('is_active', true)
        .order('framework_type', { ascending: true });

      if (benchError) throw benchError;
      setBenchmarks((benchData || []) as ComplianceBenchmark[]);

    } catch (err) {
      console.error('Failed to load compliance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadJobResults = async (jobId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('compliance_check_results')
        .select('*')
        .eq('job_id', jobId)
        .order('severity', { ascending: true });

      if (error) throw error;
      setCheckResults((data || []) as ComplianceCheckResult[]);
    } catch (err) {
      console.error('Failed to load check results:', err);
    }
  };

  const startComplianceScan = async () => {
    if (selectedFrameworks.length === 0) {
      toast.error("Select at least one framework");
      return;
    }
    if (!selectedAgentId) {
      toast.error("Select an agent to scan");
      return;
    }

    setIsScanning(true);
    try {
      // Call edge function to start real compliance scan
      const { data, error } = await supabase.functions.invoke('run-compliance-scan', {
        body: {
          agentId: selectedAgentId,
          frameworks: selectedFrameworks
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Started ${selectedFrameworks.length} compliance scan(s)`);
      setShowScanDialog(false);
      setSelectedFrameworks([]);
      
      // Reload data after a delay to see new jobs
      setTimeout(() => loadData(), 2000);
    } catch (err: any) {
      toast.error("Scan failed", { description: err.message });
    } finally {
      setIsScanning(false);
    }
  };

  const toggleFramework = (frameworkId: string) => {
    setSelectedFrameworks(prev => 
      prev.includes(frameworkId) 
        ? prev.filter(f => f !== frameworkId)
        : [...prev, frameworkId]
    );
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500';
      case 'high': return 'bg-orange-500/10 text-orange-500';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500';
      case 'low': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getFrameworkInfo = (type: string) => {
    return FRAMEWORKS.find(f => f.id === type) || { name: type, icon: Shield, color: 'bg-muted' };
  };

  // Group check results by category
  const resultsByCategory = checkResults.reduce((acc, result) => {
    const cat = result.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(result);
    return acc;
  }, {} as Record<string, ComplianceCheckResult[]>);

  // Calculate aggregate stats
  const totalScans = scanJobs.length;
  const avgScore = scanJobs.length > 0 
    ? Math.round(scanJobs.reduce((sum, j) => sum + (j.compliance_score || 0), 0) / scanJobs.length)
    : 0;
  const totalFailed = scanJobs.reduce((sum, j) => sum + (j.failed_checks || 0), 0);

  // Show empty state when no agents are connected
  if (!isLoading && agents.length === 0) {
    return (
      <div className="space-y-6">
        <VanguardEmptyState 
          feature="Compliance Scanner" 
          description="Compliance scanning requires Vanguard agents to assess your infrastructure against CIS, NIST, PCI DSS, HIPAA, and SOC 2 frameworks."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Compliance Scanner
          </h2>
          <p className="text-muted-foreground">Compliance scanning against industry frameworks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAgentlessDialog(true)}>
            <Wifi className="h-4 w-4 mr-2" />
            Agentless Scan
          </Button>
          <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
            <DialogTrigger asChild>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Agent Scan
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Start Compliance Scan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Agent</label>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agent to scan" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.agent_version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Select Frameworks</label>
                <div className="grid grid-cols-2 gap-3">
                  {FRAMEWORKS.map(framework => {
                    const Icon = framework.icon;
                    const isSelected = selectedFrameworks.includes(framework.id);
                    const benchCount = benchmarks.filter(b => b.framework_type === framework.id).length;
                    
                    return (
                      <div
                        key={framework.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() => toggleFramework(framework.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={isSelected} />
                          <div className={`p-1.5 rounded ${framework.color}`}>
                            <Icon className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{framework.name}</p>
                            <p className="text-xs text-muted-foreground">{benchCount} checks</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowScanDialog(false)}>Cancel</Button>
                <Button onClick={startComplianceScan} disabled={isScanning}>
                  {isScanning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Scan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Agentless Scan Dialog */}
      <AgentlessScanDialog 
        open={showAgentlessDialog} 
        onOpenChange={setShowAgentlessDialog}
        onScanStarted={loadData}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Scans</p>
                <p className="text-2xl font-bold">{totalScans}</p>
              </div>
              <FileCheck className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Compliance</p>
                <p className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed Checks</p>
                <p className="text-2xl font-bold text-red-500">{totalFailed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Frameworks</p>
                <p className="text-2xl font-bold">{FRAMEWORKS.length}</p>
              </div>
              <Shield className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan History */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Scan History</CardTitle>
            <CardDescription>Recent compliance scan results</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {scanJobs.length === 0 ? (
                <div className="p-8 text-center">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No scans yet. Start a new scan to check compliance.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scanJobs.map(job => {
                    const framework = getFrameworkInfo(job.framework_type);
                    const Icon = framework.icon;
                    const agent = agents.find(a => a.id === job.agent_id);
                    
                    return (
                      <div
                        key={job.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedJob?.id === job.id ? 'border-primary bg-muted/50' : 'hover:bg-muted/30'
                        }`}
                        onClick={() => {
                          setSelectedJob(job);
                          loadJobResults(job.id);
                        }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded ${framework.color}`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{framework.name}</p>
                            <p className="text-xs text-muted-foreground">{agent?.name || 'Unknown Agent'}</p>
                          </div>
                          <Badge className={getSeverityColor(job.scan_status === 'completed' ? 'low' : 'medium')}>
                            {job.scan_status}
                          </Badge>
                        </div>
                        
                        {job.scan_status === 'completed' && (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-lg font-bold ${getScoreColor(job.compliance_score || 0)}`}>
                                {job.compliance_score}%
                              </span>
                              <div className="flex gap-3 text-xs">
                                <span className="text-green-500">✓ {job.passed_checks}</span>
                                <span className="text-red-500">✗ {job.failed_checks}</span>
                                <span className="text-yellow-500">⚠ {job.warning_checks}</span>
                              </div>
                            </div>
                            <Progress value={job.compliance_score || 0} className="h-2" />
                          </>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Check Results Detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedJob 
                ? `${getFrameworkInfo(selectedJob.framework_type).name} Results`
                : 'Compliance Check Results'
              }
            </CardTitle>
            <CardDescription>
              {selectedJob 
                ? `${checkResults.length} checks performed`
                : 'Select a scan to view detailed results'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedJob ? (
              <div className="p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Select a scan from the history to view detailed check results</p>
              </div>
            ) : checkResults.length === 0 ? (
              <div className="p-8 text-center">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
                <p className="text-muted-foreground">Loading results...</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {Object.entries(resultsByCategory).map(([category, results]) => {
                    const passCount = results.filter(r => r.status === 'pass').length;
                    const failCount = results.filter(r => r.status === 'fail').length;
                    const isExpanded = expandedCategories.has(category);
                    
                    return (
                      <div key={category} className="border rounded-lg">
                        <div 
                          className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleCategory(category)}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span className="font-medium">{category}</span>
                            <Badge variant="outline">{results.length} checks</Badge>
                          </div>
                          <div className="flex gap-2 text-sm">
                            <span className="text-green-500">{passCount} passed</span>
                            <span className="text-red-500">{failCount} failed</span>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="border-t">
                            {results.map(result => (
                              <div key={result.id} className="p-3 border-b last:border-0 hover:bg-muted/30">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    {getStatusIcon(result.status)}
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{result.check_id}</span>
                                        <Badge className={getSeverityColor(result.severity)} variant="outline">
                                          {result.severity}
                                        </Badge>
                                      </div>
                                      <p className="text-sm">{result.check_name}</p>
                                      {result.check_description && (
                                        <p className="text-xs text-muted-foreground mt-1">{result.check_description}</p>
                                      )}
                                      {result.status === 'fail' && result.remediation_steps && (
                                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                            <Wrench className="h-3 w-3" />
                                            Remediation:
                                          </div>
                                          {result.remediation_steps}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {result.status === 'fail' && (
                                    <Button size="sm" variant="outline">
                                      <Wrench className="h-3 w-3 mr-1" />
                                      Fix
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Framework Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Framework Compliance Overview</CardTitle>
          <CardDescription>Latest compliance scores by framework</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {FRAMEWORKS.map(framework => {
              const Icon = framework.icon;
              const latestJob = scanJobs.find(j => j.framework_type === framework.id);
              const score = latestJob?.compliance_score || 0;
              const hasScans = !!latestJob;
              
              return (
                <div key={framework.id} className="p-4 border rounded-lg text-center">
                  <div className={`p-3 rounded-full ${framework.color} w-12 h-12 mx-auto mb-3 flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-medium text-sm mb-1">{framework.name}</p>
                  {hasScans ? (
                    <>
                      <p className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</p>
                      <Progress value={score} className="h-1 mt-2" />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No scans</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
