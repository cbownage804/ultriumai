import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, Shield, MapPin, Clock, User,
  Search, Brain, Ticket, CheckCircle,
  XCircle, Eye, Globe, Laptop, Loader2, RefreshCw
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SecurityAlert {
  id: string;
  event_type: string;
  event_id: string;
  severity: string;
  affected_user_email: string | null;
  affected_user_name: string | null;
  ip_address: string | null;
  location_city: string | null;
  location_country: string | null;
  device_info: any;
  status: string;
  event_details: any;
  detected_at: string | null;
  created_at: string;
  ticket_id: string | null;
  tenant_name?: string;
}

export function SecurityAlertsFeed() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [triaging, setTriaging] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAlerts();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('sentinel-alerts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'vanguard_m365_security_events' },
          () => fetchAlerts()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const { data: events, error } = await supabase
        .from('vanguard_m365_security_events')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get tenant names for the events
      const tenantIds = [...new Set(events?.map(e => e.tenant_id).filter(Boolean))];
      let tenantMap: Record<string, string> = {};
      
      if (tenantIds.length > 0) {
        const { data: tenants } = await supabase
          .from('vanguard_m365_tenants')
          .select('id, tenant_name')
          .in('id', tenantIds);
        
        tenants?.forEach(t => {
          tenantMap[t.id] = t.tenant_name;
        });
      }

      // Map to our interface with tenant names
      const mappedAlerts: SecurityAlert[] = (events || []).map(event => ({
        ...event,
        tenant_name: event.tenant_id ? tenantMap[event.tenant_id] : undefined
      }));

      setAlerts(mappedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriage = async (alertId: string) => {
    setTriaging(alertId);
    try {
      const { data, error } = await supabase.functions.invoke('sentinel-ai-triage', {
        body: { action: 'triage_single', eventId: alertId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data.ticketCreated) {
        toast.success('Ticket created automatically');
      } else {
        toast.success(`AI Decision: ${data.decision?.action}`);
      }
      fetchAlerts();
    } catch (error) {
      console.error('Triage error:', error);
      toast.error('AI triage failed');
    } finally {
      setTriaging(null);
    }
  };

  const handleCreateTicket = async (alert: SecurityAlert) => {
    try {
      const location = [alert.location_city, alert.location_country].filter(Boolean).join(', ') || 'Unknown';
      
      const ticketNumber = `SEC-${Date.now().toString(36).toUpperCase()}`;
      
      const ticketData = {
        user_id: user?.id as string,
        ticket_number: ticketNumber,
        title: `[Security] ${alert.event_type}: ${alert.affected_user_email || 'Unknown User'}`,
        description: `Security alert from Sentinel monitoring.\n\nUser: ${alert.affected_user_name || alert.affected_user_email || 'Unknown'}\nLocation: ${location}\nIP: ${alert.ip_address || 'Unknown'}\n\nDetails: ${JSON.stringify(alert.event_details || {}, null, 2)}`,
        status: 'open',
        priority: alert.severity === 'critical' ? 'urgent' : alert.severity === 'high' ? 'high' : 'medium'
      };
      
      const { error } = await supabase
        .from('tickets')
        .insert([ticketData]);

      if (error) throw error;
      
      // Update alert status
      await supabase
        .from('vanguard_m365_security_events')
        .update({ status: 'escalated' })
        .eq('id', alert.id);

      toast.success('Ticket created');
      fetchAlerts();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'risky_signin': return <AlertTriangle className="h-4 w-4" />;
      case 'conditional_access': return <Shield className="h-4 w-4" />;
      case 'mfa_failure': return <XCircle className="h-4 w-4" />;
      case 'mailbox_rule': return <Globe className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getEventTypeBadge = (type: string) => {
    const config: Record<string, { label: string; color: string }> = {
      risky_signin: { label: 'Risky Sign-In', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      conditional_access: { label: 'Conditional Access', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      mfa_failure: { label: 'MFA Failure', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      mailbox_rule: { label: 'Mailbox Rule', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
    };
    const { label, color } = config[type] || { label: type, color: 'bg-slate-500/20 text-slate-400' };
    return <Badge className={color}>{getEventTypeIcon(type)}<span className="ml-1">{label}</span></Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-600/30 text-red-300 border-red-500/50',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };
    return <Badge className={colors[severity] || colors.medium}>{(severity || 'medium').toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: React.ReactNode; color: string }> = {
      new: { icon: <AlertTriangle className="h-3 w-3" />, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      pending: { icon: <Clock className="h-3 w-3" />, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      needs_review: { icon: <Eye className="h-3 w-3" />, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      escalated: { icon: <Ticket className="h-3 w-3" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      auto_resolved: { icon: <CheckCircle className="h-3 w-3" />, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      monitored: { icon: <Eye className="h-3 w-3" />, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
    };
    const { icon, color } = config[status] || config.new;
    return <Badge className={color}>{icon}<span className="ml-1 capitalize">{(status || 'new').replace('_', ' ')}</span></Badge>;
  };

  const getLocation = (alert: SecurityAlert) => {
    return [alert.location_city, alert.location_country].filter(Boolean).join(', ') || 'Unknown';
  };

  const getDeviceInfo = (alert: SecurityAlert) => {
    if (!alert.device_info) return 'Unknown';
    if (typeof alert.device_info === 'string') return alert.device_info;
    return alert.device_info.displayName || alert.device_info.browser || 'Unknown Device';
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      (alert.affected_user_email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (alert.affected_user_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (alert.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (alert.location_city?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-black/40 border-cyan-500/30 text-white"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px] bg-black/40 border-cyan-500/30 text-white">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-cyan-500/30">
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-black/40 border-cyan-500/30 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-cyan-500/30">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="needs_review">Needs Review</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="auto_resolved">Auto-Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="icon"
          className="border-cyan-500/30"
          onClick={fetchAlerts}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Alerts List */}
      <ScrollArea className="h-[600px]">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-green-400/30 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No Security Alerts</h3>
            <p className="text-slate-400 text-sm">All systems are operating normally</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id} className={`bg-black/60 border-l-4 ${
                alert.severity === 'critical' ? 'border-l-red-500' :
                alert.severity === 'high' ? 'border-l-orange-500' :
                alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-slate-500'
              } border-cyan-500/20 hover:border-cyan-500/40 transition-colors`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getEventTypeBadge(alert.event_type)}
                        {getSeverityBadge(alert.severity)}
                        {getStatusBadge(alert.status)}
                        {alert.tenant_name && (
                          <Badge variant="outline" className="text-[10px] border-slate-500/30 text-slate-400">
                            {alert.tenant_name}
                          </Badge>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-white font-medium mb-1">
                        {alert.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <p className="text-slate-400 text-sm mb-3">
                        {alert.affected_user_name || alert.affected_user_email || 'Unknown User'}
                      </p>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <User className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="truncate">{alert.affected_user_email?.split('@')[0] || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-purple-400" />
                          <span className="truncate">{getLocation(alert)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Laptop className="h-3.5 w-3.5 text-green-400" />
                          <span className="truncate">{getDeviceInfo(alert)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="h-3.5 w-3.5 text-orange-400" />
                          <span>
                            {alert.detected_at 
                              ? formatDistanceToNow(new Date(alert.detected_at), { addSuffix: true })
                              : formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })
                            }
                          </span>
                        </div>
                      </div>

                      {/* Event Details */}
                      {alert.event_details && (
                        <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Brain className="h-3.5 w-3.5 text-purple-400" />
                            <span className="text-purple-400 text-xs font-medium">Event Details</span>
                          </div>
                          <p className="text-slate-300 text-xs">
                            {typeof alert.event_details === 'object' 
                              ? (alert.event_details.recommendation || alert.event_details.riskEventType || 'See full details')
                              : String(alert.event_details)
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                        onClick={() => handleTriage(alert.id)}
                        disabled={triaging === alert.id || alert.status === 'auto_resolved'}
                      >
                        {triaging === alert.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <><Brain className="h-3.5 w-3.5 mr-1" />AI Triage</>
                        )}
                      </Button>
                      {alert.status !== 'escalated' && alert.status !== 'auto_resolved' && (
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-cyan-500 to-purple-600"
                          onClick={() => handleCreateTicket(alert)}
                        >
                          <Ticket className="h-3.5 w-3.5 mr-1" />
                          Ticket
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
