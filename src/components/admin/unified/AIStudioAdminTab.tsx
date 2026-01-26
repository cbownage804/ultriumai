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
  Users,
  Search,
  RefreshCw,
  Sparkles,
  Crown,
  Zap,
  User as UserIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface AIStudioUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  subscription_tier: string;
  subscribed: boolean;
  account_type: string;
}

const TIERS = [
  { value: 'free', label: 'Free', icon: UserIcon, color: 'bg-gray-500' },
  { value: 'starter', label: 'Starter', icon: Sparkles, color: 'bg-blue-500' },
  { value: 'professional', label: 'Professional', icon: Zap, color: 'bg-purple-500' },
  { value: 'enterprise', label: 'Enterprise', icon: Crown, color: 'bg-amber-500' },
];

export const AIStudioAdminTab = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AIStudioUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AIStudioUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    free: 0,
    starter: 0,
    professional: 0,
    enterprise: 0
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
      
      // Get profiles with subscription data
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at, account_type')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Get subscription data
      const userIds = profiles?.map(p => p.id) || [];
      const { data: subscriptions } = await supabase
        .from('subscribers')
        .select('user_id, subscription_tier, subscribed')
        .in('user_id', userIds);

      const subMap = new Map(subscriptions?.map(s => [s.user_id, s]) || []);

      const enrichedUsers = (profiles || []).map(profile => ({
        ...profile,
        subscription_tier: subMap.get(profile.id)?.subscription_tier || 'free',
        subscribed: subMap.get(profile.id)?.subscribed || false
      }));

      setUsers(enrichedUsers);

      // Calculate stats
      const tierCounts = { free: 0, starter: 0, professional: 0, enterprise: 0 };
      enrichedUsers.forEach(user => {
        const tier = user.subscription_tier?.toLowerCase() || 'free';
        if (tier in tierCounts) {
          tierCounts[tier as keyof typeof tierCounts]++;
        } else {
          tierCounts.free++;
        }
      });

      setStats({
        total: enrichedUsers.length,
        ...tierCounts
      });
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error loading users",
        description: "Could not load AI Studio users",
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
      filtered = filtered.filter(u => u.subscription_tier === tierFilter);
    }

    setFilteredUsers(filtered);
  };

  const getTierBadge = (tier: string) => {
    const tierConfig = TIERS.find(t => t.value === tier) || TIERS[0];
    return (
      <Badge className={`${tierConfig.color} text-white`}>
        {tierConfig.label}
      </Badge>
    );
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'msp': return 'MSP Partner';
      case 'mssp': return 'MSSP Partner';
      default: return 'Individual';
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
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
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
                <Sparkles className="h-5 w-5" />
                AI Studio Users
              </CardTitle>
              <CardDescription>
                Manage AI Studio subscriptions and accounts
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
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">User</TableHead>
                  <TableHead className="min-w-[120px]">Account Type</TableHead>
                  <TableHead className="min-w-[100px]">Tier</TableHead>
                  <TableHead className="min-w-[100px]">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.slice(0, 50).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="font-medium truncate">{user.email}</div>
                          {user.full_name && (
                            <div className="text-sm text-muted-foreground truncate">{user.full_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-600 whitespace-nowrap">
                          {getAccountTypeLabel(user.account_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getTierBadge(user.subscription_tier)}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
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
