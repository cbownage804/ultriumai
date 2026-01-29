import { useEffect } from 'react';
import { HorizonDashboard } from '@/components/vanguard/HorizonDashboard';

export default function VanguardRMM() {
  useEffect(() => {
    document.title = 'Vanguard Horizon | Ultrium Vanguard';
  }, []);

  return (
    <div className="container mx-auto p-6">
      <HorizonDashboard />
    </div>
  );
}
