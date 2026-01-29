import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Phone, Video, Monitor, MessageSquare, Calendar as CalendarIcon,
  User, Clock, CheckCircle2, AlertCircle, Loader2, X, ArrowRight,
  Headphones, Users, Zap, Brain, Star, Play, Pause, Mic, MicOff,
  Camera, CameraOff, ScreenShare, PhoneOff, Volume2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EscalationTicket {
  id: string;
  customerName: string;
  customerEmail: string;
  company: string;
  type: 'callback' | 'video' | 'screen_share' | 'human_agent';
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledTime?: Date;
  assignedAgent?: string;
  conversationSummary: string;
  createdAt: Date;
  aiConfidence: number;
  sentiment: string;
}

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  status: 'available' | 'busy' | 'away';
  activeEscalations: number;
  skills: string[];
}

const typeIcons = {
  callback: Phone,
  video: Video,
  screen_share: Monitor,
  human_agent: MessageSquare
};

const statusColors = {
  pending: 'bg-amber-500',
  scheduled: 'bg-blue-500',
  in_progress: 'bg-green-500',
  completed: 'bg-slate-500',
  cancelled: 'bg-red-500'
};

const priorityColors = {
  low: 'text-green-400 border-green-500/40',
  medium: 'text-amber-400 border-amber-500/40',
  high: 'text-orange-400 border-orange-500/40',
  urgent: 'text-red-400 border-red-500/40'
};

