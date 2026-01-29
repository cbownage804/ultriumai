import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface AlertStatusWidgetProps {
  warning: number;
  critical: number;
}

export function AlertStatusWidget({ warning, critical }: AlertStatusWidgetProps) {
  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Alerts status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-100">{warning}</span>
            <span className="text-sm font-medium text-orange-400 bg-orange-500/20 px-2.5 py-1 rounded border border-orange-500/30">Warning</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-100">{critical}</span>
            <span className="text-sm font-medium text-red-400 bg-red-500/20 px-2.5 py-1 rounded border border-red-500/30">Critical</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
