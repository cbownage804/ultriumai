import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Play, Settings, CheckCircle, Clock, Code2, History, Library, Calendar, Activity, Users } from "lucide-react";
import { ScriptEditor } from "./ScriptEditor";
import { AgentSelector } from "./AgentSelector";
import { ExecutionMonitor } from "./ExecutionMonitor";
import { ScriptLibrary } from "./ScriptLibrary";
import { ExecutionHistory } from "./ExecutionHistory";
import { ScheduleManager } from "./ScheduleManager";

interface AutomationScript {
  name: string;
  status: string;
  lastRun: string;
  success: number;
  nextRun: string;
}

interface Agent {
  id: string;
  hostname: string;
  ip: string;
  status: 'online' | 'offline' | 'updating';
  type: 'server' | 'workstation';
  os: string;
  client: string;
  department?: string;
  lastSeen: string;
}

interface ExecutionStatus {
  id: string;
  scriptName: string;
  agentHostname: string;
  agentId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'timeout';
  startedAt: string;
  completedAt?: string;
  executionTime?: number;
  output?: string;
  errorMessage?: string;
  exitCode?: number;
  progress?: number;
}

interface ExecutionHistoryRecord {
  id: string;
  scriptName: string;
  scriptId: string;
  agentHostname: string;
  agentId: string;
  clientName: string;
  executedBy: string;
  status: 'completed' | 'failed' | 'timeout' | 'cancelled';
  startedAt: string;
  completedAt: string;
  executionTime: number;
  exitCode?: number;
  output?: string;
  errorMessage?: string;
  parameters?: Record<string, any>;
  tags: string[];
}

interface ScheduleRule {
  id: string;
  name: string;
  scriptId: string;
  scriptName: string;
  agentIds: string[];
  agentNames: string[];
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  customCron?: string;
  startDate: string;
  startTime: string;
  endDate?: string;
  timezone: string;
  isActive: boolean;
  lastRun?: string;
  nextRun: string;
  maxRetries: number;
  retryDelay: number;
  runOnFailure: boolean;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  parameters?: Record<string, any>;
  weekdays?: number[];
  monthlyDay?: number;
  conditions?: {
    onlyIfOnline: boolean;
    skipIfRecentRun: boolean;
    recentRunHours: number;
    maxConcurrentRuns: number;
  };
}

