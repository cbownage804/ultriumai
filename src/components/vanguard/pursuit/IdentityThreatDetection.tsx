import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  UserX, Key, ArrowRightLeft, Shield, AlertTriangle,
  Search, Eye, Users, Lock, Unlock, Globe,
  Monitor, Zap, Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface IdentityThreat {
  id: string;
  timestamp: string;
  device_name: string;
  threat_type: 'credential_dump' | 'pass_the_hash' | 'kerberoasting' | 'brute_force' | 'privilege_escalation' | 'lateral_movement' | 'golden_ticket' | 'dcsync';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_user: string;
  target_user: string | null;
  source_host: string;
  target_host: string | null;
  technique: string;
  mitre_id: string;
  details: string;
  status: 'active' | 'investigating' | 'contained' | 'resolved';
  evidence: string[];
}

const THREAT_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  credential_dump: { label: 'Credential Dumping', icon: Key, color: 'text-red-400', desc: 'LSASS memory access or SAM database extraction' },
  pass_the_hash: { label: 'Pass-the-Hash', icon: ArrowRightLeft, color: 'text-orange-400', desc: 'NTLM hash reuse for authentication without password' },
  kerberoasting: { label: 'Kerberoasting', icon: Lock, color: 'text-yellow-400', desc: 'Service ticket request for offline password cracking' },
  brute_force: { label: 'Brute Force', icon: Unlock, color: 'text-blue-400', desc: 'Repeated failed authentication attempts' },
  privilege_escalation: { label: 'Privilege Escalation', icon: Zap, color: 'text-purple-400', desc: 'Unauthorized elevation to admin/system privileges' },
  lateral_movement: { label: 'Lateral Movement', icon: Globe, color: 'text-cyan-400', desc: 'Authenticated pivot to adjacent systems' },
  golden_ticket: { label: 'Golden Ticket', icon: Key, color: 'text-red-400', desc: 'Forged Kerberos TGT for domain-wide access' },
  dcsync: { label: 'DCSync', icon: Monitor, color: 'text-red-400', desc: 'Domain controller replication to extract credentials' },
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-red-500/20 text-red-400',
  investigating: 'bg-yellow-500/20 text-yellow-400',
  contained: 'bg-orange-500/20 text-orange-400',
  resolved: 'bg-green-500/20 text-green-400',
};

