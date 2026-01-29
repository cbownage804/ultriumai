import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface CustomerTicket {
  client_id: string;
  client_name: string;
  client_logo?: string;
  ticket_count: number;
}

interface CustomerTicketsWidgetProps {
  customers: CustomerTicket[];
}

// Simple hash function to get consistent colors
const getInitialColors = (name: string): { bg: string; text: string } => {
  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-700' },
    { bg: 'bg-green-100', text: 'text-green-700' },
    { bg: 'bg-purple-100', text: 'text-purple-700' },
    { bg: 'bg-orange-100', text: 'text-orange-700' },
    { bg: 'bg-pink-100', text: 'text-pink-700' },
    { bg: 'bg-teal-100', text: 'text-teal-700' },
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

export function CustomerTicketsWidget({ customers }: CustomerTicketsWidgetProps) {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">Customer tickets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Building2 className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No customer tickets</p>
          </div>
        ) : (
          customers.slice(0, 5).map((customer) => {
            const colors = getInitialColors(customer.client_name);
            return (
              <div key={customer.client_id} className="flex items-center justify-between py-2 hover:bg-gray-50 px-2 rounded cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`h-7 w-7 rounded flex items-center justify-center text-xs font-bold ${colors.bg} ${colors.text}`}>
                    {customer.client_name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700">{customer.client_name}</span>
                </div>
                <span className="text-sm text-gray-500">{customer.ticket_count}</span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
