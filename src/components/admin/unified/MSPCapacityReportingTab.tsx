/**
 * MSP Client Capacity Reporting Tab
 * Admin-only view for per-client AI capacity analytics
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Building2,
  RefreshCw,
  Download,
  Gauge,
  Users,
  TrendingUp,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useMSPCapacityAnalytics } from '@/hooks/useMSPCapacityAnalytics';

export function MSPCapacityReportingTab() {
  const {
    isLoading,
    clientUsage,
    summary,
    refreshAnalytics,
    dateRange,
    setDateRange,
  } = useMSPCapacityAnalytics();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAnalytics();
    setIsRefreshing(false);
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { label: 'Critical', variant: 'destructive' as const, color: 'bg-red-500' };
    if (percentage >= 70) return { label: 'High', variant: 'secondary' as const, color: 'bg-amber-500' };
    if (percentage >= 40) return { label: 'Normal', variant: 'default' as const, color: 'bg-green-500' };
    return { label: 'Low', variant: 'outline' as const, color: 'bg-blue-500' };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chart data for top clients
  const chartData = clientUsage.slice(0, 10).map(client => ({
    name: client.client_name.length > 15 
      ? client.client_name.substring(0, 15) + '...' 
      : client.client_name,
    credits: client.total_credits,
    allocation: client.capacity_allocation,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Client Capacity Reporting
          </h2>
          <p className="text-muted-foreground">
            AI capacity usage breakdown by client organization
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg p-1">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant={dateRange === days ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDateRange(days)}
                className="text-xs"
              >
                {days}d
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold">{summary.total_clients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Gauge className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity Used</p>
                  <p className="text-2xl font-bold">{summary.total_capacity_used.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pool Usage</p>
                  <p className="text-2xl font-bold">{summary.usage_percentage.toFixed(1)}%</p>
                </div>
              </div>
              <Progress value={summary.usage_percentage} className="h-1 mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Activity className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Most Active</p>
                  <p className="text-sm font-bold truncate max-w-[120px]">
                    {summary.most_active_client || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Client Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Client Capacity Distribution</CardTitle>
          <CardDescription>Top 10 clients by AI capacity consumption</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No client usage data yet</p>
                <p className="text-xs mt-1">Usage will appear once clients start using AI assistants</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), 'Capacity Used']}
                />
                <Bar 
                  dataKey="credits" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                  name="Used"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Detailed Client Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Client Capacity Details
          </CardTitle>
          <CardDescription>Per-client AI capacity allocation and usage</CardDescription>
        </CardHeader>
        <CardContent>
          {clientUsage.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No clients found</p>
                <p className="text-xs mt-1">Add clients to your MSP to see capacity analytics</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Capacity Used</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Avg/Request</TableHead>
                    <TableHead className="text-right">Allocation</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientUsage.map((client, index) => {
                    const status = getUsageStatus(client.usage_percentage);
                    return (
                      <motion.tr
                        key={client.client_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status.color}`} />
                            <span className="font-medium">{client.client_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {client.total_credits.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {client.total_requests.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {client.avg_credits_per_request.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">
                              {client.capacity_allocation.toLocaleString()}
                            </span>
                            <Progress value={client.usage_percentage} className="h-1" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={status.variant} className="text-xs">
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {client.last_usage 
                            ? format(new Date(client.last_usage), 'MMM d, HH:mm')
                            : 'Never'
                          }
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
