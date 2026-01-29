import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileCode,
  Play,
  Plus,
  Search,
  Terminal,
  Clock,
  Star,
  StarOff,
  Copy,
  Trash2,
  Package,
} from "lucide-react";
import { toast } from "sonner";

interface Script {
  id: string;
  name: string;
  description: string;
  category: string;
  shell: "powershell" | "bash" | "cmd" | "python";
  content: string;
  isFavorite: boolean;
  lastRun?: string;
  runCount: number;
}

interface ScriptLibraryProps {
  agentId: string;
  sendCommand: (cmd: string, payload?: any) => Promise<any>;
}

const BUILT_IN_SCRIPTS: Script[] = [
  {
    id: "sys-info",
    name: "System Information",
    description: "Get detailed system information",
    category: "System",
    shell: "powershell",
    content: "Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsHardwareAbstractionLayer, CsName, CsProcessors, CsTotalPhysicalMemory",
    isFavorite: false,
    runCount: 0,
  },
  {
    id: "disk-space",
    name: "Disk Space Report",
    description: "Check disk space on all drives",
    category: "Storage",
    shell: "powershell",
    content: "Get-WmiObject Win32_LogicalDisk | Select-Object DeviceID, @{N='Size(GB)';E={[math]::Round($_.Size/1GB,2)}}, @{N='Free(GB)';E={[math]::Round($_.FreeSpace/1GB,2)}}, @{N='%Free';E={[math]::Round($_.FreeSpace/$_.Size*100,1)}}",
    isFavorite: true,
    runCount: 5,
  },
  {
    id: "running-services",
    name: "Running Services",
    description: "List all running Windows services",
    category: "Services",
    shell: "powershell",
    content: "Get-Service | Where-Object {$_.Status -eq 'Running'} | Select-Object Name, DisplayName, Status | Sort-Object DisplayName",
    isFavorite: false,
    runCount: 2,
  },
  {
    id: "top-processes",
    name: "Top CPU Processes",
    description: "Get top 10 processes by CPU usage",
    category: "Performance",
    shell: "powershell",
    content: "Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name, CPU, Id, WorkingSet64",
    isFavorite: true,
    runCount: 10,
  },
  {
    id: "installed-software",
    name: "Installed Software",
    description: "List all installed applications",
    category: "Software",
    shell: "powershell",
    content: "Get-WmiObject -Class Win32_Product | Select-Object Name, Version, Vendor | Sort-Object Name",
    isFavorite: false,
    runCount: 1,
  },
  {
    id: "network-config",
    name: "Network Configuration",
    description: "Get network adapter configuration",
    category: "Network",
    shell: "powershell",
    content: "Get-NetIPConfiguration | Select-Object InterfaceAlias, IPv4Address, IPv4DefaultGateway, DNSServer",
    isFavorite: false,
    runCount: 0,
  },
  {
    id: "windows-updates",
    name: "Check Windows Updates",
    description: "List pending Windows updates",
    category: "Updates",
    shell: "powershell",
    content: `$UpdateSession = New-Object -ComObject Microsoft.Update.Session
$UpdateSearcher = $UpdateSession.CreateUpdateSearcher()
$Updates = $UpdateSearcher.Search("IsInstalled=0")
$Updates.Updates | Select-Object Title, @{N='KB';E={$_.KBArticleIDs}}, @{N='Size(MB)';E={[math]::Round($_.MaxDownloadSize/1MB,2)}}`,
    isFavorite: true,
    runCount: 3,
  },
  {
    id: "clear-temp",
    name: "Clear Temp Files",
    description: "Remove temporary files to free disk space",
    category: "Maintenance",
    shell: "powershell",
    content: `$TempFolders = @($env:TEMP, "$env:SystemRoot\\Temp")
$TotalCleared = 0
foreach ($folder in $TempFolders) {
    $Files = Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue
    $TotalCleared += ($Files | Measure-Object -Property Length -Sum).Sum
    Remove-Item -Path "$folder\\*" -Recurse -Force -ErrorAction SilentlyContinue
}
"Cleared: {0:N2} MB" -f ($TotalCleared / 1MB)`,
    isFavorite: false,
    runCount: 0,
  },
];

const CHOCOLATEY_PACKAGES = [
  { id: "googlechrome", name: "Google Chrome", category: "Browsers" },
  { id: "firefox", name: "Firefox", category: "Browsers" },
  { id: "7zip", name: "7-Zip", category: "Utilities" },
  { id: "notepadplusplus", name: "Notepad++", category: "Editors" },
  { id: "vscode", name: "VS Code", category: "Editors" },
  { id: "vlc", name: "VLC Media Player", category: "Media" },
  { id: "zoom", name: "Zoom", category: "Communication" },
  { id: "slack", name: "Slack", category: "Communication" },
  { id: "git", name: "Git", category: "Development" },
  { id: "nodejs", name: "Node.js", category: "Development" },
  { id: "python", name: "Python", category: "Development" },
  { id: "adobereader", name: "Adobe Reader", category: "Productivity" },
];

