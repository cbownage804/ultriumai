import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Mail, Inbox, Send, RefreshCw, CheckCircle2, AlertTriangle,
  Clock, Bot, Sparkles, ArrowRight, Filter, Eye, Edit,
  Trash2, MoreVertical, Tag, User, Building2, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface EmailThread {
  id: string;
  subject: string;
  from: string;
  fromEmail: string;
  company?: string;
  preview: string;
  receivedAt: Date;
  status: 'new' | 'processing' | 'auto_responded' | 'pending_review' | 'ticket_created';
  aiConfidence: number;
  aiCategory: string;
  aiSentiment: string;
  aiSuggestedResponse?: string;
  ticketId?: string;
  threadCount: number;
}

interface AutomationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  triggeredCount: number;
}

const DEMO_EMAILS: EmailThread[] = [
  {
    id: '1',
    subject: 'Cannot access VPN from home',
    from: 'Sarah Chen',
    fromEmail: 'sarah.chen@acmecorp.com',
    company: 'Acme Corp',
    preview: 'Hi, I\'ve been trying to connect to the corporate VPN since this morning but keep getting timeout errors...',
    receivedAt: new Date(Date.now() - 5 * 60 * 1000),
    status: 'auto_responded',
    aiConfidence: 94,
    aiCategory: 'Network/VPN',
    aiSentiment: 'urgent',
    aiSuggestedResponse: 'Hi Sarah, I understand you\'re having trouble connecting to the VPN. Here are some steps to try...',
    ticketId: 'TKT-4521',
    threadCount: 1
  },
  {
    id: '2',
    subject: 'Re: Monthly invoice question',
    from: 'Mike Johnson',
    fromEmail: 'mike.j@techstart.io',
    company: 'TechStart',
    preview: 'Thanks for the clarification. One more question - can we get a breakdown of the usage charges?',
    receivedAt: new Date(Date.now() - 15 * 60 * 1000),
    status: 'pending_review',
    aiConfidence: 72,
    aiCategory: 'Billing',
    aiSentiment: 'neutral',
    aiSuggestedResponse: 'Hi Mike, I\'d be happy to provide a detailed breakdown...',
    threadCount: 4
  },
  {
    id: '3',
    subject: 'URGENT: Server down!!!',
    from: 'Alex Rodriguez',
    fromEmail: 'alex@globalfinance.com',
    company: 'Global Finance',
    preview: 'Our production server has been unresponsive for the last 20 minutes. This is critical!',
    receivedAt: new Date(Date.now() - 2 * 60 * 1000),
    status: 'processing',
    aiConfidence: 98,
    aiCategory: 'Critical/Outage',
    aiSentiment: 'frustrated',
    threadCount: 1
  },
  {
    id: '4',
    subject: 'Password reset not working',
    from: 'Emma Wilson',
    fromEmail: 'e.wilson@retailmax.com',
    company: 'RetailMax',
    preview: 'I tried to reset my password but never received the email. Can you help?',
    receivedAt: new Date(Date.now() - 45 * 60 * 1000),
    status: 'auto_responded',
    aiConfidence: 91,
    aiCategory: 'Security/Password',
    aiSentiment: 'neutral',
    aiSuggestedResponse: 'Hi Emma, I can help you with your password reset...',
    ticketId: 'TKT-4520',
    threadCount: 1
  }
];

const AUTOMATION_RULES: AutomationRule[] = [
  { id: '1', name: 'Auto-respond to password resets', condition: 'Category = Security/Password AND Confidence ≥ 90%', action: 'Send KB article + auto-response', enabled: true, triggeredCount: 234 },
  { id: '2', name: 'Escalate critical issues', condition: 'Sentiment = frustrated OR Category = Critical', action: 'Create P1 ticket + alert team', enabled: true, triggeredCount: 45 },
  { id: '3', name: 'Thread billing to account team', condition: 'Category = Billing', action: 'Route to billing queue', enabled: true, triggeredCount: 89 },
  { id: '4', name: 'After-hours auto-reply', condition: 'Time = Outside business hours', action: 'Send acknowledgment + ETA', enabled: true, triggeredCount: 156 }
];

const sentimentColors = {
  frustrated: 'text-red-400 bg-red-500/20 border-red-500/30',
  urgent: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
  neutral: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
  appreciative: 'text-green-400 bg-green-500/20 border-green-500/30'
};

const statusConfig = {
  new: { color: 'bg-blue-500', label: 'New' },
  processing: { color: 'bg-yellow-500', label: 'Processing' },
  auto_responded: { color: 'bg-green-500', label: 'Auto-Responded' },
  pending_review: { color: 'bg-orange-500', label: 'Pending Review' },
  ticket_created: { color: 'bg-purple-500', label: 'Ticket Created' }
};

