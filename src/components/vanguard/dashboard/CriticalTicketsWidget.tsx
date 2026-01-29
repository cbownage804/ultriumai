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
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getSLAStyles = (sla: string | undefined) => {
    if (!sla) return '';
    const isOverdue = sla.startsWith('-');
    return isOverdue 
      ? 'text-red-400 bg-red-500/20 border border-red-500/30' 
      : 'text-green-400 bg-green-500/20 border border-green-500/30';
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Critical and overdue tickets
          <HelpCircle className="h-3.5 w-3.5 text-slate-500 ml-1" />
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
              <tr className="border-b border-cyan-500/10">
                <th className="text-left text-xs font-medium text-slate-400 px-4 py-2">Details</th>
                <th className="text-center text-xs font-medium text-slate-400 px-2 py-2">Technician</th>
                <th className="text-center text-xs font-medium text-slate-400 px-2 py-2">Priority</th>
                <th className="text-center text-xs font-medium text-slate-400 px-2 py-2">SLA</th>
              </tr>
            </thead>
            <tbody>
              {tickets.slice(0, 4).map((ticket) => (
                <tr key={ticket.id} className="border-b border-cyan-500/5 last:border-0 hover:bg-cyan-500/5 cursor-pointer transition-colors">
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="text-sm text-slate-200">#{ticket.ticket_number} {ticket.title}</p>
                      <p className="text-xs text-cyan-400">{ticket.client_name}{ticket.technician && ` by ${ticket.technician}`}</p>
                    </div>
                  </td>
                  <td className="text-center px-2 py-2.5">
                    {ticket.technician ? (
                      <div className="flex items-center justify-center">
                        <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-cyan-500/20">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-cyan-400 cursor-pointer hover:underline">Assign</span>
                    )}
                  </td>
                  <td className="text-center px-2 py-2.5">
                    <span className={cn(
                      "text-xs font-medium capitalize px-2 py-1 rounded border",
                      getPriorityStyles(ticket.priority)
                    )}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="text-center px-2 py-2.5">
                    {ticket.sla_status && (
                      <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded",
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
