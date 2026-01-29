import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users } from "lucide-react";

interface CustomerTicket {
  client_id: string;
  client_name: string;
  client_logo?: string;
  ticket_count: number;
}

interface CustomerTicketsWidgetProps {
  customers: CustomerTicket[];
}

// Vanguard-themed color palette
const getInitialColors = (name: string): { bg: string; text: string; border: string } => {
  const colors = [
    { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
    { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

export function CustomerTicketsWidget({ customers }: CustomerTicketsWidgetProps) {
  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Customer tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <Building2 className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No customer tickets</p>
          </div>
        ) : (
          customers.slice(0, 5).map((customer) => {
            const colors = getInitialColors(customer.client_name);
            return (
              <div key={customer.client_id} className="flex items-center justify-between py-2.5 hover:bg-cyan-500/5 px-2 rounded-lg cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                    {customer.client_name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-200">{customer.client_name}</span>
                </div>
                <span className="text-sm text-cyan-400 font-medium bg-cyan-500/20 px-2 py-0.5 rounded">{customer.ticket_count}</span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
