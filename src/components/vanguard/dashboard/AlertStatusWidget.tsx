import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Zap } from "lucide-react";

interface AlertStatusWidgetProps {
  warning: number;
  critical: number;
}

export function AlertStatusWidget({ warning, critical }: AlertStatusWidgetProps) {
  return (
    <Card className="bg-black/80 border-cyan-500/30 backdrop-blur-sm shadow-xl shadow-purple-500/10">
      <CardHeader className="pb-2 border-b border-purple-500/10">
        <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
          Alerts status
          <span className="ml-auto flex items-center gap-1 text-[10px] font-bold tracking-wider text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">
            <Zap className="h-2.5 w-2.5" />
            LIVE
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">{warning}</span>
            <span className="text-sm font-semibold text-orange-400 bg-gradient-to-r from-orange-500/25 to-purple-500/15 px-2.5 py-1 rounded border border-orange-500/40 shadow-lg shadow-orange-500/20">Warning</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">{critical}</span>
            <span className="text-sm font-semibold text-red-400 bg-gradient-to-r from-red-500/25 to-purple-500/15 px-2.5 py-1 rounded border border-red-500/40 shadow-lg shadow-red-500/20">Critical</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
