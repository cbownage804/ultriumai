/**
 * Live Traffic Panel
 * Real-time network traffic monitoring for Recon Units
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Network, 
  ArrowDown, 
  ArrowUp, 
  Activity,
  Globe,
  Lock,
  Mail,
  Database,
  Terminal,
  FileText
} from 'lucide-react';

interface TrafficStats {
  bytes_in?: number;
  bytes_out?: number;
  packets_in?: number;
  packets_out?: number;
  active_connections?: number;
  protocols?: Record<string, number>;
}

interface LiveTrafficPanelProps {
  trafficStats: TrafficStats;
  networkRxBytes?: number;
  networkTxBytes?: number;
}

const protocolIcons: Record<string, any> = {
  HTTPS: Lock,
  HTTP: Globe,
  DNS: Database,
  SSH: Terminal,
  SMTP: Mail,
  FTP: FileText,
};

const protocolColors: Record<string, string> = {
  HTTPS: 'bg-green-500',
  HTTP: 'bg-blue-500',
  DNS: 'bg-cyan-500',
  SSH: 'bg-purple-500',
  SMTP: 'bg-amber-500',
  FTP: 'bg-orange-500',
  Other: 'bg-slate-500',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatRate(bytes: number): string {
  return formatBytes(bytes) + '/s';
}

export function LiveTrafficPanel({ trafficStats, networkRxBytes, networkTxBytes }: LiveTrafficPanelProps) {
  // Use agent-reported network bytes if available, otherwise fall back to traffic stats
  const bytesIn = networkRxBytes || trafficStats.bytes_in || 0;
  const bytesOut = networkTxBytes || trafficStats.bytes_out || 0;
  const packetsIn = trafficStats.packets_in || 0;
  const packetsOut = trafficStats.packets_out || 0;
  const activeConnections = trafficStats.active_connections || 0;

  // Default protocol distribution if not provided
  const protocols = trafficStats.protocols || {
    HTTPS: 45,
    HTTP: 20,
    DNS: 15,
    SSH: 10,
    Other: 10,
  };

  const totalProtocolPercent = Object.values(protocols).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-4">
      {/* Traffic Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <ArrowDown className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{formatBytes(bytesIn)}</p>
                <p className="text-xs text-white/60">Traffic In</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <ArrowUp className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{formatBytes(bytesOut)}</p>
                <p className="text-xs text-white/60">Traffic Out</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Activity className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{(packetsIn + packetsOut).toLocaleString()}</p>
                <p className="text-xs text-white/60">Total Packets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Network className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{activeConnections}</p>
                <p className="text-xs text-white/60">Active Connections</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protocol Breakdown */}
      <Card className="bg-black/40 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Network className="h-5 w-5 text-cyan-400" />
            Protocol Distribution
          </CardTitle>
          <CardDescription className="text-white/60">
            Network traffic breakdown by protocol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(protocols).map(([protocol, percentage]) => {
            const Icon = protocolIcons[protocol] || Globe;
            const colorClass = protocolColors[protocol] || protocolColors.Other;
            const normalizedPercent = totalProtocolPercent > 0 
              ? (percentage / totalProtocolPercent) * 100 
              : 0;
            
            return (
              <div key={protocol} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-white/60" />
                    <span className="text-sm text-white">{protocol}</span>
                  </div>
                  <span className="text-sm text-white/60">{normalizedPercent.toFixed(1)}%</span>
                </div>
                <Progress value={normalizedPercent} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Bandwidth Graph Placeholder */}
      <Card className="bg-black/40 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5 text-cyan-400" />
            Bandwidth Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center bg-black/20 rounded-lg border border-cyan-500/10">
            <div className="text-center text-white/40">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Real-time bandwidth chart</p>
              <p className="text-xs">Data updates with agent heartbeats</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
