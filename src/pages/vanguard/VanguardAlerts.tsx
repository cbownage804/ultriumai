import { useEffect, useState } from 'react';
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

const initialAlerts = [
  { id: '1', title: 'High CPU Usage Detected', device: 'SRV-PROD-01', customer: 'Acme Corp', severity: 'critical', category: 'performance', time: '2 min ago', status: 'active', description: 'CPU usage exceeded 95% for more than 5 minutes.' },
  { id: '2', title: 'Suspicious Login Attempt', device: 'WKS-HR-05', customer: 'TechStart Inc', severity: 'high', category: 'security', time: '15 min ago', status: 'active', description: 'Multiple failed login attempts from unknown IP.' },
  { id: '3', title: 'Disk Space Low (< 10%)', device: 'SRV-FILE-02', customer: 'GlobalTech', severity: 'warning', category: 'storage', time: '1 hour ago', status: 'active', description: 'Only 8% disk space remaining on C: drive.' },
  { id: '4', title: 'Service Stopped: SQL Server', device: 'SRV-DB-01', customer: 'DataFlow LLC', severity: 'critical', category: 'service', time: '30 min ago', status: 'acknowledged', description: 'SQL Server service has stopped unexpectedly.' },
  { id: '5', title: 'Network Latency Spike', device: 'ROUTER-MAIN', customer: 'Enterprise Corp', severity: 'warning', category: 'network', time: '2 hours ago', status: 'resolved', description: 'Network latency exceeded 200ms.' },
  { id: '6', title: 'Antivirus Definitions Outdated', device: 'WKS-DEV-12', customer: 'StartupXYZ', severity: 'low', category: 'security', time: '3 hours ago', status: 'active', description: 'AV definitions are more than 7 days old.' },
  { id: '7', title: 'Backup Failed', device: 'SRV-BACKUP', customer: 'Acme Corp', severity: 'high', category: 'backup', time: '4 hours ago', status: 'active', description: 'Nightly backup job failed with error code 1203.' },
  { id: '8', title: 'Memory Pressure Warning', device: 'SRV-APP-03', customer: 'TechStart Inc', severity: 'warning', category: 'performance', time: '5 hours ago', status: 'acknowledged', description: 'Memory usage at 89%, approaching threshold.' },
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
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [alerts, setAlerts] = useState(initialAlerts);
  const [selectedAlert, setSelectedAlert] = useState<typeof initialAlerts[0] | null>(null);
  const [showCreateTicketDialog, setShowCreateTicketDialog] = useState(false);
  const [ticketNote, setTicketNote] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    document.title = 'Vanguard Pursuit | Ultrium Vanguard';
  }, []);

  const stats = [
    { label: 'Critical', value: alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length, color: 'text-red-400', bg: 'bg-red-500/20' },
    { label: 'High', value: alerts.filter(a => a.severity === 'high' && a.status !== 'resolved').length, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    { label: 'Warning', value: alerts.filter(a => a.severity === 'warning' && a.status !== 'resolved').length, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    { label: 'Resolved Today', value: alerts.filter(a => a.status === 'resolved').length, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  ];

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alert.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alert.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'active' && alert.status === 'active') ||
                       (activeTab === 'acknowledged' && alert.status === 'acknowledged') ||
                       (activeTab === 'resolved' && alert.status === 'resolved');
    return matchesSearch && matchesTab;
  });

  const handleAcknowledge = (alertId: string) => {
    setAlerts(alerts.map(a => 
      a.id === alertId ? { ...a, status: 'acknowledged' } : a
    ));
    toast.success('Alert acknowledged');
  };

  const handleResolve = (alertId: string) => {
    setAlerts(alerts.map(a => 
      a.id === alertId ? { ...a, status: 'resolved' } : a
    ));
    toast.success('Alert resolved');
  };

  const handleAcknowledgeAll = () => {
    setAlerts(alerts.map(a => 
      a.status === 'active' ? { ...a, status: 'acknowledged' } : a
    ));
    toast.success('All active alerts acknowledged');
  };

  const handleMuteAll = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? 'Alert sounds unmuted' : 'All alert sounds muted');
  };

  const handleViewDetails = (alert: typeof initialAlerts[0]) => {
    setSelectedAlert(alert);
  };

  const handleCreateTicket = (alert: typeof initialAlerts[0]) => {
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

  const handleViewDevice = (alert: typeof initialAlerts[0]) => {
    toast.info(`Navigating to device: ${alert.device}`);
    navigate(`${basePath}/devices`);
  };

  const handleSuppress = (alertId: string) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
    toast.success('Alert suppressed');
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
