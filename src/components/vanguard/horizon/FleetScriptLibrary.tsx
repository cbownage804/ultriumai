import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileCode,
  Plus,
  Search,
  Play,
  Clock,
  Calendar,
  Star,
  StarOff,
  MoreVertical,
  Copy,
  Edit,
  Trash2,
  Download,
  Terminal,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  RefreshCw,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Script {
  id: string;
  name: string;
  description: string;
  category: string;
  type: "powershell" | "batch" | "bash" | "python";
  content: string;
  author: string;
  is_favorite: boolean;
  is_builtin: boolean;
  execution_count: number;
  last_executed?: string;
  last_result?: "success" | "failed" | "partial";
  tags: string[];
}

interface ScriptExecution {
  id: string;
  script_id: string;
  script_name: string;
  device_count: number;
  success_count: number;
  failed_count: number;
  status: "running" | "completed" | "failed" | "pending";
  started_at: string;
  completed_at?: string;
}

interface Agent {
  id: string;
  name: string;
  status: string;
  device_id: string;
}

const scriptCategories = [
  "Maintenance",
  "Security",
  "Monitoring",
  "Deployment",
  "Cleanup",
  "Reporting",
  "Network",
  "User Management",
  "Custom",
];

const builtinScripts: Script[] = [
  {
    id: "builtin-1",
    name: "Clear Temp Files",
    description: "Clears Windows temporary files and browser caches",
    category: "Cleanup",
    type: "powershell",
    content: `# Clear Windows Temp Files
$TempFolders = @("$env:TEMP", "$env:WINDIR\\Temp")
foreach ($folder in $TempFolders) {
    Get-ChildItem -Path $folder -Recurse -Force | Remove-Item -Force -Recurse
}`,
    author: "System",
    is_favorite: true,
    is_builtin: true,
    execution_count: 156,
    last_executed: "2024-01-15T10:30:00Z",
    last_result: "success",
    tags: ["cleanup", "disk", "temp"],
  },
  {
    id: "builtin-2",
    name: "Windows Update Status",
    description: "Checks for pending Windows updates",
    category: "Monitoring",
    type: "powershell",
    content: `$Session = New-Object -ComObject Microsoft.Update.Session
$Searcher = $Session.CreateUpdateSearcher()
$Updates = $Searcher.Search("IsInstalled=0")
Write-Host "Pending: $($Updates.Updates.Count)"`,
    author: "System",
    is_favorite: false,
    is_builtin: true,
    execution_count: 89,
    tags: ["updates", "monitoring"],
  },
  {
    id: "builtin-3",
    name: "System Health Check",
    description: "Comprehensive system health check",
    category: "Monitoring",
    type: "powershell",
    content: `# System Health Check
$cpu = Get-Counter '\\Processor(_Total)\\% Processor Time'
$os = Get-CimInstance Win32_OperatingSystem
$disk = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"
@{CPU=$cpu; Memory=$os; Disk=$disk} | ConvertTo-Json`,
    author: "System",
    is_favorite: true,
    is_builtin: true,
    execution_count: 412,
    tags: ["health", "monitoring", "diagnostics"],
  },
];

