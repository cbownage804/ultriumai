import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, Settings, CheckCircle, AlertTriangle, 
  Download, RefreshCw, FileCode, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

export function ThirdPartyAppPatching() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [apps, setApps] = useState<ThirdPartyApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (user?.id) fetchSoftware();
  }, [user?.id]);

  const fetchSoftware = async () => {
    if (!user?.id) return;
    setLoading(true);
    
    const { data } = await (supabase as any)
      .from('vanguard_software_audit')
      .select('*')
      .eq('user_id', user.id);

    if (data && data.length > 0) {
      // Group by software name to get fleet-wide view
      const grouped = new Map<string, ThirdPartyApp>();
      for (const sw of data) {
        const key = sw.software_name?.toLowerCase() || sw.id;
        const existing = grouped.get(key);
        if (existing) {
          existing.installedCount++;
          if (sw.installed_version !== sw.latest_version && sw.latest_version) {
            existing.needsUpdate++;
          }
        } else {
          grouped.set(key, {
            id: sw.id,
            name: sw.software_name || 'Unknown',
            publisher: sw.publisher || 'Unknown',
            currentVersion: sw.installed_version || '0.0.0',
            latestVersion: sw.latest_version || sw.installed_version || '0.0.0',
            installedCount: 1,
            needsUpdate: sw.installed_version !== sw.latest_version && sw.latest_version ? 1 : 0,
            autoUpdate: sw.is_approved ?? true,
            source: 'chocolatey',
            category: sw.category || 'General',
          });
        }
      }
      setApps(Array.from(grouped.values()));
    }
    setLoading(false);
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Third-Party App Patching</h2>
          <p className="text-muted-foreground">Auto-update Chrome, Adobe, Java, and more via Chocolatey/WinGet</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchSoftware(); toast({ title: 'Scanning for updates...' }); }}>
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
            <div className="text-2xl font-bold">{apps.reduce((s, a) => s + a.installedCount, 0)}</div>
            <p className="text-sm text-muted-foreground">Total Installs</p>
          </CardContent>
        </Card>
      </div>

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

      {apps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No software inventory data</h3>
            <p className="text-sm text-muted-foreground">Software will appear here once agents report their installed applications.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedApps.length === apps.filter(a => a.needsUpdate > 0).length && selectedApps.length > 0}
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
                  <TableCell><Badge variant="outline">{app.category}</Badge></TableCell>
                  <TableCell className="font-mono text-sm">{app.currentVersion}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {app.latestVersion !== app.currentVersion ? (
                      <span className="text-green-400">{app.latestVersion}</span>
                    ) : app.latestVersion}
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
                    <Switch checked={app.autoUpdate} onCheckedChange={() => toggleAutoUpdate(app.id)} />
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
      )}
    </div>
  );
}
