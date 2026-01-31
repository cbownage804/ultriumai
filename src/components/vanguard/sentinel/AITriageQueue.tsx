import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, AlertTriangle, CheckCircle, XCircle, 
  Clock, Loader2, RefreshCw, Zap, TrendingUp,
  Target, BarChart3, Eye
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface AIAnalysis {
  id: string;
  event_id: string;
  risk_score: number;
  threat_category: string | null;
  ai_decision: string;
  confidence_score: number;
  ai_reasoning: string | null;
  auto_ticket_created: boolean;
  analyzed_at: string;
}

export function AITriageQueue() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('vanguard_sentinel_ai_analysis')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching AI analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const processQueue = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sentinel-ai-triage', {
        body: { autoTriage: true }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Analyzed ${data.analyzed || 0} events`, {
        description: `Escalated: ${data.summary?.escalated || 0}, Auto-resolved: ${data.summary?.dismissed || 0}`
      });
      fetchAnalyses();
    } catch (error) {
      console.error('Error processing queue:', error);
      toast.error('Failed to process queue');
    } finally {
      setProcessing(false);
    }
  };

  const getActionBadge = (action: string) => {
    const config: Record<string, { icon: React.ReactNode; color: string }> = {
      escalate: { icon: <AlertTriangle className="h-3 w-3" />, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      investigate: { icon: <Eye className="h-3 w-3" />, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      monitor: { icon: <Clock className="h-3 w-3" />, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      dismiss: { icon: <CheckCircle className="h-3 w-3" />, color: 'bg-green-500/20 text-green-400 border-green-500/30' }
    };
    const { icon, color } = config[action] || config.monitor;
    return (
      <Badge className={color}>
        {icon}
        <span className="ml-1 capitalize">{action}</span>
      </Badge>
    );
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const mapAnalysis = (a: AIAnalysis) => ({
    ...a,
    recommended_action: a.ai_decision,
    confidence: a.confidence_score,
    reasoning: a.ai_reasoning,
    auto_resolved: a.ai_decision === 'dismiss',
    created_at: a.analyzed_at
  });

  // Calculate stats
  const mappedAnalyses = analyses.map(mapAnalysis);
  const stats = {
    total: analyses.length,
    autoResolved: mappedAnalyses.filter(a => a.auto_resolved).length,
    escalated: mappedAnalyses.filter(a => a.recommended_action === 'escalate').length,
    avgConfidence: analyses.length > 0
      ? Math.round(analyses.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / analyses.length)
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Cortex AI Triage Queue</h2>
          <p className="text-slate-400 text-sm">AI-powered analysis and automated response</p>
        </div>
        <Button 
          onClick={processQueue}
          disabled={processing}
          className="bg-gradient-to-r from-purple-500 to-cyan-600"
        >
          {processing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
          ) : (
            <><Zap className="h-4 w-4 mr-2" />Process Queue</>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/60 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Total Analyzed</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Auto-Resolved</p>
                <p className="text-2xl font-bold text-green-400">{stats.autoResolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Escalated</p>
                <p className="text-2xl font-bold text-red-400">{stats.escalated}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Avg Confidence</p>
                <p className="text-2xl font-bold text-cyan-400">{stats.avgConfidence}%</p>
              </div>
              <Target className="h-8 w-8 text-cyan-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Efficiency Chart Placeholder */}
      <Card className="bg-black/60 border-purple-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            AI Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 py-6">
            <div className="text-center">
              <div className="relative inline-flex">
                <div className="w-20 h-20 rounded-full border-4 border-purple-500/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-400">
                    {stats.total > 0 ? Math.round((stats.autoResolved / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mt-2">Auto-Resolution Rate</p>
            </div>
            <div className="text-center">
              <div className="relative inline-flex">
                <div className="w-20 h-20 rounded-full border-4 border-cyan-500/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-cyan-400">{stats.avgConfidence}%</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mt-2">Avg Confidence</p>
            </div>
            <div className="text-center">
              <div className="relative inline-flex">
                <div className="w-20 h-20 rounded-full border-4 border-green-500/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-400">14m</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mt-2">Avg Response Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Analyses */}
      <Card className="bg-black/60 border-purple-500/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              Recent AI Analyses
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchAnalyses}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {analyses.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-purple-400/30 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No AI Analyses Yet</h3>
                <p className="text-slate-400 text-sm">Process the queue to analyze pending security events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mappedAnalyses.map((analysis) => (
                  <div 
                    key={analysis.id} 
                    className={`p-4 rounded-lg border ${
                      analysis.auto_resolved 
                        ? 'bg-green-500/5 border-green-500/20'
                        : analysis.recommended_action === 'escalate'
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-slate-800/50 border-purple-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getActionBadge(analysis.recommended_action)}
                          {analysis.threat_category && (
                            <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                              {analysis.threat_category}
                            </Badge>
                          )}
                          {analysis.auto_resolved && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <CheckCircle className="h-3 w-3 mr-1" />Auto-Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-300 text-sm mb-2">
                          {analysis.reasoning || 'No detailed reasoning provided'}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-400 text-xs">Risk</span>
                          <span className={`text-xl font-bold ${getRiskColor(analysis.risk_score)}`}>
                            {analysis.risk_score}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-slate-500 text-xs">Confidence</span>
                          <span className="text-cyan-400 text-sm font-medium">{analysis.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
