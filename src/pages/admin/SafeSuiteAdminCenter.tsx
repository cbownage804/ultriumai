import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Shield,
  Users,
  CreditCard,
  Search,
  ArrowLeft,
  Home,
  RefreshCw,
  Crown,
  Sparkles,
  User as UserIcon,
  Edit,
  Check,
  X,
  DollarSign,
  Calendar,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { SAFESUITE_TIERS, type SafeSuiteTier } from '@/config/safeSuiteTiers';

interface SafeSuiteSubscriber {
  id: string;
  user_id: string;
  tier: SafeSuiteTier;
  status: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  email?: string;
  full_name?: string;
}

interface AdminStats {
  totalSubscribers: number;
  freeUsers: number;
  proUsers: number;
  businessUsers: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
}

const SafeSuiteAdminCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<SafeSuiteSubscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<SafeSuiteSubscriber[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalSubscribers: 0,
    freeUsers: 0,
    proUsers: 0,
    businessUsers: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<SafeSuiteSubscriber | null>(null);
  const [newTier, setNewTier] = useState<SafeSuiteTier>('free');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is admin (UltriumAI employee with CONFIRMED email)
      const isEmailConfirmed = user.email_confirmed_at != null;
      const isUltriumEmployee = user.email?.endsWith('@ultriumai.com');
      
      if (!isUltriumEmployee || !isEmailConfirmed) {
        toast({
          title: "Access Denied",
          description: !isEmailConfirmed 
            ? "Please confirm your email address first." 
            : "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadSubscribers();
    } catch (error) {
      console.error('Admin access check failed:', error);
      navigate('/dashboard');
    }
  };

  const loadSubscribers = async () => {
    try {
      setLoading(true);

      // Load all SafeSuite subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('safesuite_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subError) throw subError;

      // Get all user IDs to fetch profiles
      const userIds = subscriptions?.map(s => s.user_id) || [];
      
      // Load profiles for these users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Create profile lookup map
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Merge subscription data with profile data
      const enrichedSubscribers: SafeSuiteSubscriber[] = (subscriptions || []).map(sub => ({
        ...sub,
        tier: sub.tier as SafeSuiteTier,
        email: profileMap.get(sub.user_id)?.email || 'Unknown',
        full_name: profileMap.get(sub.user_id)?.full_name || ''
      }));

      setSubscribers(enrichedSubscribers);
      setFilteredSubscribers(enrichedSubscribers);

      // Calculate stats
      const freeUsers = enrichedSubscribers.filter(s => s.tier === 'free').length;
      const proUsers = enrichedSubscribers.filter(s => s.tier === 'pro' && s.status === 'active').length;
      const businessUsers = enrichedSubscribers.filter(s => s.tier === 'business' && s.status === 'active').length;
      
      // Estimate MRR: Pro = $9.99, Business = $15 (per user, assuming 1 seat average for now)
      const monthlyRevenue = (proUsers * 9.99) + (businessUsers * 15);

      setStats({
        totalSubscribers: enrichedSubscribers.length,
        freeUsers,
        proUsers,
        businessUsers,
        monthlyRevenue,
        activeSubscriptions: proUsers + businessUsers
      });

    } catch (error) {
      console.error('Failed to load subscribers:', error);
      toast({
        title: "Error",
        description: "Failed to load subscriber data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter subscribers based on search and filters
  useEffect(() => {
    let filtered = [...subscribers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.email?.toLowerCase().includes(term) ||
        s.full_name?.toLowerCase().includes(term) ||
        s.user_id.toLowerCase().includes(term)
      );
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(s => s.tier === tierFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    setFilteredSubscribers(filtered);
  }, [searchTerm, tierFilter, statusFilter, subscribers]);

  const handleUpdateTier = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);

      // Update the subscription tier in the database
      const { error } = await supabase
        .from('safesuite_subscriptions')
        .update({ 
          tier: newTier,
          status: 'active', // Ensure it's active when manually setting
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast({
        title: "Tier Updated",
        description: `${editingUser.email} is now on the ${SAFESUITE_TIERS[newTier].name} tier`,
      });

      setEditingUser(null);
      await loadSubscribers();
    } catch (error) {
      console.error('Failed to update tier:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription tier",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubscription = async (userId: string, email: string) => {
    try {
      setSaving(true);

      // Create a new subscription record for the user
      const { error } = await supabase
        .from('safesuite_subscriptions')
        .insert({
          user_id: userId,
          tier: newTier,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Subscription Created",
        description: `${email} has been assigned the ${SAFESUITE_TIERS[newTier].name} tier`,
      });

      await loadSubscribers();
    } catch (error) {
      console.error('Failed to create subscription:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getTierBadge = (tier: SafeSuiteTier) => {
    switch (tier) {
      case 'business':
        return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"><Crown className="h-3 w-3 mr-1" />Business</Badge>;
      case 'pro':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Sparkles className="h-3 w-3 mr-1" />Pro</Badge>;
      default:
        return <Badge variant="secondary"><UserIcon className="h-3 w-3 mr-1" />Free</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Active</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Canceled</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Past Due</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">Trial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isAdmin === null || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading admin center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="bg-muted/30 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
              >
                <Home className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">SafeSuite Admin Center</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              SafeSuite Subscriber Management
            </h1>
            <p className="text-muted-foreground mt-2">
              View all subscribers, billing data, and manually manage subscription tiers
            </p>
          </div>
          <Button onClick={loadSubscribers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
              <p className="text-xs text-muted-foreground">All SafeSuite users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Free
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.freeUsers}</div>
              <p className="text-xs text-muted-foreground">Free tier users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Pro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.proUsers}</div>
              <p className="text-xs text-muted-foreground">$9.99/mo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Business
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.businessUsers}</div>
              <p className="text-xs text-muted-foreground">$15/user/mo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Active Subs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">Paying customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Est. MRR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.monthlyRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Monthly recurring</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subscriber List</CardTitle>
            <CardDescription>Search and filter subscribers, click to modify tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subscribers Table */}
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period End</TableHead>
                    <TableHead>Stripe</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No subscribers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{subscriber.email}</div>
                            {subscriber.full_name && (
                              <div className="text-sm text-muted-foreground">{subscriber.full_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getTierBadge(subscriber.tier)}</TableCell>
                        <TableCell>{getStatusBadge(subscriber.status)}</TableCell>
                        <TableCell>
                          {subscriber.current_period_end ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(subscriber.current_period_end), 'MMM d, yyyy')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {subscriber.stripe_subscription_id ? (
                            <Badge variant="outline" className="text-xs font-mono">
                              {subscriber.stripe_subscription_id.slice(0, 12)}...
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Manual
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(subscriber.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setEditingUser(subscriber);
                                  setNewTier(subscriber.tier);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Modify Subscription Tier</DialogTitle>
                                <DialogDescription>
                                  Change subscription tier for {editingUser?.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                  <Mail className="h-4 w-4" />
                                  <span className="font-medium">{editingUser?.email}</span>
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Current Tier</label>
                                  <div>{editingUser && getTierBadge(editingUser.tier)}</div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium">New Tier</label>
                                  <Select value={newTier} onValueChange={(v) => setNewTier(v as SafeSuiteTier)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="free">
                                        <div className="flex items-center gap-2">
                                          <UserIcon className="h-4 w-4" />
                                          Free - $0/mo
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="pro">
                                        <div className="flex items-center gap-2">
                                          <Sparkles className="h-4 w-4 text-purple-500" />
                                          Pro - $9.99/mo
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="business">
                                        <div className="flex items-center gap-2">
                                          <Crown className="h-4 w-4 text-amber-500" />
                                          Business - $15/user/mo
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                                    This will override Stripe billing status. Use for testing only.
                                  </p>
                                </div>

                                <div className="flex gap-2 justify-end">
                                  <Button variant="outline" onClick={() => setEditingUser(null)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleUpdateTier} disabled={saving}>
                                    {saving ? (
                                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                      <Check className="h-4 w-4 mr-2" />
                                    )}
                                    Update Tier
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredSubscribers.length} of {subscribers.length} subscribers
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SafeSuiteAdminCenter;
