import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle,
  ArrowUpCircle,
  Download,
  Calendar,
  BarChart3,
} from 'lucide-react';

interface PerformanceMetric {
  technician_name: string;
  technician_type: 'msp' | 'internal';
  tickets_resolved: number;
  avg_resolution_hours: number;
  first_response_met: number;
  first_response_missed: number;
  escalations_created: number;
  escalations_received: number;
  csat_score: number;
  csat_responses: number;
}

export function InternalITPerformance() {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedOrg, setSelectedOrg] = useState('all');

  const [metrics] = useState<PerformanceMetric[]>([
    { technician_name: 'Sarah Johnson', technician_type: 'internal', tickets_resolved: 89, avg_resolution_hours: 4.2, first_response_met: 82, first_response_missed: 7, escalations_created: 12, escalations_received: 0, csat_score: 4.6, csat_responses: 34 },
    { technician_name: 'Mike Brown', technician_type: 'internal', tickets_resolved: 67, avg_resolution_hours: 6.1, first_response_met: 58, first_response_missed: 9, escalations_created: 18, escalations_received: 0, csat_score: 4.2, csat_responses: 28 },
    { technician_name: 'Emily Chen', technician_type: 'internal', tickets_resolved: 102, avg_resolution_hours: 3.8, first_response_met: 95, first_response_missed: 7, escalations_created: 8, escalations_received: 0, csat_score: 4.8, csat_responses: 45 },
    { technician_name: 'John Smith', technician_type: 'msp', tickets_resolved: 145, avg_resolution_hours: 2.9, first_response_met: 138, first_response_missed: 7, escalations_created: 0, escalations_received: 38, csat_score: 4.7, csat_responses: 52 },
  ]);

  const escalationTrend = [
    { week: 'Week 1', internal: 15, msp: 12 },
    { week: 'Week 2', internal: 18, msp: 14 },
    { week: 'Week 3', internal: 12, msp: 10 },
    { week: 'Week 4', internal: 8, msp: 6 },
  ];

  const resolutionByTeam = [
    { name: 'Internal IT', value: 258, color: '#3b82f6' },
    { name: 'MSP', value: 145, color: '#8b5cf6' },
  ];

  const internalMetrics = metrics.filter(m => m.technician_type === 'internal');
  const totalInternalResolved = internalMetrics.reduce((sum, m) => sum + m.tickets_resolved, 0);
  const totalEscalations = internalMetrics.reduce((sum, m) => sum + m.escalations_created, 0);
  const avgCSAT = (internalMetrics.reduce((sum, m) => sum + m.csat_score, 0) / internalMetrics.length).toFixed(1);
  const avgResolutionTime = (internalMetrics.reduce((sum, m) => sum + m.avg_resolution_hours, 0) / internalMetrics.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Internal IT Performance
          </h2>
          <p className="text-muted-foreground">
            Track and compare internal IT team metrics vs MSP escalations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              <SelectItem value="acme">Acme Corp</SelectItem>
              <SelectItem value="techstart">TechStart Inc</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Internal Resolved</p>
                <p className="text-2xl font-bold">{totalInternalResolved}</p>
                <div className="flex items-center text-xs text-green-500 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from last period
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Escalated to MSP</p>
                <p className="text-2xl font-bold">{totalEscalations}</p>
                <div className="flex items-center text-xs text-green-500 mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -8% from last period
                </div>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Resolution</p>
                <p className="text-2xl font-bold">{avgResolutionTime}h</p>
                <div className="flex items-center text-xs text-green-500 mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -0.5h from last period
                </div>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Internal CSAT</p>
                <p className="text-2xl font-bold">{avgCSAT}/5</p>
                <div className="flex items-center text-xs text-green-500 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +0.2 from last period
                </div>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Escalation Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Escalation Trend</CardTitle>
            <CardDescription>Weekly escalations from internal IT to MSP</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={escalationTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Line type="monotone" dataKey="internal" stroke="#3b82f6" strokeWidth={2} name="From Internal" />
                <Line type="monotone" dataKey="msp" stroke="#8b5cf6" strokeWidth={2} name="MSP Handled" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resolution Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Resolution Distribution</CardTitle>
            <CardDescription>Tickets resolved by team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={resolutionByTeam}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {resolutionByTeam.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {resolutionByTeam.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Technician Performance</CardTitle>
          <CardDescription>Individual metrics for all technicians</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Technician</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Resolved</TableHead>
                <TableHead className="text-right">Avg Time</TableHead>
                <TableHead className="text-right">SLA Met</TableHead>
                <TableHead className="text-right">Escalations</TableHead>
                <TableHead className="text-right">CSAT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((m) => (
                <TableRow key={m.technician_name}>
                  <TableCell className="font-medium">{m.technician_name}</TableCell>
                  <TableCell>
                    <Badge variant={m.technician_type === 'msp' ? 'default' : 'secondary'}>
                      {m.technician_type === 'msp' ? 'MSP' : 'Internal'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{m.tickets_resolved}</TableCell>
                  <TableCell className="text-right">{m.avg_resolution_hours}h</TableCell>
                  <TableCell className="text-right">
                    <span className="text-green-500">{m.first_response_met}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-red-500">{m.first_response_missed}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {m.technician_type === 'internal' ? (
                      <span className="text-orange-500">↑ {m.escalations_created}</span>
                    ) : (
                      <span className="text-blue-500">↓ {m.escalations_received}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={m.csat_score >= 4.5 ? 'text-green-500' : m.csat_score >= 4 ? 'text-yellow-500' : 'text-orange-500'}>
                      {m.csat_score}
                    </span>
                    <span className="text-muted-foreground text-xs"> ({m.csat_responses})</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
