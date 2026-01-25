import { useEffect } from 'react';
import { RMMDashboard } from '@/components/rmm/RMMDashboard';

export default function VanguardRMM() {
  useEffect(() => {
    document.title = 'SafeOps RMM | Ultrium Vanguard';
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">SafeOps™ RMM</h1>
        <p className="text-white/60">Remote monitoring, endpoint management, and automation</p>
      </div>
      <RMMDashboard />
    </div>
  );
}
