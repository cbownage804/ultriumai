import { AISessionSummary } from "@/components/vanguard/AISessionSummary";
import { FileText } from "lucide-react";

const VanguardAISessions = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
          <FileText className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Vanguard Cortex — Session Summaries</h1>
          <p className="text-white/60">AI-generated itemized summaries of remote support sessions</p>
        </div>
      </div>
      <AISessionSummary />
    </div>
  );
};

export default VanguardAISessions;
