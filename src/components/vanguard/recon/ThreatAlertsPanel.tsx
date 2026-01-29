/**
 * Threat Alerts Panel
 * Real-time threat detection alerts from Recon Units
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Clock,
  MapPin,
  ExternalLink,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ThreatDetection {
  id?: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description?: string;
  source_ip?: string;
  destination_ip?: string;
  port?: number;
  protocol?: string;
  mitre_tactic?: string;
  mitre_technique?: string;
  detected_at: string;
  status?: 'active' | 'resolved' | 'investigating';
  confidence?: number;
}

interface ThreatAlertsPanelProps {
  threats: ThreatDetection[];
  onResolve?: (threatId: string) => void;
  onInvestigate?: (threatId: string) => void;
}

const severityConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  critical: { icon: AlertOctagon, color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30' },
  high: { icon: AlertTriangle, color: 'text-orange-400', bgColor: 'bg-orange-500/20 border-orange-500/30' },
  medium: { icon: ShieldAlert, color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/30' },
  low: { icon: Shield, color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' },
  info: { icon: ShieldCheck, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20 border-cyan-500/30' },
};

export function ThreatAlertsPanel({ threats, onResolve, onInvestigate }: ThreatAlertsPanelProps) {
  const activeThreatsCritical = threats.filter(t => t.severity === 'critical' && t.status !== 'resolved').length;
  const activeThreatsHigh = threats.filter(t => t.severity === 'high' && t.status !== 'resolved').length;
  const activeThreats = threats.filter(t => t.status !== 'resolved').length;

  return (
    <Card className="bg-black/40 border-red-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-red-400" />
              Threat Detections
            </CardTitle>
            <CardDescription className="text-white/60">
              Real-time security threat monitoring
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {activeThreatsCritical > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                {activeThreatsCritical} Critical
              </Badge>
            )}
            {activeThreatsHigh > 0 && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                {activeThreatsHigh} High
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {threats.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="h-16 w-16 mx-auto mb-4 text-green-400 opacity-50" />
            <p className="text-white font-medium">Network Secure</p>
            <p className="text-white/40 text-sm">No active threats detected</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {threats.map((threat, index) => {
                const config = severityConfig[threat.severity] || severityConfig.info;
                const Icon = config.icon;
                
                return (
                  <div
                    key={threat.id || index}
                    className={`p-4 rounded-lg border ${config.bgColor} transition-all hover:border-opacity-50`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-white">{threat.title}</span>
                          <Badge className={config.bgColor}>
                            {threat.severity.toUpperCase()}
                          </Badge>
                          {threat.status === 'resolved' && (
                            <Badge className="bg-green-500/20 text-green-400">Resolved</Badge>
                          )}
                          {threat.status === 'investigating' && (
                            <Badge className="bg-purple-500/20 text-purple-400">Investigating</Badge>
                          )}
                          {threat.confidence && (
                            <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                              {threat.confidence}% confidence
                            </Badge>
                          )}
                        </div>
                        
                        {threat.description && (
                          <p className="text-sm text-white/60 mb-2">{threat.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-3 text-xs text-white/40">
                          {threat.source_ip && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Source: {threat.source_ip}
                            </span>
                          )}
                          {threat.destination_ip && (
                            <span>→ {threat.destination_ip}</span>
                          )}
                          {threat.port && (
                            <span>Port: {threat.port}</span>
                          )}
                          {threat.protocol && (
                            <Badge variant="outline" className="text-xs">{threat.protocol}</Badge>
                          )}
                        </div>
                        
                        {(threat.mitre_tactic || threat.mitre_technique) && (
                          <div className="flex gap-2 mt-2">
                            {threat.mitre_tactic && (
                              <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                                {threat.mitre_tactic}
                              </Badge>
                            )}
                            {threat.mitre_technique && (
                              <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                                {threat.mitre_technique}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="flex items-center gap-1 text-xs text-white/30">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(threat.detected_at), { addSuffix: true })}
                          </span>
                          
                          {threat.status !== 'resolved' && (
                            <div className="flex gap-2">
                              {onInvestigate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onInvestigate(threat.id || '')}
                                  className="text-purple-400 hover:bg-purple-500/10"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Investigate
                                </Button>
                              )}
                              {onResolve && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onResolve(threat.id || '')}
                                  className="text-green-400 hover:bg-green-500/10"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Resolve
                                </Button>
                              )}
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
  );
}
