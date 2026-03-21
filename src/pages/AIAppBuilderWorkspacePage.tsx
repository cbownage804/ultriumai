import { useState, useCallback } from 'react';
import { AIAppBuilderWorkspace } from '@/components/ai-builder/AIAppBuilderWorkspace';
import { PanelErrorBoundary } from '@/components/ai-builder/PanelErrorBoundary';

export default function AIAppBuilderWorkspacePage() {
  const [recoveryKey, setRecoveryKey] = useState(0);

  const handleResetWorkspace = useCallback(() => {
    setRecoveryKey(prev => prev + 1);
  }, []);

  return (
    <PanelErrorBoundary panelName="App Builder" onResetWorkspace={handleResetWorkspace}>
      <div key={recoveryKey} className="fixed inset-0 overflow-hidden bg-[#09090b]" style={{ height: '100dvh' }}>
        <AIAppBuilderWorkspace />
      </div>
    </PanelErrorBoundary>
  );
}
