import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, Download, RefreshCw, Search, HelpCircle, Bell, MessageCircle,
  Maximize2, MoreHorizontal, Shield
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useMSP } from "@/hooks/useMSP";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Dashboard widgets
import { TicketStatusWidget } from "@/components/vanguard/dashboard/TicketStatusWidget";
import { AlertStatusWidget } from "@/components/vanguard/dashboard/AlertStatusWidget";
import { AvailabilityMonitoringWidget } from "@/components/vanguard/dashboard/AvailabilityMonitoringWidget";
import { RecentAlertsWidget } from "@/components/vanguard/dashboard/RecentAlertsWidget";
import { CustomerTicketsWidget } from "@/components/vanguard/dashboard/CustomerTicketsWidget";
import { CriticalTicketsWidget } from "@/components/vanguard/dashboard/CriticalTicketsWidget";
import { TicketActivityWidget } from "@/components/vanguard/dashboard/TicketActivityWidget";

const VanguardDashboard = () => {
  const navigate = useNavigate();
  const { clients } = useMSP();
  const { agents, refetch: refreshAgents } = useVanguardAgents();
  const [searchQuery, setSearchQuery] = useState('');

  // Transform to organizations
  const organizations = clients.map(client => ({
    id: client.id,
    company_name: client.company_name,
    device_count: agents.filter(a => a.client_id === client.id).length,
  }));

  const handleRefresh = () => {
    refreshAgents();
    toast.success('Refreshed');
  };

  // Mock data for widgets
  const ticketStats = { open: 14, pending: 0, dueToday: 0, overdue: 12 };
  const alertStats = { warning: 1, critical: 4 };
  
  const recentAlerts = [
    { id: '1', title: 'Machine status unknown - agent has not established c...', severity: 'critical' as const, client_name: 'Hot Pepper Catering', device_name: 'Dana-Ubuntu-VM', created_at: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '2', title: 'Machine status unknown - agent has not established c...', severity: 'critical' as const, client_name: 'Florist of October', device_name: 'Lindgren\'s PC', created_at: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '3', title: 'Network scan has stopped because the scanning agen...', severity: 'critical' as const, client_name: 'Lost Keys Locksmiths', device_name: 'Pearce\'s PC', created_at: new Date(Date.now() - 5 * 30 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '4', title: 'Machine status unknown - agent has not established c...', severity: 'critical' as const, client_name: 'Lost Keys Locksmiths', device_name: 'Pearce\'s PC', created_at: new Date(Date.now() - 5 * 30 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '5', title: 'The Fan Speed is lower than the threshold of 500.00 R...', severity: 'warning' as const, client_name: 'Strange Brew Inc', device_name: 'Kudo-MBP16', created_at: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  const customerTickets = [
    { client_id: '1', client_name: 'DC Electric', ticket_count: 1 },
    { client_id: '2', client_name: 'Blackbird Financial', ticket_count: 2 },
    { client_id: '3', client_name: 'Hot Pepper Catering', ticket_count: 2 },
    { client_id: '4', client_name: 'Florist of October', ticket_count: 1 },
    { client_id: '5', client_name: 'Lost Keys Locksmiths', ticket_count: 1 },
  ];

  const criticalTickets = [
    { id: '1', ticket_number: '37', title: 'Monitor hello yes test', client_name: 'Florist of October', technician: 'Martin Jones', priority: 'critical' as const, sla_status: '1d' },
    { id: '2', ticket_number: '20', title: "I can't access our company's shared folders", client_name: 'Strange Brew Inc', technician: 'John Smith', priority: 'medium' as const, sla_status: '-5h' },
    { id: '3', ticket_number: '18', title: 'Important files missing - help', client_name: 'Strange Brew Inc', technician: 'John Smith', priority: 'high' as const, sla_status: '1d' },
    { id: '4', ticket_number: '17', title: 'Razzmatazz November 23', client_name: 'Florist of October', technician: 'Martin Jones', priority: 'low' as const, sla_status: '-2w' },
  ];

  const ticketActivity = [
    { date: '25 Apr', opened: 0, resolved: 0 },
    { date: '26 Apr', opened: 0, resolved: 0 },
    { date: '27 Apr', opened: 0, resolved: 0 },
    { date: '28 Apr', opened: 3, resolved: 2 },
    { date: '29 Apr', opened: 0, resolved: 0 },
    { date: '30 Apr', opened: 0, resolved: 0 },
    { date: '1 May', opened: 0, resolved: 0 },
  ];

  return (
    <div className="min-h-screen">
      {/* Top Header Bar - Dark Vanguard Theme */}
      <header className="sticky top-0 z-30 h-14 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-cyan-500/20 flex items-center justify-between px-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {/* New Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1 bg-cyan-600 hover:bg-cyan-700 text-white border-0">
                New
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-slate-900 border-cyan-500/20">
              <DropdownMenuItem 
                onClick={() => navigate('/vanguard/tickets/new')}
                className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400"
              >
                New Ticket
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/vanguard/customers/new')}
                className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400"
              >
                New Customer
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/vanguard/devices/new')}
                className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400"
              >
                New Device
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[300px] h-9 bg-slate-800/50 border-cyan-500/20 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50"
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            className="gap-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30"
            onClick={() => navigate('/vanguard/setup')}
          >
            <Download className="h-4 w-4" />
            Install agent
          </Button>
          
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10">
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10" onClick={handleRefresh}>
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-sm font-medium text-white">
            U
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="p-6">
        {/* Page Title with Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Shield className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-100">Dashboard</h1>
              <p className="text-sm text-slate-400">Overview of your security operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Top Row: Ticket Status + Alert Status */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
          <div className="lg:col-span-3">
            <TicketStatusWidget {...ticketStats} />
          </div>
          <div>
            <AlertStatusWidget {...alertStats} />
          </div>
        </div>

        {/* Middle Row: Availability + Recent Alerts + Ticket Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <AvailabilityMonitoringWidget devices={agents} />
          <RecentAlertsWidget alerts={recentAlerts} />
          <TicketActivityWidget data={ticketActivity} />
        </div>

        {/* Bottom Row: Customer Tickets + Map + Critical Tickets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <CustomerTicketsWidget customers={customerTickets} />
          {/* Map placeholder */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-lg border border-cyan-500/20 p-4 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-cyan-400 mb-3">Map overview</h3>
            <div className="h-[200px] bg-slate-900/50 rounded flex items-center justify-center text-slate-500 text-sm border border-cyan-500/10">
              Map visualization
            </div>
          </div>
          <CriticalTicketsWidget tickets={criticalTickets} />
        </div>
      </div>
    </div>
  );
};

export default VanguardDashboard;
