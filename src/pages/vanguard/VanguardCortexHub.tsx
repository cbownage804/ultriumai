import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  GitBranch, 
  Route, 
  BarChart3,
  Wand2,
  Sparkles,
  ArrowRight,
  Brain,
  Zap
} from 'lucide-react';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';
import { getVanguardBasePath } from '@/utils/subdomain';

const cortexFeatures = [
  {
    title: 'AI Ticket Summarizer',
    description: 'AI-powered ticket thread summarization for quick context',
    icon: FileText,
    path: '/cortex-summarizer',
    badge: 'AI',
    stat: '2.5x faster resolution'
  },
  {
    title: 'Pattern Detection',
    description: 'Detect recurring issues and incident patterns automatically',
    icon: GitBranch,
    path: '/cortex-patterns',
    badge: 'AI',
    stat: '15 patterns detected'
  },
  {
    title: 'KB Article Generator',
    description: 'Auto-generate knowledge base articles from resolved tickets',
    icon: Wand2,
    path: '/cortex-kb',
    badge: 'AI',
    stat: '47 articles generated'
  },
  {
    title: 'Smart Ticket Router',
    description: 'AI-powered ticket routing and assignment optimization',
    icon: Route,
    path: '/cortex-router',
    badge: 'AI',
    stat: '94% routing accuracy'
  },
  {
    title: 'AI Analytics',
    description: 'AI performance metrics and ROI tracking dashboard',
    icon: BarChart3,
    path: '/cortex-analytics',
    badge: null,
    stat: '$12.4k saved this month'
  },
];

export default function VanguardCortexHub() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();

  useEffect(() => {
    document.title = 'Cortex AI Hub | Ultrium Vanguard';
  }, []);

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
              Vanguard Cortex — AI Hub
            </h1>
            <p className="text-slate-400 text-sm">Intelligent ticket processing, pattern detection, and KB generation</p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-purple-400 via-cyan-500 to-blue-600 text-white px-3 py-1">
          <Brain className="h-3 w-3 mr-1" />
          AI Intelligence Center
        </Badge>
      </div>

      {/* Stats Banner */}
      <Card className="bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-blue-500/10 border-purple-500/30">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cortexFeatures.map((feature) => (
          <Card 
            key={feature.title}
            className="bg-black/40 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200 cursor-pointer group"
            onClick={() => navigate(`${basePath}${feature.path}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <feature.icon className="h-5 w-5 text-purple-400" />
                </div>
                {feature.badge && (
                  <Badge className="bg-gradient-to-r from-purple-400 to-cyan-500 text-white text-xs">
                    <Zap className="h-2 w-2 mr-1" />
                    {feature.badge}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg text-white group-hover:text-purple-300 transition-colors">
                {feature.title}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-cyan-400">{feature.stat}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                >
                  Open
                  <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
