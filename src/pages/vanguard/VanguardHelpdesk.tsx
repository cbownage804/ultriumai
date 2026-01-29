import { useEffect } from 'react';
import { HelpdeskDashboard } from '@/components/dashboards/HelpdeskDashboard';
import { Headphones } from 'lucide-react';

export default function VanguardHelpdesk() {
  useEffect(() => {
    document.title = 'Service Desk | Ultrium Vanguard';
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
          <Headphones className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Service Desk</h1>
          <p className="text-white/60">AI-powered IT service desk and ticket management</p>
        </div>
      </div>
      <HelpdeskDashboard />
    </div>
  );
}
