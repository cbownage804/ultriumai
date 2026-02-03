/**
 * Billing Portal Component
 * View invoices and payment history (admin only)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, Receipt, Download, ExternalLink, 
  Loader2, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePortalSession } from '@/hooks/usePortalSession';

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  currency: string;
  status: string;
  due_date: string | null;
  created_at: string;
  paid_at: string | null;
}

export function BillingPortal() {
  const { session } = usePortalSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  // Check if user is admin
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'Admin';

  useEffect(() => {
    if (session && isAdmin) {
      fetchInvoices();
    } else {
      setIsLoading(false);
    }
  }, [session, isAdmin]);

  const fetchInvoices = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase
        .from('msp_invoices')
        .select('id, invoice_number, total_amount, currency, status, due_date, created_at, paid_at')
        .eq('client_id', session.user.clientId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setInvoices((data || []) as Invoice[]);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      // Table might not exist - that's okay, show empty state
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openStripePortal = async () => {
    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-billing', {
        body: { action: 'create-portal-session' },
        headers: {
          'x-portal-session': session?.sessionToken || ''
        }
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      toast.error('Unable to open billing portal');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'open': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'draft': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'void': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'open': return <Clock className="h-3 w-3 mr-1" />;
      default: return <AlertCircle className="h-3 w-3 mr-1" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  if (!isAdmin) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-2">Admin Access Required</h3>
          <p className="text-white/60">
            Only portal administrators can view billing information.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-cyan-400" />
            Billing & Invoices
          </h2>
          <p className="text-white/60">View your billing history and manage payments</p>
        </div>
        <Button
          onClick={openStripePortal}
          disabled={isOpeningPortal}
          className="bg-gradient-to-r from-cyan-500 to-purple-600"
        >
          {isOpeningPortal ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-2" />
          )}
          Manage Billing
        </Button>
      </div>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <Card className="bg-black/40 border-white/10">
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">No invoices yet</h3>
            <p className="text-white/60">
              Your billing history will appear here once invoices are generated.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice, index) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-black/40 border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
                          </span>
                          <Badge className={getStatusColor(invoice.status)}>
                            {getStatusIcon(invoice.status)}
                            {invoice.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-white/50">
                          {new Date(invoice.created_at).toLocaleDateString()}
                          {invoice.due_date && invoice.status !== 'paid' && (
                            <span className="ml-2">
                              • Due {new Date(invoice.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-white">
                        {formatCurrency(invoice.total_amount, invoice.currency)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
