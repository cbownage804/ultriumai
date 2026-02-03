/**
 * Portal Activity Log Component
 * Shows portal user login and activity history
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, Clock, User, Ticket, Key, Globe, Search,
  LogIn, LogOut, Eye, Plus, RefreshCw, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: string;
  activity_type: string;
  activity_details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
  client_portal_users?: {
    full_name: string;
    email: string;
  };
}

interface PortalActivityLogProps {
  clientId?: string;
  portalUserId?: string;
  limit?: number;
}

export function PortalActivityLog({ clientId, portalUserId, limit = 50 }: PortalActivityLogProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [clientId, portalUserId]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('portal_activity_logs')
        .select('*, client_portal_users(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      if (portalUserId) {
        query = query.eq('portal_user_id', portalUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data || []) as unknown as ActivityLog[]);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return LogIn;
      case 'logout': return LogOut;
      case 'view_tickets': return Eye;
      case 'view_ticket': return Ticket;
      case 'create_ticket': return Plus;
      case 'add_comment': return Plus;
      case 'access_safepass': return Key;
      case 'access_safescan': return Search;
      case 'access_safeweb': return Globe;
      default: return Activity;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'login': return 'Logged in';
      case 'logout': return 'Logged out';
      case 'view_tickets': return 'Viewed tickets';
      case 'view_ticket': return 'Viewed ticket';
      case 'create_ticket': return 'Created ticket';
      case 'add_comment': return 'Added comment';
      case 'access_safepass': return 'Accessed SafePass';
      case 'access_safescan': return 'Accessed SafeScan';
      case 'access_safeweb': return 'Accessed SafeWeb';
      case 'access_safetrack': return 'Accessed SafeTrack';
      default: return type.replace('_', ' ');
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login': return 'text-green-400';
      case 'logout': return 'text-slate-400';
      case 'create_ticket': return 'text-purple-400';
      case 'view_ticket': 
      case 'view_tickets': return 'text-blue-400';
      case 'access_safepass':
      case 'access_safescan':
      case 'access_safeweb':
      case 'access_safetrack': return 'text-cyan-400';
      default: return 'text-white/60';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-black/40 border-cyan-500/30">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-cyan-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-white">Activity Log</CardTitle>
              <CardDescription>
                Recent portal user activity
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchLogs}
            className="text-white/60 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No activity recorded yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {logs.map((log) => {
                const Icon = getActivityIcon(log.activity_type);
                const colorClass = getActivityColor(log.activity_type);

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className={`p-2 rounded-lg bg-white/5 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">
                          {getActivityLabel(log.activity_type)}
                        </span>
                        {log.activity_details?.subject && (
                          <span className="text-white/50 text-sm truncate">
                            "{log.activity_details.subject}"
                          </span>
                        )}
                        {log.activity_details?.ticketId && (
                          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                            #{log.activity_details.ticketId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                        {log.client_portal_users && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.client_portal_users.full_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                        {log.ip_address && (
                          <span className="font-mono">{log.ip_address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
