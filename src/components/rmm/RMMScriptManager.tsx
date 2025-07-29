import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRMMDevices } from "@/hooks/useRMMDevices";
import {
  FileCode,
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  Monitor,
  Settings,
  Upload,
  Download,
  Copy,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Terminal,
  Activity,
  Users,
  Calendar,
  AlertTriangle,
  Zap,
  Code,
  Database
} from "lucide-react";

interface Script {
  id: string;
  name: string;
  description: string;
  script_content: string;
  script_type: 'powershell' | 'bash' | 'python' | 'cmd';
  category: string;
  tags: string[];
  version: string;
  is_template: boolean;
  timeout_minutes: number;
  requires_elevation: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  execution_count: number;
  success_rate: number;
}

interface ScriptExecution {
  id: string;
  script_id: string;
  device_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  output: string;
  error_output: string;
  exit_code?: number;
  started_at?: string;
  completed_at?: string;
  execution_time_ms?: number;
  triggered_by: string;
  script: Script;
  device: {
    hostname: string;
    ip_address: string;
    status: string;
  };
}

export const RMMScriptManager = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [executions, setExecutions] = useState<ScriptExecution[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [showCreateScript, setShowCreateScript] = useState(false);
  const [showExecuteScript, setShowExecuteScript] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("scripts");

  const { user } = useAuth();
  const { toast } = useToast();
  const { devices } = useRMMDevices();

  const [newScript, setNewScript] = useState({
    name: '',
    description: '',
    script_content: '',
    script_type: 'powershell',
    category: 'maintenance',
    tags: '',
    timeout_minutes: '30',
    requires_elevation: false
  });

  useEffect(() => {
    loadScripts();
    loadExecutions();
  }, []);

  const loadScripts = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - in real app this would come from database
      const mockScripts: Script[] = [
        {
          id: '1',
          name: 'System Health Check',
          description: 'Comprehensive system health and performance check',
          script_content: `# System Health Check Script
Get-ComputerInfo | Select-Object WindowsProductName, TotalPhysicalMemory, CsProcessors
Get-Disk | Select-Object Number, Size, FreeSpace, HealthStatus
Get-Service | Where-Object Status -eq "Stopped" | Select-Object Name, Status`,
          script_type: 'powershell',
          category: 'diagnostics',
          tags: ['health', 'diagnostics', 'monitoring'],
          version: '1.2.0',
          is_template: false,
          timeout_minutes: 15,
          requires_elevation: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user?.id || '',
          execution_count: 45,
          success_rate: 96.7
        },
        {
          id: '2',
          name: 'Clear Temp Files',
          description: 'Cleans temporary files and browser cache',
          script_content: `# Clear Temp Files Script
$tempPaths = @("$env:TEMP\\*", "$env:LOCALAPPDATA\\Temp\\*", "C:\\Windows\\Temp\\*")
foreach ($path in $tempPaths) {
    Get-ChildItem -Path $path -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
}
Write-Output "Temp files cleared successfully"`,
          script_type: 'powershell',
          category: 'maintenance',
          tags: ['cleanup', 'maintenance', 'storage'],
          version: '2.1.0',
          is_template: false,
          timeout_minutes: 30,
          requires_elevation: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user?.id || '',
          execution_count: 123,
          success_rate: 99.2
        },
        {
          id: '3',
          name: 'Windows Update Check',
          description: 'Check for available Windows updates',
          script_content: `# Windows Update Check
Import-Module PSWindowsUpdate
Get-WUList | Select-Object Title, Size, Description
if ((Get-WUList).Count -eq 0) {
    Write-Output "No updates available"
} else {
    Write-Output "Updates available - review and install as needed"
}`,
          script_type: 'powershell',
          category: 'security',
          tags: ['updates', 'security', 'windows'],
          version: '1.0.0',
          is_template: false,
          timeout_minutes: 10,
          requires_elevation: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user?.id || '',
          execution_count: 78,
          success_rate: 94.9
        }
      ];

      setScripts(mockScripts);
    } catch (error) {
      console.error('Error loading scripts:', error);
      toast({
        title: "Error",
        description: "Failed to load scripts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async () => {
    try {
      // Mock recent executions
      const mockExecutions: ScriptExecution[] = [
        {
          id: '1',
          script_id: '1',
          device_id: 'device-1',
          status: 'completed',
          output: 'System health check completed successfully. All services running normally.',
          error_output: '',
          exit_code: 0,
          started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          execution_time_ms: 120000,
          triggered_by: user?.id || '',
          script: scripts[0] || {} as Script,
          device: {
            hostname: 'WORKSTATION-01',
            ip_address: '192.168.1.100',
            status: 'online'
          }
        },
        {
          id: '2',
          script_id: '2',
          device_id: 'device-2',
          status: 'running',
          output: 'Clearing temporary files...',
          error_output: '',
          started_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          triggered_by: user?.id || '',
          script: scripts[1] || {} as Script,
          device: {
            hostname: 'SERVER-01',
            ip_address: '192.168.1.10',
            status: 'online'
          }
        }
      ];

      setExecutions(mockExecutions);
    } catch (error) {
      console.error('Error loading executions:', error);
    }
  };

  const createScript = async () => {
    if (!newScript.name || !newScript.script_content) {
      toast({
        title: "Error",
        description: "Please fill in name and script content",
        variant: "destructive"
      });
      return;
    }

    try {
      const scriptData: Partial<Script> = {
        name: newScript.name,
        description: newScript.description,
        script_content: newScript.script_content,
        script_type: newScript.script_type as Script['script_type'],
        category: newScript.category,
        tags: newScript.tags.split(',').map(tag => tag.trim()),
        version: '1.0.0',
        is_template: false,
        timeout_minutes: parseInt(newScript.timeout_minutes),
        requires_elevation: newScript.requires_elevation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user?.id || '',
        execution_count: 0,
        success_rate: 0
      };

      // In real app, this would save to database
      console.log('Creating script:', scriptData);

      setNewScript({
        name: '',
        description: '',
        script_content: '',
        script_type: 'powershell',
        category: 'maintenance',
        tags: '',
        timeout_minutes: '30',
        requires_elevation: false
      });
      setShowCreateScript(false);
      loadScripts();

      toast({
        title: "Success",
        description: "Script created successfully"
      });
    } catch (error) {
      console.error('Error creating script:', error);
      toast({
        title: "Error",
        description: "Failed to create script",
        variant: "destructive"
      });
    }
  };

  const executeScript = async () => {
    if (!selectedScript || selectedDevices.length === 0) {
      toast({
        title: "Error",
        description: "Please select a script and at least one device",
        variant: "destructive"
      });
      return;
    }

    try {
      // Execute script on selected devices
      for (const deviceId of selectedDevices) {
        const device = devices.find(d => d.id === deviceId);
        if (!device) continue;

        const executionData = {
          script_id: selectedScript.id,
          device_id: deviceId,
          status: 'pending' as const,
          triggered_by: user?.id || ''
        };

        // In real app, this would queue the execution
        console.log('Executing script:', selectedScript.name, 'on device:', device.hostname);
        
        // Simulate sending command to device agent
        await supabase.functions.invoke('rmm-command', {
          body: {
            device_id: deviceId,
            command_type: 'execute_script',
            payload: {
              script_content: selectedScript.script_content,
              script_type: selectedScript.script_type,
              timeout_minutes: selectedScript.timeout_minutes,
              requires_elevation: selectedScript.requires_elevation
            }
          }
        });
      }

      setSelectedDevices([]);
      setShowExecuteScript(false);
      loadExecutions();

      toast({
        title: "Success",
        description: `Script execution started on ${selectedDevices.length} device(s)`
      });
    } catch (error) {
      console.error('Error executing script:', error);
      toast({
        title: "Error",
        description: "Failed to execute script",
        variant: "destructive"
      });
    }
  };

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || script.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'running': return 'secondary';
      case 'pending': return 'outline';
      case 'failed': return 'destructive';
      case 'timeout': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return Play;
      case 'pending': return Clock;
      case 'failed': return XCircle;
      case 'timeout': return AlertTriangle;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">RMM Script Manager</h1>
          <p className="text-muted-foreground">
            Create, manage, and execute scripts on remote devices
          </p>
        </div>
        <div className="flex gap-2">
          {selectedScript && (
            <Dialog open={showExecuteScript} onOpenChange={setShowExecuteScript}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Execute Script
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Execute Script: {selectedScript.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Target Devices</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                      {devices.map(device => (
                        <div key={device.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={device.id}
                            checked={selectedDevices.includes(device.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDevices(prev => [...prev, device.id]);
                              } else {
                                setSelectedDevices(prev => prev.filter(id => id !== device.id));
                              }
                            }}
                          />
                          <Label htmlFor={device.id} className="text-sm">
                            {device.hostname} ({device.ip_address})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Script Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Type: {selectedScript.script_type}</div>
                      <div>Timeout: {selectedScript.timeout_minutes}m</div>
                      <div>Elevation: {selectedScript.requires_elevation ? 'Required' : 'Not Required'}</div>
                      <div>Success Rate: {selectedScript.success_rate}%</div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowExecuteScript(false)}>
                      Cancel
                    </Button>
                    <Button onClick={executeScript}>
                      Execute on {selectedDevices.length} Device(s)
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          <Dialog open={showCreateScript} onOpenChange={setShowCreateScript}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Script
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Script</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Script Name *</Label>
                    <Input
                      value={newScript.name}
                      onChange={(e) => setNewScript(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Awesome Script"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={newScript.category} onValueChange={(value) => setNewScript(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="diagnostics">Diagnostics</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="deployment">Deployment</SelectItem>
                        <SelectItem value="monitoring">Monitoring</SelectItem>
                        <SelectItem value="backup">Backup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newScript.description}
                    onChange={(e) => setNewScript(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What does this script do?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Script Type</Label>
                    <Select value={newScript.script_type} onValueChange={(value) => setNewScript(prev => ({ ...prev, script_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="powershell">PowerShell</SelectItem>
                        <SelectItem value="bash">Bash</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="cmd">CMD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Timeout (minutes)</Label>
                    <Input
                      type="number"
                      value={newScript.timeout_minutes}
                      onChange={(e) => setNewScript(prev => ({ ...prev, timeout_minutes: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={newScript.tags}
                      onChange={(e) => setNewScript(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="cleanup, maintenance"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requires-elevation"
                    checked={newScript.requires_elevation}
                    onChange={(e) => setNewScript(prev => ({ ...prev, requires_elevation: e.target.checked }))}
                  />
                  <Label htmlFor="requires-elevation">Requires elevated privileges</Label>
                </div>

                <div>
                  <Label>Script Content *</Label>
                  <Textarea
                    value={newScript.script_content}
                    onChange={(e) => setNewScript(prev => ({ ...prev, script_content: e.target.value }))}
                    placeholder="# Enter your script here..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateScript(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createScript}>
                    Create Script
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scripts">Script Library</TabsTrigger>
          <TabsTrigger value="executions">Active Executions</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
        </TabsList>

        <TabsContent value="scripts" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search scripts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="diagnostics">Diagnostics</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="backup">Backup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Scripts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {filteredScripts.map(script => (
                <Card key={script.id} className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedScript?.id === script.id ? 'border-primary' : ''
                }`} onClick={() => setSelectedScript(script)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileCode className="h-4 w-4" />
                          <h3 className="font-semibold">{script.name}</h3>
                          <Badge variant="outline">{script.script_type}</Badge>
                          <Badge variant="secondary">{script.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {script.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>v{script.version}</span>
                          <span>{script.execution_count} runs</span>
                          <span>{script.success_rate}% success</span>
                          {script.requires_elevation && (
                            <Badge variant="outline" className="text-xs">
                              Elevated
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {script.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Script Details */}
            <div>
              {selectedScript ? (
                <Card className="sticky top-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileCode className="h-5 w-5" />
                        {selectedScript.name}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {selectedScript.description}
                      </p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <br />
                        {selectedScript.script_type}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <br />
                        {selectedScript.category}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Version:</span>
                        <br />
                        {selectedScript.version}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Timeout:</span>
                        <br />
                        {selectedScript.timeout_minutes}m
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-sm font-medium">Script Content</Label>
                      <div className="mt-2 bg-muted p-3 rounded-lg overflow-x-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {selectedScript.script_content}
                        </pre>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold">{selectedScript.execution_count}</div>
                        <div className="text-xs text-muted-foreground">Total Runs</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{selectedScript.success_rate}%</div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{selectedScript.timeout_minutes}m</div>
                        <div className="text-xs text-muted-foreground">Max Runtime</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Select a script to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <div className="space-y-4">
            {executions.filter(exec => exec.status === 'running' || exec.status === 'pending').map(execution => {
              const StatusIcon = getStatusIcon(execution.status);
              return (
                <Card key={execution.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-5 w-5" />
                        <div>
                          <h3 className="font-medium">{execution.script?.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Monitor className="h-3 w-3" />
                            {execution.device.hostname} ({execution.device.ip_address})
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {execution.started_at && new Date(execution.started_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    {execution.output && (
                      <div className="mt-3 bg-muted p-3 rounded-lg">
                        <pre className="text-xs font-mono">{execution.output}</pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="space-y-4">
            {executions.filter(exec => exec.status === 'completed' || exec.status === 'failed').map(execution => {
              const StatusIcon = getStatusIcon(execution.status);
              return (
                <Card key={execution.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-5 w-5" />
                        <div>
                          <h3 className="font-medium">{execution.script?.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Monitor className="h-3 w-3" />
                            {execution.device.hostname}
                            {execution.execution_time_ms && (
                              <>
                                <span>•</span>
                                <span>{Math.round(execution.execution_time_ms / 1000)}s</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {execution.completed_at && new Date(execution.completed_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};