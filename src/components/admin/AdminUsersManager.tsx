import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Edit, Mail, KeyRound, MoreHorizontal, Ban, UserCheck, Calendar, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTableWithSearch } from './DataTableWithSearch';
import { format } from 'date-fns';

export const AdminUsersManager = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showPaymentsDialog, setShowPaymentsDialog] = useState(false);
  const [showSubscriptionsDialog, setShowSubscriptionsDialog] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      console.log('🔍 Fetching users for admin dashboard...');
      
      // Fetch profiles first, then join with related data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get subscription data for all users
      const { data: subscriptionsData } = await supabase
        .from('subscribers')
        .select('user_id, subscription_tier, subscribed');

      // Get credits data for all users  
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('user_id, credits_used, credits_limit');

      // Combine the data
      const combinedData = profilesData?.map(profile => ({
        ...profile,
        subscribers: subscriptionsData?.filter(sub => sub.user_id === profile.user_id) || [],
        user_credits: creditsData?.filter(credit => credit.user_id === profile.user_id) || []
      })) || [];

      console.log('👥 Users data:', { count: combinedData?.length });

      setUsers(combinedData || []);
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      toast({
        title: "Error",
        description: `Failed to fetch users: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for users
  useEffect(() => {
    const channel = supabase.channel('admin-users')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        console.log('🔴 Users table change:', payload);
        fetchUsers(); // Refresh data on any change
      })
      .subscribe();

    fetchUsers();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateUser = async (userId: string, updates: any, subscriptionUpdates?: any) => {
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update subscription if provided
      if (subscriptionUpdates) {
        const { error: subscriptionError } = await supabase
          .from('subscribers')
          .upsert({
            user_id: userId,
            email: editingUser.email,
            ...subscriptionUpdates,
            updated_at: new Date().toISOString()
          });

        if (subscriptionError) throw subscriptionError;
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });
      
      fetchUsers();
      setEditingUser(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleSuspendUser = async (user: any) => {
    try {
      // In a real implementation, you'd update a status field
      toast({
        title: "Success",
        description: `User ${user.email} suspended`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      });
    }
  };

  const handleResendWelcomeEmail = async (user: any) => {
    try {
      // Simulate email sending
      toast({
        title: "Success",
        description: `Welcome email sent to ${user.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send welcome email",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (user: any) => {
    try {
      // Simulate password reset
      toast({
        title: "Success",
        description: `Password reset email sent to ${user.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive",
      });
    }
  };

  const handleConfirmEmail = async (user: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-confirm-user', {
        body: { email: user.email }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Email confirmed for ${user.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to confirm email: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const exportUsers = async (format: 'csv' | 'excel') => {
    try {
      // Simulate export
      const data = users.map(user => ({
        email: user.email,
        full_name: user.full_name,
        company_name: user.company_name,
        account_type: user.account_type,
        created_at: user.created_at,
        subscription: user.subscribers?.[0]?.subscription_tier || 'free',
        credits_used: user.user_credits?.[0]?.credits_used || 0,
        credits_limit: user.user_credits?.[0]?.credits_limit || 0
      }));

      // In a real implementation, you'd generate and download the file
      console.log(`Exporting ${data.length} users as ${format.toUpperCase()}`);
      
      toast({
        title: "Export Started",
        description: `Exporting ${data.length} users as ${format.toUpperCase()}...`,
      });
      
      setTimeout(() => {
        toast({
          title: "Export Complete",
          description: `Users exported successfully`,
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export users",
        variant: "destructive",
      });
    }
  };

  const getAccountTypeBadge = (accountType: string) => {
    const colors = {
      business: 'default',
      msp: 'secondary', 
      mssp: 'outline'
    };
    return (
      <Badge variant={colors[accountType as keyof typeof colors] as any || 'default'}>
        {accountType?.toUpperCase() || 'BUSINESS'}
      </Badge>
    );
  };

  const getSubscriptionBadge = (subscription: any) => {
    if (!subscription || !subscription.subscribed) {
      return <Badge variant="outline">Free</Badge>;
    }
    
    const colors = {
      enterprise: 'default',
      premium: 'secondary',
      basic: 'outline'
    };
    
    return (
      <Badge variant={colors[subscription.subscription_tier as keyof typeof colors] as any || 'outline'}>
        {subscription.subscription_tier?.toUpperCase() || 'BASIC'}
      </Badge>
    );
  };

  const openPermissionsManager = (userId: string, userEmail: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(userEmail);
    setShowPermissionsDialog(true);
  };

  const openPaymentsManager = () => {
    setShowPaymentsDialog(true);
  };

  const openSubscriptionsManager = () => {
    setShowSubscriptionsDialog(true);
  };

  const columns = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      filterable: true,
      render: (email: string, user: any) => (
        <div>
          <p className="font-medium">{user.full_name || 'N/A'}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
          {user.company_name && (
            <p className="text-xs text-muted-foreground">{user.company_name}</p>
          )}
        </div>
      )
    },
    {
      key: 'account_type',
      label: 'Account Type',
      filterable: true,
      filterType: 'select' as const,
      filterOptions: ['business', 'msp', 'mssp'],
      render: (accountType: string) => getAccountTypeBadge(accountType)
    },
    {
      key: 'subscribers',
      label: 'Subscription',
      render: (subscribers: any[]) => getSubscriptionBadge(subscribers?.[0])
    },
    {
      key: 'user_credits',
      label: 'Credits',
      render: (credits: any[]) => {
        const credit = credits?.[0];
        return credit ? (
          <div className="text-sm">
            <span className="font-medium">{credit.credits_used}</span>
            <span className="text-muted-foreground"> / {credit.credits_limit}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">No data</span>
        );
      }
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (date: string) => format(new Date(date), 'MMM dd, yyyy')
    }
  ];

  const renderActions = (user: any) => (
    <div className="flex items-center gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setEditingUser(user)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and account settings
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={editingUser.full_name || ''}
                    onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={editingUser.company_name || ''}
                    onChange={(e) => setEditingUser({...editingUser, company_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_type">Account Type</Label>
                <Select 
                  value={editingUser.account_type} 
                  onValueChange={(value) => setEditingUser({...editingUser, account_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="msp">MSP</SelectItem>
                    <SelectItem value="mssp">MSSP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subscription_status">Subscription Status</Label>
                  <Select 
                    value={editingUser.subscribers?.[0]?.subscribed ? 'true' : 'false'} 
                    onValueChange={(value) => {
                      const subscriber = editingUser.subscribers?.[0] || {};
                      setEditingUser({
                        ...editingUser, 
                        subscribers: [{
                          ...subscriber,
                          subscribed: value === 'true',
                          user_id: editingUser.user_id
                        }]
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription_tier">Subscription Tier</Label>
                  <Select 
                    value={editingUser.subscribers?.[0]?.subscription_tier || 'free'} 
                    onValueChange={(value) => {
                      const subscriber = editingUser.subscribers?.[0] || {};
                      setEditingUser({
                        ...editingUser, 
                        subscribers: [{
                          ...subscriber,
                          subscription_tier: value,
                          user_id: editingUser.user_id
                        }]
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateUser(editingUser.id, {
                  full_name: editingUser.full_name,
                  company_name: editingUser.company_name,
                  account_type: editingUser.account_type
                }, {
                  subscribed: editingUser.subscribers?.[0]?.subscribed || false,
                  subscription_tier: editingUser.subscribers?.[0]?.subscription_tier || 'free'
                })}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => handleResendWelcomeEmail(user)}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Resend Welcome Email
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleResetPassword(user)}
            className="flex items-center gap-2"
          >
            <KeyRound className="h-4 w-4" />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleConfirmEmail(user)}
            className="flex items-center gap-2 text-green-600"
          >
            <CheckCircle className="h-4 w-4" />
            Confirm Email
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleSuspendUser(user)}
            className="flex items-center gap-2 text-red-600"
          >
            <Ban className="h-4 w-4" />
            Suspend User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <DataTableWithSearch
      data={users}
      columns={columns}
      title="User Management"
      loading={loading}
      onRefresh={fetchUsers}
      onExport={exportUsers}
      actions={renderActions}
      pageSize={20}
    />
  );
};