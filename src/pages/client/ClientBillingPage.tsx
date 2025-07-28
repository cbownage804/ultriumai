import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Download, Eye, Calendar, CreditCard, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  issue_date: string;
  due_date: string;
  items: any[];
}

const ClientBillingPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get client information first
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('client_id, msp_clients!inner(*)')
        .eq('user_id', user.id)
        .single();

      if (!clientUser) return;

      setBillingInfo(clientUser.msp_clients);

      // Mock invoice data - replace with actual query when needed
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          invoice_number: 'INV-2024-001',
          amount: 25000, // $250.00
          currency: 'usd',
          status: 'pending',
          issue_date: new Date(Date.now() - 172800000).toISOString(),
          due_date: new Date(Date.now() + 1209600000).toISOString(),
          items: [
            { description: 'Monthly IT Support', amount: 20000 },
            { description: 'Security Monitoring', amount: 5000 }
          ]
        },
        {
          id: '2',
          invoice_number: 'INV-2024-002',
          amount: 25000,
          currency: 'usd',
          status: 'paid',
          issue_date: new Date(Date.now() - 2592000000).toISOString(),
          due_date: new Date(Date.now() - 1382400000).toISOString(),
          items: [
            { description: 'Monthly IT Support', amount: 20000 },
            { description: 'Security Monitoring', amount: 5000 }
          ]
        }
      ];

      setInvoices(mockInvoices);
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast({
        title: "Error",
        description: "Failed to load billing data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: "Download Started",
      description: "Invoice PDF download will begin shortly.",
    });
  };

  const handleViewInvoice = (invoiceId: string) => {
    // Navigate to invoice detail view
    toast({
      title: "Coming Soon",
      description: "Invoice detail view is being implemented.",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Invoices</h1>
          <p className="text-muted-foreground">
            View your invoices and billing information
          </p>
        </div>
      </div>

      {/* Billing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">All time total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</div>
            <p className="text-xs text-muted-foreground">Successfully paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">Pending payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Information */}
      {billingInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>Your account billing details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Client Information</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {billingInfo.client_name}</p>
                  <p><strong>Contact:</strong> {billingInfo.contact_email}</p>
                  <p><strong>Phone:</strong> {billingInfo.contact_phone}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Service Plan</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Current Tier:</strong> {billingInfo.tier || 'Standard'}</p>
                  <p><strong>Billing Cycle:</strong> Monthly</p>
                  <p><strong>Next Billing:</strong> {new Date(Date.now() + 2592000000).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice History
          </CardTitle>
          <CardDescription>Your billing history and invoice details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
                <p className="text-muted-foreground">
                  Your invoice history will appear here once billing begins.
                </p>
              </div>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{invoice.invoice_number}</h4>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Issued: {new Date(invoice.issue_date).toLocaleDateString()}</p>
                      <p>Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <div className="text-lg font-bold">{formatCurrency(invoice.amount, invoice.currency)}</div>
                    <div className="text-sm text-muted-foreground">
                      {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewInvoice(invoice.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadInvoice(invoice.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your payment methods and billing preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No payment methods on file</h3>
            <p className="text-muted-foreground mb-4">
              Add a payment method to enable automatic billing
            </p>
            <Button variant="outline">
              Add Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientBillingPage;