import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Power, Wifi, Clock, CheckCircle2, XCircle, Search,
  Plus, Trash2, Send, History, Settings, Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WoLDevice {
  id: string;
  hostname: string;
  macAddress: string;
  ipAddress: string;
  lastOnline: string;
  status: 'online' | 'offline' | 'waking';
  broadcastAddress?: string;
  port?: number;
}

interface WoLHistory {
  id: string;
  deviceId: string;
  hostname: string;
  macAddress: string;
  sentAt: string;
  success: boolean;
  responseTime?: number;
}

export const WakeOnLanManager: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDevice, setNewDevice] = useState({
    hostname: '',
    macAddress: '',
    ipAddress: '',
    broadcastAddress: '255.255.255.255',
    port: 9
  });

  const [devices, setDevices] = useState<WoLDevice[]>([
    {
      id: '1',
      hostname: 'WORKSTATION-01',
      macAddress: 'AA:BB:CC:DD:EE:01',
      ipAddress: '192.168.1.101',
      lastOnline: new Date(Date.now() - 3600000).toISOString(),
      status: 'offline'
    },
    {
      id: '2',
      hostname: 'SERVER-PROD-01',
      macAddress: 'AA:BB:CC:DD:EE:02',
      ipAddress: '192.168.1.10',
      lastOnline: new Date().toISOString(),
      status: 'online'
    },
    {
      id: '3',
      hostname: 'DEV-MACHINE-03',
      macAddress: 'AA:BB:CC:DD:EE:03',
      ipAddress: '192.168.1.150',
      lastOnline: new Date(Date.now() - 7200000).toISOString(),
      status: 'offline'
    },
    {
      id: '4',
      hostname: 'BACKUP-SERVER',
      macAddress: 'AA:BB:CC:DD:EE:04',
      ipAddress: '192.168.1.20',
      lastOnline: new Date(Date.now() - 120000).toISOString(),
      status: 'waking'
    }
  ]);

  const [history] = useState<WoLHistory[]>([
    {
      id: '1',
      deviceId: '1',
      hostname: 'WORKSTATION-01',
      macAddress: 'AA:BB:CC:DD:EE:01',
      sentAt: new Date(Date.now() - 300000).toISOString(),
      success: true,
      responseTime: 45
    },
    {
      id: '2',
      deviceId: '3',
      hostname: 'DEV-MACHINE-03',
      macAddress: 'AA:BB:CC:DD:EE:03',
      sentAt: new Date(Date.now() - 600000).toISOString(),
      success: false
    },
    {
      id: '3',
      deviceId: '4',
      hostname: 'BACKUP-SERVER',
      macAddress: 'AA:BB:CC:DD:EE:04',
      sentAt: new Date(Date.now() - 120000).toISOString(),
      success: true,
      responseTime: 32
    }
  ]);

  const [schedules] = useState([
    { id: '1', deviceId: '2', hostname: 'SERVER-PROD-01', time: '06:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], enabled: true },
    { id: '2', deviceId: '4', hostname: 'BACKUP-SERVER', time: '02:00', days: ['Sun'], enabled: true }
  ]);

  const handleWake = (device: WoLDevice) => {
    setDevices(prev => prev.map(d => 
      d.id === device.id ? { ...d, status: 'waking' as const } : d
    ));
    
    toast({
      title: "Wake-on-LAN Packet Sent",
      description: `Magic packet sent to ${device.hostname} (${device.macAddress})`
    });

    // Simulate wake response
    setTimeout(() => {
      setDevices(prev => prev.map(d => 
        d.id === device.id ? { ...d, status: 'online' as const, lastOnline: new Date().toISOString() } : d
      ));
      toast({
        title: "Device Online",
        description: `${device.hostname} is now online.`
      });
    }, 5000);
  };

  const handleWakeAll = () => {
    const offlineDevices = devices.filter(d => d.status === 'offline');
    offlineDevices.forEach(device => handleWake(device));
  };

  const handleAddDevice = () => {
    const device: WoLDevice = {
      id: Date.now().toString(),
      ...newDevice,
      lastOnline: new Date().toISOString(),
      status: 'offline'
    };
    setDevices(prev => [...prev, device]);
    setShowAddDialog(false);
    setNewDevice({ hostname: '', macAddress: '', ipAddress: '', broadcastAddress: '255.255.255.255', port: 9 });
    toast({
      title: "Device Added",
      description: `${device.hostname} has been added to Wake-on-LAN.`
    });
  };

  const handleDeleteDevice = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
    toast({
      title: "Device Removed",
      description: "Device has been removed from Wake-on-LAN."
    });
  };

  const filteredDevices = devices.filter(device => 
    device.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.macAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: WoLDevice['status']) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Online</Badge>;
      case 'waking':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Waking...</Badge>;
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Wake-on-LAN</h2>
          <p className="text-muted-foreground">Remotely power on devices across your network</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleWakeAll}>
            <Zap className="h-4 w-4 mr-2" />
            Wake All Offline
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Wake-on-LAN Device</DialogTitle>
                <DialogDescription>Enter the device details for remote wake capabilities.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Hostname</Label>
                  <Input 
                    placeholder="WORKSTATION-01"
                    value={newDevice.hostname}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, hostname: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>MAC Address</Label>
                  <Input 
                    placeholder="AA:BB:CC:DD:EE:FF"
                    value={newDevice.macAddress}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, macAddress: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IP Address</Label>
                  <Input 
                    placeholder="192.168.1.100"
                    value={newDevice.ipAddress}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, ipAddress: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Broadcast Address</Label>
                    <Input 
                      placeholder="255.255.255.255"
                      value={newDevice.broadcastAddress}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, broadcastAddress: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Select 
                      value={newDevice.port.toString()} 
                      onValueChange={(v) => setNewDevice(prev => ({ ...prev, port: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7</SelectItem>
                        <SelectItem value="9">9 (Default)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddDevice} className="w-full">Add Device</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Power className="h-5 w-5" />
                WoL Devices
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search devices..." 
                  className="pl-8 w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredDevices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        device.status === 'online' ? 'bg-green-500/10' : 
                        device.status === 'waking' ? 'bg-yellow-500/10' : 'bg-muted'
                      }`}>
                        <Power className={`h-5 w-5 ${
                          device.status === 'online' ? 'text-green-500' :
                          device.status === 'waking' ? 'text-yellow-500 animate-pulse' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{device.hostname}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{device.macAddress}</span>
                          <span>•</span>
                          <span>{device.ipAddress}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last online: {new Date(device.lastOnline).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(device.status)}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleWake(device)}
                        disabled={device.status !== 'offline'}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Wake
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDevice(device.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Scheduled Wakes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Scheduled Wakes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="text-sm font-medium">{schedule.hostname}</p>
                      <p className="text-xs text-muted-foreground">
                        {schedule.time} • {schedule.days.join(', ')}
                      </p>
                    </div>
                    <Switch checked={schedule.enabled} />
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Schedule
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-2 text-sm">
                    <div className="flex items-center gap-2">
                      {entry.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>{entry.hostname}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {entry.responseTime ? `${entry.responseTime}s` : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wifi className="h-4 w-4" />
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    {devices.filter(d => d.status === 'online').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {devices.filter(d => d.status === 'offline').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Offline</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
