import { useEffect } from 'react';
import { CortexAITools } from '@/components/vanguard/cortex';

export default function CortexAIToolsPage() {
  useEffect(() => {
    document.title = 'AI Tools | Ultrium Vanguard';
  }, []);

  return (
    <div className="p-6">
      <CortexAITools />
    </div>
  );
}
