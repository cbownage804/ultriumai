import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, Send, CheckCircle2, Clock, AlertTriangle,
  DollarSign, Calendar, RefreshCw, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

export function AutomatedInvoicing() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) loadInvoices();
  }, [user]);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      // Load from business_invoices table
      const { data, error } = await supabase
        .from('business_invoices')
        .select('*, business_customers(company_name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mappedInvoices: Invoice[] = (data || []).map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number || `INV-${inv.id.substring(0, 8).toUpperCase()}`,
        clientName: inv.business_customers?.company_name || 'Unknown Client',
        amount: inv.amount_due || 0,
        status: mapStatus(inv.status),
        dueDate: inv.due_date || new Date().toISOString().split('T')[0],
        createdAt: inv.created_at,
        lineItems: Array.isArray(inv.line_items) ? inv.line_items.length : 0,
        billingType: 'mixed'
      }));
      
      setInvoices(mappedInvoices);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const mapStatus = (status: string): Invoice['status'] => {
    switch (status) {
      case 'paid': return 'paid';
      case 'sent': case 'open': return 'sent';
      case 'overdue': return 'overdue';
      case 'pending': return 'pending_approval';
      default: return 'draft';
    }
  };

  const toggleInvoice = (id: string) => {
    setSelectedInvoices(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleGenerateInvoices = async () => {
    setIsGenerating(true);
    try {
      // Get all active clients with their email
      const { data: clients } = await (supabase as any)
        .from('msp_clients')
        .select('id, company_name, primary_contact_email')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (!clients || clients.length === 0) {
        toast.info('No active clients to invoice');
        setIsGenerating(false);
        return;
      }

      // Get unbilled time entries for each client
      const { data: timeEntries } = await supabase
        .from('vanguard_time_entries')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_billable', true)
        .is('invoice_id', null);

      let invoicesCreated = 0;
      
      for (const client of clients) {
        const clientTimeEntries = (timeEntries || []).filter((e: any) => e.client_id === client.id);
        
        if (clientTimeEntries.length === 0) continue;
        
        // Generate real Stripe invoice via edge function
        const { data, error } = await supabase.functions.invoke('generate-msp-invoice', {
          body: {
            clientId: client.id,
            clientName: client.company_name,
            clientEmail: client.primary_contact_email || `billing@${client.company_name.toLowerCase().replace(/\s+/g, '')}.com`,
            timeEntryIds: clientTimeEntries.map((e: any) => e.id),
            dueInDays: 30
          }
        });

        if (error) {
          console.error(`Failed to create invoice for ${client.company_name}:`, error);
          toast.error(`Failed to invoice ${client.company_name}`);
        } else if (data?.success) {
          invoicesCreated++;
        }
      }

      if (invoicesCreated > 0) {
        toast.success(`${invoicesCreated} invoice${invoicesCreated > 1 ? 's' : ''} created in Stripe`);
        loadInvoices();
      } else {
        toast.info('No billable time entries to invoice');
      }
    } catch (err) {
      console.error('Failed to generate invoices:', err);
      toast.error('Failed to generate invoices');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendSelected = async () => {
    const count = selectedInvoices.length;
    try {
      await supabase
        .from('business_invoices')
        .update({ status: 'open' })
        .in('id', selectedInvoices);

      setInvoices(invoices.map(inv =>
        selectedInvoices.includes(inv.id) ? { ...inv, status: 'sent' as const } : inv
      ));
      setSelectedInvoices([]);
      toast.success(`${count} invoice${count > 1 ? 's' : ''} sent successfully`);
    } catch (err) {
      toast.error('Failed to send invoices');
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <Button variant="outline" size="sm" onClick={loadInvoices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
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
            onClick={handleGenerateInvoices}
            disabled={isGenerating}
            className="bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-600 hover:to-cyan-700"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Generate Invoices
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-black/80 border-slate-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500">Draft Invoices</span>
            </div>
            <p className="text-2xl font-bold text-white">${totalDraft.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">{invoices.filter(i => i.status === 'draft').length} invoices</p>
          </CardContent>
        </Card>
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Send className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-slate-500">Pending Payment</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400">${totalPending.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">{invoices.filter(i => i.status === 'pending_approval' || i.status === 'sent').length} invoices</p>
          </CardContent>
        </Card>
        <Card className="bg-black/80 border-red-500/30">
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
          <CardTitle className="text-white text-sm">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices yet</p>
              <p className="text-sm">Generate invoices for your clients</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {invoices.map(invoice => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-700 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedInvoices.includes(invoice.id)}
                        onCheckedChange={() => toggleInvoice(invoice.id)}
                        disabled={invoice.status === 'paid'}
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">{invoice.invoiceNumber}</span>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <p className="text-xs text-slate-400">{invoice.clientName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">${invoice.amount.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{invoice.lineItems} items</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {invoice.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
