import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Plus, Settings, RefreshCw, CheckCircle, XCircle,
  ArrowRightLeft, Server, FileText, Link2, Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentationConnection {
  id: string;
  name: string;
  platform: 'itglue' | 'hudu' | 'passportal' | 'confluence';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  syncedDocs: number;
  syncedAssets: number;
  syncedPasswords: number;
  autoSync: boolean;
}

const mockConnections: DocumentationConnection[] = [
  {
    id: '1',
    name: 'IT Glue Production',
    platform: 'itglue',
    status: 'connected',
    lastSync: '5 minutes ago',
    syncedDocs: 1234,
    syncedAssets: 567,
    syncedPasswords: 89,
    autoSync: true
  },
  {
    id: '2',
    name: 'Hudu Backup',
    platform: 'hudu',
    status: 'connected',
    lastSync: '1 hour ago',
    syncedDocs: 892,
    syncedAssets: 345,
    syncedPasswords: 67,
    autoSync: false
  },
];

const syncMappings = [
  { vanguard: 'Device Info', doc: 'Configuration', direction: 'bidirectional', enabled: true },
  { vanguard: 'Software Inventory', doc: 'Asset Applications', direction: 'rmm_to_doc', enabled: true },
  { vanguard: 'Network Config', doc: 'Network Configurations', direction: 'bidirectional', enabled: true },
  { vanguard: 'User Accounts', doc: 'Contacts', direction: 'rmm_to_doc', enabled: false },
  { vanguard: 'Credentials', doc: 'Passwords', direction: 'doc_to_rmm', enabled: true },
];

export function DocumentationPlatformIntegration() {
  const { toast } = useToast();
  const [connections, setConnections] = useState(mockConnections);
  const [showAddConnection, setShowAddConnection] = useState(false);

  const toggleAutoSync = (id: string) => {
    setConnections(prev => prev.map(c => 
      c.id === id ? { ...c, autoSync: !c.autoSync } : c
    ));
    toast({ title: 'Auto-sync updated' });
  };

  const syncNow = (connection: DocumentationConnection) => {
    toast({ 
      title: 'Sync initiated',
      description: `Syncing device info to ${connection.name}...`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500/20 text-green-400';
      case 'disconnected': return 'bg-muted text-muted-foreground';
      case 'error': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'itglue': return 'IT Glue';
      case 'hudu': return 'Hudu';
      case 'passportal': return 'Passportal';
      case 'confluence': return 'Confluence';
      default: return platform;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documentation Platform Integration</h2>
          <p className="text-muted-foreground">Auto-sync device info to IT Glue, Hudu, and other documentation platforms</p>
        </div>
        <Dialog open={showAddConnection} onOpenChange={setShowAddConnection}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Connect Platform</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Documentation Platform</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Platform</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="itglue">IT Glue</SelectItem>
                    <SelectItem value="hudu">Hudu</SelectItem>
                    <SelectItem value="passportal">Passportal</SelectItem>
                    <SelectItem value="confluence">Confluence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Connection Name</Label>
                <Input placeholder="e.g., IT Glue Production" />
              </div>
              <div>
                <Label>API URL</Label>
                <Input placeholder="https://api.itglue.com/..." />
              </div>
              <div>
                <Label>API Key</Label>
                <Input type="password" placeholder="Your API key" />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="auto-sync" defaultChecked />
                <Label htmlFor="auto-sync">Enable automatic sync</Label>
              </div>
              <Button className="w-full" onClick={() => setShowAddConnection(false)}>
                Connect Platform
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{connections.filter(c => c.status === 'connected').length}</div>
            <p className="text-sm text-muted-foreground">Connected Platforms</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {connections.reduce((sum, c) => sum + c.syncedDocs, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Synced Documents</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {connections.reduce((sum, c) => sum + c.syncedAssets, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Synced Assets</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">99.8%</div>
            <p className="text-sm text-muted-foreground">Sync Success Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Connections */}
      <div className="grid grid-cols-2 gap-4">
        {connections.map(connection => (
          <Card key={connection.id} className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{connection.name}</h3>
                    <p className="text-sm text-muted-foreground">{getPlatformLabel(connection.platform)}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(connection.status)}>
                  {connection.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{connection.syncedDocs}</p>
                  <p className="text-xs text-muted-foreground">Documents</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{connection.syncedAssets}</p>
                  <p className="text-xs text-muted-foreground">Assets</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{connection.syncedPasswords}</p>
                  <p className="text-xs text-muted-foreground">Passwords</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  Last sync: {connection.lastSync}
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={connection.autoSync}
                    onCheckedChange={() => toggleAutoSync(connection.id)}
                  />
                  <Button size="sm" variant="ghost" onClick={() => syncNow(connection)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="mappings">
        <TabsList>
          <TabsTrigger value="mappings">Data Mappings</TabsTrigger>
          <TabsTrigger value="templates">Document Templates</TabsTrigger>
          <TabsTrigger value="activity">Sync Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="mappings">
          <Card>
            <CardHeader>
              <CardTitle>Field Mappings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vanguard Data</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Documentation Field</TableHead>
                    <TableHead>Enabled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncMappings.map((mapping, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{mapping.vanguard}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {mapping.direction === 'bidirectional' && <ArrowRightLeft className="h-4 w-4" />}
                          {mapping.direction === 'rmm_to_doc' && <span>→</span>}
                          {mapping.direction === 'doc_to_rmm' && <span>←</span>}
                          <span className="text-xs text-muted-foreground capitalize">
                            {mapping.direction.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{mapping.doc}</TableCell>
                      <TableCell>
                        <Switch checked={mapping.enabled} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Document Templates</CardTitle>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Template</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: 'Server Documentation', fields: 12, lastUsed: '1 hour ago' },
                  { name: 'Workstation Setup', fields: 8, lastUsed: '3 hours ago' },
                  { name: 'Network Device', fields: 15, lastUsed: '1 day ago' },
                ].map((template, i) => (
                  <Card key={i} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium">{template.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{template.fields} fields</p>
                      <p className="text-xs text-muted-foreground">Last used: {template.lastUsed}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { time: '5 min ago', action: 'Synced WKS-001 to IT Glue', status: 'success' },
                  { time: '12 min ago', action: 'Updated 15 asset configurations', status: 'success' },
                  { time: '1 hour ago', action: 'Created new documentation for SRV-DC02', status: 'success' },
                  { time: '2 hours ago', action: 'Password sync failed - API rate limit', status: 'error' },
                  { time: '3 hours ago', action: 'Bulk sync completed - 45 assets', status: 'success' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      {log.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <span className="text-sm">{log.action}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{log.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
