import { useEffect } from 'react';
import { KBArticleGenerator } from '@/components/vanguard/cortex';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

export default function CortexKBGeneratorPage() {
  useEffect(() => {
    document.title = 'KB Generator | Vanguard Cortex';
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
          <ModuleLogo module="cortex" size="lg" glow />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent">
            KB Article Generator
          </h1>
          <p className="text-muted-foreground">Auto-generate knowledge base articles from tickets</p>
        </div>
      </div>

      <KBArticleGenerator />
    </div>
  );
}
