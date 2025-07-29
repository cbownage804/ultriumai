import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CreditCard, 
  Plus, 
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock
} from 'lucide-react';

export const PaymentTracking = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - would come from API
  const payments = [
    {
      id: '1',
      invoiceId: 'INV-00001234',
      client: 'Acme Corp',
      amount: 2400,
      paymentMethod: 'bank_transfer',
      paymentDate: '2024-01-12',
      paymentReference: 'TXN-ABC123',
      status: 'completed',
      notes: 'Payment received on time'
    },
    {
      id: '2',
      invoiceId: 'INV-00001235',
      client: 'TechStart Inc',
      amount: 1800,
      paymentMethod: 'credit_card',
      paymentDate: '2024-01-15',
      paymentReference: 'CARD-DEF456',
      status: 'completed',
      notes: ''
    },
    {
      id: '3',
      invoiceId: 'INV-00001236',
      client: 'IT Department',
      amount: 3200,
      paymentMethod: 'internal_transfer',
      paymentDate: '2024-01-10',
      paymentReference: 'INT-GHI789',
      status: 'pending',
      notes: 'Awaiting budget approval'
    },
    {
      id: '4',
      invoiceId: 'INV-00001237',
      client: 'Global Systems',
      amount: 5600,
      paymentMethod: 'check',
      paymentDate: '2024-01-08',
      paymentReference: 'CHK-JKL012',
      status: 'completed',
      notes: 'Check cleared successfully'
    }
  ];

  const getPaymentMethodBadge = (method: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      bank_transfer: 'default',
      credit_card: 'secondary',
      check: 'outline',
      internal_transfer: 'destructive'
    };
    return variants[method] || 'secondary';
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      bank_transfer: 'Bank Transfer',
      credit_card: 'Credit Card',
      check: 'Check',
      internal_transfer: 'Internal Transfer'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const filteredPayments = payments.filter(payment =>
    payment.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.paymentReference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">156</div>
            <div className="text-sm text-muted-foreground">Total Payments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">$248,400</div>
            <div className="text-sm text-muted-foreground">Total Received</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-muted-foreground">This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">3</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            Track all payments received from clients and internal departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client/Department</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.invoiceId}</TableCell>
                  <TableCell className="font-medium">{payment.client}</TableCell>
                  <TableCell className="font-medium">
                    ${payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentMethodBadge(payment.paymentMethod)}>
                      {getPaymentMethodLabel(payment.paymentMethod)}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.paymentDate}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {payment.paymentReference}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {payment.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-orange-500" />
                      )}
                      <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {payment.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};