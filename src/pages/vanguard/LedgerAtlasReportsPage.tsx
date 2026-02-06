import { useEffect } from 'react';
import { AtlasReports } from '@/components/vanguard/reports/AtlasReports';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

export default function LedgerAtlasReportsPage() {
  useEffect(() => { document.title = 'Documentation Reports | Vanguard Ledger'; }, []);
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30"><ModuleLogo module="ledger" size="lg" glow /></div>
        <div><h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">Documentation Reports</h1><p className="text-muted-foreground">Atlas documentation coverage, gaps, and staleness analysis</p></div>
      </div>
      <AtlasReports />
    </div>
  );
}
