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
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
          <ModuleLogo module="response" size="lg" glow />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">Vanguard Response</h1>
          <p className="text-white/60">AI-powered service desk and incident management</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-background/50 border flex-wrap h-auto p-1 mb-6">
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="sla">SLA Management</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="email">Email Integration</TabsTrigger>
          <TabsTrigger value="time">Time & Billing</TabsTrigger>
          <TabsTrigger value="csat">CSAT Surveys</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
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