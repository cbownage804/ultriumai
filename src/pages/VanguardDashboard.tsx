import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown, Download, RefreshCw, Search, HelpCircle, Bell, MessageCircle,
  Maximize2, MoreHorizontal, Shield, Play
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useMSP } from "@/hooks/useMSP";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, isAfter, isSameDay } from "date-fns";
import { ProductTour, useProductTour } from '@/components/onboarding';
import { VANGUARD_TOUR_STEPS } from '@/config/productTours';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VanguardUserMenu } from "@/components/vanguard/VanguardUserMenu";

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
  const [searchParams] = useSearchParams();
  const { clients } = useMSP();
  const { agents, refetch: refreshAgents } = useVanguardAgents();
  const [searchQuery, setSearchQuery] = useState('');
  const { isCompleted: isTourCompleted, resetTour } = useProductTour('vanguard-command');
  const [showTour, setShowTour] = useState(false);
  
  // Real data state
  const [ticketStats, setTicketStats] = useState({ open: 0, pending: 0, dueToday: 0, overdue: 0 });
  const [alertStats, setAlertStats] = useState({ warning: 0, critical: 0 });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [customerTickets, setCustomerTickets] = useState<any[]>([]);
  const [criticalTickets, setCriticalTickets] = useState<any[]>([]);
  const [ticketActivity, setTicketActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check URL params to see if tour should start
  useEffect(() => {
    if (searchParams.get('tour') === 'true') {
      resetTour();
      setShowTour(true);
    }
  }, [searchParams, resetTour]);

  // Auto-show tour on first visit (after loading)
  useEffect(() => {
    if (!isLoading && !isTourCompleted && !showTour) {
      const timer = setTimeout(() => setShowTour(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isTourCompleted, showTour]);

  const handleStartTour = () => {
    resetTour();
    setShowTour(true);
  };

  // Fetch real data from database
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch tickets for stats
        const { data: tickets } = await supabase
          .from('tickets')
          .select('id, status, due_date, priority, title, created_at, client_id, assigned_to')
          .eq('user_id', user.id);

        if (tickets) {
          const now = new Date();
          const today = startOfDay(now);
          
          const open = tickets.filter(t => t.status === 'open').length;
          const pending = tickets.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
          const dueToday = tickets.filter(t => t.due_date && isSameDay(new Date(t.due_date), today) && t.status !== 'resolved' && t.status !== 'closed').length;
          const overdue = tickets.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'resolved' && t.status !== 'closed').length;
          
          setTicketStats({ open, pending, dueToday, overdue });

          // Critical and overdue tickets
          const criticalOrOverdue = tickets
            .filter(t => (t.priority === 'critical' || t.priority === 'high' || (t.due_date && new Date(t.due_date) < now)) && t.status !== 'resolved' && t.status !== 'closed')
            .slice(0, 4)
            .map(t => {
              const client = clients.find(c => c.id === t.client_id);
              const slaMs = t.due_date ? new Date(t.due_date).getTime() - now.getTime() : null;
              let slaStatus = '';
              if (slaMs !== null) {
                const hours = Math.floor(slaMs / (1000 * 60 * 60));
                const days = Math.floor(hours / 24);
                if (hours < 0) {
                  slaStatus = days < -1 ? `${Math.abs(days)}d` : `${Math.abs(hours)}h`;
                  slaStatus = '-' + slaStatus;
                } else {
                  slaStatus = days >= 1 ? `${days}d` : `${hours}h`;
                }
              }
              return {
                id: t.id,
                ticket_number: t.id.slice(0, 8),
                title: t.title || 'Untitled',
                client_name: client?.company_name || 'Unknown',
                technician: t.assigned_to || null,
                priority: t.priority || 'medium',
                sla_status: slaStatus
              };
            });
          setCriticalTickets(criticalOrOverdue);

          // Customer tickets aggregation
          const ticketsByClient: Record<string, { client_id: string; client_name: string; ticket_count: number }> = {};
          tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').forEach(t => {
            if (t.client_id) {
              const client = clients.find(c => c.id === t.client_id);
              if (client) {
                if (!ticketsByClient[t.client_id]) {
                  ticketsByClient[t.client_id] = {
                    client_id: t.client_id,
                    client_name: client.company_name,
                    ticket_count: 0
                  };
                }
                ticketsByClient[t.client_id].ticket_count++;
              }
            }
          });
          setCustomerTickets(Object.values(ticketsByClient).slice(0, 5));

          // Ticket activity for last 7 days
          const activityData = [];
          for (let i = 6; i >= 0; i--) {
            const day = subDays(now, i);
            const dayStart = startOfDay(day);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);
            
            const opened = tickets.filter(t => {
              const created = new Date(t.created_at);
              return created >= dayStart && created < dayEnd;
            }).length;
            
            const resolved = tickets.filter(t => {
              // Check if resolved on this day (would need resolved_at field, using created_at as fallback)
              return false; // No resolved_at field available
            }).length;
            
            activityData.push({
              date: format(day, 'd MMM'),
              opened,
              resolved
            });
          }
          setTicketActivity(activityData);
        }

        // Fetch security events for alerts
        const { data: securityEvents } = await supabase
          .from('security_events')
          .select('id, event_type, severity, description, title, affected_assets, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (securityEvents) {
          const warning = securityEvents.filter(e => e.severity === 'medium' || e.severity === 'low').length;
          const critical = securityEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length;
          setAlertStats({ warning, critical });

          // Map to recent alerts format
          const recentAlertsData = securityEvents.slice(0, 5).map((event) => {
            // Extract device/client info from affected_assets if available
            const assets = event.affected_assets || [];
            const deviceName = assets.length > 0 ? String(assets[0]) : '';
              
            return {
              id: event.id,
              title: event.title || event.description || event.event_type || 'Security Event',
              severity: (event.severity === 'high' || event.severity === 'critical') ? 'critical' as const : 
                       (event.severity === 'medium') ? 'warning' as const : 'info' as const,
              device_name: deviceName,
              client_name: '',
              created_at: event.created_at
            };
          });
          setRecentAlerts(recentAlertsData);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [clients, agents]);

  const handleRefresh = () => {
    refreshAgents();
    setIsLoading(true);
    // Re-trigger the useEffect by forcing a re-render
    setTimeout(() => setIsLoading(false), 500);
    toast.success('Refreshed');
  };

  return (
    <TooltipProvider>
    <div className="min-h-screen">
      {/* Top Header Bar - Pure Black Vanguard Theme */}
      <header data-tour="vanguard-header" className="sticky top-0 z-30 h-14 bg-black/90 border-b border-cyan-500/30 flex items-center justify-between px-4 backdrop-blur-xl shadow-lg shadow-cyan-500/5">
        <div className="flex items-center gap-3">
          {/* New Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:from-cyan-500 hover:via-blue-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-purple-500/30 font-medium">
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
            className="gap-2 bg-black/60 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:via-blue-500/15 hover:to-purple-500/20 text-cyan-400 border border-transparent bg-clip-padding relative before:absolute before:inset-0 before:rounded-md before:p-[1px] before:bg-gradient-to-r before:from-cyan-400 before:via-blue-500 before:to-purple-600 before:-z-10 before:content-[''] shadow-lg shadow-purple-500/20"
            onClick={() => navigate('/vanguard/setup')}
          >
            <Download className="h-4 w-4" />
            Install agent
          </Button>
          
          {/* Tour Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                data-tour="help-button"
                className="h-9 w-9 text-slate-400 hover:text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:to-purple-500/15"
                onClick={handleStartTour}
              >
                <Play className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-black/90 border-cyan-500/30 text-cyan-100">
              <p>Replay guided tour</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-slate-400 hover:text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:to-purple-500/15"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-black/90 border-cyan-500/30 text-cyan-100">
              <p>Help Center</p>
            </TooltipContent>
          </Tooltip>
          
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:to-purple-500/15">
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:to-purple-500/15" onClick={handleRefresh}>
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-purple-400 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:to-purple-500/15 relative">
            <Bell className="h-5 w-5" />
            {(alertStats.warning + alertStats.critical) > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full ring-2 ring-purple-500/30 animate-pulse shadow-lg shadow-purple-500/50" />
            )}
          </Button>
          <VanguardUserMenu />
        </div>
      </header>

      {/* Page Content */}
      <div className="p-6">
        {/* Page Title with Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 via-purple-500/20 to-cyan-600/20 border border-cyan-500/40 shadow-lg shadow-purple-500/20">
              <Shield className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">Vanguard Command</h1>
              <p className="text-sm text-slate-400">Unified visibility across Horizon, Pursuit, Response, and Cortex</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-purple-400 hover:bg-purple-500/15">
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
          <div className="lg:col-span-3" data-tour="ticket-status">
            <TicketStatusWidget {...ticketStats} />
          </div>
          <div data-tour="alert-status">
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
          <div data-tour="availability-monitoring">
            <AvailabilityMonitoringWidget devices={agents} />
          </div>
          <div data-tour="recent-alerts">
            <RecentAlertsWidget alerts={recentAlerts} />
          </div>
          <div data-tour="ticket-activity">
            <TicketActivityWidget data={ticketActivity} />
          </div>
        </div>

        {/* Bottom Row: Customer Tickets + Map + Critical Tickets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div data-tour="customer-tickets">
            <CustomerTicketsWidget customers={customerTickets} />
          </div>
          {/* Map placeholder */}
          <div className="bg-black/80 rounded-xl border border-cyan-500/30 p-4 backdrop-blur-sm shadow-xl shadow-cyan-500/5">
            <h3 className="text-sm font-medium text-cyan-400 mb-3">Map overview</h3>
            <div className="h-[200px] bg-black/60 rounded-lg flex items-center justify-center text-slate-500 text-sm border border-cyan-500/20">
              Map visualization
            </div>
          </div>
          <div data-tour="critical-tickets">
            <CriticalTicketsWidget tickets={criticalTickets} />
          </div>
        </div>
      </div>

      {/* Product Tour */}
      {showTour && (
        <ProductTour 
          tourId="vanguard-command" 
          steps={VANGUARD_TOUR_STEPS}
          autoStart={true}
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
        />
      )}
    </div>
    </TooltipProvider>
  );
};

export default VanguardDashboard;
