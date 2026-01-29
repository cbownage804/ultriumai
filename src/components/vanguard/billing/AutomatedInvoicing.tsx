import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, Send, CheckCircle2, Clock, AlertTriangle,
  DollarSign, Calendar, RefreshCw, ExternalLink, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  status: 'draft' | 'pending_approval' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
  lineItems: number;
  billingType: 'fixed' | 'usage' | 'mixed';
}

const DEMO_INVOICES: Invoice[] = [
  { id: '1', invoiceNumber: 'INV-2025-001', clientName: 'Acme Corporation', amount: 3450, status: 'draft', dueDate: '2025-02-15', createdAt: '2025-01-29', lineItems: 4, billingType: 'mixed' },
  { id: '2', invoiceNumber: 'INV-2025-002', clientName: 'Global Finance LLC', amount: 5200, status: 'pending_approval', dueDate: '2025-02-15', createdAt: '2025-01-28', lineItems: 6, billingType: 'usage' },
  { id: '3', invoiceNumber: 'INV-2025-003', clientName: 'TechStart Inc', amount: 1850, status: 'sent', dueDate: '2025-02-10', createdAt: '2025-01-25', lineItems: 3, billingType: 'fixed' },
  { id: '4', invoiceNumber: 'INV-2024-089', clientName: 'Healthcare Plus', amount: 2400, status: 'overdue', dueDate: '2025-01-20', createdAt: '2025-01-05', lineItems: 5, billingType: 'mixed' },
  { id: '5', invoiceNumber: 'INV-2024-088', clientName: 'Retail Solutions', amount: 2100, status: 'paid', dueDate: '2025-01-15', createdAt: '2024-12-30', lineItems: 4, billingType: 'usage' }
];

export function AutomatedInvoicing() {
  const [invoices, setInvoices] = useState<Invoice[]>(DEMO_INVOICES);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleInvoice = (id: string) => {
    setSelectedInvoices(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleGenerateInvoices = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success('Invoices generated for all active clients');
    setIsGenerating(false);
  };

  const handleSendSelected = () => {
    const count = selectedInvoices.length;
    setInvoices(invoices.map(inv =>
      selectedInvoices.includes(inv.id) ? { ...inv, status: 'sent' as const } : inv
    ));
    setSelectedInvoices([]);
    toast.success(`${count} invoice${count > 1 ? 's' : ''} sent successfully`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Paid</Badge>;
      case 'sent':
        return <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Sent</Badge>;
      case 'pending_approval':
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">Overdue</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border border-slate-500/30">Draft</Badge>;
    }
  };

  const totalDraft = invoices.filter(i => i.status === 'draft').reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'pending_approval' || i.status === 'sent').reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
            <FileText className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Automated Invoicing</h2>
            <p className="text-sm text-slate-400">Generate and manage client invoices</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedInvoices.length > 0 && (
            <Button
              onClick={handleSendSelected}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Selected ({selectedInvoices.length})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleGenerateInvoices}
            disabled={isGenerating}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Generate Monthly Invoices
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500">Draft Invoices</span>
            </div>
            <p className="text-2xl font-bold text-white">${totalDraft.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">{invoices.filter(i => i.status === 'draft').length} invoices</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-slate-500">Outstanding</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400">${totalPending.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">{invoices.filter(i => ['pending_approval', 'sent'].includes(i.status)).length} invoices</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-slate-500">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-red-400">${totalOverdue.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">{invoices.filter(i => i.status === 'overdue').length} invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      <Card className="bg-black/80 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-purple-400 text-sm">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 w-10">
                    <Checkbox
                      checked={selectedInvoices.length === invoices.filter(i => i.status !== 'paid').length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedInvoices(invoices.filter(i => i.status !== 'paid').map(i => i.id));
                        } else {
                          setSelectedInvoices([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Invoice</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Client</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Amount</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-400">Type</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-400">Status</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-400">Due Date</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-800 hover:bg-slate-900/50">
                    <td className="py-3 px-4">
                      {invoice.status !== 'paid' && (
                        <Checkbox
                          checked={selectedInvoices.includes(invoice.id)}
                          onCheckedChange={() => toggleInvoice(invoice.id)}
                        />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-cyan-400 font-mono">{invoice.invoiceNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-white">{invoice.clientName}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm text-white font-medium">${invoice.amount.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs capitalize">
                        {invoice.billingType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs text-slate-400">{invoice.dueDate}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-400">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
