import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, Plus, Search, Filter, Monitor, Shield, AlertTriangle,
  CheckCircle2, MoreVertical, Users, DollarSign, TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockCustomers = [
  { id: '1', name: 'Acme Corporation', devices: 45, alerts: 3, status: 'healthy', mrr: 2500, contacts: 5, securityScore: 92 },
  { id: '2', name: 'TechStart Inc', devices: 28, alerts: 8, status: 'warning', mrr: 1800, contacts: 3, securityScore: 78 },
  { id: '3', name: 'GlobalTech Solutions', devices: 120, alerts: 1, status: 'healthy', mrr: 5500, contacts: 12, securityScore: 96 },
  { id: '4', name: 'DataFlow LLC', devices: 35, alerts: 15, status: 'critical', mrr: 2100, contacts: 4, securityScore: 45 },
  { id: '5', name: 'StartupXYZ', devices: 12, alerts: 0, status: 'healthy', mrr: 800, contacts: 2, securityScore: 88 },
  { id: '6', name: 'Enterprise Corp', devices: 250, alerts: 5, status: 'warning', mrr: 12000, contacts: 25, securityScore: 82 },
];

const statusColors = {
  healthy: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400',
  critical: 'bg-red-500/20 text-red-400',
};

const scoreColors = (score: number) => {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-red-400';
};

export default function VanguardCustomers() {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.title = 'Customers | Ultrium Vanguard';
  }, []);

  const stats = [
    { label: 'Total Customers', value: 48, icon: Building2, color: 'text-cyan-400' },
    { label: 'Total Devices', value: 1284, icon: Monitor, color: 'text-blue-400' },
    { label: 'Monthly Revenue', value: '$52,400', icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Avg. Security Score', value: '84%', icon: Shield, color: 'text-amber-400' },
  ];

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Building2 className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Customers</h1>
            <p className="text-white/60 text-sm">Manage your client organizations</p>
          </div>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
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
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input 
            placeholder="Search customers..." 
            className="pl-10 bg-black/40 border-cyan-500/20 text-white placeholder:text-white/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Customer Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCustomers.map((customer, i) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{customer.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={statusColors[customer.status as keyof typeof statusColors]}>
                          {customer.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
                      <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">View Dashboard</DropdownMenuItem>
                      <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">View Devices</DropdownMenuItem>
                      <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">View Tickets</DropdownMenuItem>
                      <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">Edit Customer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-white/40" />
                    <span className="text-white/80 text-sm">{customer.devices} devices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-white/40" />
                    <span className="text-white/80 text-sm">{customer.contacts} contacts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-white/40" />
                    <span className={`text-sm ${customer.alerts > 5 ? 'text-red-400' : 'text-white/80'}`}>
                      {customer.alerts} alerts
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-white/40" />
                    <span className="text-emerald-400 text-sm">${customer.mrr}/mo</span>
                  </div>
                </div>
                
                {/* Security Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Security Score</span>
                    <span className={scoreColors(customer.securityScore)}>{customer.securityScore}%</span>
                  </div>
                  <Progress 
                    value={customer.securityScore} 
                    className="h-2 bg-slate-800"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
