import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  Gauge,
  Bot,
  RefreshCw,
  Download,
  Calendar,
  Zap,
  Activity,
  PieChart as PieChartIcon,
  MessageSquare,
  FileSearch,
  Globe,
  Wrench,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useAICapacityAnalytics } from '@/hooks/useAICapacityAnalytics';
import { AIStudioCreditIndicator } from './AIStudioCreditIndicator';

const USAGE_TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  chat: { label: 'Chat', icon: MessageSquare, color: 'hsl(var(--primary))' },
  file_analysis: { label: 'File Analysis', icon: FileSearch, color: '#8b5cf6' },
  retrieval: { label: 'Retrieval', icon: Activity, color: '#10b981' },
  tool_call: { label: 'Tool Call', icon: Wrench, color: '#f59e0b' },
  web_search: { label: 'Web Search', icon: Globe, color: '#ef4444' },
  image_generation: { label: 'Image Gen', icon: Zap, color: '#ec4899' },
};

const PIE_COLORS = ['hsl(var(--primary))', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function AICapacityAnalyticsDashboard() {
  const {
    isLoading,
    dailyUsage,
    usageByGPT,
    usageByType,
    summary,
    refreshAnalytics,
    setDateRange,
    dateRange,
  } = useAICapacityAnalytics();
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAnalytics();
    setIsRefreshing(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            AI Capacity Analytics
          </h2>
          <p className="text-muted-foreground">
            Organization usage insights and reporting
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

      {/* Current Capacity Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <AIStudioCreditIndicator variant="full" showUpgrade={true} />
        </div>
        
        {/* Summary Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Gauge className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Capacity Used</p>
                    <p className="text-2xl font-bold">{summary.totalCreditsUsed.toLocaleString()}</p>
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
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{summary.totalRequests.toLocaleString()}</p>
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
                    <p className="text-sm text-muted-foreground">Avg/Request</p>
                    <p className="text-2xl font-bold">{summary.avgCreditsPerRequest.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Calendar className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Peak Day</p>
                    <p className="text-lg font-bold">
                      {summary.peakUsageDay ? format(new Date(summary.peakUsageDay), 'MMM d') : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Usage Trends
          </TabsTrigger>
          <TabsTrigger value="assistants" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            By Assistant
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            By Type
          </TabsTrigger>
        </TabsList>

        {/* Usage Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daily AI Capacity Usage</CardTitle>
              <CardDescription>Capacity consumption over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyUsage.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No usage data yet</p>
                    <p className="text-xs mt-1">Start using AI assistants to see analytics</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyUsage}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'MMM d')}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      labelFormatter={(date) => format(new Date(date as string), 'MMM d, yyyy')}
                      formatter={(value: number) => [value.toFixed(1), 'Capacity Used']}
                    />
                    <Area
                      type="monotone"
                      dataKey="credits"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Request Volume</CardTitle>
                <CardDescription>Number of AI requests per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyUsage}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'MMM d')}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      labelFormatter={(date) => format(new Date(date as string), 'MMM d')}
                    />
                    <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Processing Volume</CardTitle>
                <CardDescription>Total processing units per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyUsage}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'MMM d')}
                      className="text-xs"
                    />
                    <YAxis 
                      className="text-xs"
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      labelFormatter={(date) => format(new Date(date as string), 'MMM d')}
                      formatter={(value: number) => [`${(value / 1000).toFixed(1)}K`, 'Units']}
                    />
                    <Bar dataKey="tokens" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Assistant */}
        <TabsContent value="assistants">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Capacity Usage by Assistant
              </CardTitle>
              <CardDescription>Which AI assistants are consuming the most capacity</CardDescription>
            </CardHeader>
            <CardContent>
              {usageByGPT.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Bot className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No assistant data yet</p>
                    <p className="text-xs mt-1">Usage will appear here once assistants are active</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {usageByGPT.map((gpt, index) => (
                      <motion.div
                        key={gpt.gpt_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{gpt.gpt_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {gpt.request_count.toLocaleString()} requests
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{gpt.total_credits.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{gpt.percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        <Progress value={gpt.percentage} className="h-2" />
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Type */}
        <TabsContent value="types">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4" />
                  Usage Distribution
                </CardTitle>
                <CardDescription>Capacity usage by interaction type</CardDescription>
              </CardHeader>
              <CardContent>
                {usageByType.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <PieChartIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">No type data yet</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={usageByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="total_credits"
                        nameKey="usage_type"
                      >
                        {usageByType.map((entry, index) => (
                          <Cell 
                            key={entry.usage_type} 
                            fill={USAGE_TYPE_CONFIG[entry.usage_type]?.color || PIE_COLORS[index % PIE_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [value.toLocaleString(), 'Capacity']}
                        labelFormatter={(label) => USAGE_TYPE_CONFIG[label as string]?.label || label}
                      />
                      <Legend 
                        formatter={(value) => USAGE_TYPE_CONFIG[value as string]?.label || value}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Usage Breakdown</CardTitle>
                <CardDescription>Detailed view by interaction type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageByType.map((type) => {
                    const config = USAGE_TYPE_CONFIG[type.usage_type] || {
                      label: type.usage_type,
                      icon: Activity,
                      color: 'hsl(var(--primary))',
                    };
                    const Icon = config.icon;
                    
                    return (
                      <div key={type.usage_type} className="flex items-center gap-4">
                        <div 
                          className="p-2 rounded-lg" 
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <Icon className="h-4 w-4" style={{ color: config.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{config.label}</span>
                            <span className="text-sm text-muted-foreground">
                              {type.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress 
                            value={type.percentage} 
                            className="h-2"
                          />
                          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                            <span>{type.total_credits.toLocaleString()} capacity</span>
                            <span>{type.request_count.toLocaleString()} requests</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
