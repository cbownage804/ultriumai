import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Link2, Plus, RefreshCw, CheckCircle, XCircle, Clock,
  ArrowRightLeft, Settings, Ticket, Server, Users, FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PSAConnection {
  id: string;
  name: string;
  type: 'vanguard_response' | 'connectwise' | 'autotask' | 'halo' | 'syncro';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  syncedItems: {
    tickets: number;
    assets: number;
    contacts: number;
    companies: number;
  };
  autoSync: boolean;
  syncDirection: 'bidirectional' | 'psa_to_rmm' | 'rmm_to_psa';
}

const mockConnections: PSAConnection[] = [
  {
    id: '1',
    name: 'Vanguard Response',
    type: 'vanguard_response',
    status: 'connected',
    lastSync: '2 minutes ago',
    syncedItems: { tickets: 1234, assets: 456, contacts: 789, companies: 45 },
    autoSync: true,
    syncDirection: 'bidirectional'
  },
  {
    id: '2',
    name: 'ConnectWise Manage',
    type: 'connectwise',
    status: 'connected',
    lastSync: '15 minutes ago',
    syncedItems: { tickets: 892, assets: 234, contacts: 567, companies: 32 },
    autoSync: true,
    syncDirection: 'bidirectional'
  },
  {
    id: '3',
    name: 'Datto Autotask',
    type: 'autotask',
    status: 'disconnected',
    lastSync: '3 days ago',
    syncedItems: { tickets: 0, assets: 0, contacts: 0, companies: 0 },
    autoSync: false,
    syncDirection: 'bidirectional'
  },
];

const syncLogs = [
  { time: '2 min ago', type: 'ticket', action: 'Created ticket #4521 in Vanguard Response', status: 'success' },
  { time: '5 min ago', type: 'asset', action: 'Synced 12 assets to ConnectWise', status: 'success' },
  { time: '15 min ago', type: 'contact', action: 'Updated 3 contacts in Vanguard Response', status: 'success' },
  { time: '1 hour ago', type: 'ticket', action: 'Failed to sync ticket #4518', status: 'error' },
  { time: '2 hours ago', type: 'company', action: 'Created new company: Acme Corp', status: 'success' },
];

export function PSASyncIntegration() {
  const { toast } = useToast();
  const [connections, setConnections] = useState(mockConnections);
  const [showAddConnection, setShowAddConnection] = useState(false);

  const toggleAutoSync = (id: string) => {
    setConnections(prev => prev.map(c => 
      c.id === id ? { ...c, autoSync: !c.autoSync } : c
    ));
    toast({ title: 'Auto-sync setting updated' });
  };

  const syncNow = (connection: PSAConnection) => {
    toast({ 
      title: 'Sync initiated',
      description: `Syncing with ${connection.name}...`
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'vanguard_response': return 'Vanguard Response';
      case 'connectwise': return 'ConnectWise Manage';
      case 'autotask': return 'Datto Autotask';
      case 'halo': return 'HaloPSA';
      case 'syncro': return 'Syncro';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">PSA Integration Hub</h2>
          <p className="text-muted-foreground">Bi-directional sync of assets and tickets with PSA tools</p>
        </div>
        <Dialog open={showAddConnection} onOpenChange={setShowAddConnection}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Connection</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add PSA Connection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>PSA Platform</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vanguard_response">Vanguard Response (Internal)</SelectItem>
                    <SelectItem value="connectwise">ConnectWise Manage</SelectItem>
                    <SelectItem value="autotask">Datto Autotask</SelectItem>
                    <SelectItem value="halo">HaloPSA</SelectItem>
                    <SelectItem value="syncro">Syncro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Connection Name</Label>
                <Input placeholder="e.g., Production CW Instance" />
              </div>
              <div>
                <Label>API URL</Label>
                <Input placeholder="https://api.connectwise.com/..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company ID / Public Key</Label>
                  <Input placeholder="Company ID" />
                </div>
                <div>
                  <Label>API Key / Private Key</Label>
                  <Input type="password" placeholder="API Key" />
                </div>
              </div>
              <div>
                <Label>Sync Direction</Label>
                <Select defaultValue="bidirectional">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bidirectional">Bi-directional</SelectItem>
                    <SelectItem value="psa_to_rmm">PSA → RMM Only</SelectItem>
                    <SelectItem value="rmm_to_psa">RMM → PSA Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => setShowAddConnection(false)}>
                Connect
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connection Cards */}
      <div className="grid grid-cols-3 gap-4">
        {connections.map(connection => (
          <Card key={connection.id} className={`${connection.status === 'connected' ? 'bg-card/50' : 'bg-muted/30'}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${connection.status === 'connected' ? 'bg-primary/20' : 'bg-muted'}`}>
                    <Link2 className={`h-5 w-5 ${connection.status === 'connected' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{connection.name}</h3>
                    <p className="text-sm text-muted-foreground">{getTypeLabel(connection.type)}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(connection.status)}>
                  {connection.status}
                </Badge>
              </div>

              {connection.status === 'connected' && (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-3 w-3 text-muted-foreground" />
                      <span>{connection.syncedItems.tickets} tickets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Server className="h-3 w-3 text-muted-foreground" />
                      <span>{connection.syncedItems.assets} assets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{connection.syncedItems.contacts} contacts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span>{connection.syncedItems.companies} companies</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Last sync: {connection.lastSync}
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowRightLeft className="h-3 w-3" />
                      <span className="capitalize text-xs">{connection.syncDirection.replace('_', ' ')}</span>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={connection.autoSync}
                    onCheckedChange={() => toggleAutoSync(connection.id)}
                    disabled={connection.status !== 'connected'}
                  />
                  <span className="text-sm">Auto-sync</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => syncNow(connection)} disabled={connection.status !== 'connected'}>
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

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">Sync Activity</TabsTrigger>
          <TabsTrigger value="mappings">Field Mappings</TabsTrigger>
          <TabsTrigger value="rules">Sync Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {syncLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      {log.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <div>
                        <p className="text-sm">{log.action}</p>
                        <Badge variant="outline" className="text-xs mt-1">{log.type}</Badge>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{log.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mappings">
          <Card>
            <CardHeader>
              <CardTitle>Field Mappings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vanguard Field</TableHead>
                    <TableHead>→</TableHead>
                    <TableHead>PSA Field</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { vanguard: 'device_name', psa: 'ConfigurationName', type: 'Asset' },
                    { vanguard: 'os_type', psa: 'Type', type: 'Asset' },
                    { vanguard: 'ticket_title', psa: 'Summary', type: 'Ticket' },
                    { vanguard: 'priority', psa: 'Priority', type: 'Ticket' },
                    { vanguard: 'contact_email', psa: 'ContactEmail', type: 'Contact' },
                  ].map((mapping, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{mapping.vanguard}</TableCell>
                      <TableCell><ArrowRightLeft className="h-4 w-4" /></TableCell>
                      <TableCell className="font-mono text-sm">{mapping.psa}</TableCell>
                      <TableCell><Badge variant="outline">{mapping.type}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Sync Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { rule: 'Sync new assets automatically', enabled: true },
                  { rule: 'Create tickets for critical alerts', enabled: true },
                  { rule: 'Update asset status on heartbeat', enabled: true },
                  { rule: 'Sync contact changes immediately', enabled: false },
                  { rule: 'Close tickets when alerts resolve', enabled: true },
                ].map((rule, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span>{rule.rule}</span>
                    <Switch checked={rule.enabled} />
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
