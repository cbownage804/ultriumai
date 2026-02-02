import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, Plus, Settings, CheckCircle, AlertTriangle, 
  Clock, Download, RefreshCw, Chrome, FileCode
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ThirdPartyApp {
  id: string;
  name: string;
  publisher: string;
  currentVersion: string;
  latestVersion: string;
  installedCount: number;
  needsUpdate: number;
  autoUpdate: boolean;
  source: 'chocolatey' | 'winget' | 'ninite';
  category: string;
}

const mockApps: ThirdPartyApp[] = [
  { id: '1', name: 'Google Chrome', publisher: 'Google', currentVersion: '120.0.6099.130', latestVersion: '121.0.6167.85', installedCount: 48, needsUpdate: 48, autoUpdate: true, source: 'chocolatey', category: 'Browser' },
  { id: '2', name: 'Mozilla Firefox', publisher: 'Mozilla', currentVersion: '121.0', latestVersion: '122.0', installedCount: 23, needsUpdate: 15, autoUpdate: true, source: 'chocolatey', category: 'Browser' },
  { id: '3', name: 'Adobe Acrobat Reader', publisher: 'Adobe', currentVersion: '23.008.20421', latestVersion: '23.008.20533', installedCount: 52, needsUpdate: 38, autoUpdate: true, source: 'chocolatey', category: 'Document' },
  { id: '4', name: 'Java Runtime', publisher: 'Oracle', currentVersion: '8.0.391', latestVersion: '8.0.401', installedCount: 31, needsUpdate: 31, autoUpdate: false, source: 'chocolatey', category: 'Runtime' },
  { id: '5', name: '7-Zip', publisher: 'Igor Pavlov', currentVersion: '23.01', latestVersion: '24.01', installedCount: 45, needsUpdate: 12, autoUpdate: true, source: 'winget', category: 'Utility' },
  { id: '6', name: 'VLC Media Player', publisher: 'VideoLAN', currentVersion: '3.0.18', latestVersion: '3.0.20', installedCount: 38, needsUpdate: 22, autoUpdate: true, source: 'winget', category: 'Media' },
  { id: '7', name: 'Notepad++', publisher: 'Notepad++', currentVersion: '8.5.8', latestVersion: '8.6.2', installedCount: 42, needsUpdate: 28, autoUpdate: true, source: 'chocolatey', category: 'Development' },
  { id: '8', name: 'Zoom', publisher: 'Zoom', currentVersion: '5.16.10', latestVersion: '5.17.5', installedCount: 35, needsUpdate: 35, autoUpdate: true, source: 'winget', category: 'Communication' },
];

