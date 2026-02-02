import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
  RotateCcw,
  Search,
  RefreshCw,
  Loader2,
  Plus,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface AutoRestartRule {
  id: string;
  serviceName: string;
  displayName: string;
  enabled: boolean;
  maxRestarts: number;
  restartDelay: number;
  currentRestarts: number;
  lastRestart?: Date;
  status: 'monitoring' | 'restarting' | 'max_reached' | 'disabled';
}

interface ServiceAutoRestartProps {
  agents: any[];
}

export function ServiceAutoRestart({ agents }: ServiceAutoRestartProps) {
  const [rules, setRules] = useState<AutoRestartRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRule, setNewRule] = useState({
    serviceName: '',
    maxRestarts: 3,
    restartDelay: 30,
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const mockRules: AutoRestartRule[] = [
      {
        id: '1',
        serviceName: 'Spooler',
        displayName: 'Print Spooler',
        enabled: true,
        maxRestarts: 3,
        restartDelay: 30,
        currentRestarts: 0,
        status: 'monitoring',
      },
      {
        id: '2',
        serviceName: 'MSSQLSERVER',
        displayName: 'SQL Server',
        enabled: true,
        maxRestarts: 5,
        restartDelay: 60,
        currentRestarts: 2,
        lastRestart: new Date(Date.now() - 3600000),
        status: 'monitoring',
      },
      {
        id: '3',
        serviceName: 'W3SVC',
        displayName: 'World Wide Web Publishing',
        enabled: false,
        maxRestarts: 3,
        restartDelay: 30,
        currentRestarts: 0,
        status: 'disabled',
      },
    ];
    
    setRules(mockRules);
    setIsLoading(false);
  };

  const toggleRule = (ruleId: string, enabled: boolean) => {
    setRules(rules.map(r => 
      r.id === ruleId 
        ? { ...r, enabled, status: enabled ? 'monitoring' : 'disabled' }
        : r
    ));
    toast.success(`Auto-restart ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleAddRule = () => {
    const rule: AutoRestartRule = {
      id: crypto.randomUUID(),
      serviceName: newRule.serviceName,
      displayName: newRule.serviceName,
      enabled: true,
      maxRestarts: newRule.maxRestarts,
      restartDelay: newRule.restartDelay,
      currentRestarts: 0,
      status: 'monitoring',
    };
    setRules([...rules, rule]);
    setShowAddDialog(false);
    setNewRule({ serviceName: '', maxRestarts: 3, restartDelay: 30 });
    toast.success('Auto-restart rule added');
  };

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
    toast.success('Rule deleted');
  };

  const getStatusBadge = (rule: AutoRestartRule) => {
    switch (rule.status) {
      case 'monitoring':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Monitoring</Badge>;
      case 'restarting':
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Restarting</Badge>;
      case 'max_reached':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Max Reached</Badge>;
      case 'disabled':
        return <Badge variant="secondary">Disabled</Badge>;
      default:
        return null;
    }
  };

  const filteredRules = rules.filter(r =>
    r.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Service Auto-Restart
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
              <Button variant="outline" size="sm" onClick={loadRules} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Max Restarts</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead>Restarts</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.displayName}</div>
                          <div className="text-xs text-muted-foreground">{rule.serviceName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{rule.maxRestarts}</TableCell>
                      <TableCell>{rule.restartDelay}s</TableCell>
                      <TableCell>
                        <Badge variant={rule.currentRestarts > 0 ? 'secondary' : 'outline'}>
                          {rule.currentRestarts}/{rule.maxRestarts}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(rule)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteRule(rule.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
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
          <DialogHeader>
            <DialogTitle>Add Auto-Restart Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input
                value={newRule.serviceName}
                onChange={(e) => setNewRule(prev => ({ ...prev, serviceName: e.target.value }))}
                placeholder="e.g., Spooler, MSSQLSERVER"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Restarts</Label>
                <Input
                  type="number"
                  value={newRule.maxRestarts}
                  onChange={(e) => setNewRule(prev => ({ ...prev, maxRestarts: parseInt(e.target.value) || 3 }))}
                  min={1}
                  max={10}
                />
              </div>
              <div className="space-y-2">
                <Label>Restart Delay (seconds)</Label>
                <Input
                  type="number"
                  value={newRule.restartDelay}
                  onChange={(e) => setNewRule(prev => ({ ...prev, restartDelay: parseInt(e.target.value) || 30 }))}
                  min={10}
                  max={300}
                />
              </div>
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
