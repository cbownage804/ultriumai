import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, GitBranch, Route, BarChart3, Wand2, Sparkles, ArrowRight, Brain, Zap, Video,
  Mail, Shield, HardDrive, Mic, Bot, Activity, Terminal, Heart, MessageSquareText, Clock,
  Search, Users, Settings, Layers, Target, TrendingUp, AlertTriangle, Calendar,
  Star, CheckCircle, Play
} from 'lucide-react';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';
import { getVanguardBasePath } from '@/utils/subdomain';
import { ModuleIntroBanner } from '@/components/vanguard/shared/ModuleInstructions';

// Tool categories for organization
const toolCategories = {
  ticketing: {
    name: 'Ticket Intelligence',
    icon: FileText,
    description: 'AI-powered ticket processing and routing',
    tools: [
      { id: 'summarizer', name: 'Ticket Summarizer', icon: FileText, path: '/cortex-summarizer', description: 'AI summarization of ticket threads', stat: '2.5x faster' },
      { id: 'router', name: 'Smart Ticket Router', icon: Route, path: '/ai-routing', description: 'Intelligent ticket assignment', stat: '94% accuracy' },
      { id: 'response', name: 'Response Draft Generator', icon: MessageSquareText, path: '/cortex-ai-tools', description: 'Auto-generate professional responses', stat: 'Instant drafts' },
      { id: 'email', name: 'Email Parser', icon: Mail, path: '/cortex-ai-tools', description: 'Extract ticket details from emails', stat: 'Auto-extract' },
      { id: 'voice', name: 'Voice to Ticket', icon: Mic, path: '/cortex-ai-tools', description: 'Transcribe voice to tickets', stat: 'Voice → Docs' },
    ]
  },
  analytics: {
    name: 'Predictive Analytics',
    icon: TrendingUp,
    description: 'Forecasting and pattern detection',
    tools: [
      { id: 'sla', name: 'SLA Predictor', icon: Clock, path: '/cortex-ai-tools', description: 'Predict SLA breaches', stat: 'Proactive alerts' },
      { id: 'patterns', name: 'Pattern Detection', icon: GitBranch, path: '/cortex-patterns', description: 'Detect recurring issues', stat: '15 patterns' },
      { id: 'root', name: 'Root Cause Analyzer', icon: Search, path: '/cortex-ai-tools', description: 'Identify root causes', stat: 'Deep analysis' },
      { id: 'anomaly', name: 'Anomaly Detection', icon: Activity, path: '/cortex-ai-tools', description: 'Detect unusual patterns', stat: 'Real-time' },
      { id: 'analytics', name: 'AI Analytics Dashboard', icon: BarChart3, path: '/cortex-analytics', description: 'Performance metrics & ROI', stat: '$12.4k saved' },
    ]
  },
  customer: {
    name: 'Customer Intelligence',
    icon: Users,
    description: 'Customer health and satisfaction',
    tools: [
      { id: 'sentiment', name: 'Sentiment Analyzer', icon: Heart, path: '/cortex-ai-tools', description: 'Analyze customer sentiment', stat: 'Risk detection' },
      { id: 'health', name: 'Customer Health Score', icon: Users, path: '/cortex-ai-tools', description: 'Calculate health & churn risk', stat: 'Churn prevention' },
      { id: 'csat', name: 'CSAT Survey System', icon: Star, path: '/csat-surveys', description: 'Satisfaction surveys & analysis', stat: 'AI insights' },
    ]
  },
  automation: {
    name: 'Workflow Automation',
    icon: Zap,
    description: 'Automated escalation and responses',
    tools: [
      { id: 'escalation', name: 'Escalation Engine', icon: AlertTriangle, path: '/escalation', description: 'Automated escalation rules', stat: 'Auto-trigger' },
      { id: 'kb', name: 'KB Article Generator', icon: Wand2, path: '/cortex-kb', description: 'Auto-generate KB articles', stat: '47 articles' },
      { id: 'scripts', name: 'Script Generator', icon: Terminal, path: '/cortex-ai-tools', description: 'Generate PowerShell/Bash scripts', stat: 'Code automation' },
      { id: 'reports', name: 'Scheduled Reports', icon: Calendar, path: '/report-scheduler', description: 'Automated report generation', stat: 'Auto-deliver' },
    ]
  },
  security: {
    name: 'Security & Compliance',
    icon: Shield,
    description: 'Security reports and asset analysis',
    tools: [
      { id: 'security', name: 'Security Report Generator', icon: Shield, path: '/cortex-ai-tools', description: 'Generate compliance reports', stat: 'SOC2/ISO/HIPAA' },
      { id: 'asset', name: 'Asset Discovery Analyzer', icon: HardDrive, path: '/cortex-ai-tools', description: 'Vision-analyze screenshots', stat: 'Auto-discover' },
      { id: 'copilot', name: 'Technician Copilot', icon: Bot, path: '/cortex-ai-tools', description: 'Real-time troubleshooting', stat: 'KB suggestions' },
    ]
  },
  content: {
    name: 'Content Creation',
    icon: Video,
    description: 'Documentation and knowledge creation',
    tools: [
      { id: 'screen', name: 'Screen Recording to Docs', icon: Video, path: '/cortex-screen-to-docs', description: 'Record screen → generate docs', stat: 'Auto-guides' },
    ]
  }
};

