import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Activity, Wifi, Server, Shield, Mail } from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  icon: React.ElementType;
  latency?: number;
  uptime: number;
  lastIncident?: string;
}

interface IncidentEntry {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  createdAt: string;
  updatedAt: string;
  updates: { time: string; message: string }[];
}

export function ServiceStatusPage() {
  const [services] = useState<ServiceStatus[]>([
    { name: 'Remote Monitoring', status: 'operational', icon: Activity, latency: 42, uptime: 99.98 },
    { name: 'Helpdesk & Ticketing', status: 'operational', icon: Mail, latency: 85, uptime: 99.95 },
    { name: 'Network Security', status: 'operational', icon: Shield, latency: 38, uptime: 99.99 },
    { name: 'Patch Management', status: 'operational', icon: Server, latency: 120, uptime: 99.90 },
    { name: 'VPN & Remote Access', status: 'operational', icon: Wifi, latency: 55, uptime: 99.92 },
    { name: 'Backup Services', status: 'operational', icon: Server, latency: 200, uptime: 99.85 },
  ]);

  const [incidents] = useState<IncidentEntry[]>([
    {
      id: '1',
      title: 'Scheduled maintenance window',
      status: 'resolved',
      severity: 'minor',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
      updates: [
        { time: new Date(Date.now() - 86400000 * 2).toISOString(), message: 'Maintenance window started for patch deployment.' },
        { time: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(), message: 'Maintenance completed successfully. All systems operational.' },
      ],
    },
  ]);

  const allOperational = services.every(s => s.status === 'operational');

  const statusConfig = {
    operational: { label: 'Operational', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    degraded: { label: 'Degraded', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    outage: { label: 'Outage', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    maintenance: { label: 'Maintenance', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  };

  const incidentStatusConfig = {
    investigating: { label: 'Investigating', color: 'bg-red-500/20 text-red-400' },
    identified: { label: 'Identified', color: 'bg-amber-500/20 text-amber-400' },
    monitoring: { label: 'Monitoring', color: 'bg-blue-500/20 text-blue-400' },
    resolved: { label: 'Resolved', color: 'bg-green-500/20 text-green-400' },
  };

  return (
    <div className="space-y-6">
      {/* Overall Status Banner */}
      <Card className={allOperational ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}>
        <CardContent className="py-6 flex items-center gap-4">
          {allOperational ? (
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          ) : (
            <AlertTriangle className="h-10 w-10 text-amber-500" />
          )}
          <div>
            <h2 className="text-xl font-bold">
              {allOperational ? 'All Systems Operational' : 'Some Systems Affected'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Last checked: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="space-y-2">
        {services.map((service) => {
          const cfg = statusConfig[service.status];
          const StatusIcon = cfg.icon;
          return (
            <Card key={service.name}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <service.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">{service.uptime}% uptime</span>
                  {service.latency && (
                    <span className="text-xs text-muted-foreground">{service.latency}ms</span>
                  )}
                  <Badge className={`${cfg.bg} ${cfg.color} border-0`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {cfg.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 90-Day Uptime Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">90-Day Uptime History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-0.5">
            {Array.from({ length: 90 }, (_, i) => {
              const isDown = i === 47; // simulate one incident
              return (
                <div
                  key={i}
                  className={`flex-1 h-8 rounded-sm ${isDown ? 'bg-amber-500' : 'bg-green-500'}`}
                  title={`Day ${90 - i}: ${isDown ? 'Degraded' : 'Operational'}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>90 days ago</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Past Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent incidents.</p>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => {
                const icfg = incidentStatusConfig[incident.status];
                return (
                  <div key={incident.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{incident.title}</h4>
                      <Badge className={icfg.color}>{icfg.label}</Badge>
                    </div>
                    <div className="space-y-2">
                      {incident.updates.map((update, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(update.time).toLocaleString()}
                          </span>
                          <span>{update.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
