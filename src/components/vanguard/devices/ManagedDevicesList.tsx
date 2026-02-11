/**
 * Managed Devices List Component
 * Cross-platform RMM endpoint management (Windows, macOS, Linux, Servers)
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Monitor, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Zap,
  Loader2,
  Trash2,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getVanguardBasePath } from '@/utils/subdomain';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DevicesToolbar } from '../device/DevicesToolbar';
import { VanguardAgent } from '@/hooks/useVanguardAgents';

const statusBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  online: 'default',
  offline: 'secondary',
  warning: 'outline',
  critical: 'destructive'
};

interface SavedView {
  id: string;
  name: string;
  columns: string[];
  filters: Record<string, string>;
}

interface ManagedDevicesListProps {
  agents: VanguardAgent[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ManagedDevicesList({ agents, isLoading, onRefresh }: ManagedDevicesListProps) {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [aiSearchEnabled, setAiSearchEnabled] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'name', 'status', 'ip_address', 'location', 'last_heartbeat', 'agent_version'
  ]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;

    const query = searchQuery.toLowerCase();
    
    if (aiSearchEnabled) {
      if (query.includes('high cpu') || query.includes('cpu high')) {
        return agents.filter(a => (a.cpu_usage || 0) > 70);
      }
      if (query.includes('offline')) {
        return agents.filter(a => a.status === 'offline');
      }
      if (query.includes('online')) {
        return agents.filter(a => a.status === 'online');
      }
      if (query.includes('critical') || query.includes('warning')) {
        return agents.filter(a => a.status === 'critical' || a.status === 'warning');
      }
    }
    
    return agents.filter(a => 
      a.name.toLowerCase().includes(query) ||
      a.ip_address?.toLowerCase().includes(query) ||
      a.location?.toLowerCase().includes(query) ||
      a.os_info?.toLowerCase().includes(query)
    );
  }, [agents, searchQuery, aiSearchEnabled]);

  const handleBulkAction = async (action: string, payload?: any) => {
    if (selectedDevices.length === 0) return;

    toast.info(`Executing ${action} on ${selectedDevices.length} device(s)...`);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      for (const deviceId of selectedDevices) {
        await supabase.functions.invoke('vanguard-agent-api?action=send_command', {
          body: { agent_id: deviceId, command_type: action, payload },
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
      }

      toast.success(`${action} queued for ${selectedDevices.length} device(s)`);
      setSelectedDevices([]);
    } catch (err: any) {
      toast.error('Bulk action failed', { description: err.message });
    }
  };

  const handleSaveView = (name: string) => {
    const newView: SavedView = {
      id: `view-${Date.now()}`,
      name,
      columns: visibleColumns,
      filters: {},
    };
    setSavedViews(prev => [...prev, newView]);
    toast.success(`View "${name}" saved`);
  };

  const handleLoadView = (view: SavedView) => {
    setVisibleColumns(view.columns);
    toast.success(`Loaded view "${view.name}"`);
  };

  const toggleSelectAll = () => {
    if (selectedDevices.length === filteredAgents.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredAgents.map(a => a.id));
    }
  };

  const toggleSelectDevice = (deviceId: string) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleDeleteDevice = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase
        .from('vanguard_agents')
        .delete()
        .eq('id', deletingId);
      if (error) throw error;
      toast.success('Device deleted');
      setDeletingId(null);
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete device', { description: err.message });
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-black/40 border-cyan-500/20">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4 bg-white/10" />
              <Skeleton className="h-4 w-24 mb-2 bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DevicesToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        aiSearchEnabled={aiSearchEnabled}
        onAiSearchToggle={setAiSearchEnabled}
        selectedDevices={selectedDevices}
        onBulkAction={handleBulkAction}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        savedViews={savedViews}
        onSaveView={handleSaveView}
        onLoadView={handleLoadView}
        onRefresh={onRefresh}
        onAddDevice={() => navigate(`${basePath}/setup`)}
      />

      {agents.length === 0 ? (
        <Card className="bg-black/40 border-cyan-500/20">
          <CardContent className="p-12 text-center">
            <Monitor className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <h3 className="text-lg font-semibold mb-2 text-white">No Managed Devices</h3>
            <p className="text-white/60 mb-4">
              Deploy the Vanguard Agent to start managing your endpoints.
            </p>
            <Button 
              type="button"
              onClick={() => navigate(`${basePath}/setup`)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map(agent => (
            <DeviceCard 
              key={agent.id} 
              agent={agent} 
              isSelected={selectedDevices.includes(agent.id)}
              onSelect={() => toggleSelectDevice(agent.id)}
              onClick={() => navigate(`${basePath}/devices/${agent.id}`)}
              onDelete={() => setDeletingId(agent.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-black/40 border-cyan-500/20">
          <Table>
            <TableHeader>
              <TableRow className="border-cyan-500/20 hover:bg-transparent">
                <TableHead className="w-10 text-white/60">
                  <Checkbox 
                    checked={selectedDevices.length === filteredAgents.length && filteredAgents.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                {visibleColumns.includes('name') && <TableHead className="text-white/60">Device</TableHead>}
                {visibleColumns.includes('status') && <TableHead className="text-white/60">Status</TableHead>}
                {visibleColumns.includes('ip_address') && <TableHead className="text-white/60">IP Address</TableHead>}
                {visibleColumns.includes('location') && <TableHead className="text-white/60">Location</TableHead>}
                {visibleColumns.includes('os_info') && <TableHead className="text-white/60">OS</TableHead>}
                {visibleColumns.includes('agent_version') && <TableHead className="text-white/60">Version</TableHead>}
                {visibleColumns.includes('last_heartbeat') && <TableHead className="text-white/60">Last Seen</TableHead>}
                <TableHead className="w-20 text-white/60">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map(agent => (
                <TableRow 
                  key={agent.id} 
                  className="cursor-pointer border-cyan-500/10 hover:bg-cyan-500/5"
                  onClick={() => navigate(`${basePath}/devices/${agent.id}`)}
                >
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedDevices.includes(agent.id)}
                      onCheckedChange={() => toggleSelectDevice(agent.id)}
                    />
                  </TableCell>
                  {visibleColumns.includes('name') && (
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-cyan-400" />
                        {agent.name}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.includes('status') && (
                    <TableCell>
                      <Badge variant={statusBadgeVariants[agent.status]}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.includes('ip_address') && (
                    <TableCell className="font-mono text-xs text-cyan-400">{agent.ip_address || '-'}</TableCell>
                  )}
                  {visibleColumns.includes('location') && (
                    <TableCell className="text-white/60">{agent.location || '-'}</TableCell>
                  )}
                  {visibleColumns.includes('os_info') && (
                    <TableCell className="text-xs text-white/60">{agent.os_info || '-'}</TableCell>
                  )}
                  {visibleColumns.includes('agent_version') && (
                    <TableCell className="text-white/60">v{agent.agent_version || '?'}</TableCell>
                  )}
                  {visibleColumns.includes('last_heartbeat') && (
                    <TableCell className="text-xs text-white/40">
                      {agent.last_heartbeat 
                        ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })
                        : 'Never'}
                    </TableCell>
                  )}
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/20"
                      onClick={() => setDeletingId(agent.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this device and all its data. You'll need to reinstall the agent to re-enroll it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDevice} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DeviceCard({
  agent,
  isSelected,
  onSelect,
  onClick,
  onDelete,
}: {
  agent: VanguardAgent;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onDelete: () => void;
}) {
  const lastHeartbeat = agent.last_heartbeat 
    ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })
    : 'Never';

  const StatusIcon = agent.status === 'online' ? Wifi : 
                     agent.status === 'offline' ? WifiOff : 
                     AlertTriangle;

  return (
    <Card 
      className={`cursor-pointer transition-all bg-black/40 border-cyan-500/20 ${
        isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'hover:border-cyan-500/50'
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={() => onSelect()}
              onClick={e => e.stopPropagation()}
              className="flex-shrink-0"
            />
            <CardTitle className="text-lg flex items-center gap-2 text-white min-w-0">
              <Monitor className="h-5 w-5 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{agent.name}</span>
            </CardTitle>
          </div>
          <Badge variant={statusBadgeVariants[agent.status]} className="flex-shrink-0">
            <StatusIcon className="h-3 w-3 mr-1" />
            {agent.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-white/60">
            {agent.location || 'No location set'}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="text-cyan-400 font-mono">{agent.ip_address || 'No IP'}</span>
            <span>•</span>
            <span>v{agent.agent_version || '?'}</span>
          </div>

          {agent.os_info && (
            <div className="text-xs bg-slate-800/50 px-2 py-1 rounded inline-block text-white/60">
              {agent.os_info}
            </div>
          )}

          <div className="pt-2 border-t border-cyan-500/10 flex items-center justify-between">
            <span className="text-xs text-white/40">
              Last seen: {lastHeartbeat}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/20"
              onClick={e => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
