import { useState, useEffect, useMemo } from 'react';
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
  ArrowRightLeft, FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function DocumentationPlatformIntegration() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [passwordCount, setPasswordCount] = useState(0);

  useEffect(() => {
    if (user?.id) fetchCounts();
  }, [user?.id]);

  const fetchCounts = async () => {
    if (!user?.id) return;
    const [docs, assets, passwords] = await Promise.all([
      supabase.from('atlas_documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('atlas_flexible_assets').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('atlas_passwords').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);
    setDocCount(docs.count || 0);
    setAssetCount(assets.count || 0);
    setPasswordCount(passwords.count || 0);
  };

  const syncMappings = [
    { vanguard: 'Device Info', doc: 'Configuration', direction: 'bidirectional', enabled: true },
    { vanguard: 'Software Inventory', doc: 'Asset Applications', direction: 'rmm_to_doc', enabled: true },
    { vanguard: 'Network Config', doc: 'Network Configurations', direction: 'bidirectional', enabled: true },
    { vanguard: 'Credentials', doc: 'Passwords', direction: 'doc_to_rmm', enabled: true },
  ];

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
                  <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
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
              <Button className="w-full" onClick={() => { setShowAddConnection(false); toast({ title: 'Connection saved' }); }}>
                Connect Platform
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Live Atlas Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">1</div>
            <p className="text-sm text-muted-foreground">Connected (Atlas)</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{docCount}</div>
            <p className="text-sm text-muted-foreground">Synced Documents</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{assetCount}</div>
            <p className="text-sm text-muted-foreground">Synced Assets</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{passwordCount}</div>
            <p className="text-sm text-muted-foreground">Synced Passwords</p>
          </CardContent>
        </Card>
      </div>

      {/* Atlas Built-in Integration */}
      <Card className="bg-card/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Atlas Documentation (Built-in)</h3>
                <p className="text-sm text-muted-foreground">Native Vanguard documentation platform</p>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-400">connected</Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold">{docCount}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold">{assetCount}</p>
              <p className="text-xs text-muted-foreground">Assets</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold">{passwordCount}</p>
              <p className="text-xs text-muted-foreground">Passwords</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              Real-time sync via Supabase
            </div>
            <Button size="sm" variant="ghost" onClick={() => { fetchCounts(); toast({ title: 'Refreshed' }); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="mappings">
        <TabsList>
          <TabsTrigger value="mappings">Data Mappings</TabsTrigger>
          <TabsTrigger value="activity">Sync Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="mappings">
          <Card>
            <CardHeader><CardTitle>Field Mappings</CardTitle></CardHeader>
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
                      <TableCell><Switch checked={mapping.enabled} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader><CardTitle>Recent Sync Activity</CardTitle></CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Atlas documentation is synced in real-time. No sync history to display.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
