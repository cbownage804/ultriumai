import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Ticket, Plus, Search, Filter, Clock, AlertCircle, CheckCircle2, 
  XCircle, User, Building2, MoreVertical, MessageSquare, Eye,
  Paperclip, History, Send, Phone, Mail, MapPin, Monitor, 
  HardDrive, Wifi, Calendar, Tag, AlertTriangle, ExternalLink,
  FileText, Image, Copy, ArrowUpRight, Timer, Target, Zap,
  Shield, RefreshCw, ChevronRight
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
  type: 'comment' | 'status_change' | 'assignment' | 'note' | 'system';
  user: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
}

interface TicketAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'log';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface TicketContact {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
}

interface TicketDevice {
  hostname: string;
  ip: string;
  os: string;
  lastSeen: string;
  agentVersion: string;
  status: 'online' | 'offline' | 'warning';
}

interface Ticket {
  id: string;
  title: string;
  customer: string;
  customerId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignee: string;
  assigneeAvatar?: string;
  created: string;
  createdAt: string;
  updatedAt: string;
  sla: string;
  slaDeadline: string;
  slaProgress: number;
  description: string;
  category: string;
  subcategory: string;
  source: 'email' | 'portal' | 'phone' | 'chat' | 'api';
  impact: 'single_user' | 'department' | 'organization';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  contact: TicketContact;
  device?: TicketDevice;
  relatedTickets: string[];
  activities: TicketActivity[];
  attachments: TicketAttachment[];
  resolution?: string;
  firstResponseTime?: string;
  timeSpent: string;
  estimatedTime: string;
  linkedAlerts: string[];
}

