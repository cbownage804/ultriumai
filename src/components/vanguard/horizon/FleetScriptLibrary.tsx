import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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
  status: "running" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
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
    last_executed: "2024-01-14T14:00:00Z",
    last_result: "success",
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
    last_executed: "2024-01-15T11:00:00Z",
    last_result: "success",
    tags: ["health", "monitoring", "diagnostics"],
  },
  {
    id: "builtin-4",
    name: "Install via Chocolatey",
    description: "Installs software using Chocolatey",
    category: "Deployment",
    type: "powershell",
    content: `param([string]$Package)
if (!(Get-Command choco -EA SilentlyContinue)) {
    iex ((New-Object Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}
choco install $Package -y`,
    author: "System",
    is_favorite: false,
    is_builtin: true,
    execution_count: 78,
    last_executed: "2024-01-13T16:30:00Z",
    last_result: "success",
    tags: ["install", "chocolatey"],
  },
];

const mockExecutions: ScriptExecution[] = [
  {
    id: "exec-1",
    script_id: "builtin-1",
    script_name: "Clear Temp Files",
    device_count: 25,
    success_count: 24,
    failed_count: 1,
    status: "completed",
    started_at: "2024-01-15T10:30:00Z",
    completed_at: "2024-01-15T10:35:00Z",
  },
  {
    id: "exec-2",
    script_id: "builtin-3",
    script_name: "System Health Check",
    device_count: 50,
    success_count: 50,
    failed_count: 0,
    status: "completed",
    started_at: "2024-01-15T11:00:00Z",
    completed_at: "2024-01-15T11:02:00Z",
  },
  {
    id: "exec-3",
    script_id: "builtin-2",
    script_name: "Windows Update Status",
    device_count: 5,
    success_count: 3,
    failed_count: 0,
    status: "running",
    started_at: "2024-01-15T11:15:00Z",
  },
];

export function FleetScriptLibrary() {
  const [scripts, setScripts] = useState<Script[]>(builtinScripts);
  const [executions, setExecutions] = useState<ScriptExecution[]>(mockExecutions);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("library");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const [newScript, setNewScript] = useState({
    name: "",
    description: "",
    category: "Custom",
    type: "powershell" as Script["type"],
    content: "",
    tags: "",
  });

  const filteredScripts = scripts.filter((script) => {
    const matchesSearch =
      script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || script.category === filterCategory;
    const matchesType = filterType === "all" || script.type === filterType;
    const matchesFavorites = !showFavoritesOnly || script.is_favorite;
    return matchesSearch && matchesCategory && matchesType && matchesFavorites;
  });

  const toggleFavorite = (scriptId: string) => {
    setScripts(scripts.map((s) => (s.id === scriptId ? { ...s, is_favorite: !s.is_favorite } : s)));
  };

  const handleCreateScript = () => {
    const script: Script = {
      id: `custom-${Date.now()}`,
      name: newScript.name,
      description: newScript.description,
      category: newScript.category,
      type: newScript.type,
      content: newScript.content,
      author: "Current User",
      is_favorite: false,
      is_builtin: false,
      execution_count: 0,
      tags: newScript.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    setScripts([script, ...scripts]);
    setShowCreateDialog(false);
    setNewScript({ name: "", description: "", category: "Custom", type: "powershell", content: "", tags: "" });
  };

  const handleRunScript = async () => {
    if (!selectedScript) return;
    setIsRunning(true);
    
    const execution: ScriptExecution = {
      id: `exec-${Date.now()}`,
      script_id: selectedScript.id,
      script_name: selectedScript.name,
      device_count: 10,
      success_count: 0,
      failed_count: 0,
      status: "running",
      started_at: new Date().toISOString(),
    };
    
    setExecutions([execution, ...executions]);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    setExecutions((prev) =>
      prev.map((e) =>
        e.id === execution.id
          ? { ...e, status: "completed", success_count: 10, completed_at: new Date().toISOString() }
          : e
      )
    );
    
    setIsRunning(false);
    setShowRunDialog(false);
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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="library">Script Library</TabsTrigger>
            <TabsTrigger value="history">Execution History</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Tasks</TabsTrigger>
          </TabsList>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Script
          </Button>
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
                          <DropdownMenuItem><Play className="h-4 w-4 mr-2" />Run Now</DropdownMenuItem>
                          <DropdownMenuItem><Clock className="h-4 w-4 mr-2" />Schedule</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem><Copy className="h-4 w-4 mr-2" />Duplicate</DropdownMenuItem>
                          <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem><Download className="h-4 w-4 mr-2" />Export</DropdownMenuItem>
                          {!script.is_builtin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-500">
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
                        {exec.success_count > 0 && <span className="text-sm text-green-500">{exec.success_count} success</span>}
                        {exec.failed_count > 0 && <span className="text-sm text-red-500 ml-2">{exec.failed_count} failed</span>}
                        {exec.status === "running" && <span className="text-sm text-blue-500">Running...</span>}
                      </div>
                      <Button variant="ghost" size="sm">View Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-cyan-500" />
                Scheduled Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scheduled tasks configured</p>
                <Button variant="link" className="mt-2">Schedule your first task</Button>
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
            <DialogDescription>Create a custom script to run on your managed devices</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Script Name</Label>
                <Input
                  value={newScript.name}
                  onChange={(e) => setNewScript({ ...newScript, name: e.target.value })}
                  placeholder="My Custom Script"
                />
              </div>
              <div className="space-y-2">
                <Label>Script Type</Label>
                <Select
                  value={newScript.type}
                  onValueChange={(v) => setNewScript({ ...newScript, type: v as Script["type"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="powershell">PowerShell</SelectItem>
                    <SelectItem value="batch">Batch</SelectItem>
                    <SelectItem value="bash">Bash</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                  </SelectContent>
                </Select>
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
                placeholder="# Enter your script here..."
                className="font-mono h-64"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateScript} disabled={!newScript.name || !newScript.content}>
              Create Script
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run Script Dialog */}
      <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedScript && getTypeIcon(selectedScript.type)}
              {selectedScript?.name}
            </DialogTitle>
            <DialogDescription>{selectedScript?.description}</DialogDescription>
          </DialogHeader>
          {selectedScript && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <ScrollArea className="h-64">
                  <pre className="text-sm font-mono whitespace-pre-wrap">{selectedScript.content}</pre>
                </ScrollArea>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Target: All Online Devices (10)</span>
                <span>•</span>
                <span>Estimated time: 2-5 minutes</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRunDialog(false)}>Cancel</Button>
            <Button onClick={handleRunScript} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Script
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
