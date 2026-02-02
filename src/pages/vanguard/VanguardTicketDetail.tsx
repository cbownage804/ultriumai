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
  AlertCircle, XCircle, Timer, Smile, Meh, Frown, Filter, Key, Server
} from 'lucide-react';
import { Map } from 'lucide-react';
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
  oldValue?: string;
  newValue?: string;
}

interface ResolutionEntry {
  id: string;
  user: string;
  userInitials: string;
  timestamp: string;
  content: string;
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
  resolutions: ResolutionEntry[];
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
      type: 'note',
      user: 'Emma Greszes',
      userInitials: 'EG',
      content: 'Internal note added',
      timestamp: 'Feb 25, 2024, 3:18 PM',
      isInternal: true,
    },
    {
      id: 'act-2',
      type: 'system',
      user: 'System',
      userInitials: 'SY',
      content: 'An automatic email was sent (bla)',
      timestamp: 'Feb 25, 2024, 2:32 PM',
    },
    {
      id: 'act-3',
      type: 'status_change',
      user: 'Emma Greszes',
      userInitials: 'EG',
      content: 'Ticket status changed',
      timestamp: 'Feb 25, 2024, 2:32 PM',
      oldValue: 'Test2',
      newValue: 'Open',
    },
    {
      id: 'act-4',
      type: 'system',
      user: 'System',
      userInitials: 'SY',
      content: 'An automatic email was sent (bla)',
      timestamp: 'Feb 25, 2024, 2:32 PM',
    },
    {
      id: 'act-5',
      type: 'status_change',
      user: 'Emma Greszes',
      userInitials: 'EG',
      content: 'Ticket status changed',
      timestamp: 'Feb 25, 2024, 2:31 PM',
      oldValue: 'Open',
      newValue: 'In Progress',
    },
    {
      id: 'act-6',
      type: 'email',
      user: 'Emma Greszes',
      userInitials: 'EG',
      content: 'Hi, we are experiencing internet connection issues across multiple workstations. The connection drops every 15-20 minutes.',
      timestamp: 'Feb 8, 2024, 3:46 PM',
    },
    {
      id: 'act-7',
      type: 'assignment',
      user: 'System',
      userInitials: 'SY',
      content: 'Ticket assigned to Emma Greszes',
      timestamp: 'Feb 8, 2024, 4:20 PM',
    },
    {
      id: 'act-8',
      type: 'comment',
      user: 'John Smith',
      userInitials: 'JS',
      content: 'Hi Emma, I\'ve reviewed the issue. Could you please check if the router\'s firmware is up to date?',
      timestamp: 'Feb 9, 2024, 9:30 AM',
    },
  ],
  resolutions: [
    {
      id: 'res-1',
      user: 'Emma Greszes',
      userInitials: 'EG',
      timestamp: 'Mar 14, 2024, 12:23 PM',
      content: `Here how to free up space:
Clean Up: Delete any emails you no longer need, especially those with large attachments.
Archive: Consider archiving old emails that you want to keep but don't need regular access to.
Empty Trash: Make sure to empty your trash folder, as deleted emails often still occupy space until the trash is emptied.
Manage Subscriptions: Unsubscribe from newsletters or promotional emails that you no longer wish to receive to prevent your mailbox from filling up quickly in the future.
If you need further assistance with any of these steps or have other concerns, feel free to reach out.`,
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
                Vanguard Cortex
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
        <div className="px-6 py-4 border-t border-cyan-500/10 bg-white/5">
          <div className="flex items-center gap-12">
            {/* Status */}
            <div className="flex flex-col gap-1">
              <Label className="text-white/50 text-xs uppercase tracking-wide">Status</Label>
              <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger className={`w-28 h-8 ${
                  ticket.status === 'open' ? 'bg-amber-500 text-black border-0' :
                  ticket.status === 'in_progress' ? 'bg-blue-500 text-white border-0' :
                  ticket.status === 'resolved' ? 'bg-emerald-500 text-white border-0' :
                  'bg-slate-600 text-white border-0'
                }`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-cyan-500/20">
                  <SelectItem value="open">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assign Technician */}
            <div className="flex flex-col gap-1">
              <Label className="text-white/50 text-xs uppercase tracking-wide">Assign technician</Label>
              <Button variant="ghost" className="h-8 px-2 text-white/80 hover:bg-cyan-500/10">
                <User className="h-4 w-4 mr-2 text-white/50" />
                {ticket.assignee === 'Unassigned' ? 'Assign' : ticket.assignee}
              </Button>
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1">
              <Label className="text-white/50 text-xs uppercase tracking-wide">Type</Label>
              <span className="text-white capitalize">{ticket.type === 'incident' ? 'Problem' : ticket.type}</span>
            </div>

            {/* Activity Status */}
            <div className="flex flex-col gap-1">
              <Label className="text-white/50 text-xs uppercase tracking-wide">Activity status</Label>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-white">Awaiting customer response</span>
              </div>
            </div>

            {/* SLA */}
            <div className="flex flex-col gap-1">
              <Label className="text-white/50 text-xs uppercase tracking-wide">SLA paused...</Label>
            </div>

            {/* Sentiment */}
            <div className="flex flex-col gap-1">
              <Label className="text-white/50 text-xs uppercase tracking-wide">Sentiment</Label>
              <div className="flex items-center gap-1.5">
                <SentimentIcon className={`h-5 w-5 ${sentimentIcons[ticket.sentiment].color}`} />
                <span className={`capitalize ${sentimentIcons[ticket.sentiment].color}`}>
                  {ticket.sentiment}
                </span>
              </div>
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
                <TabsTrigger 
                  value="resolution" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 rounded-none px-4 py-2"
                >
                  Resolution ({ticket.resolutions.length})
                </TabsTrigger>
              </TabsList>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white/60">
                    <Filter className="h-4 w-4 mr-1" />
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
                <div className="divide-y divide-cyan-500/10">
                  {ticket.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 py-4"
                    >
                      {/* Avatar or System Icon */}
                      {activity.user === 'System' ? (
                        <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
                          <History className="h-5 w-5 text-slate-400" />
                        </div>
                      ) : (
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-slate-600 text-white text-sm">
                            {activity.userInitials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        {/* User and Timestamp Row */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{activity.user}</span>
                          <span className="text-white/40 text-sm">{activity.timestamp}</span>
                        </div>
                        
                        {/* Activity Content */}
                        <div className="text-white/70">
                          {activity.type === 'note' && (
                            <span className="text-cyan-400">Internal note</span>
                          )}
                          {activity.type === 'note' && ' added'}
                          
                          {activity.type === 'system' && (
                            <span>
                              <span className="text-cyan-400">An automatic email</span> was sent (bla)
                            </span>
                          )}
                          
                          {activity.type === 'status_change' && (
                            <div>
                              <span>Ticket status changed</span>
                              {activity.oldValue && activity.newValue && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                                    {activity.oldValue}
                                  </Badge>
                                  <span className="text-white/40">→</span>
                                  <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                                    {activity.newValue}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {activity.type === 'assignment' && (
                            <span>Ticket assigned to <span className="text-white">{activity.content.replace('Ticket assigned to ', '')}</span></span>
                          )}
                          
                          {activity.type === 'email' && (
                            <span className="text-white/60">{activity.content}</span>
                          )}
                          
                          {activity.type === 'comment' && (
                            <span className="text-white/60">{activity.content}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="resolution" className="mt-0">
              <ScrollArea className="h-[calc(100vh-500px)]">
                <div className="space-y-4">
                  {ticket.resolutions.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-white/20 mb-3" />
                      <p className="text-white/40">No resolution notes yet</p>
                      <Button variant="ghost" className="text-cyan-400 mt-2">
                        <Plus className="h-4 w-4 mr-1" />
                        Add resolution
                      </Button>
                    </div>
                  ) : (
                    ticket.resolutions.map((resolution) => (
                      <div key={resolution.id} className="py-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-slate-600 text-white text-sm">
                              {resolution.userInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-white font-medium">{resolution.user}</span>
                              <span className="text-white/40 text-sm">{resolution.timestamp}</span>
                              <ChevronDown className="h-4 w-4 text-white/40" />
                              <MoreVertical className="h-4 w-4 text-white/40 ml-auto cursor-pointer hover:text-white" />
                            </div>
                            <div className="text-white/80 whitespace-pre-wrap leading-relaxed">
                              {resolution.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l border-cyan-500/20 bg-slate-900/30">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4 space-y-1">
              {/* Time Tracking - Collapsible */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-3 py-4 text-white hover:bg-cyan-500/10 h-auto">
                    <span className="font-medium">Time tracking</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-mono text-2xl text-white tracking-wider">
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
                  <div className="space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-white/60 hover:text-white text-sm">
                      <Plus className="h-3 w-3 mr-2" />
                      Manual Time Entry
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-white/60 hover:text-white text-sm">
                      <History className="h-3 w-3 mr-2" />
                      View all time entries
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator className="bg-cyan-500/10" />

              {/* Contact Info - Collapsible */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-3 py-4 text-white hover:bg-cyan-500/10 h-auto">
                    <span className="font-medium">Contact info</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-4 space-y-3">
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
                    <span className="text-white/70 text-sm">{ticket.contract || 'None'}</span>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator className="bg-cyan-500/10" />

              {/* Ticket Properties - Collapsible */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-3 py-4 text-white hover:bg-cyan-500/10 h-auto">
                    <span className="font-medium">Ticket properties</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/50 text-xs">Priority</Label>
                    <span className={`text-sm capitalize ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/50 text-xs">Type</Label>
                    <span className="text-white/70 text-sm capitalize">{ticket.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/50 text-xs">Device</Label>
                    {ticket.device ? (
                      <span className="text-cyan-400 text-sm">{ticket.device.name}</span>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-6 text-cyan-400 text-xs p-0">
                        <Monitor className="h-3 w-3 mr-1" />
                        Assign device
                      </Button>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator className="bg-cyan-500/10" />

              {/* Calendar Events - Collapsible */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-3 py-4 text-white hover:bg-cyan-500/10 h-auto">
                    <span className="font-medium">Calendar Events</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-4">
                  <div className="text-center py-4">
                    <p className="text-white/40 text-sm">No scheduled events</p>
                    <Button variant="ghost" size="sm" className="text-cyan-400 mt-2">
                      <Plus className="h-3 w-3 mr-1" />
                      Add event
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator className="bg-cyan-500/10" />

              {/* Vanguard Atlas Quick Access - Collapsible */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-3 py-4 text-white hover:bg-cyan-500/10 h-auto">
                    <div className="flex items-center gap-2">
                      <Map className="h-4 w-4 text-cyan-400" />
                      <span className="font-medium">Vanguard Atlas</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-4 space-y-2">
                  <p className="text-white/40 text-xs mb-2">Quick access to {ticket.customer} documentation</p>
                  
                  {/* Passwords Quick Access */}
                  <div className="p-2 rounded bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Key className="h-3 w-3 text-amber-400" />
                      <span className="text-white text-xs font-medium">Domain Admin</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="text-cyan-400 text-xs">admin@domain.local</code>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-white/40 hover:text-white">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Server className="h-3 w-3 text-blue-400" />
                      <span className="text-white text-xs font-medium">Main Server</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="text-cyan-400 text-xs">192.168.1.10</code>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-white/40 hover:text-white">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-center text-cyan-400 text-xs mt-1"
                    onClick={() => navigate(`${basePath}/atlas?org=${encodeURIComponent(ticket.customer)}`)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open Vanguard Atlas
                  </Button>
                </CollapsibleContent>
              </Collapsible>

              <Separator className="bg-cyan-500/10" />

              {/* User's Tickets - Collapsible */}
              <Collapsible open={showUserTickets} onOpenChange={setShowUserTickets}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-3 py-4 text-white hover:bg-cyan-500/10 h-auto">
                    <span className="font-medium">{ticket.contact.name}'s tickets ({ticket.userTickets.length + 1})</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-4 space-y-2">
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
                      onClick={() => navigate(`${basePath}/tickets/${t.id}`)}
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
