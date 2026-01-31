import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GitBranch, AlertTriangle, Lightbulb,
  FileText, ArrowUpRight, Clock, Zap, BarChart3, RefreshCw, Loader2, Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

interface DetectedPattern {
  id: string;
  patternName: string;
  category: string;
  occurrences: number;
  trend: 'rising' | 'stable' | 'declining';
  trendPercent: number;
  affectedClients: number;
  avgResolutionTime: string;
  suggestedKB: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  firstSeen: string;
  lastSeen: string;
  rootCause?: string;
}

interface TrendDataPoint {
  date: string;
  [key: string]: number | string;
}

export function PatternDetectionEngine() {
  const { user } = useAuth();
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<DetectedPattern | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (user) loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([loadPatterns(), loadTrendData()]);
    setIsLoading(false);
  };

  const runPatternAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('analyze-ticket-patterns', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast.success('Pattern analysis complete', {
        description: `Analyzed ${data.tickets_analyzed} tickets, found ${data.patterns_found} patterns`
      });

      // Reload patterns
      await loadPatterns();
    } catch (err: any) {
      console.error('Pattern analysis failed:', err);
      toast.error('Analysis failed', { description: err.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadPatterns = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('vanguard_detected_patterns')
        .select('*')
        .eq('user_id', user?.id)
        .order('occurrences', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((p: any) => ({
        id: p.id,
        patternName: p.pattern_name,
        category: p.category || 'General',
        occurrences: p.occurrences || 0,
        trend: p.trend || 'stable',
        trendPercent: Number(p.trend_percent) || 0,
        affectedClients: p.affected_clients || 0,
        avgResolutionTime: p.avg_resolution_time_minutes 
          ? `${Math.round(p.avg_resolution_time_minutes)} min` 
          : 'N/A',
        suggestedKB: p.suggested_kb || false,
        severity: p.severity || 'medium',
        firstSeen: p.first_seen_at ? format(new Date(p.first_seen_at), 'yyyy-MM-dd') : 'N/A',
        lastSeen: p.last_seen_at ? format(new Date(p.last_seen_at), 'yyyy-MM-dd') : 'N/A',
        rootCause: p.root_cause
      }));

      setPatterns(mapped);
      if (mapped.length > 0 && !selectedPattern) {
        setSelectedPattern(mapped[0]);
      }
    } catch (err) {
      console.error('Failed to load patterns:', err);
    }
  };

  const loadTrendData = async () => {
    try {
      // Get last 7 days of trend data from security events
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      const { data: events, error } = await supabase
        .from('security_events')
        .select('event_type, created_at')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Aggregate by day and event type
      const dayMap: Record<string, TrendDataPoint> = {};
      
      for (let i = 7; i >= 0; i--) {
        const dateKey = format(subDays(new Date(), i), 'MM/dd');
        dayMap[dateKey] = { date: dateKey };
      }

      (events || []).forEach((evt: any) => {
        const dateKey = format(new Date(evt.created_at), 'MM/dd');
        const type = (evt.event_type || 'unknown').toLowerCase().replace(/[^a-z]/g, '');
        if (dayMap[dateKey]) {
          const currentVal = dayMap[dateKey][type];
          dayMap[dateKey][type] = (typeof currentVal === 'number' ? currentVal : 0) + 1;
        }
      });

      setTrendData(Object.values(dayMap));
    } catch (err) {
      console.error('Failed to load trend data:', err);
      // Fallback to empty trend
      const data: TrendDataPoint[] = [];
      for (let i = 7; i >= 0; i--) {
        data.push({ date: format(subDays(new Date(), i), 'MM/dd') });
      }
      setTrendData(data);
    }
  };

  const generateKBArticle = async (pattern: DetectedPattern) => {
    toast.success('Generating KB article...', { description: pattern.patternName });
    // This would trigger the KBArticleGenerator with this pattern
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 border-red-500/40 bg-red-500/10';
      case 'high': return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
      case 'medium': return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
      default: return 'text-green-400 border-green-500/40 bg-green-500/10';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'rising') {
      return <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />;
    } else if (trend === 'declining') {
      return <ArrowUpRight className="h-3.5 w-3.5 text-green-400 rotate-90" />;
    }
    return <span className="text-slate-400 text-xs">~</span>;
  };

  // Get unique data keys for chart lines
  const dataKeys = trendData.length > 0 
    ? Object.keys(trendData[0]).filter(k => k !== 'date')
    : [];
  
  const colors = ['#f87171', '#22d3ee', '#a78bfa', '#4ade80', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <GitBranch className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Pattern Detection Engine</h2>
            <p className="text-sm text-slate-400">AI identifies recurring issues across your ticket corpus</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runPatternAnalysis} 
            disabled={isAnalyzing}
            className="border-purple-500/40 hover:border-purple-500/60"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1 text-purple-400" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadAllData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="outline" className="border-purple-500/40 text-purple-400">
            {patterns.length} Patterns Detected
          </Badge>
          <Badge className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white">
            <Zap className="h-3 w-3 mr-1" />
            Live Analysis
          </Badge>
        </div>
      </div>

      {/* Trend Chart */}
      <Card className="bg-black/80 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Event Trends (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {trendData.length > 0 && dataKeys.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    {dataKeys.slice(0, 4).map((key, i) => (
                      <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #22d3ee40',
                      borderRadius: '8px'
                    }}
                  />
                  {dataKeys.slice(0, 4).map((key, i) => (
                    <Area 
                      key={key}
                      type="monotone" 
                      dataKey={key} 
                      stroke={colors[i % colors.length]} 
                      fill={`url(#gradient-${key})`} 
                      strokeWidth={2} 
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No trend data available</p>
                </div>
              </div>
            )}
          </div>
          {dataKeys.length > 0 && (
            <div className="flex items-center justify-center gap-6 mt-4">
              {dataKeys.slice(0, 4).map((key, i) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                  <span className="text-xs text-slate-400 capitalize">{key}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pattern List */}
        <Card className="bg-black/80 border-cyan-500/30 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-purple-400 text-sm">Detected Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            {patterns.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No patterns detected yet</p>
                <p className="text-sm">AI will identify recurring issues automatically</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      onClick={() => setSelectedPattern(pattern)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPattern?.id === pattern.id
                          ? 'bg-purple-500/10 border-purple-500/40'
                          : 'bg-slate-900/50 border-slate-700 hover:border-purple-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm text-white font-medium">{pattern.patternName}</p>
                          <p className="text-xs text-slate-500">{pattern.category}</p>
                        </div>
                        <Badge className={`text-xs ${getSeverityColor(pattern.severity)}`}>
                          {pattern.severity}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className="text-slate-400">{pattern.occurrences} tickets</span>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(pattern.trend)}
                          <span className={pattern.trend === 'rising' ? 'text-red-400' : pattern.trend === 'declining' ? 'text-green-400' : 'text-slate-400'}>
                            {pattern.trendPercent}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Pattern Details */}
        {selectedPattern ? (
          <Card className="bg-black/80 border-cyan-500/30 lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white">{selectedPattern.patternName}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {selectedPattern.category} • First seen: {selectedPattern.firstSeen}
                  </CardDescription>
                </div>
                {selectedPattern.suggestedKB && (
                  <Button 
                    onClick={() => generateKBArticle(selectedPattern)}
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate KB Article
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                  <p className="text-xs text-slate-500">Total Occurrences</p>
                  <p className="text-xl font-bold text-white">{selectedPattern.occurrences}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                  <p className="text-xs text-slate-500">Affected Clients</p>
                  <p className="text-xl font-bold text-cyan-400">{selectedPattern.affectedClients}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                  <p className="text-xs text-slate-500">Avg Resolution</p>
                  <p className="text-xl font-bold text-amber-400">{selectedPattern.avgResolutionTime}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                  <p className="text-xs text-slate-500">Trend</p>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(selectedPattern.trend)}
                    <span className={`text-xl font-bold ${
                      selectedPattern.trend === 'rising' ? 'text-red-400' : 
                      selectedPattern.trend === 'declining' ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {selectedPattern.trendPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Root Cause */}
              {selectedPattern.rootCause && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-400">AI-Identified Root Cause</p>
                      <p className="text-sm text-slate-300 mt-1">{selectedPattern.rootCause}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-sm text-slate-400 mb-3">Pattern Timeline</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-400">First: {selectedPattern.firstSeen}</span>
                  </div>
                  <div className="flex-1 h-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded" />
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-400">Last: {selectedPattern.lastSeen}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-black/80 border-cyan-500/30 lg:col-span-2">
            <CardContent className="flex items-center justify-center h-[400px] text-slate-500">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a pattern to view details</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
