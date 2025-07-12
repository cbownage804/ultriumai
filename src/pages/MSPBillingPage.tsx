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
  Eye
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
  client?: {
    company_name: string;
    subscription_plan: string;
  };
}

interface RevenueSummary {
  total_monthly_revenue: number;
  total_annual_revenue: number;
  total_clients: number;
  average_revenue_per_client: number;
  revenue_by_plan: {
    basic: number;
    professional: number;
    enterprise: number;
  };
  recent_invoices: BillingRecord[];
}

const MSPBillingPage = () => {
  const { toast } = useToast();
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("");
  const [generateBillingOpen, setGenerateBillingOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Load revenue summary
      const { data: summaryData, error: summaryError } = await supabase.functions.invoke(
        'safeweb-billing',
        {
          method: 'GET',
          body: new URLSearchParams({ action: 'revenue_summary' })
        }
      );

      if (summaryError) throw summaryError;
      setRevenueSummary(summaryData.summary);

      // Load billing records
      const { data: recordsData, error: recordsError } = await supabase.functions.invoke(
        'safeweb-billing',
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
      const { data, error } = await supabase.functions.invoke('safeweb-billing', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate_billing',
          billing_period: selectedPeriod
        })
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Generated ${data.records.length} billing records`,
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

  const updateBillingStatus = async (recordId: string, status: string, invoiceId?: string) => {
    try {
      const { error } = await supabase.functions.invoke('safeweb-billing', {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const filteredRecords = billingRecords.filter(record => {
    const matchesSearch = record.client?.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesPeriod = !periodFilter || record.billing_period_start.startsWith(periodFilter);
    return matchesSearch && matchesStatus && matchesPeriod;
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
          <h1 className="text-3xl font-bold">Billing Management</h1>
          <p className="text-muted-foreground">Manage MSP billing, invoices, and revenue</p>
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
                  Generate billing records for all active clients for the selected period.
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
              <p className="text-xs text-muted-foreground">Billing clients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Revenue/Client</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueSummary.average_revenue_per_client)}</div>
              <p className="text-xs text-muted-foreground">Per month</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">Billing Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                {(searchTerm || statusFilter !== "all" || periodFilter) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
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
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
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
                              onClick={() => updateBillingStatus(record.id, 'invoiced')}
                            >
                              Mark Invoiced
                            </Button>
                          )}
                          {record.status === 'invoiced' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => updateBillingStatus(record.id, 'paid')}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
                  <CardTitle>Revenue by Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(revenueSummary.revenue_by_plan).map(([plan, revenue]) => (
                      <div key={plan} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                          <span className="capitalize">{plan}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(revenue)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {revenueSummary.recent_invoices.slice(0, 5).map((record) => (
                      <div key={record.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{record.client?.company_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(record.msp_profit)}</p>
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MSPBillingPage;