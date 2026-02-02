import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Monitor,
  Ticket, Shield, DollarSign, Clock, CheckCircle2, AlertTriangle,
  Download, RefreshCw, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

export const ExecutiveDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedTenant, setSelectedTenant] = useState('all');

  const kpiData = {
    totalDevices: { value: 1247, change: 8.5, trend: 'up' },
    activeTickets: { value: 89, change: -12.3, trend: 'down' },
    mttResolve: { value: 4.2, change: -18.5, trend: 'down' },
    customerSat: { value: 94.2, change: 2.1, trend: 'up' },
    threatBlocked: { value: 342, change: 15.8, trend: 'up' },
    monthlyRevenue: { value: 48500, change: 5.2, trend: 'up' }
  };

  const ticketTrend = [
    { date: 'Jan', opened: 145, closed: 138, backlog: 42 },
    { date: 'Feb', opened: 132, closed: 145, backlog: 29 },
    { date: 'Mar', opened: 168, closed: 155, backlog: 42 },
    { date: 'Apr', opened: 155, closed: 162, backlog: 35 },
    { date: 'May', opened: 142, closed: 148, backlog: 29 },
    { date: 'Jun', opened: 138, closed: 145, backlog: 22 }
  ];

  const deviceHealth = [
    { name: 'Healthy', value: 1089, color: '#22c55e' },
    { name: 'Warning', value: 112, color: '#eab308' },
    { name: 'Critical', value: 46, color: '#ef4444' }
  ];

  const revenueByService = [
    { service: 'RMM', revenue: 18500 },
    { service: 'Security', revenue: 12800 },
    { service: 'Support', revenue: 9200 },
    { service: 'Consulting', revenue: 5400 },
    { service: 'Other', revenue: 2600 }
  ];

  const topClients = [
    { name: 'Acme Corporation', devices: 156, tickets: 23, revenue: 8500, health: 95 },
    { name: 'TechStart Inc', devices: 89, tickets: 12, revenue: 4200, health: 88 },
    { name: 'Global Dynamics', devices: 234, tickets: 31, revenue: 12400, health: 92 },
    { name: 'SecureHealth Ltd', devices: 78, tickets: 8, revenue: 5600, health: 97 },
    { name: 'DataFlow Systems', devices: 145, tickets: 19, revenue: 7300, health: 85 }
  ];

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up' && change > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    } else if (trend === 'down' && change < 0) {
      return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    } else if (trend === 'up' && change < 0) {
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    }
    return <ArrowUpRight className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Executive Dashboard
          </h2>
          <p className="text-muted-foreground">High-level KPIs for management and clients</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Tenants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              <SelectItem value="acme">Acme Corporation</SelectItem>
              <SelectItem value="tech">TechStart Inc</SelectItem>
              <SelectItem value="global">Global Dynamics</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Monitor className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon(kpiData.totalDevices.trend, kpiData.totalDevices.change)}
                <span className={kpiData.totalDevices.change > 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(kpiData.totalDevices.change)}%
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold">{kpiData.totalDevices.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Ticket className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon('down', kpiData.activeTickets.change)}
                <span className="text-green-500">{Math.abs(kpiData.activeTickets.change)}%</span>
              </div>
            </div>
            <p className="text-2xl font-bold">{kpiData.activeTickets.value}</p>
            <p className="text-xs text-muted-foreground">Active Tickets</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon('down', kpiData.mttResolve.change)}
                <span className="text-green-500">{Math.abs(kpiData.mttResolve.change)}%</span>
              </div>
            </div>
            <p className="text-2xl font-bold">{kpiData.mttResolve.value}h</p>
            <p className="text-xs text-muted-foreground">MTT Resolve</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon(kpiData.customerSat.trend, kpiData.customerSat.change)}
                <span className="text-green-500">{kpiData.customerSat.change}%</span>
              </div>
            </div>
            <p className="text-2xl font-bold">{kpiData.customerSat.value}%</p>
            <p className="text-xs text-muted-foreground">CSAT Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon(kpiData.threatBlocked.trend, kpiData.threatBlocked.change)}
                <span className="text-green-500">{kpiData.threatBlocked.change}%</span>
              </div>
            </div>
            <p className="text-2xl font-bold">{kpiData.threatBlocked.value}</p>
            <p className="text-xs text-muted-foreground">Threats Blocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon(kpiData.monthlyRevenue.trend, kpiData.monthlyRevenue.change)}
                <span className="text-green-500">{kpiData.monthlyRevenue.change}%</span>
              </div>
            </div>
            <p className="text-2xl font-bold">${(kpiData.monthlyRevenue.value / 1000).toFixed(1)}k</p>
            <p className="text-xs text-muted-foreground">Monthly Revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Volume Trend</CardTitle>
            <CardDescription>Opened vs closed tickets over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ticketTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area type="monotone" dataKey="opened" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Opened" />
                  <Area type="monotone" dataKey="closed" stackId="2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Closed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Health */}
        <Card>
          <CardHeader>
            <CardTitle>Device Health Distribution</CardTitle>
            <CardDescription>Current health status of all managed devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceHealth}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {deviceHealth.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Service */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Service</CardTitle>
            <CardDescription>Monthly revenue breakdown by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByService} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="service" type="category" className="text-xs" width={80} />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
            <CardDescription>Performance metrics by client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topClients.map((client) => (
                <div key={client.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>{client.devices} devices</span>
                      <span>{client.tickets} tickets</span>
                      <span>${client.revenue.toLocaleString()}/mo</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Progress value={client.health} className="w-24 h-2" />
                      <span className="text-sm font-medium">{client.health}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Health Score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
