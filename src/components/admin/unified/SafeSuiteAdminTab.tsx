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

interface SafeSuiteUser {
  id: string;
  user_id: string;
  tier: string;
  status: string;
  created_at: string;
  email?: string;
  full_name?: string;
  account_type?: string;
  mfa_enabled?: boolean;
}

const TIERS = [
  { value: 'free', label: 'Free', color: 'bg-gray-500' },
  { value: 'pro', label: 'Pro', color: 'bg-blue-500' },
  { value: 'business', label: 'Business', color: 'bg-purple-500' },
];

export const SafeSuiteAdminTab = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<SafeSuiteUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SafeSuiteUser[]>([]);
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
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, tierFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get SafeSuite subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('safesuite_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subError) throw subError;

      // Get profile data for all subscription users - join on user_id, not id
      const userIds = subscriptions?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, account_type')
        .in('user_id', userIds);

      // Get security settings for MFA status
      const { data: securitySettings } = await supabase
        .from('security_settings')
        .select('user_id, two_factor_enabled')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const securityMap = new Map(securitySettings?.map((s: any) => [s.user_id, s]) || []);

      const enriched = (subscriptions || []).map(sub => ({
        ...sub,
        email: profileMap.get(sub.user_id)?.email || 'Unknown',
        full_name: profileMap.get(sub.user_id)?.full_name,
        account_type: profileMap.get(sub.user_id)?.account_type || 'individual',
        mfa_enabled: securityMap.get(sub.user_id)?.two_factor_enabled || false
      }));

      setUsers(enriched);

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
      console.error('Error loading users:', error);
      toast({
        title: "Error loading users",
        description: "Could not load SafeSuite users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.email?.toLowerCase().includes(term) ||
        u.full_name?.toLowerCase().includes(term)
      );
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(u => u.tier === tierFilter);
    }

    setFilteredUsers(filtered);
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'msp': return 'MSP Partner';
      case 'mssp': return 'MSSP Partner';
      default: return 'Individual';
    }
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                SafeSuite Users
              </CardTitle>
              <CardDescription>
                Manage SafeSuite users, subscriptions, and security settings
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadUsers}>
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
                  <TableHead>Account Type</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>MFA</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.slice(0, 50).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.email}</div>
                          {user.full_name && (
                            <div className="text-sm text-muted-foreground">{user.full_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                          {getAccountTypeLabel(user.account_type || 'individual')}
                        </Badge>
                      </TableCell>
                      <TableCell>{getTierBadge(user.tier)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.mfa_enabled ? (
                          <ShieldCheck className="h-5 w-5 text-green-500" />
                        ) : (
                          <ShieldOff className="h-5 w-5 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredUsers.length > 50 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing 50 of {filteredUsers.length} users
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
