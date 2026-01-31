import { useEffect, useState } from 'react';
import { HelpdeskDashboard } from '@/components/dashboards/HelpdeskDashboard';
import { VanguardTabs, VanguardTabContent, VanguardTab } from '@/components/vanguard/shared';
import { SLAManagementDashboard, EmailIntegrationHub, CSATSurveyManager, TimeTrackingBilling, TicketWorkflowEngine } from '@/components/vanguard/helpdesk';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';
import { Ticket, Clock, Workflow, Mail, DollarSign, Star } from 'lucide-react';

const helpdeskTabs: VanguardTab[] = [
  { id: 'tickets', label: 'Tickets', icon: Ticket },
  { id: 'sla', label: 'SLA Management', icon: Clock },
  { id: 'workflows', label: 'Workflows', icon: Workflow },
  { id: 'email', label: 'Email Integration', icon: Mail },
  { id: 'time', label: 'Time & Billing', icon: DollarSign },
  { id: 'csat', label: 'CSAT Surveys', icon: Star },
];

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
      
      <VanguardTabs
        tabs={helpdeskTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme="purple"
      >
        <VanguardTabContent value="tickets" className="mt-6">
          <HelpdeskDashboard />
        </VanguardTabContent>
        <VanguardTabContent value="sla" className="mt-6">
          <SLAManagementDashboard />
        </VanguardTabContent>
        <VanguardTabContent value="workflows" className="mt-6">
          <TicketWorkflowEngine />
        </VanguardTabContent>
        <VanguardTabContent value="email" className="mt-6">
          <EmailIntegrationHub />
        </VanguardTabContent>
        <VanguardTabContent value="time" className="mt-6">
          <TimeTrackingBilling />
        </VanguardTabContent>
        <VanguardTabContent value="csat" className="mt-6">
          <CSATSurveyManager />
        </VanguardTabContent>
      </VanguardTabs>
    </div>
  );
}