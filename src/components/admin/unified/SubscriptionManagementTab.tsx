import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, DollarSign, TrendingUp, Search, RefreshCw, ArrowUpDown } from 'lucide-react';

interface SubscriptionRecord {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  product: 'ai_studio' | 'safesuite' | 'vanguard';
  tier: string;
  status: string;
  stripe_id: string | null;
  created_at: string;
}

export const SubscriptionManagementTab = () => {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState<string>('all');

  useEffect(() => { loadSubscriptions(); }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const records: SubscriptionRecord[] = [];

      // AI Studio
      const { data: aiSubs } = await supabase
        .from('subscribers')
        .select('id, user_id, email, subscription_tier, subscribed, subscription_id, created_at, updated_at');

      for (const s of aiSubs || []) {
        records.push({
          id: s.id,
          user_id: s.user_id || '',
          email: s.email || '',
          full_name: null,
          product: 'ai_studio',
          tier: s.subscription_tier || 'free',
          status: s.subscribed ? 'active' : 'inactive',
          stripe_id: s.subscription_id || null,
          created_at: s.updated_at || s.created_at,
        });
      }

      // SafeSuite
      const { data: ssSubs } = await supabase
        .from('safesuite_subscriptions')
        .select('id, user_id, tier, status, stripe_subscription_id, created_at');

      const ssUserIds = ssSubs?.map(s => s.user_id) || [];
      const { data: ssProfiles } = ssUserIds.length > 0
        ? await supabase.from('profiles').select('user_id, email, full_name').in('user_id', ssUserIds)
        : { data: [] as any[] };
      const ssProfileMap = new Map(
        (ssProfiles || []).map(p => [p.user_id, { email: p.email, full_name: p.full_name }] as const)
      );

      for (const s of ssSubs || []) {
        const profile = ssProfileMap.get(s.user_id);
        records.push({
          id: s.id,
          user_id: s.user_id,
          email: profile?.email || 'Unknown',
          full_name: profile?.full_name || null,
          product: 'safesuite',
          tier: s.tier || 'free',
          status: s.status || 'inactive',
          stripe_id: s.stripe_subscription_id || null,
          created_at: s.created_at,
        });
      }

      // Vanguard
      const { data: vSubs } = await supabase
        .from('vanguard_subscriptions')
        .select('id, user_id, tier, status, stripe_subscription_id, created_at');

      const vUserIds = vSubs?.map(s => s.user_id) || [];
      const { data: vProfiles } = vUserIds.length > 0
        ? await supabase.from('profiles').select('user_id, email, full_name').in('user_id', vUserIds)
        : { data: [] as any[] };
      const vProfileMap = new Map(
        (vProfiles || []).map(p => [p.user_id, { email: p.email, full_name: p.full_name }] as const)
      );

      for (const s of vSubs || []) {
        const profile = vProfileMap.get(s.user_id);
        records.push({
          id: s.id,
          user_id: s.user_id,
          email: profile?.email || 'Unknown',
          full_name: profile?.full_name || null,
          product: 'vanguard',
          tier: s.tier || 'starter',
          status: s.status || 'inactive',
          stripe_id: s.stripe_subscription_id || null,
          created_at: s.created_at,
        });
      }

      setSubscriptions(records);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast({ title: "Error", description: "Failed to load subscriptions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = subscriptions.filter(s => {
    const matchesSearch = !searchTerm || 
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = productFilter === 'all' || s.product === productFilter;
    return matchesSearch && matchesProduct;
  });

  const activeCount = subscriptions.filter(s => ['active', 'trialing', 'manual'].includes(s.status)).length;
  const stripeCount = subscriptions.filter(s => s.stripe_id).length;

  const getProductBadge = (product: string) => {
    switch (product) {
      case 'ai_studio': return <Badge className="bg-purple-500/20 text-purple-400 border-0">AI Studio</Badge>;
      case 'safesuite': return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">SafeSuite</Badge>;
      case 'vanguard': return <Badge className="bg-amber-500/20 text-amber-400 border-0">Vanguard</Badge>;
      default: return <Badge variant="outline">{product}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Active</Badge>;
      case 'trialing': return <Badge className="bg-blue-500/20 text-blue-400 border-0">Trial</Badge>;
      case 'manual': return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Manual</Badge>;
      case 'canceled': return <Badge className="bg-red-500/20 text-red-400 border-0">Canceled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Subscription Management
          </h2>
          <p className="text-muted-foreground">View and manage all subscriptions across products</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSubscriptions}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Subscriptions</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{subscriptions.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-500">Active</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-500">{activeCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-500">Stripe Managed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-500">{stripeCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-500">Manual</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-500">{subscriptions.length - stripeCount}</div></CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>All Subscriptions</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="ai_studio">AI Studio</SelectItem>
                  <SelectItem value="safesuite">SafeSuite</SelectItem>
                  <SelectItem value="vanguard">Vanguard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No subscriptions found</TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(0, 100).map(s => (
                    <TableRow key={`${s.product}-${s.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{s.email}</div>
                          {s.full_name && <div className="text-sm text-muted-foreground">{s.full_name}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{getProductBadge(s.product)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{s.tier}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(s.status)}</TableCell>
                      <TableCell>
                        {s.stripe_id ? (
                          <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                            <CreditCard className="h-3 w-3 mr-1" /> Stripe
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Manual</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
