import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Brain, Bot, Sparkles, Zap, TrendingUp, Clock, Users, 
  CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight,
  MessageSquare, Mail, Phone, Calendar, ThumbsUp, ThumbsDown,
  Loader2, Play, Pause, Settings, BarChart3, Target, Shield,
  Lightbulb, GitBranch, Workflow, RefreshCw, Activity, Ticket,
  BookOpen, Send, Gauge, CircleDot, ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIMetrics {
  ticketsProcessed: number;
  autoResolved: number;
  avgConfidence: number;
  avgResponseTime: string;
  escalationRate: number;
  satisfactionRate: number;
  kbArticlesGenerated: number;
  patternsDetected: number;
}

interface QueuedTicket {
  id: string;
  title: string;
  requester_name: string;
  ai_confidence_score: number;
  ai_detected_category: string;
  ai_user_sentiment: string;
  ai_detected_priority: string;
  status: string;
  created_at: string;
  ai_suggested_solution?: string;
  ai_summary?: string;
}

const DEMO_METRICS: AIMetrics = {
  ticketsProcessed: 1247,
  autoResolved: 892,
  avgConfidence: 87,
  avgResponseTime: '< 30s',
  escalationRate: 28,
  satisfactionRate: 94,
  kbArticlesGenerated: 156,
  patternsDetected: 23
};

const sentimentColors = {
  frustrated: 'text-red-400 bg-red-500/20 border-red-500/30',
  urgent: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
  confused: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  neutral: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
  appreciative: 'text-green-400 bg-green-500/20 border-green-500/30'
};

const priorityColors = {
  critical: 'text-red-400 bg-red-500/20 border-red-500/40',
  high: 'text-orange-400 bg-orange-500/20 border-orange-500/40',
  medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40',
  low: 'text-green-400 bg-green-500/20 border-green-500/40'
};

