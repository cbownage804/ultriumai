import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Ticket, 
  Plus, 
  Search, 
  BookOpen, 
  Clock, 
  CheckCircle,
  AlertCircle,
  MessageSquare,
  FileText,
  Eye,
  Send,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PortalTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
  lastResponse?: string;
}

interface KBArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  views: number;
  helpful: number;
}

const mockTickets: PortalTicket[] = [
  { id: '1', ticketNumber: 'TKT-001', title: 'Cannot access email on mobile', description: 'Outlook app not syncing', status: 'in_progress', priority: 'high', createdAt: '2025-01-30T10:00:00Z', updatedAt: '2025-01-31T09:00:00Z', lastResponse: 'We are investigating the sync issue.' },
  { id: '2', ticketNumber: 'TKT-002', title: 'New laptop setup request', description: 'Need new laptop for new employee', status: 'pending', priority: 'medium', createdAt: '2025-01-29T14:30:00Z', updatedAt: '2025-01-30T16:00:00Z', lastResponse: 'Equipment has been ordered.' },
  { id: '3', ticketNumber: 'TKT-003', title: 'Printer jam issue', description: 'Main office printer keeps jamming', status: 'resolved', priority: 'low', createdAt: '2025-01-28T09:15:00Z', updatedAt: '2025-01-29T11:00:00Z' },
];

const mockKBArticles: KBArticle[] = [
  { id: '1', title: 'How to Reset Your Password', category: 'Account', excerpt: 'Step-by-step guide to reset your password securely.', content: 'Full article content...', views: 1250, helpful: 89 },
  { id: '2', title: 'Setting Up Email on Mobile Devices', category: 'Email', excerpt: 'Configure Outlook on iOS and Android devices.', content: 'Full article content...', views: 980, helpful: 76 },
  { id: '3', title: 'VPN Connection Troubleshooting', category: 'Network', excerpt: 'Common VPN issues and how to resolve them.', content: 'Full article content...', views: 750, helpful: 65 },
  { id: '4', title: 'Two-Factor Authentication Setup', category: 'Security', excerpt: 'Enable 2FA for enhanced account security.', content: 'Full article content...', views: 620, helpful: 58 },
  { id: '5', title: 'Shared Drive Access Guide', category: 'Files', excerpt: 'How to access and manage shared network drives.', content: 'Full article content...', views: 540, helpful: 45 },
];

export function CustomerSelfServicePortal() {
  const [tickets, setTickets] = useState<PortalTicket[]>(mockTickets);
  const [kbArticles, setKbArticles] = useState<KBArticle[]>(mockKBArticles);
  const [activeTab, setActiveTab] = useState('tickets');
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });

  const handleSubmitTicket = async () => {
    if (!newTicket.title || !newTicket.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const ticket: PortalTicket = {
        id: Date.now().toString(),
        ticketNumber: `TKT-${String(tickets.length + 4).padStart(3, '0')}`,
        title: newTicket.title,
        description: newTicket.description,
        status: 'open',
        priority: newTicket.priority as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setTickets(prev => [ticket, ...prev]);
      toast.success('Ticket submitted successfully!', {
        description: `Ticket ${ticket.ticketNumber} has been created.`
      });
      setShowNewTicketDialog(false);
      setNewTicket({ title: '', description: '', priority: 'medium', category: 'general' });
    } catch (error) {
      toast.error('Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openArticle = (article: KBArticle) => {
    setSelectedArticle(article);
    setShowArticleDialog(true);
  };

  const filteredKBArticles = kbArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'pending': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-amber-400';
      case 'low': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  const openTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/60 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Open Tickets</p>
                <p className="text-3xl font-bold text-blue-400">{openTickets}</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Resolved</p>
                <p className="text-3xl font-bold text-green-400">{resolvedTickets}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">KB Articles</p>
                <p className="text-3xl font-bold text-purple-400">{kbArticles.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Avg Response</p>
                <p className="text-3xl font-bold text-cyan-400">2h</p>
              </div>
              <Clock className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="tickets">
              <Ticket className="h-4 w-4 mr-2" />
              My Tickets
            </TabsTrigger>
            <TabsTrigger value="knowledge">
              <BookOpen className="h-4 w-4 mr-2" />
              Knowledge Base
            </TabsTrigger>
          </TabsList>

          {activeTab === 'tickets' && (
            <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-500 hover:bg-cyan-600">
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Submit Support Request</DialogTitle>
                  <DialogDescription>Describe your issue and we'll get back to you shortly.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Input 
                      value={newTicket.title}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={newTicket.category}
                        onValueChange={(v) => setNewTicket(prev => ({ ...prev, category: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Support</SelectItem>
                          <SelectItem value="email">Email Issues</SelectItem>
                          <SelectItem value="network">Network/Connectivity</SelectItem>
                          <SelectItem value="hardware">Hardware</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select 
                        value={newTicket.priority}
                        onValueChange={(v) => setNewTicket(prev => ({ ...prev, priority: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea 
                      value={newTicket.description}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Please provide details about your issue, including any error messages or steps to reproduce..."
                      className="min-h-[120px]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewTicketDialog(false)}>Cancel</Button>
                  <Button onClick={handleSubmitTicket} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Submit Ticket
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {activeTab === 'knowledge' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="pl-10 w-64"
              />
            </div>
          )}
        </div>

        <TabsContent value="tickets" className="mt-6">
          <Card className="bg-black/60 border-slate-700/50">
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-slate-700/50">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-cyan-400 font-mono">{ticket.ticketNumber}</span>
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-white">{ticket.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                          {ticket.lastResponse && (
                            <div className="mt-2 p-2 rounded bg-slate-800/50 text-sm">
                              <span className="text-cyan-400">Latest update:</span> {ticket.lastResponse}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Created: {format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
                            <span>Updated: {format(new Date(ticket.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKBArticles.map((article) => (
              <Card 
                key={article.id} 
                className="bg-black/60 border-slate-700/50 hover:border-purple-500/50 cursor-pointer transition-all"
                onClick={() => openArticle(article)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                      {article.category}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg text-white">{article.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{article.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {article.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" /> {article.helpful} helpful
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredKBArticles.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No articles found matching "{searchQuery}"</p>
              <Button variant="link" onClick={() => setSearchQuery('')}>Clear search</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* KB Article Dialog */}
      <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          {selectedArticle && (
            <>
              <DialogHeader>
                <Badge variant="outline" className="w-fit text-purple-400 border-purple-500/30 mb-2">
                  {selectedArticle.category}
                </Badge>
                <DialogTitle className="text-xl">{selectedArticle.title}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[400px] pr-4">
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground">{selectedArticle.excerpt}</p>
                  <div className="mt-4 p-4 rounded-lg bg-slate-800/50">
                    <p className="text-slate-300">
                      This is the full article content. In a production environment, this would contain 
                      detailed step-by-step instructions, screenshots, and troubleshooting tips for the 
                      topic "{selectedArticle.title}".
                    </p>
                  </div>
                </div>
              </ScrollArea>
              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <p className="text-sm text-muted-foreground">Was this article helpful?</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast.success('Thank you for your feedback!')}>
                    <ThumbsUp className="h-4 w-4 mr-1" /> Yes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast.success('Thank you for your feedback!')}>
                    <ThumbsDown className="h-4 w-4 mr-1" /> No
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
