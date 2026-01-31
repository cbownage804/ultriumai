import { useEffect } from 'react';
import { AITicketSummarizer } from '@/components/vanguard/cortex';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

export default function CortexSummarizerPage() {
  useEffect(() => {
    document.title = 'AI Summarizer | Vanguard Cortex';
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
          <ModuleLogo module="cortex" size="lg" glow />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent">
            AI Ticket Summarizer
          </h1>
          <p className="text-muted-foreground">AI-powered ticket thread summarization</p>
        </div>
      </div>

      <AITicketSummarizer />
    </div>
  );
}
