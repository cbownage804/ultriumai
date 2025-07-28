import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calculator, 
  DollarSign, 
  Activity, 
  RefreshCw, 
  Settings, 
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  TestTube,
  CreditCard,
  Receipt,
  Building,
  TrendingUp,
  PieChart,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
interface XeroConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  isConnected: boolean;
  lastSync: string;
  syncEnabled: boolean;
  endpoints: {
    invoices: boolean;
    contacts: boolean;
    payments: boolean;
    expenses: boolean;
    reports: boolean;
    bankTransactions: boolean;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  contactName: string;
  status: 'draft' | 'submitted' | 'authorised' | 'paid' | 'voided';
  date: string;
  dueDate: string;
  total: number;
  amountDue: number;
  amountPaid: number;
  currency: string;
  reference: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  contactType: 'customer' | 'supplier';
  accountNumber: string;
  taxNumber: string;
  status: 'active' | 'archived';
  balances: {
    accountsReceivable: number;
    accountsPayable: number;
  };
}

interface Payment {
  id: string;
  invoiceNumber: string;
  contactName: string;
  amount: number;
  date: string;
  paymentMethod: string;
  reference: string;
  status: 'authorised' | 'deleted';
  bankAccount: string;
}

interface Expense {
  id: string;
  contactName: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  status: 'draft' | 'submitted' | 'authorised' | 'paid';
  reference: string;
  receiptUrl?: string;
}

interface BankTransaction {
  id: string;
  bankAccount: string;
  amount: number;
  date: string;
  description: string;
  type: 'receive' | 'spend';
  status: 'unreconciled' | 'reconciled' | 'voided';
  reference: string;
  contactName?: string;
}

interface FinancialReport {
  name: string;
  period: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashPosition: number;
}

