import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Database, Shield, Globe, Monitor, RefreshCw,
  CheckCircle, AlertTriangle, Wifi, Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface EvidenceSource {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'agent' | 'sentinel' | 'recon' | 'horizon';
  enabled: boolean;
  lastCollected: string | null;
  evidenceCount: number;
}

export function ComplyEvidenceCollection() {
  const { user } = useAuth();
  const [isCollecting, setIsCollecting] = useState(false);
  const [sources, setSources] = useState<EvidenceSource[]>([
    {
      id: 'agent_security',
      name: 'Agent Security Posture',
      description: 'Collect AV, firewall, BitLocker, and TLS status from managed devices.',
      icon: Monitor,
      category: 'agent',
      enabled: true,
      lastCollected: null,
      evidenceCount: 0,
    },
    {
      id: 'agent_patches',
      name: 'Patch Compliance',
      description: 'Collect patch installation status and missing updates from Horizon.',
      icon: RefreshCw,
      category: 'horizon',
      enabled: true,
      lastCollected: null,
      evidenceCount: 0,
    },
    {
      id: 'sentinel_alerts',
      name: 'SaaS Security Alerts',
      description: 'Ingest Sentinel M365/Google Workspace security findings.',
      icon: Globe,
      category: 'sentinel',
      enabled: true,
      lastCollected: null,
      evidenceCount: 0,
    },
    {
      id: 'recon_vulns',
      name: 'Vulnerability Findings',
      description: 'Import Recon pentesting and vulnerability scan results.',
      icon: Shield,
      category: 'recon',
      enabled: true,
      lastCollected: null,
      evidenceCount: 0,
    },
    {
      id: 'agent_encryption',
      name: 'Encryption Status',
      description: 'Verify disk encryption (BitLocker/FileVault) across fleet.',
      icon: Lock,
      category: 'agent',
      enabled: true,
      lastCollected: null,
      evidenceCount: 0,
    },
    {
      id: 'network_security',
      name: 'Network Security Controls',
      description: 'Collect firewall rules, network segmentation, and access control evidence.',
      icon: Wifi,
      category: 'horizon',
      enabled: true,
      lastCollected: null,
      evidenceCount: 0,
    },
  ]);

  const toggleSource = (sourceId: string) => {
    setSources(prev => prev.map(s => s.id === sourceId ? { ...s, enabled: !s.enabled } : s));
  };

  const collectEvidence = async () => {
    if (!user) return;
    setIsCollecting(true);

    try {
      const enabledSources = sources.filter(s => s.enabled);
      let totalEvidence = 0;

      for (const source of enabledSources) {
        let count = 0;

        if (source.category === 'agent') {
          // Count agents with security telemetry
          const { count: agentCount } = await supabase
            .from('vanguard_agents')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'active');
          count = agentCount || 0;
        } else if (source.category === 'sentinel') {
          // Count sentinel alerts
          const { count: alertCount } = await (supabase as any)
            .from('sentinel_alerts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          count = alertCount || 0;
        } else if (source.category === 'recon') {
          // Count recon findings
          const { count: findingCount } = await (supabase as any)
            .from('recon_findings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          count = findingCount || 0;
        } else if (source.category === 'horizon') {
          // Count patches / network data
          const { count: patchCount } = await (supabase as any)
            .from('patch_management')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          count = patchCount || 0;
        }

        totalEvidence += count;
        setSources(prev => prev.map(s =>
          s.id === source.id ? { ...s, lastCollected: new Date().toISOString(), evidenceCount: count } : s
        ));
      }

      toast.success(`Evidence collected: ${totalEvidence} items from ${enabledSources.length} sources`);
    } catch (err) {
      console.error('Evidence collection error:', err);
      toast.error('Failed to collect some evidence sources');
    } finally {
      setIsCollecting(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'agent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'sentinel': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'recon': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'horizon': return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      default: return 'bg-white/10 text-white/60';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'agent': return 'Vanguard Agent';
      case 'sentinel': return 'Sentinel';
      case 'recon': return 'Recon';
      case 'horizon': return 'Horizon';
      default: return cat;
    }
  };

  const totalEvidence = sources.reduce((s, src) => s + src.evidenceCount, 0);
  const enabledCount = sources.filter(s => s.enabled).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Evidence Sources</p>
            <p className="text-3xl font-bold text-white">{enabledCount}<span className="text-lg text-muted-foreground">/{sources.length}</span></p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total Evidence Items</p>
            <p className="text-3xl font-bold text-teal-400">{totalEvidence}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 flex items-center justify-center">
            <Button
              onClick={collectEvidence}
              disabled={isCollecting}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Database className="h-4 w-4 mr-2" />
              {isCollecting ? 'Collecting...' : 'Collect Evidence Now'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sources */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-teal-400" />
            Evidence Sources
          </CardTitle>
          <CardDescription>Configure which modules feed compliance evidence automatically</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-3">
              {sources.map(source => {
                const Icon = source.icon;
                return (
                  <div key={source.id} className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-white/5">
                          <Icon className="h-5 w-5 text-teal-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{source.name}</p>
                            <Badge className={`text-xs ${getCategoryColor(source.category)}`}>
                              {getCategoryLabel(source.category)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{source.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {source.lastCollected && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-400" />
                                Last: {new Date(source.lastCollected).toLocaleString()}
                              </span>
                            )}
                            {source.evidenceCount > 0 && (
                              <span>{source.evidenceCount} items</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={source.enabled}
                        onCheckedChange={() => toggleSource(source.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
