import { AIAppBuilderWorkspace } from '@/components/ai-builder/AIAppBuilderWorkspace';
import { PanelErrorBoundary } from '@/components/ai-builder/PanelErrorBoundary';

export default function AIAppBuilderWorkspacePage() {
  return (
    <PanelErrorBoundary panelName="App Builder">
      <div className="fixed inset-0 overflow-hidden bg-[#09090b]" style={{ height: '100dvh' }}>
        <AIAppBuilderWorkspace />
      </div>
    </PanelErrorBoundary>
  );
}
