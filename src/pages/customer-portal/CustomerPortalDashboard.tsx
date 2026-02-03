/**
 * Customer Portal Dashboard
 * Main dashboard for end customers to view tickets and access SafeSuite tools
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Ticket, Plus, Shield, Key, Globe, Search as SearchIcon, 
  LogOut, User, Clock, AlertCircle, CheckCircle2, Loader2,
  ExternalLink, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePortalSession } from '@/hooks/usePortalSession';

interface PortalTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export default function CustomerPortalDashboard() {
  const navigate = useNavigate();
  const { session, isLoading: sessionLoading, logout } = usePortalSession();
  const [tickets, setTickets] = useState<PortalTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets');

  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate('/customer-portal/login');
    }
  }, [session, sessionLoading, navigate]);

  useEffect(() => {
    if (session) {
      fetchTickets();
    }
  }, [session]);

  const fetchTickets = async () => {
    if (!session) return;
    
    setIsLoadingTickets(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-ticket-api', {
        body: {},
        headers: {
          'x-portal-session': session.sessionToken
        }
      });

      if (error) throw error;
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/customer-portal/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-amber-400';
      case 'low': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!session) return null;

  const safeSuite = session.safeSuiteAccess;
  const hasAnySafeSuite = safeSuite.safepass_enabled || safeSuite.safescan_enabled || 
                          safeSuite.safeweb_enabled || safeSuite.safetrack_enabled;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Customer Portal</h1>
                <p className="text-xs text-white/50">Welcome back, {session.user.fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                <User className="h-3 w-3 mr-1" />
                {session.user.role}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-black/40 border border-white/10">
            <TabsTrigger value="tickets" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Ticket className="h-4 w-4 mr-2" />
              Support Tickets
            </TabsTrigger>
            {hasAnySafeSuite && (
              <TabsTrigger value="tools" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Shield className="h-4 w-4 mr-2" />
                Security Tools
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Your Tickets</h2>
                <p className="text-white/60">View and manage your support requests</p>
              </div>
              <Button
                onClick={() => navigate('/customer-portal/tickets/new')}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </div>

            {isLoadingTickets ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            ) : tickets.length === 0 ? (
              <Card className="bg-black/40 border-white/10">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Ticket className="h-16 w-16 text-white/20 mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">No tickets yet</h3>
                  <p className="text-white/60 mb-6">Create your first support ticket to get started</p>
                  <Button
                    onClick={() => navigate('/customer-portal/tickets/new')}
                    className="bg-gradient-to-r from-cyan-500 to-purple-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="bg-black/40 border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/customer-portal/tickets/${ticket.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                                {ticket.subject}
                              </h3>
                              <Badge className={getStatusColor(ticket.status)}>
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-white/50">
                              <span className="flex items-center gap-1">
                                <AlertCircle className={`h-3 w-3 ${getPriorityColor(ticket.priority)}`} />
                                {ticket.priority}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </span>
                              {ticket.category && (
                                <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                                  {ticket.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-cyan-400 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Security Tools Tab */}
          {hasAnySafeSuite && (
            <TabsContent value="tools" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Security Tools</h2>
                <p className="text-white/60">Access your SafeSuite security applications</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {safeSuite.safepass_enabled && (
                  <ToolCard
                    title="SafePass"
                    description="Secure password manager"
                    icon={Key}
                    color="from-cyan-500 to-blue-600"
                    onClick={() => window.open('/safepass', '_blank')}
                  />
                )}
                {safeSuite.safescan_enabled && (
                  <ToolCard
                    title="SafeScan"
                    description="Security vulnerability scanner"
                    icon={SearchIcon}
                    color="from-purple-500 to-pink-600"
                    onClick={() => window.open('/safescan', '_blank')}
                  />
                )}
                {safeSuite.safeweb_enabled && (
                  <ToolCard
                    title="SafeWeb"
                    description="Website security monitor"
                    icon={Globe}
                    color="from-green-500 to-teal-600"
                    onClick={() => window.open('/safeweb', '_blank')}
                  />
                )}
                {safeSuite.safetrack_enabled && (
                  <ToolCard
                    title="SafeTrack"
                    description="Asset warranty tracker"
                    icon={CheckCircle2}
                    color="from-amber-500 to-orange-600"
                    onClick={() => window.open('/safetrack', '_blank')}
                  />
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
}

function ToolCard({ title, description, icon: Icon, color, onClick }: ToolCardProps) {
  return (
    <Card 
      className="bg-black/40 border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-white/60">{description}</p>
        <div className="flex items-center gap-1 mt-3 text-cyan-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Open</span>
          <ExternalLink className="h-3 w-3" />
        </div>
      </CardContent>
    </Card>
  );
}
