import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AlertStatusWidgetProps {
  warning: number;
  critical: number;
}

export function AlertStatusWidget({ warning, critical }: AlertStatusWidgetProps) {
  return (
    <Card className="bg-card/50 backdrop-blur border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Alerts status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold">{warning}</p>
            <Badge variant="outline" className="mt-1 bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
              Warning
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{critical}</p>
            <Badge variant="outline" className="mt-1 bg-red-500/10 text-red-400 border-red-500/30">
              Critical
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
