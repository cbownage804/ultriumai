import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TicketStatusWidgetProps {
  open: number;
  pending: number;
  dueToday: number;
  overdue: number;
}

export function TicketStatusWidget({ open, pending, dueToday, overdue }: TicketStatusWidgetProps) {
  return (
    <Card className="bg-card/50 backdrop-blur border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Tickets status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{open}</p>
            <Badge variant="outline" className="mt-1 bg-blue-500/10 text-blue-400 border-blue-500/30">
              Open
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{pending}</p>
            <Badge variant="outline" className="mt-1 bg-orange-500/10 text-orange-400 border-orange-500/30">
              Pending
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{dueToday}</p>
            <Badge variant="outline" className="mt-1 bg-red-500/10 text-red-400 border-red-500/30">
              Due today
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{overdue}</p>
            <Badge variant="outline" className="mt-1 bg-red-600/10 text-red-500 border-red-600/30">
              Overdue
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
