import Navigation from '@/components/Navigation';
import { AIWorkflowCanvas } from '@/components/ai-studio/AIWorkflowCanvas';
import { AIStudioSubNav } from '@/components/ai-studio/AIStudioSubNav';

export default function AIWorkflowsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AIStudioSubNav />
      <div className="container mx-auto p-6">
        <AIWorkflowCanvas />
      </div>
    </div>
  );
}
