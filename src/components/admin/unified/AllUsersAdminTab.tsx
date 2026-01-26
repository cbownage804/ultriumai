import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  RefreshCw,
  Users,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

interface UnifiedUser {
  id: string;
  email: string;
  full_name: string | null;
  account_type: string;
  created_at: string;
  products: {
    ai_studio: { tier: string; subscribed: boolean } | null;
    safesuite: { tier: string; status: string } | null;
    vanguard: { tier: string; status: string } | null;
  };
}

export const AllUsersAdminTab = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UnifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAllUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      
      // Get all profiles (single source of truth for users)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, account_type, created_at')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      const userIds = profiles?.map(p => p.id) || [];

      // Get AI Studio subscriptions
      const { data: aiStudioSubs } = await supabase
        .from('subscribers')
        .select('user_id, subscription_tier, subscribed')
        .in('user_id', userIds);

      // Get SafeSuite subscriptions
      const { data: safeSuiteSubs } = await supabase
        .from('safesuite_subscriptions')
        .select('user_id, tier, status')
        .in('user_id', userIds);

      // Get Vanguard subscriptions
      const { data: vanguardSubs } = await supabase
        .from('vanguard_subscriptions')
        .select('user_id, tier, status')
        .in('user_id', userIds);

      // Create lookup maps
      const aiStudioMap = new Map(aiStudioSubs?.map(s => [s.user_id, s]) || []);
      const safeSuiteMap = new Map(safeSuiteSubs?.map(s => [s.user_id, s]) || []);
      const vanguardMap = new Map(vanguardSubs?.map(s => [s.user_id, s]) || []);

      // Build unified user list - no duplicates, profiles is the source of truth
      const unifiedUsers: UnifiedUser[] = (profiles || []).map(profile => {
        const aiSub = aiStudioMap.get(profile.id);
        const safeSub = safeSuiteMap.get(profile.id);
        const vangSub = vanguardMap.get(profile.id);

        return {
          id: profile.id,
          email: profile.email || 'Unknown',
          full_name: profile.full_name,
          account_type: profile.account_type || 'individual',
          created_at: profile.created_at,
          products: {
            ai_studio: aiSub ? { tier: aiSub.subscription_tier || 'free', subscribed: aiSub.subscribed } : null,
            safesuite: safeSub ? { tier: safeSub.tier || 'free', status: safeSub.status } : null,
            vanguard: vangSub ? { tier: vangSub.tier || 'free', status: vangSub.status } : null,
          }
        };
      });

      setUsers(unifiedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error loading users",
        description: "Could not load user data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const term = searchTerm.toLowerCase();
    setFilteredUsers(users.filter(u => 
      u.email?.toLowerCase().includes(term) ||
      u.full_name?.toLowerCase().includes(term)
    ));
  };

  const getAccountTypeBadge = (type: string) => {
    switch (type) {
      case 'msp':
        return <Badge variant="outline" className="text-blue-500 border-blue-500/50">MSP Partner</Badge>;
      case 'mssp':
        return <Badge variant="outline" className="text-purple-500 border-purple-500/50">MSSP Partner</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Individual</Badge>;
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
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With AI Studio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.products.ai_studio).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With SafeSuite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.products.safesuite).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With Vanguard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.products.vanguard).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                All Platform Users
              </CardTitle>
              <CardDescription>
                Unified view of all users across AI Studio, SafeSuite, and Vanguard
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadAllUsers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      AI Studio
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-emerald-500" />
                      SafeSuite
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      Vanguard
                    </div>
                  </TableHead>
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
                  filteredUsers.slice(0, 100).map((user) => (
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
                        {getAccountTypeBadge(user.account_type)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={!!user.products.ai_studio} 
                          disabled 
                          className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={!!user.products.safesuite} 
                          disabled 
                          className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={!!user.products.vanguard} 
                          disabled 
                          className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                        />
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
          
          {filteredUsers.length > 100 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing 100 of {filteredUsers.length} users
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
