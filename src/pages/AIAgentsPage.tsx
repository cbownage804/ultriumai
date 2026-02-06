import Navigation from '@/components/Navigation';
import { AIAgentsHub } from '@/components/ai-studio/AIAgentsHub';

export default function AIAgentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <AIAgentsHub />
      </div>
    </div>
  );
}
