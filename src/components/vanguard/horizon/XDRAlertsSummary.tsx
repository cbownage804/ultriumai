import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { getVanguardBasePath } from "@/utils/subdomain";
import { 
  Shield, ExternalLink, Zap, 
  Activity, ChevronRight, Target
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface XDRThreat {
  id: string;
  threat_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  ai_confidence: number | null;
  created_at: string;
  status: string;
  mitre_technique: string | null;
  mitre_tactic: string | null;
  ai_analysis: any;
  process_name: string | null;
}

export function XDRAlertsSummary() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();

  const { data: threats, isLoading } = useQuery({
    queryKey: ['horizon-xdr-alerts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { recent: [], stats: { critical: 0, high: 0, total: 0 } };

      // Get recent threats
      const { data: recentThreats, error } = await supabase
        .from('xdr_threats')
        .select(`
          id,
          threat_type,
          severity,
          ai_confidence,
          created_at,
          status,
          mitre_technique,
          mitre_tactic,
          ai_analysis,
          process_name
        `)
        .eq('user_id', user.id)
        .in('status', ['detected', 'investigating', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Get stats
      const { count: criticalCount } = await supabase
        .from('xdr_threats')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('severity', 'critical')
        .in('status', ['detected', 'investigating', 'in_progress']);

      const { count: highCount } = await supabase
        .from('xdr_threats')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('severity', 'high')
        .in('status', ['detected', 'investigating', 'in_progress']);

      const { count: totalCount } = await supabase
        .from('xdr_threats')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['detected', 'investigating', 'in_progress']);

      return {
        recent: (recentThreats || []) as XDRThreat[],
        stats: {
          critical: criticalCount || 0,
          high: highCount || 0,
          total: totalCount || 0
        }
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasThreats = threats && (threats.stats.critical > 0 || threats.stats.high > 0);

  return (
    <Card className={`border ${hasThreats 
      ? 'bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent border-red-500/30' 
      : 'bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20'
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className={`h-5 w-5 ${hasThreats ? 'text-red-500' : 'text-green-500'}`} />
            Pursuit XDR Alerts
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => navigate(`${basePath}/alerts`)}
          >
            Open Pursuit
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={`p-3 rounded-lg text-center ${threats?.stats.critical ? 'bg-red-500/20 border border-red-500/30' : 'bg-muted/20'}`}>
            <p className={`text-2xl font-bold ${threats?.stats.critical ? 'text-red-400' : 'text-muted-foreground'}`}>
              {threats?.stats.critical || 0}
            </p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${threats?.stats.high ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-muted/20'}`}>
            <p className={`text-2xl font-bold ${threats?.stats.high ? 'text-orange-400' : 'text-muted-foreground'}`}>
              {threats?.stats.high || 0}
            </p>
            <p className="text-xs text-muted-foreground">High</p>
          </div>
          <div className="p-3 rounded-lg text-center bg-muted/20">
            <p className="text-2xl font-bold text-muted-foreground">
              {threats?.stats.total || 0}
            </p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
        </div>

        {/* Recent Threats */}
        {threats?.recent && threats.recent.length > 0 ? (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {threats.recent.map((threat) => (
                <div 
                  key={threat.id}
                  className="p-3 rounded-lg bg-background/50 border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => navigate(`${basePath}/alerts`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getSeverityColor(threat.severity)}>
                          {threat.severity.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-sm truncate">
                          {threat.threat_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{threat.process_name || 'Unknown process'}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(threat.created_at), { addSuffix: true })}</span>
                      </div>
                      {threat.mitre_technique && (
                        <div className="flex items-center gap-1 mt-1">
                          <Target className="h-3 w-3 text-purple-400" />
                          <span className="text-xs text-purple-400 font-mono">
                            {threat.mitre_technique}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">
                          {Math.round((threat.ai_confidence || 0) * 100)}%
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Activity className="h-10 w-10 mb-2 text-green-500/50" />
            <p className="text-sm">No active threats</p>
            <p className="text-xs">Your environment is secure</p>
          </div>
        )}

        {/* Quick Actions */}
        {hasThreats && (
          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              variant="destructive" 
              className="flex-1"
              onClick={() => navigate(`${basePath}/alerts`)}
            >
              <Zap className="h-4 w-4 mr-2" />
              Investigate Threats
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
