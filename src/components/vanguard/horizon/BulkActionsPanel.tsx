import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Play,
  Square,
  RefreshCw,
  Package,
  Shield,
  Terminal,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Server,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionsPanelProps {
  devices: Array<{
    id: string;
    name: string;
    status: string;
    client_id: string | null;
  }>;
  onActionComplete?: () => void;
}

type ActionType = 'restart' | 'patch' | 'scan' | 'script' | 'maintenance';

export function BulkActionsPanel({ devices, onActionComplete }: BulkActionsPanelProps) {
  const { user } = useAuth();
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionType | null>(null);
  const [scriptContent, setScriptContent] = useState('');
  const [maintenanceHours, setMaintenanceHours] = useState('2');

  const onlineDevices = devices.filter(d => d.status === 'online');
  const allSelected = selectedDevices.size === onlineDevices.length && onlineDevices.length > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(onlineDevices.map(d => d.id)));
    }
  };

  const toggleDevice = (deviceId: string) => {
    const newSet = new Set(selectedDevices);
    if (newSet.has(deviceId)) {
      newSet.delete(deviceId);
    } else {
      newSet.add(deviceId);
    }
    setSelectedDevices(newSet);
  };

  const executeAction = async (action: ActionType) => {
    if (selectedDevices.size === 0) {
      toast.error('No devices selected');
      return;
    }

    setIsExecuting(true);

    try {
      const deviceIds = Array.from(selectedDevices);
      
      // Build command payload based on action type
      let commandType: string;
      let payload: Record<string, unknown> = {};

      switch (action) {
        case 'restart':
          commandType = 'reboot';
          payload = { delay_seconds: 60 };
          break;
        case 'patch':
          commandType = 'windows_update';
          payload = { auto_reboot: false };
          break;
        case 'scan':
          commandType = 'av_scan';
          payload = { scan_type: 'quick' };
          break;
        case 'script':
          commandType = 'powershell';
          payload = { script: scriptContent };
          break;
        case 'maintenance':
          commandType = 'maintenance_mode';
          payload = { duration_hours: parseInt(maintenanceHours) };
          break;
        default:
          throw new Error('Unknown action type');
      }

      // Queue commands for each device
      const commands = deviceIds.map(deviceId => ({
        agent_id: deviceId,
        user_id: user?.id,
        command_type: commandType,
        command: JSON.stringify(payload),
        status: 'pending',
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('vanguard_agent_commands')
        .insert(commands);

      if (error) throw error;

      toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} command queued for ${deviceIds.length} device(s)`);
      setSelectedDevices(new Set());
      setShowConfirmDialog(false);
      onActionComplete?.();
    } catch (err) {
      console.error('Error executing bulk action:', err);
      toast.error('Failed to execute action');
    } finally {
      setIsExecuting(false);
    }
  };

  const confirmAction = (action: ActionType) => {
    if (selectedDevices.size === 0) {
      toast.error('Select at least one device');
      return;
    }
    setCurrentAction(action);
    setShowConfirmDialog(true);
  };

  const actions = [
    { type: 'restart' as ActionType, label: 'Restart', icon: RefreshCw, color: 'text-yellow-500', dangerous: true },
    { type: 'patch' as ActionType, label: 'Install Patches', icon: Package, color: 'text-blue-500' },
    { type: 'scan' as ActionType, label: 'Run AV Scan', icon: Shield, color: 'text-green-500' },
    { type: 'script' as ActionType, label: 'Run Script', icon: Terminal, color: 'text-purple-500' },
    { type: 'maintenance' as ActionType, label: 'Maintenance Mode', icon: Clock, color: 'text-orange-500' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-500" />
              Bulk Actions
            </CardTitle>
            <CardDescription>
              Execute commands across multiple devices simultaneously
            </CardDescription>
          </div>
          <Badge variant="outline">
            {selectedDevices.size} of {onlineDevices.length} selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Selection */}
        <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto">
          <div className="flex items-center gap-2 pb-3 border-b mb-3">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
              id="select-all"
            />
            <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select All Online Devices ({onlineDevices.length})
            </Label>
          </div>
          
          {onlineDevices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No online devices available
            </p>
          ) : (
            <div className="space-y-2">
              {onlineDevices.slice(0, 10).map(device => (
                <div key={device.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedDevices.has(device.id)}
                    onCheckedChange={() => toggleDevice(device.id)}
                    id={device.id}
                  />
                  <Label htmlFor={device.id} className="text-sm cursor-pointer flex items-center gap-2">
                    <Server className="h-3 w-3 text-muted-foreground" />
                    {device.name}
                  </Label>
                </div>
              ))}
              {onlineDevices.length > 10 && (
                <p className="text-xs text-muted-foreground">
                  +{onlineDevices.length - 10} more devices
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {actions.map(action => (
            <Button
              key={action.type}
              variant="outline"
              size="sm"
              className={cn(
                'h-auto py-3 flex-col gap-1',
                selectedDevices.size === 0 && 'opacity-50'
              )}
              onClick={() => confirmAction(action.type)}
              disabled={selectedDevices.size === 0}
            >
              <action.icon className={cn('h-4 w-4', action.color)} />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {currentAction === 'restart' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                Confirm Bulk Action
              </DialogTitle>
              <DialogDescription>
                This action will be applied to {selectedDevices.size} device(s).
              </DialogDescription>
            </DialogHeader>

            {currentAction === 'script' && (
              <div className="space-y-2">
                <Label>PowerShell Script</Label>
                <Textarea
                  placeholder="Enter PowerShell commands..."
                  value={scriptContent}
                  onChange={(e) => setScriptContent(e.target.value)}
                  rows={5}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {currentAction === 'maintenance' && (
              <div className="space-y-2">
                <Label>Duration (hours)</Label>
                <Select value={maintenanceHours} onValueChange={setMaintenanceHours}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="8">8 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Selected Devices:</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedDevices).slice(0, 5).map(id => {
                  const device = devices.find(d => d.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="text-xs">
                      {device?.name || id.slice(0, 8)}
                    </Badge>
                  );
                })}
                {selectedDevices.size > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedDevices.size - 5} more
                  </Badge>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => currentAction && executeAction(currentAction)}
                disabled={isExecuting || (currentAction === 'script' && !scriptContent.trim())}
                variant={currentAction === 'restart' ? 'destructive' : 'default'}
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
