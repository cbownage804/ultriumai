import { useState } from 'react';
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

const DEMO_ESCALATIONS: EscalationTicket[] = [
  {
    id: 'ESC-001',
    customerName: 'Sarah Chen',
    customerEmail: 'sarah@acmecorp.com',
    company: 'Acme Corp',
    type: 'video',
    status: 'pending',
    priority: 'high',
    conversationSummary: 'VPN issues not resolved by AI - needs visual walkthrough',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    aiConfidence: 45,
    sentiment: 'frustrated'
  },
  {
    id: 'ESC-002',
    customerName: 'Mike Johnson',
    customerEmail: 'mike@techstart.io',
    company: 'TechStart',
    type: 'callback',
    status: 'scheduled',
    priority: 'medium',
    scheduledTime: new Date(Date.now() + 30 * 60 * 1000),
    assignedAgent: 'Alex Turner',
    conversationSummary: 'Billing clarification requested - prefers phone call',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    aiConfidence: 72,
    sentiment: 'neutral'
  },
  {
    id: 'ESC-003',
    customerName: 'Emma Wilson',
    customerEmail: 'emma@retailmax.com',
    company: 'RetailMax',
    type: 'screen_share',
    status: 'in_progress',
    priority: 'urgent',
    assignedAgent: 'Jordan Lee',
    conversationSummary: 'Complex software configuration - AI couldn\'t guide remotely',
    createdAt: new Date(Date.now() - 8 * 60 * 1000),
    aiConfidence: 38,
    sentiment: 'urgent'
  }
];

const DEMO_AGENTS: Agent[] = [
  { id: '1', name: 'Alex Turner', status: 'available', activeEscalations: 1, skills: ['Network', 'VPN', 'Security'] },
  { id: '2', name: 'Jordan Lee', status: 'busy', activeEscalations: 2, skills: ['Software', 'Configuration', 'Billing'] },
  { id: '3', name: 'Sam Rivera', status: 'available', activeEscalations: 0, skills: ['Hardware', 'Printers', 'Email'] },
  { id: '4', name: 'Casey Morgan', status: 'away', activeEscalations: 0, skills: ['All'] }
];

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
  const [escalations, setEscalations] = useState<EscalationTicket[]>(DEMO_ESCALATIONS);
  const [agents, setAgents] = useState<Agent[]>(DEMO_AGENTS);
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationTicket | null>(null);
  const [activeCall, setActiveCall] = useState<EscalationTicket | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState('09:00');

  const handleAssignAgent = (escalationId: string, agentName: string) => {
    setEscalations(escalations.map(e => 
      e.id === escalationId ? { ...e, assignedAgent: agentName, status: 'scheduled' as const } : e
    ));
    toast.success(`Assigned to ${agentName}`);
  };

  const startCall = (escalation: EscalationTicket) => {
    setActiveCall(escalation);
    setIsCallActive(true);
    setEscalations(escalations.map(e => 
      e.id === escalation.id ? { ...e, status: 'in_progress' as const } : e
    ));
    toast.success('Call started');
  };

  const endCall = () => {
    if (activeCall) {
      setEscalations(escalations.map(e => 
        e.id === activeCall.id ? { ...e, status: 'completed' as const } : e
      ));
    }
    setActiveCall(null);
    setIsCallActive(false);
    setIsScreenSharing(false);
    toast.info('Call ended');
  };

  const scheduleCallback = (escalationId: string) => {
    if (!scheduleDate) return;
    
    const [hours, minutes] = scheduleTime.split(':');
    const scheduledTime = new Date(scheduleDate);
    scheduledTime.setHours(parseInt(hours), parseInt(minutes));

    setEscalations(escalations.map(e => 
      e.id === escalationId ? { ...e, scheduledTime, status: 'scheduled' as const } : e
    ));
    toast.success(`Callback scheduled for ${format(scheduledTime, 'PPp')}`);
  };

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
                {escalations.map((escalation) => {
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
                })}
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
              {agents.map((agent) => (
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
              ))}
            </CardContent>
          </Card>

          {/* Schedule Callback */}
          {selectedEscalation && selectedEscalation.type === 'callback' && (
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
                    <Button variant="outline" className="w-full justify-start border-slate-700">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {scheduleDate ? format(scheduleDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-black border-cyan-500/30">
                    <Calendar
                      mode="single"
                      selected={scheduleDate}
                      onSelect={setScheduleDate}
                      className="bg-black"
                    />
                  </PopoverContent>
                </Popover>

                <Select value={scheduleTime} onValueChange={setScheduleTime}>
                  <SelectTrigger className="border-slate-700">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-cyan-500/30">
                    {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                  onClick={() => scheduleCallback(selectedEscalation.id)}
                  disabled={!scheduleDate}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule Callback
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-amber-400 text-sm">Today's Escalations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Total</span>
                <span className="font-bold text-white">{escalations.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Resolved</span>
                <span className="font-bold text-green-400">{escalations.filter(e => e.status === 'completed').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Avg Handle Time</span>
                <span className="font-bold text-purple-400">8.5 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">CSAT Score</span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  4.8 <Star className="h-3 w-3" />
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
