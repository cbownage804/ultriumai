import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Monitor,
  Search,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface Software {
  id: string;
  name: string;
  version: string;
  source: 'chocolatey' | 'winget';
  description?: string;
}

interface Agent {
  id: string;
  device_name: string;
  os_type: string;
  status: string;
}

interface DeploymentResult {
  deviceId: string;
  deviceName: string;
  packageName: string;
  status: 'pending' | 'installing' | 'success' | 'failed';
  message?: string;
}

const POPULAR_PACKAGES: Software[] = [
  { id: '1', name: 'Google Chrome', version: 'latest', source: 'chocolatey', description: 'Web browser' },
  { id: '2', name: '7-Zip', version: 'latest', source: 'chocolatey', description: 'File archiver' },
  { id: '3', name: 'Visual Studio Code', version: 'latest', source: 'winget', description: 'Code editor' },
  { id: '4', name: 'Adobe Reader', version: 'latest', source: 'chocolatey', description: 'PDF reader' },
  { id: '5', name: 'Notepad++', version: 'latest', source: 'chocolatey', description: 'Text editor' },
  { id: '6', name: 'VLC Media Player', version: 'latest', source: 'chocolatey', description: 'Media player' },
  { id: '7', name: 'Microsoft Teams', version: 'latest', source: 'winget', description: 'Collaboration' },
  { id: '8', name: 'Zoom', version: 'latest', source: 'chocolatey', description: 'Video conferencing' },
];

interface MassSoftwareDeploymentProps {
  agents: Agent[];
}

export function MassSoftwareDeployment({ agents }: MassSoftwareDeploymentProps) {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Software[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [packageSearch, setPackageSearch] = useState('');
  const [action, setAction] = useState<'install' | 'uninstall'>('install');
  const [source, setSource] = useState<'chocolatey' | 'winget'>('chocolatey');
  const [isDeploying, setIsDeploying] = useState(false);
  const [results, setResults] = useState<DeploymentResult[]>([]);
  const [tab, setTab] = useState<'configure' | 'results'>('configure');

  const filteredAgents = agents.filter(a =>
    a.device_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    a.status === 'online'
  );

  const filteredPackages = POPULAR_PACKAGES.filter(p =>
    p.name.toLowerCase().includes(packageSearch.toLowerCase()) &&
    p.source === source
  );

  const handleDeploy = async () => {
    if (selectedDevices.length === 0 || selectedPackages.length === 0) {
      toast.error('Select devices and packages');
      return;
    }

    setIsDeploying(true);
    setTab('results');
    
    // Initialize results
    const initialResults: DeploymentResult[] = [];
    for (const device of selectedDevices) {
      for (const pkg of selectedPackages) {
        initialResults.push({
          deviceId: device,
          deviceName: agents.find(a => a.id === device)?.device_name || 'Unknown',
          packageName: pkg.name,
          status: 'pending',
        });
      }
    }
    setResults(initialResults);

    // Simulate deployment
    for (let i = 0; i < initialResults.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
      
      setResults(prev => prev.map((r, idx) => {
        if (idx === i) {
          const success = Math.random() > 0.15;
          return {
            ...r,
            status: success ? 'success' : 'failed',
            message: success 
              ? `${action === 'install' ? 'Installed' : 'Uninstalled'} successfully`
              : 'Installation failed: Package not found',
          };
        }
        if (idx === i + 1) {
          return { ...r, status: 'installing' };
        }
        return r;
      }));
    }

    setIsDeploying(false);
    toast.success('Deployment completed');
  };

  const completedCount = results.filter(r => r.status === 'success' || r.status === 'failed').length;
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const progress = results.length > 0 ? (completedCount / results.length) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Mass Software Deployment
          </CardTitle>
          <div className="flex gap-2">
            <Select value={action} onValueChange={(v: any) => setAction(v)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="install">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Install
                  </div>
                </SelectItem>
                <SelectItem value="uninstall">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Uninstall
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
          <TabsList className="mb-4">
            <TabsTrigger value="configure">Configure</TabsTrigger>
            <TabsTrigger value="results" disabled={results.length === 0}>
              Results
              {results.length > 0 && (
                <Badge variant="outline" className="ml-2">{completedCount}/{results.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Device Selection */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Target Devices ({selectedDevices.length})
                    </h4>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter devices..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {filteredAgents.map((agent) => (
                        <div
                          key={agent.id}
                          className="flex items-center gap-3 p-2 border rounded hover:bg-accent/50 cursor-pointer"
                          onClick={() => {
                            if (selectedDevices.includes(agent.id)) {
                              setSelectedDevices(selectedDevices.filter(id => id !== agent.id));
                            } else {
                              setSelectedDevices([...selectedDevices, agent.id]);
                            }
                          }}
                        >
                          <Checkbox checked={selectedDevices.includes(agent.id)} />
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{agent.device_name}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Package Selection */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Packages ({selectedPackages.length})
                    </h4>
                    <Select value={source} onValueChange={(v: any) => setSource(v)}>
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chocolatey">Chocolatey</SelectItem>
                        <SelectItem value="winget">WinGet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search packages..."
                      value={packageSearch}
                      onChange={(e) => setPackageSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {filteredPackages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="flex items-center gap-3 p-2 border rounded hover:bg-accent/50 cursor-pointer"
                          onClick={() => {
                            if (selectedPackages.find(p => p.id === pkg.id)) {
                              setSelectedPackages(selectedPackages.filter(p => p.id !== pkg.id));
                            } else {
                              setSelectedPackages([...selectedPackages, pkg]);
                            }
                          }}
                        >
                          <Checkbox checked={!!selectedPackages.find(p => p.id === pkg.id)} />
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{pkg.name}</div>
                            <div className="text-xs text-muted-foreground">{pkg.description}</div>
                          </div>
                          <Badge variant="secondary" className="text-xs">{pkg.version}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <Button
              className="w-full"
              onClick={handleDeploy}
              disabled={selectedDevices.length === 0 || selectedPackages.length === 0 || isDeploying}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  {action === 'install' ? <Download className="h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  {action === 'install' ? 'Install' : 'Uninstall'} {selectedPackages.length} Package(s) on {selectedDevices.length} Device(s)
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="results">
            {isDeploying && (
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Deployment Progress</span>
                  <span>{completedCount} of {results.length} completed</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
            
            <div className="flex gap-4 mb-4">
              <Badge variant="outline" className="bg-green-500/10 text-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {successCount} Success
              </Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-600">
                <XCircle className="h-3 w-3 mr-1" />
                {failedCount} Failed
              </Badge>
            </div>

            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{result.deviceName}</TableCell>
                      <TableCell>{result.packageName}</TableCell>
                      <TableCell>
                        {result.status === 'pending' && <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>}
                        {result.status === 'installing' && <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Installing</Badge>}
                        {result.status === 'success' && <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Success</Badge>}
                        {result.status === 'failed' && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{result.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
