import { AIKBGenerator } from "@/components/vanguard/AIKBGenerator";
import { Wand2 } from "lucide-react";

const VanguardAIKnowledge = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
          <Wand2 className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Knowledge Base Generator</h1>
          <p className="text-white/60">Automatically generate KB articles from resolved tickets</p>
        </div>
      </div>
      <AIKBGenerator />
    </div>
  );
};

export default VanguardAIKnowledge;
