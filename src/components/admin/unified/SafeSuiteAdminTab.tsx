import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  RefreshCw,
  Shield,
  Crown,
  Sparkles,
  User as UserIcon,
  ShieldCheck,
  ShieldOff
} from 'lucide-react';
import { format } from 'date-fns';

interface SafeSuiteSubscriber {
  id: string;
  user_id: string;
  tier: string;
  status: string;
  created_at: string;
  email?: string;
  full_name?: string;
  mfa_enabled?: boolean;
}

const TIERS = [
  { value: 'free', label: 'Free', color: 'bg-gray-500' },
  { value: 'pro', label: 'Pro', color: 'bg-blue-500' },
  { value: 'business', label: 'Business', color: 'bg-purple-500' },
];

export const SafeSuiteAdminTab = () => {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<SafeSuiteSubscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<SafeSuiteSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    free: 0,
    pro: 0,
    business: 0
  });

  useEffect(() => {
    loadSubscribers();
  }, []);

  useEffect(() => {
    filterSubscribers();
  }, [subscribers, searchTerm, tierFilter]);

  const loadSubscribers = async () => {
    try {
      setLoading(true);
      
      // Get SafeSuite subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('safesuite_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subError) throw subError;

      // Get profile data
      const userIds = subscriptions?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      // Get security settings for MFA status
      const { data: securitySettings } = await supabase
        .from('security_settings')
        .select('user_id, two_factor_enabled')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const securityMap = new Map(securitySettings?.map((s: any) => [s.user_id, s]) || []);

      const enriched = (subscriptions || []).map(sub => ({
        ...sub,
        email: profileMap.get(sub.user_id)?.email || 'Unknown',
        full_name: profileMap.get(sub.user_id)?.full_name,
        mfa_enabled: securityMap.get(sub.user_id)?.two_factor_enabled || false
      }));

      setSubscribers(enriched);

      // Calculate stats
      const tierCounts = { free: 0, pro: 0, business: 0 };
      enriched.forEach(sub => {
        const tier = sub.tier?.toLowerCase() || 'free';
        if (tier in tierCounts) {
          tierCounts[tier as keyof typeof tierCounts]++;
        }
      });

      setStats({
        total: enriched.length,
        ...tierCounts
      });
    } catch (error) {
      console.error('Error loading subscribers:', error);
      toast({
        title: "Error loading subscribers",
        description: "Could not load SafeSuite subscribers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSubscribers = () => {
    let filtered = [...subscribers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.email?.toLowerCase().includes(term) ||
        s.full_name?.toLowerCase().includes(term)
      );
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(s => s.tier === tierFilter);
    }

    setFilteredSubscribers(filtered);
  };

  const getTierBadge = (tier: string) => {
    const tierConfig = TIERS.find(t => t.value === tier) || TIERS[0];
    return (
      <Badge className={`${tierConfig.color} text-white`}>
        {tierConfig.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500 text-white">Trial</Badge>;
      case 'canceled':
        return <Badge variant="secondary">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        {TIERS.map(tier => (
          <Card key={tier.value}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{tier.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats[tier.value as keyof typeof stats]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                SafeSuite Subscribers
              </CardTitle>
              <CardDescription>
                Manage SafeSuite subscriptions and security settings
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadSubscribers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                {TIERS.map(tier => (
                  <SelectItem key={tier.value} value={tier.value}>
                    {tier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>MFA</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No subscribers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscribers.slice(0, 50).map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sub.email}</div>
                          {sub.full_name && (
                            <div className="text-sm text-muted-foreground">{sub.full_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(sub.tier)}</TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        {sub.mfa_enabled ? (
                          <ShieldCheck className="h-5 w-5 text-green-500" />
                        ) : (
                          <ShieldOff className="h-5 w-5 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(sub.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredSubscribers.length > 50 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing 50 of {filteredSubscribers.length} subscribers
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
