import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  MoreHorizontal, 
  RefreshCw, 
  Power, 
  Terminal, 
  FileCode, 
  Shield,
  Monitor,
  AlertTriangle,
  Loader2,
  Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getVanguardBasePath } from '@/utils/subdomain';

interface DeviceQuickActionsProps {
  deviceId: string;
  deviceName: string;
  onActionComplete?: () => void;
}

type ActionType = 'restart' | 'shutdown' | 'scan' | 'script' | 'remote' | 'command';

export function DeviceQuickActions({ deviceId, deviceName, onActionComplete }: DeviceQuickActionsProps) {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const [isExecuting, setIsExecuting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: ActionType;
    title: string;
    description: string;
    requiresInput?: boolean;
    inputLabel?: string;
    inputValue?: string;
  }>({
    open: false,
    action: 'restart',
    title: '',
    description: '',
  });

  const sendCommand = async (commandType: string, payload?: Record<string, unknown>) => {
    try {
      setIsExecuting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('vanguard-agent-api?action=send_command', {
        body: { 
          agent_id: deviceId, 
          command_type: commandType,
          payload: payload || {}
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;

      toast.success(`Command "${commandType}" sent to ${deviceName}`, {
        description: 'The device will execute this command shortly.',
      });
      
      onActionComplete?.();
    } catch (err: any) {
      toast.error('Command failed', { description: err.message });
    } finally {
      setIsExecuting(false);
      setConfirmDialog(prev => ({ ...prev, open: false }));
    }
  };

  const handleAction = (action: ActionType) => {
    switch (action) {
      case 'restart':
        setConfirmDialog({
          open: true,
          action,
          title: 'Restart Device',
          description: `Are you sure you want to restart "${deviceName}"? This will disconnect any active sessions.`,
        });
        break;
      case 'shutdown':
        setConfirmDialog({
          open: true,
          action,
          title: 'Shutdown Device',
          description: `Are you sure you want to shut down "${deviceName}"? The device will go offline until manually powered on.`,
        });
        break;
      case 'scan':
        sendCommand('security_scan', { scan_type: 'quick' });
        break;
      case 'command':
        setConfirmDialog({
          open: true,
          action,
          title: 'Run Command',
          description: `Execute a PowerShell/CMD command on "${deviceName}".`,
          requiresInput: true,
          inputLabel: 'Command',
          inputValue: '',
        });
        break;
      case 'script':
        navigate(`${basePath}/scripts?deviceId=${encodeURIComponent(deviceId)}`);
        break;
      case 'remote':
        navigate(`${basePath}/rmm/remote?deviceId=${encodeURIComponent(deviceId)}`);
        break;
    }
  };

  const executeConfirmedAction = async () => {
    switch (confirmDialog.action) {
      case 'restart':
        await sendCommand('restart', { delay_seconds: 30, message: 'System will restart in 30 seconds' });
        break;
      case 'shutdown':
        await sendCommand('shutdown', { delay_seconds: 60, message: 'System will shut down in 60 seconds' });
        break;
      case 'command':
        if (confirmDialog.inputValue?.trim()) {
          await sendCommand('execute_command', { 
            command: confirmDialog.inputValue,
            shell: 'powershell'
          });
        }
        break;
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isExecuting}>
            {isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction('remote')}>
            <Monitor className="h-4 w-4 mr-2" />
            Remote Access
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('command')}>
            <Terminal className="h-4 w-4 mr-2" />
            Run Command
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('script')}>
            <FileCode className="h-4 w-4 mr-2" />
            Run Script
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('scan')}>
            <Shield className="h-4 w-4 mr-2" />
            Security Scan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction('restart')}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Restart
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleAction('shutdown')}
            className="text-destructive focus:text-destructive"
          >
            <Power className="h-4 w-4 mr-2" />
            Shutdown
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.action === 'restart' && <RefreshCw className="h-5 w-5 text-yellow-500" />}
              {confirmDialog.action === 'shutdown' && <Power className="h-5 w-5 text-red-500" />}
              {confirmDialog.action === 'command' && <Terminal className="h-5 w-5 text-cyan-500" />}
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>

          {confirmDialog.requiresInput && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="command-input">{confirmDialog.inputLabel}</Label>
                <Textarea
                  id="command-input"
                  placeholder="Enter command..."
                  value={confirmDialog.inputValue}
                  onChange={(e) => setConfirmDialog(prev => ({ ...prev, inputValue: e.target.value }))}
                  className="font-mono text-sm"
                  rows={3}
                />
              </div>
            </div>
          )}

          {(confirmDialog.action === 'restart' || confirmDialog.action === 'shutdown') && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm">
                {confirmDialog.action === 'restart' 
                  ? 'Device will restart in 30 seconds after command is received.'
                  : 'Device will shut down in 60 seconds. Manual intervention required to power back on.'}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
              disabled={isExecuting}
            >
              Cancel
            </Button>
            <Button 
              onClick={executeConfirmedAction}
              disabled={isExecuting || (confirmDialog.requiresInput && !confirmDialog.inputValue?.trim())}
              variant={confirmDialog.action === 'shutdown' ? 'destructive' : 'default'}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
