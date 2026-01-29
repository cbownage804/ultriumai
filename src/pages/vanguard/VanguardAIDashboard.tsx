import { Bot, Sparkles, Wand2, FileText, BarChart3, Zap, Brain, MessageSquare, TrendingUp, Activity, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

const VanguardAIDashboard = () => {
  const navigate = useNavigate();

  const aiModules = [
    {
      title: "KB Generator",
      description: "AI-powered knowledge base article generation",
      icon: Wand2,
      path: "/vanguard/ai-knowledge",
      status: "active",
      stats: "12 articles generated this week"
    },
    {
      title: "Session Summaries",
      description: "Automated session analysis and insights",
      icon: FileText,
      path: "/vanguard/ai-sessions",
      status: "active",
      stats: "47 sessions analyzed"
    },
    {
      title: "AI Analytics",
      description: "Performance metrics and optimization insights",
      icon: Sparkles,
      path: "/vanguard/ai-analytics",
      status: "active",
      stats: "Real-time monitoring"
    },
  ];

  const recentActivity = [
    { action: "Knowledge article generated", time: "2 min ago", type: "success" },
    { action: "Session summary created", time: "15 min ago", type: "success" },
    { action: "Threat analysis completed", time: "1 hour ago", type: "success" },
    { action: "Auto-remediation triggered", time: "2 hours ago", type: "info" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-purple-500/30 border border-cyan-500/40 shadow-lg shadow-purple-500/20">
            <Bot className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">
              Vanguard Cortex — AI Dashboard
            </h1>
            <p className="text-slate-400">AI-powered insights and automation across the platform</p>
          </div>
        </div>
        <span className="flex items-center gap-2 text-sm bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-full font-bold shadow-lg shadow-purple-500/30">
          <Zap className="h-3.5 w-3.5" />
          AI ENABLED
        </span>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">AI Operations Today</p>
                <p className="text-3xl font-bold bg-gradient-to-b from-white to-cyan-200 bg-clip-text text-transparent">156</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                <Brain className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Time Saved</p>
                <p className="text-3xl font-bold bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">12.5h</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <Clock className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Auto-Resolutions</p>
                <p className="text-3xl font-bold bg-gradient-to-b from-white to-green-200 bg-clip-text text-transparent">28</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/30">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Accuracy Rate</p>
                <p className="text-3xl font-bold bg-gradient-to-b from-white to-blue-200 bg-clip-text text-transparent">94%</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Modules Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          AI Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiModules.map((module) => (
            <Card 
              key={module.title}
              className="bg-black/80 border-cyan-500/30 hover:border-purple-500/50 transition-all cursor-pointer shadow-xl shadow-purple-500/10 hover:shadow-purple-500/20 group"
              onClick={() => navigate(module.path)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-purple-500/20 border border-cyan-500/30 group-hover:border-purple-500/40 transition-colors">
                    <module.icon className="h-5 w-5 text-cyan-400 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider text-green-400 bg-green-500/20 px-2 py-0.5 rounded border border-green-500/30">
                    ACTIVE
                  </span>
                </div>
                <CardTitle className="text-white text-lg mt-3 group-hover:text-cyan-300 transition-colors">
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-3">{module.description}</p>
                <p className="text-xs text-cyan-400/80">{module.stats}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Copilot Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
          <CardHeader className="border-b border-purple-500/10">
            <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
              <Activity className="h-4 w-4 drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
              AI Copilot Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Ticket Analysis</span>
                <span className="text-cyan-400">78%</span>
              </div>
              <Progress value={78} className="h-2 bg-slate-800" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Knowledge Generation</span>
                <span className="text-purple-400">65%</span>
              </div>
              <Progress value={65} className="h-2 bg-slate-800" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Threat Detection</span>
                <span className="text-blue-400">92%</span>
              </div>
              <Progress value={92} className="h-2 bg-slate-800" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Auto-Remediation</span>
                <span className="text-green-400">45%</span>
              </div>
              <Progress value={45} className="h-2 bg-slate-800" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
          <CardHeader className="border-b border-purple-500/10">
            <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
              Recent AI Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {recentActivity.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-cyan-500/10 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${item.type === 'success' ? 'bg-green-400' : 'bg-blue-400'}`} />
                  <span className="text-sm text-slate-200">{item.action}</span>
                </div>
                <span className="text-xs text-slate-500">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VanguardAIDashboard;
