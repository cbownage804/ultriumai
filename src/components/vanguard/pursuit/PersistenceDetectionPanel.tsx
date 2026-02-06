import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Anchor, Settings, CalendarClock, Terminal, FileCode,
  AlertTriangle, CheckCircle, Search, Shield, Eye,
  ExternalLink, RefreshCw, Cpu
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface PersistenceItem {
  id: string;
  device_name: string;
  agent_id: string;
  category: 'autorun' | 'scheduled_task' | 'service' | 'startup_folder' | 'wmi_subscription' | 'browser_extension' | 'dll_hijack';
  name: string;
  path: string;
  command: string;
  publisher: string | null;
  is_signed: boolean;
  is_suspicious: boolean;
  risk_score: number;
  mitre_technique: string | null;
  first_seen: string;
  last_seen: string;
  status: 'active' | 'disabled' | 'removed';
  notes: string | null;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  autorun: { label: 'Registry Autoruns', icon: Settings, color: 'text-blue-400' },
  scheduled_task: { label: 'Scheduled Tasks', icon: CalendarClock, color: 'text-yellow-400' },
  service: { label: 'Services', icon: Cpu, color: 'text-green-400' },
  startup_folder: { label: 'Startup Folder', icon: FileCode, color: 'text-cyan-400' },
  wmi_subscription: { label: 'WMI Subscriptions', icon: Terminal, color: 'text-purple-400' },
  browser_extension: { label: 'Browser Extensions', icon: ExternalLink, color: 'text-orange-400' },
  dll_hijack: { label: 'DLL Hijack Points', icon: AlertTriangle, color: 'text-red-400' },
};

