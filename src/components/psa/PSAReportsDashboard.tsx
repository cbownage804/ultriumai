/**
 * PSA Reports Dashboard
 * Comprehensive reporting system like Atera with multiple report types
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Ticket, 
  DollarSign, 
  Download, 
  Calendar,
  Filter,
  RefreshCw,
  Star,
  AlertTriangle,
  CheckCircle,
  Building2,
  PieChart,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, Legend, LineChart, Line } from 'recharts';

// Mock data for charts
const ticketVolumeData = [
  { month: 'Jan', tickets: 145, resolved: 140 },
  { month: 'Feb', tickets: 178, resolved: 172 },
  { month: 'Mar', tickets: 156, resolved: 148 },
  { month: 'Apr', tickets: 189, resolved: 182 },
  { month: 'May', tickets: 167, resolved: 165 },
  { month: 'Jun', tickets: 203, resolved: 198 },
];

const technicianPerformance = [
  { name: 'Allen Conley', ticketsResolved: 87, avgTime: '2.5h', satisfaction: 4.8, revenue: 12500 },
  { name: 'Sarah Johnson', ticketsResolved: 72, avgTime: '3.1h', satisfaction: 4.6, revenue: 10800 },
  { name: 'Mike Chen', ticketsResolved: 64, avgTime: '2.8h', satisfaction: 4.7, revenue: 9600 },
  { name: 'Emily Davis', ticketsResolved: 58, avgTime: '3.4h', satisfaction: 4.5, revenue: 8700 },
];

const customerProfitability = [
  { name: 'Acme Corp', revenue: 15200, tickets: 45, profit: 8500, margin: 55.9 },
  { name: 'TechStart Inc', revenue: 12800, tickets: 32, profit: 7200, margin: 56.3 },
  { name: 'Global Solutions', revenue: 18500, tickets: 67, profit: 9800, margin: 53.0 },
  { name: 'Innovation Labs', revenue: 9600, tickets: 24, profit: 5400, margin: 56.3 },
];

const ticketsByCategory = [
  { name: 'Network', value: 145, color: '#0891b2' },
  { name: 'Email', value: 98, color: '#8b5cf6' },
  { name: 'Hardware', value: 76, color: '#f59e0b' },
  { name: 'Software', value: 112, color: '#10b981' },
  { name: 'Security', value: 54, color: '#ef4444' },
];

const slaMetrics = [
  { month: 'Jan', met: 94, breached: 6 },
  { month: 'Feb', met: 96, breached: 4 },
  { month: 'Mar', met: 92, breached: 8 },
  { month: 'Apr', met: 97, breached: 3 },
  { month: 'May', met: 95, breached: 5 },
  { month: 'Jun', met: 98, breached: 2 },
];

const timesheetData = [
  { week: 'W1', billable: 32, nonBillable: 8 },
  { week: 'W2', billable: 38, nonBillable: 6 },
  { week: 'W3', billable: 35, nonBillable: 9 },
  { week: 'W4', billable: 40, nonBillable: 4 },
];

export function PSAReportsDashboard() {
  const [dateRange, setDateRange] = useState("last_30_days");
  const [reportType, setReportType] = useState("overview");

  const StatCard = ({ title, value, change, icon: Icon, trend }: { 
    title: string; 
    value: string; 
    change?: string; 
    icon: any;
    trend?: 'up' | 'down';
  }) => (
    <Card className="bg-slate-900/50 border-cyan-500/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/60">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {change && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${
                trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-white/50'
              }`}>
                {trend === 'up' && <ArrowUp className="h-3 w-3" />}
                {trend === 'down' && <ArrowDown className="h-3 w-3" />}
                {change}
              </div>
            )}
          </div>
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Icon className="h-5 w-5 text-cyan-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-white/60">Comprehensive PSA analytics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-44 bg-slate-800 border-cyan-500/20 text-white">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-cyan-500/20">
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
              <SelectItem value="last_year">Last year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-cyan-500/20 text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-black">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="bg-slate-800 border border-cyan-500/20">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Ticket Analysis</TabsTrigger>
          <TabsTrigger value="technicians">Technician Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Profitability</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          <TabsTrigger value="sla">SLA Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard 
              title="Total Tickets" 
              value="1,038" 
              change="+12.5% vs last month" 
              icon={Ticket}
              trend="up"
            />
            <StatCard 
              title="Avg Resolution Time" 
              value="2.8h" 
              change="-15% vs last month" 
              icon={Clock}
              trend="up"
            />
            <StatCard 
              title="Customer Satisfaction" 
              value="4.7/5" 
              change="+0.2 vs last month" 
              icon={Star}
              trend="up"
            />
            <StatCard 
              title="Total Revenue" 
              value="$48,200" 
              change="+8.3% vs last month" 
              icon={DollarSign}
              trend="up"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Ticket Volume</CardTitle>
                <CardDescription className="text-white/60">Monthly ticket trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={ticketVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #0891b2',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="tickets" 
                      stroke="#0891b2" 
                      fill="#0891b2" 
                      fillOpacity={0.3} 
                      name="Created"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="resolved" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                      name="Resolved"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Tickets by Category</CardTitle>
                <CardDescription className="text-white/60">Distribution of ticket types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPie>
                    <Pie
                      data={ticketsByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {ticketsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #0891b2',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Reports */}
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Reports</CardTitle>
              <CardDescription className="text-white/60">Generate common reports instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { name: 'Load Analysis', icon: BarChart3, desc: 'Ticket workload distribution' },
                  { name: 'Top Load Report', icon: TrendingUp, desc: 'Highest volume periods' },
                  { name: 'Ticket Duration', icon: Clock, desc: 'Time to resolution metrics' },
                  { name: 'Satisfaction Report', icon: Star, desc: 'Customer feedback analysis' },
                ].map((report) => (
                  <Button
                    key={report.name}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start border-cyan-500/20 hover:bg-cyan-500/10"
                  >
                    <report.icon className="h-5 w-5 text-cyan-400 mb-2" />
                    <span className="font-medium text-white">{report.name}</span>
                    <span className="text-xs text-white/50">{report.desc}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technician Performance Tab */}
        <TabsContent value="technicians" className="space-y-6">
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-400" />
                Technician Performance
              </CardTitle>
              <CardDescription className="text-white/60">
                Track resolution rates, response times, and satisfaction scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {technicianPerformance.map((tech, index) => (
                  <div 
                    key={tech.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-cyan-500/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{tech.name}</p>
                        <p className="text-sm text-white/50">{tech.ticketsResolved} tickets resolved</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{tech.avgTime}</p>
                        <p className="text-xs text-white/50">Avg Time</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                          <p className="text-lg font-bold text-white">{tech.satisfaction}</p>
                        </div>
                        <p className="text-xs text-white/50">Satisfaction</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-400">${tech.revenue.toLocaleString()}</p>
                        <p className="text-xs text-white/50">Revenue</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technician Charts */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Tickets Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={technicianPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #0891b2',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="ticketsResolved" fill="#0891b2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Revenue by Technician</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={technicianPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #0891b2',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Profitability Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-cyan-400" />
                Customer Profitability
              </CardTitle>
              <CardDescription className="text-white/60">
                Revenue, costs, and profit margins by customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerProfitability.map((customer) => (
                  <div 
                    key={customer.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-cyan-500/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <Building2 className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{customer.name}</p>
                        <p className="text-sm text-white/50">{customer.tickets} tickets this period</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">${customer.revenue.toLocaleString()}</p>
                        <p className="text-xs text-white/50">Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-400">${customer.profit.toLocaleString()}</p>
                        <p className="text-xs text-white/50">Profit</p>
                      </div>
                      <div className="text-center">
                        <Badge className={`${customer.margin > 55 ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                          {customer.margin}%
                        </Badge>
                        <p className="text-xs text-white/50 mt-1">Margin</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA Reports Tab */}
        <TabsContent value="sla" className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard 
              title="SLA Compliance Rate" 
              value="96.2%" 
              change="+2.1% vs last month" 
              icon={CheckCircle}
              trend="up"
            />
            <StatCard 
              title="SLA Breaches" 
              value="12" 
              change="-5 vs last month" 
              icon={AlertTriangle}
              trend="up"
            />
            <StatCard 
              title="Avg First Response" 
              value="18 min" 
              change="-3 min vs last month" 
              icon={Clock}
              trend="up"
            />
          </div>

          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-white">SLA Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={slaMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #0891b2',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="met" fill="#10b981" name="Met" stackId="a" />
                  <Bar dataKey="breached" fill="#ef4444" name="Breached" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timesheets Tab */}
        <TabsContent value="timesheets" className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard 
              title="Total Hours" 
              value="172h" 
              icon={Clock}
            />
            <StatCard 
              title="Billable Hours" 
              value="145h" 
              change="84.3% utilization" 
              icon={DollarSign}
            />
            <StatCard 
              title="Revenue from Time" 
              value="$21,750" 
              icon={TrendingUp}
            />
          </div>

          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-white">Weekly Time Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timesheetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="week" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #0891b2',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="billable" fill="#10b981" name="Billable" />
                  <Bar dataKey="nonBillable" fill="#64748b" name="Non-Billable" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ticket Analysis Tab */}
        <TabsContent value="tickets" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <StatCard title="Open Tickets" value="47" icon={Ticket} />
            <StatCard title="Pending" value="23" icon={Clock} />
            <StatCard title="Resolved Today" value="18" icon={CheckCircle} />
            <StatCard title="Overdue" value="5" change="Action required" icon={AlertTriangle} trend="down" />
          </div>

          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-white">Ticket Resolution Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ticketVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #0891b2',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="tickets" stroke="#0891b2" strokeWidth={2} name="Created" />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
