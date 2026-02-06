import { useEffect } from 'react';
import { HelpdeskDashboard } from '@/components/dashboards/HelpdeskDashboard';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';
import { ModuleIntroBanner } from '@/components/vanguard/shared/ModuleInstructions';

export default function VanguardHelpdesk() {
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
      
      <ModuleIntroBanner
        title="Welcome to Vanguard Response"
        description="Your PSA-grade service desk with AI-powered ticket routing, SLA enforcement, time tracking, and customer satisfaction surveys. Manage tickets, workflows, and escalations from one place."
        features={['AI Ticket Routing', 'SLA Enforcement', 'Time & Billing', 'Email Integration', 'CSAT Surveys', 'Workflow Automation']}
        accentColor="purple"
        storageKey="response-intro"
      />

      <HelpdeskDashboard />
    </div>
  );
}
