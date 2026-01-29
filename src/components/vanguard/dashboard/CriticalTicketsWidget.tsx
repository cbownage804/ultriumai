import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Ticket, User } from "lucide-react";

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
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Low</Badge>;
    }
  };

  const getSLABadge = (sla: string | undefined) => {
    if (!sla) return null;
    const isOverdue = sla.startsWith('-');
    return (
      <Badge className={isOverdue 
        ? "bg-red-500/20 text-red-400 border-red-500/30" 
        : "bg-green-500/20 text-green-400 border-green-500/30"
      }>
        {sla}
      </Badge>
    );
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          Critical and overdue tickets
          <HelpCircle className="h-3 w-3" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Ticket className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No critical tickets</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Details</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-2">Technician</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-2">Priority</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-2">SLA</th>
              </tr>
            </thead>
            <tbody>
              {tickets.slice(0, 5).map((ticket) => (
                <tr key={ticket.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm">#{ticket.ticket_number} {ticket.title}</p>
                      <p className="text-xs text-primary">{ticket.client_name}</p>
                    </div>
                  </td>
                  <td className="text-center px-4 py-3">
                    {ticket.technician ? (
                      <div className="flex items-center justify-center gap-1">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Assign</span>
                    )}
                  </td>
                  <td className="text-center px-4 py-3">
                    {getPriorityBadge(ticket.priority)}
                  </td>
                  <td className="text-center px-4 py-3">
                    {getSLABadge(ticket.sla_status)}
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
