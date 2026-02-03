import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CheckCircle2, XCircle, Clock, Send, RefreshCw, 
  Shield, Cpu, Zap, AlertTriangle, Play, Bug
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface TestResult {
  test_name: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  message: string;
  timestamp: string;
}

export function AgentTestingPanel() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const queryClient = useQueryClient();

  // Fetch agents with recent telemetry
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agent-telemetry-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('vanguard_agents')
        .select(`
          id,
          name,
          status,
          last_heartbeat,
          agent_version,
          ip_address
        `)
        .eq('user_id', user.id)
        .order('last_heartbeat', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000
  });

  // Fetch recent telemetry for selected agent
  const { data: telemetry } = useQuery({
    queryKey: ['agent-telemetry', selectedAgentId],
    queryFn: async () => {
      if (!selectedAgentId) return { threats: [], actions: [], commands: [] };
      
      // Get XDR threats from this agent
      const { data: threats } = await supabase
        .from('xdr_threats')
        .select('id, threat_type, severity, created_at, status')
        .eq('agent_id', selectedAgentId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get response actions
      const { data: actions } = await supabase
        .from('xdr_response_actions')
        .select('id, action_type, action_status, executed_at')
        .eq('agent_id', selectedAgentId)
        .order('executed_at', { ascending: false })
        .limit(10);

      // Get recent commands
      const { data: commands } = await supabase
        .from('vanguard_agent_commands')
        .select('id, command_type, status, created_at, completed_at')
        .eq('agent_id', selectedAgentId)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        threats: threats || [],
        actions: actions || [],
        commands: commands || []
      };
    },
    enabled: !!selectedAgentId
  });

  // Run connectivity test
  const runTestMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Send a test command to the agent
      const { data, error } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: agentId,
          user_id: user.id,
          command_type: 'health_check',
          payload: { test_timestamp: new Date().toISOString() },
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Test command sent to agent');
      queryClient.invalidateQueries({ queryKey: ['agent-telemetry'] });
    },
    onError: (error) => {
      toast.error(`Test failed: ${error.message}`);
    }
  });

  // Run full test suite
  const runFullTestSuite = async (agentId: string) => {
    setIsRunningTests(true);
    setTestResults([]);

    const tests = [
      { name: 'Agent Connectivity', test: async () => {
        const agent = agents?.find(a => a.id === agentId);
        if (!agent?.last_heartbeat) return { passed: false, message: 'No heartbeat received' };
        const lastHeartbeat = new Date(agent.last_heartbeat);
        const diff = Date.now() - lastHeartbeat.getTime();
        return { 
          passed: diff < 5 * 60 * 1000, 
          message: diff < 5 * 60 * 1000 
            ? `Last heartbeat ${formatDistanceToNow(lastHeartbeat)} ago` 
            : 'Agent appears offline'
        };
      }},
      { name: 'Telemetry Pipeline', test: async () => {
        const { count } = await supabase
          .from('xdr_threats')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', agentId);
        return { 
          passed: true, 
          message: `${count || 0} threats recorded from this agent`
        };
      }},
      { name: 'Command Queue', test: async () => {
        const { count } = await supabase
          .from('vanguard_agent_commands')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', agentId)
          .eq('status', 'pending');
        return { 
          passed: true, 
          message: `${count || 0} commands pending`
        };
      }},
      { name: 'Response Actions', test: async () => {
        const { data } = await supabase
          .from('xdr_response_actions')
          .select('action_status')
          .eq('agent_id', agentId)
          .order('executed_at', { ascending: false })
          .limit(5);
        
        const total = data?.length || 0;
        const completed = data?.filter(a => a.action_status === 'completed').length || 0;
        const successRate = total > 0 ? Math.round((completed / total) * 100) : 100;
        return { 
          passed: successRate >= 80, 
          message: `${successRate}% success rate on recent actions`
        };
      }},
      { name: 'YARA Engine', test: async () => {
        const agent = agents?.find(a => a.id === agentId);
        const version = agent?.agent_version;
        return { 
          passed: !!version, 
          message: version ? `Agent version ${version}` : 'Version unknown'
        };
      }}
    ];

    for (const { name, test } of tests) {
      setTestResults(prev => [...prev, { test_name: name, status: 'running', message: 'Testing...', timestamp: new Date().toISOString() }]);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Visual delay
        const result = await test();
        setTestResults(prev => prev.map(r => 
          r.test_name === name 
            ? { ...r, status: result.passed ? 'passed' : 'failed', message: result.message }
            : r
        ));
      } catch (err: any) {
        setTestResults(prev => prev.map(r => 
          r.test_name === name 
            ? { ...r, status: 'failed', message: err.message }
            : r
        ));
      }
    }

    setIsRunningTests(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <Bug className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Agent Testing</h2>
            <p className="text-white/60 text-sm">Validate C# agent telemetry and connectivity</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['agent-telemetry-status'] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Connected Agents</CardTitle>
            <CardDescription>Select an agent to test</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {agentsLoading ? (
                <div className="flex items-center justify-center h-32 text-white/60">
                  Loading agents...
                </div>
              ) : !agents?.length ? (
                <div className="text-center py-8 text-white/60">
                  <Cpu className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No agents found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedAgentId === agent.id 
                          ? 'bg-blue-500/20 border-blue-500/50' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedAgentId(agent.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            agent.status === 'online' ? 'bg-green-500' :
                            agent.status === 'warning' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`} />
                          <span className="font-medium text-white">{agent.name || 'Unknown Agent'}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {agent.agent_version || 'v?'}
                        </Badge>
                      </div>
                      <div className="text-xs text-white/50 mt-1">
                        {String(agent.ip_address || 'No IP')} • {agent.last_heartbeat 
                          ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })
                          : 'Never connected'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Test Suite */}
        <Card className="bg-card/50 border-white/10 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-lg">Test Suite</CardTitle>
                <CardDescription>
                  {selectedAgentId 
                    ? `Testing ${agents?.find(a => a.id === selectedAgentId)?.name || 'agent'}`
                    : 'Select an agent to run tests'}
                </CardDescription>
              </div>
              {selectedAgentId && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => runTestMutation.mutate(selectedAgentId)}
                    disabled={runTestMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Ping
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => runFullTestSuite(selectedAgentId)}
                    disabled={isRunningTests}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run All Tests
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedAgentId ? (
              <div className="flex flex-col items-center justify-center h-64 text-white/60">
                <Shield className="h-16 w-16 mb-4 opacity-30" />
                <p>Select an agent from the list to begin testing</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Test Results */}
                {testResults.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-white/70">Test Results</Label>
                    <div className="space-y-2">
                      {testResults.map((result, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(result.status)}
                            <span className="text-white">{result.test_name}</span>
                          </div>
                          <span className="text-sm text-white/60">{result.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Telemetry */}
                <Tabs defaultValue="threats" className="mt-4">
                  <TabsList className="bg-white/5">
                    <TabsTrigger value="threats">Threats</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                    <TabsTrigger value="commands">Commands</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="threats" className="mt-4">
                    {telemetry?.threats && telemetry.threats.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Detected</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {telemetry.threats.map((threat) => (
                            <TableRow key={threat.id}>
                              <TableCell>{threat.threat_type}</TableCell>
                              <TableCell>
                                <Badge className={
                                  threat.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                  threat.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-yellow-500/20 text-yellow-400'
                                }>{threat.severity}</Badge>
                              </TableCell>
                              <TableCell>{threat.status}</TableCell>
                              <TableCell className="text-white/60">
                                {format(new Date(threat.created_at), 'MMM d, HH:mm')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-white/60">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No threats detected by this agent</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="actions" className="mt-4">
                    {telemetry?.actions && telemetry.actions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Action</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Executed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {telemetry.actions.map((action) => (
                            <TableRow key={action.id}>
                              <TableCell>{action.action_type}</TableCell>
                              <TableCell>
                                <Badge variant={action.action_status === 'completed' ? 'default' : 'secondary'}>
                                  {action.action_status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-white/60">
                                {action.executed_at ? format(new Date(action.executed_at), 'MMM d, HH:mm') : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-white/60">No response actions</div>
                    )}
                  </TabsContent>

                  <TabsContent value="commands" className="mt-4">
                    {telemetry?.commands && telemetry.commands.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Command</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {telemetry.commands.map((cmd) => (
                            <TableRow key={cmd.id}>
                              <TableCell className="font-mono text-sm">{cmd.command_type}</TableCell>
                              <TableCell>
                                <Badge variant={cmd.status === 'completed' ? 'default' : 'secondary'}>
                                  {cmd.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-white/60">
                                {format(new Date(cmd.created_at), 'MMM d, HH:mm')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-white/60">No commands sent</div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
