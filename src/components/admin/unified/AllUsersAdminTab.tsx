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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  RefreshCw,
  Users,
  Sparkles,
  Shield,
  Zap,
  Crown,
  DollarSign,
  CreditCard,
  Wrench,
  Settings2,
  ShieldCheck,
  ShieldOff
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { UserSubscriptionDialog } from './UserSubscriptionDialog';

// Pricing constants (monthly in cents)
const PRICING = {
  ai_studio: {
    free: 0,
    starter: 9900,      // $99/mo
    professional: 49900, // $499/mo
    enterprise: 99900    // $999/mo (custom, estimate)
  },
  safesuite: {
    free: 0,
    pro: 999,           // $9.99/mo
    business: 1500      // $15/user/mo
  },
  vanguard: {
    starter: 3000,      // $30/user/mo
    professional: 5000, // $50/user/mo
    enterprise: 8000    // $80/user/mo
  }
};

interface UnifiedUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  account_type: string;
  created_at: string;
  mfa_enabled: boolean;
  last_login?: { time: string; ip: string } | null;
  products: {
    ai_studio: { tier: string; subscribed: boolean; stripe_subscription_id?: string | null } | null;
    safesuite: { tier: string; status: string; stripe_subscription_id?: string | null } | null;
    vanguard: { tier: string; status: string; stripe_subscription_id?: string | null } | null;
  };
}

