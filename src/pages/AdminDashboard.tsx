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
  Clock,
  Power,
  PowerOff
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  subscription_tier: string;
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
  const [onboardingFeesMap, setOnboardingFeesMap] = useState<Map<string, number>>(new Map());
  const [clientsData, setClientsData] = useState<any[]>([]);
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

      // Get client count and business size for each MSP
      const { data: clientData } = await supabase
        .from('msp_clients')
        .select('id, msp_id, company_name, business_size, onboarding_fee_paid, onboarding_fee_amount');

      // Load all users
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, created_at, account_type')
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      // Create lookup maps
      const userMap = new Map(mspUsers?.map(user => [user.id, user]) || []);
      const subscriptionMap = new Map(subscriptionData?.map(sub => [sub.user_id, sub]) || []);
      
      // Create client count and onboarding fee maps
      const clientCountMap = new Map();
      const onboardingFeesMap = new Map();
      
      clientData?.forEach(client => {
        const count = clientCountMap.get(client.msp_id) || 0;
        clientCountMap.set(client.msp_id, count + 1);
        
        // Calculate onboarding fee based on business size
        if (!client.onboarding_fee_paid) {
          const currentFees = onboardingFeesMap.get(client.msp_id) || 0;
          let feeAmount = 0;
          switch (client.business_size) {
            case 'small':
              feeAmount = 500;
              break;
            case 'medium':
              feeAmount = 1500;
              break;
            case 'enterprise':
              feeAmount = 2500;
              break;
            default:
              feeAmount = 500;
          }
          onboardingFeesMap.set(client.msp_id, currentFees + feeAmount);
        }
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
          subscription_tier: subscription?.subscription_tier || 'Basic',
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
      setOnboardingFeesMap(onboardingFeesMap);
      setClientsData(clientData || []);

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

  const toggleMSPPaymentStatus = async (mspId: string, currentStatus: string) => {
    try {
      const msp = msps.find(msp => msp.id === mspId);
      if (!msp) return;

      // Find the user ID based on the MSP data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', msp.user_email)
        .single();

      if (!profiles) throw new Error('User profile not found');

      const newStatus = currentStatus === 'Active' ? false : true;
      const { error } = await supabase
        .from('subscribers')
        .update({ subscribed: newStatus })
        .eq('user_id', profiles.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `MSP payment status updated to ${newStatus ? 'paid' : 'unpaid'}`,
      });
      
      await loadAdminData();
    } catch (error) {
      console.error('Error updating MSP payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update MSP payment status",
        variant: "destructive",
      });
    }
  };

  const toggleClientOnboardingFee = async (mspId: string, clientId: string) => {
    try {
      const { error } = await supabase
        .from('msp_clients')
        .update({ onboarding_fee_paid: true })
        .eq('id', clientId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Client onboarding fee marked as paid",
      });
      
      await loadAdminData();
    } catch (error) {
      console.error('Error updating onboarding fee status:', error);
      toast({
        title: "Error",
        description: "Failed to update onboarding fee status",
        variant: "destructive",
      });
    }
  };

  const toggleMSPActivation = async (mspId: string, currentStatus: string) => {
    try {
      const msp = msps.find(msp => msp.id === mspId);
      if (!msp) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', msp.user_email)
        .single();

      if (!profiles) throw new Error('User profile not found');

      // Toggle between active and inactive - if currently Active, make inactive, if inactive make active
      const newActiveStatus = currentStatus !== 'Active';
      
      // Update or create subscriber record
      const { error } = await supabase
        .from('subscribers')
        .upsert({
          user_id: profiles.id,
          email: msp.user_email,
          subscribed: newActiveStatus,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `MSP ${newActiveStatus ? 'activated' : 'deactivated'} successfully`,
      });
      
      await loadAdminData();
    } catch (error) {
      console.error('Error toggling MSP activation:', error);
      toast({
        title: "Error",
        description: "Failed to toggle MSP activation",
        variant: "destructive",
      });
    }
  };

  const updateSubscriptionTier = async (mspId: string, newTier: string) => {
    try {
      const msp = msps.find(msp => msp.id === mspId);
      if (!msp) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', msp.user_email)
        .single();

      if (!profiles) throw new Error('User profile not found');

      const { error } = await supabase
        .from('subscribers')
        .upsert({
          user_id: profiles.id,
          email: msp.user_email,
          subscription_tier: newTier,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Subscription tier updated to ${newTier}`,
      });
      
      await loadAdminData();
    } catch (error) {
      console.error('Error updating subscription tier:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription tier",
        variant: "destructive",
      });
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
              <Button
                variant="default"
                onClick={() => navigate('/admin/safesuite')}
              >
                <Shield className="h-4 w-4 mr-2" />
                SafeSuite Admin
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
                        <div className="text-xs text-muted-foreground">
                          Tier: {msp.subscription_tier} • Clients: {msp.client_count}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={msp.subscription_status === 'Active' ? 'default' : 'secondary'}>
                              {msp.subscription_status}
                            </Badge>
                            <Button
                              size="sm"
                              variant={msp.subscription_status === 'Active' ? 'destructive' : 'default'}
                              onClick={() => toggleMSPActivation(msp.id, msp.subscription_status)}
                            >
                              {msp.subscription_status === 'Active' ? (
                                <PowerOff className="h-3 w-3 mr-1" />
                              ) : (
                                <Power className="h-3 w-3 mr-1" />
                              )}
                              {msp.subscription_status === 'Active' ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={msp.subscription_tier}
                              onValueChange={(value) => updateSubscriptionTier(msp.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Basic">Basic</SelectItem>
                                <SelectItem value="Premium">Premium</SelectItem>
                                <SelectItem value="Enterprise">Enterprise</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm">
                              Manage
                            </Button>
                          </div>
                        </div>
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
            {/* Pricing Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Pricing Structure</CardTitle>
                <CardDescription>
                  Current billing model for MSP partners and their clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-primary">MSP Platform Fees</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Base Platform Access:</span>
                        <span className="font-medium">$79/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Per Client/User:</span>
                        <span className="font-medium">$15/month</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-primary">Client Onboarding Fees</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Small Business:</span>
                        <span className="font-medium">$500 one-time</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medium Business:</span>
                        <span className="font-medium">$1,500 one-time</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Enterprise:</span>
                        <span className="font-medium">$2,500 one-time</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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

            {/* Pending Onboarding Fees */}
            {msps.some(msp => {
              const pendingFees = Array.from(onboardingFeesMap.values()).reduce((sum, fee) => sum + fee, 0);
              return pendingFees > 0;
            }) && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Pending Onboarding Fees
                  </CardTitle>
                  <CardDescription>
                    One-time fees pending collection from MSP clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                     {msps.map((msp) => {
                       const pendingFees = onboardingFeesMap.get(msp.id) || 0;
                       const unpaidClients = clientsData.filter(client => 
                         client.msp_id === msp.id && !client.onboarding_fee_paid
                       );
                       
                       if (pendingFees === 0) return null;
                       
                       return (
                         <div key={msp.id} className="space-y-2">
                           <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                             <div>
                               <div className="font-medium">{msp.company_name}</div>
                               <div className="text-sm text-muted-foreground">
                                 {unpaidClients.length} unpaid onboarding fee{unpaidClients.length !== 1 ? 's' : ''}
                               </div>
                             </div>
                             <div className="text-right">
                               <div className="font-bold text-orange-600">${pendingFees}</div>
                               <div className="text-xs text-muted-foreground">Due on collection</div>
                             </div>
                           </div>
                           {unpaidClients.map((client) => {
                             const feeAmount = client.business_size === 'small' ? 500 :
                                             client.business_size === 'medium' ? 1500 : 2500;
                             return (
                               <div key={client.id} className="flex items-center justify-between p-2 ml-4 bg-background border rounded">
                                 <div>
                                   <div className="font-medium text-sm">{client.company_name}</div>
                                   <div className="text-xs text-muted-foreground">
                                     {client.business_size} business • ${feeAmount}
                                   </div>
                                 </div>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => toggleClientOnboardingFee(msp.id, client.id)}
                                 >
                                   <UserCheck className="h-3 w-3 mr-1" />
                                   Mark Paid
                                 </Button>
                               </div>
                             );
                           })}
                         </div>
                       );
                     })}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between font-semibold">
                        <span>Total Pending:</span>
                        <span className="text-orange-600">
                          ${Array.from(onboardingFeesMap.values()).reduce((sum, fee) => sum + fee, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                    const pendingOnboardingFees = onboardingFeesMap.get(msp.id) || 0;
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
                            {pendingOnboardingFees > 0 && (
                              <div className="text-xs text-orange-600 font-medium">
                                + ${pendingOnboardingFees} onboarding fee pending
                              </div>
                            )}
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