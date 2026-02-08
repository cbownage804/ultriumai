import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Building2, Plus, Edit, Users, Settings2, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  users: number;
  storageUsedMb: number;
  storageQuotaMb: number;
  active: boolean;
  features: string[];
}

const MultiTenantTab = () => {
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: '1', name: 'Acme Corp', slug: 'acme', plan: 'Enterprise', users: 45, storageUsedMb: 2400, storageQuotaMb: 5000, active: true, features: ['vanguard', 'atlas', 'cortex'] },
    { id: '2', name: 'TechStart LLC', slug: 'techstart', plan: 'Professional', users: 12, storageUsedMb: 800, storageQuotaMb: 2000, active: true, features: ['vanguard', 'atlas'] },
    { id: '3', name: 'Demo Org', slug: 'demo', plan: 'Trial', users: 3, storageUsedMb: 50, storageQuotaMb: 500, active: false, features: ['atlas'] },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = tenants.find(t => t.id === selectedId);

  const toggleFeature = (tenantId: string, feature: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id !== tenantId) return t;
      const features = t.features.includes(feature) ? t.features.filter(f => f !== feature) : [...t.features, feature];
      return { ...t, features };
    }));
  };

  const allFeatures = ['vanguard', 'atlas', 'cortex', 'pursuit', 'sentinel', 'ledger', 'comply', 'response'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6" /> Multi-Tenant Manager</h2>
          <p className="text-muted-foreground">Manage tenant organizations, quotas, and feature access</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('Create tenant flow (simulated)')}><Plus className="h-4 w-4" /> New Tenant</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          {tenants.map(t => (
            <Card key={t.id} className={`cursor-pointer transition-colors ${selectedId === t.id ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/30'}`} onClick={() => setSelectedId(t.id)}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{t.name}</p>
                  <Badge variant={t.active ? 'default' : 'secondary'} className="text-xs">{t.plan}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{t.users}</span>
                  <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{(t.storageUsedMb / 1000).toFixed(1)}GB / {(t.storageQuotaMb / 1000).toFixed(1)}GB</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="lg:col-span-2">
          {selected ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selected.name}</CardTitle>
                  <Badge variant="outline" className="font-mono text-xs">{selected.slug}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg"><p className="text-xl font-bold">{selected.users}</p><p className="text-xs text-muted-foreground">Users</p></div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg"><p className="text-xl font-bold">{Math.round(selected.storageUsedMb / selected.storageQuotaMb * 100)}%</p><p className="text-xs text-muted-foreground">Storage</p></div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg"><p className="text-xl font-bold">{selected.features.length}</p><p className="text-xs text-muted-foreground">Features</p></div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Settings2 className="h-4 w-4" /> Feature Toggles</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {allFeatures.map(f => (
                      <div key={f} className="flex items-center justify-between p-2 rounded-lg border">
                        <span className="text-sm capitalize">{f}</span>
                        <Switch checked={selected.features.includes(f)} onCheckedChange={() => toggleFeature(selected.id, f)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Storage Quota (MB)</h4>
                  <Input type="number" value={selected.storageQuotaMb} onChange={e => setTenants(prev => prev.map(t => t.id === selected.id ? { ...t, storageQuotaMb: parseInt(e.target.value) || 500 } : t))} className="w-40" />
                </div>

                <Button onClick={() => toast.success('Tenant updated')}>Save Changes</Button>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-12 text-center text-muted-foreground">Select a tenant to manage</CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MultiTenantTab;
