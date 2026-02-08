import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  description?: string;
  updatedAt: string;
}

interface Incident {
  id: string;
  title: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  createdAt: string;
  updates: { message: string; timestamp: string }[];
}

const SERVICES: ServiceStatus[] = [
  { name: 'AI Studio', status: 'operational', updatedAt: '2 min ago' },
  { name: 'SafeSuite', status: 'operational', updatedAt: '2 min ago' },
  { name: 'Vanguard', status: 'operational', updatedAt: '2 min ago' },
  { name: 'Authentication', status: 'operational', updatedAt: '2 min ago' },
  { name: 'API Gateway', status: 'operational', updatedAt: '2 min ago' },
  { name: 'Database', status: 'operational', updatedAt: '2 min ago' },
  { name: 'Edge Functions', status: 'operational', updatedAt: '2 min ago' },
  { name: 'File Storage', status: 'operational', updatedAt: '2 min ago' },
];

const INCIDENTS: Incident[] = [
  {
    id: '1',
    title: 'Scheduled Maintenance — Database Optimization',
    severity: 'minor',
    status: 'resolved',
    createdAt: '2026-02-07T03:00:00Z',
    updates: [
      { message: 'Maintenance completed successfully. All services are operational.', timestamp: '2026-02-07T04:15:00Z' },
      { message: 'Starting scheduled database optimization. Brief latency expected.', timestamp: '2026-02-07T03:00:00Z' },
    ],
  },
];

const statusConfig = {
  operational: { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, label: 'Operational', color: 'text-emerald-500', bg: 'bg-emerald-500' },
  degraded: { icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, label: 'Degraded', color: 'text-amber-500', bg: 'bg-amber-500' },
  outage: { icon: <XCircle className="h-4 w-4 text-destructive" />, label: 'Outage', color: 'text-destructive', bg: 'bg-destructive' },
  maintenance: { icon: <Clock className="h-4 w-4 text-blue-500" />, label: 'Maintenance', color: 'text-blue-500', bg: 'bg-blue-500' },
};

export default function StatusPage() {
  const navigate = useNavigate();
  const allOperational = SERVICES.every(s => s.status === 'operational');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">System Status</h1>
            <p className="text-sm text-muted-foreground">UltriumAI platform health overview</p>
          </div>
        </div>

        {/* Overall status banner */}
        <Card className={`mb-8 ${allOperational ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
          <CardContent className="flex items-center gap-3 py-5">
            {allOperational ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <div>
                  <p className="font-semibold text-emerald-500">All Systems Operational</p>
                  <p className="text-xs text-muted-foreground">Last checked just now</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="font-semibold text-amber-500">Some Systems Experiencing Issues</p>
                  <p className="text-xs text-muted-foreground">We're investigating</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Services list */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm">Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {SERVICES.map((service, i) => {
              const config = statusConfig[service.status];
              return (
                <div key={service.name} className={`flex items-center justify-between px-6 py-3 ${i < SERVICES.length - 1 ? 'border-b border-border/50' : ''}`}>
                  <span className="text-sm font-medium">{service.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${config.color}`}>{config.label}</span>
                    {config.icon}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Uptime bar (90-day simulated) */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm">90-Day Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-px">
              {Array.from({ length: 90 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-8 rounded-sm bg-emerald-500/80 hover:bg-emerald-500 transition-colors cursor-default"
                  title={`Day ${90 - i}: 100% uptime`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>90 days ago</span>
              <span className="font-medium text-emerald-500">99.99% uptime</span>
              <span>Today</span>
            </div>
          </CardContent>
        </Card>

        {/* Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {INCIDENTS.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent incidents</p>
            ) : (
              INCIDENTS.map(incident => (
                <div key={incident.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">{incident.title}</h4>
                    <Badge variant={incident.status === 'resolved' ? 'outline' : 'destructive'} className="text-[10px]">
                      {incident.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {incident.updates.map((update, i) => (
                      <div key={i} className="flex gap-3 text-xs">
                        <span className="text-muted-foreground whitespace-nowrap min-w-[140px]">
                          {new Date(update.timestamp).toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">{update.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
