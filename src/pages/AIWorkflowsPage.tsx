import Navigation from '@/components/Navigation';
import { AIWorkflowCanvas } from '@/components/ai-studio/AIWorkflowCanvas';

export default function AIWorkflowsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <AIWorkflowCanvas />
      </div>
    </div>
  );
}
