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
import { Search, Edit, CreditCard, TrendingUp, Users } from 'lucide-react';

export const AdminSubscriptionsManager = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const { toast } = useToast();

  const fetchSubscriptions = async () => {
    try {
      console.log('🔍 Fetching subscriptions for admin dashboard...');
      
      // Simplified query to avoid JOIN issues
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('💳 Subscriptions data:', { count: data?.length, error: error?.message });

      if (error) throw error;
      setSubscriptions(data || []);
      setCredits([]); // Simplified - no credits for now
    } catch (error: any) {
      console.error('❌ Error fetching subscriptions:', error);
      toast({
        title: "Error",
        description: `Failed to fetch subscriptions: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleUpdateSubscription = async (userId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('subscribers')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subscription updated successfully",
      });
      
      fetchSubscriptions();
      setEditingSubscription(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCredits = async (userId: string, newLimit: number) => {
    try {
      const { error } = await supabase
        .from('user_credits')
        .update({ credits_limit: newLimit })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Credit limit updated successfully",
      });
      
      fetchSubscriptions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update credits",
        variant: "destructive",
      });
    }
  };

  const getSubscriptionBadge = (subscription: any) => {
    if (!subscription.subscribed) {
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

  const getStatusBadge = (subscription: any) => {
    if (!subscription.subscribed) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    const now = new Date();
    const endDate = new Date(subscription.subscription_end);
    
    if (endDate < now) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.profiles?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterTier === 'all') return matchesSearch;
    if (filterTier === 'free') return matchesSearch && !sub.subscribed;
    return matchesSearch && sub.subscription_tier === filterTier;
  });

  // Calculate statistics
  const totalRevenue = subscriptions
    .filter(sub => sub.subscribed)
    .reduce((total, sub) => {
      const monthlyPrices = { basic: 29, premium: 99, enterprise: 299 };
      return total + (monthlyPrices[sub.subscription_tier as keyof typeof monthlyPrices] || 0);
    }, 0);

  const activeSubscriptions = subscriptions.filter(sub => sub.subscribed).length;
  const totalCreditsUsed = credits.reduce((total, credit) => total + credit.credits_used, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From active subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Paying customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCreditsUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total platform usage</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>
            Manage user subscriptions, billing, and credit limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => {
                  const userCredits = credits.find(c => c.user_id === subscription.user_id);
                  return (
                    <TableRow key={subscription.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{subscription.profiles?.full_name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{subscription.profiles?.email}</p>
                          {subscription.profiles?.company_name && (
                            <p className="text-xs text-muted-foreground">{subscription.profiles?.company_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSubscriptionBadge(subscription)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(subscription)}
                      </TableCell>
                      <TableCell>
                        {userCredits ? (
                          <div className="text-sm">
                            <span className="font-medium">{userCredits.credits_used}</span>
                            <span className="text-muted-foreground"> / {userCredits.credits_limit}</span>
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                              <div 
                                className="bg-primary h-1 rounded-full" 
                                style={{ 
                                  width: `${Math.min((userCredits.credits_used / userCredits.credits_limit) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No data</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {subscription.subscription_end ? 
                          new Date(subscription.subscription_end).toLocaleDateString() : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setEditingSubscription({...subscription, userCredits})}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Subscription</DialogTitle>
                              <DialogDescription>
                                Update subscription and billing information
                              </DialogDescription>
                            </DialogHeader>
                            {editingSubscription && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="subscription_tier">Subscription Tier</Label>
                                    <Select 
                                      value={editingSubscription.subscription_tier || 'basic'} 
                                      onValueChange={(value) => setEditingSubscription({
                                        ...editingSubscription, 
                                        subscription_tier: value
                                      })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="basic">Basic ($29/mo)</SelectItem>
                                        <SelectItem value="premium">Premium ($99/mo)</SelectItem>
                                        <SelectItem value="enterprise">Enterprise ($299/mo)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="subscribed">Status</Label>
                                    <Select 
                                      value={editingSubscription.subscribed ? 'active' : 'inactive'} 
                                      onValueChange={(value) => setEditingSubscription({
                                        ...editingSubscription, 
                                        subscribed: value === 'active'
                                      })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="credits_limit">Credit Limit</Label>
                                  <Input
                                    id="credits_limit"
                                    type="number"
                                    value={editingSubscription.userCredits?.credits_limit || 500}
                                    onChange={(e) => setEditingSubscription({
                                      ...editingSubscription, 
                                      userCredits: {
                                        ...editingSubscription.userCredits,
                                        credits_limit: parseInt(e.target.value)
                                      }
                                    })}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setEditingSubscription(null)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={() => {
                                    handleUpdateSubscription(editingSubscription.user_id, {
                                      subscription_tier: editingSubscription.subscription_tier,
                                      subscribed: editingSubscription.subscribed
                                    });
                                    if (editingSubscription.userCredits) {
                                      handleUpdateCredits(
                                        editingSubscription.user_id, 
                                        editingSubscription.userCredits.credits_limit
                                      );
                                    }
                                  }}>
                                    Save Changes
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No subscriptions found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};