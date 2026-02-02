import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Variable,
  Search,
  RefreshCw,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Download,
  Copy,
  User,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";

interface EnvVariable {
  name: string;
  value: string;
  scope: 'system' | 'user';
}

interface EnvironmentVariablesProps {
  agentId: string;
  sendCommand: (cmd: string, payload?: any) => Promise<any>;
}

export function EnvironmentVariables({ agentId, sendCommand }: EnvironmentVariablesProps) {
  const [variables, setVariables] = useState<EnvVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'system' | 'user'>('system');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingVar, setEditingVar] = useState<EnvVariable | null>(null);
  const [newVar, setNewVar] = useState<{ name: string; value: string; scope: 'system' | 'user' }>({ name: '', value: '', scope: 'system' });
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadVariables();
  }, [agentId]);

  const loadVariables = async () => {
    setIsLoading(true);
    try {
      const result = await sendCommand('get_environment_variables');
      if (result?.variables) {
        setVariables(result.variables);
      } else {
        setVariables([]);
      }
    } catch (err) {
      toast.error('Failed to load environment variables');
      setVariables([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVariable = async () => {
    const varToSave = editingVar || newVar;
    try {
      await sendCommand('set_environment_variable', {
        name: varToSave.name,
        value: varToSave.value,
        scope: varToSave.scope,
      });
      toast.success('Environment variable saved');
      setShowEditDialog(false);
      setEditingVar(null);
      setNewVar({ name: '', value: '', scope: 'system' });
      setTimeout(() => loadVariables(), 2000);
    } catch (err) {
      toast.error('Failed to save variable');
    }
  };

  const handleDeleteVariable = async (name: string, varScope: string) => {
    setActionInProgress(name);
    try {
      await sendCommand('delete_environment_variable', { name, scope: varScope });
      toast.success('Variable deleted');
      setTimeout(() => loadVariables(), 2000);
    } catch (err) {
      toast.error('Failed to delete variable');
    } finally {
      setActionInProgress(null);
    }
  };

  const copyValue = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success('Value copied to clipboard');
  };

  const exportVariables = () => {
    const content = variables
      .filter(v => v.scope === scope)
      .map(v => `${v.name}=${v.value}`)
      .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `env-${scope}-${agentId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Variables exported');
  };

  const filteredVars = variables.filter(v => 
    v.scope === scope &&
    (v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     v.value.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openCreateDialog = () => {
    setEditingVar(null);
    setNewVar({ name: '', value: '', scope: scope as 'system' | 'user' });
    setShowEditDialog(true);
  };

  const openEditDialog = (variable: EnvVariable) => {
    setEditingVar({ ...variable });
    setShowEditDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Variable className="h-5 w-5" />
              Environment Variables
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                New Variable
              </Button>
              <Button variant="outline" size="sm" onClick={exportVariables}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={loadVariables} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={scope} onValueChange={(v: any) => setScope(v)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="system" className="gap-2">
                  <Monitor className="h-4 w-4" />
                  System
                </TabsTrigger>
                <TabsTrigger value="user" className="gap-2">
                  <User className="h-4 w-4" />
                  User
                </TabsTrigger>
              </TabsList>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search variables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {['system', 'user'].map((s) => (
              <TabsContent key={s} value={s} className="mt-0">
                <ScrollArea className="h-[350px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredVars.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Variable className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No {s} environment variables found</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead className="w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVars.map((v) => (
                          <TableRow key={`${v.scope}-${v.name}`}>
                            <TableCell>
                              <div className="font-mono font-medium">{v.name}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-sm truncate max-w-[300px]" title={v.value}>
                                {v.value}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => copyValue(v.value)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEditDialog(v)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleDeleteVariable(v.name, v.scope)}
                                  disabled={actionInProgress === v.name}
                                >
                                  {actionInProgress === v.name ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVar ? 'Edit Variable' : 'Create Variable'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Variable Name</Label>
              <Input 
                value={editingVar?.name || newVar.name}
                onChange={(e) => {
                  if (editingVar) {
                    setEditingVar({ ...editingVar, name: e.target.value });
                  } else {
                    setNewVar(prev => ({ ...prev, name: e.target.value }));
                  }
                }}
                placeholder="MY_VARIABLE"
                disabled={!!editingVar}
              />
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Textarea 
                value={editingVar?.value || newVar.value}
                onChange={(e) => {
                  if (editingVar) {
                    setEditingVar({ ...editingVar, value: e.target.value });
                  } else {
                    setNewVar(prev => ({ ...prev, value: e.target.value }));
                  }
                }}
                placeholder="variable value"
                rows={3}
              />
            </div>
            {!editingVar && (
              <div className="space-y-2">
                <Label>Scope</Label>
                <Select 
                  value={newVar.scope}
                  onValueChange={(v: any) => setNewVar(prev => ({ ...prev, scope: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System (Machine-wide)</SelectItem>
                    <SelectItem value="user">User (Current User)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveVariable}
              disabled={!(editingVar?.name || newVar.name)}
            >
              Save Variable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
