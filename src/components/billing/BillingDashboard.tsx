import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvoiceManager } from './InvoiceManager';
import { BillingSchedules } from './BillingSchedules';
import { CostCenters } from './CostCenters';
import { PaymentTracking } from './PaymentTracking';
import { UsageTracking } from './UsageTracking';
import { 
  DollarSign, 
  FileText, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Building,
  CreditCard,
  BarChart3
} from 'lucide-react';

export const BillingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - would come from API
  const billingStats = {
    totalRevenue: 125420,
    monthlyRecurring: 45600,
    outstandingInvoices: 8240,
    overdueInvoices: 2150,
    averagePaymentTime: 18,
    clientCount: 47
  };

  const recentInvoices = [
    {
      id: 'INV-00001234',
      client: 'Acme Corp',
      amount: 2400,
      status: 'paid',
      dueDate: '2024-01-15',
      paidDate: '2024-01-12'
    },
    {
      id: 'INV-00001235',
      client: 'TechStart Inc',
      amount: 1800,
      status: 'sent',
      dueDate: '2024-01-20',
      paidDate: null
    },
    {
      id: 'INV-00001236',
      client: 'Global Systems',
      amount: 3200,
      status: 'overdue',
      dueDate: '2024-01-10',
      paidDate: null
    }
  ];

  const upcomingBilling = [
    {
      client: 'Acme Corp',
      service: 'Monthly IT Support',
      amount: 2400,
      nextBillDate: '2024-02-01'
    },
    {
      client: 'TechStart Inc',
      service: 'Security Monitoring',
      amount: 1800,
      nextBillDate: '2024-02-01'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Invoicing</h1>
          <p className="text-muted-foreground">
            Manage invoices, payments, and billing for all customer segments
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="schedules">Billing Schedules</TabsTrigger>
          <TabsTrigger value="cost-centers">Cost Centers</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="usage">Usage Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${billingStats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${billingStats.monthlyRecurring.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+8% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${billingStats.outstandingInvoices.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">12 invoices pending</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  ${billingStats.overdueInvoices.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">3 invoices overdue</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Invoices
                </CardTitle>
                <CardDescription>Latest billing activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{invoice.id}</div>
                        <div className="text-sm text-muted-foreground">{invoice.client}</div>
                        <div className="text-xs text-muted-foreground">
                          Due: {invoice.dueDate}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-bold">${invoice.amount.toLocaleString()}</div>
                        <Badge 
                          variant={
                            invoice.status === 'paid' ? 'default' :
                            invoice.status === 'overdue' ? 'destructive' : 'secondary'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Billing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Billing
                </CardTitle>
                <CardDescription>Scheduled recurring charges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingBilling.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{item.client}</div>
                        <div className="text-sm text-muted-foreground">{item.service}</div>
                        <div className="text-xs text-muted-foreground">
                          Next: {item.nextBillDate}
                        </div>
                      </div>
                      <div className="font-bold">${item.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common billing tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Create Invoice
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Building className="h-6 w-6 mb-2" />
                  Add Cost Center
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <CreditCard className="h-6 w-6 mb-2" />
                  Record Payment
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceManager />
        </TabsContent>

        <TabsContent value="schedules">
          <BillingSchedules />
        </TabsContent>

        <TabsContent value="cost-centers">
          <CostCenters />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentTracking />
        </TabsContent>

        <TabsContent value="usage">
          <UsageTracking />
        </TabsContent>
      </Tabs>
    </div>
  );
};