import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Settings,
  Play,
  Pause,
  Bot,
  Lock,
  Wifi,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AutomatedAction {
  id: string;
  name: string;
  description: string;
  triggerCondition: string;
  action: string;
  enabled: boolean;
  lastTriggered?: string;
  executionCount: number;
  status: 'idle' | 'executing' | 'completed' | 'failed';
  category: 'network' | 'endpoint' | 'identity' | 'data';
}

interface ExecutionLog {
  id: string;
  actionId: string;
  timestamp: string;
  status: 'success' | 'failed';
  details: string;
  duration: number;
}

export const AutomatedActions = () => {
  const { toast } = useToast();
  const [actions, setActions] = useState<AutomatedAction[]>([
    {
      id: '1',
      name: 'Malware Auto-Quarantine',
      description: 'Automatically isolate endpoints when malware is detected',
      triggerCondition: 'Malware detection confidence > 90%',
      action: 'Isolate endpoint and notify SOC team',
      enabled: true,
      lastTriggered: '2 hours ago',
      executionCount: 12,
      status: 'idle',
      category: 'endpoint'
    },
    {
      id: '2', 
      name: 'Suspicious Traffic Blocking',
      description: 'Block traffic to known malicious IPs and domains',
      triggerCondition: 'Traffic to blacklisted destinations',
      action: 'Add firewall rule and log incident',
      enabled: true,
      lastTriggered: '45 minutes ago',
      executionCount: 8,
      status: 'idle',
      category: 'network'
    },
    {
      id: '3',
      name: 'Failed Login Response',
      description: 'Lock accounts after suspicious login patterns',
      triggerCondition: '5+ failed logins from different IPs',
      action: 'Temporary account lock and admin notification',
      enabled: false,
      executionCount: 3,
      status: 'idle',
      category: 'identity'
    },
    {
      id: '4',
      name: 'Data Exfiltration Prevention',
      description: 'Block large data transfers during off-hours',
      triggerCondition: 'Unusual data volume + time-based rules',
      action: 'Block transfer and create incident ticket',
      enabled: true,
      lastTriggered: '1 day ago',
      executionCount: 2,
      status: 'idle',
      category: 'data'
    }
  ]);

  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([
    {
      id: '1',
      actionId: '1',
      timestamp: '2 hours ago',
      status: 'success',
      details: 'Endpoint WS-USER-15 quarantined - Trojan.GenKD detected',
      duration: 1200
    },
    {
      id: '2',
      actionId: '2', 
      timestamp: '45 minutes ago',
      status: 'success',
      details: 'Blocked traffic to malicious domain: evil-site.com',
      duration: 800
    }
  ]);

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);

  const toggleAction = (actionId: string) => {
    setActions(prev => prev.map(action => 
      action.id === actionId 
        ? { ...action, enabled: !action.enabled }
        : action
    ));

    const action = actions.find(a => a.id === actionId);
    toast({
      title: action?.enabled ? "Action Disabled" : "Action Enabled",
      description: `${action?.name} is now ${action?.enabled ? 'disabled' : 'enabled'}`,
    });
  };

  const executeAction = async (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    setIsExecuting(true);
    setExecutionProgress(0);

    // Update action status
    setActions(prev => prev.map(a => 
      a.id === actionId 
        ? { ...a, status: 'executing' }
        : a
    ));

    // Simulate execution progress
    const progressInterval = setInterval(() => {
      setExecutionProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsExecuting(false);

          // Complete execution
          const now = new Date().toLocaleString();
          setActions(prev => prev.map(a => 
            a.id === actionId 
              ? { 
                  ...a, 
                  status: 'completed',
                  lastTriggered: 'Just now',
                  executionCount: a.executionCount + 1
                }
              : a
          ));

          // Add to execution log
          const newLog: ExecutionLog = {
            id: Date.now().toString(),
            actionId,
            timestamp: 'Just now',
            status: 'success',
            details: `Manual execution of ${action.name} completed successfully`,
            duration: 2000
          };
          setExecutionLogs(prev => [newLog, ...prev].slice(0, 10));

          toast({
            title: "Action Executed",
            description: `${action.name} completed successfully`,
          });

          // Reset status after 3 seconds
          setTimeout(() => {
            setActions(prev => prev.map(a => 
              a.id === actionId ? { ...a, status: 'idle' } : a
            ));
          }, 3000);

          return 100;
        }
        return prev + Math.random() * 20;
      });
    }, 200);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'network': return <Wifi className="h-4 w-4" />;
      case 'endpoint': return <Shield className="h-4 w-4" />;
      case 'identity': return <Lock className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executing': return 'text-yellow-500';
      case 'completed': return 'text-green-500'; 
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Automated Actions */}
      <Card className="border-blue-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Automated Security Actions
            <Badge variant="outline" className="ml-auto">
              {actions.filter(a => a.enabled).length} Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Execution Progress */}
          {isExecuting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 animate-pulse text-blue-500" />
                Executing automated action...
              </div>
              <Progress value={executionProgress} className="h-2" />
            </div>
          )}

          {/* Actions List */}
          <div className="space-y-3">
            {actions.map((action) => (
              <div key={action.id} className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getCategoryIcon(action.category)}
                      <span className="font-medium">{action.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {action.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{action.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Trigger:</span> {action.triggerCondition}
                      </div>
                      <div>
                        <span className="font-medium">Action:</span> {action.action}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={action.enabled}
                      onCheckedChange={() => toggleAction(action.id)}
                    />
                    <Button
                      onClick={() => executeAction(action.id)}
                      variant="outline"
                      size="sm"
                      disabled={isExecuting || !action.enabled}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className={`flex items-center gap-1 ${getStatusColor(action.status)}`}>
                      {action.status === 'executing' && <Clock className="h-3 w-3 animate-spin" />}
                      {action.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                      {action.status === 'failed' && <AlertTriangle className="h-3 w-3" />}
                      {action.status === 'idle' && <Pause className="h-3 w-3" />}
                      Status: {action.status}
                    </span>
                    <span>Executions: {action.executionCount}</span>
                    {action.lastTriggered && <span>Last: {action.lastTriggered}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Execution Logs */}
      <Card className="border-green-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-green-500" />
            Recent Executions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {executionLogs.map((log) => {
              const action = actions.find(a => a.id === log.actionId);
              return (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                  {log.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{action?.name}</span>
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{log.details}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {log.timestamp}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};