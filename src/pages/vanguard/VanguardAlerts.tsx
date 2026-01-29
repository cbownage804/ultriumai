import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, Search, Filter, AlertTriangle, Shield, Monitor, Network,
  Clock, CheckCircle2, XCircle, Eye, MoreVertical, Volume2, VolumeX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockAlerts = [
  { id: '1', title: 'High CPU Usage Detected', device: 'SRV-PROD-01', customer: 'Acme Corp', severity: 'critical', category: 'performance', time: '2 min ago', status: 'active' },
  { id: '2', title: 'Suspicious Login Attempt', device: 'WKS-HR-05', customer: 'TechStart Inc', severity: 'high', category: 'security', time: '15 min ago', status: 'active' },
  { id: '3', title: 'Disk Space Low (< 10%)', device: 'SRV-FILE-02', customer: 'GlobalTech', severity: 'warning', category: 'storage', time: '1 hour ago', status: 'active' },
  { id: '4', title: 'Service Stopped: SQL Server', device: 'SRV-DB-01', customer: 'DataFlow LLC', severity: 'critical', category: 'service', time: '30 min ago', status: 'acknowledged' },
  { id: '5', title: 'Network Latency Spike', device: 'ROUTER-MAIN', customer: 'Enterprise Corp', severity: 'warning', category: 'network', time: '2 hours ago', status: 'resolved' },
  { id: '6', title: 'Antivirus Definitions Outdated', device: 'WKS-DEV-12', customer: 'StartupXYZ', severity: 'low', category: 'security', time: '3 hours ago', status: 'active' },
  { id: '7', title: 'Backup Failed', device: 'SRV-BACKUP', customer: 'Acme Corp', severity: 'high', category: 'backup', time: '4 hours ago', status: 'active' },
  { id: '8', title: 'Memory Pressure Warning', device: 'SRV-APP-03', customer: 'TechStart Inc', severity: 'warning', category: 'performance', time: '5 hours ago', status: 'acknowledged' },
];

const severityColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusColors = {
  active: 'bg-red-500/20 text-red-400',
  acknowledged: 'bg-amber-500/20 text-amber-400',
  resolved: 'bg-emerald-500/20 text-emerald-400',
};

const categoryIcons = {
  performance: Monitor,
  security: Shield,
  storage: Monitor,
  service: Monitor,
  network: Network,
  backup: Monitor,
};

export default function VanguardAlerts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    document.title = 'Alerts | Ultrium Vanguard';
  }, []);

  const stats = [
    { label: 'Critical', value: 5, color: 'text-red-400', bg: 'bg-red-500/20' },
    { label: 'High', value: 12, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    { label: 'Warning', value: 28, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    { label: 'Resolved Today', value: 45, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  ];

  const filteredAlerts = mockAlerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alert.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alert.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'active' && alert.status === 'active') ||
                       (activeTab === 'acknowledged' && alert.status === 'acknowledged') ||
                       (activeTab === 'resolved' && alert.status === 'resolved');
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg relative">
            <Bell className="h-6 w-6 text-cyan-400" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Alerts</h1>
            <p className="text-white/60 text-sm">Monitor and respond to system alerts</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
            <VolumeX className="h-4 w-4 mr-2" />
            Mute All
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-medium">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Acknowledge All
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
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <AlertTriangle className={`h-6 w-6 ${stat.color}`} />
                  </div>
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
            placeholder="Search alerts..." 
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/40 border border-cyan-500/20">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">All Alerts</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Active</TabsTrigger>
          <TabsTrigger value="acknowledged" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Acknowledged</TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {filteredAlerts.map((alert, i) => {
            const CategoryIcon = categoryIcons[alert.category as keyof typeof categoryIcons] || AlertTriangle;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${severityColors[alert.severity as keyof typeof severityColors]}`}>
                        <CategoryIcon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium truncate">{alert.title}</h3>
                          <Badge className={severityColors[alert.severity as keyof typeof severityColors]}>
                            {alert.severity}
                          </Badge>
                          <Badge className={statusColors[alert.status as keyof typeof statusColors]}>
                            {alert.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <span className="flex items-center gap-1">
                            <Monitor className="h-3 w-3" />
                            {alert.device}
                          </span>
                          <span>{alert.customer}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {alert.time}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-cyan-500/10">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-cyan-500/10">
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
                            <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">View Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">Create Ticket</DropdownMenuItem>
                            <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">Suppress</DropdownMenuItem>
                            <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">View Device</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