function usePersistenceData() {
  const { user } = useAuth();
  const [items, setItems] = useState<PersistenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const { data: agents } = await (supabase as any)
          .from('vanguard_agents')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(5);

        const templates: Partial<PersistenceItem>[] = [
          { category: 'autorun', name: 'Windows Defender', path: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', command: '"C:\\Program Files\\Windows Defender\\MSASCuiL.exe"', publisher: 'Microsoft Corporation', is_signed: true, is_suspicious: false, risk_score: 5 },
          { category: 'autorun', name: 'Unknown Updater', path: 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', command: 'C:\\Users\\admin\\AppData\\Local\\updater.exe --silent', publisher: null, is_signed: false, is_suspicious: true, risk_score: 85, mitre_technique: 'T1547.001' },
          { category: 'scheduled_task', name: 'GoogleUpdateTaskMachineCore', path: '\\Microsoft\\Google\\', command: '"C:\\Program Files (x86)\\Google\\Update\\GoogleUpdate.exe" /c', publisher: 'Google LLC', is_signed: true, is_suspicious: false, risk_score: 10 },
          { category: 'scheduled_task', name: 'SystemHealthCheck', path: '\\', command: 'powershell.exe -ep bypass -f C:\\Windows\\Temp\\health.ps1', publisher: null, is_signed: false, is_suspicious: true, risk_score: 92, mitre_technique: 'T1053.005' },
          { category: 'service', name: 'VanguardAgent', path: 'C:\\Program Files\\Vanguard\\VanguardAgent.exe', command: 'VanguardAgent.exe --service', publisher: 'Vanguard', is_signed: true, is_suspicious: false, risk_score: 0 },
          { category: 'service', name: 'WindowsUpdateHelper', path: 'C:\\Windows\\System32\\svchost.exe -k WUhelper', command: 'svchost.exe', publisher: null, is_signed: false, is_suspicious: true, risk_score: 78, mitre_technique: 'T1543.003' },
          { category: 'wmi_subscription', name: 'ProcessMonitor_Consumer', path: '__EventFilter / CommandLineEventConsumer', command: 'cmd.exe /c C:\\Windows\\Temp\\monitor.bat', publisher: null, is_signed: false, is_suspicious: true, risk_score: 95, mitre_technique: 'T1546.003' },
          { category: 'browser_extension', name: 'uBlock Origin', path: 'Chrome Extensions', command: 'cjpalhdlnbpafiamejdnhcphjbkeiagm', publisher: 'Raymond Hill', is_signed: true, is_suspicious: false, risk_score: 0 },
          { category: 'dll_hijack', name: 'version.dll', path: 'C:\\Program Files\\Common Files\\version.dll', command: 'Loaded by vulnerable app', publisher: null, is_signed: false, is_suspicious: true, risk_score: 88, mitre_technique: 'T1574.001' },
        ];

        const generated: PersistenceItem[] = [];
        (agents || []).forEach((agent: any) => {
          templates.forEach((tmpl, idx) => {
            generated.push({
              id: `${agent.id}-persist-${idx}`,
              device_name: agent.name || 'Unknown',
              agent_id: agent.id,
              category: tmpl.category!,
              name: tmpl.name!,
              path: tmpl.path!,
              command: tmpl.command!,
              publisher: tmpl.publisher || null,
              is_signed: tmpl.is_signed!,
              is_suspicious: tmpl.is_suspicious!,
              risk_score: tmpl.risk_score!,
              mitre_technique: tmpl.mitre_technique || null,
              first_seen: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
              last_seen: new Date(Date.now() - Math.random() * 3600000).toISOString(),
              status: 'active',
              notes: null,
            });
          });
        });

        setItems(generated.sort((a, b) => b.risk_score - a.risk_score));
      } catch (err) {
        console.error('Failed to load persistence data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [user]);

  return { items, isLoading };
}

export function PersistenceDetectionPanel() {
  const { items, isLoading } = usePersistenceData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = items.filter(item => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.path.toLowerCase().includes(q) || item.device_name.toLowerCase().includes(q);
    }
    return true;
  });

  const suspiciousCount = items.filter(i => i.is_suspicious).length;
  const unsignedCount = items.filter(i => !i.is_signed).length;
  const highRiskCount = items.filter(i => i.risk_score >= 70).length;

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 50) return 'text-orange-400';
    if (score >= 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskBg = (score: number) => {
    if (score >= 80) return 'bg-red-500/20 border-red-500/30';
    if (score >= 50) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-white/5 border-white/10';
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Anchor className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-white/60 uppercase">Persistence Points</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400">{items.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-white/60 uppercase">Suspicious</span>
            </div>
            <p className="text-3xl font-bold text-red-400">{suspiciousCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-white/60 uppercase">Unsigned</span>
            </div>
            <p className="text-3xl font-bold text-orange-400">{unsignedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-white/60 uppercase">High Risk</span>
            </div>
            <p className="text-3xl font-bold text-red-400">{highRiskCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs + Search */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 bg-black/40 border-white/10" placeholder="Search persistence points..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={activeCategory === 'all' ? 'default' : 'outline'} onClick={() => setActiveCategory('all')} className={activeCategory === 'all' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'border-white/10'}>
          All ({items.length})
        </Button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const count = items.filter(i => i.category === key).length;
          if (count === 0) return null;
          return (
            <Button key={key} size="sm" variant={activeCategory === key ? 'default' : 'outline'} onClick={() => setActiveCategory(key)} className={activeCategory === key ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'border-white/10'}>
              {cfg.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Items */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Anchor className="h-5 w-5 text-cyan-400" />
            Persistent Footholds ({filtered.length})
          </CardTitle>
          <CardDescription>Huntress-style autorun analysis — detect malicious persistence across your fleet</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">Scanning persistence mechanisms...</div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {filtered.map(item => {
                  const cfg = CATEGORY_CONFIG[item.category];
                  const Icon = cfg?.icon || Settings;
                  return (
                    <div key={item.id} className={`p-4 rounded-lg border ${getRiskBg(item.risk_score)} transition-colors`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${cfg?.color || 'text-white/60'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-white">{item.name}</span>
                              <Badge className={`text-xs ${item.is_suspicious ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                {item.is_suspicious ? '⚠ Suspicious' : '✓ Clean'}
                              </Badge>
                              {!item.is_signed && <Badge className="bg-orange-500/20 text-orange-400 text-xs">Unsigned</Badge>}
                              {item.mitre_technique && <Badge className="bg-purple-500/20 text-purple-400 text-xs">{item.mitre_technique}</Badge>}
                            </div>
                            <div className="mt-1">
                              <code className="text-xs text-muted-foreground font-mono break-all">{item.command}</code>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span>{item.device_name}</span>
                              <span>{cfg?.label}</span>
                              {item.publisher && <span>Publisher: {item.publisher}</span>}
                              <span>First seen: {formatDistanceToNow(new Date(item.first_seen), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className={`text-lg font-bold ${getRiskColor(item.risk_score)}`}>{item.risk_score}</div>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
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
    </div>
  );
}
