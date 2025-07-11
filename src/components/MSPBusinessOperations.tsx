import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  FileText, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  invoiceNumber: string;
}

interface Contract {
  id: string;
  clientName: string;
  contractType: string;
  value: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'pending';
}

interface SLAMetric {
  id: string;
  metric: string;
  target: number;
  current: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    clientName: 'Acme Corp',
    amount: 5000,
    status: 'paid',
    dueDate: '2024-01-15',
    invoiceNumber: 'INV-001'
  },
  {
    id: '2',
    clientName: 'TechStart Inc',
    amount: 3200,
    status: 'pending',
    dueDate: '2024-01-20',
    invoiceNumber: 'INV-002'
  },
  {
    id: '3',
    clientName: 'Global Systems',
    amount: 7500,
    status: 'overdue',
    dueDate: '2024-01-10',
    invoiceNumber: 'INV-003'
  }
];

const mockContracts: Contract[] = [
  {
    id: '1',
    clientName: 'Acme Corp',
    contractType: 'Managed IT Services',
    value: 60000,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active'
  },
  {
    id: '2',
    clientName: 'TechStart Inc',
    contractType: 'Security Monitoring',
    value: 38400,
    startDate: '2024-02-01',
    endDate: '2025-01-31',
    status: 'active'
  }
];

const mockSLAMetrics: SLAMetric[] = [
  {
    id: '1',
    metric: 'First Response Time',
    target: 15,
    current: 12,
    unit: 'minutes',
    status: 'good'
  },
  {
    id: '2',
    metric: 'Resolution Time',
    target: 4,
    current: 6,
    unit: 'hours',
    status: 'warning'
  },
  {
    id: '3',
    metric: 'Uptime',
    target: 99.9,
    current: 99.95,
    unit: '%',
    status: 'good'
  },
  {
    id: '4',
    metric: 'Customer Satisfaction',
    target: 4.5,
    current: 4.2,
    unit: '/5',
    status: 'warning'
  }
];

export function MSPBusinessOperations() {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [contracts] = useState<Contract[]>(mockContracts);
  const [slaMetrics] = useState<SLAMetric[]>(mockSLAMetrics);
  const { toast } = useToast();

  const getStatusBadge = (status: string, type: 'invoice' | 'contract' | 'sla' = 'invoice') => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive',
      active: 'default',
      expired: 'destructive',
      good: 'default',
      warning: 'secondary',
      critical: 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingRevenue = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Operations</h2>
          <p className="text-muted-foreground">
            Manage contracts, invoicing, and SLA performance
          </p>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${paidRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === 'pending').length} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              Total value: ${contracts.reduce((sum, c) => sum + c.value, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="sla">SLA Management</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Input placeholder="Search invoices..." className="w-80" />
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>Create Invoice</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status, 'invoice')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">View</Button>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Input placeholder="Search contracts..." className="w-80" />
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="managed">Managed IT</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="backup">Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>New Contract</Button>
          </div>

          <div className="grid gap-4">
            {contracts.map((contract) => (
              <Card key={contract.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{contract.clientName}</CardTitle>
                      <CardDescription>{contract.contractType}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${contract.value.toLocaleString()}
                      </div>
                      {getStatusBadge(contract.status, 'contract')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Start: {contract.startDate}</span>
                    <span>End: {contract.endDate}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sla" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {slaMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{metric.metric}</CardTitle>
                    {getStatusBadge(metric.status, 'sla')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {metric.current}{metric.unit}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Target: {metric.target}{metric.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <Target className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                  <Progress 
                    value={calculateProgress(metric.current, metric.target)} 
                    className="w-full"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Report
                </CardTitle>
                <CardDescription>
                  Monthly revenue breakdown and trends
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Client Performance
                </CardTitle>
                <CardDescription>
                  Client satisfaction and service metrics
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Business Growth
                </CardTitle>
                <CardDescription>
                  Growth metrics and forecasting
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}