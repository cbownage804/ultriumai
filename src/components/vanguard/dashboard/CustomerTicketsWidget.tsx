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

export function CustomerTicketsWidget({ customers }: CustomerTicketsWidgetProps) {
  return (
    <Card className="bg-card/50 backdrop-blur border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Customer tickets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Building2 className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No customer tickets</p>
          </div>
        ) : (
          customers.slice(0, 5).map((customer) => (
            <div key={customer.client_id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {customer.client_name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm">{customer.client_name}</span>
              </div>
              <span className="text-sm font-medium">{customer.ticket_count}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
