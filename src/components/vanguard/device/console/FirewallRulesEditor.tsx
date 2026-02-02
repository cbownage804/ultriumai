import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Search,
  RefreshCw,
  Loader2,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface FirewallRule {
  name: string;
  enabled: boolean;
  direction: 'inbound' | 'outbound';
  action: 'allow' | 'block';
  protocol: string;
  localPort: string;
  remotePort: string;
  remoteAddress: string;
  program: string;
  profile: string;
}

interface FirewallRulesEditorProps {
  agentId: string;
  sendCommand: (cmd: string, payload?: any) => Promise<any>;
}

export function FirewallRulesEditor({ agentId, sendCommand }: FirewallRulesEditorProps) {
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [direction, setDirection] = useState<'inbound' | 'outbound'>('inbound');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    direction: 'inbound' as const,
    action: 'allow' as const,
    protocol: 'TCP',
    localPort: '',
    remotePort: '',
    remoteAddress: 'any',
    program: '',
    enabled: true,
  });

  useEffect(() => {
    loadRules();
  }, [agentId]);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const result = await sendCommand('get_firewall_rules');
      if (result?.rules) {
        setRules(result.rules);
      } else {
        setRules([]);
      }
    } catch (err) {
      toast.error('Failed to load firewall rules');
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRule = async (ruleName: string, enabled: boolean) => {
    setActionInProgress(ruleName);
    try {
      await sendCommand('firewall_rule_action', { 
        rule_name: ruleName, 
        action: enabled ? 'enable' : 'disable' 
      });
      toast.success(`Rule ${enabled ? 'enabled' : 'disabled'}`);
      setTimeout(() => loadRules(), 2000);
    } catch (err) {
      toast.error('Failed to update rule');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteRule = async (ruleName: string) => {
    setActionInProgress(ruleName);
    try {
      await sendCommand('firewall_rule_action', { rule_name: ruleName, action: 'delete' });
      toast.success('Rule deleted');
      setTimeout(() => loadRules(), 2000);
    } catch (err) {
      toast.error('Failed to delete rule');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCreateRule = async () => {
    try {
      await sendCommand('create_firewall_rule', newRule);
      toast.success('Firewall rule creation command sent');
      setShowCreateDialog(false);
      setNewRule({
        name: '',
        direction: 'inbound',
        action: 'allow',
        protocol: 'TCP',
        localPort: '',
        remotePort: '',
        remoteAddress: 'any',
        program: '',
        enabled: true,
      });
      setTimeout(() => loadRules(), 2000);
    } catch (err) {
      toast.error('Failed to create rule');
    }
  };

  const filteredRules = rules.filter(r => 
    r.direction === direction &&
    (r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     r.program?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Firewall Rules
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Rule
              </Button>
              <Button variant="outline" size="sm" onClick={loadRules} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={direction} onValueChange={(v: any) => setDirection(v)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="inbound" className="gap-2">
                  <ArrowDownLeft className="h-4 w-4" />
                  Inbound
                </TabsTrigger>
                <TabsTrigger value="outbound" className="gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Outbound
                </TabsTrigger>
              </TabsList>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <TabsContent value="inbound" className="mt-0">
              <RulesTable 
                rules={filteredRules}
                isLoading={isLoading}
                actionInProgress={actionInProgress}
                onToggle={handleToggleRule}
                onDelete={handleDeleteRule}
              />
            </TabsContent>
            <TabsContent value="outbound" className="mt-0">
              <RulesTable 
                rules={filteredRules}
                isLoading={isLoading}
                actionInProgress={actionInProgress}
                onToggle={handleToggleRule}
                onDelete={handleDeleteRule}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Firewall Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input 
                value={newRule.name}
                onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Allow SSH"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select 
                  value={newRule.direction}
                  onValueChange={(v: any) => setNewRule(prev => ({ ...prev, direction: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <Select 
                  value={newRule.action}
                  onValueChange={(v: any) => setNewRule(prev => ({ ...prev, action: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allow">Allow</SelectItem>
                    <SelectItem value="block">Block</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Protocol</Label>
                <Select 
                  value={newRule.protocol}
                  onValueChange={(v) => setNewRule(prev => ({ ...prev, protocol: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TCP">TCP</SelectItem>
                    <SelectItem value="UDP">UDP</SelectItem>
                    <SelectItem value="Any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Local Port</Label>
                <Input 
                  value={newRule.localPort}
                  onChange={(e) => setNewRule(prev => ({ ...prev, localPort: e.target.value }))}
                  placeholder="22, 80, 443"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Program Path (optional)</Label>
              <Input 
                value={newRule.program}
                onChange={(e) => setNewRule(prev => ({ ...prev, program: e.target.value }))}
                placeholder="C:\Program Files\App\app.exe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateRule} disabled={!newRule.name}>
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RulesTable({ 
  rules, 
  isLoading, 
  actionInProgress, 
  onToggle, 
  onDelete 
}: { 
  rules: FirewallRule[];
  isLoading: boolean;
  actionInProgress: string | null;
  onToggle: (name: string, enabled: boolean) => void;
  onDelete: (name: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No firewall rules found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[350px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Enabled</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Protocol</TableHead>
            <TableHead>Port</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.name}>
              <TableCell>
                <Switch 
                  checked={rule.enabled}
                  onCheckedChange={(checked) => onToggle(rule.name, checked)}
                  disabled={actionInProgress === rule.name}
                />
              </TableCell>
              <TableCell>
                <div className="font-medium truncate max-w-[200px]">{rule.name}</div>
                {rule.program && (
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {rule.program}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={rule.action === 'allow' ? 'default' : 'destructive'}>
                  {rule.action}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{rule.protocol}</TableCell>
              <TableCell className="font-mono text-sm">{rule.localPort || 'Any'}</TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => onDelete(rule.name)}
                  disabled={actionInProgress === rule.name}
                >
                  {actionInProgress === rule.name ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
