import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Trash2, Plus, Filter, Mail, KeyRound, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const AdminUsersManager = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingUser, setEditingUser] = useState<any>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles(role),
          subscribers(subscription_tier, subscribed, subscription_end),
          user_credits(credits_used, credits_limit)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

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

  const handleResendWelcomeEmail = async (user: any) => {
    try {
      const { error } = await supabase.functions.invoke('admin-resend-welcome', {
        body: {
          userId: user.id,
          email: user.email,
          name: user.full_name
        }
      });

      if (error) throw error;

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
      const { error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          email: user.email,
          redirectTo: `${window.location.origin}/auth`
        }
      });

      if (error) throw error;

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

  const getAccountTypeBadge = (accountType: string) => {
    const colors = {
      business: 'bg-gray-100 text-gray-800',
      msp: 'bg-blue-100 text-blue-800',
      mssp: 'bg-purple-100 text-purple-800'
    };
    return (
      <Badge className={colors[accountType as keyof typeof colors] || colors.business}>
        {accountType?.toUpperCase() || 'BUSINESS'}
      </Badge>
    );
  };

  const getSubscriptionBadge = (subscription: any) => {
    if (!subscription || !subscription.subscribed) {
      return <Badge variant="outline">Free</Badge>;
    }
    
    const colors = {
      enterprise: 'bg-yellow-100 text-yellow-800',
      premium: 'bg-purple-100 text-purple-800',
      basic: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <Badge className={colors[subscription.subscription_tier as keyof typeof colors] || colors.basic}>
        {subscription.subscription_tier?.toUpperCase() || 'BASIC'}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'msp') return matchesSearch && user.account_type === 'msp';
    if (filterType === 'mssp') return matchesSearch && user.account_type === 'mssp';
    if (filterType === 'business') return matchesSearch && user.account_type === 'business';
    if (filterType === 'subscribed') return matchesSearch && user.subscribers?.subscribed;
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage all platform users, their account types, and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email, name, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="msp">MSPs</SelectItem>
                <SelectItem value="mssp">MSSPs</SelectItem>
                <SelectItem value="subscribed">Subscribed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.company_name && (
                          <p className="text-xs text-muted-foreground">{user.company_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAccountTypeBadge(user.account_type)}
                    </TableCell>
                    <TableCell>
                      {getSubscriptionBadge(user.subscribers)}
                    </TableCell>
                    <TableCell>
                      {user.user_credits ? (
                        <div className="text-sm">
                          <span className="font-medium">{user.user_credits.credits_used}</span>
                          <span className="text-muted-foreground"> / {user.user_credits.credits_limit}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No data</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setEditingUser(null)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={() => handleUpdateUser(editingUser.id, {
                                    full_name: editingUser.full_name,
                                    company_name: editingUser.company_name,
                                    account_type: editingUser.account_type
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};