export default function VanguardCortexHub() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Cortex AI Hub | Vanguard';
  }, []);

  const allTools = Object.values(toolCategories).flatMap(cat => cat.tools);
  const enabledCount = allTools.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 via-cyan-500/20 to-blue-500/30 border border-purple-500/40 shadow-lg shadow-purple-500/20">
            <ModuleLogo module="cortex" size="lg" glow />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent">
              Vanguard Cortex — AI Command Center
            </h1>
            <p className="text-slate-400 text-sm">Unified AI intelligence hub with {enabledCount} specialized tools</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`${basePath}/cortex-settings`)}
            className="border-purple-500/30 hover:bg-purple-500/10"
          >
            <Settings className="h-4 w-4 mr-2" />
            AI Settings
          </Button>
          <Badge className="bg-gradient-to-r from-purple-400 via-cyan-500 to-blue-600 text-white px-3 py-1">
            <Brain className="h-3 w-3 mr-1" />
            {enabledCount} AI Tools Active
          </Badge>
        </div>
      </div>

      {/* Intro Banner */}
      <ModuleIntroBanner
        title="Welcome to Vanguard Cortex"
        description="Your AI command center. Cortex uses machine learning to automate ticket routing, summarize conversations, predict SLA breaches, detect anomalies, and generate knowledge base articles."
        features={['Smart Ticket Routing', 'AI Summarization', 'Pattern Detection', 'KB Generation', 'Anomaly Detection', 'Screen-to-Docs']}
        accentColor="purple"
        storageKey="cortex-intro"
      />

      {/* Quick Stats */}
      <Card className="bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-blue-500/10 border-purple-500/30">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">1,247</div>
              <div className="text-xs text-slate-400">Tickets Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">94%</div>
              <div className="text-xs text-slate-400">Routing Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">2.5x</div>
              <div className="text-xs text-slate-400">Faster Resolution</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">$12.4k</div>
              <div className="text-xs text-slate-400">Saved This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">47</div>
              <div className="text-xs text-slate-400">KB Articles Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">15</div>
              <div className="text-xs text-slate-400">Patterns Detected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All Tools</TabsTrigger>
          <TabsTrigger value="ticketing">Ticketing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {Object.entries(toolCategories).map(([key, category]) => (
            <Card key={key} className="bg-black/40 border-purple-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <category.icon className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {category.tools.map((tool) => (
                    <div
                      key={tool.id}
                      onClick={() => navigate(`${basePath}${tool.path}`)}
                      className="p-3 border border-purple-500/20 rounded-lg hover:border-purple-500/50 hover:bg-purple-500/5 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 rounded-md bg-purple-500/10">
                          <tool.icon className="h-4 w-4 text-purple-400" />
                        </div>
                        <span className="font-medium text-sm group-hover:text-purple-300">{tool.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{tool.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{tool.stat}</Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {Object.entries(toolCategories).map(([key, category]) => (
          <TabsContent key={key} value={key} className="space-y-4">
            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                      <category.icon className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-400">
                    {category.tools.length} Tools
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.tools.map((tool) => (
                    <Card
                      key={tool.id}
                      onClick={() => navigate(`${basePath}${tool.path}`)}
                      className="border-purple-500/20 hover:border-purple-500/50 cursor-pointer transition-all group"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="p-2 rounded-lg bg-purple-500/10">
                            <tool.icon className="h-5 w-5 text-purple-400" />
                          </div>
                          <Badge className="bg-gradient-to-r from-purple-400 to-cyan-500 text-white text-xs">
                            <Zap className="h-2 w-2 mr-1" />
                            AI
                          </Badge>
                        </div>
                        <CardTitle className="text-lg group-hover:text-purple-300">{tool.name}</CardTitle>
                        <CardDescription>{tool.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-cyan-400">{tool.stat}</span>
                          <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                            Open <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-purple-500/5 to-cyan-500/5 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="h-5 w-5 text-purple-400" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate(`${basePath}/cortex-ai-tools`)} className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300">
              <Bot className="h-4 w-4 mr-2" />
              Open AI Toolkit
            </Button>
            <Button onClick={() => navigate(`${basePath}/cortex-settings`)} variant="outline" className="border-purple-500/30">
              <Settings className="h-4 w-4 mr-2" />
              Configure AI Settings
            </Button>
            <Button onClick={() => navigate(`${basePath}/cortex-analytics`)} variant="outline" className="border-cyan-500/30">
              <BarChart3 className="h-4 w-4 mr-2" />
              View AI Analytics
            </Button>
            <Button onClick={() => navigate(`${basePath}/ai-routing`)} variant="outline" className="border-blue-500/30">
              <Route className="h-4 w-4 mr-2" />
              Ticket Router
            </Button>
            <Button onClick={() => navigate(`${basePath}/escalation`)} variant="outline" className="border-orange-500/30">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Escalation Rules
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
