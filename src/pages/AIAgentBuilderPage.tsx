import Navigation from '@/components/Navigation';
import { AIAgentBuilder } from '@/components/ai-studio/AIAgentBuilder';

export default function AIAgentBuilderPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <AIAgentBuilder />
      </div>
    </div>
  );
}
