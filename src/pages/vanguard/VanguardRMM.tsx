import { useEffect } from 'react';
import { RMMDashboard } from '@/components/rmm/RMMDashboard';
import { Monitor } from 'lucide-react';

export default function VanguardRMM() {
  useEffect(() => {
    document.title = 'Endpoint Management | Ultrium Vanguard';
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
          <Monitor className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Endpoint Management</h1>
          <p className="text-white/60">Remote monitoring, endpoint management, and automation</p>
        </div>
      </div>
      <RMMDashboard />
    </div>
  );
}