export function EmailAutomationEngine() {
  const [emails, setEmails] = useState<EmailThread[]>(DEMO_EMAILS);
  const [rules, setRules] = useState<AutomationRule[]>(AUTOMATION_RULES);
  const [selectedEmail, setSelectedEmail] = useState<EmailThread | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');

  const processEmail = async (emailId: string, action: 'approve' | 'edit' | 'reject') => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (action === 'approve') {
      setEmails(emails.map(e => 
        e.id === emailId ? { ...e, status: 'auto_responded' as const, ticketId: `TKT-${Math.floor(Math.random() * 10000)}` } : e
      ));
      toast.success('Response sent and ticket created');
    } else if (action === 'reject') {
      setEmails(emails.map(e => 
        e.id === emailId ? { ...e, status: 'pending_review' as const } : e
      ));
      toast.info('Email flagged for manual review');
    }
    
    setIsProcessing(false);
    setSelectedEmail(null);
  };

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
    toast.success('Rule updated');
  };

  const stats = {
    totalToday: 47,
    autoProcessed: 38,
    pendingReview: 6,
    avgProcessTime: '< 15s'
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Emails Today</p>
                <p className="text-2xl font-bold text-white">{stats.totalToday}</p>
              </div>
              <Mail className="h-8 w-8 text-cyan-400/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Auto-Processed</p>
                <p className="text-2xl font-bold text-green-400">{stats.autoProcessed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400/40" />
            </div>
            <Progress value={(stats.autoProcessed / stats.totalToday) * 100} className="mt-2 h-1 bg-slate-800" />
          </CardContent>
        </Card>
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Pending Review</p>
                <p className="text-2xl font-bold text-orange-400">{stats.pendingReview}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Process Time</p>
                <p className="text-2xl font-bold text-purple-400">{stats.avgProcessTime}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-400/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/60 border border-cyan-500/30">
          <TabsTrigger value="inbox" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Inbox className="h-4 w-4 mr-2" />
            Email Queue
          </TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <Filter className="h-4 w-4 mr-2" />
            Automation Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-4">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Email List */}
            <div className="lg:col-span-2">
              <Card className="bg-black/80 border-cyan-500/30">
                <CardHeader className="border-b border-purple-500/20 py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
                      <Inbox className="h-4 w-4" />
                      Incoming Emails
                    </CardTitle>
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-slate-800">
                    {emails.map((email) => (
                      <motion.div
                        key={email.id}
                        className={`p-4 cursor-pointer transition-colors hover:bg-slate-900/50 ${
                          selectedEmail?.id === email.id ? 'bg-cyan-500/10 border-l-2 border-cyan-400' : ''
                        }`}
                        onClick={() => setSelectedEmail(email)}
                        whileHover={{ x: 2 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${statusConfig[email.status].color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white text-sm truncate">{email.from}</span>
                              {email.company && (
                                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                                  {email.company}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-300 truncate">{email.subject}</p>
                            <p className="text-xs text-slate-500 truncate mt-1">{email.preview}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className={sentimentColors[email.aiSentiment as keyof typeof sentimentColors] || sentimentColors.neutral}>
                                {email.aiSentiment}
                              </Badge>
                              <span className="text-xs text-cyan-400">{email.aiConfidence}%</span>
                              {email.threadCount > 1 && (
                                <span className="text-xs text-slate-500">{email.threadCount} messages</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-slate-500">
                              {Math.round((Date.now() - email.receivedAt.getTime()) / 60000)}m ago
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            {/* Email Detail / AI Response */}
            <div className="lg:col-span-3">
              {selectedEmail ? (
                <Card className="bg-black/80 border-cyan-500/30">
                  <CardHeader className="border-b border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">{selectedEmail.subject}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <User className="h-3 w-3" />
                          {selectedEmail.from} ({selectedEmail.fromEmail})
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className={`${statusConfig[selectedEmail.status].color} text-white`}>
                          {statusConfig[selectedEmail.status].label}
                        </Badge>
                        {selectedEmail.ticketId && (
                          <p className="text-xs text-purple-400 mt-1">{selectedEmail.ticketId}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* AI Analysis */}
                    <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Bot className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm font-medium text-cyan-400">AI Analysis</span>
                        <span className="text-sm text-slate-400 ml-auto">Confidence: {selectedEmail.aiConfidence}%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Category:</span>
                          <Badge variant="outline" className="ml-2 border-cyan-500/40 text-cyan-400">
                            {selectedEmail.aiCategory}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-slate-500">Sentiment:</span>
                          <Badge variant="outline" className={`ml-2 ${sentimentColors[selectedEmail.aiSentiment as keyof typeof sentimentColors]}`}>
                            {selectedEmail.aiSentiment}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Original Email */}
                    <div>
                      <p className="text-sm font-medium text-slate-400 mb-2">Original Message</p>
                      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                        <p className="text-sm text-slate-300">{selectedEmail.preview}</p>
                      </div>
                    </div>

                    {/* AI Suggested Response */}
                    {selectedEmail.aiSuggestedResponse && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-purple-400 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            AI Suggested Response
                          </p>
                          <Button size="sm" variant="ghost" className="text-slate-400">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedEmail.aiSuggestedResponse}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                      <Button
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                        onClick={() => processEmail(selectedEmail.id, 'approve')}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Send Response
                      </Button>
                      <Button
                        variant="outline"
                        className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20"
                        onClick={() => processEmail(selectedEmail.id, 'edit')}
                        disabled={isProcessing}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-500/40 text-red-400 hover:bg-red-500/20"
                        onClick={() => processEmail(selectedEmail.id, 'reject')}
                        disabled={isProcessing}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Flag
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-black/60 border-cyan-500/20 h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <Mail className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Select an email to view details</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader className="border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Email Automation Rules
                </CardTitle>
                <Button className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white">
                  + Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-4 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                        <div>
                          <h4 className="font-medium text-white">{rule.name}</h4>
                          <p className="text-sm text-slate-500 mt-0.5">
                            <span className="text-cyan-400/70">If:</span> {rule.condition}
                          </p>
                          <p className="text-sm text-slate-500">
                            <span className="text-purple-400/70">Then:</span> {rule.action}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-cyan-400">{rule.triggeredCount}</p>
                        <p className="text-xs text-slate-500">times triggered</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
