import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Activity } from "lucide-react";

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
    <Card className="bg-black/80 border-cyan-500/30 backdrop-blur-sm shadow-xl shadow-cyan-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Activity className="h-4 w-4 drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]" />
            Ticket activity
          </CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-cyan-400 shadow-lg shadow-cyan-500/50" />
              <span className="text-slate-400">Opened</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-amber-400 shadow-lg shadow-amber-500/50" />
              <span className="text-slate-400">Resolved</span>
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
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={[0, 3]}
                ticks={[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#000',
                  border: '1px solid rgba(6,182,212,0.4)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#e2e8f0',
                  boxShadow: '0 10px 40px rgba(6,182,212,0.15)'
                }}
              />
              <Bar dataKey="opened" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
