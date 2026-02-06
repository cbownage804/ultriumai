import { useEffect } from 'react';
import { ExecutiveReport } from '@/components/vanguard/reports/ExecutiveReport';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

export default function LedgerExecutiveReportPage() {
  useEffect(() => { document.title = 'Executive Report | Vanguard Ledger'; }, []);
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30"><ModuleLogo module="ledger" size="lg" glow /></div>
        <div><h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">Executive Report</h1><p className="text-muted-foreground">AI-powered cross-module executive summary</p></div>
      </div>
      <ExecutiveReport />
    </div>
  );
}
