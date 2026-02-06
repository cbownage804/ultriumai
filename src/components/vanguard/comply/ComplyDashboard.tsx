import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, Shield, FileText, ClipboardCheck, Target, Database } from 'lucide-react';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';
import { ComplyOverview } from './ComplyOverview';
import { ComplyClientsView } from './ComplyClientsView';
import { ComplyGapAnalysis } from './ComplyGapAnalysis';
import { ComplyEvidenceCollection } from './ComplyEvidenceCollection';
import { ComplianceScanner } from '@/components/vanguard/ComplianceScanner';
import { ComplianceReportGenerator } from '@/components/vanguard/ComplianceReportGenerator';
import { ComplianceScorecard } from '@/components/vanguard/ComplianceScorecard';
import { ModuleIntroBanner, ModuleGettingStarted } from '@/components/vanguard/shared/ModuleInstructions';

export function ComplyDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabConfig = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'clients', label: 'Client Compliance', icon: Users },
    { value: 'gap', label: 'Gap Analysis', icon: Target },
    { value: 'evidence', label: 'Evidence', icon: Database },
    { value: 'scanner', label: 'Scanner', icon: Shield },
    { value: 'scorecard', label: 'Scorecard', icon: ClipboardCheck },
    { value: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/30">
          <ModuleLogo module="comply" size="lg" glow />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-teal-100 to-emerald-200 bg-clip-text text-transparent">
            Vanguard Comply
          </h1>
          <p className="text-muted-foreground">Compliance & audit readiness center</p>
        </div>
      </div>

      {/* Intro Banner */}
      <ModuleIntroBanner
        title="Welcome to Vanguard Comply"
        description="Track compliance across SOC 2, HIPAA, PCI-DSS, ISO 27001, GDPR, GLBA, WISP, and more. Auto-seeded controls, multi-source evidence collection, gap analysis, and audit-ready reports."
        features={['13 Frameworks', 'Auto-Seeded Controls', 'Multi-Source Evidence', 'Gap Analysis', 'Audit Readiness']}
        accentColor="teal"
        storageKey="comply-intro"
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-tour="comply-overview" className="bg-black/40 border border-white/10 flex flex-wrap h-auto">
          {tabConfig.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" data-tour="comply-clients" className="mt-6">
          <ComplyOverview />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <ComplyClientsView />
        </TabsContent>

        <TabsContent value="gap" className="mt-6">
          <ComplyGapAnalysis />
        </TabsContent>

        <TabsContent value="evidence" className="mt-6">
          <ComplyEvidenceCollection />
        </TabsContent>

        <TabsContent value="scanner" className="mt-6">
          <ComplianceScanner />
        </TabsContent>

        <TabsContent value="scorecard" className="mt-6">
          <ComplianceScorecard />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <ComplianceReportGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
