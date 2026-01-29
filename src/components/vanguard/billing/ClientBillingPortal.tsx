import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, Download, CreditCard, DollarSign, 
  Calendar, CheckCircle2, Clock, AlertTriangle,
  Monitor, Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  paidDate?: string;
}

const DEMO_INVOICES: Invoice[] = [
  { id: '1', invoiceNumber: 'INV-2025-003', amount: 3450, status: 'pending', dueDate: '2025-02-15' },
  { id: '2', invoiceNumber: 'INV-2025-002', amount: 3200, status: 'paid', dueDate: '2025-01-15', paidDate: '2025-01-12' },
  { id: '3', invoiceNumber: 'INV-2024-012', amount: 3200, status: 'paid', dueDate: '2024-12-15', paidDate: '2024-12-14' },
  { id: '4', invoiceNumber: 'INV-2024-011', amount: 3100, status: 'paid', dueDate: '2024-11-15', paidDate: '2024-11-15' },
  { id: '5', invoiceNumber: 'INV-2024-010', amount: 2950, status: 'paid', dueDate: '2024-10-15', paidDate: '2024-10-13' }
];

const USAGE_DATA = [
  { month: 'Sep', devices: 42, storage: 120, api: 4500 },
  { month: 'Oct', devices: 45, storage: 128, api: 4800 },
  { month: 'Nov', devices: 48, storage: 135, api: 5100 },
  { month: 'Dec', devices: 52, storage: 142, api: 5400 },
  { month: 'Jan', devices: 54, storage: 156, api: 5800 }
];

export function ClientBillingPortal() {
  const [invoices] = useState<Invoice[]>(DEMO_INVOICES);

  // Demo client data
  const clientName = "Acme Corporation";
  const currentBalance = 3450;
  const devicesManaged = 54;
  const storageUsedGb = 156;
  const apiCallsThisMonth = 5800;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</Badge>;
      default:
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">Overdue</Badge>;
    }
  };

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
            <p className="text-sm text-slate-400">{clientName} • Account Overview</p>
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
            <p className="text-2xl font-bold text-amber-400">${currentBalance.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">Due Feb 15, 2025</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-slate-500">Devices Managed</span>
            </div>
            <p className="text-2xl font-bold text-white">{devicesManaged}</p>
            <p className="text-xs text-green-400 mt-1">+2 from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-slate-500">Storage Used</span>
            </div>
            <p className="text-2xl font-bold text-white">{storageUsedGb} GB</p>
            <Progress value={62} className="mt-2 h-1.5 bg-slate-800" />
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-400" />
              <span className="text-xs text-slate-500">API Calls</span>
            </div>
            <p className="text-2xl font-bold text-white">{apiCallsThisMonth.toLocaleString()}</p>
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={USAGE_DATA}>
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
                  <Line type="monotone" dataKey="storage" stroke="#a78bfa" strokeWidth={2} name="Storage (GB)" />
                </LineChart>
              </ResponsiveContainer>
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
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-cyan-400" />
                      <div>
                        <p className="text-sm text-white font-mono">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-slate-500">
                          {invoice.status === 'paid' ? `Paid ${invoice.paidDate}` : `Due ${invoice.dueDate}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-white font-medium">${invoice.amount.toLocaleString()}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-400">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
