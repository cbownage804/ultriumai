import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Users, Globe, Clock, Filter, RefreshCw, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_details: any;
  ip_address: unknown;
  user_agent: string;
  location_country: string;
  location_city: string;
  session_id: string;
  created_at: string;
}

export const UserActivityDashboard = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const { toast } = useToast();

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'login', label: 'Logins' },
    { value: 'logout', label: 'Logouts' },
    { value: 'page_view', label: 'Page Views' },
    { value: 'feature_usage', label: 'Feature Usage' },
    { value: 'api_call', label: 'API Calls' },
    { value: 'error', label: 'Errors' }
  ];

  const fetchActivities = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (activityFilter !== 'all') {
        query = query.eq('activity_type', activityFilter);
      }

      if (searchTerm) {
        query = query.or(`activity_details.ilike.%${searchTerm}%,ip_address.ilike.%${searchTerm}%,location_country.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActivities(data || []);

      // Calculate stats
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const onlineCount = data?.filter(log => 
        log.activity_type === 'page_view' && 
        new Date(log.created_at) > fiveMinutesAgo
      ).length || 0;
      
      const uniqueSessions = new Set(data?.map(log => log.session_id)).size;
      
      setOnlineUsers(onlineCount);
      setTotalSessions(uniqueSessions);

    } catch (error: any) {
      toast({
        title: "Error fetching activities",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const csv = [
        ['Timestamp', 'User ID', 'Activity Type', 'IP Address', 'Location', 'User Agent'].join(','),
        ...data.map(log => [
          log.created_at,
          log.user_id,
          log.activity_type,
          log.ip_address,
          `${log.location_city}, ${log.location_country}`,
          log.user_agent
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-activities-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "User activities exported to CSV",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <Users className="h-4 w-4 text-green-500" />;
      case 'logout': return <Users className="h-4 w-4 text-red-500" />;
      case 'page_view': return <Globe className="h-4 w-4 text-blue-500" />;
      case 'feature_usage': return <Activity className="h-4 w-4 text-purple-500" />;
      case 'api_call': return <Activity className="h-4 w-4 text-orange-500" />;
      case 'error': return <Activity className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login': return 'default';
      case 'logout': return 'destructive';
      case 'page_view': return 'secondary';
      case 'feature_usage': return 'outline';
      case 'api_call': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [searchTerm, activityFilter]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online Users</p>
                <p className="text-2xl font-bold">{onlineUsers}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{totalSessions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold">{activities.length}</p>
              </div>
              <Globe className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time User Activity
              </CardTitle>
              <CardDescription>
                Monitor user behavior and system interactions in real-time
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchActivities}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={exportActivities}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search activities, IP addresses, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}

          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    {getActivityIcon(activity.activity_type)}
                    <Badge variant={getActivityColor(activity.activity_type) as any}>
                      {activity.activity_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      User: {activity.user_id.slice(0, 8)}...
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {String(activity.ip_address || 'Unknown IP')} • {activity.location_city}, {activity.location_country}
                    </div>
                    {activity.activity_details && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {JSON.stringify(activity.activity_details).slice(0, 100)}...
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(activity.created_at), 'MMM dd, HH:mm:ss')}</span>
                </div>
              </div>
            ))}
          </div>

          {!loading && activities.length === 0 && (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No activities found</h3>
              <p className="text-muted-foreground">
                No user activities match your current filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};