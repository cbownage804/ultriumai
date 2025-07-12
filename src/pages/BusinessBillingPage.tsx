import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  FileText, 
  Download, 
  Plus,
  CreditCard,
  Building,
  Shield,
  Crown,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  Settings,
  Zap
} from "lucide-react";

interface BusinessCustomer {
  id: string;
  company_name: string;
  business_email: string;
  company_size: string;
  industry: string;
  created_at: string;
}

interface BusinessSubscription {
  id: string;
  package_type: string;
  billing_cycle: string;
  seat_count: number;
  monthly_amount: number;
  status: string;
  addons: string[];
  trial_ends_at?: string;
  current_period_end: string;
}

interface BusinessInvoice {
  id: string;
  invoice_number: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  due_date: string;
  issued_at: string;
  paid_at?: string;
}

const BusinessBillingPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<BusinessCustomer | null>(null);
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null);
  const [invoices, setInvoices] = useState<BusinessInvoice[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [isEnterpriseDialogOpen, setIsEnterpriseDialogOpen] = useState(false);
  const [enterpriseForm, setEnterpriseForm] = useState({
    seats: '',
    requirements: '',
    company_name: '',
    industry: ''
  });

  const isUltriumAdmin = user?.email?.endsWith('@ultriumai.com');

  useEffect(() => {
    fetchBusinessData();
    if (isUltriumAdmin) {
      fetchAdminData();
    }
  }, [user, isUltriumAdmin]);

  const fetchBusinessData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('business-billing', {
        body: { action: 'business_dashboard' }
      });

      if (error) throw error;

      setCustomer(data.customer);
      setSubscription(data.subscription);
      setInvoices(data.invoices);
      setUsage(data.usage);
      setPricing(data.pricing);
    } catch (error) {
      console.error('Error fetching business data:', error);
      toast({
        title: "Error",
        description: "Failed to load business billing data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('business-billing', {
        body: { action: 'admin_business_overview' }
      });

      if (error) throw error;
      setAdminData(data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleCreateCheckout = async (packageType: string, billingCycle: string, seatCount: number = 1, addons: string[] = []) => {
    try {
      const { data, error } = await supabase.functions.invoke('business-billing', {
        body: {
          action: 'create_business_checkout',
          package_type: packageType,
          billing_cycle: billingCycle,
          seat_count: seatCount,
          addons,
          company_info: {
            company_name: customer?.company_name || '',
            industry: customer?.industry || ''
          }
        }
      });

      if (error) throw error;

      // Open Stripe checkout in new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive"
      });
    }
  };

  const handleEnterpriseQuote = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('business-billing', {
        body: {
          action: 'create_enterprise_quote',
          seats: parseInt(enterpriseForm.seats),
          requirements: enterpriseForm.requirements,
          contact_info: {
            company_name: enterpriseForm.company_name,
            industry: enterpriseForm.industry
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Quote Requested",
        description: data.next_steps,
      });
      setIsEnterpriseDialogOpen(false);
    } catch (error) {
      console.error('Error requesting quote:', error);
      toast({
        title: "Error",
        description: "Failed to submit quote request",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      trial: "secondary",
      past_due: "destructive",
      canceled: "outline"
    } as const;

    const icons = {
      active: CheckCircle,
      trial: Clock,
      past_due: AlertCircle,
      canceled: AlertCircle
    };

    const Icon = icons[status as keyof typeof icons] || Clock;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPackageIcon = (packageType: string) => {
    switch (packageType) {
      case 'starter': return Users;
      case 'professional': return Crown;
      case 'enterprise': return Building;
      default: return Shield;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Business Billing</h1>
          <p className="text-muted-foreground">Manage your business subscription and billing</p>
        </div>
        
        {!subscription && (
          <Dialog open={isEnterpriseDialogOpen} onOpenChange={setIsEnterpriseDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Get Enterprise Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Request Enterprise Quote</DialogTitle>
                <DialogDescription>
                  Get custom pricing for your organization with 100+ seats
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={enterpriseForm.company_name}
                      onChange={(e) => setEnterpriseForm({...enterpriseForm, company_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="seats">Number of Seats</Label>
                    <Input
                      id="seats"
                      type="number"
                      placeholder="100+"
                      value={enterpriseForm.seats}
                      onChange={(e) => setEnterpriseForm({...enterpriseForm, seats: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={enterpriseForm.industry}
                    onChange={(e) => setEnterpriseForm({...enterpriseForm, industry: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="requirements">Special Requirements</Label>
                  <Textarea
                    id="requirements"
                    placeholder="Describe any special security, compliance, or integration requirements..."
                    value={enterpriseForm.requirements}
                    onChange={(e) => setEnterpriseForm({...enterpriseForm, requirements: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEnterpriseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEnterpriseQuote}>
                  Submit Quote Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          {isUltriumAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isUltriumAdmin ? (
            /* Admin View */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>UltriumAI Admin Access</CardTitle>
                  <CardDescription>You are logged in as a UltriumAI administrator</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    As an admin, you have access to all business billing features. 
                    Use the Admin tab to view and manage all business customers.
                  </p>
                  <Button onClick={() => {
                    const adminTab = document.querySelector('[value="admin"]') as HTMLElement;
                    adminTab?.click();
                  }} className="mr-2">
                    <Users className="h-4 w-4 mr-2" />
                    View Admin Dashboard
                  </Button>
                </CardContent>
              </Card>
              
              {adminData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{adminData.totalCustomers || 0}</div>
                      <p className="text-xs text-muted-foreground">Business customers</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                      <Crown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{adminData.activeSubscriptions || 0}</div>
                      <p className="text-xs text-muted-foreground">Active plans</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${adminData.monthlyRevenue || '0.00'}</div>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            /* Regular Customer View */
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {subscription && (
                  <>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                        {React.createElement(getPackageIcon(subscription.package_type), { className: "h-4 w-4 text-muted-foreground" })}
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold capitalize">{subscription.package_type}</div>
                        <p className="text-xs text-muted-foreground">{subscription.seat_count} seats</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(subscription.monthly_amount)}</div>
                        <p className="text-xs text-muted-foreground">{subscription.billing_cycle} billing</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{getStatusBadge(subscription.status)}</div>
                        <p className="text-xs text-muted-foreground">
                          {subscription.trial_ends_at ? `Trial ends ${new Date(subscription.trial_ends_at).toLocaleDateString()}` : 'Active subscription'}
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Invoices</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{invoices.length}</div>
                    <p className="text-xs text-muted-foreground">Total invoices</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              {!subscription && (
                <Card>
                  <CardHeader>
                    <CardTitle>Choose Your Business Plan</CardTitle>
                    <CardDescription>Select the perfect package for your organization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {pricing && Object.entries(pricing).map(([pkg, price]: [string, any]) => (
                        <Card key={pkg} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardHeader className="text-center">
                            <div className="flex justify-center mb-2">
                              {React.createElement(getPackageIcon(pkg), { className: "h-8 w-8 text-primary" })}
                            </div>
                            <CardTitle className="capitalize">{pkg}</CardTitle>
                            <div className="text-2xl font-bold text-primary">
                              {formatCurrency(price.monthly.platform + price.monthly.per_user)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Platform + 1 user/month
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <Button 
                              className="w-full" 
                              onClick={() => handleCreateCheckout(pkg, 'monthly')}
                            >
                              Start Monthly
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => handleCreateCheckout(pkg, 'annual')}
                            >
                              Start Annual (Save 2 months)
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          {subscription ? (
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>Manage your current subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Package</Label>
                    <p className="capitalize">{subscription.package_type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Billing Cycle</Label>
                    <p className="capitalize">{subscription.billing_cycle}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Seats</Label>
                    <p>{subscription.seat_count}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Next Billing</Label>
                    <p>{new Date(subscription.current_period_end).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {subscription.addons && subscription.addons.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Add-ons</Label>
                    <div className="flex gap-2 mt-1">
                      {subscription.addons.map((addon: string) => (
                        <Badge key={addon} variant="secondary">
                          {addon.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Add Seats
                  </Button>
                  <Button variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    Add Add-ons
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Active Subscription</CardTitle>
                <CardDescription>Choose a plan to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => window.location.href = '/pricing'}>
                  View Pricing Plans
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>View and download your invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{formatCurrency(invoice.amount_due)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">No invoices found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>Track your platform usage and features</CardDescription>
            </CardHeader>
            <CardContent>
              {usage ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Seat Utilization</Label>
                      <div className="mt-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Active Users</span>
                          <span>{usage.seat_usage?.active || 0} / {subscription?.seat_count || 0}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${((usage.seat_usage?.active || 0) / (subscription?.seat_count || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No usage data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isUltriumAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Admin Overview</CardTitle>
                <CardDescription>Platform-wide business customer analytics</CardDescription>
              </CardHeader>
              <CardContent>
                {adminData && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{adminData.summary.total_customers}</div>
                        <p className="text-sm text-blue-600">Total Customers</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(adminData.summary.total_mrr)}</div>
                        <p className="text-sm text-green-600">Monthly Recurring Revenue</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{formatCurrency(adminData.summary.total_arr)}</div>
                        <p className="text-sm text-purple-600">Annual Recurring Revenue</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {String(Object.values(adminData.summary.package_breakdown || {}).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0))}
                        </div>
                        <p className="text-sm text-orange-600">Active Subscriptions</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{adminData.summary.package_breakdown?.starter || 0}</div>
                        <p className="text-sm text-muted-foreground">Starter Plans</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{adminData.summary.package_breakdown?.professional || 0}</div>
                        <p className="text-sm text-muted-foreground">Professional Plans</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{adminData.summary.package_breakdown?.enterprise || 0}</div>
                        <p className="text-sm text-muted-foreground">Enterprise Plans</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default BusinessBillingPage;