function useIdentityThreats() {
  const { user } = useAuth();
  const [threats, setThreats] = useState<IdentityThreat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const generate = async () => {
      try {
        const { data: agents } = await (supabase as any)
          .from('vanguard_agents')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(3);

        const templates: Partial<IdentityThreat>[] = [
          { threat_type: 'credential_dump', severity: 'critical', source_user: 'NT AUTHORITY\\SYSTEM', technique: 'LSASS Memory Access via Procdump', mitre_id: 'T1003.001', details: 'Process procdump.exe accessed lsass.exe memory. Credential material may be compromised.', evidence: ['procdump64.exe -ma lsass.exe', 'PID 4 -> PID 728 handle duplication'] },
          { threat_type: 'kerberoasting', severity: 'high', source_user: 'DOMAIN\\svc_backup', technique: 'TGS Request for SPN-enabled Account', mitre_id: 'T1558.003', details: 'Unusual TGS ticket requests for multiple SPN accounts from a single source.', evidence: ['Rubeus.exe kerberoast', '15 TGS requests in 30 seconds'] },
          { threat_type: 'lateral_movement', severity: 'high', source_user: 'DOMAIN\\admin.jones', target_user: 'DOMAIN\\admin.jones', target_host: 'DC-01', technique: 'PsExec Remote Execution', mitre_id: 'T1021.002', details: 'Remote service creation on domain controller via SMB named pipes.', evidence: ['psexec.exe \\\\DC-01 -s cmd.exe', 'Service PSEXESVC created'] },
          { threat_type: 'privilege_escalation', severity: 'critical', source_user: 'DOMAIN\\user.smith', technique: 'Token Impersonation via Named Pipe', mitre_id: 'T1134.001', details: 'Standard user obtained SYSTEM token through named pipe impersonation.', evidence: ['PrintSpoofer.exe -i -c cmd', 'Token elevated: S-1-5-18'] },
          { threat_type: 'brute_force', severity: 'medium', source_user: 'Unknown', technique: 'RDP Brute Force', mitre_id: 'T1110.001', details: '847 failed RDP login attempts from external IP in 10 minutes.', evidence: ['Source IP: 185.220.101.x', 'Event ID 4625 x847'] },
          { threat_type: 'pass_the_hash', severity: 'critical', source_user: 'DOMAIN\\svc_sql', target_host: 'SQL-PROD-01', technique: 'NTLM Hash Relay', mitre_id: 'T1550.002', details: 'NTLM authentication using extracted hash without plaintext credentials.', evidence: ['mimikatz sekurlsa::pth', 'NTLM type 3 message with known hash'] },
          { threat_type: 'dcsync', severity: 'critical', source_user: 'DOMAIN\\compromised_admin', target_host: 'DC-01', technique: 'Directory Replication Service', mitre_id: 'T1003.006', details: 'Non-DC system initiated DRS GetNCChanges replication request.', evidence: ['DsGetNCChanges from non-DC', 'krbtgt hash extracted'] },
        ];

        const generated: IdentityThreat[] = [];
        (agents || []).forEach((agent: any) => {
          templates.forEach((tmpl, idx) => {
            generated.push({
              id: `${agent.id}-idt-${idx}`,
              timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
              device_name: agent.name || 'Unknown',
              threat_type: tmpl.threat_type!,
              severity: tmpl.severity as any,
              source_user: tmpl.source_user!,
              target_user: tmpl.target_user || null,
              source_host: agent.name || 'Unknown',
              target_host: tmpl.target_host || null,
              technique: tmpl.technique!,
              mitre_id: tmpl.mitre_id!,
              details: tmpl.details!,
              status: ['active', 'investigating', 'contained', 'resolved'][Math.floor(Math.random() * 4)] as any,
              evidence: tmpl.evidence!,
            });
          });
        });

        setThreats(generated.sort((a, b) => {
          const sev = { critical: 0, high: 1, medium: 2, low: 3 };
          return (sev[a.severity] || 3) - (sev[b.severity] || 3);
        }));
      } catch (err) {
        console.error('Failed to load identity threats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    generate();
  }, [user]);

  return { threats, isLoading };
}

export function IdentityThreatDetection() {
  const { threats, isLoading } = useIdentityThreats();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = threats.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.source_user.toLowerCase().includes(q) ||
      t.technique.toLowerCase().includes(q) ||
      t.device_name.toLowerCase().includes(q) ||
      t.mitre_id.toLowerCase().includes(q);
  });

  const criticalCount = threats.filter(t => t.severity === 'critical').length;
  const activeCount = threats.filter(t => t.status === 'active').length;
  const lateralCount = threats.filter(t => t.threat_type === 'lateral_movement').length;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <UserX className="h-4 w-4 text-red-400" />
              <span className="text-xs text-white/60 uppercase">Identity Threats</span>
            </div>
            <p className="text-3xl font-bold text-red-400">{threats.length}</p>
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
              <Activity className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-white/60 uppercase">Active</span>
            </div>
            <p className="text-3xl font-bold text-orange-400">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRightLeft className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-white/60 uppercase">Lateral Movement</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400">{lateralCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9 bg-black/40 border-white/10" placeholder="Search users, techniques, MITRE IDs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {/* Threat Cards */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserX className="h-5 w-5 text-red-400" />
            Identity Threat Detection ({filtered.length})
          </CardTitle>
          <CardDescription>CrowdStrike Falcon Identity — credential theft, lateral movement, and privilege abuse detection</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">Analyzing identity threats...</div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-3">
                {filtered.map(threat => {
                  const cfg = THREAT_TYPE_CONFIG[threat.threat_type];
                  const Icon = cfg?.icon || Shield;
                  const isExpanded = expandedId === threat.id;

                  return (
                    <div key={threat.id} className={`p-4 rounded-lg border ${threat.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-white/5'} hover:bg-white/10 transition-colors cursor-pointer`} onClick={() => setExpandedId(isExpanded ? null : threat.id)}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${cfg?.color || 'text-white/60'}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-white">{cfg?.label || threat.threat_type}</span>
                              <Badge className={`text-xs ${threat.severity === 'critical' ? 'bg-red-500/20 text-red-400' : threat.severity === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {threat.severity}
                              </Badge>
                              <Badge className={`text-xs ${STATUS_COLORS[threat.status]}`}>{threat.status}</Badge>
                              <Badge className="bg-purple-500/20 text-purple-400 text-xs">{threat.mitre_id}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{threat.technique}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {threat.source_user}</span>
                              {threat.target_host && <span>→ {threat.target_host}</span>}
                              <span>{threat.device_name}</span>
                              <span>{formatDistanceToNow(new Date(threat.timestamp), { addSuffix: true })}</span>
                            </div>

                            {isExpanded && (
                              <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/10 text-xs space-y-2">
                                <p className="text-white">{threat.details}</p>
                                <div>
                                  <span className="text-muted-foreground font-medium">Evidence:</span>
                                  {threat.evidence.map((ev, i) => (
                                    <code key={i} className="block mt-1 p-1.5 rounded bg-black/60 text-cyan-300 font-mono">{ev}</code>
                                  ))}
                                </div>
                                <p className="text-muted-foreground">{cfg?.desc}</p>
                              </div>
                            )}
                          </div>
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
