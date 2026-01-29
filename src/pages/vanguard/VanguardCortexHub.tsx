import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, FileText, GitBranch, Route, BarChart3 } from 'lucide-react';
import { 
  AITicketSummarizer, 
  PatternDetectionEngine, 
  KBArticleGenerator, 
  SmartTicketRouter, 
  CortexAnalyticsDashboard 
} from '@/components/vanguard/cortex';

export default function VanguardCortexHub() {
  const [activeTab, setActiveTab] = useState('summarizer');

  useEffect(() => {
    document.title = 'Cortex AI Hub | Ultrium Vanguard';
  }, []);

  const tabConfig = [
    { value: 'summarizer', label: 'AI Summarizer', icon: FileText },
    { value: 'patterns', label: 'Pattern Detection', icon: GitBranch },
    { value: 'kb-generator', label: 'KB Generator', icon: FileText },
    { value: 'router', label: 'Smart Router', icon: Route },
    { value: 'analytics', label: 'AI Analytics', icon: BarChart3 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 via-cyan-500/20 to-blue-500/30 border border-purple-500/40 shadow-lg shadow-purple-500/20">
            <Brain className="h-7 w-7 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent">
              Vanguard Cortex — AI Hub
            </h1>
            <p className="text-slate-400 text-sm">Intelligent ticket processing, pattern detection, and KB generation</p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-purple-400 via-cyan-500 to-blue-600 text-white px-3 py-1">
          <Brain className="h-3.5 w-3.5 mr-1" />
          AI Intelligence Center
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 h-auto bg-black/60 border border-cyan-500/30 p-1">
          {tabConfig.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:via-cyan-500/15 data-[state=active]:to-blue-500/20 data-[state=active]:text-purple-400 text-slate-400"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline text-xs lg:text-sm">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="summarizer" className="mt-6">
          <AITicketSummarizer />
        </TabsContent>

        <TabsContent value="patterns" className="mt-6">
          <PatternDetectionEngine />
        </TabsContent>

        <TabsContent value="kb-generator" className="mt-6">
          <KBArticleGenerator />
        </TabsContent>

        <TabsContent value="router" className="mt-6">
          <SmartTicketRouter />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <CortexAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
