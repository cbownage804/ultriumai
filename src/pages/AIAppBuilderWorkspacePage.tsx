import Navigation from '@/components/Navigation';
import { AIAppBuilderWorkspace } from '@/components/ai-builder/AIAppBuilderWorkspace';

export default function AIAppBuilderWorkspacePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navigation />
      <div className="pt-20">
        <AIAppBuilderWorkspace />
      </div>
    </div>
  );
}
