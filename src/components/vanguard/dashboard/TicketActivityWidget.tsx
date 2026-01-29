import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface TicketActivityData {
  date: string;
  opened: number;
  resolved: number;
}

interface TicketActivityWidgetProps {
  data: TicketActivityData[];
}

export function TicketActivityWidget({ data }: TicketActivityWidgetProps) {
  // If no data, generate mock data for the last 7 days
  const chartData = data.length > 0 ? data : [
    { date: 'Mon', opened: 0, resolved: 0 },
    { date: 'Tue', opened: 0, resolved: 0 },
    { date: 'Wed', opened: 0, resolved: 0 },
    { date: 'Thu', opened: 0, resolved: 0 },
    { date: 'Fri', opened: 0, resolved: 0 },
    { date: 'Sat', opened: 0, resolved: 0 },
    { date: 'Sun', opened: 0, resolved: 0 },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur border-white/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ticket activity</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
              <span className="text-muted-foreground">Opened</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-yellow-500" />
              <span className="text-muted-foreground">Resolved</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="opened" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="resolved" fill="hsl(45, 93%, 47%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
