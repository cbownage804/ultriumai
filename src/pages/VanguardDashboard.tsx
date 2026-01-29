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
      {/* Top Header Bar - Pure Black Vanguard Theme */}
      <header className="sticky top-0 z-30 h-14 bg-black/90 border-b border-cyan-500/30 flex items-center justify-between px-4 backdrop-blur-xl shadow-lg shadow-cyan-500/5">
        <div className="flex items-center gap-3">
          {/* New Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0 shadow-lg shadow-cyan-500/25">
                New
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-black border-cyan-500/30">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/60" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[300px] h-9 bg-black/60 border-cyan-500/30 text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20"
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            className="gap-2 bg-black/60 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:border-cyan-400/60"
            onClick={() => navigate('/vanguard/setup')}
          >
            <Download className="h-4 w-4" />
            Install agent
          </Button>
          
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/15">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/15">
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/15" onClick={handleRefresh}>
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/15 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-red-500/30 animate-pulse" />
          </Button>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-sm font-medium text-white shadow-lg shadow-cyan-500/30">
            U
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="p-6">
        {/* Page Title with Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 border border-cyan-500/40 shadow-lg shadow-cyan-500/20">
              <Shield className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Vanguard Command</h1>
              <p className="text-sm text-slate-400">Unified visibility across Horizon, Pursuit, Response, and Cortex</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/15">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/15">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Vanguard Response — Ticket Status */}
        <div className="mb-2">
          <h2 className="text-xs font-bold tracking-widest text-cyan-400 mb-2 drop-shadow-[0_0_4px_rgba(6,182,212,0.3)]">VANGUARD RESPONSE — TICKET STATUS</h2>
        </div>

        {/* Top Row: Ticket Status + Pursuit Alert Status */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3">
            <TicketStatusWidget {...ticketStats} />
          </div>
          <div>
            <div className="mb-2">
              <h2 className="text-xs font-bold tracking-widest text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.3)]">VANGUARD PURSUIT — ACTIVE THREATS</h2>
            </div>
            <AlertStatusWidget {...alertStats} />
          </div>
        </div>

        {/* Vanguard Horizon — Device Health */}
        <div className="mb-2">
          <h2 className="text-xs font-bold tracking-widest text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.3)]">VANGUARD HORIZON — DEVICE HEALTH</h2>
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
          <div className="bg-black/80 rounded-xl border border-cyan-500/30 p-4 backdrop-blur-sm shadow-xl shadow-cyan-500/5">
            <h3 className="text-sm font-medium text-cyan-400 mb-3">Map overview</h3>
            <div className="h-[200px] bg-black/60 rounded-lg flex items-center justify-center text-slate-500 text-sm border border-cyan-500/20">
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
