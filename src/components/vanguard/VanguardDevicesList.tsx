import { useState, useMemo } from 'react';
import { useVanguardAgents, VanguardAgent } from '@/hooks/useVanguardAgents';
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
  Server, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Zap,
  Loader2,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
import { DevicesToolbar } from './device/DevicesToolbar';

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500'
};

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

export function VanguardDevicesList() {
  const { agents, isLoading, refetch, deleteAgent } = useVanguardAgents();
  const navigate = useNavigate();

  // State for toolbar
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSearchEnabled, setAiSearchEnabled] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'name', 'status', 'ip_address', 'location', 'last_heartbeat', 'agent_version'
  ]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  // Filter agents based on search
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;

    const query = searchQuery.toLowerCase();
    
    if (aiSearchEnabled) {
      // AI-style natural language filtering
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
      if (query.includes('windows')) {
        return agents.filter(a => a.os_info?.toLowerCase().includes('windows'));
      }
      if (query.includes('linux')) {
        return agents.filter(a => a.os_info?.toLowerCase().includes('linux'));
      }
      if (query.includes('hailo')) {
        return agents.filter(a => a.hailo_board_name);
      }
    }
    
    // Standard text search
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Vanguard Devices</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vanguard Devices</h2>
        <Badge variant="outline">{filteredAgents.length} device{filteredAgents.length !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Enhanced Toolbar */}
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
        onRefresh={refetch}
        onAddDevice={() => navigate('/vanguard/setup')}
      />

      {agents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Vanguard Devices</h3>
            <p className="text-muted-foreground mb-4">
              Connect your first Vanguard appliance to start monitoring.
            </p>
            <Button onClick={() => navigate('/vanguard/setup')}>
              Add Your First Device
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
              onClick={() => navigate(`/vanguard/devices/${agent.id}`)}
              onDelete={() => deleteAgent(agent.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox 
                    checked={selectedDevices.length === filteredAgents.length && filteredAgents.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                {visibleColumns.includes('name') && <TableHead>Device</TableHead>}
                {visibleColumns.includes('status') && <TableHead>Status</TableHead>}
                {visibleColumns.includes('ip_address') && <TableHead>IP Address</TableHead>}
                {visibleColumns.includes('location') && <TableHead>Location</TableHead>}
                {visibleColumns.includes('os_info') && <TableHead>OS</TableHead>}
                {visibleColumns.includes('agent_version') && <TableHead>Version</TableHead>}
                {visibleColumns.includes('last_heartbeat') && <TableHead>Last Seen</TableHead>}
                {visibleColumns.includes('cpu_usage') && <TableHead>CPU</TableHead>}
                {visibleColumns.includes('memory_usage') && <TableHead>Memory</TableHead>}
                {visibleColumns.includes('disk_usage') && <TableHead>Disk</TableHead>}
                {visibleColumns.includes('hailo_board_name') && <TableHead>Hailo</TableHead>}
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map(agent => (
                <TableRow 
                  key={agent.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/vanguard/devices/${agent.id}`)}
                >
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedDevices.includes(agent.id)}
                      onCheckedChange={() => toggleSelectDevice(agent.id)}
                    />
                  </TableCell>
                  {visibleColumns.includes('name') && (
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
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
                    <TableCell className="font-mono text-xs">{agent.ip_address || '-'}</TableCell>
                  )}
                  {visibleColumns.includes('location') && (
                    <TableCell>{agent.location || '-'}</TableCell>
                  )}
                  {visibleColumns.includes('os_info') && (
                    <TableCell className="text-xs">{agent.os_info || '-'}</TableCell>
                  )}
                  {visibleColumns.includes('agent_version') && (
                    <TableCell>v{agent.agent_version || '?'}</TableCell>
                  )}
                  {visibleColumns.includes('last_heartbeat') && (
                    <TableCell className="text-xs text-muted-foreground">
                      {agent.last_heartbeat 
                        ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })
                        : 'Never'}
                    </TableCell>
                  )}
                  {visibleColumns.includes('cpu_usage') && (
                    <TableCell>
                      <span className={agent.cpu_usage && agent.cpu_usage > 80 ? 'text-destructive' : ''}>
                        {agent.cpu_usage?.toFixed(0) || '-'}%
                      </span>
                    </TableCell>
                  )}
                  {visibleColumns.includes('memory_usage') && (
                    <TableCell>
                      <span className={agent.memory_usage && agent.memory_usage > 80 ? 'text-destructive' : ''}>
                        {agent.memory_usage?.toFixed(0) || '-'}%
                      </span>
                    </TableCell>
                  )}
                  {visibleColumns.includes('disk_usage') && (
                    <TableCell>
                      <span className={agent.disk_usage && agent.disk_usage > 80 ? 'text-destructive' : ''}>
                        {agent.disk_usage?.toFixed(0) || '-'}%
                      </span>
                    </TableCell>
                  )}
                  {visibleColumns.includes('hailo_board_name') && (
                    <TableCell className="text-xs">{agent.hailo_board_name || '-'}</TableCell>
                  )}
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Zap className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
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
  onDelete: () => Promise<void>;
}) {
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const lastHeartbeat = agent.last_heartbeat 
    ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })
    : 'Never';

  const StatusIcon = agent.status === 'online' ? Wifi : 
                     agent.status === 'offline' ? WifiOff : 
                     AlertTriangle;

  const testConnection = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTesting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const response = await supabase.functions.invoke('vanguard-agent-api?action=send_command', {
        body: { 
          agent_id: agent.id, 
          command_type: 'ping',
          payload: { timestamp: Date.now() }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;

      toast.success(`Ping command queued for ${agent.name}`);
    } catch (err: any) {
      toast.error('Test failed', { description: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-colors ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={(e) => {
                onSelect();
              }}
              onClick={e => e.stopPropagation()}
            />
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5" />
              {agent.name}
            </CardTitle>
          </div>
          <Badge variant={statusBadgeVariants[agent.status]}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {agent.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {agent.location || 'No location set'}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{agent.ip_address || 'No IP'}</span>
            <span>•</span>
            <span>v{agent.agent_version || '?'}</span>
          </div>

          {agent.hailo_board_name && (
            <div className="text-xs bg-muted/50 px-2 py-1 rounded inline-block">
              Hailo: {agent.hailo_board_name}
            </div>
          )}

          <div className="pt-2 border-t flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Last heartbeat: {lastHeartbeat}
            </span>
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    disabled={isDeleting}
                    className="h-7 px-2"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete device?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{agent.name}" and its data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        variant="destructive"
                        onClick={async (e) => {
                          e.stopPropagation();
                          setIsDeleting(true);
                          try {
                            await onDelete();
                          } finally {
                            setIsDeleting(false);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={testConnection}
                disabled={isTesting}
                className="h-7 text-xs"
              >
                {isTesting ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Zap className="h-3 w-3 mr-1" />
                )}
                Test
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
