import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto bg-black/60 border border-cyan-500/30 p-1">
          <TabsTrigger 
            value="helpdesk" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:via-blue-500/15 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/40 text-slate-400"
          >
            <Ticket className="h-4 w-4" />
            <span className="hidden sm:inline">Helpdesk</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:via-blue-500/15 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/40 text-slate-400"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger 
            value="scheduled" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:via-blue-500/15 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/40 text-slate-400"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Scheduled</span>
          </TabsTrigger>
          <TabsTrigger 
            value="generate" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:via-blue-500/15 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/40 text-slate-400"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Compliance</span>
          </TabsTrigger>
          <TabsTrigger 
            value="attack-path" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:via-blue-500/15 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/40 text-slate-400"
          >
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Attack Paths</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="helpdesk">
          <HelpdeskReports />
        </TabsContent>

        <TabsContent value="analytics">
          <VanguardAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="scheduled">
          <ScheduledScansManager />
        </TabsContent>

        <TabsContent value="generate">
          <ComplianceReportGenerator />
        </TabsContent>

        <TabsContent value="attack-path">
          <AttackPathVisualization />
        </TabsContent>
      </Tabs>
    </div>
  );
}
