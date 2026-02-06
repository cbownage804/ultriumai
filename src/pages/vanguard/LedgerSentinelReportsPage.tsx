import { useEffect } from 'react';
import { SentinelReports } from '@/components/vanguard/reports/SentinelReports';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

export default function LedgerSentinelReportsPage() {
  useEffect(() => { document.title = 'Sentinel Reports | Vanguard Ledger'; }, []);
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><ModuleLogo module="ledger" size="lg" glow /></div>
        <div><h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">SaaS Security Reports</h1><p className="text-muted-foreground">M365 & Google Workspace alert trends from Sentinel</p></div>
      </div>
      <SentinelReports />
    </div>
  );
}
