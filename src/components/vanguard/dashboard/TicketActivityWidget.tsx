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
  // Use provided data or show empty state - no mock data
  const chartData = data.length > 0 ? data : [];
  const hasData = chartData.length > 0 && chartData.some(d => d.opened > 0 || d.resolved > 0);

  return (
    <Card className="bg-black/80 border-cyan-500/30 backdrop-blur-sm shadow-xl shadow-purple-500/10">
      <CardHeader className="pb-2 border-b border-purple-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Activity className="h-4 w-4 drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
            Ticket activity
          </CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-cyan-400 to-purple-400 shadow-lg shadow-cyan-500/50" />
              <span className="text-slate-400">Opened</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-purple-400 to-pink-400 shadow-lg shadow-purple-500/50" />
              <span className="text-slate-400">Resolved</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[200px] flex items-center justify-center text-slate-500">
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No ticket activity yet</p>
            </div>
          </div>
        ) : (
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
                  border: '1px solid rgba(168,85,247,0.4)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#e2e8f0',
                  boxShadow: '0 10px 40px rgba(168,85,247,0.15)'
                }}
              />
              <Bar dataKey="opened" fill="url(#openedGradient)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="url(#resolvedGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="openedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
