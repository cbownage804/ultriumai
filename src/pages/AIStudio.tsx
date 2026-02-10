import Navigation from "@/components/Navigation";
import { AIStudioDashboardHub } from "@/components/ai-studio/AIStudioDashboardHub";
import { AIStudioSubNav } from "@/components/ai-studio/AIStudioSubNav";
import { AIStudioCommandPaletteGlobal } from "@/components/ai-studio/AIStudioCommandPaletteGlobal";

const AIStudio = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AIStudioSubNav />
      <AIStudioCommandPaletteGlobal />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AIStudioDashboardHub />
      </div>
    </div>
  );
};

export default AIStudio;
