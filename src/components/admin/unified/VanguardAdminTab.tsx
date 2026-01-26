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
  Zap,
  Users
} from 'lucide-react';
import { format } from 'date-fns';

interface VanguardSubscription {
  id: string;
  user_id: string;
  tier: string;
  seat_count: number;
  status: string;
  admin_override: boolean;
  created_at: string;
  email?: string;
}

const TIERS = [
  { value: 'free', label: 'Free', color: 'bg-gray-500' },
  { value: 'starter', label: 'Starter', color: 'bg-blue-500' },
  { value: 'professional', label: 'Professional', color: 'bg-purple-500' },
  { value: 'enterprise', label: 'Enterprise', color: 'bg-amber-500' },
];

export const VanguardAdminTab = () => {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<VanguardSubscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<VanguardSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    free: 0,
    starter: 0,
    professional: 0,
    enterprise: 0,
    totalSeats: 0
  });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchTerm, tierFilter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      
      // Get Vanguard subscriptions
      const { data: subs, error: subError } = await supabase
        .from('vanguard_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subError) throw subError;

      // Get profile data
      const userIds = subs?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

      const enriched = (subs || []).map(sub => ({
        ...sub,
        email: profileMap.get(sub.user_id) || 'Unknown'
      }));

      setSubscriptions(enriched);

      // Calculate stats
      const tierCounts = { free: 0, starter: 0, professional: 0, enterprise: 0 };
      let totalSeats = 0;
      
      enriched.forEach(sub => {
        const tier = sub.tier?.toLowerCase() || 'free';
        if (tier in tierCounts) {
          tierCounts[tier as keyof typeof tierCounts]++;
        }
        totalSeats += sub.seat_count || 0;
      });

      setStats({
        total: enriched.length,
        totalSeats,
        ...tierCounts
      });
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast({
        title: "Error loading subscriptions",
        description: "Could not load Vanguard subscriptions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSubscriptions = () => {
    let filtered = [...subscriptions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => s.email?.toLowerCase().includes(term));
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(s => s.tier === tierFilter);
    }

    setFilteredSubscriptions(filtered);
  };

  const getTierBadge = (tier: string) => {
    const tierConfig = TIERS.find(t => t.value === tier) || TIERS[0];
    return (
      <Badge className={`${tierConfig.color} text-white`}>
        {tierConfig.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string, adminOverride: boolean) => {
    if (adminOverride) {
      return <Badge className="bg-amber-500 text-white">Manual</Badge>;
    }
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case 'manual':
        return <Badge className="bg-amber-500 text-white">Manual</Badge>;
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
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSeats}</div>
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

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Vanguard Subscriptions
              </CardTitle>
              <CardDescription>
                Manage Vanguard MSP/Enterprise subscriptions
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadSubscriptions}>
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
                placeholder="Search by email..."
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
                  <TableHead>Email</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.slice(0, 50).map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.email}</TableCell>
                      <TableCell>{getTierBadge(sub.tier)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {sub.seat_count}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status, sub.admin_override)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(sub.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredSubscriptions.length > 50 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing 50 of {filteredSubscriptions.length} subscriptions
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
