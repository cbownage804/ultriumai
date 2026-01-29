import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, Download, CreditCard, DollarSign, 
  Monitor, Activity, Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Invoice {
  id: string;
  invoice_number: string;
  amount_due: number;
  status: string;
  due_date: string;
  paid_at?: string;
}

interface UsageData {
  month: string;
  devices: number;
  storage_gb: number;
  api_calls: number;
}

interface BillingData {
  client_name: string;
  current_balance: number;
  devices_managed: number;
  storage_used_gb: number;
  api_calls_this_month: number;
}

export function ClientBillingPortal() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [billingData, setBillingData] = useState<BillingData>({
    client_name: 'Your Organization',
    current_balance: 0,
    devices_managed: 0,
    storage_used_gb: 0,
    api_calls_this_month: 0,
  });

  useEffect(() => {
    if (user) {
      fetchBillingData();
    }
  }, [user]);

  const fetchBillingData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const [billingRes, usageRes, invoicesRes] = await Promise.all([
        supabase
          .from('vanguard_client_portal_billing')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('vanguard_client_usage_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(6),
        supabase
          .from('business_invoices')
          .select('*')
          .order('issued_at', { ascending: false })
          .limit(10)
      ]);

      if (billingRes.data) {
        setBillingData({
          client_name: billingRes.data.client_name,
          current_balance: Number(billingRes.data.current_balance) || 0,
          devices_managed: billingRes.data.devices_managed || 0,
          storage_used_gb: Number(billingRes.data.storage_used_gb) || 0,
          api_calls_this_month: billingRes.data.api_calls_this_month || 0,
        });
      }

      if (usageRes.data && usageRes.data.length > 0) {
        setUsageData(usageRes.data.map(u => ({
          month: u.month,
          devices: u.devices || 0,
          storage_gb: Number(u.storage_gb) || 0,
          api_calls: u.api_calls || 0,
        })));
      }

      if (invoicesRes.data) {
        setInvoices(invoicesRes.data.map(inv => ({
          id: inv.id,
          invoice_number: inv.invoice_number || `INV-${inv.id.slice(0, 8)}`,
          amount_due: Number(inv.amount_due) || 0,
          status: inv.status,
          due_date: inv.due_date || inv.issued_at,
          paid_at: inv.paid_at,
        })));
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Paid</Badge>;
      case 'pending':
      case 'draft':
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</Badge>;
      default:
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">Overdue</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
            <CreditCard className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Billing Portal</h2>
            <p className="text-sm text-slate-400">{billingData.client_name} • Account Overview</p>
          </div>
        </div>
        <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
          <CreditCard className="h-4 w-4 mr-2" />
          Manage Payment Methods
        </Button>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-slate-500">Current Balance</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">${billingData.current_balance.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">Outstanding balance</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-slate-500">Devices Managed</span>
            </div>
            <p className="text-2xl font-bold text-white">{billingData.devices_managed}</p>
            <p className="text-xs text-green-400 mt-1">Active endpoints</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-slate-500">Storage Used</span>
            </div>
            <p className="text-2xl font-bold text-white">{billingData.storage_used_gb} GB</p>
            <Progress value={Math.min((billingData.storage_used_gb / 250) * 100, 100)} className="mt-2 h-1.5 bg-slate-800" />
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-400" />
              <span className="text-xs text-slate-500">API Calls</span>
            </div>
            <p className="text-2xl font-bold text-white">{billingData.api_calls_this_month.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">This billing period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Usage Chart */}
        <Card className="bg-black/80 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400 text-sm">Usage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {usageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageData}>
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #22d3ee40',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="devices" stroke="#22d3ee" strokeWidth={2} name="Devices" />
                    <Line type="monotone" dataKey="storage_gb" stroke="#a78bfa" strokeWidth={2} name="Storage (GB)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  No usage data available
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-xs text-slate-400">Devices</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-400" />
                <span className="text-xs text-slate-400">Storage (GB)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice List */}
        <Card className="bg-black/80 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-purple-400 text-sm">Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-cyan-400" />
                        <div>
                          <p className="text-sm text-white font-mono">{invoice.invoice_number}</p>
                          <p className="text-xs text-slate-500">
                            {invoice.status === 'paid' 
                              ? `Paid ${invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : ''}` 
                              : `Due ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : ''}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-white font-medium">${invoice.amount_due.toLocaleString()}</p>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-400">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  No invoices found
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
