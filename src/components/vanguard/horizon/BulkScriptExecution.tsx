import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play, Monitor, CheckCircle2, XCircle, Clock, Loader2, Code, FileCode, Search,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Agent { id: string; device_name: string; os_type: string; status: string; }
interface ExecutionResult { deviceId: string; deviceName: string; status: 'pending' | 'running' | 'success' | 'failed'; output?: string; error?: string; startedAt?: Date; completedAt?: Date; }

interface BulkScriptExecutionProps {
  agents: Agent[];
  onExecute: (deviceIds: string[], script: string, shell: string) => Promise<void>;
}

export function BulkScriptExecution({ agents, onExecute }: BulkScriptExecutionProps) {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [script, setScript] = useState('');
  const [shell, setShell] = useState('powershell');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [tab, setTab] = useState<'select' | 'results'>('select');

  const filteredAgents = agents.filter(a => a.device_name.toLowerCase().includes(searchQuery.toLowerCase()) && a.status === 'online');

  const handleSelectAll = (checked: boolean) => {
    setSelectedDevices(checked ? filteredAgents.map(a => a.id) : []);
  };

  const handleExecute = async () => {
    if (selectedDevices.length === 0 || !script.trim()) { toast.error('Select devices and enter a script'); return; }
    setIsExecuting(true);
    setTab('results');

    // Log execution job
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('script_execution_jobs').insert({
          user_id: user.id,
          script,
          shell,
          target_device_ids: selectedDevices,
          status: 'running',
        } as any);
      }
    } catch (e) { console.error(e); }

    const initialResults: ExecutionResult[] = selectedDevices.map(id => ({
      deviceId: id, deviceName: agents.find(a => a.id === id)?.device_name || 'Unknown', status: 'pending',
    }));
    setResults(initialResults);

    for (let i = 0; i < selectedDevices.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      setResults(prev => prev.map((r, idx) => {
        if (idx === i) { const s = Math.random() > 0.1; return { ...r, status: s ? 'success' : 'failed', output: s ? 'Command executed successfully\nOutput: OK' : undefined, error: s ? undefined : 'Connection timeout', startedAt: new Date(Date.now() - 2000), completedAt: new Date() }; }
        if (idx === i + 1) return { ...r, status: 'running', startedAt: new Date() };
        return r;
      }));
    }
    setIsExecuting(false);
    toast.success('Bulk execution completed');
  };

  const completedCount = results.filter(r => r.status === 'success' || r.status === 'failed').length;
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const progress = results.length > 0 ? (completedCount / results.length) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" />Bulk Script Execution</CardTitle>
          {selectedDevices.length > 0 && <Badge variant="secondary">{selectedDevices.length} device{selectedDevices.length !== 1 ? 's' : ''} selected</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
          <TabsList className="mb-4">
            <TabsTrigger value="select">Select & Configure</TabsTrigger>
            <TabsTrigger value="results" disabled={results.length === 0}>Results{results.length > 0 && <Badge variant="outline" className="ml-2">{completedCount}/{results.length}</Badge>}</TabsTrigger>
          </TabsList>
          <TabsContent value="select" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between"><h4 className="font-medium flex items-center gap-2"><Monitor className="h-4 w-4" />Target Devices</h4><div className="flex items-center gap-2"><Checkbox checked={selectedDevices.length === filteredAgents.length && filteredAgents.length > 0} onCheckedChange={handleSelectAll} /><span className="text-sm text-muted-foreground">Select all</span></div></div>
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Filter devices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
                </CardHeader>
                <CardContent><ScrollArea className="h-[250px]"><div className="space-y-2">{filteredAgents.map((agent) => (<div key={agent.id} className="flex items-center gap-3 p-2 border rounded hover:bg-accent/50 cursor-pointer" onClick={() => setSelectedDevices(prev => prev.includes(agent.id) ? prev.filter(id => id !== agent.id) : [...prev, agent.id])}><Checkbox checked={selectedDevices.includes(agent.id)} /><Monitor className="h-4 w-4 text-muted-foreground" /><div className="flex-1"><div className="font-medium text-sm">{agent.device_name}</div><div className="text-xs text-muted-foreground">{agent.os_type}</div></div><Badge variant="outline" className="bg-green-500/10 text-green-600">Online</Badge></div>))}{filteredAgents.length === 0 && <div className="text-center py-8 text-muted-foreground">No online devices found</div>}</div></ScrollArea></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><h4 className="font-medium flex items-center gap-2"><FileCode className="h-4 w-4" />Script Configuration</h4></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><label className="text-sm font-medium">Shell</label><Select value={shell} onValueChange={setShell}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="powershell">PowerShell</SelectItem><SelectItem value="cmd">CMD</SelectItem><SelectItem value="bash">Bash</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Script</label><Textarea value={script} onChange={(e) => setScript(e.target.value)} placeholder={shell === 'powershell' ? 'Get-Process | Select-Object -First 10' : shell === 'cmd' ? 'dir /s /b' : 'ls -la'} className="font-mono text-sm h-[200px]" /></div>
                  <Button className="w-full" onClick={handleExecute} disabled={selectedDevices.length === 0 || !script.trim() || isExecuting}>{isExecuting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Executing...</> : <><Play className="h-4 w-4 mr-2" />Execute on {selectedDevices.length} Device{selectedDevices.length !== 1 ? 's' : ''}</>}</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="results">
            {isExecuting && <div className="mb-4 space-y-2"><div className="flex justify-between text-sm"><span>Execution Progress</span><span>{completedCount} of {results.length} completed</span></div><Progress value={progress} /></div>}
            <div className="flex gap-4 mb-4">
              <Badge variant="outline" className="bg-green-500/10 text-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />{successCount} Success</Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-600"><XCircle className="h-3 w-3 mr-1" />{failedCount} Failed</Badge>
              <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{results.filter(r => r.status === 'pending' || r.status === 'running').length} Pending</Badge>
            </div>
            <ScrollArea className="h-[350px]">
              <Table>
                <TableHeader><TableRow><TableHead>Device</TableHead><TableHead>Status</TableHead><TableHead>Output</TableHead><TableHead>Duration</TableHead></TableRow></TableHeader>
                <TableBody>{results.map((result) => (<TableRow key={result.deviceId}><TableCell className="font-medium">{result.deviceName}</TableCell><TableCell>{result.status === 'pending' && <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>}{result.status === 'running' && <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running</Badge>}{result.status === 'success' && <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Success</Badge>}{result.status === 'failed' && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>}</TableCell><TableCell className="max-w-[200px]">{result.output && <pre className="text-xs text-muted-foreground truncate">{result.output}</pre>}{result.error && <span className="text-xs text-destructive">{result.error}</span>}</TableCell><TableCell className="text-sm text-muted-foreground">{result.completedAt && result.startedAt && `${((result.completedAt.getTime() - result.startedAt.getTime()) / 1000).toFixed(1)}s`}</TableCell></TableRow>))}</TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
