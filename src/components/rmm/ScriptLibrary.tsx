import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Library, 
  Search, 
  Download, 
  Star, 
  Play, 
  Eye, 
  Code2,
  Shield,
  Monitor,
  Settings,
  Cloud,
  HardDrive,
  Users
} from "lucide-react";

interface PrebuiltScript {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'maintenance' | 'monitoring' | 'deployment' | 'backup' | 'reporting';
  scriptType: 'powershell' | 'batch' | 'python' | 'bash';
  popularity: number;
  rating: number;
  tags: string[];
  author: string;
  version: string;
  lastUpdated: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    defaultValue?: string;
  }>;
  scriptContent: string;
  requiresElevation: boolean;
  estimatedDuration: string;
  compatibility: string[];
}

interface ScriptLibraryProps {
  onImportScript: (script: PrebuiltScript) => void;
  onExecuteScript: (script: PrebuiltScript) => void;
}

export const ScriptLibrary = ({ onImportScript, onExecuteScript }: ScriptLibraryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [scriptTypeFilter, setScriptTypeFilter] = useState<string>('all');
  const [selectedScript, setSelectedScript] = useState<PrebuiltScript | null>(null);

  // Mock data - replace with real API call
  const prebuiltScripts: PrebuiltScript[] = [
    {
      id: '1',
      name: 'System Health Check',
      description: 'Comprehensive system health monitoring including CPU, memory, disk, and services',
      category: 'monitoring',
      scriptType: 'powershell',
      popularity: 95,
      rating: 4.8,
      tags: ['monitoring', 'health', 'system', 'performance'],
      author: 'UltriumAI',
      version: '2.1.0',
      lastUpdated: '2024-01-15',
      parameters: [
        { name: 'IncludeServices', type: 'boolean', description: 'Include Windows services check', required: false, defaultValue: 'true' },
        { name: 'CPUThreshold', type: 'number', description: 'CPU usage threshold (%)', required: false, defaultValue: '80' }
      ],
      scriptContent: '# System Health Check Script\n# Monitors system performance metrics\n\n...',
      requiresElevation: false,
      estimatedDuration: '2-3 minutes',
      compatibility: ['Windows 10', 'Windows 11', 'Server 2019', 'Server 2022']
    },
    {
      id: '2',
      name: 'Security Patch Installer',
      description: 'Automatically download and install critical security patches',
      category: 'security',
      scriptType: 'powershell',
      popularity: 87,
      rating: 4.6,
      tags: ['security', 'patches', 'updates', 'automation'],
      author: 'UltriumAI',
      version: '1.5.2',
      lastUpdated: '2024-01-10',
      parameters: [
        { name: 'OnlyCritical', type: 'boolean', description: 'Install only critical patches', required: false, defaultValue: 'true' },
        { name: 'RebootAfter', type: 'boolean', description: 'Reboot after installation', required: false, defaultValue: 'false' }
      ],
      scriptContent: '# Security Patch Installer\n# Downloads and installs security patches\n\n...',
      requiresElevation: true,
      estimatedDuration: '10-30 minutes',
      compatibility: ['Windows 10', 'Windows 11', 'Server 2019', 'Server 2022']
    },
    {
      id: '3',
      name: 'Disk Cleanup & Optimization',
      description: 'Clean temporary files, optimize disk space, and defragment drives',
      category: 'maintenance',
      scriptType: 'powershell',
      popularity: 92,
      rating: 4.7,
      tags: ['cleanup', 'optimization', 'disk', 'maintenance'],
      author: 'UltriumAI',
      version: '3.0.1',
      lastUpdated: '2024-01-12',
      parameters: [
        { name: 'IncludeDefrag', type: 'boolean', description: 'Include disk defragmentation', required: false, defaultValue: 'false' },
        { name: 'AggressiveClean', type: 'boolean', description: 'Aggressive cleanup mode', required: false, defaultValue: 'false' }
      ],
      scriptContent: '# Disk Cleanup & Optimization\n# Comprehensive disk maintenance\n\n...',
      requiresElevation: true,
      estimatedDuration: '5-15 minutes',
      compatibility: ['Windows 10', 'Windows 11', 'Server 2019', 'Server 2022']
    },
    {
      id: '4',
      name: 'Antivirus Status Report',
      description: 'Generate comprehensive antivirus status and threat detection report',
      category: 'security',
      scriptType: 'powershell',
      popularity: 78,
      rating: 4.4,
      tags: ['antivirus', 'security', 'reporting', 'threats'],
      author: 'UltriumAI',
      version: '1.2.0',
      lastUpdated: '2024-01-08',
      parameters: [
        { name: 'IncludeHistory', type: 'boolean', description: 'Include threat history', required: false, defaultValue: 'true' },
        { name: 'DaysBack', type: 'number', description: 'Days of history to include', required: false, defaultValue: '30' }
      ],
      scriptContent: '# Antivirus Status Report\n# Generates security status report\n\n...',
      requiresElevation: false,
      estimatedDuration: '1-2 minutes',
      compatibility: ['Windows 10', 'Windows 11', 'Server 2019', 'Server 2022']
    },
    {
      id: '5',
      name: 'Software Inventory Collector',
      description: 'Collect detailed inventory of installed software and versions',
      category: 'reporting',
      scriptType: 'powershell',
      popularity: 85,
      rating: 4.5,
      tags: ['inventory', 'software', 'reporting', 'compliance'],
      author: 'UltriumAI',
      version: '2.0.0',
      lastUpdated: '2024-01-14',
      parameters: [
        { name: 'IncludeUpdates', type: 'boolean', description: 'Include installed updates', required: false, defaultValue: 'false' },
        { name: 'ExportFormat', type: 'string', description: 'Export format (CSV/JSON)', required: false, defaultValue: 'CSV' }
      ],
      scriptContent: '# Software Inventory Collector\n# Collects software inventory data\n\n...',
      requiresElevation: false,
      estimatedDuration: '3-5 minutes',
      compatibility: ['Windows 10', 'Windows 11', 'Server 2019', 'Server 2022']
    }
  ];

  const filteredScripts = prebuiltScripts.filter(script => {
    const matchesSearch = script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || script.category === categoryFilter;
    const matchesType = scriptTypeFilter === 'all' || script.scriptType === scriptTypeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-4 w-4" />;
      case 'maintenance': return <Settings className="h-4 w-4" />;
      case 'monitoring': return <Monitor className="h-4 w-4" />;
      case 'deployment': return <Cloud className="h-4 w-4" />;
      case 'backup': return <HardDrive className="h-4 w-4" />;
      case 'reporting': return <Users className="h-4 w-4" />;
      default: return <Code2 className="h-4 w-4" />;
    }
  };

  const ScriptCard = ({ script }: { script: PrebuiltScript }) => (
    <div className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getCategoryIcon(script.category)}
            <h4 className="font-medium">{script.name}</h4>
            <Badge variant="secondary" className="text-xs">
              v{script.version}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{script.description}</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {script.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
          <span>{script.rating}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span>👤 {script.author}</span>
          <span>📅 {script.lastUpdated}</span>
          <span>⏱️ {script.estimatedDuration}</span>
          {script.requiresElevation && <span>🔒 Admin Required</span>}
        </div>
        <span>↓ {script.popularity}</span>
      </div>
      
      <div className="flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7">
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getCategoryIcon(script.category)}
                {script.name}
              </DialogTitle>
              <DialogDescription>{script.description}</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="parameters">Parameters</TabsTrigger>
                <TabsTrigger value="code">Code Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Category:</strong> {script.category}</div>
                  <div><strong>Script Type:</strong> {script.scriptType}</div>
                  <div><strong>Version:</strong> {script.version}</div>
                  <div><strong>Author:</strong> {script.author}</div>
                  <div><strong>Updated:</strong> {script.lastUpdated}</div>
                  <div><strong>Duration:</strong> {script.estimatedDuration}</div>
                  <div><strong>Elevation:</strong> {script.requiresElevation ? 'Required' : 'Not Required'}</div>
                  <div><strong>Rating:</strong> {script.rating}/5.0</div>
                </div>
                <div>
                  <strong>Compatibility:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {script.compatibility.map(os => (
                      <Badge key={os} variant="outline" className="text-xs">{os}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <strong>Tags:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {script.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="parameters" className="space-y-3">
                {script.parameters.length === 0 ? (
                  <p className="text-muted-foreground">This script has no configurable parameters.</p>
                ) : (
                  script.parameters.map((param, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium">{param.name}</span>
                          {param.required && <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>}
                        </div>
                        <Badge variant="outline" className="text-xs">{param.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{param.description}</p>
                      {param.defaultValue && (
                        <p className="text-xs text-muted-foreground">Default: {param.defaultValue}</p>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="code">
                <ScrollArea className="h-96 bg-muted p-4 rounded font-mono text-sm">
                  <pre>{script.scriptContent}</pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onImportScript(script)}>
                <Download className="h-4 w-4 mr-2" />
                Import to Library
              </Button>
              <Button onClick={() => onExecuteScript(script)}>
                <Play className="h-4 w-4 mr-2" />
                Execute Script
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <Button size="sm" variant="outline" className="h-7" onClick={() => onImportScript(script)}>
          <Download className="h-3 w-3 mr-1" />
          Import
        </Button>
        
        <Button size="sm" className="h-7" onClick={() => onExecuteScript(script)}>
          <Play className="h-3 w-3 mr-1" />
          Execute
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Library className="h-5 w-5 text-primary" />
          Script Library
        </CardTitle>
        <CardDescription>
          Pre-built, tested scripts ready for deployment across your infrastructure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search scripts, tags, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="monitoring">Monitoring</SelectItem>
              <SelectItem value="deployment">Deployment</SelectItem>
              <SelectItem value="backup">Backup</SelectItem>
              <SelectItem value="reporting">Reporting</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scriptTypeFilter} onValueChange={setScriptTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="powershell">PowerShell</SelectItem>
              <SelectItem value="batch">Batch</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="bash">Bash</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div className="text-sm text-muted-foreground mb-2">
          Showing {filteredScripts.length} of {prebuiltScripts.length} scripts
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-3">
            {filteredScripts.map((script) => (
              <ScriptCard key={script.id} script={script} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};