import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Ticket, Plus, Search, Filter, Clock, AlertCircle, CheckCircle2, 
  XCircle, User, Building2, MoreVertical, MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockTickets = [
  { id: 'TKT-001', title: 'Server not responding', customer: 'Acme Corp', priority: 'critical', status: 'open', assignee: 'John Smith', created: '2h ago', sla: '1h remaining' },
  { id: 'TKT-002', title: 'Email sync issues', customer: 'TechStart Inc', priority: 'high', status: 'in_progress', assignee: 'Sarah Johnson', created: '4h ago', sla: '3h remaining' },
  { id: 'TKT-003', title: 'Password reset request', customer: 'GlobalTech', priority: 'medium', status: 'open', assignee: 'Unassigned', created: '1d ago', sla: '4h remaining' },
  { id: 'TKT-004', title: 'VPN connection drops', customer: 'DataFlow LLC', priority: 'high', status: 'in_progress', assignee: 'Mike Chen', created: '6h ago', sla: '2h remaining' },
  { id: 'TKT-005', title: 'Printer offline', customer: 'Acme Corp', priority: 'low', status: 'resolved', assignee: 'John Smith', created: '2d ago', sla: 'Completed' },
  { id: 'TKT-006', title: 'Software installation', customer: 'StartupXYZ', priority: 'medium', status: 'open', assignee: 'Unassigned', created: '3h ago', sla: '5h remaining' },
];

const priorityColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusColors = {
  open: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-cyan-500/20 text-cyan-400',
  resolved: 'bg-emerald-500/20 text-emerald-400',
  closed: 'bg-slate-500/20 text-slate-400',
};

const statusIcons = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle2,
  closed: XCircle,
};

export default function VanguardTickets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    document.title = 'Tickets | Ultrium Vanguard';
  }, []);

  const stats = [
    { label: 'Open', value: 12, icon: AlertCircle, color: 'text-blue-400' },
    { label: 'In Progress', value: 8, icon: Clock, color: 'text-cyan-400' },
    { label: 'Resolved Today', value: 15, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'SLA At Risk', value: 3, icon: XCircle, color: 'text-red-400' },
  ];

  const filteredTickets = mockTickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ticket.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || ticket.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Ticket className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tickets</h1>
            <p className="text-white/60 text-sm">Manage support tickets across all customers</p>
          </div>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
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
            placeholder="Search tickets..." 
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
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">All</TabsTrigger>
          <TabsTrigger value="open" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Open</TabsTrigger>
          <TabsTrigger value="in_progress" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">In Progress</TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-500/20">
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Ticket</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Customer</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Priority</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Status</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Assignee</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">SLA</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => {
                      const StatusIcon = statusIcons[ticket.status as keyof typeof statusIcons];
                      return (
                        <tr key={ticket.id} className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors cursor-pointer">
                          <td className="p-4">
                            <div>
                              <p className="text-white font-medium">{ticket.title}</p>
                              <p className="text-white/40 text-sm">{ticket.id} • {ticket.created}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-white/40" />
                              <span className="text-white/80">{ticket.customer}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                              {ticket.priority}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-white/40" />
                              <span className="text-white/80">{ticket.assignee}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`text-sm ${ticket.sla.includes('remaining') ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {ticket.sla}
                            </span>
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
                                <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">View Details</DropdownMenuItem>
                                <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">Assign</DropdownMenuItem>
                                <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">Add Note</DropdownMenuItem>
                                <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">Close Ticket</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
