import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ClientSelector } from "@/components/msp/ClientSelector";
import { supabase } from "@/integrations/supabase/client";
import { devLog } from "@/lib/logger";
import { 
  DollarSign, 
  FileText, 
  Clock, 
  AlertTriangle, 
  Send, 
  Eye, 
  Download,
  TrendingUp,
  Calendar,
  Building2,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  due_date: string;
  created_at: string;
  sent_at?: string;
  paid_at?: string;
  msp_clients?: {
    company_name: string;
  };
}

interface BillingSummary {
  totalRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  paymentRate: string;
}

interface BillingPeriod {
  id: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
}

export const MSPBillingManager = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingPeriods, setBillingPeriods] = useState<BillingPeriod[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "billing" | "templates">("overview");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load billing periods
      const { data: periods, error: periodsError } = await supabase
        .from("msp_billing_periods")
        .select("*")
        .order("created_at", { ascending: false });

      if (periodsError) throw periodsError;
      setBillingPeriods(periods || []);

      // Load invoices (without join for now since relationship doesn't exist yet)
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("msp_invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (invoicesError) throw invoicesError;
      
      // Transform data to match interface
      const typedInvoices: Invoice[] = (invoicesData || []).map(invoice => ({
        ...invoice,
        msp_clients: undefined // Will be populated when we add the relationship
      }));
      
      setInvoices(typedInvoices);

      // Load billing summary
      await loadBillingSummary();
    } catch (error) {
      devLog.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load billing data",
        variant: "destructive"
      });
    }
  };

  const loadBillingSummary = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("msp-billing", {
        body: { 
          action: "get_billing_summary",
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Last 90 days
          endDate: new Date().toISOString()
        }
      });

      if (error) throw error;
      setSummary(data.summary);
    } catch (error) {
      devLog.error("Error loading billing summary:", error);
    }
  };

  const createBillingPeriod = async () => {
    try {
      setIsLoading(true);
      
      const startDate = new Date();
      startDate.setDate(1); // First day of current month
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of current month

      const { data, error } = await supabase
        .from("msp_billing_periods")
        .insert({
          msp_user_id: (await supabase.auth.getUser()).data.user?.id,
          period_start: startDate.toISOString().split('T')[0],
          period_end: endDate.toISOString().split('T')[0],
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      setBillingPeriods(prev => [data, ...prev]);
      setSelectedPeriod(data.id);
      
      toast({
        title: "Success",
        description: "Billing period created successfully"
      });
    } catch (error) {
      devLog.error("Error creating billing period:", error);
      toast({
        title: "Error",
        description: "Failed to create billing period",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateInvoices = async () => {
    if (!selectedPeriod) {
      toast({
        title: "Error",
        description: "Please select a billing period",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke("msp-billing", {
        body: { 
          action: "generate_invoices",
          billingPeriodId: selectedPeriod,
          clientIds: selectedClients.length > 0 ? selectedClients : null
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message
      });

      await loadData();
    } catch (error) {
      devLog.error("Error generating invoices:", error);
      toast({
        title: "Error",
        description: "Failed to generate invoices",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvoice = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("msp-billing", {
        body: { 
          action: "send_invoice",
          invoiceId
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice sent successfully"
      });

      await loadData();
    } catch (error) {
      devLog.error("Error sending invoice:", error);
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500";
      case "sent": return "bg-blue-500";
      case "overdue": return "bg-red-500";
      case "draft": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MSP Billing Manager</h1>
          <p className="text-gray-600">Manage client billing, invoices, and payments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createBillingPeriod} disabled={isLoading}>
            <Calendar className="h-4 w-4 mr-2" />
            New Billing Period
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: TrendingUp },
            { id: "invoices", label: "Invoices", icon: FileText },
            { id: "billing", label: "Generate Bills", icon: DollarSign },
            { id: "templates", label: "Templates", icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && summary && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(summary.totalRevenue * 100)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(summary.pendingRevenue * 100)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overdue Revenue</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(summary.overdueRevenue * 100)}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Payment Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.paymentRate}%
                    </p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-full">
                    <CreditCard className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={parseFloat(summary.paymentRate)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Your latest billing activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-600">
                          {invoice.msp_clients?.company_name}
                        </p>
                      </div>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                      <p className="text-sm text-gray-600">
                        Due: {format(new Date(invoice.due_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Invoices</CardTitle>
              <CardDescription>Create invoices for your clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="billingPeriod">Billing Period</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select billing period" />
                    </SelectTrigger>
                    <SelectContent>
                      {billingPeriods.map(period => (
                        <SelectItem key={period.id} value={period.id}>
                          {format(new Date(period.period_start), "MMM yyyy")} - {period.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Specific Clients (optional)</Label>
                  <ClientSelector
                    value=""
                    onValueChange={(clientId) => {
                      if (clientId && !selectedClients.includes(clientId)) {
                        setSelectedClients(prev => [...prev, clientId]);
                      }
                    }}
                    placeholder="Add specific clients..."
                  />
                  {selectedClients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedClients.map(clientId => (
                        <Badge key={clientId} variant="secondary">
                          Client {clientId.slice(0, 8)}...
                          <button
                            onClick={() => setSelectedClients(prev => prev.filter(id => id !== clientId))}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={generateInvoices} 
                disabled={isLoading || !selectedPeriod}
                className="w-full"
              >
                {isLoading ? "Generating..." : "Generate Invoices"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>Manage your client invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-600">
                          {invoice.msp_clients?.company_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created: {format(new Date(invoice.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                        <p className="text-sm text-gray-600">
                          Due: {format(new Date(invoice.due_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        {invoice.status === "draft" && (
                          <Button 
                            size="sm"
                            onClick={() => sendInvoice(invoice.id)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Templates</CardTitle>
              <CardDescription>Manage recurring service templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Billing templates feature coming soon!</p>
                <p className="text-sm text-gray-500">
                  Create reusable templates for recurring services and automatic billing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};