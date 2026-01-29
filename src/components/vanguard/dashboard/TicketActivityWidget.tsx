import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface TicketActivityData {
  date: string;
  opened: number;
  resolved: number;
}

interface TicketActivityWidgetProps {
  data: TicketActivityData[];
}

export function TicketActivityWidget({ data }: TicketActivityWidgetProps) {
  const chartData = data.length > 0 ? data : [
    { date: '25 Apr', opened: 0, resolved: 0 },
    { date: '26 Apr', opened: 0, resolved: 0 },
    { date: '27 Apr', opened: 0, resolved: 0 },
    { date: '28 Apr', opened: 3, resolved: 2 },
    { date: '29 Apr', opened: 0, resolved: 0 },
    { date: '30 Apr', opened: 0, resolved: 0 },
    { date: '1 May', opened: 0, resolved: 0 },
  ];

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500">Ticket activity</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-teal-500" />
              <span className="text-gray-500">Opened</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
              <span className="text-gray-500">Resolved</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 11 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                domain={[0, 3]}
                ticks={[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="opened" fill="#14b8a6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="resolved" fill="#fbbf24" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
