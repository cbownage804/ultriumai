/**
 * Device Status Component
 * Show agent-monitored device health and status in the portal
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, HardDrive, Cpu, Wifi, 
  Shield, CheckCircle, Clock,
  Loader2, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { usePortalSession } from '@/hooks/usePortalSession';
import { Progress } from '@/components/ui/progress';

interface DeviceInfo {
  id: string;
  name: string;
  location: string | null;
  ip_address: string | null;
  last_seen: string;
  status: string;
  agent_version: string | null;
  is_online: boolean;
}

export function DeviceStatus() {
  const { session } = usePortalSession();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (session) {
      fetchDevices();
    }
  }, [session]);

  const fetchDevices = async () => {
    if (!session) return;
    
    try {
      // Fetch devices associated with the portal user's client
      const { data, error } = await supabase
        .from('vanguard_agents')
        .select('id, name, location, ip_address, last_heartbeat, status, agent_version')
        .eq('client_id', session.user.clientId)
        .order('name');

      if (error) throw error;

      const formattedDevices: DeviceInfo[] = (data || []).map((d: any) => {
        const lastSeen = new Date(d.last_heartbeat);
        const isOnline = (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000; // 5 min threshold
        
        return {
          id: d.id,
          name: d.name || 'Unknown Device',
          location: d.location,
          ip_address: d.ip_address,
          last_seen: d.last_heartbeat,
          status: d.status,
          agent_version: d.agent_version,
          is_online: isOnline
        };
      });

      setDevices(formattedDevices);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDevices();
    setIsRefreshing(false);
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline 
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const formatLastSeen = (date: string) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Monitor className="h-6 w-6 text-cyan-400" />
            Your Devices
          </h2>
          <p className="text-white/60">Monitor the health of your managed devices</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="border-white/20 text-white/60 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {devices.length === 0 ? (
        <Card className="bg-black/40 border-white/10">
          <CardContent className="py-12 text-center">
            <Monitor className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No monitored devices found</p>
            <p className="text-white/40 text-sm mt-1">
              Contact your IT provider to set up device monitoring
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {devices.map((device, index) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-black/40 border-white/10 hover:border-white/20 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        device.is_online ? 'bg-green-500/10' : 'bg-slate-500/10'
                      }`}>
                        <Monitor className={`h-5 w-5 ${
                          device.is_online ? 'text-green-400' : 'text-slate-400'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base text-white">
                          {device.name}
                        </CardTitle>
                        {device.location && (
                          <p className="text-xs text-white/40">{device.location}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(device.is_online)}>
                      {device.is_online ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Online
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Offline
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {/* Device Info */}
                  <div className="text-xs text-white/50 space-y-1">
                    {device.ip_address && (
                      <div className="flex items-center gap-2">
                        <Wifi className="h-3 w-3" />
                        {device.ip_address}
                      </div>
                    )}
                    {device.agent_version && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        Agent v{device.agent_version}
                      </div>
                    )}
                  </div>

                  {/* Last Seen */}
                  <div className="text-xs text-white/30 flex items-center gap-1 pt-1 border-t border-white/5">
                    <Clock className="h-3 w-3" />
                    Last seen: {formatLastSeen(device.last_seen)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
