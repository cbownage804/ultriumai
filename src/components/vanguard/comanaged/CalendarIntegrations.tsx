/**
 * Calendar Integration Manager
 * Connect Outlook/Google calendars for on-call and appointment sync
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Link2,
  Unlink,
  Clock,
  Users,
  Bell
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CalendarConfig {
  id: string;
  provider: string;
  calendar_name: string;
  sync_enabled: boolean;
  sync_direction: string;
  sync_on_call: boolean;
  sync_appointments: boolean;
  sync_ticket_deadlines: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
}

export const CalendarIntegrations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [configs, setConfigs] = useState<CalendarConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, [user?.id]);

  const fetchConfigs = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('vanguard_calendar_configs')
      .select('*')
      .eq('user_id', user.id);

    if (data) setConfigs(data);
    setLoading(false);
  };

  const handleConnect = async (provider: 'outlook' | 'google') => {
    if (!user?.id) return;

    // In a real implementation, this would initiate OAuth flow
    const { error } = await supabase
      .from('vanguard_calendar_configs')
      .insert({
        user_id: user.id,
        provider,
        calendar_name: `My ${provider === 'outlook' ? 'Outlook' : 'Google'} Calendar`,
        sync_enabled: true
      });

    if (error) {
      toast({ title: "Error", description: "Failed to connect calendar.", variant: "destructive" });
    } else {
      toast({ 
        title: "Calendar Connected", 
        description: `${provider === 'outlook' ? 'Outlook' : 'Google'} calendar connected. Configure sync settings below.` 
      });
      fetchConfigs();
    }
  };

  const handleSync = async (configId: string) => {
    setSyncing(configId);
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await supabase
      .from('vanguard_calendar_configs')
      .update({ last_sync_at: new Date().toISOString(), sync_error: null })
      .eq('id', configId);

    setSyncing(null);
    toast({ title: "Sync Complete", description: "Calendar synchronized successfully." });
    fetchConfigs();
  };

  const handleDisconnect = async (configId: string) => {
    const { error } = await supabase
      .from('vanguard_calendar_configs')
      .delete()
      .eq('id', configId);

    if (error) {
      toast({ title: "Error", description: "Failed to disconnect.", variant: "destructive" });
    } else {
      toast({ title: "Disconnected", description: "Calendar disconnected." });
      fetchConfigs();
    }
  };

  const handleUpdateConfig = async (configId: string, updates: Partial<CalendarConfig>) => {
    const { error } = await supabase
      .from('vanguard_calendar_configs')
      .update(updates)
      .eq('id', configId);

    if (!error) fetchConfigs();
  };

  const hasOutlook = configs.some(c => c.provider === 'outlook');
  const hasGoogle = configs.some(c => c.provider === 'google');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Calendar Integrations</h2>
        <p className="text-white/60">Sync on-call schedules and appointments with external calendars</p>
      </div>

      {/* Connect Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`bg-white/5 border-white/10 ${hasOutlook ? 'opacity-50' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Microsoft Outlook</h3>
                <p className="text-sm text-white/60">Sync with Outlook/Office 365 calendar</p>
              </div>
              <Button
                variant="outline"
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                disabled={hasOutlook}
                onClick={() => handleConnect('outlook')}
              >
                {hasOutlook ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Connected
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-white/5 border-white/10 ${hasGoogle ? 'opacity-50' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/20">
                <Calendar className="h-6 w-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Google Calendar</h3>
                <p className="text-sm text-white/60">Sync with Google Workspace calendar</p>
              </div>
              <Button
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                disabled={hasGoogle}
                onClick={() => handleConnect('google')}
              >
                {hasGoogle ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Connected
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Calendars */}
      {configs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Connected Calendars</h3>
          {configs.map((config) => (
            <Card key={config.id} className="bg-white/5 border-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.provider === 'outlook' ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
                      <Calendar className={`h-5 w-5 ${config.provider === 'outlook' ? 'text-blue-400' : 'text-red-400'}`} />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{config.calendar_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <span className="capitalize">{config.provider}</span>
                        {config.last_sync_at && (
                          <>
                            <span>•</span>
                            <span>Last sync: {format(new Date(config.last_sync_at), 'MMM d, h:mm a')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.sync_error && (
                      <Badge className="bg-red-500/20 text-red-400">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10"
                      onClick={() => handleSync(config.id)}
                      disabled={syncing === config.id}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${syncing === config.id ? 'animate-spin' : ''}`} />
                      Sync Now
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => handleDisconnect(config.id)}
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Sync Settings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm text-white/80">On-Call</span>
                    </div>
                    <Switch
                      checked={config.sync_on_call}
                      onCheckedChange={(v) => handleUpdateConfig(config.id, { sync_on_call: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-white/80">Appointments</span>
                    </div>
                    <Switch
                      checked={config.sync_appointments}
                      onCheckedChange={(v) => handleUpdateConfig(config.id, { sync_appointments: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-orange-400" />
                      <span className="text-sm text-white/80">Deadlines</span>
                    </div>
                    <Switch
                      checked={config.sync_ticket_deadlines}
                      onCheckedChange={(v) => handleUpdateConfig(config.id, { sync_ticket_deadlines: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-white/80">Auto-Sync</span>
                    </div>
                    <Switch
                      checked={config.sync_enabled}
                      onCheckedChange={(v) => handleUpdateConfig(config.id, { sync_enabled: v })}
                    />
                  </div>
                </div>

                {/* Sync Direction */}
                <div className="flex items-center gap-4">
                  <Label className="text-white/60 text-sm">Sync Direction:</Label>
                  <Select 
                    value={config.sync_direction}
                    onValueChange={(v) => handleUpdateConfig(config.id, { sync_direction: v })}
                  >
                    <SelectTrigger className="w-48 bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bidirectional">↔ Bidirectional</SelectItem>
                      <SelectItem value="to_calendar">→ To Calendar Only</SelectItem>
                      <SelectItem value="from_calendar">← From Calendar Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && configs.length === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-white/20" />
            <h3 className="text-white font-medium mb-2">No Calendars Connected</h3>
            <p className="text-white/60 text-sm">Connect your Outlook or Google calendar to sync on-call schedules and appointments.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarIntegrations;
