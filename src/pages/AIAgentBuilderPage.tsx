import Navigation from '@/components/Navigation';
import { AIAgentBuilder } from '@/components/ai-studio/AIAgentBuilder';
import { AIStudioSubNav } from '@/components/ai-studio/AIStudioSubNav';

export default function AIAgentBuilderPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AIStudioSubNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AIAgentBuilder />
      </div>
    </div>
  );
}
