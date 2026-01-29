/**
 * Unified Billing Dashboard
 * Shows all subscriptions, invoices, and usage across products
 */

import { useState } from 'react';
import { useBillingData } from '@/hooks/useBillingData';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreditCard,
  Crown,
  Download,
  ExternalLink,
  RefreshCw,
  Loader2,
  Receipt,
  Zap,
  Shield,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    active: { variant: 'default', label: 'Active' },
    trialing: { variant: 'secondary', label: 'Trial' },
    canceled: { variant: 'destructive', label: 'Canceled' },
    past_due: { variant: 'destructive', label: 'Past Due' },
    paid: { variant: 'default', label: 'Paid' },
    open: { variant: 'outline', label: 'Open' },
    draft: { variant: 'secondary', label: 'Draft' },
    void: { variant: 'destructive', label: 'Void' },
    uncollectible: { variant: 'destructive', label: 'Uncollectible' },
  };
  const config = variants[status] || { variant: 'outline' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getProductIcon = (product: string) => {
  switch (product) {
    case 'safesuite':
      return <Shield className="h-5 w-5 text-emerald-500" />;
    case 'ai_studio':
      return <Sparkles className="h-5 w-5 text-violet-500" />;
    case 'vanguard':
      return <Zap className="h-5 w-5 text-amber-500" />;
    default:
      return <Crown className="h-5 w-5" />;
  }
};

const BillingPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { subscriptions, invoices, totalMRR, loading, error, refreshBillingData } = useBillingData();
  const { openCustomerPortal, loading: portalLoading } = useStripeCheckout();
  const [refreshing, setRefreshing] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?redirect=/billing" replace />;
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBillingData();
    setRefreshing(false);
  };

  const handleManageSubscription = async () => {
    const result = await openCustomerPortal();
    if (result?.url) {
      window.open(result.url, '_blank');
    }
  };

  const hasActiveSubscriptions = subscriptions.some(s => s.status === 'active' || s.status === 'trialing');

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CreditCard className="h-7 w-7 text-primary" />
                Billing & Subscriptions
              </h1>
              <p className="text-muted-foreground">
                Manage your subscriptions and view billing history
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                Refresh
              </Button>
              {hasActiveSubscriptions && (
                <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Stripe Portal
                </Button>
              )}
            </div>
          </motion.div>

          {loading ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : error ? (
            <Card className="border-destructive">
              <CardContent className="p-6 flex items-center gap-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <h3 className="font-semibold">Failed to load billing data</h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid md:grid-cols-3 gap-6"
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Monthly Spend
                    </CardDescription>
                    <CardTitle className="text-3xl">
                      {formatCurrency(totalMRR, 'usd')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {subscriptions.filter(s => s.status === 'active').length} active subscription{subscriptions.filter(s => s.status === 'active').length !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Total Paid
                    </CardDescription>
                    <CardTitle className="text-3xl">
                      {formatCurrency(
                        invoices
                          .filter(inv => inv.status === 'paid')
                          .reduce((sum, inv) => sum + inv.amount, 0),
                        'usd'
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      From {invoices.filter(inv => inv.status === 'paid').length} invoice{invoices.filter(inv => inv.status === 'paid').length !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Next Payment
                    </CardDescription>
                    <CardTitle className="text-3xl">
                      {subscriptions.length > 0 && subscriptions[0].currentPeriodEnd
                        ? format(new Date(subscriptions[0].currentPeriodEnd), 'MMM d')
                        : 'N/A'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {subscriptions.length > 0
                        ? `${formatCurrency(subscriptions[0].amount, subscriptions[0].currency)}`
                        : 'No upcoming payments'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Active Subscriptions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-amber-500" />
                      Active Subscriptions
                    </CardTitle>
                    <CardDescription>Your current product subscriptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {subscriptions.length === 0 ? (
                      <div className="text-center py-8">
                        <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium mb-2">No Active Subscriptions</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Explore our products and start a subscription
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button asChild variant="outline">
                            <Link to="/pricing/safesuite">SafeSuite</Link>
                          </Button>
                          <Button asChild variant="outline">
                            <Link to="/pricing/ai-studio">AI Studio</Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {subscriptions.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                {getProductIcon(sub.product)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{sub.productName}</span>
                                  {getStatusBadge(sub.status)}
                                  {sub.cancelAtPeriodEnd && (
                                    <Badge variant="outline" className="text-amber-500 border-amber-500">
                                      Cancels at period end
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(sub.amount, sub.currency)}/{sub.interval} • 
                                  Renews {format(new Date(sub.currentPeriodEnd), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleManageSubscription}>
                              Manage
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Invoice History */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-blue-500" />
                      Invoice History
                    </CardTitle>
                    <CardDescription>Your recent invoices and payments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {invoices.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No invoices yet</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell>
                                <div>
                                  <span className="font-medium">{invoice.number || invoice.id.slice(0, 12)}</span>
                                  {invoice.description && (
                                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                      {invoice.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{format(new Date(invoice.date), 'MMM d, yyyy')}</TableCell>
                              <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                              <TableCell className="text-right">
                                {invoice.pdfUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                  >
                                    <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-4 w-4 mr-1" />
                                      PDF
                                    </a>
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" asChild>
                        <Link to="/pricing/safesuite">
                          <Shield className="h-4 w-4 mr-2" />
                          SafeSuite Plans
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/pricing/ai-studio">
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Studio Plans
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/safesuite/billing">
                          <CreditCard className="h-4 w-4 mr-2" />
                          SafeSuite Billing
                        </Link>
                      </Button>
                      {hasActiveSubscriptions && (
                        <Button variant="outline" onClick={handleManageSubscription}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Stripe Portal
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BillingPage;