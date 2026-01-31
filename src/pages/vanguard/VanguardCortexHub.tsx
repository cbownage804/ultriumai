import { useEffect, useState } from 'react';
import { VanguardTabs, VanguardTabContent, VanguardTab } from '@/components/vanguard/shared';
import { Badge } from '@/components/ui/badge';
import { FileText, GitBranch, Route, BarChart3 } from 'lucide-react';
import { 
  AITicketSummarizer, 
  PatternDetectionEngine, 
  KBArticleGenerator, 
  SmartTicketRouter, 
  CortexAnalyticsDashboard 
} from '@/components/vanguard/cortex';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

const cortexTabs: VanguardTab[] = [
  { id: 'summarizer', label: 'AI Summarizer', icon: FileText },
  { id: 'patterns', label: 'Pattern Detection', icon: GitBranch },
  { id: 'kb-generator', label: 'KB Generator', icon: FileText },
  { id: 'router', label: 'Smart Router', icon: Route },
  { id: 'analytics', label: 'AI Analytics', icon: BarChart3 },
];

export default function VanguardCortexHub() {
  const [activeTab, setActiveTab] = useState('summarizer');

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
          <ModuleLogo module="cortex" size="xs" className="mr-1" />
          AI Intelligence Center
        </Badge>
      </div>

      {/* Tabs */}
      <VanguardTabs
        tabs={cortexTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme="purple"
      >
        <VanguardTabContent value="summarizer" className="mt-6">
          <AITicketSummarizer />
        </VanguardTabContent>

        <VanguardTabContent value="patterns" className="mt-6">
          <PatternDetectionEngine />
        </VanguardTabContent>

        <VanguardTabContent value="kb-generator" className="mt-6">
          <KBArticleGenerator />
        </VanguardTabContent>

        <VanguardTabContent value="router" className="mt-6">
          <SmartTicketRouter />
        </VanguardTabContent>

        <VanguardTabContent value="analytics" className="mt-6">
          <CortexAnalyticsDashboard />
        </VanguardTabContent>
      </VanguardTabs>
    </div>
  );
}
