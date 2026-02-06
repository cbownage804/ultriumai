import { useEffect } from 'react';
import { ComplianceReportGenerator } from '@/components/vanguard/ComplianceReportGenerator';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';
import { ModuleIntroBanner } from '@/components/vanguard/shared/ModuleInstructions';

export default function LedgerCompliancePage() {
  useEffect(() => {
    document.title = 'Compliance Reports | Vanguard Ledger';
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
          <ModuleLogo module="ledger" size="lg" glow />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">
            Compliance Reports
          </h1>
          <p className="text-muted-foreground">Generate compliance and audit reports</p>
        </div>
      </div>

      <ModuleIntroBanner
        title="Compliance Reporting"
        description="Generate PDF and CSV compliance reports from completed scan results. Select a completed scan, customize report options, and export audit-ready documentation."
        features={['PDF Report Generation', 'CSV Export', 'Evidence Inclusion', 'Remediation Steps', 'Executive Summaries']}
        accentColor="cyan"
        storageKey="ledger-compliance-intro"
      />

      <div data-tour="ledger-reports">
        <ComplianceReportGenerator />
      </div>
    </div>
  );
}
