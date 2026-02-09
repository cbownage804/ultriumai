import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  RotateCcw, Search, RefreshCw, Loader2, Plus, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ServiceAutoRestartProps {
  agents: any[];
}

export function ServiceAutoRestart({ agents }: ServiceAutoRestartProps) {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRule, setNewRule] = useState({ serviceName: '', maxRestarts: 3, restartDelay: 30 });

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }
      const { data } = await supabase
        .from('service_auto_restart_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setRules(data || []);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    await supabase.from('service_auto_restart_rules')
      .update({ enabled, status: enabled ? 'monitoring' : 'disabled' } as any)
      .eq('id', ruleId);
    setRules(rules.map(r => r.id === ruleId ? { ...r, enabled, status: enabled ? 'monitoring' : 'disabled' } : r));
    toast.success(`Auto-restart ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleAddRule = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('service_auto_restart_rules').insert({
      user_id: user.id,
      service_name: newRule.serviceName,
      display_name: newRule.serviceName,
      max_restarts: newRule.maxRestarts,
      restart_delay: newRule.restartDelay,
    } as any);
    if (!error) {
      toast.success('Auto-restart rule added');
      setShowAddDialog(false);
      setNewRule({ serviceName: '', maxRestarts: 3, restartDelay: 30 });
      loadRules();
    }
  };

  const deleteRule = async (ruleId: string) => {
    await supabase.from('service_auto_restart_rules').delete().eq('id', ruleId);
    setRules(rules.filter(r => r.id !== ruleId));
    toast.success('Rule deleted');
  };

  const getStatusBadge = (rule: any) => {
    switch (rule.status) {
      case 'monitoring': return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Monitoring</Badge>;
      case 'restarting': return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Restarting</Badge>;
      case 'max_reached': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Max Reached</Badge>;
      case 'disabled': return <Badge variant="secondary">Disabled</Badge>;
      default: return null;
    }
  };

  const filteredRules = rules.filter(r =>
    (r.service_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.display_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><RotateCcw className="h-5 w-5" />Service Auto-Restart</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowAddDialog(true)}><Plus className="h-4 w-4 mr-2" />Add Rule</Button>
              <Button variant="outline" size="sm" onClick={loadRules} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Refresh
              </Button>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search services..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader><TableRow><TableHead>Enabled</TableHead><TableHead>Service</TableHead><TableHead>Max Restarts</TableHead><TableHead>Delay</TableHead><TableHead>Restarts</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell><Switch checked={rule.enabled} onCheckedChange={(checked) => toggleRule(rule.id, checked)} /></TableCell>
                      <TableCell><div><div className="font-medium">{rule.display_name || rule.service_name}</div><div className="text-xs text-muted-foreground">{rule.service_name}</div></div></TableCell>
                      <TableCell>{rule.max_restarts}</TableCell>
                      <TableCell>{rule.restart_delay}s</TableCell>
                      <TableCell><Badge variant={(rule.current_restarts || 0) > 0 ? 'secondary' : 'outline'}>{rule.current_restarts || 0}/{rule.max_restarts}</Badge></TableCell>
                      <TableCell>{getStatusBadge(rule)}</TableCell>
                      <TableCell><Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRule(rule.id)}>Delete</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Auto-Restart Rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Service Name</Label><Input value={newRule.serviceName} onChange={(e) => setNewRule(prev => ({ ...prev, serviceName: e.target.value }))} placeholder="e.g., Spooler, MSSQLSERVER" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Max Restarts</Label><Input type="number" value={newRule.maxRestarts} onChange={(e) => setNewRule(prev => ({ ...prev, maxRestarts: parseInt(e.target.value) || 3 }))} min={1} max={10} /></div>
              <div className="space-y-2"><Label>Restart Delay (seconds)</Label><Input type="number" value={newRule.restartDelay} onChange={(e) => setNewRule(prev => ({ ...prev, restartDelay: parseInt(e.target.value) || 30 }))} min={10} max={300} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddRule} disabled={!newRule.serviceName}>Add Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
