import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Calendar, Search, Wrench, Sparkles, Loader2, 
  Send, CheckCircle2, AlertTriangle, TrendingUp, Clock,
  Cpu, HardDrive, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function CortexAIToolsAdvanced() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'workload' | 'maintenance' | 'knowledge' | 'scheduler'>('workload');
  const [isProcessing, setIsProcessing] = useState(false);

  // Workload Optimizer State
  const [techniciansJson, setTechniciansJson] = useState('');
  const [ticketsJson, setTicketsJson] = useState('');
  const [workloadResult, setWorkloadResult] = useState<any>(null);

  // Predictive Maintenance State
  const [devicesJson, setDevicesJson] = useState('');
  const [maintenanceResult, setMaintenanceResult] = useState<any>(null);

  // Knowledge Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [kbArticlesJson, setKbArticlesJson] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);

  // Smart Scheduler State
  const [tasksJson, setTasksJson] = useState('');
  const [schedulerTechsJson, setSchedulerTechsJson] = useState('');
  const [scheduleResult, setScheduleResult] = useState<any>(null);

  const handleWorkloadOptimize = async () => {
    let technicians, openTickets;
    try {
      technicians = JSON.parse(techniciansJson);
      openTickets = JSON.parse(ticketsJson);
    } catch {
      toast.error('Please enter valid JSON');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-workload-optimizer', {
        body: { technicians, openTickets, userId: user?.id }
      });

      if (error) throw error;
      setWorkloadResult(data);
      toast.success('Workload optimization complete!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to optimize');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePredictiveMaintenance = async () => {
    let devices;
    try {
      devices = JSON.parse(devicesJson);
    } catch {
      toast.error('Please enter valid JSON devices');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-predictive-maintenance', {
        body: { devices, userId: user?.id }
      });

      if (error) throw error;
      setMaintenanceResult(data);
      toast.success('Maintenance analysis complete!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKnowledgeSearch = async () => {
    if (!searchQuery) {
      toast.error('Please enter a search query');
      return;
    }

    setIsProcessing(true);
    try {
      let kbArticles = [];
      if (kbArticlesJson) {
        try { kbArticles = JSON.parse(kbArticlesJson); } catch {}
      }

      const { data, error } = await supabase.functions.invoke('ai-knowledge-search', {
        body: { query: searchQuery, kbArticles, userId: user?.id }
      });

      if (error) throw error;
      setSearchResult(data);
      toast.success('Search complete!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to search');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSmartSchedule = async () => {
    let tasks, technicians;
    try {
      tasks = JSON.parse(tasksJson);
      technicians = JSON.parse(schedulerTechsJson);
    } catch {
      toast.error('Please enter valid JSON');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-smart-scheduler', {
        body: { tasks, technicians, userId: user?.id }
      });

      if (error) throw error;
      setScheduleResult(data);
      toast.success('Schedule optimized!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-green-500/20 text-green-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === 'workload' ? 'default' : 'outline'}
          onClick={() => setActiveTab('workload')}
          className={activeTab === 'workload' ? 'bg-blue-500' : ''}
        >
          <Users className="h-4 w-4 mr-2" />
          Workload Optimizer
        </Button>
        <Button
          variant={activeTab === 'maintenance' ? 'default' : 'outline'}
          onClick={() => setActiveTab('maintenance')}
          className={activeTab === 'maintenance' ? 'bg-orange-500' : ''}
        >
          <Wrench className="h-4 w-4 mr-2" />
          Predictive Maintenance
        </Button>
        <Button
          variant={activeTab === 'knowledge' ? 'default' : 'outline'}
          onClick={() => setActiveTab('knowledge')}
          className={activeTab === 'knowledge' ? 'bg-purple-500' : ''}
        >
          <Search className="h-4 w-4 mr-2" />
          Knowledge Search
        </Button>
        <Button
          variant={activeTab === 'scheduler' ? 'default' : 'outline'}
          onClick={() => setActiveTab('scheduler')}
          className={activeTab === 'scheduler' ? 'bg-emerald-500' : ''}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Smart Scheduler
        </Button>
      </div>

      {/* Workload Optimizer Tab */}
      {activeTab === 'workload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/60 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                AI Workload Optimizer
              </CardTitle>
              <CardDescription>Balance ticket assignments across technicians</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Technicians (JSON)</Label>
                <Textarea 
                  value={techniciansJson}
                  onChange={(e) => setTechniciansJson(e.target.value)}
                  placeholder='[{"id": "1", "name": "John", "skills": ["networking", "servers"], "currentLoad": 5}]'
                  className="bg-slate-900/50 border-slate-700 min-h-[100px] font-mono text-sm"
                />
              </div>
              <div>
                <Label>Open Tickets (JSON)</Label>
                <Textarea 
                  value={ticketsJson}
                  onChange={(e) => setTicketsJson(e.target.value)}
                  placeholder='[{"id": "TKT-001", "title": "Server issue", "priority": "high", "requiredSkills": ["servers"]}]'
                  className="bg-slate-900/50 border-slate-700 min-h-[100px] font-mono text-sm"
                />
              </div>
              <Button 
                onClick={handleWorkloadOptimize} 
                disabled={isProcessing}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                Optimize Workload
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-white">Optimization Results</CardTitle>
            </CardHeader>
            <CardContent>
              {workloadResult?.recommendations ? (
                <ScrollArea className="h-[350px]">
                  <div className="space-y-4">
                    {workloadResult.summary && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded bg-slate-800/50 text-center">
                          <div className="text-2xl font-bold text-white">{workloadResult.summary.totalOpenTickets}</div>
                          <div className="text-xs text-slate-400">Open Tickets</div>
                        </div>
                        <div className="p-3 rounded bg-blue-500/10 text-center">
                          <div className="text-2xl font-bold text-blue-400">{workloadResult.summary.optimalDistributionScore}%</div>
                          <div className="text-xs text-slate-400">Distribution Score</div>
                        </div>
                      </div>
                    )}
                    {workloadResult.recommendations.map((rec: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{rec.ticketId}</span>
                          <Badge className="bg-blue-500/20 text-blue-400">{rec.confidenceScore}%</Badge>
                        </div>
                        <p className="text-sm text-slate-300">Assign to: <span className="text-blue-400 font-medium">{rec.suggestedTechnician}</span></p>
                        <p className="text-xs text-slate-400 mt-1">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Enter data to optimize workload</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Predictive Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/60 border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-400" />
                AI Predictive Maintenance
              </CardTitle>
              <CardDescription>Predict device failures before they happen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Devices (JSON)</Label>
                <Textarea 
                  value={devicesJson}
                  onChange={(e) => setDevicesJson(e.target.value)}
                  placeholder='[{"id": "1", "name": "Server-01", "type": "server", "cpuUsage": 85, "memoryUsage": 90, "diskHealth": 70, "age": 3}]'
                  className="bg-slate-900/50 border-slate-700 min-h-[200px] font-mono text-sm"
                />
              </div>
              <Button 
                onClick={handlePredictiveMaintenance} 
                disabled={isProcessing}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Cpu className="h-4 w-4 mr-2" />}
                Analyze Fleet
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-white">Maintenance Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceResult?.predictions || maintenanceResult?.prediction ? (
                <ScrollArea className="h-[350px]">
                  <div className="space-y-4">
                    {maintenanceResult.fleetHealth && (
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded bg-green-500/10">
                          <div className="text-lg font-bold text-green-400">{maintenanceResult.fleetHealth.healthyDevices}</div>
                          <div className="text-xs text-slate-400">Healthy</div>
                        </div>
                        <div className="p-2 rounded bg-amber-500/10">
                          <div className="text-lg font-bold text-amber-400">{maintenanceResult.fleetHealth.atRiskDevices}</div>
                          <div className="text-xs text-slate-400">At Risk</div>
                        </div>
                        <div className="p-2 rounded bg-red-500/10">
                          <div className="text-lg font-bold text-red-400">{maintenanceResult.fleetHealth.criticalDevices}</div>
                          <div className="text-xs text-slate-400">Critical</div>
                        </div>
                        <div className="p-2 rounded bg-slate-800/50">
                          <div className="text-lg font-bold text-white">{maintenanceResult.fleetHealth.averageHealthScore}%</div>
                          <div className="text-xs text-slate-400">Health</div>
                        </div>
                      </div>
                    )}
                    {(maintenanceResult.predictions || [maintenanceResult.prediction]).filter(Boolean).map((p: any, i: number) => (
                      <div key={i} className={`p-3 rounded-lg border-l-2 ${
                        p.riskLevel === 'critical' || p.riskLevel === 'high' ? 'bg-red-500/10 border-red-500' :
                        p.riskLevel === 'medium' ? 'bg-amber-500/10 border-amber-500' :
                        'bg-green-500/10 border-green-500'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{p.deviceName || 'Device'}</span>
                          <Badge className={getRiskBadge(p.riskLevel)}>{p.failureProbability || p.riskScore}%</Badge>
                        </div>
                        <p className="text-sm text-slate-300">{p.predictedIssue || 'Maintenance needed'}</p>
                        {p.predictedTimeframe && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {p.predictedTimeframe}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <HardDrive className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Submit devices to predict maintenance</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Knowledge Search Tab */}
      {activeTab === 'knowledge' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/60 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-400" />
                AI Knowledge Search
              </CardTitle>
              <CardDescription>Search KB articles, tickets, and runbooks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Search Query</Label>
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="How do I reset a user's MFA in Azure AD?"
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>
              <div>
                <Label>KB Articles (optional JSON)</Label>
                <Textarea 
                  value={kbArticlesJson}
                  onChange={(e) => setKbArticlesJson(e.target.value)}
                  placeholder='[{"id": "KB-001", "title": "Azure MFA Reset Guide", "content": "..."}]'
                  className="bg-slate-900/50 border-slate-700 min-h-[120px] font-mono text-sm"
                />
              </div>
              <Button 
                onClick={handleKnowledgeSearch} 
                disabled={isProcessing}
                className="w-full bg-purple-500 hover:bg-purple-600"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Search Knowledge
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              {searchResult?.answer ? (
                <ScrollArea className="h-[350px]">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500/20 text-purple-400">{searchResult.confidence}% confidence</Badge>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <p className="text-slate-200 whitespace-pre-wrap">{searchResult.answer}</p>
                    </div>
                    {searchResult.stepByStepSolution?.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-purple-400">Step-by-Step Solution</Label>
                        {searchResult.stepByStepSolution.map((step: any, i: number) => (
                          <div key={i} className="flex gap-3 p-2 rounded bg-slate-800/30">
                            <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400 font-bold">
                              {step.step}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-200">{step.instruction}</p>
                              {step.notes && <p className="text-xs text-slate-400 mt-1">{step.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResult.sources?.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-slate-400 text-xs">Sources</Label>
                        {searchResult.sources.map((s: any, i: number) => (
                          <Badge key={i} variant="outline" className="mr-1">{s.type}: {s.title}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Enter a query to search knowledge base</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Smart Scheduler Tab */}
      {activeTab === 'scheduler' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/60 border-emerald-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-400" />
                AI Smart Scheduler
              </CardTitle>
              <CardDescription>Optimize task and appointment scheduling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tasks to Schedule (JSON)</Label>
                <Textarea 
                  value={tasksJson}
                  onChange={(e) => setTasksJson(e.target.value)}
                  placeholder='[{"id": "1", "title": "Server maintenance", "duration": 2, "priority": "high", "deadline": "2025-02-01"}]'
                  className="bg-slate-900/50 border-slate-700 min-h-[100px] font-mono text-sm"
                />
              </div>
              <div>
                <Label>Technicians (JSON)</Label>
                <Textarea 
                  value={schedulerTechsJson}
                  onChange={(e) => setSchedulerTechsJson(e.target.value)}
                  placeholder='[{"id": "1", "name": "John", "availability": ["Mon 9-5", "Tue 9-5"]}]'
                  className="bg-slate-900/50 border-slate-700 min-h-[100px] font-mono text-sm"
                />
              </div>
              <Button 
                onClick={handleSmartSchedule} 
                disabled={isProcessing}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
                Generate Schedule
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-emerald-500/30">
            <CardHeader>
              <CardTitle className="text-white">Optimized Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {scheduleResult?.schedule ? (
                <ScrollArea className="h-[350px]">
                  <div className="space-y-4">
                    {scheduleResult.optimization && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded bg-emerald-500/10 text-center">
                          <div className="text-xl font-bold text-emerald-400">{scheduleResult.optimization.slaCompliance}%</div>
                          <div className="text-xs text-slate-400">SLA Compliance</div>
                        </div>
                        <div className="p-3 rounded bg-slate-800/50 text-center">
                          <div className="text-xl font-bold text-white">{scheduleResult.optimization.scheduleUtilization}%</div>
                          <div className="text-xs text-slate-400">Utilization</div>
                        </div>
                      </div>
                    )}
                    {scheduleResult.schedule.map((item: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{item.taskTitle}</span>
                          <Badge variant="outline" className={
                            item.priority === 'critical' ? 'border-red-500 text-red-400' :
                            item.priority === 'high' ? 'border-orange-500 text-orange-400' :
                            'border-slate-500'
                          }>{item.priority}</Badge>
                        </div>
                        <div className="text-sm text-slate-300">
                          <p>Assigned: <span className="text-emerald-400">{item.assignedTo}</span></p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(item.scheduledStart).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Enter tasks to generate schedule</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
