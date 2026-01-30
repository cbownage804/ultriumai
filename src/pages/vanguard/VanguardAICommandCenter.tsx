import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, Sparkles, Zap, TrendingUp, Clock,
  CheckCircle2, ArrowUpRight,
  Mail, RefreshCw, Ticket, MessageSquare,
  Gauge, CircleDot, GitBranch, BarChart3, Headphones, Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

// Import sub-components
import { EmailAutomationEngine } from '@/components/vanguard/ai-command/EmailAutomationEngine';
import { RealTimeAnalytics } from '@/components/vanguard/ai-command/RealTimeAnalytics';
import { PatternDetectionAutoKB } from '@/components/vanguard/ai-command/PatternDetectionAutoKB';
import { FullEscalationSuite } from '@/components/vanguard/ai-command/FullEscalationSuite';
import { AILiveChatWidget } from '@/components/vanguard/ai-command/AILiveChatWidget';

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

export default function VanguardAICommandCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<AIMetrics>(DEMO_METRICS);
  const [isAutoPilot, setIsAutoPilot] = useState(true);
  const [showChatPreview, setShowChatPreview] = useState(false);

  // Live metric updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        ticketsProcessed: prev.ticketsProcessed + Math.floor(Math.random() * 2),
        autoResolved: prev.autoResolved + Math.floor(Math.random() * 2),
        satisfactionRate: 92 + Math.floor(Math.random() * 6)
      }));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const autoResolvedPercent = Math.round((metrics.autoResolved / metrics.ticketsProcessed) * 100);

  const tabConfig = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'email', label: 'Email Engine', icon: Mail },
    { value: 'patterns', label: 'Pattern Detection', icon: GitBranch },
    { value: 'escalations', label: 'Escalation Suite', icon: Headphones },
    { value: 'chatbot', label: 'AI Chatbot', icon: MessageSquare },
    { value: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-purple-500/30 border border-cyan-500/40 shadow-lg shadow-purple-500/20 relative">
            <ModuleLogo module="cortex" size="lg" glow />
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
            <p className="text-slate-400 text-sm">Full-stack AI helpdesk automation & escalation management</p>
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
          <Badge className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white px-3 py-1">
            <Zap className="h-3.5 w-3.5 mr-1" />
            AI ENABLED
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Tickets Processed</p>
                <motion.p
                  key={metrics.ticketsProcessed}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold bg-gradient-to-b from-white to-cyan-200 bg-clip-text text-transparent"
                >
                  {metrics.ticketsProcessed.toLocaleString()}
                </motion.p>
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
                <p className="text-sm text-slate-400">Response Time</p>
                <p className="text-2xl font-bold bg-gradient-to-b from-white to-amber-200 bg-clip-text text-transparent">
                  {metrics.avgResponseTime}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>Faster than humans</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto bg-black/60 border border-cyan-500/30 p-1">
          {tabConfig.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:via-blue-500/15 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 text-slate-400"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline text-xs lg:text-sm">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab - Analytics Dashboard */}
        <TabsContent value="overview" className="mt-6">
          <RealTimeAnalytics />
        </TabsContent>

        {/* Email Automation Tab */}
        <TabsContent value="email" className="mt-6">
          <EmailAutomationEngine />
        </TabsContent>

        {/* Pattern Detection Tab */}
        <TabsContent value="patterns" className="mt-6">
          <PatternDetectionAutoKB />
        </TabsContent>

        {/* Escalation Suite Tab */}
        <TabsContent value="escalations" className="mt-6">
          <FullEscalationSuite />
        </TabsContent>

        {/* AI Chatbot Tab */}
        <TabsContent value="chatbot" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <Card className="bg-black/80 border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    AI Chatbot Preview
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Live preview of the customer-facing AI chat widget
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AILiveChatWidget customerName="Demo User" />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-black/80 border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-purple-400 text-sm">Chatbot Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <div>
                      <p className="text-sm text-white">Auto-Escalation Threshold</p>
                      <p className="text-xs text-slate-500">Escalate when confidence below this %</p>
                    </div>
                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-400">60%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <div>
                      <p className="text-sm text-white">KB Integration</p>
                      <p className="text-xs text-slate-500">Search knowledge base for answers</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <div>
                      <p className="text-sm text-white">Video Call Escalation</p>
                      <p className="text-xs text-slate-500">Allow customers to request video calls</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <div>
                      <p className="text-sm text-white">Screen Share Requests</p>
                      <p className="text-xs text-slate-500">Allow remote assistance</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Enabled</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/80 border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-amber-400 text-sm">Chatbot Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Conversations Today</span>
                    <span className="font-bold text-white">247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Auto-Resolved</span>
                    <span className="font-bold text-green-400">89%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Avg Session Duration</span>
                    <span className="font-bold text-purple-400">4.2 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">User Satisfaction</span>
                    <span className="font-bold text-amber-400">4.7/5</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-black/80 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  AI Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <p className="text-sm text-white mb-2">AI Model</p>
                  <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    google/gemini-3-flash-preview
                  </Badge>
                  <p className="text-xs text-slate-500 mt-2">Powered by Lovable AI Gateway</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <p className="text-sm text-white mb-2">Auto-Response Threshold</p>
                  <div className="flex items-center gap-4">
                    <Progress value={85} className="flex-1 h-2 bg-slate-800" />
                    <span className="text-cyan-400 font-bold">85%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Min confidence for Tier 1 auto-response</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <p className="text-sm text-white mb-2">Frustration Escalation Level</p>
                  <div className="flex items-center gap-4">
                    <Progress value={70} className="flex-1 h-2 bg-slate-800" />
                    <span className="text-amber-400 font-bold">7/10</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Auto-escalate if frustration ≥ this level</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/80 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Escalation Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Live Chat Handoff', description: 'Transfer to human agent', enabled: true },
                  { name: 'Callback Scheduling', description: 'Let users request callbacks', enabled: true },
                  { name: 'Video Call Escalation', description: 'Face-to-face support', enabled: true },
                  { name: 'Screen Share Sessions', description: 'Remote assistance', enabled: true },
                  { name: 'Appointment Booking', description: 'Schedule support sessions', enabled: false }
                ].map((channel) => (
                  <div key={channel.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <div>
                      <p className="text-sm text-white">{channel.name}</p>
                      <p className="text-xs text-slate-500">{channel.description}</p>
                    </div>
                    <Badge className={channel.enabled 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }>
                      {channel.enabled ? 'Enabled' : 'Coming Soon'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
