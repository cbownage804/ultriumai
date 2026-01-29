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
    <Card className="bg-black/80 border-cyan-500/30 backdrop-blur-sm shadow-xl shadow-cyan-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
          <Ticket className="h-4 w-4 drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]" />
          Tickets status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-white">{open}</span>
            <span className="text-sm font-semibold text-blue-400 bg-blue-500/25 px-2.5 py-1 rounded border border-blue-500/40 shadow-lg shadow-blue-500/20">Open</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-white">{pending}</span>
            <span className="text-sm font-semibold text-orange-400 bg-orange-500/25 px-2.5 py-1 rounded border border-orange-500/40 shadow-lg shadow-orange-500/20">Pending</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-white">{dueToday}</span>
            <span className="text-sm font-semibold text-amber-400 bg-amber-500/25 px-2.5 py-1 rounded border border-amber-500/40 shadow-lg shadow-amber-500/20">Due today</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-white">{overdue}</span>
            <span className="text-sm font-semibold text-red-400 bg-red-500/25 px-2.5 py-1 rounded border border-red-500/40 shadow-lg shadow-red-500/20">Overdue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
