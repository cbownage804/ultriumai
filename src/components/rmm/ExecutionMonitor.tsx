import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Terminal,
  Pause,
  StopCircle,
  RefreshCw,
  Eye
} from "lucide-react";

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

interface ExecutionMonitorProps {
  executions: ExecutionStatus[];
  onRefresh: () => void;
  onCancel: (executionId: string) => void;
}

export const ExecutionMonitor = ({ executions, onRefresh, onCancel }: ExecutionMonitorProps) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<ExecutionStatus | null>(null);

  // Auto-refresh every 2 seconds when enabled
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(onRefresh, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, onRefresh]);

  const activeExecutions = executions.filter(e => ['pending', 'executing'].includes(e.status));
  const completedExecutions = executions.filter(e => ['completed', 'failed', 'timeout'].includes(e.status));
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'executing': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'executing': return 'default';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'timeout': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const ExecutionCard = ({ execution }: { execution: ExecutionStatus }) => (
    <div className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon(execution.status)}
          <div>
            <h4 className="font-medium">{execution.scriptName}</h4>
            <p className="text-sm text-muted-foreground">
              {execution.agentHostname} • Started {execution.startedAt}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={getStatusColor(execution.status) as any}>
            {execution.status}
          </Badge>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7">
                <Eye className="h-3 w-3 mr-1" />
                Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Execution Details
                </DialogTitle>
                <DialogDescription>
                  {execution.scriptName} on {execution.agentHostname}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge className="ml-2" variant={getStatusColor(execution.status) as any}>
                      {execution.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Started:</span>
                    <span className="ml-2">{execution.startedAt}</span>
                  </div>
                  {execution.completedAt && (
                    <div>
                      <span className="font-medium">Completed:</span>
                      <span className="ml-2">{execution.completedAt}</span>
                    </div>
                  )}
                  {execution.executionTime && (
                    <div>
                      <span className="font-medium">Duration:</span>
                      <span className="ml-2">{formatDuration(execution.executionTime)}</span>
                    </div>
                  )}
                  {execution.exitCode !== undefined && (
                    <div>
                      <span className="font-medium">Exit Code:</span>
                      <span className="ml-2">{execution.exitCode}</span>
                    </div>
                  )}
                </div>
                
                {execution.output && (
                  <div>
                    <h4 className="font-medium mb-2">Output:</h4>
                    <ScrollArea className="h-40 bg-muted p-3 rounded font-mono text-sm">
                      <pre className="whitespace-pre-wrap">{execution.output}</pre>
                    </ScrollArea>
                  </div>
                )}
                
                {execution.errorMessage && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Error:</h4>
                    <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-800">
                      {execution.errorMessage}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {execution.status === 'executing' && execution.progress !== undefined && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{execution.progress}%</span>
          </div>
          <Progress value={execution.progress} className="h-2" />
        </div>
      )}
      
      {execution.status === 'executing' && (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7"
            onClick={() => onCancel(execution.id)}
          >
            <StopCircle className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Script Execution Monitor
            </CardTitle>
            <CardDescription>
              Real-time monitoring of script executions across your agents
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-primary/10' : ''}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="relative">
              Active Executions
              {activeExecutions.length > 0 && (
                <Badge className="ml-2 h-5 text-xs">{activeExecutions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Recent Completed
              {completedExecutions.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 text-xs">
                  {completedExecutions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeExecutions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active script executions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeExecutions.map((execution) => (
                  <ExecutionCard key={execution.id} execution={execution} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedExecutions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent completed executions</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {completedExecutions.map((execution) => (
                    <ExecutionCard key={execution.id} execution={execution} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};