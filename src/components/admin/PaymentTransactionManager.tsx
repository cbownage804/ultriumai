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
import { CreditCard, DollarSign, RefreshCw, Eye, AlertTriangle, Download, Plus, Search, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { format } from 'date-fns';

interface PaymentTransaction {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_refund_id: string | null;
  transaction_type: 'payment' | 'refund' | 'chargeback' | 'adjustment';
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  description: string | null;
  metadata: any;
  payment_method_id: string | null;
  subscription_id: string | null;
  processed_by: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

interface RefundDialogData {
  transactionId: string;
  amount: number;
  currency: string;
  userEmail: string;
}

export const PaymentTransactionManager = () => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState<'created_at' | 'amount'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundData, setRefundData] = useState<RefundDialogData | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { logAdminAction } = useAuditLogger();

  const fetchTransactions = async () => {
    try {
      // Since we don't have real payment data, let's simulate some transactions
      const mockTransactions: PaymentTransaction[] = [
        {
          id: '1',
          user_id: 'user-1',
          stripe_payment_intent_id: 'pi_1234567890',
          stripe_charge_id: 'ch_1234567890',
          stripe_refund_id: null,
          transaction_type: 'payment',
          amount: 2999, // $29.99
          currency: 'usd',
          status: 'succeeded',
          description: 'Premium subscription payment',
          metadata: { subscription_tier: 'premium' },
          payment_method_id: 'pm_1234567890',
          subscription_id: 'sub-1',
          processed_by: null,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          user_email: 'john@example.com',
          user_name: 'John Doe'
        },
        {
          id: '2',
          user_id: 'user-2',
          stripe_payment_intent_id: 'pi_0987654321',
          stripe_charge_id: 'ch_0987654321',
          stripe_refund_id: null,
          transaction_type: 'payment',
          amount: 999, // $9.99
          currency: 'usd',
          status: 'succeeded',
          description: 'Basic subscription payment',
          metadata: { subscription_tier: 'basic' },
          payment_method_id: 'pm_0987654321',
          subscription_id: 'sub-2',
          processed_by: null,
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          user_email: 'jane@example.com',
          user_name: 'Jane Smith'
        },
        {
          id: '3',
          user_id: 'user-3',
          stripe_payment_intent_id: 'pi_1122334455',
          stripe_charge_id: 'ch_1122334455',
          stripe_refund_id: 're_1122334455',
          transaction_type: 'refund',
          amount: -1500, // -$15.00 refund
          currency: 'usd',
          status: 'refunded',
          description: 'Refund for cancelled subscription',
          metadata: { refund_reason: 'Customer request' },
          payment_method_id: 'pm_1122334455',
          subscription_id: 'sub-3',
          processed_by: 'admin-1',
          created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          user_email: 'bob@example.com',
          user_name: 'Bob Johnson'
        }
      ];

      setTransactions(mockTransactions);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch payment transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleRefund = async () => {
    if (!refundData || !refundAmount || !refundReason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // In a real implementation, this would call a Stripe refund endpoint
      const refundAmountCents = Math.round(parseFloat(refundAmount) * 100);
      
      // Create refund transaction record
      const newRefund: PaymentTransaction = {
        id: Date.now().toString(),
        user_id: refundData.transactionId,
        stripe_payment_intent_id: null,
        stripe_charge_id: null,
        stripe_refund_id: `re_${Date.now()}`,
        transaction_type: 'refund',
        amount: -refundAmountCents,
        currency: refundData.currency,
        status: 'succeeded',
        description: `Refund: ${refundReason}`,
        metadata: { 
          refund_reason: refundReason,
          original_transaction_id: refundData.transactionId
        },
        payment_method_id: null,
        subscription_id: null,
        processed_by: 'current-admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_email: refundData.userEmail
      };

      // Add to transactions list
      setTransactions(prev => [newRefund, ...prev]);

      await logAdminAction({
        action: 'process_refund',
        resource_type: 'payment_transaction',
        resource_id: refundData.transactionId,
        resource_name: refundData.userEmail,
        metadata: {
          refund_amount: refundAmountCents,
          refund_reason: refundReason
        }
      });

      toast({
        title: "Success",
        description: `Refund of ${refundAmount} ${refundData.currency.toUpperCase()} processed successfully`,
      });

      setShowRefundDialog(false);
      setRefundData(null);
      setRefundAmount('');
      setRefundReason('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openRefundDialog = (transaction: PaymentTransaction) => {
    setRefundData({
      transactionId: transaction.id,
      amount: Math.abs(transaction.amount),
      currency: transaction.currency,
      userEmail: transaction.user_email || ''
    });
    setRefundAmount((Math.abs(transaction.amount) / 100).toString());
    setShowRefundDialog(true);
  };

  const formatAmount = (amount: number, currency: string) => {
    const absAmount = Math.abs(amount) / 100;
    const sign = amount < 0 ? '-' : '';
    return `${sign}$${absAmount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'refunded': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'default';
      case 'refund': return 'secondary';
      case 'chargeback': return 'destructive';
      case 'adjustment': return 'outline';
      default: return 'outline';
    }
  };

  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = 
        transaction.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.stripe_payment_intent_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let aValue = sortField === 'amount' ? a.amount : new Date(a.created_at).getTime();
      let bValue = sortField === 'amount' ? b.amount : new Date(b.created_at).getTime();
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalRefunds = filteredTransactions
    .filter(t => t.transaction_type === 'refund')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const exportTransactions = () => {
    const csvContent = [
      'Date,User Email,Type,Status,Amount,Currency,Description,Stripe ID',
      ...filteredTransactions.map(t => 
        `"${format(new Date(t.created_at), 'yyyy-MM-dd HH:mm:ss')}","${t.user_email || 'N/A'}","${t.transaction_type}","${t.status}","${formatAmount(t.amount, t.currency)}","${t.currency.toUpperCase()}","${t.description || 'N/A'}","${t.stripe_payment_intent_id || t.stripe_refund_id || 'N/A'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

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
            Payment Transaction Manager
          </h3>
          <p className="text-sm text-muted-foreground">
            View, manage, and process payment transactions and refunds
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportTransactions}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={fetchTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalAmount, 'usd')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalRefunds, 'usd')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTransactions.length > 0 
                ? Math.round((filteredTransactions.filter(t => t.status === 'succeeded').length / filteredTransactions.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user email, description, or Stripe ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
                <SelectItem value="chargeback">Chargebacks</SelectItem>
                <SelectItem value="adjustment">Adjustments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            All payment transactions, refunds, and adjustments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => {
                    setSortField('created_at');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  }}>
                    Date <ArrowUpDown className="h-4 w-4 inline ml-1" />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => {
                    setSortField('amount');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  }}>
                    Amount <ArrowUpDown className="h-4 w-4 inline ml-1" />
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Stripe ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(transaction.created_at), 'HH:mm:ss')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{transaction.user_email}</div>
                      <div className="text-xs text-muted-foreground">{transaction.user_name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeColor(transaction.transaction_type)}>
                        {transaction.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatAmount(transaction.amount, transaction.currency)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {transaction.stripe_payment_intent_id || transaction.stripe_refund_id || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {transaction.transaction_type === 'payment' && transaction.status === 'succeeded' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRefundDialog(transaction)}
                          >
                            Refund
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Issue a refund for this payment transaction
            </DialogDescription>
          </DialogHeader>
          
          {refundData && (
            <div className="space-y-4">
              <div>
                <Label>User Email</Label>
                <Input value={refundData.userEmail} disabled />
              </div>
              
              <div>
                <Label>Original Amount</Label>
                <Input value={formatAmount(refundData.amount, refundData.currency)} disabled />
              </div>
              
              <div>
                <Label htmlFor="refund-amount">Refund Amount ($)</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  max={refundData.amount / 100}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Enter refund amount"
                />
              </div>
              
              <div>
                <Label htmlFor="refund-reason">Reason for Refund</Label>
                <Textarea
                  id="refund-reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Explain the reason for this refund..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleRefund} 
                  disabled={processing || !refundAmount || !refundReason}
                >
                  {processing ? 'Processing...' : 'Process Refund'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};