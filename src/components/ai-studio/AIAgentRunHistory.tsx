import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AgentRun {
  id: string;
  agent_id: string;
  status: string;
  input_data: any;
  output_data: any;
  credits_used: number;
  error_message: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

interface AIAgentRunHistoryProps {
  agentId?: string | null;
}

export function AIAgentRunHistory({ agentId }: AIAgentRunHistoryProps) {
  const { user } = useAuth();
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRuns();
  }, [user, agentId]);

  const loadRuns = async () => {
    if (!user) return;
    try {
      let query = supabase
        .from('ai_agent_runs' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRuns((data as unknown as AgentRun[]) || []);
    } catch (err) {
      console.error('Error loading runs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="font-medium mb-2">No runs yet</h4>
          <p className="text-sm text-muted-foreground">Agent execution history will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-3">
        {runs.map(run => (
          <Card key={run.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(run.status)}
                  <div>
                    <p className="text-sm font-medium capitalize">{run.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(run.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {run.execution_time_ms && (
                    <span>{run.execution_time_ms}ms</span>
                  )}
                  <Badge variant="outline">{run.credits_used} credits</Badge>
                </div>
              </div>
              {run.error_message && (
                <p className="text-xs text-destructive mt-2 bg-destructive/10 p-2 rounded">
                  {run.error_message}
                </p>
              )}
              {run.output_data && (
                <pre className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded overflow-x-auto max-h-32">
                  {JSON.stringify(run.output_data, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
