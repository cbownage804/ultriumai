import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, Shield, FileText, ClipboardCheck } from 'lucide-react';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';
import { ComplyOverview } from './ComplyOverview';
import { ComplyClientsView } from './ComplyClientsView';
import { ComplianceScanner } from '@/components/vanguard/ComplianceScanner';
import { ComplianceReportGenerator } from '@/components/vanguard/ComplianceReportGenerator';
import { ComplianceScorecard } from '@/components/vanguard/ComplianceScorecard';

export function ComplyDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabConfig = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'clients', label: 'Client Compliance', icon: Users },
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/40 border border-white/10">
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

        <TabsContent value="overview" className="mt-6">
          <ComplyOverview />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <ComplyClientsView />
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
