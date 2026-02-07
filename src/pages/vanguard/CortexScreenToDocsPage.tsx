import { useEffect } from 'react';
import { ScreenRecordingKBGenerator } from '@/components/vanguard/cortex/ScreenRecordingKBGenerator';

export default function CortexScreenToDocsPage() {
  useEffect(() => {
    document.title = 'Screen to Docs | Vanguard';
  }, []);

  return (
    <div className="p-6">
      <ScreenRecordingKBGenerator />
    </div>
  );
}
