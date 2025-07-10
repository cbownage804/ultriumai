import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Calendar as CalendarIcon,
  Filter,
  Download,
  RefreshCw,
  Users,
  Target,
  Timer,
  Plus
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface TicketMetrics {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  slaBreaches: number;
  satisfactionScore: number;
  ticketsByPriority: Record<string, number>;
  ticketsByStatus: Record<string, number>;
  ticketsByCategory: Record<string, number>;
  recentActivity: TicketActivity[];
}

interface TicketActivity {
  id: string;
  type: 'created' | 'updated' | 'closed' | 'escalated';
  ticketId: string;
  title: string;
  priority: string;
  timestamp: string;
  agent?: string;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-purple-100 text-purple-800',
  pending: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

export const AdvancedTicketDashboard = () => {
  const [metrics, setMetrics] = useState<TicketMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date()),
  });
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    category: 'all',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
  }, [dateRange, filters]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Since we don't have actual ticket data, we'll simulate metrics
      // In a real app, you'd query your helpdesk_tickets table
      const mockMetrics: TicketMetrics = {
        totalTickets: 156,
        openTickets: 23,
        closedTickets: 133,
        avgResponseTime: 2.5, // hours
        avgResolutionTime: 18.5, // hours
        slaBreaches: 8,
        satisfactionScore: 4.2,
        ticketsByPriority: {
          low: 45,
          medium: 67,
          high: 32,
          critical: 12,
        },
        ticketsByStatus: {
          open: 23,
          'in-progress': 15,
          pending: 8,
          resolved: 45,
          closed: 65,
        },
        ticketsByCategory: {
          'Technical Support': 78,
          'Account Management': 23,
          'Billing': 19,
          'Feature Request': 15,
          'Bug Report': 21,
        },
        recentActivity: [
          {
            id: '1',
            type: 'created',
            ticketId: 'T-001',
            title: 'Unable to login to dashboard',
            priority: 'high',
            timestamp: new Date().toISOString(),
          },
          {
            id: '2',
            type: 'closed',
            ticketId: 'T-002',
            title: 'Password reset issue',
            priority: 'medium',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            agent: 'John Doe',
          },
          {
            id: '3',
            type: 'escalated',
            ticketId: 'T-003',
            title: 'Critical server outage',
            priority: 'critical',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          },
        ],
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    toast({
      title: "Export Started",
      description: "Your dashboard data is being prepared for download",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Ticket Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Comprehensive ticket metrics and performance insights
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical-support">Technical Support</SelectItem>
                  <SelectItem value="account-management">Account Management</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="feature-request">Feature Request</SelectItem>
                  <SelectItem value="bug-report">Bug Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">{metrics.totalTickets}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
                <p className="text-2xl font-bold">{metrics.openTickets}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600">-5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{metrics.avgResponseTime}h</p>
              </div>
              <Timer className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">-0.5h from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SLA Breaches</p>
                <p className="text-2xl font-bold">{metrics.slaBreaches}</p>
              </div>
              <Target className="h-8 w-8 text-red-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600">+2 from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.ticketsByPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={priorityColors[priority as keyof typeof priorityColors]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(count / metrics.totalTickets) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.ticketsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[status as keyof typeof statusColors]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(count / metrics.totalTickets) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Ticket Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    activity.type === 'created' && "bg-blue-100",
                    activity.type === 'closed' && "bg-green-100",
                    activity.type === 'escalated' && "bg-red-100",
                    activity.type === 'updated' && "bg-purple-100"
                  )}>
                    {activity.type === 'created' && <Plus className="h-4 w-4 text-blue-600" />}
                    {activity.type === 'closed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {activity.type === 'escalated' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    {activity.type === 'updated' && <Clock className="h-4 w-4 text-purple-600" />}
                  </div>
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Ticket {activity.ticketId} • {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                      {activity.agent && ` • by ${activity.agent}`}
                    </p>
                  </div>
                </div>
                <Badge className={priorityColors[activity.priority as keyof typeof priorityColors]}>
                  {activity.priority}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};