export function ThirdPartyAppPatching() {
  const { toast } = useToast();
  const [apps, setApps] = useState(mockApps);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const toggleAutoUpdate = (id: string) => {
    setApps(prev => prev.map(app => 
      app.id === id ? { ...app, autoUpdate: !app.autoUpdate } : app
    ));
    toast({ title: 'Auto-update setting changed' });
  };

  const updateSelected = () => {
    toast({ 
      title: 'Update initiated',
      description: `Updating ${selectedApps.length} applications via Chocolatey/WinGet`
    });
    setSelectedApps([]);
  };

  const updateAll = () => {
    const count = apps.filter(a => a.needsUpdate > 0).length;
    toast({ 
      title: 'Bulk update initiated',
      description: `Updating ${count} applications across fleet`
    });
  };

  const totalNeedsUpdate = apps.reduce((sum, a) => sum + a.needsUpdate, 0);
  const appsWithUpdates = apps.filter(a => a.needsUpdate > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Third-Party App Patching</h2>
          <p className="text-muted-foreground">Auto-update Chrome, Adobe, Java, and more via Chocolatey/WinGet</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast({ title: 'Scanning for updates...' })}>
            <RefreshCw className="h-4 w-4 mr-2" /> Scan Now
          </Button>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline"><Settings className="h-4 w-4 mr-2" /> Settings</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Third-Party Patching Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Use Chocolatey</Label>
                    <p className="text-xs text-muted-foreground">Primary package manager</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Use WinGet</Label>
                    <p className="text-xs text-muted-foreground">Microsoft package manager</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Scan Schedule</Label>
                    <p className="text-xs text-muted-foreground">Check for updates</p>
                  </div>
                  <Select defaultValue="daily">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Silent Install</Label>
                    <p className="text-xs text-muted-foreground">No user prompts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{apps.length}</div>
            <p className="text-sm text-muted-foreground">Managed Apps</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-400">{appsWithUpdates}</div>
            <p className="text-sm text-muted-foreground">Need Updates</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalNeedsUpdate}</div>
            <p className="text-sm text-muted-foreground">Total Outdated</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">{apps.filter(a => a.autoUpdate).length}</div>
            <p className="text-sm text-muted-foreground">Auto-Update On</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">247</div>
            <p className="text-sm text-muted-foreground">Updated (7d)</p>
          </CardContent>
        </Card>
      </div>

      {/* Update All Banner */}
      {appsWithUpdates > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
                <div>
                  <p className="font-medium">{appsWithUpdates} applications have updates available</p>
                  <p className="text-sm text-muted-foreground">{totalNeedsUpdate} endpoints with outdated software</p>
                </div>
              </div>
              <Button onClick={updateAll}>
                <Download className="h-4 w-4 mr-2" /> Update All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Applications</TabsTrigger>
          <TabsTrigger value="outdated">Needs Update ({appsWithUpdates})</TabsTrigger>
          <TabsTrigger value="sources">Package Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {selectedApps.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
              <span>{selectedApps.length} applications selected</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={updateSelected}>
                  <Download className="h-4 w-4 mr-2" /> Update Selected
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedApps([])}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedApps.length === apps.filter(a => a.needsUpdate > 0).length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedApps(apps.filter(a => a.needsUpdate > 0).map(a => a.id));
                        } else {
                          setSelectedApps([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Latest</TableHead>
                  <TableHead>Installed</TableHead>
                  <TableHead>Outdated</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Auto</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map(app => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedApps.includes(app.id)}
                        disabled={app.needsUpdate === 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedApps(prev => [...prev, app.id]);
                          } else {
                            setSelectedApps(prev => prev.filter(id => id !== app.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{app.name}</p>
                          <p className="text-xs text-muted-foreground">{app.publisher}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{app.category}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{app.currentVersion}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {app.latestVersion !== app.currentVersion ? (
                        <span className="text-green-400">{app.latestVersion}</span>
                      ) : (
                        app.latestVersion
                      )}
                    </TableCell>
                    <TableCell>{app.installedCount}</TableCell>
                    <TableCell>
                      {app.needsUpdate > 0 ? (
                        <Badge className="bg-yellow-500/20 text-yellow-400">{app.needsUpdate}</Badge>
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {app.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={app.autoUpdate}
                        onCheckedChange={() => toggleAutoUpdate(app.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" disabled={app.needsUpdate === 0}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="outdated">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead>Current → Latest</TableHead>
                  <TableHead>Outdated Endpoints</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.filter(a => a.needsUpdate > 0).map(app => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{app.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {app.currentVersion} → <span className="text-green-400">{app.latestVersion}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-500/20 text-yellow-400">{app.needsUpdate} devices</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm">
                        <Download className="h-4 w-4 mr-2" /> Update All
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Chocolatey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Managed Apps</span>
                    <span className="font-medium">{apps.filter(a => a.source === 'chocolatey').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Sync</span>
                    <span className="text-muted-foreground">2 hours ago</span>
                  </div>
                  <Button className="w-full" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" /> Sync Repository
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  WinGet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Managed Apps</span>
                    <span className="font-medium">{apps.filter(a => a.source === 'winget').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Sync</span>
                    <span className="text-muted-foreground">1 hour ago</span>
                  </div>
                  <Button className="w-full" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" /> Sync Repository
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
