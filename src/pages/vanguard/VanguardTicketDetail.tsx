import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, Play, Pause, Clock, MessageSquare, FileText, 
  Paperclip, Send, User, Building2, Mail, Monitor, Phone,
  MoreVertical, ChevronDown, ChevronUp, Pencil, Plus, Sparkles,
  ThumbsUp, History, ExternalLink, Link2, Copy, CheckCircle2,
  AlertCircle, XCircle, Timer, Smile, Meh, Frown
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

interface TicketActivity {
  id: string;
  type: 'comment' | 'status_change' | 'assignment' | 'note' | 'system' | 'email';
  user: string;
  userInitials: string;
  content: string;
  timestamp: string;
  isInternal?: boolean;
}

interface TicketData {
  id: string;
  title: string;
  customer: string;
  customerId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignee: string;
  assigneeInitials: string;
  type: 'incident' | 'request' | 'problem' | 'change';
  activityStatus: 'read' | 'unread' | 'pending';
  sentiment: 'positive' | 'neutral' | 'negative' | 'unknown';
  createdAt: string;
  modifiedAt: string;
  description: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  device?: {
    name: string;
    id: string;
  };
  contract?: string;
  activities: TicketActivity[];
  userTickets: { id: string; title: string; status: string }[];
  timeEntries: { duration: string; user: string; date: string; note?: string }[];
}

// Mock ticket data
const mockTicket: TicketData = {
  id: 'TKT-130866',
  title: 'Internet connection issue!!',
  customer: 'Acme Corp',
  customerId: 'cust-001',
  priority: 'high',
  status: 'open',
  assignee: 'Emma Greszes',
  assigneeInitials: 'EG',
  type: 'incident',
  activityStatus: 'read',
  sentiment: 'negative',
  createdAt: '2024-01-12T14:30:00Z',
  modifiedAt: '2024-01-29T10:15:00Z',
  description: 'Customer reports intermittent internet connectivity issues affecting multiple workstations in the main office.',
  contact: {
    name: 'Emma Greszes',
    email: 'emma.g@acmecorp.com',
    phone: '+1 (555) 234-5678',
    company: 'Acme Corp',
  },
  device: {
    name: 'DESKTOP-MAIN-01',
    id: 'dev-001',
  },
  contract: 'Premium Support',
  activities: [
    {
      id: 'act-1',
      type: 'email',
      user: 'Emma Greszes',
      userInitials: 'EG',
      content: 'Hi, we are experiencing internet connection issues across multiple workstations in our main office. The connection drops every 15-20 minutes and requires a router restart to fix temporarily. This has been happening since yesterday morning. Please help urgently!',
      timestamp: 'Feb 8, 2024, 3:46 PM',
    },
    {
      id: 'act-2',
      type: 'note',
      user: 'John Smith',
      userInitials: 'JS',
      content: 'Initial assessment: Likely a DHCP lease issue or faulty network equipment. Scheduled remote session for tomorrow.',
      timestamp: 'Feb 8, 2024, 4:15 PM',
      isInternal: true,
    },
    {
      id: 'act-3',
      type: 'system',
      user: 'System',
      userInitials: 'SY',
      content: 'Ticket assigned to Emma Greszes',
      timestamp: 'Feb 8, 2024, 4:20 PM',
    },
    {
      id: 'act-4',
      type: 'comment',
      user: 'Emma Greszes',
      userInitials: 'EG',
      content: 'Hi Emma, I\'ve reviewed the issue. Could you please check if the router\'s firmware is up to date? Also, can you send me the current DHCP configuration?',
      timestamp: 'Feb 9, 2024, 9:30 AM',
    },
  ],
  userTickets: [
    { id: 'TKT-130842', title: 'Email sync not working', status: 'resolved' },
    { id: 'TKT-130799', title: 'VPN connection issues', status: 'closed' },
  ],
  timeEntries: [
    { duration: '00:45:00', user: 'Emma Greszes', date: 'Feb 9, 2024', note: 'Remote diagnostics' },
    { duration: '00:15:00', user: 'John Smith', date: 'Feb 8, 2024', note: 'Initial triage' },
  ],
};

