import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket } from "lucide-react";

interface TicketStatusWidgetProps {
  open: number;
  pending: number;
  dueToday: number;
  overdue: number;
}

export function TicketStatusWidget({ open, pending, dueToday, overdue }: TicketStatusWidgetProps) {
  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          Tickets status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-100">{open}</span>
            <span className="text-sm font-medium text-blue-400 bg-blue-500/20 px-2.5 py-1 rounded border border-blue-500/30">Open</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-100">{pending}</span>
            <span className="text-sm font-medium text-orange-400 bg-orange-500/20 px-2.5 py-1 rounded border border-orange-500/30">Pending</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-100">{dueToday}</span>
            <span className="text-sm font-medium text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/30">Due today</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-100">{overdue}</span>
            <span className="text-sm font-medium text-red-400 bg-red-500/20 px-2.5 py-1 rounded border border-red-500/30">Overdue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