export const AllUsersAdminTab = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UnifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UnifiedUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadAllUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  // If the table data refreshes while the dialog is open, keep the selected user in sync
  useEffect(() => {
    if (!selectedUser) return;
    const updated = users.find(u => u.user_id === selectedUser.user_id);
    if (updated && updated !== selectedUser) {
      setSelectedUser(updated);
    }
  }, [users, selectedUser?.user_id]);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      
      // Get all profiles (single source of truth for users)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name, account_type, created_at')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      const userIds = profiles?.map(p => p.user_id) || [];

      // Get AI Studio subscriptions with Stripe info
      const { data: aiStudioSubs } = await supabase
        .from('subscribers')
        .select('user_id, subscription_tier, subscribed, subscription_id')
        .in('user_id', userIds);

      // Get SafeSuite subscriptions with Stripe info
      const { data: safeSuiteSubs } = await supabase
        .from('safesuite_subscriptions')
        .select('user_id, tier, status, stripe_subscription_id')
        .in('user_id', userIds);

      // Get Vanguard subscriptions with Stripe info
      const { data: vanguardSubs } = await supabase
        .from('vanguard_subscriptions')
        .select('user_id, tier, status, stripe_subscription_id')
        .in('user_id', userIds);

      // Get MFA status from security_settings
      const { data: securitySettings } = await supabase
        .from('security_settings')
        .select('user_id, two_factor_enabled')
        .in('user_id', userIds);

      // Get last login from audit_logs
      const { data: loginLogs } = await supabase
        .from('audit_logs')
        .select('user_id, ip_address, created_at')
        .in('user_id', userIds)
        .eq('action', 'login')
        .order('created_at', { ascending: false });

      // Create lookup maps keyed by user_id
      const aiStudioMap = new Map(aiStudioSubs?.map(s => [s.user_id, s]) || []);
      const safeSuiteMap = new Map(safeSuiteSubs?.map(s => [s.user_id, s]) || []);
      const vanguardMap = new Map(vanguardSubs?.map(s => [s.user_id, s]) || []);
      const mfaMap = new Map(securitySettings?.map((s: any) => [s.user_id, s.two_factor_enabled]) || []);
      
      // Build last login map (first entry per user is most recent)
      const lastLoginMap = new Map<string, { time: string; ip: string }>();
      for (const login of (loginLogs || [])) {
        if (!lastLoginMap.has(login.user_id)) {
          lastLoginMap.set(login.user_id, {
            time: login.created_at,
            ip: String(login.ip_address || 'Unknown')
          });
        }
      }

      // Build unified user list
      const unifiedUsers: UnifiedUser[] = (profiles || []).map(profile => {
        const aiSub = aiStudioMap.get(profile.user_id);
        const safeSub = safeSuiteMap.get(profile.user_id);
        const vangSub = vanguardMap.get(profile.user_id);

        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email || 'Unknown',
          full_name: profile.full_name,
          account_type: profile.account_type || 'individual',
          created_at: profile.created_at,
          mfa_enabled: mfaMap.get(profile.user_id) || false,
          last_login: lastLoginMap.get(profile.user_id) || null,
          products: {
            ai_studio: aiSub ? { 
              tier: aiSub.subscription_tier || 'free', 
              subscribed: aiSub.subscribed,
              stripe_subscription_id: aiSub.subscription_id 
            } : null,
            safesuite: safeSub ? { 
              tier: safeSub.tier || 'free', 
              status: safeSub.status,
              stripe_subscription_id: safeSub.stripe_subscription_id 
            } : null,
            vanguard: vangSub ? { 
              tier: vangSub.tier || 'free', 
              status: vangSub.status,
              stripe_subscription_id: vangSub.stripe_subscription_id 
            } : null,
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

  // Calculate MRR
  const calculateMRR = () => {
    let totalMRR = 0;
    
    users.forEach(user => {
      // AI Studio MRR
      if (user.products.ai_studio) {
        const tier = user.products.ai_studio.tier?.toLowerCase() || 'free';
        totalMRR += PRICING.ai_studio[tier as keyof typeof PRICING.ai_studio] || 0;
      }
      
      // SafeSuite MRR
      if (user.products.safesuite) {
        const tier = user.products.safesuite.tier?.toLowerCase() || 'free';
        totalMRR += PRICING.safesuite[tier as keyof typeof PRICING.safesuite] || 0;
      }
      
      // Vanguard MRR
      if (user.products.vanguard) {
        const tier = user.products.vanguard.tier?.toLowerCase() || 'starter';
        totalMRR += PRICING.vanguard[tier as keyof typeof PRICING.vanguard] || 0;
      }
    });
    
    return totalMRR / 100; // Convert cents to dollars
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

  const getTierBadge = (tier: string | undefined, productColor: string, stripeId?: string | null) => {
    const t = tier?.toLowerCase() || 'free';
    const isPaid = t !== 'free';
    const isStripe = !!stripeId;
    const label = t.charAt(0).toUpperCase() + t.slice(1);
    
    const colorClasses = isPaid 
      ? `text-${productColor}-500 border-${productColor}-500/50 bg-${productColor}-500/10`
      : 'text-muted-foreground border-muted-foreground/30 bg-muted/30';
    
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className={`text-xs ${colorClasses}`}>
          {isPaid && <Crown className="h-3 w-3 mr-1" />}
          {label}
        </Badge>
        {isPaid && (
          isStripe ? (
            <span title="Stripe subscription"><CreditCard className="h-3 w-3 text-blue-400" /></span>
          ) : (
            <span title="Manually set"><Wrench className="h-3 w-3 text-amber-400" /></span>
          )
        )}
      </div>
    );
  };

  const handleUserClick = (user: UnifiedUser) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const mrr = calculateMRR();

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              Est. MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${mrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
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
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Studio Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {users.filter(u => u.products.ai_studio && u.products.ai_studio.tier !== 'free').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Shield className="h-4 w-4 text-emerald-500" />
              SafeSuite Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {users.filter(u => u.products.safesuite && u.products.safesuite.tier !== 'free').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Zap className="h-4 w-4 text-amber-500" />
              Vanguard Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {users.filter(u => u.products.vanguard).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CreditCard className="h-3 w-3 text-blue-400" />
          Stripe subscription
        </span>
        <span className="flex items-center gap-1">
          <Wrench className="h-3 w-3 text-amber-400" />
          Manually set
        </span>
        <span className="flex items-center gap-1">
          <Settings2 className="h-3 w-3" />
          Click row to edit
        </span>
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
                  <TableHead className="text-center">MFA</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.slice(0, 100).map((user) => (
                    <TableRow 
                      key={user.id} 
                      className="cursor-pointer hover:bg-muted/80"
                      onClick={() => handleUserClick(user)}
                    >
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
                        <div className="flex justify-center">
                          {getTierBadge(
                            user.products.ai_studio?.tier, 
                            'purple',
                            user.products.ai_studio?.stripe_subscription_id
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {getTierBadge(
                            user.products.safesuite?.tier, 
                            'emerald',
                            user.products.safesuite?.stripe_subscription_id
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {user.products.vanguard 
                            ? getTierBadge(
                                user.products.vanguard.tier, 
                                'amber',
                                user.products.vanguard.stripe_subscription_id
                              )
                            : <span className="text-muted-foreground text-xs">—</span>
                          }
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.mfa_enabled ? (
                          <ShieldCheck className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <ShieldOff className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {user.last_login ? (
                          <div>
                            <div className="text-muted-foreground">
                              {formatDistanceToNow(new Date(user.last_login.time), { addSuffix: true })}
                            </div>
                            <div className="text-muted-foreground/60 font-mono text-[10px]">
                              {user.last_login.ip}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
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
          
          {filteredUsers.length > 100 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing 100 of {filteredUsers.length} users
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <UserSubscriptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
        onUpdate={loadAllUsers}
      />
    </div>
  );
};
