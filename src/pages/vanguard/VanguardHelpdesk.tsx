import { useEffect } from 'react';
import { HelpdeskDashboard } from '@/components/dashboards/HelpdeskDashboard';

export default function VanguardHelpdesk() {
  useEffect(() => {
    document.title = 'SafeDesk Helpdesk | Ultrium Vanguard';
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">SafeDesk™ Helpdesk</h1>
        <p className="text-white/60">AI-powered IT service desk and ticket management</p>
      </div>
      <HelpdeskDashboard />
    </div>
  );
}