export function ScriptLibrary({ agentId, sendCommand }: ScriptLibraryProps) {
  const [scripts, setScripts] = useState<Script[]>(BUILT_IN_SCRIPTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [packageSearch, setPackageSearch] = useState("");
  const [newScript, setNewScript] = useState({
    name: "",
    description: "",
    category: "Custom",
    shell: "powershell" as const,
    content: "",
  });

  const categories = ["all", ...new Set(scripts.map((s) => s.category))];

  const filteredScripts = scripts.filter((script) => {
    const matchesSearch =
      script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || script.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredPackages = CHOCOLATEY_PACKAGES.filter(
    (pkg) =>
      pkg.name.toLowerCase().includes(packageSearch.toLowerCase()) ||
      pkg.id.toLowerCase().includes(packageSearch.toLowerCase())
  );

  const runScript = async (script: Script) => {
    setIsRunning(script.id);
    try {
      await sendCommand("run_script", {
        script: script.content,
        shell: script.shell,
      });
      
      // Update run count
      setScripts((prev) =>
        prev.map((s) =>
          s.id === script.id
            ? { ...s, runCount: s.runCount + 1, lastRun: new Date().toISOString() }
            : s
        )
      );
      
      toast.success(`Script "${script.name}" queued for execution`);
    } catch (err) {
      toast.error("Failed to run script");
    } finally {
      setIsRunning(null);
    }
  };

  const toggleFavorite = (scriptId: string) => {
    setScripts((prev) =>
      prev.map((s) =>
        s.id === scriptId ? { ...s, isFavorite: !s.isFavorite } : s
      )
    );
  };

  const createScript = () => {
    const script: Script = {
      id: `custom-${Date.now()}`,
      ...newScript,
      isFavorite: false,
      runCount: 0,
    };
    setScripts((prev) => [...prev, script]);
    setCreateDialogOpen(false);
    setNewScript({
      name: "",
      description: "",
      category: "Custom",
      shell: "powershell",
      content: "",
    });
    toast.success("Script created");
  };

  const installPackage = async (packageId: string, manager: "chocolatey" | "winget") => {
    try {
      await sendCommand("install_package", { manager, package: packageId });
      toast.success(`Installing ${packageId} via ${manager}`);
    } catch (err) {
      toast.error("Failed to install package");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Script Library
            </CardTitle>
            <CardDescription>
              Pre-built and custom scripts for device management
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Script
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Script</DialogTitle>
                <DialogDescription>
                  Add a custom script to the library
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Script Name</Label>
                    <Input
                      value={newScript.name}
                      onChange={(e) =>
                        setNewScript({ ...newScript, name: e.target.value })
                      }
                      placeholder="My Custom Script"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shell</Label>
                    <Select
                      value={newScript.shell}
                      onValueChange={(v: any) =>
                        setNewScript({ ...newScript, shell: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="powershell">PowerShell</SelectItem>
                        <SelectItem value="cmd">CMD</SelectItem>
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
                    onChange={(e) =>
                      setNewScript({ ...newScript, description: e.target.value })
                    }
                    placeholder="What does this script do?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Script Content</Label>
                  <Textarea
                    value={newScript.content}
                    onChange={(e) =>
                      setNewScript({ ...newScript, content: e.target.value })
                    }
                    placeholder="Enter your script here..."
                    className="font-mono min-h-[200px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createScript} disabled={!newScript.name || !newScript.content}>
                  Create Script
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scripts">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scripts">
              <Terminal className="h-4 w-4 mr-2" />
              Scripts
            </TabsTrigger>
            <TabsTrigger value="packages">
              <Package className="h-4 w-4 mr-2" />
              Software Packages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scripts" className="space-y-4 mt-4">
            {/* Search and filter */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search scripts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Favorites section */}
            {scripts.some((s) => s.isFavorite) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Favorites
                </h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {scripts
                    .filter((s) => s.isFavorite)
                    .map((script) => (
                      <ScriptCard
                        key={script.id}
                        script={script}
                        isRunning={isRunning === script.id}
                        onRun={() => runScript(script)}
                        onToggleFavorite={() => toggleFavorite(script.id)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* All scripts */}
            <ScrollArea className="h-[400px]">
              <div className="grid gap-2 md:grid-cols-2 pr-4">
                {filteredScripts.map((script) => (
                  <ScriptCard
                    key={script.id}
                    script={script}
                    isRunning={isRunning === script.id}
                    onRun={() => runScript(script)}
                    onToggleFavorite={() => toggleFavorite(script.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="packages" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                value={packageSearch}
                onChange={(e) => setPackageSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[400px]">
              <div className="grid gap-2 md:grid-cols-2 pr-4">
                {filteredPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{pkg.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {pkg.category}
                        </Badge>
                        <code className="text-xs text-muted-foreground">{pkg.id}</code>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => installPackage(pkg.id, "chocolatey")}
                      >
                        Choco
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => installPackage(pkg.id, "winget")}
                      >
                        WinGet
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ScriptCard({
  script,
  isRunning,
  onRun,
  onToggleFavorite,
}: {
  script: Script;
  isRunning: boolean;
  onRun: () => void;
  onToggleFavorite: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyScript = () => {
    navigator.clipboard.writeText(script.content);
    setCopied(true);
    toast.success("Script copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const shellColors: Record<string, string> = {
    powershell: "bg-blue-500/10 text-blue-600",
    bash: "bg-green-500/10 text-green-600",
    cmd: "bg-gray-500/10 text-gray-600",
    python: "bg-yellow-500/10 text-yellow-600",
  };

  return (
    <div className="p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{script.name}</p>
            <Badge variant="outline" className={`text-xs ${shellColors[script.shell]}`}>
              {script.shell}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {script.description}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {script.runCount}
            </span>
            {script.lastRun && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(script.lastRun).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            className="h-7"
            onClick={onRun}
            disabled={isRunning}
          >
            <Play className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7"
            onClick={onToggleFavorite}
          >
            {script.isFavorite ? (
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            ) : (
              <StarOff className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7"
            onClick={copyScript}
          >
            {copied ? <Copy className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
