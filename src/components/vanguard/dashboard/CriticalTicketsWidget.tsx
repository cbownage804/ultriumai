import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Ticket, User, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CriticalTicket {
  id: string;
  ticket_number: string;
  title: string;
  client_name: string;
  technician?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  sla_status?: string;
}

interface CriticalTicketsWidgetProps {
  tickets: CriticalTicket[];
}

export function CriticalTicketsWidget({ tickets }: CriticalTicketsWidgetProps) {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-400 bg-red-500/25 border-red-500/40 shadow-lg shadow-red-500/20';
      case 'high':
        return 'text-orange-400 bg-orange-500/25 border-orange-500/40 shadow-lg shadow-orange-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/25 border-yellow-500/40 shadow-lg shadow-yellow-500/20';
      default:
        return 'text-slate-400 bg-slate-500/25 border-slate-500/40';
    }
  };

  const getSLAStyles = (sla: string | undefined) => {
    if (!sla) return '';
    const isOverdue = sla.startsWith('-');
    return isOverdue 
      ? 'text-red-400 bg-red-500/25 border border-red-500/40 shadow-lg shadow-red-500/20' 
      : 'text-green-400 bg-green-500/25 border border-green-500/40 shadow-lg shadow-green-500/20';
  };

  return (
    <Card className="bg-black/80 border-cyan-500/30 backdrop-blur-sm shadow-xl shadow-purple-500/10">
      <CardHeader className="pb-2 border-b border-purple-500/10">
        <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
          Critical and overdue tickets
          <span className="ml-auto text-[10px] font-bold text-red-400 bg-gradient-to-r from-red-500/20 to-purple-500/20 px-1.5 py-0.5 rounded border border-red-500/30 animate-pulse">URGENT</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <Ticket className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No critical tickets</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyan-500/20">
                <th className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-2">Details</th>
                <th className="text-center text-xs font-semibold text-slate-300 uppercase tracking-wider px-2 py-2">Technician</th>
                <th className="text-center text-xs font-semibold text-slate-300 uppercase tracking-wider px-2 py-2">Priority</th>
                <th className="text-center text-xs font-semibold text-slate-300 uppercase tracking-wider px-2 py-2">SLA</th>
              </tr>
            </thead>
            <tbody>
              {tickets.slice(0, 4).map((ticket) => (
                <tr key={ticket.id} className="border-b border-cyan-500/10 last:border-0 hover:bg-cyan-500/10 cursor-pointer transition-colors">
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="text-sm text-slate-200">#{ticket.ticket_number} {ticket.title}</p>
                      <p className="text-xs text-cyan-400 font-medium">{ticket.client_name}{ticket.technician && ` by ${ticket.technician}`}</p>
                    </div>
                  </td>
                  <td className="text-center px-2 py-2.5">
                    {ticket.technician ? (
                      <div className="flex items-center justify-center">
                        <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-cyan-500/30">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-cyan-400 cursor-pointer hover:underline font-medium">Assign</span>
                    )}
                  </td>
                  <td className="text-center px-2 py-2.5">
                    <span className={cn(
                      "text-xs font-semibold capitalize px-2 py-1 rounded border",
                      getPriorityStyles(ticket.priority)
                    )}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="text-center px-2 py-2.5">
                    {ticket.sla_status && (
                      <span className={cn(
                        "text-xs font-semibold px-2 py-1 rounded",
                        getSLAStyles(ticket.sla_status)
                      )}>
                        {ticket.sla_status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
