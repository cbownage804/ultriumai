import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Loader2, Building2, Settings, Check } from 'lucide-react';
import { useResellerPartner, useResellerTenants } from '@/hooks/useResellerData';
import { supabase } from '@/integrations/supabase/client';
import { MODULE_ADDONS } from '@/config/vanguardAddons';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';
import { useToast } from '@/hooks/use-toast';

export default function ClientProvisioning() {
  const { partner } = useResellerPartner();
  const { tenants, createTenant } = useResellerTenants(partner?.id);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_domain: '',
    seat_count: 10,
    resale_price_per_seat: 15,
    enabled_modules: [] as string[],
  });

  const toggleModule = (moduleId: string) => {
    setForm(prev => ({
      ...prev,
      enabled_modules: prev.enabled_modules.includes(moduleId)
        ? prev.enabled_modules.filter(m => m !== moduleId)
        : [...prev.enabled_modules, moduleId],
    }));
  };

  const wholesalePerSeat = form.enabled_modules.reduce((sum, id) => {
    const addon = MODULE_ADDONS.find(a => a.id === id);
    return sum + (addon?.monthlyPricePerUser || 0);
  }, 0) * (1 - (partner?.discount_percent || 0) / 100);

  const marginPerSeat = form.resale_price_per_seat - wholesalePerSeat;
  const totalMargin = marginPerSeat * form.seat_count;

  const handleProvision = async () => {
    if (!partner) return;
    try {
      // Call edge function for full provisioning (creates tenant + billing + MSP client)
      const { data, error } = await supabase.functions.invoke('provision-client-tenant', {
        body: {
          partner_id: partner.id,
          client_name: form.client_name,
          client_email: form.client_email,
          client_domain: form.client_domain || null,
          seat_count: form.seat_count,
          enabled_modules: form.enabled_modules,
          resale_price_per_seat: form.resale_price_per_seat,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast({ title: 'Client Provisioned', description: data.message || `${form.client_name} is now active.` });
      setOpen(false);
      setForm({ client_name: '', client_email: '', client_domain: '', seat_count: 10, resale_price_per_seat: 15, enabled_modules: [] });
      // Refresh tenants list
      window.location.reload();
    } catch (err: any) {
      toast({ title: 'Provisioning Failed', description: err.message, variant: 'destructive' });
    }
  };

  if (!partner) {
    return (
      <div className="flex items-center justify-center py-20 text-white/40">
        <p>Join the Partner Program first to provision clients.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-cyan-400" />
            Client Provisioning
          </h1>
          <p className="text-white/50 text-sm">Create isolated client tenants with selected modules</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600">
              <UserPlus className="h-4 w-4 mr-2" /> Provision Client
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Provision New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70">Client Name</Label>
                  <Input value={form.client_name} onChange={(e) => setForm(prev => ({ ...prev, client_name: e.target.value }))} placeholder="Acme Corp" className="bg-white/5 border-white/10 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-white/70">Contact Email</Label>
                  <Input value={form.client_email} onChange={(e) => setForm(prev => ({ ...prev, client_email: e.target.value }))} placeholder="admin@acme.com" className="bg-white/5 border-white/10 text-white mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70">Domain (optional)</Label>
                  <Input value={form.client_domain} onChange={(e) => setForm(prev => ({ ...prev, client_domain: e.target.value }))} placeholder="acme.com" className="bg-white/5 border-white/10 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-white/70">Seats</Label>
                  <Input type="number" value={form.seat_count} onChange={(e) => setForm(prev => ({ ...prev, seat_count: parseInt(e.target.value) || 1 }))} className="bg-white/5 border-white/10 text-white mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-white/70 mb-2 block">Enabled Modules</Label>
                <div className="space-y-2">
                  {MODULE_ADDONS.map(addon => (
                    <div key={addon.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                      <div className="flex items-center gap-2">
                        <ModuleLogo module={addon.module} size="xs" />
                        <span className="text-sm text-white/70">{addon.name}</span>
                        <span className="text-xs text-white/30">${addon.monthlyPricePerUser}/user</span>
                      </div>
                      <Switch checked={form.enabled_modules.includes(addon.id)} onCheckedChange={() => toggleModule(addon.id)} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white/70">Your Resale Price (per user/mo)</Label>
                <Input type="number" value={form.resale_price_per_seat} onChange={(e) => setForm(prev => ({ ...prev, resale_price_per_seat: parseFloat(e.target.value) || 0 }))} className="bg-white/5 border-white/10 text-white mt-1" />
              </div>

              {/* Margin Preview */}
              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-3 pb-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Wholesale (after {partner.discount_percent}% discount)</span>
                    <span className="text-white/60">${wholesalePerSeat.toFixed(2)}/user</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Your resale price</span>
                    <span className="text-white/60">${form.resale_price_per_seat}/user</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-white/10 pt-1">
                    <span className="text-white/70 font-medium">Monthly Margin</span>
                    <span className={`font-bold ${totalMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${totalMargin.toFixed(0)}/mo
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="border-white/20 text-white">Cancel</Button>
              <Button onClick={handleProvision} disabled={!form.client_name || !form.client_email || form.enabled_modules.length === 0 || createTenant.isPending} className="bg-gradient-to-r from-cyan-500 to-purple-600">
                {createTenant.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Provision Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Tenants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map(tenant => (
          <Card key={tenant.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">{tenant.client_name}</CardTitle>
                <Badge className={`border-0 text-xs ${
                  tenant.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                  tenant.status === 'trial' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {tenant.status}
                </Badge>
              </div>
              <CardDescription className="text-white/40 text-xs">{tenant.client_email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                <span>{tenant.seat_count} seats</span>
                <span>{tenant.enabled_modules.length} modules</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {tenant.enabled_modules.slice(0, 4).map(m => (
                  <Badge key={m} variant="outline" className="border-white/10 text-white/40 text-[10px]">{m}</Badge>
                ))}
                {tenant.enabled_modules.length > 4 && (
                  <Badge variant="outline" className="border-white/10 text-white/30 text-[10px]">+{tenant.enabled_modules.length - 4}</Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/30">Margin:</span>
                <span className="text-emerald-400 font-medium">
                  ${((tenant.resale_price_per_seat - tenant.monthly_price_per_seat) * tenant.seat_count).toFixed(0)}/mo
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {tenants.length === 0 && (
          <Card className="bg-white/5 border-white/10 border-dashed col-span-full">
            <CardContent className="py-12 text-center">
              <Building2 className="h-8 w-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No clients provisioned yet</p>
              <p className="text-white/20 text-xs">Click "Provision Client" to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
