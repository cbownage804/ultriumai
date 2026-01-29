import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  Calendar, 
  Clock, 
  Server, 
  AlertTriangle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Patch {
  id: string;
  name: string;
  severity: string;
  devices_affected?: number;
}

interface Device {
  id: string;
  name: string;
  status: string;
}

interface PatchDeploymentDialogProps {
  patch?: Patch;
  devices: Device[];
  onDeploy?: () => void;
  children?: React.ReactNode;
}

export function PatchDeploymentDialog({ patch, devices, onDeploy, children }: PatchDeploymentDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [deploymentWindow, setDeploymentWindow] = useState('immediate');
  const [rebootBehavior, setRebootBehavior] = useState('if_required');

  const onlineDevices = devices.filter(d => d.status === 'online');

  const handleSelectAll = () => {
    if (selectedDevices.length === onlineDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(onlineDevices.map(d => d.id));
    }
  };

  const toggleDevice = (deviceId: string) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleDeploy = async () => {
    if (!user || selectedDevices.length === 0) return;

    try {
      setIsDeploying(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Update patch status
      if (patch) {
        await supabase
          .from('patch_management')
          .update({ status: 'in_progress' })
          .eq('id', patch.id);
      }

      // Queue deployment commands for each device
      for (const deviceId of selectedDevices) {
        await supabase.functions.invoke('vanguard-agent-api?action=send_command', {
          body: {
            agent_id: deviceId,
            command_type: 'install_patch',
            payload: {
              patch_id: patch?.id,
              patch_name: patch?.name,
              deployment_window: deploymentWindow,
              reboot_behavior: rebootBehavior,
            }
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
      }

      toast.success('Patch deployment initiated', {
        description: `Deploying to ${selectedDevices.length} device(s)`,
      });

      setOpen(false);
      onDeploy?.();
    } catch (err: any) {
      toast.error('Deployment failed', { description: err.message });
    } finally {
      setIsDeploying(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500',
    };
    return colors[severity] || 'bg-muted';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button size="sm">Deploy</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-cyan-500" />
            Deploy Patch
          </DialogTitle>
          <DialogDescription>
            Configure deployment settings and select target devices
          </DialogDescription>
        </DialogHeader>

        {patch && (
          <div className="p-4 rounded-lg bg-muted/30 border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{patch.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Affects {patch.devices_affected || 0} device(s)
                </p>
              </div>
              <Badge className={getSeverityColor(patch.severity)}>
                {patch.severity}
              </Badge>
            </div>
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Deployment Window</Label>
              <Select value={deploymentWindow} onValueChange={setDeploymentWindow}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Immediate
                    </div>
                  </SelectItem>
                  <SelectItem value="maintenance">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Next Maintenance Window
                    </div>
                  </SelectItem>
                  <SelectItem value="off_hours">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Off-Hours (After 6 PM)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reboot Behavior</Label>
              <Select value={rebootBehavior} onValueChange={setRebootBehavior}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="if_required">Reboot if required</SelectItem>
                  <SelectItem value="always">Always reboot</SelectItem>
                  <SelectItem value="never">Never reboot</SelectItem>
                  <SelectItem value="schedule">Schedule reboot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Target Devices ({selectedDevices.length} selected)</Label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedDevices.length === onlineDevices.length ? 'Deselect All' : 'Select All Online'}
              </Button>
            </div>
            <ScrollArea className="h-[200px] border rounded-lg p-2">
              <div className="space-y-2">
                {devices.map(device => (
                  <div 
                    key={device.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedDevices.includes(device.id)}
                      onCheckedChange={() => toggleDevice(device.id)}
                      disabled={device.status !== 'online'}
                    />
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className={device.status !== 'online' ? 'text-muted-foreground' : ''}>
                      {device.name}
                    </span>
                    <Badge 
                      variant={device.status === 'online' ? 'default' : 'secondary'}
                      className="ml-auto text-xs"
                    >
                      {device.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {patch?.severity === 'critical' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm">
                This is a critical security patch. Immediate deployment is recommended.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeploying}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeploy}
            disabled={isDeploying || selectedDevices.length === 0}
          >
            {isDeploying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Deploy to {selectedDevices.length} Device(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