interface AutomationManagerProps {
  scripts: AutomationScript[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running': return <Play className="h-4 w-4 text-blue-500" />;
    case 'scheduled': return <Clock className="h-4 w-4 text-purple-500" />;
    case 'idle': return <CheckCircle className="h-4 w-4 text-gray-500" />;
    default: return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

export const AutomationManager = ({ scripts }: AutomationManagerProps) => {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  
  // Mock data - replace with real API calls
  const mockAgents: Agent[] = [
    { id: '1', hostname: 'DC-PRIMARY', ip: '192.168.1.10', status: 'online', type: 'server', os: 'Windows Server 2022', client: 'Acme Corp', lastSeen: '2 min ago' },
    { id: '2', hostname: 'EXCHANGE-01', ip: '192.168.1.15', status: 'online', type: 'server', os: 'Windows Server 2019', client: 'Acme Corp', lastSeen: '1 min ago' },
    { id: '3', hostname: 'SALES-PC-01', ip: '192.168.2.15', status: 'online', type: 'workstation', os: 'Windows 11 Pro', client: 'Acme Corp', department: 'Sales', lastSeen: '5 min ago' },
    { id: '4', hostname: 'IT-ADMIN-PC', ip: '192.168.2.10', status: 'offline', type: 'workstation', os: 'Windows 11 Pro', client: 'TechCorp', department: 'IT', lastSeen: '2 hours ago' }
  ];

  const mockExecutions: ExecutionStatus[] = [
    { id: '1', scriptName: 'System Health Check', agentHostname: 'DC-PRIMARY', agentId: '1', status: 'executing', startedAt: '2 min ago', progress: 65 },
    { id: '2', scriptName: 'Disk Cleanup', agentHostname: 'SALES-PC-01', agentId: '3', status: 'completed', startedAt: '10 min ago', completedAt: '8 min ago', executionTime: 120, output: 'Cleaned 2.3 GB of temporary files' },
  ];

  const mockHistory: ExecutionHistoryRecord[] = [
    {
      id: '1',
      scriptName: 'Security Patch Installer',
      scriptId: 'script-1',
      agentHostname: 'DC-PRIMARY',
      agentId: '1',
      clientName: 'Acme Corp',
      executedBy: 'admin@acme.com',
      status: 'completed',
      startedAt: '2024-01-15 14:30:00',
      completedAt: '2024-01-15 14:45:00',
      executionTime: 900,
      exitCode: 0,
      output: 'Successfully installed 5 security patches',
      tags: ['security', 'patches']
    }
  ];

  const mockSchedules: ScheduleRule[] = [
    {
      id: '1',
      name: 'Daily System Health Check',
      scriptId: 'script-health',
      scriptName: 'System Health Check',
      agentIds: ['1', '2'],
      agentNames: ['DC-PRIMARY', 'EXCHANGE-01'],
      frequency: 'daily',
      startDate: '2024-01-01',
      startTime: '09:00',
      timezone: 'America/New_York',
      isActive: true,
      nextRun: 'Tomorrow 9:00 AM',
      maxRetries: 3,
      retryDelay: 5,
      runOnFailure: false,
      notifyOnSuccess: false,
      notifyOnFailure: true
    }
  ];

  const mockAvailableScripts = [
    { id: 'script-1', name: 'System Health Check' },
    { id: 'script-2', name: 'Security Patch Installer' },
    { id: 'script-3', name: 'Disk Cleanup' }
  ];

  // Handlers
  const handleExecuteScript = (agentIds: string[], scriptId: string) => {
    console.log('Executing script', scriptId, 'on agents', agentIds);
    // Implementation would call the RMM command API
  };

  const handleImportScript = (script: any) => {
    console.log('Importing script', script.name);
    // Implementation would save script to user's library
  };

  const handleRefreshExecutions = () => {
    console.log('Refreshing execution status');
    // Implementation would fetch latest execution status
  };

  const handleCancelExecution = (executionId: string) => {
    console.log('Cancelling execution', executionId);
    // Implementation would cancel the execution
  };

  const handleExportHistory = () => {
    console.log('Exporting execution history');
    // Implementation would export history to CSV/JSON
  };

  const handleRetryExecution = (record: ExecutionHistoryRecord) => {
    console.log('Retrying execution', record.id);
    // Implementation would retry the failed execution
  };

  const handleSaveSchedule = (schedule: ScheduleRule) => {
    console.log('Saving schedule', schedule);
    // Implementation would save the schedule
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    console.log('Deleting schedule', scheduleId);
    // Implementation would delete the schedule
  };

  const handleToggleSchedule = (scheduleId: string, isActive: boolean) => {
    console.log('Toggling schedule', scheduleId, isActive);
    // Implementation would toggle schedule active state
  };

  const handleRunScheduleNow = (scheduleId: string) => {
    console.log('Running schedule now', scheduleId);
    // Implementation would execute schedule immediately
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">RMM Automation Hub</h3>
          <p className="text-sm text-muted-foreground">Complete script automation, scheduling, and monitoring platform</p>
        </div>
        <div className="flex gap-2">
          <ScriptEditor />
          <AgentSelector
            agents={mockAgents}
            selectedAgents={selectedAgents}
            onSelectionChange={setSelectedAgents}
            onExecute={handleExecuteScript}
            trigger={
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Select Agents ({selectedAgents.length})
              </Button>
            }
          />
        </div>
      </div>

      <Tabs defaultValue="monitor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50">
          <TabsTrigger value="monitor" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Activity className="h-4 w-4 mr-2" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="library" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Library className="h-4 w-4 mr-2" />
            Script Library
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Calendar className="h-4 w-4 mr-2" />
            Scheduling
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Zap className="h-4 w-4 mr-2" />
            Active Scripts
          </TabsTrigger>
        </TabsList>

        {/* Real-time Execution Monitor */}
        <TabsContent value="monitor" className="space-y-6">
          <ExecutionMonitor
            executions={mockExecutions}
            onRefresh={handleRefreshExecutions}
            onCancel={handleCancelExecution}
          />
        </TabsContent>

        {/* Pre-built Script Library */}
        <TabsContent value="library" className="space-y-6">
          <ScriptLibrary
            onImportScript={handleImportScript}
            onExecuteScript={(script) => {
              // Open agent selector with the script
              console.log('Execute script from library', script.name);
            }}
          />
        </TabsContent>

        {/* Advanced Scheduling */}
        <TabsContent value="schedule" className="space-y-6">
          <ScheduleManager
            schedules={mockSchedules}
            availableScripts={mockAvailableScripts}
            availableAgents={mockAgents}
            onSaveSchedule={handleSaveSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onToggleSchedule={handleToggleSchedule}
            onRunNow={handleRunScheduleNow}
          />
        </TabsContent>

        {/* Execution History */}
        <TabsContent value="history" className="space-y-6">
          <ExecutionHistory
            records={mockHistory}
            onExportHistory={handleExportHistory}
            onRetryExecution={handleRetryExecution}
          />
        </TabsContent>

        {/* Legacy Active Scripts View */}
        <TabsContent value="active" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Active Scripts & Automation
              </CardTitle>
              <CardDescription>Currently running automated tasks and their execution status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scripts.map((script) => (
                  <div key={script.name} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(script.status)}
                        <div>
                          <h4 className="font-medium">{script.name}</h4>
                          <p className="text-sm text-muted-foreground">Last run: {script.lastRun}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">{script.success}%</div>
                          <div className="text-xs text-muted-foreground">Success Rate</div>
                        </div>
                        <Badge variant={script.status === 'running' ? 'default' : 'secondary'}>
                          {script.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Next execution: {script.nextRun}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7">
                          <Play className="h-3 w-3 mr-1" />
                          Run Now
                        </Button>
                        <Button size="sm" variant="outline" className="h-7">
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};