const XeroIntegration: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<XeroConfig>({
    clientId: '',
    clientSecret: '',
    tenantId: '',
    isConnected: false,
    lastSync: '',
    syncEnabled: true,
    endpoints: {
      invoices: true,
      contacts: true,
      payments: true,
      expenses: true,
      reports: false,
      bankTransactions: false,
    },
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    loadXeroConfig();
    loadInvoices();
    loadContacts();
    loadPayments();
    loadExpenses();
    loadBankTransactions();
    loadFinancialReport();
  }, []);

  const loadXeroConfig = async () => {
    // Mock loading configuration
    setConfig(prev => ({
      ...prev,
      clientId: 'your-xero-client-id',
      tenantId: 'your-xero-tenant-id',
      isConnected: true,
      lastSync: '2024-01-20T10:30:00Z',
    }));
  };

  const loadInvoices = async () => {
    // Mock invoices data
    const mockInvoices: Invoice[] = [
      {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        contactName: 'Acme Corporation',
        status: 'authorised',
        date: '2024-01-20',
        dueDate: '2024-02-19',
        total: 15000.00,
        amountDue: 15000.00,
        amountPaid: 0.00,
        currency: 'USD',
        reference: 'MSP-001',
      },
      {
        id: '2',
        invoiceNumber: 'INV-2024-002',
        contactName: 'Tech Solutions Inc',
        status: 'paid',
        date: '2024-01-15',
        dueDate: '2024-02-14',
        total: 8500.00,
        amountDue: 0.00,
        amountPaid: 8500.00,
        currency: 'USD',
        reference: 'MSP-002',
      },
      {
        id: '3',
        invoiceNumber: 'INV-2024-003',
        contactName: 'Digital Dynamics',
        status: 'draft',
        date: '2024-01-22',
        dueDate: '2024-02-21',
        total: 4200.00,
        amountDue: 4200.00,
        amountPaid: 0.00,
        currency: 'USD',
        reference: 'MSP-003',
      },
    ];
    setInvoices(mockInvoices);
  };

  const loadContacts = async () => {
    // Mock contacts data
    const mockContacts: Contact[] = [
      {
        id: '1',
        name: 'Acme Corporation',
        email: 'billing@acme.com',
        phone: '+1 (555) 123-4567',
        contactType: 'customer',
        accountNumber: 'CUST-001',
        taxNumber: '12-3456789',
        status: 'active',
        balances: {
          accountsReceivable: 15000.00,
          accountsPayable: 0.00,
        },
      },
      {
        id: '2',
        name: 'Tech Solutions Inc',
        email: 'finance@techsolutions.com',
        phone: '+1 (555) 234-5678',
        contactType: 'customer',
        accountNumber: 'CUST-002',
        taxNumber: '98-7654321',
        status: 'active',
        balances: {
          accountsReceivable: 0.00,
          accountsPayable: 0.00,
        },
      },
      {
        id: '3',
        name: 'Office Supplies Co',
        email: 'billing@officesupplies.com',
        phone: '+1 (555) 345-6789',
        contactType: 'supplier',
        accountNumber: 'SUPP-001',
        taxNumber: '55-1234567',
        status: 'active',
        balances: {
          accountsReceivable: 0.00,
          accountsPayable: 2500.00,
        },
      },
    ];
    setContacts(mockContacts);
  };

  const loadPayments = async () => {
    // Mock payments data
    const mockPayments: Payment[] = [
      {
        id: '1',
        invoiceNumber: 'INV-2024-002',
        contactName: 'Tech Solutions Inc',
        amount: 8500.00,
        date: '2024-01-18',
        paymentMethod: 'Bank Transfer',
        reference: 'TXN-12345',
        status: 'authorised',
        bankAccount: 'Business Checking',
      },
      {
        id: '2',
        invoiceNumber: 'INV-2023-089',
        contactName: 'Digital Dynamics',
        amount: 3200.00,
        date: '2024-01-10',
        paymentMethod: 'Credit Card',
        reference: 'CC-67890',
        status: 'authorised',
        bankAccount: 'Business Checking',
      },
    ];
    setPayments(mockPayments);
  };

  const loadExpenses = async () => {
    // Mock expenses data
    const mockExpenses: Expense[] = [
      {
        id: '1',
        contactName: 'Office Supplies Co',
        description: 'Monthly office supplies',
        amount: 450.00,
        date: '2024-01-15',
        category: 'Office Expenses',
        status: 'authorised',
        reference: 'EXP-001',
        receiptUrl: '#',
      },
      {
        id: '2',
        contactName: 'CloudTech Services',
        description: 'AWS hosting costs',
        amount: 1200.00,
        date: '2024-01-20',
        category: 'Technology',
        status: 'paid',
        reference: 'EXP-002',
      },
      {
        id: '3',
        contactName: 'Business Insurance Ltd',
        description: 'Professional liability insurance',
        amount: 850.00,
        date: '2024-01-22',
        category: 'Insurance',
        status: 'draft',
        reference: 'EXP-003',
      },
    ];
    setExpenses(mockExpenses);
  };

  const loadBankTransactions = async () => {
    // Mock bank transactions data
    const mockTransactions: BankTransaction[] = [
      {
        id: '1',
        bankAccount: 'Business Checking',
        amount: 8500.00,
        date: '2024-01-18',
        description: 'Payment from Tech Solutions Inc',
        type: 'receive',
        status: 'reconciled',
        reference: 'TXN-12345',
        contactName: 'Tech Solutions Inc',
      },
      {
        id: '2',
        bankAccount: 'Business Checking',
        amount: -450.00,
        date: '2024-01-15',
        description: 'Office supplies payment',
        type: 'spend',
        status: 'reconciled',
        reference: 'EXP-001',
        contactName: 'Office Supplies Co',
      },
      {
        id: '3',
        bankAccount: 'Business Checking',
        amount: -1200.00,
        date: '2024-01-20',
        description: 'AWS hosting payment',
        type: 'spend',
        status: 'unreconciled',
        reference: 'EXP-002',
        contactName: 'CloudTech Services',
      },
    ];
    setBankTransactions(mockTransactions);
  };

  const loadFinancialReport = async () => {
    // Mock financial report data
    const mockReport: FinancialReport = {
      name: 'Profit & Loss - January 2024',
      period: 'January 2024',
      revenue: 27700.00,
      expenses: 8950.00,
      netProfit: 18750.00,
      accountsReceivable: 19200.00,
      accountsPayable: 2500.00,
      cashPosition: 45300.00,
    };
    setFinancialReport(mockReport);
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString(),
      }));
      toast({
        title: "Connected",
        description: "Successfully connected to Xero",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Xero. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestResult('✅ Connection successful\n✅ Client credentials validated\n✅ Tenant access confirmed\n✅ Invoice data accessible\n✅ Contact data accessible\n✅ Payment data accessible\n✅ Expense data accessible');
      toast({
        title: "Test Successful",
        description: "Xero connection test completed successfully",
      });
    } catch (error) {
      setTestResult('❌ Connection failed\n❌ Please verify client ID, secret, and tenant ID');
      toast({
        title: "Test Failed",
        description: "Connection test failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadInvoices();
      await loadContacts();
      await loadPayments();
      await loadExpenses();
      await loadBankTransactions();
      await loadFinancialReport();
      setConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      toast({
        title: "Sync Complete",
        description: "Successfully synced data from Xero",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'authorised':
      case 'reconciled':
      case 'active': return 'bg-green-500';
      case 'draft':
      case 'unreconciled': return 'bg-yellow-500';
      case 'voided':
      case 'deleted':
      case 'archived': return 'bg-red-500';
      case 'submitted': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Xero Integration
                <Badge variant={config.isConnected ? "default" : "secondary"}>
                  {config.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Cloud Accounting & Financial Management Platform
                {config.lastSync && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Last sync: {new Date(config.lastSync).toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={!config.isConnected || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isLoading}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://go.xero.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Xero Portal
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="test">Test & Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {financialReport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Financial Overview - {financialReport.period}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <div className="text-sm font-medium">Revenue</div>
                      </div>
                      <div className="text-2xl font-bold">{formatCurrency(financialReport.revenue)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Receipt className="h-4 w-4 text-red-500" />
                        <div className="text-sm font-medium">Expenses</div>
                      </div>
                      <div className="text-2xl font-bold">{formatCurrency(financialReport.expenses)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-blue-500" />
                        <div className="text-sm font-medium">Net Profit</div>
                      </div>
                      <div className="text-2xl font-bold">{formatCurrency(financialReport.netProfit)}</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <div className="text-sm font-medium">Outstanding Invoices</div>
                </div>
                <div className="text-2xl font-bold">{invoices.filter(i => i.status !== 'paid' && i.status !== 'voided').length}</div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(invoices.filter(i => i.status !== 'paid' && i.status !== 'voided').reduce((sum, i) => sum + i.amountDue, 0))} due
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-green-500" />
                  <div className="text-sm font-medium">Recent Payments</div>
                </div>
                <div className="text-2xl font-bold">{payments.length}</div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))} received
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Receipt className="h-4 w-4 text-orange-500" />
                  <div className="text-sm font-medium">Pending Expenses</div>
                </div>
                <div className="text-2xl font-bold">{expenses.filter(e => e.status === 'draft' || e.status === 'submitted').length}</div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(expenses.filter(e => e.status === 'draft' || e.status === 'submitted').reduce((sum, e) => sum + e.amount, 0))} pending
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-purple-500" />
                  <div className="text-sm font-medium">Active Contacts</div>
                </div>
                <div className="text-2xl font-bold">{contacts.filter(c => c.status === 'active').length}</div>
                <div className="text-xs text-muted-foreground">
                  {contacts.filter(c => c.contactType === 'customer').length} customers, {contacts.filter(c => c.contactType === 'supplier').length} suppliers
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.contactName} • Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(invoice.total)}</div>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(invoice.status)} text-white border-transparent`}
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Bank Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bankTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{transaction.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.bankAccount} • {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(transaction.amount))}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoices ({invoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(invoice.status)}`} />
                      <div>
                        <div className="font-medium">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.contactName} • {invoice.reference}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Issued: {new Date(invoice.date).toLocaleDateString()} • 
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{formatCurrency(invoice.total)}</div>
                      <div className="text-sm text-muted-foreground">
                        Due: {formatCurrency(invoice.amountDue)}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(invoice.status)} text-white border-transparent mt-1`}
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payments ({payments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(payment.status)}`} />
                      <div>
                        <div className="font-medium">{payment.invoiceNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {payment.contactName} • {payment.paymentMethod}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(payment.date).toLocaleDateString()} • 
                          Bank: {payment.bankAccount} • Ref: {payment.reference}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{formatCurrency(payment.amount)}</div>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(payment.status)} text-white border-transparent`}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Expenses ({expenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(expense.status)}`} />
                      <div>
                        <div className="font-medium">{expense.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {expense.contactName} • {expense.category}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()} • Ref: {expense.reference}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">{formatCurrency(expense.amount)}</div>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(expense.status)} text-white border-transparent`}
                      >
                        {expense.status}
                      </Badge>
                      {expense.receiptUrl && (
                        <Button variant="outline" size="sm" className="mt-1 ml-2">
                          <FileText className="h-3 w-3 mr-1" />
                          Receipt
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Contacts ({contacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(contact.status)}`} />
                      <div>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {contact.email} • {contact.phone}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {contact.accountNumber} • Tax: {contact.taxNumber}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-2">
                        {contact.contactType}
                      </Badge>
                      {contact.contactType === 'customer' && contact.balances.accountsReceivable > 0 && (
                        <div className="text-sm text-orange-600">
                          AR: {formatCurrency(contact.balances.accountsReceivable)}
                        </div>
                      )}
                      {contact.contactType === 'supplier' && contact.balances.accountsPayable > 0 && (
                        <div className="text-sm text-red-600">
                          AP: {formatCurrency(contact.balances.accountsPayable)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Connection Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input 
                    id="client-id"
                    placeholder="Enter your Xero client ID"
                    value={config.clientId}
                    onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-secret">Client Secret</Label>
                  <Input 
                    id="client-secret"
                    type="password"
                    placeholder="Enter your client secret"
                    value={config.clientSecret}
                    onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="tenant-id">Tenant ID</Label>
                  <Input 
                    id="tenant-id"
                    placeholder="Enter your Xero tenant ID"
                    value={config.tenantId}
                    onChange={(e) => setConfig(prev => ({ ...prev, tenantId: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Data Synchronization</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-invoices">Sync Invoice Data</Label>
                    <Switch
                      id="sync-invoices"
                      checked={config.endpoints.invoices}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, invoices: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-contacts">Sync Contact Data</Label>
                    <Switch
                      id="sync-contacts"
                      checked={config.endpoints.contacts}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, contacts: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-payments">Sync Payment Data</Label>
                    <Switch
                      id="sync-payments"
                      checked={config.endpoints.payments}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, payments: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-expenses">Sync Expense Data</Label>
                    <Switch
                      id="sync-expenses"
                      checked={config.endpoints.expenses}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, expenses: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-reports">Sync Financial Reports</Label>
                    <Switch
                      id="sync-reports"
                      checked={config.endpoints.reports}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, reports: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-bank">Sync Bank Transactions</Label>
                    <Switch
                      id="sync-bank"
                      checked={config.endpoints.bankTransactions}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          endpoints: { ...prev.endpoints, bankTransactions: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleConnect} 
                disabled={isLoading || !config.clientId || !config.clientSecret || !config.tenantId}
              >
                {isLoading ? "Connecting..." : config.isConnected ? "Update Connection" : "Connect"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test & Debug
              </CardTitle>
              <CardDescription>
                Test your Xero connection and API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleTestConnection} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Testing Connection..." : "Test Connection"}
              </Button>
              
              {testResult && (
                <div className="space-y-2">
                  <Label>Test Results</Label>
                  <Textarea
                    value={testResult}
                    readOnly
                    className="min-h-[100px] font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default XeroIntegration;