export function FullEscalationSuite() {
  const [escalations, setEscalations] = useState<EscalationTicket[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationTicket | null>(null);
  const [activeCall, setActiveCall] = useState<EscalationTicket | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load escalations
      const { data: escData } = await supabase
        .from('vanguard_escalation_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setEscalations((escData || []).map((e: any) => ({
        id: e.id,
        customerName: e.customer_name,
        customerEmail: e.customer_email,
        company: e.company || '',
        type: e.type as EscalationTicket['type'],
        status: e.status as EscalationTicket['status'],
        priority: e.priority as EscalationTicket['priority'],
        scheduledTime: e.scheduled_time ? new Date(e.scheduled_time) : undefined,
        assignedAgent: e.assigned_agent,
        conversationSummary: e.conversation_summary,
        createdAt: new Date(e.created_at),
        aiConfidence: e.ai_confidence || 0,
        sentiment: e.sentiment || 'neutral'
      })));

      // Load agents
      const { data: agentData } = await supabase
        .from('vanguard_escalation_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      setAgents((agentData || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        avatar: a.avatar,
        status: a.status as Agent['status'],
        activeEscalations: a.active_escalations || 0,
        skills: a.skills || []
      })));

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignAgent = async (escalationId: string, agentName: string) => {
    try {
      await supabase
        .from('vanguard_escalation_tickets')
        .update({ assigned_agent: agentName, status: 'scheduled' })
        .eq('id', escalationId);

      setEscalations(escalations.map(e => 
        e.id === escalationId ? { ...e, assignedAgent: agentName, status: 'scheduled' as const } : e
      ));
      toast.success(`Assigned to ${agentName}`);
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast.error('Failed to assign agent');
    }
  };

  const startCall = async (escalation: EscalationTicket) => {
    try {
      await supabase
        .from('vanguard_escalation_tickets')
        .update({ status: 'in_progress' })
        .eq('id', escalation.id);

      setActiveCall(escalation);
      setIsCallActive(true);
      setEscalations(escalations.map(e => 
        e.id === escalation.id ? { ...e, status: 'in_progress' as const } : e
      ));
      toast.success('Call started');
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call');
    }
  };

  const endCall = async () => {
    if (activeCall) {
      try {
        await supabase
          .from('vanguard_escalation_tickets')
          .update({ status: 'completed' })
          .eq('id', activeCall.id);

        setEscalations(escalations.map(e => 
          e.id === activeCall.id ? { ...e, status: 'completed' as const } : e
        ));
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
    setActiveCall(null);
    setIsCallActive(false);
    setIsScreenSharing(false);
    toast.info('Call ended');
  };

  const scheduleCallback = async (escalationId: string) => {
    if (!scheduleDate) return;
    
    const [hours, minutes] = scheduleTime.split(':');
    const scheduledTime = new Date(scheduleDate);
    scheduledTime.setHours(parseInt(hours), parseInt(minutes));

    try {
      await supabase
        .from('vanguard_escalation_tickets')
        .update({ scheduled_time: scheduledTime.toISOString(), status: 'scheduled' })
        .eq('id', escalationId);

      setEscalations(escalations.map(e => 
        e.id === escalationId ? { ...e, scheduledTime, status: 'scheduled' as const } : e
      ));
      toast.success(`Callback scheduled for ${format(scheduledTime, 'PPp')}`);
    } catch (error) {
      console.error('Error scheduling callback:', error);
      toast.error('Failed to schedule callback');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Call Panel */}
      <AnimatePresence>
        {isCallActive && activeCall && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-teal-500/20 border-green-500/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-green-400">
                        <AvatarFallback className="bg-green-500/30 text-green-400">
                          {activeCall.customerName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{activeCall.customerName}</h3>
                      <p className="text-sm text-slate-400">{activeCall.company} • {activeCall.type}</p>
                    </div>
                    <Badge variant="outline" className="border-green-500/40 text-green-400">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                      Active Call
                    </Badge>
                    <span className="text-slate-400 text-sm">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {Math.round((Date.now() - activeCall.createdAt.getTime()) / 60000)} min
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={isMuted ? 'destructive' : 'outline'}
                      className={isMuted ? '' : 'border-slate-600'}
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    {activeCall.type === 'video' && (
                      <Button
                        size="sm"
                        variant={!isCameraOn ? 'destructive' : 'outline'}
                        className={!isCameraOn ? '' : 'border-slate-600'}
                        onClick={() => setIsCameraOn(!isCameraOn)}
                      >
                        {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={isScreenSharing ? 'default' : 'outline'}
                      className={isScreenSharing ? 'bg-blue-500' : 'border-slate-600'}
                      onClick={() => setIsScreenSharing(!isScreenSharing)}
                    >
                      <ScreenShare className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={endCall}
                    >
                      <PhoneOff className="h-4 w-4 mr-2" />
                      End Call
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Escalation Queue */}
        <div className="lg:col-span-2">
          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader className="border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Headphones className="h-5 w-5" />
                    Escalation Queue
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Customer requests requiring human intervention
                  </CardDescription>
                </div>
                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {escalations.filter(e => e.status === 'pending').length} pending
                </Badge>
              </div>
            </CardHeader>
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-3">
                {escalations.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Headphones className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No escalations in queue</p>
                  </div>
                ) : (
                  escalations.map((escalation) => {
                    const TypeIcon = typeIcons[escalation.type];
                    return (
                      <motion.div
                        key={escalation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-lg bg-slate-900/50 border transition-colors cursor-pointer ${
                          selectedEscalation?.id === escalation.id 
                            ? 'border-cyan-400' 
                            : 'border-slate-700 hover:border-purple-500/50'
                        }`}
                        onClick={() => setSelectedEscalation(escalation)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                              <TypeIcon className="h-4 w-4 text-purple-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-white">{escalation.customerName}</h4>
                                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                                  {escalation.company}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500 mt-0.5">{escalation.conversationSummary}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${statusColors[escalation.status]}`} />
                              <span className="text-xs text-slate-400 capitalize">{escalation.status.replace('_', ' ')}</span>
                            </div>
                            <Badge variant="outline" className={`mt-1 text-xs ${priorityColors[escalation.priority]}`}>
                              {escalation.priority}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Brain className="h-3 w-3" />
                              {escalation.aiConfidence}% AI confidence
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.round((Date.now() - escalation.createdAt.getTime()) / 60000)} min ago
                            </span>
                            {escalation.scheduledTime && (
                              <span className="flex items-center gap-1 text-blue-400">
                                <CalendarIcon className="h-3 w-3" />
                                {format(escalation.scheduledTime, 'h:mm a')}
                              </span>
                            )}
                          </div>
                          
                          {escalation.status === 'pending' && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                              onClick={(e) => { e.stopPropagation(); startCall(escalation); }}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}
                          {escalation.assignedAgent && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs bg-cyan-500/30 text-cyan-400">
                                  {escalation.assignedAgent.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-slate-400">{escalation.assignedAgent}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Available Agents */}
          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Available Agents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {agents.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No agents configured</p>
              ) : (
                agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-purple-500/30 text-purple-400">
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${
                          agent.status === 'available' ? 'bg-green-400' :
                          agent.status === 'busy' ? 'bg-amber-400' : 'bg-slate-500'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm text-white">{agent.name}</p>
                        <p className="text-xs text-slate-500">{agent.activeEscalations} active</p>
                      </div>
                    </div>
                    {selectedEscalation && selectedEscalation.status === 'pending' && agent.status === 'available' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-cyan-400 text-xs"
                        onClick={() => handleAssignAgent(selectedEscalation.id, agent.name)}
                      >
                        Assign
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Schedule Callback */}
          {selectedEscalation && selectedEscalation.status === 'pending' && (
            <Card className="bg-black/80 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 text-sm flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Schedule Callback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start border-slate-600 text-left">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {scheduleDate ? format(scheduleDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduleDate}
                      onSelect={setScheduleDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Select value={scheduleTime} onValueChange={setScheduleTime}>
                  <SelectTrigger className="border-slate-600">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  onClick={() => scheduleCallback(selectedEscalation.id)}
                  disabled={!scheduleDate}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule Callback
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}