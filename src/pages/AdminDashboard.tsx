import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Building2,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowLeft,
  Home,
  Shield,
  Settings,
  DollarSign,
  UserCheck,
  Clock
} from 'lucide-react';

interface AdminStats {
  totalMSPs: number;
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  pendingTickets: number;
  systemHealth: string;
}

interface MSPData {
  id: string;
  company_name: string;
  created_at: string;
  user_email: string;
  subscription_status: string;
  client_count: number;
  last_active: string;
}

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  account_type: string;
  is_active: boolean;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalMSPs: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    pendingTickets: 0,
    systemHealth: 'healthy'
  });
  const [msps, setMSPs] = useState<MSPData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Check if user is admin (UltriumAI employee)
      const isUltriumEmployee = user.email?.endsWith('@ultriumai.com');
      if (!isUltriumEmployee) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadAdminData();
    } catch (error) {
      console.error('Admin access check failed:', error);
      navigate('/dashboard');
    }
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load MSPs with user data
      const { data: mspData, error: mspError } = await supabase
        .from('msps')
        .select(`
          id,
          company_name,
          created_at,
          user_id,
          contact_email
        `);

      if (mspError) throw mspError;

      // Get user details for MSPs
      const userIds = mspData?.map(msp => msp.user_id).filter(Boolean) || [];
      const { data: mspUsers } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      // Get subscription data
      const { data: subscriptionData } = await supabase
        .from('subscribers')
        .select('user_id, subscribed, subscription_tier')
        .in('user_id', userIds);

      // Get client count for each MSP
      const { data: clientCounts } = await supabase
        .from('msp_clients')
        .select('msp_id');

      // Load all users
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, created_at, account_type')
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      // Create lookup maps
      const userMap = new Map(mspUsers?.map(user => [user.id, user]) || []);
      const subscriptionMap = new Map(subscriptionData?.map(sub => [sub.user_id, sub]) || []);
      
      // Create client count map
      const clientCountMap = new Map();
      clientCounts?.forEach(client => {
        const count = clientCountMap.get(client.msp_id) || 0;
        clientCountMap.set(client.msp_id, count + 1);
      });

      // Process MSP data
      const processedMSPs = mspData?.map(msp => {
        const user = userMap.get(msp.user_id);
        const subscription = subscriptionMap.get(msp.user_id);
        const clientCount = clientCountMap.get(msp.id) || 0;
        
        return {
          id: msp.id,
          company_name: msp.company_name,
          created_at: msp.created_at,
          user_email: user?.email || msp.contact_email || 'Unknown',
          subscription_status: subscription?.subscribed ? 'Active' : 'Inactive',
          client_count: clientCount,
          last_active: new Date().toISOString() // TODO: Add real last active tracking
        };
      }) || [];

      // Process user data
      const processedUsers = userData?.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.created_at, // Using created_at as fallback
        account_type: user.account_type || 'business',
        is_active: true // TODO: Add real active status
      })) || [];

      // Calculate stats
      const activeSubscriptions = processedMSPs.filter(msp => msp.subscription_status === 'Active').length;
      const totalClients = processedMSPs.reduce((sum, msp) => sum + msp.client_count, 0);
      const platformRevenue = activeSubscriptions * 79;
      const userRevenue = totalClients * 15;
      
      setStats({
        totalMSPs: processedMSPs.length,
        totalUsers: processedUsers.length,
        activeSubscriptions,
        monthlyRevenue: platformRevenue + userRevenue, // Combined revenue
        pendingTickets: 0, // TODO: Add ticket count
        systemHealth: 'healthy'
      });

      setMSPs(processedMSPs);
      setUsers(processedUsers);

    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin === null || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading admin dashboard...</p>
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
                onClick={() => navigate('/dashboard')}
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Admin Portal</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Platform Administration
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your entire UltriumAI platform from here
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Total MSPs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMSPs}</div>
              <p className="text-xs text-muted-foreground">Active partners</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Platform users</p>
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
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.monthlyRevenue}</div>
              <p className="text-xs text-muted-foreground">Estimated MRR</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTickets}</div>
              <p className="text-xs text-muted-foreground">Support tickets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Healthy</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="msps" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="msps" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              MSP Partners
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Users
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="msps" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>MSP Partners</CardTitle>
                <CardDescription>
                  Manage all MSP partners on your platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {msps.map((msp) => (
                    <div key={msp.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{msp.company_name}</div>
                        <div className="text-sm text-muted-foreground">{msp.user_email}</div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(msp.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={msp.subscription_status === 'Active' ? 'default' : 'secondary'}>
                          {msp.subscription_status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Users</CardTitle>
                <CardDescription>
                  View and manage all users across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.slice(0, 20).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Account Type: {user.account_type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Platform Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.activeSubscriptions * 79}</div>
                  <p className="text-xs text-muted-foreground">Base platform fees/month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Per-User Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${msps.reduce((sum, msp) => sum + (msp.subscription_status === 'Active' ? msp.client_count * 15 : 0), 0)}</div>
                  <p className="text-xs text-muted-foreground">$15/user × actual client count</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.monthlyRevenue}</div>
                  <p className="text-xs text-muted-foreground">Platform fees + user fees</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.monthlyRevenue * 12}</div>
                  <p className="text-xs text-muted-foreground">Total ARR</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>MSP Billing Breakdown</CardTitle>
                <CardDescription>
                  Platform subscription + per-user costs for each MSP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {msps.map((msp) => {
                    const platformFee = msp.subscription_status === 'Active' ? 79 : 0;
                    const userCount = msp.client_count; // Use actual client count
                    const perUserFee = 15; // $15 per user per month
                    const userFees = userCount * perUserFee;
                    const totalRevenue = platformFee + userFees;
                    
                    return (
                      <div key={msp.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{msp.company_name}</div>
                          <div className="text-sm text-muted-foreground">{msp.user_email}</div>
                          <div className="text-xs text-muted-foreground">
                            Users: {userCount} • Last payment: {new Date().toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">${totalRevenue}/month</div>
                            <div className="text-xs text-muted-foreground">
                              Platform: ${platformFee} + Users: ${userFees} (${userCount} × $15)
                            </div>
                          </div>
                          <Badge variant={msp.subscription_status === 'Active' ? 'default' : 'secondary'}>
                            {msp.subscription_status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <CreditCard className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {msps.length === 0 && (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No billing activity yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Management</CardTitle>
                <CardDescription>
                  Platform configuration and monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    System management tools coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;