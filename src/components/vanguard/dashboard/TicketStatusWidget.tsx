import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Sparkles } from "lucide-react";

interface TicketStatusWidgetProps {
  open: number;
  pending: number;
  dueToday: number;
  overdue: number;
}

export function TicketStatusWidget({ open, pending, dueToday, overdue }: TicketStatusWidgetProps) {
  return (
    <Card className="bg-black/80 border-cyan-500/30 backdrop-blur-sm shadow-xl shadow-purple-500/10">
      <CardHeader className="pb-2 border-b border-purple-500/10">
        <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
          <Ticket className="h-4 w-4 drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
          Tickets status
          <Sparkles className="h-3 w-3 text-purple-400 ml-auto animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">{open}</span>
            <span className="text-sm font-semibold text-blue-400 bg-gradient-to-r from-blue-500/25 to-purple-500/15 px-2.5 py-1 rounded border border-blue-500/40 shadow-lg shadow-blue-500/20">Open</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">{pending}</span>
            <span className="text-sm font-semibold text-orange-400 bg-gradient-to-r from-orange-500/25 to-purple-500/15 px-2.5 py-1 rounded border border-orange-500/40 shadow-lg shadow-orange-500/20">Pending</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">{dueToday}</span>
            <span className="text-sm font-semibold text-amber-400 bg-gradient-to-r from-amber-500/25 to-purple-500/15 px-2.5 py-1 rounded border border-amber-500/40 shadow-lg shadow-amber-500/20">Due today</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">{overdue}</span>
            <span className="text-sm font-semibold text-red-400 bg-gradient-to-r from-red-500/25 to-purple-500/15 px-2.5 py-1 rounded border border-red-500/40 shadow-lg shadow-red-500/20">Overdue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
