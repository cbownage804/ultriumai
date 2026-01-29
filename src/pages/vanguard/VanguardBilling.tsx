import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, Download, FileText, DollarSign, TrendingUp,
  Calendar, CheckCircle2, AlertCircle, Clock, Users, Monitor
} from 'lucide-react';

const invoices = [
  { id: 'INV-2024-001', date: 'Jan 1, 2024', amount: 2499.00, status: 'paid', customer: 'Acme Corp' },
  { id: 'INV-2024-002', date: 'Jan 15, 2024', amount: 1899.00, status: 'paid', customer: 'TechStart Inc' },
  { id: 'INV-2024-003', date: 'Feb 1, 2024', amount: 3299.00, status: 'pending', customer: 'GlobalTech' },
  { id: 'INV-2024-004', date: 'Feb 1, 2024', amount: 899.00, status: 'overdue', customer: 'StartupXYZ' },
];

const usageData = [
  { name: 'Devices Monitored', used: 1284, limit: 2000, unit: 'devices' },
  { name: 'API Calls', used: 45000, limit: 100000, unit: 'calls' },
  { name: 'Storage Used', used: 125, limit: 500, unit: 'GB' },
  { name: 'Team Members', used: 12, limit: 25, unit: 'users' },
];

const statusColors = {
  paid: 'bg-emerald-500/20 text-emerald-400',
  pending: 'bg-amber-500/20 text-amber-400',
  overdue: 'bg-red-500/20 text-red-400',
};

export default function VanguardBilling() {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    document.title = 'Billing | Ultrium Vanguard';
  }, []);

  const stats = [
    { label: 'Current MRR', value: '$52,400', change: '+12%', icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Outstanding', value: '$4,198', change: '2 invoices', icon: Clock, color: 'text-amber-400' },
    { label: 'Customers', value: '48', change: '+3 this month', icon: Users, color: 'text-cyan-400' },
    { label: 'Devices', value: '1,284', change: '+156', icon: Monitor, color: 'text-blue-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <CreditCard className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Billing</h1>
            <p className="text-white/60 text-sm">Manage invoices and subscriptions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
            <FileText className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                    <p className="text-emerald-400 text-xs mt-1">{stat.change}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/40 border border-cyan-500/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Overview</TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Invoices</TabsTrigger>
          <TabsTrigger value="usage" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Usage</TabsTrigger>
          <TabsTrigger value="subscription" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Invoices */}
            <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  Recent Invoices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoices.slice(0, 4).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{invoice.id}</p>
                      <p className="text-white/60 text-sm">{invoice.customer} • {invoice.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">${invoice.amount.toFixed(2)}</p>
                      <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Usage Summary */}
            <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  Usage Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {usageData.map((item) => {
                  const percentage = (item.used / item.limit) * 100;
                  return (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/80">{item.name}</span>
                        <span className="text-white/60">
                          {item.used.toLocaleString()} / {item.limit.toLocaleString()} {item.unit}
                        </span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2 bg-slate-800"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-500/20">
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Invoice</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Customer</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Date</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Amount</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Status</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-cyan-500/10 hover:bg-cyan-500/5">
                        <td className="p-4">
                          <span className="text-white font-medium">{invoice.id}</span>
                        </td>
                        <td className="p-4 text-white/80">{invoice.customer}</td>
                        <td className="p-4 text-white/60">{invoice.date}</td>
                        <td className="p-4 text-white font-medium">${invoice.amount.toFixed(2)}</td>
                        <td className="p-4">
                          <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm" className="text-cyan-400 hover:bg-cyan-500/10">
                            <Download className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {usageData.map((item, i) => {
              const percentage = (item.used / item.limit) * 100;
              const isHighUsage = percentage > 80;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className={`text-4xl font-bold ${isHighUsage ? 'text-amber-400' : 'text-white'}`}>
                            {item.used.toLocaleString()}
                          </p>
                          <p className="text-white/60">of {item.limit.toLocaleString()} {item.unit}</p>
                        </div>
                        <p className={`text-2xl font-bold ${isHighUsage ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {percentage.toFixed(0)}%
                        </p>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-3 bg-slate-800"
                      />
                      {isHighUsage && (
                        <p className="text-amber-400 text-sm flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          Approaching limit - consider upgrading
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="mt-6">
          <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-xl">Professional Plan</CardTitle>
                  <CardDescription className="text-white/60">Your current subscription</CardDescription>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 text-lg px-4 py-1">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-white/60 text-sm">Monthly Cost</p>
                  <p className="text-3xl font-bold text-white">$499</p>
                  <p className="text-white/60 text-sm">per month</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-white/60 text-sm">Next Billing Date</p>
                  <p className="text-3xl font-bold text-white">Mar 1</p>
                  <p className="text-white/60 text-sm">2024</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-white/60 text-sm">Payment Method</p>
                  <p className="text-xl font-bold text-white">•••• 4242</p>
                  <p className="text-white/60 text-sm">Visa</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
                  Change Plan
                </Button>
                <Button variant="outline" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
                  Update Payment
                </Button>
                <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10">
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
