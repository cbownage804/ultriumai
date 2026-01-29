import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSLAStyles = (sla: string | undefined) => {
    if (!sla) return '';
    const isOverdue = sla.startsWith('-');
    return isOverdue ? 'text-red-500 bg-red-50' : 'text-green-500 bg-green-50';
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
          Critical and overdue tickets
          <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Ticket className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No critical tickets</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Details</th>
                <th className="text-center text-xs font-medium text-gray-500 px-2 py-2">Technician</th>
                <th className="text-center text-xs font-medium text-gray-500 px-2 py-2">Priority</th>
                <th className="text-center text-xs font-medium text-gray-500 px-2 py-2">SLA</th>
              </tr>
            </thead>
            <tbody>
              {tickets.slice(0, 4).map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="text-sm text-gray-800">#{ticket.ticket_number} {ticket.title}</p>
                      <p className="text-xs text-teal-600">{ticket.client_name}{ticket.technician && ` by ${ticket.technician}`}</p>
                    </div>
                  </td>
                  <td className="text-center px-2 py-2.5">
                    {ticket.technician ? (
                      <div className="flex items-center justify-center">
                        <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-teal-600 cursor-pointer hover:underline">Assign</span>
                    )}
                  </td>
                  <td className="text-center px-2 py-2.5">
                    <span className={`text-sm font-medium capitalize ${getPriorityStyles(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="text-center px-2 py-2.5">
                    {ticket.sla_status && (
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getSLAStyles(ticket.sla_status)}`}>
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
