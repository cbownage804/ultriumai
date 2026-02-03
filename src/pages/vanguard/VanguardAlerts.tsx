import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bell, Search, Filter, AlertTriangle, Shield, Monitor, Network,
  Clock, CheckCircle2, XCircle, Eye, MoreVertical, Volume2, VolumeX, Ticket
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getVanguardBasePath } from '@/utils/subdomain';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNowStrict } from 'date-fns';

type UiSeverity = 'critical' | 'high' | 'warning' | 'low';
type UiStatus = 'active' | 'acknowledged' | 'resolved';

interface UiAlert {
  id: string;
  title: string;
  device: string;
  customer: string;
  severity: UiSeverity;
  category: string;
  time: string;
  status: UiStatus;
  description: string;
}

type RealtimeAlertRow = {
  id: string;
  user_id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  metadata: any;
  created_at: string;
};

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
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [alerts, setAlerts] = useState<UiAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<UiAlert | null>(null);
  const [showCreateTicketDialog, setShowCreateTicketDialog] = useState(false);
  const [ticketNote, setTicketNote] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    document.title = 'Vanguard Pursuit | Ultrium Vanguard';
  }, []);

  const normalizeSeverity = (sev: string | null | undefined): UiSeverity => {
    const s = (sev || '').toLowerCase();
    if (s === 'critical') return 'critical';
    if (s === 'high') return 'high';
    if (s === 'warning') return 'warning';
    if (s === 'medium') return 'warning';
    if (s === 'info') return 'low';
    if (s === 'low') return 'low';
    return 'warning';
  };

  const toUiAlert = (row: RealtimeAlertRow): UiAlert => {
    const metadata = row.metadata || {};
    const device =
      metadata.device ||
      metadata.hostname ||
      metadata.agent_name ||
      metadata.agentName ||
      metadata.asset_name ||
      '—';
    const customer =
      metadata.customer ||
      metadata.client ||
      metadata.client_name ||
      metadata.organization ||
      metadata.organization_name ||
      '—';

    const status: UiStatus = row.resolved_at
      ? 'resolved'
      : row.acknowledged_at
        ? 'acknowledged'
        : 'active';

    return {
      id: row.id,
      title: row.title,
      device: String(device),
      customer: String(customer),
      severity: normalizeSeverity(row.severity),
      category: row.alert_type || 'security',
      time: formatDistanceToNowStrict(new Date(row.created_at), { addSuffix: true }),
      status,
      description: row.description,
    };
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const load = async () => {
      if (!user?.id) {
        setAlerts([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('realtime_alerts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) throw error;
        if (cancelled) return;

        setAlerts(((data as RealtimeAlertRow[]) || []).map(toUiAlert));
      } catch (err: any) {
        console.error('Failed to load realtime_alerts:', err);
        toast.error('Failed to load alerts', { description: err?.message });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    if (user?.id) {
      channel = supabase
        .channel(`realtime_alerts_changes_${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'realtime_alerts', filter: `user_id=eq.${user.id}` },
          () => {
            // keep it simple + consistent
            load();
          }
        )
        .subscribe();
    }

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const stats = [
    { label: 'Critical', value: alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length, color: 'text-red-400', bg: 'bg-red-500/20' },
    { label: 'High', value: alerts.filter(a => a.severity === 'high' && a.status !== 'resolved').length, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    { label: 'Warning', value: alerts.filter(a => a.severity === 'warning' && a.status !== 'resolved').length, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    { label: 'Resolved Today', value: alerts.filter(a => a.status === 'resolved').length, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  ];

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        alert.title.toLowerCase().includes(q) ||
        alert.device.toLowerCase().includes(q) ||
        alert.customer.toLowerCase().includes(q);
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'active' && alert.status === 'active') ||
        (activeTab === 'acknowledged' && alert.status === 'acknowledged') ||
        (activeTab === 'resolved' && alert.status === 'resolved');
      return matchesSearch && matchesTab;
    });
  }, [alerts, activeTab, searchQuery]);

  const handleAcknowledge = async (alertId: string) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('realtime_alerts')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id,
        })
        .eq('id', alertId)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Alert acknowledged');
    } catch (err: any) {
      console.error('Failed to acknowledge alert:', err);
      toast.error('Failed to acknowledge', { description: err?.message });
    }
  };

  const handleResolve = async (alertId: string) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('realtime_alerts')
        .update({
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Alert resolved');
    } catch (err: any) {
      console.error('Failed to resolve alert:', err);
      toast.error('Failed to resolve', { description: err?.message });
    }
  };

  const handleAcknowledgeAll = async () => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('realtime_alerts')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id,
        })
        .eq('user_id', user.id)
        .is('resolved_at', null)
        .is('acknowledged_at', null);
      if (error) throw error;
      toast.success('All active alerts acknowledged');
    } catch (err: any) {
      console.error('Failed to acknowledge all:', err);
      toast.error('Failed to acknowledge all', { description: err?.message });
    }
  };

  const handleMuteAll = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? 'Alert sounds unmuted' : 'All alert sounds muted');
  };

  const handleViewDetails = (alert: UiAlert) => {
    setSelectedAlert(alert);
  };

  const handleCreateTicket = (alert: UiAlert) => {
    setSelectedAlert(alert);
    setShowCreateTicketDialog(true);
  };

  const handleSubmitTicket = () => {
    if (selectedAlert) {
      toast.success(`Ticket created for alert: ${selectedAlert.title}`);
      navigate(`${basePath}/tickets`);
    }
    setShowCreateTicketDialog(false);
    setTicketNote('');
    setSelectedAlert(null);
  };

  const handleViewDevice = (alert: UiAlert) => {
    toast.info(`Navigating to device: ${alert.device}`);
    navigate(`${basePath}/devices`);
  };

  const handleSuppress = async (alertId: string) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('realtime_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          resolution_notes: 'Suppressed from dashboard',
        })
        .eq('id', alertId)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Alert suppressed');
    } catch (err: any) {
      console.error('Failed to suppress alert:', err);
      toast.error('Failed to suppress', { description: err?.message });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30 relative">
            <ModuleLogo module="pursuit" size="lg" glow />
            {alerts.filter(a => a.status === 'active').length > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">Vanguard Pursuit</h1>
            <p className="text-white/60 text-sm">Security alerts, threat detection, and response</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
            onClick={handleMuteAll}
          >
            {isMuted ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
            {isMuted ? 'Unmute' : 'Mute All'}
          </Button>
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-medium"
            onClick={handleAcknowledgeAll}
          >
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
          {isLoading && (
            <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
              <CardContent className="p-6 text-white/60 text-sm">Loading alerts…</CardContent>
            </Card>
          )}

          {!isLoading && filteredAlerts.length === 0 && (
            <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Bell className="h-10 w-10 mx-auto mb-3 text-white/30" />
                <div className="text-white/70 font-medium">No alerts yet</div>
                <div className="text-white/50 text-sm mt-1">
                  Alerts will appear here as your agents and integrations report telemetry.
                </div>
              </CardContent>
            </Card>
          )}

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
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-white/60 hover:text-white hover:bg-cyan-500/10"
                          onClick={() => handleViewDetails(alert)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-white/60 hover:text-white hover:bg-cyan-500/10"
                          onClick={() => alert.status === 'active' ? handleAcknowledge(alert.id) : handleResolve(alert.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
                            <DropdownMenuItem 
                              className="text-white/80 hover:bg-cyan-500/10"
                              onClick={() => handleViewDetails(alert)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-white/80 hover:bg-cyan-500/10"
                              onClick={() => handleCreateTicket(alert)}
                            >
                              <Ticket className="h-4 w-4 mr-2" />
                              Create Ticket
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-white/80 hover:bg-cyan-500/10"
                              onClick={() => handleSuppress(alert.id)}
                            >
                              <VolumeX className="h-4 w-4 mr-2" />
                              Suppress
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-cyan-500/20" />
                            <DropdownMenuItem 
                              className="text-white/80 hover:bg-cyan-500/10"
                              onClick={() => handleViewDevice(alert)}
                            >
                              <Monitor className="h-4 w-4 mr-2" />
                              View Device
                            </DropdownMenuItem>
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

      {/* Alert Details Dialog */}
      <Dialog open={!!selectedAlert && !showCreateTicketDialog} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="bg-slate-900 border-cyan-500/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-cyan-400" />
              Alert Details
            </DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4 py-4">
              <h3 className="text-xl font-semibold text-white">{selectedAlert.title}</h3>
              <div className="flex items-center gap-4">
                <Badge className={severityColors[selectedAlert.severity as keyof typeof severityColors]}>
                  {selectedAlert.severity}
                </Badge>
                <Badge className={statusColors[selectedAlert.status as keyof typeof statusColors]}>
                  {selectedAlert.status}
                </Badge>
                <span className="text-white/60 text-sm">{selectedAlert.time}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/60">Device</Label>
                  <p className="text-white">{selectedAlert.device}</p>
                </div>
                <div>
                  <Label className="text-white/60">Customer</Label>
                  <p className="text-white">{selectedAlert.customer}</p>
                </div>
                <div>
                  <Label className="text-white/60">Category</Label>
                  <p className="text-white capitalize">{selectedAlert.category}</p>
                </div>
              </div>
              <div>
                <Label className="text-white/60">Description</Label>
                <p className="text-white/80 mt-1">{selectedAlert.description}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAlert(null)} className="border-cyan-500/20 text-white/80">
              Close
            </Button>
            <Button 
              onClick={() => {
                if (selectedAlert) handleCreateTicket(selectedAlert);
              }} 
              className="bg-cyan-500 hover:bg-cyan-600 text-black"
            >
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateTicketDialog} onOpenChange={setShowCreateTicketDialog}>
        <DialogContent className="bg-slate-900 border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">Create Ticket from Alert</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-white/60">Alert</Label>
                <p className="text-white">{selectedAlert.title}</p>
              </div>
              <div>
                <Label className="text-white/80">Additional Notes</Label>
                <Textarea
                  value={ticketNote}
                  onChange={(e) => setTicketNote(e.target.value)}
                  placeholder="Add any additional context..."
                  className="bg-black/40 border-cyan-500/20 text-white min-h-[100px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTicketDialog(false)} className="border-cyan-500/20 text-white/80">
              Cancel
            </Button>
            <Button onClick={handleSubmitTicket} className="bg-cyan-500 hover:bg-cyan-600 text-black">
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
