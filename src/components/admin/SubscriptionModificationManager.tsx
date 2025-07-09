import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpCircle, ArrowDownCircle, XCircle, RotateCcw, CreditCard, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { format } from 'date-fns';

interface SubscriptionModification {
  id: string;
  user_id: string;
  subscription_id: string | null;
  modification_type: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate' | 'change_payment';
  from_tier: string | null;
  to_tier: string | null;
  from_amount: number | null;
  to_amount: number | null;
  proration_amount: number;
  effective_date: string;
  stripe_proration_id: string | null;
  reason: string | null;
  processed_by: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

interface Subscriber {
  id: string;
  user_id: string;
  email: string;
  stripe_customer_id: string | null;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  updated_at: string;
  created_at: string;
}

const SUBSCRIPTION_TIERS = [
  { name: 'basic', label: 'Basic', price: 999, features: ['Basic features', 'Email support'] },
  { name: 'premium', label: 'Premium', price: 2999, features: ['All basic features', 'Priority support', 'Advanced analytics'] },
  { name: 'enterprise', label: 'Enterprise', price: 9999, features: ['All premium features', 'Custom integrations', 'Dedicated support'] }
];

interface ModificationDialogData {
  subscriber: Subscriber;
  type: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate';
}

export const SubscriptionModificationManager = () => {
  const [modifications, setModifications] = useState<SubscriptionModification[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModificationDialog, setShowModificationDialog] = useState(false);
  const [modificationData, setModificationData] = useState<ModificationDialogData | null>(null);
  const [selectedTier, setSelectedTier] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { logAdminAction } = useAuditLogger();

  const fetchData = async () => {
    try {
      // Fetch subscribers
      const { data: subscribersData, error: subscribersError } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (subscribersError) throw subscribersError;
      setSubscribers(subscribersData || []);

      // Mock subscription modifications data
      const mockModifications: SubscriptionModification[] = [
        {
          id: '1',
          user_id: 'user-1',
          subscription_id: 'sub-1',
          modification_type: 'upgrade',
          from_tier: 'basic',
          to_tier: 'premium',
          from_amount: 999,
          to_amount: 2999,
          proration_amount: 1500,
          effective_date: new Date().toISOString(),
          stripe_proration_id: 'proration_1234567890',
          reason: 'Customer requested upgrade to premium features',
          processed_by: 'admin-1',
          metadata: { upgrade_reason: 'feature_request' },
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          user_email: 'john@example.com',
          user_name: 'John Doe'
        },
        {
          id: '2',
          user_id: 'user-2',
          subscription_id: 'sub-2',
          modification_type: 'cancel',
          from_tier: 'premium',
          to_tier: null,
          from_amount: 2999,
          to_amount: 0,
          proration_amount: -1000,
          effective_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          stripe_proration_id: null,
          reason: 'Customer requested cancellation',
          processed_by: 'admin-2',
          metadata: { cancel_reason: 'cost_concerns' },
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          user_email: 'jane@example.com',
          user_name: 'Jane Smith'
        }
      ];

      setModifications(mockModifications);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch subscription data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateProration = (fromAmount: number, toAmount: number, daysRemaining: number = 15): number => {
    const dailyFromRate = fromAmount / 30;
    const dailyToRate = toAmount / 30;
    const proratedRefund = dailyFromRate * daysRemaining;
    const proratedCharge = dailyToRate * daysRemaining;
    return Math.round(proratedCharge - proratedRefund);
  };

  const handleModification = async () => {
    if (!modificationData || !selectedTier || !reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const currentTier = SUBSCRIPTION_TIERS.find(t => t.name === modificationData.subscriber.subscription_tier);
      const newTier = SUBSCRIPTION_TIERS.find(t => t.name === selectedTier);
      
      let modificationType: 'upgrade' | 'downgrade' = 'upgrade';
      if (currentTier && newTier) {
        modificationType = newTier.price > currentTier.price ? 'upgrade' : 'downgrade';
      }

      const proratedAmount = currentTier && newTier 
        ? calculateProration(currentTier.price, newTier.price)
        : 0;

      const newModification: SubscriptionModification = {
        id: Date.now().toString(),
        user_id: modificationData.subscriber.user_id,
        subscription_id: modificationData.subscriber.id,
        modification_type: modificationType,
        from_tier: modificationData.subscriber.subscription_tier,
        to_tier: selectedTier,
        from_amount: currentTier?.price || 0,
        to_amount: newTier?.price || 0,
        proration_amount: proratedAmount,
        effective_date: new Date().toISOString(),
        stripe_proration_id: `proration_${Date.now()}`,
        reason: reason,
        processed_by: 'current-admin',
        metadata: { 
          modification_reason: reason,
          calculated_proration: proratedAmount
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_email: modificationData.subscriber.email,
        user_name: modificationData.subscriber.email
      };

      // Add to modifications list
      setModifications(prev => [newModification, ...prev]);

      // Update subscriber
      const { error: updateError } = await supabase
        .from('subscribers')
        .update({
          subscription_tier: selectedTier,
          updated_at: new Date().toISOString()
        })
        .eq('id', modificationData.subscriber.id);

      if (updateError) throw updateError;

      // Update local subscribers state
      setSubscribers(prev => prev.map(sub => 
        sub.id === modificationData.subscriber.id 
          ? { ...sub, subscription_tier: selectedTier, updated_at: new Date().toISOString() }
          : sub
      ));

      await logAdminAction({
        action: 'modify_subscription',
        resource_type: 'subscription',
        resource_id: modificationData.subscriber.id,
        resource_name: modificationData.subscriber.email,
        metadata: {
          modification_type: modificationType,
          from_tier: modificationData.subscriber.subscription_tier,
          to_tier: selectedTier,
          proration_amount: proratedAmount
        }
      });

      toast({
        title: "Success",
        description: `Subscription ${modificationType} processed successfully`,
      });

      setShowModificationDialog(false);
      setModificationData(null);
      setSelectedTier('');
      setReason('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to process subscription modification",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancellation = async (subscriber: Subscriber) => {
    setProcessing(true);
    try {
      const cancellationModification: SubscriptionModification = {
        id: Date.now().toString(),
        user_id: subscriber.user_id,
        subscription_id: subscriber.id,
        modification_type: 'cancel',
        from_tier: subscriber.subscription_tier,
        to_tier: null,
        from_amount: SUBSCRIPTION_TIERS.find(t => t.name === subscriber.subscription_tier)?.price || 0,
        to_amount: 0,
        proration_amount: 0,
        effective_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Cancel in 7 days
        stripe_proration_id: null,
        reason: 'Administrative cancellation',
        processed_by: 'current-admin',
        metadata: { admin_cancelled: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_email: subscriber.email,
        user_name: subscriber.email
      };

      setModifications(prev => [cancellationModification, ...prev]);

      // Update subscriber status
      const { error: updateError } = await supabase
        .from('subscribers')
        .update({
          subscribed: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriber.id);

      if (updateError) throw updateError;

      setSubscribers(prev => prev.map(sub => 
        sub.id === subscriber.id 
          ? { ...sub, subscribed: false, updated_at: new Date().toISOString() }
          : sub
      ));

      await logAdminAction({
        action: 'cancel_subscription',
        resource_type: 'subscription',
        resource_id: subscriber.id,
        resource_name: subscriber.email,
        metadata: { 
          cancelled_tier: subscriber.subscription_tier,
          effective_date: cancellationModification.effective_date
        }
      });

      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openModificationDialog = (subscriber: Subscriber, type: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate') => {
    setModificationData({ subscriber, type });
    setShowModificationDialog(true);
  };

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getModificationIcon = (type: string) => {
    switch (type) {
      case 'upgrade': return <ArrowUpCircle className="h-4 w-4" />;
      case 'downgrade': return <ArrowDownCircle className="h-4 w-4" />;
      case 'cancel': return <XCircle className="h-4 w-4" />;
      case 'reactivate': return <RotateCcw className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getModificationColor = (type: string) => {
    switch (type) {
      case 'upgrade': return 'default';
      case 'downgrade': return 'secondary';
      case 'cancel': return 'destructive';
      case 'reactivate': return 'default';
      default: return 'outline';
    }
  };

  const filteredModifications = modifications.filter(mod => {
    const matchesSearch = 
      mod.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || mod.modification_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalUpgrades = modifications.filter(m => m.modification_type === 'upgrade').length;
  const totalDowngrades = modifications.filter(m => m.modification_type === 'downgrade').length;
  const totalCancellations = modifications.filter(m => m.modification_type === 'cancel').length;
  const totalProratedRevenue = modifications.reduce((sum, m) => sum + (m.proration_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Modification Manager
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage subscription upgrades, downgrades, and cancellations with prorated billing
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Upgrades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUpgrades}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downgrades</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDowngrades}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellations</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCancellations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prorated Revenue</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalProratedRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Subscribers - Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Subscribers - Quick Actions</CardTitle>
          <CardDescription>
            Perform subscription modifications for active subscribers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscribers.filter(sub => sub.subscribed).slice(0, 5).map((subscriber) => (
              <div key={subscriber.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">{subscriber.email}</div>
                    <div className="text-sm text-muted-foreground">
                      Current: {subscriber.subscription_tier} • 
                      {subscriber.subscription_end && (
                        <> Ends: {format(new Date(subscriber.subscription_end), 'MMM dd, yyyy')}</>
                      )}
                    </div>
                  </div>
                  <Badge variant="default">{subscriber.subscription_tier}</Badge>
                </div>
                
                <div className="flex gap-2">
                  {subscriber.subscription_tier !== 'enterprise' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModificationDialog(subscriber, 'upgrade')}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Upgrade
                    </Button>
                  )}
                  
                  {subscriber.subscription_tier !== 'basic' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModificationDialog(subscriber, 'downgrade')}
                    >
                      <TrendingDown className="h-4 w-4 mr-1" />
                      Downgrade
                    </Button>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel the subscription for {subscriber.email}. The subscription will remain active until the end of the current billing period.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCancellation(subscriber)}>
                          Confirm Cancellation
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modification History */}
      <Card>
        <CardHeader>
          <CardTitle>Modification History</CardTitle>
          <CardDescription>
            All subscription changes and their financial impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search by user email or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="upgrade">Upgrades</SelectItem>
                <SelectItem value="downgrade">Downgrades</SelectItem>
                <SelectItem value="cancel">Cancellations</SelectItem>
                <SelectItem value="reactivate">Reactivations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead>Proration</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModifications.map((modification) => (
                  <TableRow key={modification.id}>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(modification.created_at), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(modification.created_at), 'HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{modification.user_email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getModificationColor(modification.modification_type)} className="flex items-center gap-1 w-fit">
                        {getModificationIcon(modification.modification_type)}
                        {modification.modification_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {modification.from_tier || 'None'} → {modification.to_tier || 'None'}
                      </div>
                      {modification.from_amount && modification.to_amount && (
                        <div className="text-xs text-muted-foreground">
                          {formatAmount(modification.from_amount)} → {formatAmount(modification.to_amount)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      <div className={`text-sm ${modification.proration_amount > 0 ? 'text-green-600' : modification.proration_amount < 0 ? 'text-red-600' : ''}`}>
                        {modification.proration_amount !== 0 && (
                          <>
                            {modification.proration_amount > 0 ? '+' : ''}
                            {formatAmount(modification.proration_amount)}
                          </>
                        )}
                        {modification.proration_amount === 0 && 'No charge'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(modification.effective_date), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {modification.reason}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modification Dialog */}
      <Dialog open={showModificationDialog} onOpenChange={setShowModificationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modificationData?.type === 'upgrade' ? 'Upgrade' : 'Downgrade'} Subscription
            </DialogTitle>
            <DialogDescription>
              Modify subscription for {modificationData?.subscriber.email}
            </DialogDescription>
          </DialogHeader>
          
          {modificationData && (
            <div className="space-y-4">
              <div>
                <Label>Current Tier</Label>
                <div className="p-2 bg-muted rounded">
                  {modificationData.subscriber.subscription_tier} - {formatAmount(SUBSCRIPTION_TIERS.find(t => t.name === modificationData.subscriber.subscription_tier)?.price || 0)}/month
                </div>
              </div>
              
              <div>
                <Label htmlFor="new-tier">New Tier</Label>
                <Select value={selectedTier} onValueChange={setSelectedTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_TIERS
                      .filter(tier => tier.name !== modificationData.subscriber.subscription_tier)
                      .map((tier) => (
                        <SelectItem key={tier.name} value={tier.name}>
                          {tier.label} - {formatAmount(tier.price)}/month
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedTier && (
                <div>
                  <Label>Prorated Amount</Label>
                  <div className="p-2 bg-muted rounded">
                    {(() => {
                      const currentTier = SUBSCRIPTION_TIERS.find(t => t.name === modificationData.subscriber.subscription_tier);
                      const newTier = SUBSCRIPTION_TIERS.find(t => t.name === selectedTier);
                      if (currentTier && newTier) {
                        const proration = calculateProration(currentTier.price, newTier.price);
                        return (
                          <span className={proration > 0 ? 'text-green-600' : 'text-red-600'}>
                            {proration > 0 ? '+' : ''}{formatAmount(proration)} (prorated for remaining days)
                          </span>
                        );
                      }
                      return 'Calculating...';
                    })()}
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="reason">Reason for Change</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain the reason for this modification..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowModificationDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleModification} 
                  disabled={processing || !selectedTier || !reason}
                >
                  {processing ? 'Processing...' : `Confirm ${modificationData.type}`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};