const mockTickets: Ticket[] = [
  { 
    id: 'TKT-001', 
    title: 'Production server not responding - Critical outage', 
    customer: 'Acme Corp', 
    customerId: 'cust-001',
    priority: 'critical', 
    status: 'open', 
    assignee: 'John Smith',
    assigneeAvatar: '',
    created: '2h ago',
    createdAt: '2024-01-29T14:30:00Z',
    updatedAt: '2024-01-29T16:15:00Z',
    sla: '1h remaining', 
    slaDeadline: '2024-01-29T17:30:00Z',
    slaProgress: 75,
    description: 'Production server PROD-WEB-01 is unresponsive since 2:30 PM. All web applications hosted on this server are down. Users are unable to access critical business applications including the CRM and inventory management system. Initial diagnostics show the server is not responding to ping requests.',
    category: 'Infrastructure',
    subcategory: 'Server - Windows',
    source: 'phone',
    impact: 'organization',
    urgency: 'critical',
    tags: ['outage', 'production', 'server', 'critical'],
    contact: {
      name: 'Robert Martinez',
      email: 'r.martinez@acmecorp.com',
      phone: '+1 (555) 234-5678',
      role: 'IT Director',
    },
    device: {
      hostname: 'PROD-WEB-01',
      ip: '192.168.1.50',
      os: 'Windows Server 2022',
      lastSeen: '2h ago',
      agentVersion: '3.2.1',
      status: 'offline',
    },
    relatedTickets: ['TKT-098', 'TKT-087'],
    activities: [
      { id: 'act-1', type: 'system', user: 'System', content: 'Ticket created via phone call', timestamp: '2h ago' },
      { id: 'act-2', type: 'assignment', user: 'Sarah Admin', content: 'Assigned ticket to John Smith', timestamp: '1h 55m ago' },
      { id: 'act-3', type: 'note', user: 'John Smith', content: 'Attempting remote connection - RDP not responding. Will try IPMI console.', timestamp: '1h 45m ago' },
      { id: 'act-4', type: 'status_change', user: 'John Smith', content: 'Status changed from New to Open', timestamp: '1h 40m ago' },
      { id: 'act-5', type: 'comment', user: 'Robert Martinez', content: 'This is affecting our entire sales team. Please prioritize!', timestamp: '1h 30m ago' },
    ],
    attachments: [
      { id: 'att-1', name: 'server_logs_20240129.txt', type: 'log', size: '2.4 MB', uploadedBy: 'John Smith', uploadedAt: '1h ago' },
      { id: 'att-2', name: 'error_screenshot.png', type: 'image', size: '854 KB', uploadedBy: 'Robert Martinez', uploadedAt: '1h 30m ago' },
    ],
    firstResponseTime: '5 minutes',
    timeSpent: '1h 45m',
    estimatedTime: '3h',
    linkedAlerts: ['ALT-001', 'ALT-002'],
  },
  { 
    id: 'TKT-002', 
    title: 'Outlook email sync failing for multiple users', 
    customer: 'TechStart Inc', 
    customerId: 'cust-002',
    priority: 'high', 
    status: 'in_progress', 
    assignee: 'Sarah Johnson',
    assigneeAvatar: '',
    created: '4h ago',
    createdAt: '2024-01-29T12:30:00Z',
    updatedAt: '2024-01-29T15:45:00Z',
    sla: '3h remaining',
    slaDeadline: '2024-01-29T19:30:00Z',
    slaProgress: 45,
    description: 'Multiple users in the finance department are experiencing email synchronization issues with Outlook. Emails are not syncing with the Exchange Online server. Issue started after the Microsoft 365 tenant update last night. Approximately 15 users affected.',
    category: 'Software',
    subcategory: 'Email - Microsoft 365',
    source: 'email',
    impact: 'department',
    urgency: 'high',
    tags: ['outlook', 'exchange', 'sync', 'microsoft365'],
    contact: {
      name: 'Jennifer Walsh',
      email: 'j.walsh@techstart.io',
      phone: '+1 (555) 876-5432',
      role: 'Finance Manager',
    },
    relatedTickets: [],
    activities: [
      { id: 'act-1', type: 'system', user: 'System', content: 'Ticket created via email', timestamp: '4h ago' },
      { id: 'act-2', type: 'assignment', user: 'Auto-assign', content: 'Auto-assigned to Sarah Johnson based on category', timestamp: '4h ago' },
      { id: 'act-3', type: 'status_change', user: 'Sarah Johnson', content: 'Status changed to In Progress', timestamp: '3h 30m ago' },
      { id: 'act-4', type: 'note', user: 'Sarah Johnson', content: 'Checked Exchange Admin Center - no service issues reported. Investigating client-side configuration.', timestamp: '3h ago' },
      { id: 'act-5', type: 'comment', user: 'Sarah Johnson', content: 'Found the issue - cached credentials need to be cleared. Working on a batch fix.', timestamp: '2h ago' },
    ],
    attachments: [
      { id: 'att-1', name: 'affected_users_list.xlsx', type: 'document', size: '45 KB', uploadedBy: 'Jennifer Walsh', uploadedAt: '4h ago' },
      { id: 'att-2', name: 'outlook_error.png', type: 'image', size: '320 KB', uploadedBy: 'Jennifer Walsh', uploadedAt: '4h ago' },
    ],
    firstResponseTime: '12 minutes',
    timeSpent: '2h 30m',
    estimatedTime: '4h',
    linkedAlerts: [],
  },
  { 
    id: 'TKT-003', 
    title: 'Password reset request - CEO account locked', 
    customer: 'GlobalTech', 
    customerId: 'cust-003',
    priority: 'medium', 
    status: 'open', 
    assignee: 'Unassigned',
    created: '1d ago',
    createdAt: '2024-01-28T09:15:00Z',
    updatedAt: '2024-01-28T09:15:00Z',
    sla: '4h remaining',
    slaDeadline: '2024-01-29T17:15:00Z',
    slaProgress: 60,
    description: 'CEO David Thompson is unable to access his Microsoft account. Account appears to be locked after multiple failed login attempts. Requires immediate password reset and account unlock. VIP user - handle with priority.',
    category: 'Identity & Access',
    subcategory: 'Password Reset',
    source: 'phone',
    impact: 'single_user',
    urgency: 'high',
    tags: ['password', 'vip', 'account-locked', 'urgent'],
    contact: {
      name: 'David Thompson',
      email: 'd.thompson@globaltech.com',
      phone: '+1 (555) 111-2222',
      role: 'CEO',
    },
    relatedTickets: ['TKT-045'],
    activities: [
      { id: 'act-1', type: 'system', user: 'System', content: 'Ticket created via phone call (VIP flagged)', timestamp: '1d ago' },
    ],
    attachments: [],
    firstResponseTime: undefined,
    timeSpent: '0m',
    estimatedTime: '30m',
    linkedAlerts: [],
  },
  { 
    id: 'TKT-004', 
    title: 'VPN connection drops every 30 minutes', 
    customer: 'DataFlow LLC', 
    customerId: 'cust-004',
    priority: 'high', 
    status: 'in_progress', 
    assignee: 'Mike Chen',
    assigneeAvatar: '',
    created: '6h ago',
    createdAt: '2024-01-29T10:00:00Z',
    updatedAt: '2024-01-29T15:30:00Z',
    sla: '2h remaining',
    slaDeadline: '2024-01-29T18:00:00Z',
    slaProgress: 70,
    description: 'Remote workers are experiencing VPN disconnections every 30 minutes. The GlobalProtect VPN client disconnects and requires manual reconnection. Issue affects approximately 25 remote employees. Firewall logs show connection timeouts.',
    category: 'Network',
    subcategory: 'VPN',
    source: 'portal',
    impact: 'department',
    urgency: 'high',
    tags: ['vpn', 'globalprotect', 'network', 'remote-work'],
    contact: {
      name: 'Amanda Foster',
      email: 'a.foster@dataflow.com',
      phone: '+1 (555) 333-4444',
      role: 'IT Manager',
    },
    device: {
      hostname: 'FW-EDGE-01',
      ip: '10.0.0.1',
      os: 'PAN-OS 11.0',
      lastSeen: 'Just now',
      agentVersion: 'N/A',
      status: 'online',
    },
    relatedTickets: [],
    activities: [
      { id: 'act-1', type: 'system', user: 'System', content: 'Ticket created via client portal', timestamp: '6h ago' },
      { id: 'act-2', type: 'assignment', user: 'Sarah Admin', content: 'Assigned to Mike Chen (Network Specialist)', timestamp: '5h 45m ago' },
      { id: 'act-3', type: 'status_change', user: 'Mike Chen', content: 'Status changed to In Progress', timestamp: '5h 30m ago' },
      { id: 'act-4', type: 'note', user: 'Mike Chen', content: 'Reviewing firewall logs. Found session timeout configured at 30 minutes - this appears to be the root cause.', timestamp: '4h ago' },
      { id: 'act-5', type: 'comment', user: 'Mike Chen', content: 'Scheduled maintenance window tonight to adjust timeout settings.', timestamp: '2h ago' },
    ],
    attachments: [
      { id: 'att-1', name: 'vpn_logs_jan29.log', type: 'log', size: '5.2 MB', uploadedBy: 'Mike Chen', uploadedAt: '4h ago' },
    ],
    firstResponseTime: '8 minutes',
    timeSpent: '3h 15m',
    estimatedTime: '5h',
    linkedAlerts: ['ALT-005'],
  },
  { 
    id: 'TKT-005', 
    title: 'Office printer offline - HP LaserJet Pro', 
    customer: 'Acme Corp',
    customerId: 'cust-001',
    priority: 'low', 
    status: 'resolved', 
    assignee: 'John Smith',
    assigneeAvatar: '',
    created: '2d ago',
    createdAt: '2024-01-27T11:00:00Z',
    updatedAt: '2024-01-27T14:30:00Z',
    sla: 'Completed',
    slaDeadline: '2024-01-28T11:00:00Z',
    slaProgress: 100,
    description: 'The main office printer (HP LaserJet Pro M404dn) on the 3rd floor is showing as offline. Print jobs are queuing but not printing. Network connectivity confirmed - can ping the printer.',
    category: 'Hardware',
    subcategory: 'Printer',
    source: 'email',
    impact: 'department',
    urgency: 'low',
    tags: ['printer', 'hp', 'hardware', 'office'],
    contact: {
      name: 'Lisa Park',
      email: 'l.park@acmecorp.com',
      phone: '+1 (555) 555-6666',
      role: 'Office Manager',
    },
    device: {
      hostname: 'PRN-3RD-01',
      ip: '192.168.1.150',
      os: 'HP Firmware 2.3.1',
      lastSeen: 'Just now',
      agentVersion: 'N/A',
      status: 'online',
    },
    relatedTickets: [],
    activities: [
      { id: 'act-1', type: 'system', user: 'System', content: 'Ticket created via email', timestamp: '2d ago' },
      { id: 'act-2', type: 'assignment', user: 'Auto-assign', content: 'Auto-assigned to John Smith', timestamp: '2d ago' },
      { id: 'act-3', type: 'note', user: 'John Smith', content: 'Remote access to printer. Print spooler service was stuck. Cleared queue and restarted service.', timestamp: '2d ago' },
      { id: 'act-4', type: 'status_change', user: 'John Smith', content: 'Status changed to Resolved', timestamp: '2d ago' },
    ],
    attachments: [],
    resolution: 'Cleared stuck print queue and restarted the print spooler service remotely. Printer is now online and processing jobs normally. Recommended scheduling weekly maintenance restarts.',
    firstResponseTime: '15 minutes',
    timeSpent: '45m',
    estimatedTime: '1h',
    linkedAlerts: [],
  },
  { 
    id: 'TKT-006', 
    title: 'New employee workstation setup - Full onboarding', 
    customer: 'StartupXYZ',
    customerId: 'cust-005',
    priority: 'medium', 
    status: 'open', 
    assignee: 'Unassigned',
    created: '3h ago',
    createdAt: '2024-01-29T13:00:00Z',
    updatedAt: '2024-01-29T13:00:00Z',
    sla: '5h remaining',
    slaDeadline: '2024-01-30T09:00:00Z',
    slaProgress: 25,
    description: 'New software engineer starting on Monday. Requires full workstation setup including: Windows 11 Pro installation, Microsoft 365 Apps, Visual Studio 2022, Docker Desktop, WSL2, Git, and standard security software. Active Directory account and email setup also needed.',
    category: 'Provisioning',
    subcategory: 'New User Setup',
    source: 'portal',
    impact: 'single_user',
    urgency: 'medium',
    tags: ['onboarding', 'new-user', 'setup', 'workstation'],
    contact: {
      name: 'Tom Bradley',
      email: 't.bradley@startupxyz.io',
      phone: '+1 (555) 777-8888',
      role: 'HR Director',
    },
    relatedTickets: [],
    activities: [
      { id: 'act-1', type: 'system', user: 'System', content: 'Ticket created via client portal', timestamp: '3h ago' },
    ],
    attachments: [
      { id: 'att-1', name: 'new_employee_form.pdf', type: 'document', size: '125 KB', uploadedBy: 'Tom Bradley', uploadedAt: '3h ago' },
      { id: 'att-2', name: 'software_requirements.xlsx', type: 'document', size: '32 KB', uploadedBy: 'Tom Bradley', uploadedAt: '3h ago' },
    ],
    firstResponseTime: undefined,
    timeSpent: '0m',
    estimatedTime: '4h',
    linkedAlerts: [],
  },
];

const priorityColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusColors = {
  open: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-cyan-500/20 text-cyan-400',
  resolved: 'bg-emerald-500/20 text-emerald-400',
  closed: 'bg-slate-500/20 text-slate-400',
};

const statusIcons = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle2,
  closed: XCircle,
};

const sourceIcons = {
  email: Mail,
  phone: Phone,
  portal: Monitor,
  chat: MessageSquare,
  api: Zap,
};

const impactLabels = {
  single_user: { label: 'Single User', color: 'text-slate-400' },
  department: { label: 'Department', color: 'text-yellow-400' },
  organization: { label: 'Organization-wide', color: 'text-red-400' },
};

export default function VanguardTickets() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [tickets, setTickets] = useState(mockTickets);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<typeof mockTickets[0] | null>(null);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    customer: '',
  });

  useEffect(() => {
    document.title = 'Tickets | Ultrium Vanguard';
  }, []);

  const stats = [
    { label: 'Open', value: tickets.filter(t => t.status === 'open').length, icon: AlertCircle, color: 'text-blue-400' },
    { label: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length, icon: Clock, color: 'text-cyan-400' },
    { label: 'Resolved Today', value: tickets.filter(t => t.status === 'resolved').length, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'SLA At Risk', value: tickets.filter(t => t.sla.includes('1h') || t.sla.includes('2h')).length, icon: XCircle, color: 'text-red-400' },
  ];

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ticket.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || ticket.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleCreateTicket = () => {
    if (!newTicket.title || !newTicket.customer) {
      toast.error('Please fill in required fields');
      return;
    }

    const ticketId = `TKT-${String(tickets.length + 1).padStart(3, '0')}`;
    const createdTicket = {
      id: ticketId,
      title: newTicket.title,
      description: newTicket.description || 'No description provided',
      priority: newTicket.priority as Ticket['priority'],
      customer: newTicket.customer,
      customerId: `cust-${Date.now()}`,
      status: 'open' as const,
      assignee: 'Unassigned',
      created: 'Just now',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sla: '24h remaining',
      slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      slaProgress: 0,
      category: 'General',
      subcategory: 'Support Request',
      source: 'portal' as const,
      impact: 'single_user' as const,
      urgency: 'medium' as const,
      tags: ['new'],
      contact: {
        name: 'Portal User',
        email: 'user@example.com',
        phone: 'N/A',
        role: 'End User',
      },
      relatedTickets: [],
      activities: [
        { id: 'act-1', type: 'system' as const, user: 'System', content: 'Ticket created via MSP portal', timestamp: 'Just now' },
      ],
      attachments: [],
      timeSpent: '0m',
      estimatedTime: '2h',
      linkedAlerts: [],
    };

    setTickets([createdTicket, ...tickets]);
    setNewTicket({ title: '', description: '', priority: 'medium', customer: '' });
    setIsCreateDialogOpen(false);
    toast.success(`Ticket ${ticketId} created successfully`);
  };

  const handleAssign = (ticketId: string) => {
    setTickets(tickets.map(t => 
      t.id === ticketId ? { ...t, assignee: 'Current User', status: 'in_progress' } : t
    ));
    toast.success(`Ticket ${ticketId} assigned to you`);
  };

  const handleAddNote = (ticketId: string) => {
    toast.success(`Note added to ${ticketId}`);
  };

  const handleCloseTicket = (ticketId: string) => {
    setTickets(tickets.map(t => 
      t.id === ticketId ? { ...t, status: 'resolved', sla: 'Completed' } : t
    ));
    toast.success(`Ticket ${ticketId} closed`);
  };

  const handleViewDetails = (ticket: Ticket) => {
    // Navigate to full ticket detail page
    navigate(`${basePath}/tickets/${ticket.id}`);
  };

  const handleQuickView = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Ticket className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tickets</h1>
            <p className="text-white/60 text-sm">Manage support tickets across all customers</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-cyan-500/20">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-white/80">Title *</Label>
                <Input
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  placeholder="Brief description of the issue"
                  className="bg-black/40 border-cyan-500/20 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Customer *</Label>
                <Select value={newTicket.customer} onValueChange={(v) => setNewTicket({ ...newTicket, customer: v })}>
                  <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-cyan-500/20">
                    <SelectItem value="Acme Corp">Acme Corp</SelectItem>
                    <SelectItem value="TechStart Inc">TechStart Inc</SelectItem>
                    <SelectItem value="GlobalTech">GlobalTech</SelectItem>
                    <SelectItem value="DataFlow LLC">DataFlow LLC</SelectItem>
                    <SelectItem value="StartupXYZ">StartupXYZ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Priority</Label>
                <Select value={newTicket.priority} onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}>
                  <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-cyan-500/20">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Description</Label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Detailed description of the issue"
                  className="bg-black/40 border-cyan-500/20 text-white min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-cyan-500/20 text-white/80">
                Cancel
              </Button>
              <Button onClick={handleCreateTicket} className="bg-cyan-500 hover:bg-cyan-600 text-black">
                Create Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
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
            placeholder="Search tickets..." 
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
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">All</TabsTrigger>
          <TabsTrigger value="open" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Open</TabsTrigger>
          <TabsTrigger value="in_progress" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">In Progress</TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-500/20">
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Ticket</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Customer</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Priority</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Status</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Assignee</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">SLA</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => {
                      const StatusIcon = statusIcons[ticket.status as keyof typeof statusIcons];
                      return (
                        <tr 
                          key={ticket.id} 
                          className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors cursor-pointer"
                          onClick={() => handleViewDetails(ticket)}
                        >
                          <td className="p-4">
                            <div>
                              <p className="text-white font-medium">{ticket.title}</p>
                              <p className="text-white/40 text-sm">{ticket.id} • {ticket.created}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-white/40" />
                              <span className="text-white/80">{ticket.customer}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                              {ticket.priority}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-white/40" />
                              <span className="text-white/80">{ticket.assignee}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`text-sm ${ticket.sla.includes('remaining') ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {ticket.sla}
                            </span>
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
                                <DropdownMenuItem 
                                  className="text-white/80 hover:bg-cyan-500/10"
                                  onClick={() => handleViewDetails(ticket)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Open Ticket
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-white/80 hover:bg-cyan-500/10"
                                  onClick={() => handleQuickView(ticket)}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Quick View
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-cyan-500/20" />
                                <DropdownMenuItem 
                                  className="text-white/80 hover:bg-cyan-500/10"
                                  onClick={() => handleAssign(ticket.id)}
                                >
                                  <User className="h-4 w-4 mr-2" />
                                  Assign to Me
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-white/80 hover:bg-cyan-500/10"
                                  onClick={() => handleAddNote(ticket.id)}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Add Note
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-cyan-500/20" />
                                <DropdownMenuItem 
                                  className="text-emerald-400 hover:bg-emerald-500/10"
                                  onClick={() => handleCloseTicket(ticket.id)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Close Ticket
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Ticket Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="bg-slate-900 border-cyan-500/20 max-w-5xl max-h-[90vh] overflow-hidden p-0">
          {selectedTicket && (
            <div className="flex flex-col h-full max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-cyan-500/20 bg-slate-900/80">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Ticket className="h-5 w-5 text-cyan-400" />
                      <span className="text-white/60 font-mono">{selectedTicket.id}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-white/40 hover:text-white"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTicket.id);
                          toast.success('Ticket ID copied');
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-3">{selectedTicket.title}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={priorityColors[selectedTicket.priority]}>
                        {selectedTicket.priority}
                      </Badge>
                      <Badge className={statusColors[selectedTicket.status]}>
                        {statusIcons[selectedTicket.status] && (() => {
                          const Icon = statusIcons[selectedTicket.status];
                          return <Icon className="h-3 w-3 mr-1" />;
                        })()}
                        {selectedTicket.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                        {(() => {
                          const Icon = sourceIcons[selectedTicket.source];
                          return <Icon className="h-3 w-3 mr-1" />;
                        })()}
                        {selectedTicket.source}
                      </Badge>
                      {selectedTicket.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="border-white/20 text-white/60 text-xs">
                          <Tag className="h-2.5 w-2.5 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-cyan-500/20 text-cyan-400">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open Full
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Main Content */}
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6">
                    {/* SLA Progress */}
                    <Card className="bg-black/30 border-cyan-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-cyan-400" />
                            <span className="text-white/80 font-medium">SLA Status</span>
                          </div>
                          <span className={`font-medium ${
                            selectedTicket.slaProgress >= 75 ? 'text-red-400' : 
                            selectedTicket.slaProgress >= 50 ? 'text-yellow-400' : 'text-emerald-400'
                          }`}>
                            {selectedTicket.sla}
                          </span>
                        </div>
                        <Progress 
                          value={selectedTicket.slaProgress} 
                          className="h-2 bg-black/40"
                        />
                        <div className="flex justify-between mt-2 text-xs text-white/40">
                          <span>Time Spent: {selectedTicket.timeSpent}</span>
                          <span>Estimated: {selectedTicket.estimatedTime}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Description */}
                    <div>
                      <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-cyan-400" />
                        Description
                      </h3>
                      <p className="text-white/70 bg-black/20 p-4 rounded-lg border border-cyan-500/10 leading-relaxed">
                        {selectedTicket.description}
                      </p>
                    </div>

                    {/* Resolution (if resolved) */}
                    {selectedTicket.resolution && (
                      <div>
                        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          Resolution
                        </h3>
                        <p className="text-emerald-400/80 bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20">
                          {selectedTicket.resolution}
                        </p>
                      </div>
                    )}

                    {/* Impact & Category */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="bg-black/30 border-cyan-500/20">
                        <CardContent className="p-4">
                          <Label className="text-white/50 text-xs uppercase tracking-wide">Impact</Label>
                          <p className={`font-medium mt-1 ${impactLabels[selectedTicket.impact].color}`}>
                            {impactLabels[selectedTicket.impact].label}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-black/30 border-cyan-500/20">
                        <CardContent className="p-4">
                          <Label className="text-white/50 text-xs uppercase tracking-wide">Category</Label>
                          <p className="text-white mt-1">{selectedTicket.category}</p>
                          <p className="text-white/50 text-sm">{selectedTicket.subcategory}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Device Info */}
                    {selectedTicket.device && (
                      <div>
                        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-cyan-400" />
                          Affected Device
                        </h3>
                        <Card className="bg-black/30 border-cyan-500/20">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label className="text-white/50 text-xs">Hostname</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    selectedTicket.device.status === 'online' ? 'bg-emerald-400' :
                                    selectedTicket.device.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                                  }`} />
                                  <span className="text-white font-mono">{selectedTicket.device.hostname}</span>
                                </div>
                              </div>
                              <div>
                                <Label className="text-white/50 text-xs">IP Address</Label>
                                <p className="text-white font-mono mt-1">{selectedTicket.device.ip}</p>
                              </div>
                              <div>
                                <Label className="text-white/50 text-xs">Operating System</Label>
                                <p className="text-white mt-1">{selectedTicket.device.os}</p>
                              </div>
                              <div>
                                <Label className="text-white/50 text-xs">Last Seen</Label>
                                <p className="text-white/70 mt-1">{selectedTicket.device.lastSeen}</p>
                              </div>
                              <div>
                                <Label className="text-white/50 text-xs">Agent Version</Label>
                                <p className="text-white/70 mt-1">{selectedTicket.device.agentVersion}</p>
                              </div>
                              <div>
                                <Button variant="outline" size="sm" className="mt-1 border-cyan-500/20 text-cyan-400 text-xs">
                                  <ArrowUpRight className="h-3 w-3 mr-1" />
                                  View Device
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Attachments */}
                    {selectedTicket.attachments.length > 0 && (
                      <div>
                        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-cyan-400" />
                          Attachments ({selectedTicket.attachments.length})
                        </h3>
                        <div className="space-y-2">
                          {selectedTicket.attachments.map(att => (
                            <div 
                              key={att.id}
                              className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-cyan-500/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                {att.type === 'image' ? (
                                  <Image className="h-4 w-4 text-purple-400" />
                                ) : att.type === 'log' ? (
                                  <FileText className="h-4 w-4 text-amber-400" />
                                ) : (
                                  <FileText className="h-4 w-4 text-blue-400" />
                                )}
                                <div>
                                  <p className="text-white text-sm">{att.name}</p>
                                  <p className="text-white/40 text-xs">{att.size} • {att.uploadedBy} • {att.uploadedAt}</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related Tickets & Alerts */}
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTicket.relatedTickets.length > 0 && (
                        <div>
                          <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-cyan-400" />
                            Related Tickets
                          </h3>
                          <div className="space-y-2">
                            {selectedTicket.relatedTickets.map(rt => (
                              <div key={rt} className="flex items-center gap-2 p-2 bg-black/20 rounded border border-cyan-500/10">
                                <Ticket className="h-4 w-4 text-white/40" />
                                <span className="text-cyan-400 font-mono text-sm">{rt}</span>
                                <ChevronRight className="h-4 w-4 text-white/20 ml-auto" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedTicket.linkedAlerts.length > 0 && (
                        <div>
                          <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                            Linked Alerts
                          </h3>
                          <div className="space-y-2">
                            {selectedTicket.linkedAlerts.map(alt => (
                              <div key={alt} className="flex items-center gap-2 p-2 bg-black/20 rounded border border-amber-500/10">
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                                <span className="text-amber-400 font-mono text-sm">{alt}</span>
                                <ChevronRight className="h-4 w-4 text-white/20 ml-auto" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Activity Timeline */}
                    <div>
                      <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <History className="h-4 w-4 text-cyan-400" />
                        Activity Timeline
                      </h3>
                      <div className="space-y-4">
                        {selectedTicket.activities.map((activity, idx) => (
                          <div key={activity.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                activity.type === 'comment' ? 'bg-blue-500/20 text-blue-400' :
                                activity.type === 'status_change' ? 'bg-cyan-500/20 text-cyan-400' :
                                activity.type === 'assignment' ? 'bg-purple-500/20 text-purple-400' :
                                activity.type === 'note' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-slate-500/20 text-slate-400'
                              }`}>
                                {activity.type === 'comment' && <MessageSquare className="h-4 w-4" />}
                                {activity.type === 'status_change' && <RefreshCw className="h-4 w-4" />}
                                {activity.type === 'assignment' && <User className="h-4 w-4" />}
                                {activity.type === 'note' && <FileText className="h-4 w-4" />}
                                {activity.type === 'system' && <Zap className="h-4 w-4" />}
                              </div>
                              {idx < selectedTicket.activities.length - 1 && (
                                <div className="w-px h-full bg-cyan-500/20 my-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-medium text-sm">{activity.user}</span>
                                <span className="text-white/40 text-xs">{activity.timestamp}</span>
                              </div>
                              <p className="text-white/70 text-sm bg-black/20 p-3 rounded-lg border border-cyan-500/10">
                                {activity.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Sidebar */}
                <div className="w-80 border-l border-cyan-500/20 p-4 bg-black/20 overflow-y-auto">
                  {/* Quick Stats */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Created</span>
                      <span className="text-white">{selectedTicket.created}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">First Response</span>
                      <span className={selectedTicket.firstResponseTime ? 'text-emerald-400' : 'text-amber-400'}>
                        {selectedTicket.firstResponseTime || 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Time Spent</span>
                      <span className="text-white">{selectedTicket.timeSpent}</span>
                    </div>
                  </div>

                  <Separator className="bg-cyan-500/20 mb-4" />

                  {/* Assignee */}
                  <div className="mb-6">
                    <Label className="text-white/50 text-xs uppercase tracking-wide">Assignee</Label>
                    <div className="mt-2 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                          {selectedTicket.assignee === 'Unassigned' ? '?' : selectedTicket.assignee.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">{selectedTicket.assignee}</p>
                        {selectedTicket.assignee !== 'Unassigned' && (
                          <p className="text-white/40 text-xs">Technician</p>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3 border-cyan-500/20 text-cyan-400"
                      onClick={() => {
                        handleAssign(selectedTicket.id);
                        setSelectedTicket({ ...selectedTicket, assignee: 'Current User' });
                      }}
                    >
                      <User className="h-3 w-3 mr-2" />
                      {selectedTicket.assignee === 'Unassigned' ? 'Assign to Me' : 'Reassign'}
                    </Button>
                  </div>

                  <Separator className="bg-cyan-500/20 mb-4" />

                  {/* Contact */}
                  <div className="mb-6">
                    <Label className="text-white/50 text-xs uppercase tracking-wide">Requester</Label>
                    <div className="mt-2 space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-purple-500/20 text-purple-400">
                            {selectedTicket.contact.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{selectedTicket.contact.name}</p>
                          <p className="text-white/40 text-xs">{selectedTicket.contact.role}</p>
                        </div>
                      </div>
                      <div className="space-y-2 pl-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-white/40" />
                          <span className="text-cyan-400 text-xs">{selectedTicket.contact.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-white/40" />
                          <span className="text-white/70 text-xs">{selectedTicket.contact.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-3 w-3 text-white/40" />
                          <span className="text-white/70 text-xs">{selectedTicket.customer}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-cyan-500/20 mb-4" />

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-black"
                      onClick={() => {
                        toast.success('Reply sent');
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-cyan-500/20 text-white/80"
                      onClick={() => handleAddNote(selectedTicket.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                    {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                      <Button 
                        variant="outline" 
                        className="w-full border-emerald-500/20 text-emerald-400"
                        onClick={() => {
                          handleCloseTicket(selectedTicket.id);
                          setSelectedTicket(null);
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Resolve Ticket
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