const statusColors = {
  open: 'bg-emerald-500 text-white',
  in_progress: 'bg-blue-500 text-white',
  resolved: 'bg-slate-500 text-white',
  closed: 'bg-slate-700 text-white',
};

const priorityColors = {
  critical: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-slate-400',
};

const sentimentIcons = {
  positive: { icon: Smile, color: 'text-emerald-400' },
  neutral: { icon: Meh, color: 'text-slate-400' },
  negative: { icon: Frown, color: 'text-red-400' },
  unknown: { icon: Meh, color: 'text-slate-600' },
};

export default function VanguardTicketDetail() {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const basePath = getVanguardBasePath();
  
  const [ticket, setTicket] = useState<TicketData>(mockTicket);
  const [activeTab, setActiveTab] = useState('conversation');
  const [replyType, setReplyType] = useState<'public' | 'internal'>('public');
  const [replyText, setReplyText] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showUserTickets, setShowUserTickets] = useState(true);

  useEffect(() => {
    document.title = `${ticket.id} | Tickets | Ultrium Vanguard`;
  }, [ticket.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const handleSendReply = () => {
    if (!replyText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const newActivity: TicketActivity = {
      id: `act-${Date.now()}`,
      type: replyType === 'internal' ? 'note' : 'comment',
      user: 'Current User',
      userInitials: 'CU',
      content: replyText,
      timestamp: new Date().toLocaleString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
      }),
      isInternal: replyType === 'internal',
    };

    setTicket(prev => ({
      ...prev,
      activities: [...prev.activities, newActivity],
    }));
    setReplyText('');
    toast.success(replyType === 'internal' ? 'Internal note added' : 'Reply sent');
  };

  const handleStatusChange = (newStatus: string) => {
    setTicket(prev => ({ ...prev, status: newStatus as TicketData['status'] }));
    toast.success(`Status changed to ${newStatus.replace('_', ' ')}`);
  };

  const handleAssigneeChange = (assignee: string) => {
    setTicket(prev => ({ ...prev, assignee }));
    toast.success(`Ticket assigned to ${assignee}`);
  };

  const SentimentIcon = sentimentIcons[ticket.sentiment].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(`${basePath}/tickets`)}
                className="text-white/60 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 font-mono font-medium">#{ticket.id}</span>
                  <span className="text-white/40">|</span>
                  <h1 className="text-xl font-semibold text-white">{ticket.title}</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white/40 hover:text-white"
                    onClick={() => {
                      navigator.clipboard.writeText(ticket.id);
                      toast.success('Ticket ID copied');
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-white/50">
                  <span>Created {formatDate(ticket.createdAt)}</span>
                  <span>•</span>
                  <span>Modified {formatDate(ticket.modifiedAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-cyan-500/20 text-white/80">
                <ThumbsUp className="h-4 w-4 mr-2" />
                Give feedback
              </Button>
              <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                <Sparkles className="h-4 w-4 mr-2" />
                Copilot
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-cyan-500/20 text-white/80">
                    Actions
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
                  <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">
                    Merge tickets
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">
                    Create child ticket
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">
                    Export ticket
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-cyan-500/20" />
                  <DropdownMenuItem className="text-red-400 hover:bg-red-500/10">
                    Delete ticket
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 border-t border-cyan-500/10 bg-black/20">
          <div className="flex items-center gap-8">
            {/* Status */}
            <div className="flex flex-col gap-1">
              <Label className="text-white/50 text-xs uppercase tracking-wide">Status</Label>
              <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger className={`w-32 h-8 ${statusColors[ticket.status]} border-0`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-cyan-500/20">
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assign Technician */}
            <div className="flex flex-col gap-1">
              <Label className="text-white/50 text-xs uppercase tracking-wide">Assign technician</Label>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs">
                    {ticket.assigneeInitials}
                  </AvatarFallback>
                </Avatar>
                <Select value={ticket.assignee} onValueChange={handleAssigneeChange}>
                  <SelectTrigger className="w-40 h-8 bg-transparent border-cyan-500/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-cyan-500/20">
                    <SelectItem value="Emma Greszes">Emma Greszes</SelectItem>
                    <SelectItem value="John Smith">John Smith</SelectItem>
                    <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                    <SelectItem value="Mike Chen">Mike Chen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1">
              <Label className="text-white/50 text-xs uppercase tracking-wide">Type</Label>
              <span className="text-white capitalize">{ticket.type}</span>
            </div>

            {/* Activity Status */}
            <div className="flex flex-col gap-1">
              <Label className="text-white/50 text-xs uppercase tracking-wide">Activity status</Label>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  ticket.activityStatus === 'read' ? 'bg-emerald-400' : 
                  ticket.activityStatus === 'unread' ? 'bg-amber-400' : 'bg-slate-400'
                }`} />
                <span className="text-white capitalize">{ticket.activityStatus}</span>
              </div>
            </div>

            {/* Sentiment */}
            <div className="flex flex-col gap-1">
              <Label className="text-white/50 text-xs uppercase tracking-wide">Sentiment</Label>
              <SentimentIcon className={`h-5 w-5 ${sentimentIcons[ticket.sentiment].color}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Left Panel - Conversation */}
        <div className="flex-1 p-6">
          {/* Reply Box */}
          <Card className="bg-slate-900/50 border-cyan-500/20 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs">
                    {ticket.assigneeInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
                  <Button
                    variant={replyType === 'public' ? 'default' : 'ghost'}
                    size="sm"
                    className={replyType === 'public' ? 'bg-cyan-500 text-black' : 'text-white/60'}
                    onClick={() => setReplyType('public')}
                  >
                    Public reply
                  </Button>
                  <Button
                    variant={replyType === 'internal' ? 'default' : 'ghost'}
                    size="sm"
                    className={replyType === 'internal' ? 'bg-amber-500 text-black' : 'text-white/60'}
                    onClick={() => setReplyType('internal')}
                  >
                    Internal note
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Type your message here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="bg-slate-800/50 border-cyan-500/20 text-white min-h-[100px] mb-3"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                    <Paperclip className="h-4 w-4 mr-1" />
                    Attach files
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                        Select quick reply template
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
                      <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">
                        Initial Response
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">
                        Request More Info
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">
                        Issue Resolved
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">
                        Escalation Notice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button 
                  onClick={handleSendReply}
                  className="bg-cyan-500 hover:bg-cyan-600 text-black"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-transparent border-b border-cyan-500/20 rounded-none p-0 h-auto">
                <TabsTrigger 
                  value="conversation" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 rounded-none px-4 py-2"
                >
                  Conversation ({ticket.activities.filter(a => a.type !== 'system').length})
                </TabsTrigger>
                <TabsTrigger 
                  value="activity" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 rounded-none px-4 py-2"
                >
                  Ticket activity ({ticket.activities.length})
                </TabsTrigger>
              </TabsList>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white/60">
                    Sort by: Newest
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
                  <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">Newest</DropdownMenuItem>
                  <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">Oldest</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <TabsContent value="conversation" className="mt-0">
              <ScrollArea className="h-[calc(100vh-500px)]">
                <div className="space-y-4">
                  {ticket.activities
                    .filter(a => a.type !== 'system')
                    .map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border ${
                        activity.isInternal 
                          ? 'bg-amber-500/5 border-amber-500/20' 
                          : 'bg-slate-800/50 border-cyan-500/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`${
                            activity.isInternal ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
                          }`}>
                            {activity.userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-white font-medium">{activity.user}</span>
                            <span className="text-white/40 text-sm">{activity.timestamp}</span>
                            {activity.isInternal && (
                              <Badge className="bg-amber-500/20 text-amber-400 text-xs">Internal</Badge>
                            )}
                          </div>
                          <p className="text-white/80 whitespace-pre-wrap">{activity.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <ScrollArea className="h-[calc(100vh-500px)]">
                <div className="space-y-3">
                  {ticket.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-cyan-500/10"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'system' ? 'bg-slate-500/20 text-slate-400' :
                        activity.type === 'note' ? 'bg-amber-500/20 text-amber-400' :
                        activity.type === 'email' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {activity.type === 'system' && <History className="h-4 w-4" />}
                        {activity.type === 'note' && <FileText className="h-4 w-4" />}
                        {activity.type === 'email' && <Mail className="h-4 w-4" />}
                        {activity.type === 'comment' && <MessageSquare className="h-4 w-4" />}
                        {activity.type === 'assignment' && <User className="h-4 w-4" />}
                        {activity.type === 'status_change' && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium text-sm">{activity.user}</span>
                          <span className="text-white/40 text-xs">{activity.timestamp}</span>
                        </div>
                        <p className="text-white/60 text-sm mt-1">{activity.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l border-cyan-500/20 bg-slate-900/30 p-4">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-6">
              {/* Time Tracking */}
              <Card className="bg-slate-800/50 border-cyan-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Timer className="h-4 w-4 text-cyan-400" />
                    Time tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-mono text-3xl text-white tracking-wider">
                      {formatTimer(timerSeconds)}
                    </div>
                    <Button
                      size="icon"
                      className={isTimerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-cyan-500 hover:bg-cyan-600'}
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                    >
                      {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-white/60 hover:text-white">
                      <Plus className="h-3 w-3 mr-2" />
                      Manual Time Entry
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-white/60 hover:text-white">
                      <History className="h-3 w-3 mr-2" />
                      View all time entries
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="bg-slate-800/50 border-cyan-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-cyan-400" />
                    Contact info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/50 text-xs">User</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 text-sm">{ticket.contact.name}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-white/40 hover:text-white">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/50 text-xs">Customer</Label>
                    <span className="text-cyan-400 text-sm">{ticket.contact.company}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/50 text-xs">Contract</Label>
                    <Select defaultValue={ticket.contract}>
                      <SelectTrigger className="w-32 h-7 bg-transparent border-cyan-500/20 text-white text-sm">
                        <SelectValue placeholder="Select Contract" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-cyan-500/20">
                        <SelectItem value="Premium Support">Premium Support</SelectItem>
                        <SelectItem value="Basic Support">Basic Support</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/50 text-xs">Email</Label>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-white/40" />
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-white/40 hover:text-white">
                        <Phone className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/50 text-xs">Device</Label>
                    {ticket.device ? (
                      <span className="text-white/70 text-sm">{ticket.device.name}</span>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-6 text-cyan-400 text-xs">
                        <Monitor className="h-3 w-3 mr-1" />
                        Assign agent
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Connect */}
              <Button variant="outline" className="w-full border-cyan-500/20 text-cyan-400">
                <Link2 className="h-4 w-4 mr-2" />
                Connect
              </Button>

              {/* User's Tickets */}
              <Collapsible open={showUserTickets} onOpenChange={setShowUserTickets}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-white/80 hover:bg-cyan-500/10">
                    <span>{ticket.contact.name}'s tickets ({ticket.userTickets.length + 1})</span>
                    {showUserTickets ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Current</Badge>
                      <span className="text-white text-sm truncate">{ticket.title}</span>
                    </div>
                  </div>
                  {ticket.userTickets.map((t) => (
                    <div 
                      key={t.id} 
                      className="p-2 rounded bg-slate-800/30 border border-cyan-500/10 hover:bg-slate-800/50 cursor-pointer"
                      onClick={() => toast.info(`Opening ticket ${t.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 text-xs font-mono">{t.id}</span>
                        <span className="text-white/60 text-sm truncate">{t.title}</span>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
