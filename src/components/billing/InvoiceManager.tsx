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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FileText, 
  Plus, 
  MoreHorizontal, 
  Download, 
  Send, 
  Edit,
  Trash2,
  Search,
  Filter
} from 'lucide-react';

export const InvoiceManager = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - would come from API
  const invoices = [
    {
      id: 'INV-00001234',
      client: 'Acme Corp',
      clientType: 'MSP Client',
      amount: 2400,
      status: 'paid',
      issueDate: '2024-01-01',
      dueDate: '2024-01-15',
      paidDate: '2024-01-12',
      type: 'client_bill'
    },
    {
      id: 'INV-00001235',
      client: 'TechStart Inc',
      clientType: 'Direct SMB',
      amount: 1800,
      status: 'sent',
      issueDate: '2024-01-05',
      dueDate: '2024-01-20',
      paidDate: null,
      type: 'client_bill'
    },
    {
      id: 'INV-00001236',
      client: 'IT Department',
      clientType: 'Internal Cost Center',
      amount: 3200,
      status: 'draft',
      issueDate: '2024-01-10',
      dueDate: '2024-01-25',
      paidDate: null,
      type: 'internal_chargeback'
    },
    {
      id: 'INV-00001237',
      client: 'Global Systems',
      clientType: 'Enterprise Client',
      amount: 5600,
      status: 'overdue',
      issueDate: '2023-12-15',
      dueDate: '2024-01-10',
      paidDate: null,
      type: 'client_bill'
    }
  ];

  const getStatusBadge = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: 'secondary',
      sent: 'outline',
      paid: 'default',
      overdue: 'destructive'
    };
    return variants[status] || 'secondary';
  };

  const getClientTypeBadge = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'MSP Client': 'default',
      'Direct SMB': 'secondary',
      'Enterprise Client': 'destructive',
      'Internal Cost Center': 'outline'
    };
    return variants[type] || 'secondary';
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">24</div>
            <div className="text-sm text-muted-foreground">Total Invoices</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">18</div>
            <div className="text-sm text-muted-foreground">Paid</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">4</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">2</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Invoices
          </CardTitle>
          <CardDescription>
            Manage invoices for MSP clients, direct customers, and internal cost centers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client/Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.client}</div>
                      <Badge variant={getClientTypeBadge(invoice.clientType)} className="text-xs">
                        {invoice.clientType}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {invoice.type === 'client_bill' ? 'Client Bill' : 'Internal Chargeback'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${invoice.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{invoice.issueDate}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        {invoice.status === 'draft' && (
                          <DropdownMenuItem>
                            <Send className="h-4 w-4 mr-2" />
                            Send Invoice
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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