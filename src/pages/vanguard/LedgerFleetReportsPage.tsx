import { useEffect } from 'react';
import { FleetReports } from '@/components/vanguard/reports/FleetReports';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

export default function LedgerFleetReportsPage() {
  useEffect(() => { document.title = 'Fleet Reports | Vanguard Ledger'; }, []);
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30"><ModuleLogo module="ledger" size="lg" glow /></div>
        <div><h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">Fleet & RMM Reports</h1><p className="text-muted-foreground">Device health, patch compliance, and endpoint metrics</p></div>
      </div>
      <FleetReports />
    </div>
  );
}
