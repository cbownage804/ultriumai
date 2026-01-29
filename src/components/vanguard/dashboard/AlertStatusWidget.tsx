import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface AlertStatusWidgetProps {
  warning: number;
  critical: number;
}

export function AlertStatusWidget({ warning, critical }: AlertStatusWidgetProps) {
  return (
    <Card className="bg-black/80 border-cyan-500/30 backdrop-blur-sm shadow-xl shadow-cyan-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]" />
          Alerts status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-white">{warning}</span>
            <span className="text-sm font-semibold text-orange-400 bg-orange-500/25 px-2.5 py-1 rounded border border-orange-500/40 shadow-lg shadow-orange-500/20">Warning</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-white">{critical}</span>
            <span className="text-sm font-semibold text-red-400 bg-red-500/25 px-2.5 py-1 rounded border border-red-500/40 shadow-lg shadow-red-500/20">Critical</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
