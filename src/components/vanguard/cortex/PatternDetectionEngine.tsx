import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GitBranch, TrendingUp, AlertTriangle, Lightbulb,
  FileText, ArrowUpRight, Clock, Zap, BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
  severity: 'low' | 'medium' | 'high';
  firstSeen: string;
  lastSeen: string;
  rootCause?: string;
}

const DEMO_PATTERNS: DetectedPattern[] = [
  {
    id: '1',
    patternName: 'Outlook Autodiscover Failures',
    category: 'Email',
    occurrences: 47,
    trend: 'rising',
    trendPercent: 23,
    affectedClients: 8,
    avgResolutionTime: '45 min',
    suggestedKB: true,
    severity: 'high',
    firstSeen: '2025-01-15',
    lastSeen: '2025-01-29',
    rootCause: 'DNS misconfiguration after domain migration'
  },
  {
    id: '2',
    patternName: 'VPN Split Tunnel Issues',
    category: 'Network',
    occurrences: 31,
    trend: 'stable',
    trendPercent: 5,
    affectedClients: 12,
    avgResolutionTime: '30 min',
    suggestedKB: true,
    severity: 'medium',
    firstSeen: '2025-01-10',
    lastSeen: '2025-01-28',
    rootCause: 'Policy conflict with Windows Defender Firewall'
  },
  {
    id: '3',
    patternName: 'OneDrive Sync Hanging',
    category: 'Cloud Storage',
    occurrences: 28,
    trend: 'rising',
    trendPercent: 15,
    affectedClients: 6,
    avgResolutionTime: '25 min',
    suggestedKB: false,
    severity: 'medium',
    firstSeen: '2025-01-20',
    lastSeen: '2025-01-29'
  },
  {
    id: '4',
    patternName: 'Printer Spooler Crashes',
    category: 'Hardware',
    occurrences: 19,
    trend: 'declining',
    trendPercent: 12,
    affectedClients: 4,
    avgResolutionTime: '15 min',
    suggestedKB: true,
    severity: 'low',
    firstSeen: '2025-01-05',
    lastSeen: '2025-01-27',
    rootCause: 'Outdated HP Universal Print Driver'
  }
];

const TREND_DATA = [
  { date: '01/22', outlook: 5, vpn: 4, onedrive: 2, printer: 6 },
  { date: '01/23', outlook: 7, vpn: 5, onedrive: 3, printer: 5 },
  { date: '01/24', outlook: 8, vpn: 4, onedrive: 4, printer: 4 },
  { date: '01/25', outlook: 10, vpn: 6, onedrive: 5, printer: 3 },
  { date: '01/26', outlook: 9, vpn: 5, onedrive: 6, printer: 3 },
  { date: '01/27', outlook: 12, vpn: 4, onedrive: 7, printer: 2 },
  { date: '01/28', outlook: 14, vpn: 5, onedrive: 8, printer: 2 },
  { date: '01/29', outlook: 12, vpn: 4, onedrive: 6, printer: 1 }
];

export function PatternDetectionEngine() {
  const [patterns] = useState<DetectedPattern[]>(DEMO_PATTERNS);
  const [selectedPattern, setSelectedPattern] = useState<DetectedPattern | null>(DEMO_PATTERNS[0]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 border-red-500/40 bg-red-500/10';
      case 'medium': return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
      default: return 'text-green-400 border-green-500/40 bg-green-500/10';
    }
  };

  const getTrendIcon = (trend: string, percent: number) => {
    if (trend === 'rising') {
      return <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />;
    } else if (trend === 'declining') {
      return <ArrowUpRight className="h-3.5 w-3.5 text-green-400 rotate-90" />;
    }
    return <span className="text-slate-400 text-xs">~</span>;
  };

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
            Pattern Trends (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA}>
                <defs>
                  <linearGradient id="outlookGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="vpnGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
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
                <Area type="monotone" dataKey="outlook" stroke="#f87171" fill="url(#outlookGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="vpn" stroke="#22d3ee" fill="url(#vpnGradient)" strokeWidth={2} />
                <Line type="monotone" dataKey="onedrive" stroke="#a78bfa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="printer" stroke="#4ade80" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-xs text-slate-400">Outlook</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
              <span className="text-xs text-slate-400">VPN</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-400" />
              <span className="text-xs text-slate-400">OneDrive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs text-slate-400">Printer</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pattern List */}
        <Card className="bg-black/80 border-cyan-500/30 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-purple-400 text-sm">Detected Patterns</CardTitle>
          </CardHeader>
          <CardContent>
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
                        {getTrendIcon(pattern.trend, pattern.trendPercent)}
                        <span className={pattern.trend === 'rising' ? 'text-red-400' : pattern.trend === 'declining' ? 'text-green-400' : 'text-slate-400'}>
                          {pattern.trendPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Pattern Details */}
        {selectedPattern && (
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
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
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
                    {getTrendIcon(selectedPattern.trend, selectedPattern.trendPercent)}
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
        )}
      </div>
    </div>
  );
}
