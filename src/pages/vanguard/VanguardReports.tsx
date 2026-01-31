import { useState } from 'react';
import { VanguardTabs, VanguardTabContent, VanguardTab } from '@/components/vanguard/shared';
import { 
  Calendar, 
  FileText, 
  GitBranch,
  TrendingUp,
  Ticket
} from 'lucide-react';
import { ScheduledScansManager } from '@/components/vanguard/ScheduledScansManager';
import { ComplianceReportGenerator } from '@/components/vanguard/ComplianceReportGenerator';
import { AttackPathVisualization } from '@/components/vanguard/AttackPathVisualization';
import { VanguardAnalyticsDashboard } from '@/components/vanguard/VanguardAnalyticsDashboard';
import { HelpdeskReports } from '@/components/vanguard/reports/HelpdeskReports';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

const reportTabs: VanguardTab[] = [
  { id: 'helpdesk', label: 'Helpdesk', icon: Ticket },
  { id: 'analytics', label: 'Security', icon: TrendingUp },
  { id: 'scheduled', label: 'Scheduled', icon: Calendar },
  { id: 'generate', label: 'Compliance', icon: FileText },
  { id: 'attack-path', label: 'Attack Paths', icon: GitBranch },
];

export default function VanguardReports() {
  const [activeTab, setActiveTab] = useState('helpdesk');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-purple-500/30 border border-cyan-500/40 shadow-lg shadow-purple-500/20">
          <ModuleLogo module="ledger" size="lg" glow />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">Vanguard Ledger</h1>
          <p className="text-slate-400">Helpdesk reports, compliance, and security analytics</p>
        </div>
      </div>

      <VanguardTabs
        tabs={reportTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme="cyan"
      >
        <VanguardTabContent value="helpdesk" className="mt-6">
          <HelpdeskReports />
        </VanguardTabContent>

        <VanguardTabContent value="analytics" className="mt-6">
          <VanguardAnalyticsDashboard />
        </VanguardTabContent>

        <VanguardTabContent value="scheduled" className="mt-6">
          <ScheduledScansManager />
        </VanguardTabContent>

        <VanguardTabContent value="generate" className="mt-6">
          <ComplianceReportGenerator />
        </VanguardTabContent>

        <VanguardTabContent value="attack-path" className="mt-6">
          <AttackPathVisualization />
        </VanguardTabContent>
      </VanguardTabs>
    </div>
  );
}
