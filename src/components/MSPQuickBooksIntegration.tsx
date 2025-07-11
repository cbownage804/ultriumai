import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react';

interface QuickBooksConfig {
  id: string;
  sync_enabled: boolean;
  last_sync_at?: string;
  sync_frequency: string;
  sync_settings: any;
}

interface SyncLog {
  id: string;
  entity_type: string;
  sync_type: string;
  sync_status: string;
  records_processed: number;
  records_succeeded: number;
  records_failed: number;
  started_at: string;
  completed_at?: string;
  error_details: any;
}

interface MSPQuickBooksIntegrationProps {
  mspId: string;
}

export const MSPQuickBooksIntegration: React.FC<MSPQuickBooksIntegrationProps> = ({ mspId }) => {
  const [config, setConfig] = useState<QuickBooksConfig | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const entityTypes = [
    { key: 'customers', label: 'Customers', icon: Users, description: 'Sync customer data' },
    { key: 'invoices', label: 'Invoices', icon: FileText, description: 'Sync invoice records' },
    { key: 'payments', label: 'Payments', icon: DollarSign, description: 'Sync payment transactions' },
    { key: 'items', label: 'Service Items', icon: BarChart3, description: 'Sync service and product items' },
  ];

  useEffect(() => {
    loadQuickBooksConfig();
    loadSyncLogs();
  }, [mspId]);

  const loadQuickBooksConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('msp_quickbooks_config')
        .select('*')
        .eq('msp_id', mspId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      setConfig(data);
      setIsConnected(!!data?.access_token_encrypted);
    } catch (error) {
      console.error('Error loading QuickBooks config:', error);
      toast({
        title: "Error",
        description: "Failed to load QuickBooks configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('msp_quickbooks_sync_log')
        .select('*')
        .eq('msp_id', mspId)
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error loading sync logs:', error);
    }
  };

  const connectQuickBooks = async () => {
    try {
      // This would typically redirect to QuickBooks OAuth flow
      // For demo, we'll simulate a successful connection
      const { data, error } = await supabase
        .from('msp_quickbooks_config')
        .upsert({
          msp_id: mspId,
          company_id: 'demo_company',
          access_token_encrypted: 'encrypted_demo_token',
          refresh_token_encrypted: 'encrypted_demo_refresh',
          token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
          sync_enabled: true,
          sync_frequency: 'daily',
          sync_settings: {
            customers: true,
            invoices: true,
            payments: true,
            items: true
          }
        })
        .select()
        .single();

      if (error) throw error;

      setConfig(data);
      setIsConnected(true);
      
      toast({
        title: "Success",
        description: "QuickBooks connected successfully!",
      });
    } catch (error) {
      console.error('Error connecting QuickBooks:', error);
      toast({
        title: "Error",
        description: "Failed to connect to QuickBooks",
        variant: "destructive",
      });
    }
  };

  const disconnectQuickBooks = async () => {
    try {
      const { error } = await supabase
        .from('msp_quickbooks_config')
        .delete()
        .eq('msp_id', mspId);

      if (error) throw error;

      setConfig(null);
      setIsConnected(false);
      
      toast({
        title: "Success",
        description: "QuickBooks disconnected successfully",
      });
    } catch (error) {
      console.error('Error disconnecting QuickBooks:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect QuickBooks",
        variant: "destructive",
      });
    }
  };

  const updateSyncSettings = async (entityType: string, enabled: boolean) => {
    if (!config) return;

    try {
      const updatedSettings = {
        ...config.sync_settings,
        [entityType]: enabled
      };

      const { error } = await supabase
        .from('msp_quickbooks_config')
        .update({ sync_settings: updatedSettings })
        .eq('msp_id', mspId);

      if (error) throw error;

      setConfig(prev => prev ? {
        ...prev,
        sync_settings: updatedSettings
      } : null);

      toast({
        title: "Success",
        description: `${entityType} sync ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating sync settings:', error);
      toast({
        title: "Error",
        description: "Failed to update sync settings",
        variant: "destructive",
      });
    }
  };

  const triggerSync = async (entityType?: string) => {
    if (!config) return;

    setSyncing(true);
    try {
      // This would call a background function to start the sync
      const syncTypes = entityType ? [entityType] : Object.keys(config.sync_settings).filter(
        key => config.sync_settings[key]
      );

      for (const type of syncTypes) {
        const { error } = await supabase
          .from('msp_quickbooks_sync_log')
          .insert({
            msp_id: mspId,
            entity_type: type,
            sync_type: 'manual',
            sync_status: 'running',
            records_processed: 0,
            records_succeeded: 0,
            records_failed: 0
          });

        if (error) throw error;
      }

      // Simulate sync completion
      setTimeout(async () => {
        await loadSyncLogs();
        setSyncing(false);
        toast({
          title: "Success",
          description: "Sync completed successfully",
        });
      }, 2000);

    } catch (error) {
      console.error('Error triggering sync:', error);
      setSyncing(false);
      toast({
        title: "Error",
        description: "Failed to start sync",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">QuickBooks Integration</h2>
          <p className="text-muted-foreground">
            Sync financial data and customer information with QuickBooks
          </p>
        </div>
        <Badge variant={isConnected ? 'default' : 'secondary'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>

      {!isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Connect to QuickBooks
            </CardTitle>
            <CardDescription>
              Connect your QuickBooks account to sync financial data automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Benefits of QuickBooks Integration:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic invoice and payment synchronization</li>
                <li>• Real-time customer data updates</li>
                <li>• Streamlined billing and financial reporting</li>
                <li>• Reduced manual data entry</li>
              </ul>
            </div>
            <Button onClick={connectQuickBooks} className="w-full">
              <DollarSign className="h-4 w-4 mr-2" />
              Connect QuickBooks
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Sync Settings
                </CardTitle>
                <CardDescription>
                  Configure what data to sync with QuickBooks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {entityTypes.map((entity) => {
                  const IconComponent = entity.icon;
                  const isEnabled = config?.sync_settings?.[entity.key] || false;
                  
                  return (
                    <div key={entity.key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <div>
                          <h4 className="font-medium">{entity.label}</h4>
                          <p className="text-sm text-muted-foreground">{entity.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => updateSyncSettings(entity.key, checked)}
                      />
                    </div>
                  );
                })}
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sync-frequency">Sync Frequency</Label>
                      <p className="text-sm text-muted-foreground">How often to sync data</p>
                    </div>
                    <select
                      id="sync-frequency"
                      value={config?.sync_frequency || 'daily'}
                      className="px-3 py-2 border rounded-md bg-background text-sm"
                    >
                      <option value="hourly">Every Hour</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Sync Status
                </CardTitle>
                <CardDescription>
                  Current synchronization status and controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Sync</span>
                    <span className="text-sm text-muted-foreground">
                      {config?.last_sync_at 
                        ? new Date(config.last_sync_at).toLocaleString()
                        : 'Never'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={syncing ? 'secondary' : 'default'}>
                      {syncing ? 'Syncing...' : 'Ready'}
                    </Badge>
                  </div>
                </div>

                {syncing && (
                  <div className="space-y-2">
                    <Progress value={65} className="w-full" />
                    <p className="text-sm text-muted-foreground">Syncing customer data...</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Button 
                    onClick={() => triggerSync()} 
                    disabled={syncing}
                    className="w-full"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  
                  <Button 
                    onClick={disconnectQuickBooks} 
                    variant="outline" 
                    className="w-full"
                  >
                    Disconnect QuickBooks
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {syncLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Sync History
                </CardTitle>
                <CardDescription>
                  Recent synchronization activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          log.sync_status === 'completed' ? 'bg-green-500/20' :
                          log.sync_status === 'failed' ? 'bg-destructive/20' :
                          'bg-yellow-500/20'
                        }`}>
                          {log.sync_status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : log.sync_status === 'failed' ? (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium capitalize">
                            {log.entity_type} Sync ({log.sync_type})
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {log.records_processed} records processed, {log.records_succeeded} successful
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.started_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          log.sync_status === 'completed' ? 'default' :
                          log.sync_status === 'failed' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {log.sync_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};