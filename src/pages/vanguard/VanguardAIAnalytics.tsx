import { AIPerformanceAnalytics } from "@/components/vanguard/AIPerformanceAnalytics";
import { Sparkles } from "lucide-react";

const VanguardAIAnalytics = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
          <Sparkles className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Vanguard Cortex — AI Analytics</h1>
          <p className="text-white/60">Track AI Copilot effectiveness and optimization opportunities</p>
        </div>
      </div>
      <AIPerformanceAnalytics />
    </div>
  );
};

export default VanguardAIAnalytics;
