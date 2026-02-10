import { AIAppBuilderWorkspace } from '@/components/ai-builder/AIAppBuilderWorkspace';

export default function AIAppBuilderWorkspacePage() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#09090b]" style={{ height: '100dvh' }}>
      <AIAppBuilderWorkspace />
    </div>
  );
}
