import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Link2, Plus, RefreshCw, CheckCircle, XCircle, Clock,
  ArrowRightLeft, Settings, Ticket, Server, Users, FileText, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHorizonStats } from '@/hooks/useHorizonStats';
import { useMSPDashboard } from '@/hooks/useMSPDashboard';

export function PSASyncIntegration() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { stats } = useHorizonStats();
  const { clients } = useMSPDashboard();

  // In a real PSA integration, these would come from integration configs
  // For now we show a summary of what data is available for sync
  const syncSummary = {
    devices: stats.totalDevices,
    tickets: stats.openTickets,
    clients: clients.length,
    alerts: stats.activeAlerts,
  };

  const handleSync = () => {
    toast({ title: 'Sync Started', description: 'Syncing data with integrated platforms...' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6" />
            PSA Sync Integration
          </h2>
          <p className="text-muted-foreground">Sync data between Vanguard and external PSA platforms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Manual Sync
          </Button>
        </div>
      </div>

      {/* Sync Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Server className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{syncSummary.devices}</p>
              <p className="text-xs text-muted-foreground">Devices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Ticket className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{syncSummary.tickets}</p>
              <p className="text-xs text-muted-foreground">Open Tickets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{syncSummary.clients}</p>
              <p className="text-xs text-muted-foreground">Clients</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{syncSummary.alerts}</p>
              <p className="text-xs text-muted-foreground">Active Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Vanguard Response (Built-in)</p>
                  <p className="text-sm text-muted-foreground">Native helpdesk integration — always synced</p>
                </div>
              </div>
              <Badge className="bg-green-500/10 text-green-400">Connected</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg border-dashed">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">ConnectWise / Autotask / Halo</p>
                  <p className="text-sm text-muted-foreground">Configure external PSA connections in Settings</p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
