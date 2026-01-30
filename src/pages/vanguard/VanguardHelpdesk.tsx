import { useEffect, useState } from 'react';
import { HelpdeskDashboard } from '@/components/dashboards/HelpdeskDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SLAManagementDashboard, EmailIntegrationHub, CSATSurveyManager, TimeTrackingBilling, TicketWorkflowEngine } from '@/components/vanguard/helpdesk';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

export default function VanguardHelpdesk() {
  const [activeTab, setActiveTab] = useState('tickets');

  useEffect(() => {
    document.title = 'Vanguard Response | Ultrium Vanguard';
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-red-500/30 border border-purple-500/40 shadow-lg shadow-purple-500/20">
          <ModuleLogo module="response" size="lg" glow />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">Vanguard Response</h1>
          <p className="text-slate-400">AI-powered service desk and incident management</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/60 border border-cyan-500/30 flex-wrap h-auto p-1">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-400">Tickets</TabsTrigger>
          <TabsTrigger value="sla" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-400">SLA Management</TabsTrigger>
          <TabsTrigger value="workflows" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-400">Workflows</TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-400">Email Integration</TabsTrigger>
          <TabsTrigger value="time" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-400">Time & Billing</TabsTrigger>
          <TabsTrigger value="csat" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-400">CSAT Surveys</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-6">
          <HelpdeskDashboard />
        </TabsContent>
        <TabsContent value="sla">
          <SLAManagementDashboard />
        </TabsContent>
        <TabsContent value="workflows">
          <TicketWorkflowEngine />
        </TabsContent>
        <TabsContent value="email">
          <EmailIntegrationHub />
        </TabsContent>
        <TabsContent value="time">
          <TimeTrackingBilling />
        </TabsContent>
        <TabsContent value="csat">
          <CSATSurveyManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}