export default function VanguardAICommandCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<AIMetrics>(DEMO_METRICS);
  const [pendingTickets, setPendingTickets] = useState<QueuedTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<QueuedTicket | null>(null);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [isAutoPilot, setIsAutoPilot] = useState(true);

  useEffect(() => {
    loadPendingTickets();
    detectPatterns();
  }, []);

  const loadPendingTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('vanguard_service_tickets')
        .select('*')
        .in('status', ['open', 'pending_tech_review', 'pending_confirmation'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setPendingTickets(data as QueuedTicket[]);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const detectPatterns = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('helpdesk-ai-features', {
        body: { action: 'detect_patterns', timeRange: '24h' }
      });
      
      if (data?.patterns) {
        setPatterns(data.patterns);
      }
    } catch (error) {
      console.error('Error detecting patterns:', error);
    }
  };

  const processTicket = async (ticketId: string, action: 'approve' | 'edit' | 'escalate') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-ticket-agent', {
        body: { 
          action: 'tech_review_action',
          ticketId,
          techAction: action
        }
      });

      if (error) throw error;
      
      toast.success(`Ticket ${action === 'approve' ? 'approved and sent' : action === 'escalate' ? 'escalated' : 'queued for edit'}`);
      loadPendingTickets();
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error processing ticket:', error);
      toast.error('Failed to process ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const autoResolvedPercent = Math.round((metrics.autoResolved / metrics.ticketsProcessed) * 100);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-purple-500/30 border border-cyan-500/40 shadow-lg shadow-purple-500/20 relative">
            <Brain className="h-7 w-7 text-cyan-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">
              Vanguard Cortex — AI Command Center
            </h1>
            <p className="text-slate-400 text-sm">Autonomous helpdesk operations powered by AI</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/60 border border-cyan-500/30">
            <CircleDot className={`h-4 w-4 ${isAutoPilot ? 'text-green-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-sm text-slate-300">AutoPilot</span>
            <Button
              size="sm"
              variant="ghost"
              className={`h-6 px-2 ${isAutoPilot ? 'text-green-400' : 'text-slate-500'}`}
              onClick={() => setIsAutoPilot(!isAutoPilot)}
            >
              {isAutoPilot ? 'ON' : 'OFF'}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { loadPendingTickets(); detectPatterns(); }}
            className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 bg-black/60"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Tickets Processed</p>
                <p className="text-2xl font-bold bg-gradient-to-b from-white to-cyan-200 bg-clip-text text-transparent">
                  {metrics.ticketsProcessed.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                <Ticket className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12% this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Auto-Resolved</p>
                <p className="text-2xl font-bold bg-gradient-to-b from-white to-green-200 bg-clip-text text-transparent">
                  {autoResolvedPercent}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <Progress value={autoResolvedPercent} className="mt-2 h-1.5 bg-slate-800" />
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Confidence</p>
                <p className="text-2xl font-bold bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">
                  {metrics.avgConfidence}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <Gauge className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-purple-400">
              <Sparkles className="h-3 w-3" />
              <span>High accuracy mode</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Satisfaction Rate</p>
                <p className="text-2xl font-bold bg-gradient-to-b from-white to-amber-200 bg-clip-text text-transparent">
                  {metrics.satisfactionRate}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                <ThumbsUp className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>+5% from AI responses</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto bg-black/60 border border-cyan-500/30 p-1">
          {[
            { value: 'overview', label: 'AI Queue', icon: Ticket },
            { value: 'patterns', label: 'Pattern Detection', icon: GitBranch },
            { value: 'automation', label: 'Automation Rules', icon: Workflow },
            { value: 'analytics', label: 'AI Analytics', icon: BarChart3 },
            { value: 'settings', label: 'AI Settings', icon: Settings }
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:via-blue-500/15 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 text-slate-400"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* AI Queue Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Ticket Queue */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Bot className="h-5 w-5 text-cyan-400" />
                  AI Processing Queue
                </h3>
                <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {pendingTickets.length} pending
                </Badge>
              </div>

              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pr-4">
                  {pendingTickets.length === 0 ? (
                    <Card className="bg-black/60 border-cyan-500/20">
                      <CardContent className="py-12 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
                        <p className="text-slate-300">All tickets processed!</p>
                        <p className="text-slate-500 text-sm">Queue is empty</p>
                      </CardContent>
                    </Card>
                  ) : (
                    pendingTickets.map((ticket, i) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card
                          className={`bg-black/80 border-cyan-500/30 hover:border-purple-500/50 transition-all cursor-pointer ${
                            selectedTicket?.id === ticket.id ? 'border-cyan-400 ring-1 ring-cyan-400/30' : ''
                          }`}
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 shrink-0">
                                <Brain className="h-5 w-5 text-cyan-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-white font-medium truncate">{ticket.title}</h4>
                                  {ticket.ai_confidence_score >= 85 && (
                                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs shrink-0">
                                      <Zap className="h-3 w-3 mr-1" />
                                      Auto
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-slate-500 mb-2">{ticket.requester_name}</p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className={priorityColors[ticket.ai_detected_priority as keyof typeof priorityColors] || priorityColors.medium}>
                                    {ticket.ai_detected_priority || 'medium'}
                                  </Badge>
                                  <Badge variant="outline" className={sentimentColors[ticket.ai_user_sentiment as keyof typeof sentimentColors] || sentimentColors.neutral}>
                                    {ticket.ai_user_sentiment || 'neutral'}
                                  </Badge>
                                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                                    {ticket.ai_detected_category || 'general'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-2xl font-bold text-cyan-400">
                                  {ticket.ai_confidence_score || 0}%
                                </div>
                                <p className="text-xs text-slate-500">confidence</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Ticket Detail / AI Response */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                AI Response Preview
              </h3>

              {selectedTicket ? (
                <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
                  <CardHeader className="border-b border-purple-500/20">
                    <CardTitle className="text-lg text-white">{selectedTicket.title}</CardTitle>
                    <CardDescription className="text-slate-400">
                      Confidence: {selectedTicket.ai_confidence_score}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {selectedTicket.ai_summary && (
                      <div>
                        <p className="text-sm font-medium text-cyan-400 mb-1">AI Summary</p>
                        <p className="text-sm text-slate-300">{selectedTicket.ai_summary}</p>
                      </div>
                    )}
                    
                    {selectedTicket.ai_suggested_solution && (
                      <div>
                        <p className="text-sm font-medium text-purple-400 mb-1">Suggested Response</p>
                        <ScrollArea className="h-48">
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">
                            {selectedTicket.ai_suggested_solution}
                          </p>
                        </ScrollArea>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t border-slate-700">
                      <Button
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                        onClick={() => processTicket(selectedTicket.id, 'approve')}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Send to User
                      </Button>
                      <Button
                        variant="outline"
                        className="border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
                        onClick={() => processTicket(selectedTicket.id, 'escalate')}
                        disabled={isLoading}
                      >
                        Escalate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-black/60 border-cyan-500/20">
                  <CardContent className="py-12 text-center">
                    <Bot className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Select a ticket to preview AI response</p>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card className="bg-black/80 border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-300">Today's AI Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Response Time</span>
                    <span className="text-cyan-400 font-medium">{metrics.avgResponseTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Escalation Rate</span>
                    <span className="text-amber-400 font-medium">{metrics.escalationRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">KB Articles Used</span>
                    <span className="text-purple-400 font-medium">{metrics.kbArticlesGenerated}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Pattern Detection Tab */}
        <TabsContent value="patterns" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
              <CardHeader className="border-b border-purple-500/20">
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <GitBranch className="h-5 w-5" />
                  Detected Patterns (24h)
                </CardTitle>
                <CardDescription className="text-slate-400">
                  AI-identified trends and emerging issues
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {patterns.length > 0 ? (
                    patterns.map((pattern, i) => (
                      <div key={i} className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-white">{pattern.name}</h4>
                            <p className="text-sm text-slate-400 mt-1">{pattern.description}</p>
                          </div>
                          <Badge variant="outline" className={
                            pattern.severity === 'critical' ? priorityColors.critical :
                            pattern.severity === 'high' ? priorityColors.high :
                            pattern.severity === 'medium' ? priorityColors.medium :
                            priorityColors.low
                          }>
                            {pattern.severity}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <span className="text-slate-500">
                            {pattern.ticket_count} related tickets
                          </span>
                          <span className="text-cyan-400">
                            {pattern.affected_category}
                          </span>
                        </div>
                        {pattern.recommended_action && (
                          <p className="mt-2 text-sm text-purple-400">
                            → {pattern.recommended_action}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No patterns detected in the last 24 hours</p>
                      <p className="text-slate-500 text-sm">AI is continuously monitoring ticket trends</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
              <CardHeader className="border-b border-purple-500/20">
                <CardTitle className="flex items-center gap-2 text-purple-400">
                  <Lightbulb className="h-5 w-5" />
                  Proactive Recommendations
                </CardTitle>
                <CardDescription className="text-slate-400">
                  AI-suggested actions to prevent future issues
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {[
                    { title: 'Create KB Article: VPN Connectivity', reason: '15 similar tickets this week', action: 'Generate Article', icon: BookOpen },
                    { title: 'Alert: Email Server Latency', reason: 'Pattern suggests potential outage', action: 'Send Alert', icon: AlertTriangle },
                    { title: 'Update: Password Reset Guide', reason: 'Low resolution rate on existing article', action: 'Review', icon: RefreshCw },
                  ].map((rec, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-purple-500/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                          <rec.icon className="h-4 w-4 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white text-sm">{rec.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{rec.reason}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="text-cyan-400 hover:bg-cyan-500/20 text-xs">
                          {rec.action}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Automation Rules Tab */}
        <TabsContent value="automation" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
              <CardHeader className="border-b border-purple-500/20">
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Workflow className="h-5 w-5" />
                  Active Automation Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {[
                    { name: 'Auto-respond to password resets', condition: 'Category = Security + Confidence ≥ 90%', enabled: true, triggered: 234 },
                    { name: 'Escalate frustrated users', condition: 'Frustration ≥ 7/10', enabled: true, triggered: 45 },
                    { name: 'Priority bump for VIPs', condition: 'User = Executive + Any Priority', enabled: true, triggered: 12 },
                    { name: 'Auto-close resolved after 48h', condition: 'Status = Resolved + No Reply 48h', enabled: false, triggered: 89 },
                  ].map((rule, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-green-400' : 'bg-slate-600'}`} />
                        <div>
                          <h4 className="font-medium text-white text-sm">{rule.name}</h4>
                          <p className="text-xs text-slate-500">{rule.condition}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-cyan-400">{rule.triggered}</p>
                        <p className="text-xs text-slate-500">triggered</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Rule
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
              <CardHeader className="border-b border-purple-500/20">
                <CardTitle className="flex items-center gap-2 text-purple-400">
                  <Mail className="h-5 w-5" />
                  Email Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">Incoming Email Processing</h4>
                      <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Active</Badge>
                    </div>
                    <p className="text-sm text-slate-400">
                      Emails to support@domain.com are automatically parsed, categorized, and processed by AI.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-slate-300">Auto-create tickets from email</span>
                      </div>
                      <Badge variant="outline" className="text-green-400 border-green-500/40">On</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-slate-300">AI categorization & priority</span>
                      </div>
                      <Badge variant="outline" className="text-green-400 border-green-500/40">On</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-slate-300">Sentiment detection</span>
                      </div>
                      <Badge variant="outline" className="text-green-400 border-green-500/40">On</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-slate-300">Auto-response for Tier 1</span>
                      </div>
                      <Badge variant="outline" className="text-green-400 border-green-500/40">On</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
              <CardHeader>
                <CardTitle className="text-cyan-400">Resolution Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Tier 1 (Auto)</span>
                      <span className="text-green-400">{autoResolvedPercent}%</span>
                    </div>
                    <Progress value={autoResolvedPercent} className="h-2 bg-slate-800" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Tier 2 (Tech Review)</span>
                      <span className="text-amber-400">{100 - autoResolvedPercent - 5}%</span>
                    </div>
                    <Progress value={100 - autoResolvedPercent - 5} className="h-2 bg-slate-800" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Escalated</span>
                      <span className="text-red-400">5%</span>
                    </div>
                    <Progress value={5} className="h-2 bg-slate-800" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
              <CardHeader>
                <CardTitle className="text-purple-400">Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { category: 'Password Reset', accuracy: 96 },
                    { category: 'Software Install', accuracy: 89 },
                    { category: 'Network Issues', accuracy: 78 },
                    { category: 'Email Problems', accuracy: 85 },
                    { category: 'Hardware', accuracy: 62 },
                  ].map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={cat.accuracy} className="w-20 h-1.5 bg-slate-800" />
                        <span className="text-xs text-slate-400 w-8">{cat.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
              <CardHeader>
                <CardTitle className="text-amber-400">User Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5 text-green-400" />
                      <span className="text-slate-300">Helpful</span>
                    </div>
                    <span className="text-2xl font-bold text-green-400">94%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-5 w-5 text-red-400" />
                      <span className="text-slate-300">Not Helpful</span>
                    </div>
                    <span className="text-2xl font-bold text-red-400">6%</span>
                  </div>
                  <div className="pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-500">
                      Based on {metrics.ticketsProcessed} user ratings this month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
              <CardHeader className="border-b border-purple-500/20">
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Settings className="h-5 w-5" />
                  AI Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Auto-Response Confidence Threshold</label>
                  <div className="flex items-center gap-4">
                    <Input 
                      type="number" 
                      defaultValue={85} 
                      className="w-24 bg-black/60 border-cyan-500/30 text-white"
                    />
                    <span className="text-slate-400">%</span>
                    <p className="text-xs text-slate-500">Min confidence for Tier 1 auto-response</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Escalation Frustration Level</label>
                  <div className="flex items-center gap-4">
                    <Input 
                      type="number" 
                      defaultValue={7} 
                      className="w-24 bg-black/60 border-cyan-500/30 text-white"
                    />
                    <span className="text-slate-400">/ 10</span>
                    <p className="text-xs text-slate-500">Auto-escalate if frustration ≥ this</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">AI Model</label>
                  <Input 
                    defaultValue="google/gemini-3-flash-preview" 
                    className="bg-black/60 border-cyan-500/30 text-white"
                    disabled
                  />
                  <p className="text-xs text-slate-500">Powered by Lovable AI Gateway</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
              <CardHeader className="border-b border-purple-500/20">
                <CardTitle className="flex items-center gap-2 text-purple-400">
                  <Shield className="h-5 w-5" />
                  Escalation Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-cyan-400" />
                    <div>
                      <p className="text-sm text-white">Email Notification</p>
                      <p className="text-xs text-slate-500">Notify tech team via email</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-white">Callback Scheduling</p>
                      <p className="text-xs text-slate-500">Let users request callbacks</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-amber-400" />
                    <div>
                      <p className="text-sm text-white">Live Chat Handoff</p>
                      <p className="text-xs text-slate-500">Transfer to human agent</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-white">Appointment Booking</p>
                      <p className="text-xs text-slate-500">Schedule support sessions</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-slate-400 border-slate-600">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