export function FleetScriptLibrary() {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [executions, setExecutions] = useState<ScriptExecution[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("library");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newScript, setNewScript] = useState({
    name: "",
    description: "",
    category: "Custom",
    type: "powershell" as Script["type"],
    content: "",
    tags: "",
  });

  const onlineAgents = agents.filter(a => a.status === 'online');

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load agents for device selection
      const { data: agentsData } = await supabase
        .from('vanguard_agents')
        .select('id, name, status, device_id')
        .eq('user_id', user?.id)
        .order('name');

      if (agentsData) {
        setAgents(agentsData as Agent[]);
      }

      // Load user scripts from database
      const { data: userScripts, error: scriptsError } = await supabase
        .from('vanguard_fleet_scripts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (scriptsError) throw scriptsError;

      const mappedScripts: Script[] = (userScripts || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        category: s.category || 'Custom',
        type: s.script_type as Script['type'],
        content: s.content,
        author: s.author || 'User',
        is_favorite: s.is_favorite || false,
        is_builtin: false,
        execution_count: s.execution_count || 0,
        last_executed: s.last_executed,
        last_result: s.last_result as Script['last_result'],
        tags: s.tags || [],
      }));

      // Combine with builtins
      setScripts([...builtinScripts, ...mappedScripts]);

      // Load executions
      const { data: execData, error: execError } = await supabase
        .from('vanguard_script_executions')
        .select('*')
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (!execError && execData) {
        const mappedExecs: ScriptExecution[] = execData.map((e: any) => ({
          id: e.id,
          script_id: e.script_id || '',
          script_name: e.script_name,
          device_count: e.device_count || 0,
          success_count: e.success_count || 0,
          failed_count: e.failed_count || 0,
          status: e.status as ScriptExecution['status'],
          started_at: e.started_at,
          completed_at: e.completed_at,
        }));
        setExecutions(mappedExecs);
      }
    } catch (err) {
      console.error('Failed to load scripts:', err);
      toast.error('Failed to load scripts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAllAgents = () => {
    if (selectedAgents.length === onlineAgents.length) {
      setSelectedAgents([]);
    } else {
      setSelectedAgents(onlineAgents.map(a => a.id));
    }
  };

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const filteredScripts = scripts.filter((script) => {
    const matchesSearch =
      script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || script.category === filterCategory;
    const matchesType = filterType === "all" || script.type === filterType;
    const matchesFavorites = !showFavoritesOnly || script.is_favorite;
    return matchesSearch && matchesCategory && matchesType && matchesFavorites;
  });

  const toggleFavorite = async (scriptId: string) => {
    const script = scripts.find(s => s.id === scriptId);
    if (!script || script.is_builtin) {
      setScripts(scripts.map((s) => (s.id === scriptId ? { ...s, is_favorite: !s.is_favorite } : s)));
      return;
    }

    try {
      const { error } = await supabase
        .from('vanguard_fleet_scripts')
        .update({ is_favorite: !script.is_favorite })
        .eq('id', scriptId);

      if (error) throw error;
      setScripts(scripts.map((s) => (s.id === scriptId ? { ...s, is_favorite: !s.is_favorite } : s)));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleCreateScript = async () => {
    if (!newScript.name || !newScript.content) {
      toast.error('Name and content are required');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('vanguard_fleet_scripts')
        .insert({
          user_id: user?.id,
          name: newScript.name,
          description: newScript.description,
          category: newScript.category,
          script_type: newScript.type,
          content: newScript.content,
          author: 'User',
          tags: newScript.tags.split(",").map((t) => t.trim()).filter(Boolean),
        })
        .select()
        .single();

      if (error) throw error;

      const script: Script = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        category: data.category || 'Custom',
        type: data.script_type as Script['type'],
        content: data.content,
        author: 'User',
        is_favorite: false,
        is_builtin: false,
        execution_count: 0,
        tags: data.tags || [],
      };
      
      setScripts([...builtinScripts, script, ...scripts.filter(s => !s.is_builtin)]);
      setShowCreateDialog(false);
      setNewScript({ name: "", description: "", category: "Custom", type: "powershell", content: "", tags: "" });
      toast.success('Script created');
    } catch (err) {
      console.error('Failed to create script:', err);
      toast.error('Failed to create script');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunScript = async () => {
    if (!selectedScript || selectedAgents.length === 0) {
      toast.error('Please select at least one device');
      return;
    }
    setIsRunning(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Create execution record
      const { data: exec, error } = await supabase
        .from('vanguard_script_executions')
        .insert({
          user_id: user?.id,
          script_id: selectedScript.is_builtin ? null : selectedScript.id,
          script_name: selectedScript.name,
          device_count: selectedAgents.length,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const execution: ScriptExecution = {
        id: exec.id,
        script_id: selectedScript.id,
        script_name: selectedScript.name,
        device_count: selectedAgents.length,
        success_count: 0,
        failed_count: 0,
        status: "running",
        started_at: new Date().toISOString(),
      };

      setExecutions([execution, ...executions]);

      // Queue script execution commands for each selected agent via vanguard-agent-api
      let successCount = 0;
      let failedCount = 0;

      for (const agentId of selectedAgents) {
        try {
          const { error: cmdError } = await supabase.functions.invoke('vanguard-agent-api?action=send_command', {
            body: {
              agent_id: agentId,
              command_type: 'run_script',
              payload: {
                script_id: selectedScript.is_builtin ? null : selectedScript.id,
                script_name: selectedScript.name,
                script_type: selectedScript.type,
                script_content: selectedScript.content,
                execution_id: exec.id,
              }
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });

          if (cmdError) {
            console.error('Failed to queue command for agent:', agentId, cmdError);
            failedCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error('Error sending command to agent:', agentId, err);
          failedCount++;
        }
      }

      // Update execution with initial queue results
      const finalStatus = failedCount === selectedAgents.length ? 'failed' : 
                          successCount === selectedAgents.length ? 'pending' : 'running';

      await supabase
        .from('vanguard_script_executions')
        .update({
          status: finalStatus,
          success_count: successCount,
          failed_count: failedCount,
        })
        .eq('id', exec.id);

      setExecutions((prev) =>
        prev.map((e) =>
          e.id === execution.id
            ? { ...e, status: finalStatus as ScriptExecution['status'], success_count: successCount, failed_count: failedCount }
            : e
        )
      );

      if (successCount > 0) {
        toast.success(`Script "${selectedScript.name}" queued for ${successCount} device(s)`, {
          description: failedCount > 0 ? `${failedCount} device(s) failed to queue` : 'Commands sent to agents'
        });
      } else {
        toast.error('Failed to queue script for any devices');
      }

      setSelectedAgents([]);
    } catch (err) {
      console.error('Failed to run script:', err);
      toast.error('Failed to run script');
    } finally {
      setIsRunning(false);
      setShowRunDialog(false);
    }
  };

  const deleteScript = async (scriptId: string) => {
    try {
      const { error } = await supabase
        .from('vanguard_fleet_scripts')
        .delete()
        .eq('id', scriptId);

      if (error) throw error;
      setScripts(scripts.filter(s => s.id !== scriptId));
      toast.success('Script deleted');
    } catch (err) {
      console.error('Failed to delete script:', err);
      toast.error('Failed to delete script');
    }
  };

  const getTypeIcon = (type: Script["type"]) => {
    switch (type) {
      case "powershell": return <Terminal className="h-4 w-4 text-blue-500" />;
      case "batch": return <FileText className="h-4 w-4 text-yellow-500" />;
      case "bash": return <Terminal className="h-4 w-4 text-green-500" />;
      case "python": return <FileCode className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getResultBadge = (result?: Script["last_result"]) => {
    if (!result) return null;
    const config = {
      success: { icon: CheckCircle, class: "text-green-500", label: "Success" },
      failed: { icon: XCircle, class: "text-red-500", label: "Failed" },
      partial: { icon: AlertTriangle, class: "text-yellow-500", label: "Partial" },
    };
    const { icon: Icon, class: className, label } = config[result];
    return (
      <span className={cn("flex items-center gap-1 text-xs", className)}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="library">Script Library</TabsTrigger>
            <TabsTrigger value="history">Execution History</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Tasks</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Script
            </Button>
          </div>
        </div>

        <TabsContent value="library" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scripts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {scriptCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star className={cn("h-4 w-4 mr-2", showFavoritesOnly && "fill-current")} />
              Favorites
            </Button>
          </div>

          {filteredScripts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scripts found</p>
              <p className="text-sm">Create a new script to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredScripts.map((script) => (
                <Card
                  key={script.id}
                  className="hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => { setSelectedScript(script); setShowRunDialog(true); }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(script.type)}
                        <Badge variant="outline" className="text-xs">{script.category}</Badge>
                        {script.is_builtin && <Badge variant="secondary" className="text-xs">Built-in</Badge>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(script.id); }}
                        >
                          {script.is_favorite ? (
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedScript(script); setShowRunDialog(true); }}>
                              <Play className="h-4 w-4 mr-2" />Run Now
                            </DropdownMenuItem>
                            <DropdownMenuItem><Clock className="h-4 w-4 mr-2" />Schedule</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem><Copy className="h-4 w-4 mr-2" />Duplicate</DropdownMenuItem>
                            <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem><Download className="h-4 w-4 mr-2" />Export</DropdownMenuItem>
                            {!script.is_builtin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-500"
                                  onClick={(e) => { e.stopPropagation(); deleteScript(script.id); }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardTitle className="text-base mt-2">{script.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{script.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          {script.execution_count} runs
                        </span>
                        {script.last_executed && getResultBadge(script.last_result)}
                      </div>
                      {script.last_executed && (
                        <span>{formatDistanceToNow(new Date(script.last_executed), { addSuffix: true })}</span>
                      )}
                    </div>
                    {script.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {script.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-cyan-500" />
                Recent Executions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {executions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No executions yet</p>
                  <p className="text-sm">Run a script to see execution history</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {executions.map((exec) => (
                    <div key={exec.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          exec.status === "running" ? "bg-blue-500/20" :
                          exec.status === "completed" ? "bg-green-500/20" : "bg-red-500/20"
                        )}>
                          {exec.status === "running" ? (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          ) : exec.status === "completed" ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{exec.script_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {exec.device_count} devices • Started {formatDistanceToNow(new Date(exec.started_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-green-500">{exec.success_count} succeeded</p>
                          {exec.failed_count > 0 && (
                            <p className="text-sm text-red-500">{exec.failed_count} failed</p>
                          )}
                        </div>
                        <Badge variant={exec.status === "completed" ? "default" : exec.status === "running" ? "secondary" : "destructive"}>
                          {exec.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Scheduled Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scheduled tasks</p>
                <p className="text-sm">Schedule scripts to run automatically</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Script Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Script</DialogTitle>
            <DialogDescription>Add a custom script to your library</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Script Name</Label>
                <Input
                  value={newScript.name}
                  onChange={(e) => setNewScript({ ...newScript, name: e.target.value })}
                  placeholder="My Script"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newScript.category} onValueChange={(v) => setNewScript({ ...newScript, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scriptCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Script Type</Label>
                <Select value={newScript.type} onValueChange={(v) => setNewScript({ ...newScript, type: v as Script["type"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="powershell">PowerShell</SelectItem>
                    <SelectItem value="batch">Batch</SelectItem>
                    <SelectItem value="bash">Bash</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={newScript.tags}
                  onChange={(e) => setNewScript({ ...newScript, tags: e.target.value })}
                  placeholder="cleanup, maintenance"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newScript.description}
                onChange={(e) => setNewScript({ ...newScript, description: e.target.value })}
                placeholder="What does this script do?"
              />
            </div>
            <div className="space-y-2">
              <Label>Script Content</Label>
              <Textarea
                value={newScript.content}
                onChange={(e) => setNewScript({ ...newScript, content: e.target.value })}
                className="font-mono min-h-[200px]"
                placeholder="# Your script here..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateScript} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Script
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run Script Dialog */}
      <Dialog open={showRunDialog} onOpenChange={(open) => { setShowRunDialog(open); if (!open) setSelectedAgents([]); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Run Script: {selectedScript?.name}</DialogTitle>
            <DialogDescription>{selectedScript?.description}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2">
              {selectedScript && getTypeIcon(selectedScript.type)}
              <Badge variant="outline">{selectedScript?.category}</Badge>
              <Badge variant="secondary">{selectedScript?.type}</Badge>
            </div>
            
            <ScrollArea className="h-[150px] rounded-md border p-4 bg-muted/50">
              <pre className="text-sm font-mono whitespace-pre-wrap">{selectedScript?.content}</pre>
            </ScrollArea>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Target Devices ({selectedAgents.length} selected)</Label>
                <Button variant="ghost" size="sm" onClick={handleSelectAllAgents}>
                  {selectedAgents.length === onlineAgents.length ? 'Deselect All' : 'Select All Online'}
                </Button>
              </div>
              <ScrollArea className="h-[180px] border rounded-lg p-2">
                {agents.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No agents available</p>
                    <p className="text-xs">Deploy Vanguard agents to your devices first</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {agents.map(agent => (
                      <div
                        key={agent.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedAgents.includes(agent.id)}
                          onCheckedChange={() => toggleAgentSelection(agent.id)}
                          disabled={agent.status !== 'online'}
                        />
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <span className={agent.status !== 'online' ? 'text-muted-foreground' : ''}>
                          {agent.name || agent.device_id}
                        </span>
                        <Badge
                          variant={agent.status === 'online' ? 'default' : 'secondary'}
                          className="ml-auto text-xs"
                        >
                          {agent.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRunDialog(false)}>Cancel</Button>
            <Button onClick={handleRunScript} disabled={isRunning || selectedAgents.length === 0}>
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Queuing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run on {selectedAgents.length} Device(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
