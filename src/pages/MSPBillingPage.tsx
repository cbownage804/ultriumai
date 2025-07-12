import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  FileText, 
  Download, 
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Building,
  Shield,
  Globe
} from "lucide-react";

interface BillingRecord {
  id: string;
  client_id: string;
  billing_period_start: string;
  billing_period_end: string;
  client_charge: number;
  ultrium_fee: number;
  msp_profit: number;
  asset_count: number;
  threat_count: number;
  status: string;
  invoice_id?: string;
  paid_at?: string;
  created_at: string;
  product: string;
  client?: {
    company_name: string;
    subscription_plan: string;
  };
}

interface RevenueSummary {
  total_monthly_revenue: number;
  total_annual_revenue: number;
  total_clients: number;
  total_msps?: number;
  average_revenue_per_client: number;
  products: Array<{
    product: string;
    monthly_revenue: number;
    annual_revenue: number;
    client_count: number;
    records: BillingRecord[];
  }>;
  top_performing_msps?: Array<{
    msp_user_id: string;
    total_revenue: number;
    products: string[];
  }>;
}

const MSPBillingPage = () => {
  const { toast } = useToast();
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("");
  const [generateBillingOpen, setGenerateBillingOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [isUltriumAdmin, setIsUltriumAdmin] = useState(false);

  useEffect(() => {
    loadBillingData();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email?.endsWith('@ultriumai.com')) {
      setIsUltriumAdmin(true);
    }
  };

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Load unified revenue summary
      const { data: summaryData, error: summaryError } = await supabase.functions.invoke(
        'msp-billing-unified',
        {
          method: 'GET',
          body: new URLSearchParams({ action: 'unified_summary' })
        }
      );

      if (summaryError) throw summaryError;
      setRevenueSummary(summaryData.summary);

      // Load billing records across all products
      const { data: recordsData, error: recordsError } = await supabase.functions.invoke(
        'msp-billing-unified',
        { method: 'GET' }
      );

      if (recordsError) throw recordsError;
      setBillingRecords(recordsData.records);

    } catch (error) {
      console.error('Error loading billing data:', error);
      toast({
        title: "Error",
        description: "Failed to load billing data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('msp-billing-unified', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate_unified_billing',
          billing_period: selectedPeriod
        })
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message,
      });

      setGenerateBillingOpen(false);
      loadBillingData();
    } catch (error) {
      console.error('Error generating billing:', error);
      toast({
        title: "Error",
        description: "Failed to generate billing records",
        variant: "destructive",
      });
    }
  };

  const updateBillingStatus = async (recordId: string, status: string, product: string, invoiceId?: string) => {
    try {
      const productLower = product.toLowerCase();
      const { error } = await supabase.functions.invoke(`${productLower}-billing`, {
        method: 'PUT',
        body: JSON.stringify({
          action: 'update_status',
          record_id: recordId,
          status,
          invoice_id: invoiceId
        })
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Billing record updated successfully",
      });

      loadBillingData();
    } catch (error) {
      console.error('Error updating billing status:', error);
      toast({
        title: "Error",
        description: "Failed to update billing record",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      invoiced: "outline",
      paid: "default",
      overdue: "destructive"
    } as const;

    const icons = {
      pending: Clock,
      invoiced: FileText,
      paid: CheckCircle,
      overdue: AlertCircle
    };

    const Icon = icons[status as keyof typeof icons] || Clock;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getProductIcon = (product: string) => {
    switch (product.toLowerCase()) {
      case 'safeweb': return Globe;
      case 'safenet': return Building;
      case 'safeshield': return Shield;
      default: return FileText;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const filteredRecords = billingRecords.filter(record => {
    const matchesSearch = record.client?.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesProduct = productFilter === "all" || record.product.toLowerCase() === productFilter.toLowerCase();
    const matchesPeriod = !periodFilter || record.billing_period_start.startsWith(periodFilter);
    return matchesSearch && matchesStatus && matchesProduct && matchesPeriod;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {isUltriumAdmin ? "Platform Billing Management" : "MSP Billing Management"}
          </h1>
          <p className="text-muted-foreground">
            {isUltriumAdmin 
              ? "Manage platform-wide billing across all MSPs and products"
              : "Manage MSP billing, invoices, and revenue across all products"
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Dialog open={generateBillingOpen} onOpenChange={setGenerateBillingOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Billing
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Billing Records</DialogTitle>
              <DialogDescription>
                Generate billing records for all active clients across all products for the selected period.
                {isUltriumAdmin && " As an admin, this will generate billing for ALL MSPs."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="period">Billing Period</Label>
                <Input
                  id="period"
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                />
              </div>
              {isUltriumAdmin && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Admin Notice: This will generate billing records for ALL MSPs across ALL products.
                  </p>
                </div>
              )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setGenerateBillingOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={generateBilling}>Generate</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      {revenueSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueSummary.total_monthly_revenue)}</div>
              <p className="text-xs text-muted-foreground">Current month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueSummary.total_annual_revenue)}</div>
              <p className="text-xs text-muted-foreground">Year to date</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{revenueSummary.total_clients}</div>
              <p className="text-xs text-muted-foreground">Across all products</p>
            </CardContent>
          </Card>

          {isUltriumAdmin && revenueSummary.total_msps !== undefined && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active MSPs</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{revenueSummary.total_msps}</div>
                <p className="text-xs text-muted-foreground">Platform partners</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Revenue/Client</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(revenueSummary.total_clients > 0 ? revenueSummary.total_monthly_revenue / revenueSummary.total_clients : 0)}
              </div>
              <p className="text-xs text-muted-foreground">Per month</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">Billing Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {isUltriumAdmin && <TabsTrigger value="admin">Admin Dashboard</TabsTrigger>}
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="safeweb">SafeWeb</SelectItem>
                    <SelectItem value="safenet">SafeNet</SelectItem>
                    <SelectItem value="safeshield">SafeShield</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="invoiced">Invoiced</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="month"
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value)}
                    className="w-40"
                  />
                </div>
                {(searchTerm || statusFilter !== "all" || productFilter !== "all" || periodFilter) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setProductFilter("all");
                      setPeriodFilter("");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Billing Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Records ({filteredRecords.length})</CardTitle>
              <CardDescription>
                Manage billing records and invoice status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Client Charge</TableHead>
                    <TableHead>MSP Profit</TableHead>
                    <TableHead>Assets</TableHead>
                    <TableHead>Threats</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const ProductIcon = getProductIcon(record.product);
                    return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ProductIcon className="h-4 w-4" />
                          <Badge variant="outline">{record.product}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.client?.company_name || 'Unknown Client'}
                      </TableCell>
                      <TableCell>
                        {new Date(record.billing_period_start).toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {record.client?.subscription_plan || 'Basic'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(record.client_charge)}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(record.msp_profit)}
                      </TableCell>
                      <TableCell>{record.asset_count}</TableCell>
                      <TableCell>{record.threat_count}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {record.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => updateBillingStatus(record.id, 'invoiced', record.product)}
                            >
                              Mark Invoiced
                            </Button>
                          )}
                          {record.status === 'invoiced' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => updateBillingStatus(record.id, 'paid', record.product)}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {revenueSummary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {revenueSummary.products.map((product) => {
                      const ProductIcon = getProductIcon(product.product);
                      return (
                        <div key={product.product} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ProductIcon className="h-4 w-4" />
                            <span>{product.product}</span>
                            <Badge variant="secondary">{product.client_count} clients</Badge>
                          </div>
                          <span className="font-medium">{formatCurrency(product.monthly_revenue)}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {revenueSummary.products.flatMap(product => 
                      product.records.slice(0, 2).map(record => ({
                        ...record,
                        product: product.product
                      }))
                    ).slice(0, 5).map((record) => {
                      const ProductIcon = getProductIcon(record.product);
                      return (
                        <div key={record.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ProductIcon className="h-4 w-4" />
                            <div>
                              <p className="font-medium">{record.client?.company_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {record.product} • {new Date(record.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(record.msp_profit)}</p>
                            {getStatusBadge(record.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {isUltriumAdmin && (
          <TabsContent value="admin" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Platform Overview</CardTitle>
                  <CardDescription>Administrative insights across all MSPs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(revenueSummary?.total_monthly_revenue || 0)}
                      </p>
                      <p className="text-sm text-blue-700">Total Platform Revenue</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {revenueSummary?.total_msps || 0}
                      </p>
                      <p className="text-sm text-green-700">Active MSP Partners</p>
                    </div>
                  </div>
                  {revenueSummary?.top_performing_msps && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-4">Top Performing MSPs</h4>
                      <div className="space-y-2">
                        {revenueSummary.top_performing_msps.slice(0, 5).map((msp, index) => (
                          <div key={msp.msp_user_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">#{index + 1}</span>
                              <span className="ml-2">{msp.msp_user_id}</span>
                              <div className="text-xs text-muted-foreground">
                                Products: {msp.products.join(', ')}
                              </div>
                            </div>
                            <span className="font-medium">{formatCurrency(msp.total_revenue)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Admin Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Export All Billing Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    View MSP Details
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Platform Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default MSPBillingPage;