import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Shield, FileWarning, Globe, Search, RotateCcw, Trash2, 
  Ban, CheckCircle, Clock, AlertTriangle, Download, RefreshCw,
  Server, HardDrive, Network
} from "lucide-react";
import { format } from "date-fns";

interface QuarantinedFile {
  id: string;
  agent_id: string;
  file_path: string;
  file_hash: string;
  file_size: number;
  quarantine_reason: string;
  threat_type: string;
  quarantined_at: string;
  status: 'quarantined' | 'restored' | 'deleted';
  original_location: string;
  agent?: { name: string };
}

interface BlockedIP {
  id: string;
  agent_id: string;
  ip_address: string;
  port?: number;
  direction: 'inbound' | 'outbound' | 'both';
  block_reason: string;
  threat_id?: string;
  blocked_at: string;
  expires_at?: string;
  status: 'active' | 'expired' | 'removed';
  agent?: { name: string };
}

export const QuarantineManager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("files");
  const queryClient = useQueryClient();

  // Fetch quarantined files
  const { data: quarantinedFiles, isLoading: filesLoading } = useQuery({
    queryKey: ['quarantined-files'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Using containment_actions as the source for quarantined items
      const { data, error } = await supabase
        .from('containment_actions')
        .select(`
          id,
          agent_id,
          action_type,
          target_details,
          status,
          executed_at,
          executed_by,
          vanguard_agents (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('action_type', 'file_quarantine')
        .order('executed_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        agent_id: item.agent_id,
        file_path: (item.target_details as any)?.file_path || 'Unknown',
        file_hash: (item.target_details as any)?.file_hash || '',
        file_size: (item.target_details as any)?.file_size || 0,
        quarantine_reason: (item.target_details as any)?.reason || 'Threat detected',
        threat_type: (item.target_details as any)?.threat_type || 'malware',
        quarantined_at: item.executed_at,
        status: item.status === 'completed' ? 'quarantined' : item.status,
        original_location: (item.target_details as any)?.original_location || '',
        agent: item.vanguard_agents
      })) as QuarantinedFile[];
    }
  });

  // Fetch blocked IPs
  const { data: blockedIPs, isLoading: ipsLoading } = useQuery({
    queryKey: ['blocked-ips'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('containment_actions')
        .select(`
          id,
          agent_id,
          action_type,
          target_details,
          status,
          executed_at,
          vanguard_agents (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('action_type', 'firewall_block')
        .order('executed_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        agent_id: item.agent_id,
        ip_address: (item.target_details as any)?.ip_address || 'Unknown',
        port: (item.target_details as any)?.port,
        direction: (item.target_details as any)?.direction || 'both',
        block_reason: (item.target_details as any)?.reason || 'Suspicious activity',
        threat_id: (item.target_details as any)?.threat_id,
        blocked_at: item.executed_at,
        status: item.status === 'completed' ? 'active' : item.status,
        agent: item.vanguard_agents
      })) as BlockedIP[];
    }
  });

  // Restore file mutation
  const restoreFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const file = quarantinedFiles?.find(f => f.id === fileId);
      if (!file) throw new Error('File not found');

      // Send restore command to agent
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: file.agent_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          command_type: 'restore_file',
          payload: {
            containment_action_id: fileId,
            file_path: file.file_path,
            original_location: file.original_location
          },
          status: 'pending'
        });

      if (error) throw error;

      // Update containment action status
      await supabase
        .from('containment_actions')
        .update({ status: 'restored' })
        .eq('id', fileId);
    },
    onSuccess: () => {
      toast.success('File restore command sent');
      queryClient.invalidateQueries({ queryKey: ['quarantined-files'] });
    },
    onError: (error) => {
      toast.error(`Failed to restore: ${error.message}`);
    }
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const file = quarantinedFiles?.find(f => f.id === fileId);
      if (!file) throw new Error('File not found');

      // Send delete command to agent
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: file.agent_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          command_type: 'delete_quarantined',
          payload: {
            containment_action_id: fileId,
            file_path: file.file_path
          },
          status: 'pending'
        });

      if (error) throw error;

      await supabase
        .from('containment_actions')
        .update({ status: 'deleted' })
        .eq('id', fileId);
    },
    onSuccess: () => {
      toast.success('File deletion command sent');
      queryClient.invalidateQueries({ queryKey: ['quarantined-files'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    }
  });

  // Unblock IP mutation
  const unblockIPMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const block = blockedIPs?.find(b => b.id === blockId);
      if (!block) throw new Error('Block not found');

      // Send unblock command to agent
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: block.agent_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          command_type: 'firewall_unblock',
          payload: {
            containment_action_id: blockId,
            ip_address: block.ip_address,
            port: block.port
          },
          status: 'pending'
        });

      if (error) throw error;

      await supabase
        .from('containment_actions')
        .update({ status: 'removed' })
        .eq('id', blockId);
    },
    onSuccess: () => {
      toast.success('IP unblock command sent');
      queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
    },
    onError: (error) => {
      toast.error(`Failed to unblock: ${error.message}`);
    }
  });

  const filteredFiles = quarantinedFiles?.filter(file => 
    file.file_path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.agent?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.threat_type.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredIPs = blockedIPs?.filter(ip =>
    ip.ip_address.includes(searchQuery) ||
    ip.agent?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ip.block_reason.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'quarantined':
      case 'active':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><AlertTriangle className="h-3 w-3 mr-1" /> {status}</Badge>;
      case 'restored':
      case 'removed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" /> {status}</Badge>;
      case 'deleted':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><Trash2 className="h-3 w-3 mr-1" /> {status}</Badge>;
      case 'expired':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> {status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <Shield className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Quarantine Manager</h2>
            <p className="text-white/60 text-sm">Manage quarantined files and blocked network connections</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['quarantined-files'] });
              queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileWarning className="h-8 w-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {quarantinedFiles?.filter(f => f.status === 'quarantined').length || 0}
                </p>
                <p className="text-white/60 text-sm">Quarantined Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Ban className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {blockedIPs?.filter(ip => ip.status === 'active').length || 0}
                </p>
                <p className="text-white/60 text-sm">Blocked IPs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {quarantinedFiles?.filter(f => f.status === 'restored').length || 0}
                </p>
                <p className="text-white/60 text-sm">Restored Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Server className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {new Set([
                    ...(quarantinedFiles?.map(f => f.agent_id) || []),
                    ...(blockedIPs?.map(ip => ip.agent_id) || [])
                  ]).size}
                </p>
                <p className="text-white/60 text-sm">Affected Endpoints</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          placeholder="Search files, IPs, hosts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5">
          <TabsTrigger value="files" className="data-[state=active]:bg-amber-500/20">
            <FileWarning className="h-4 w-4 mr-2" />
            Quarantined Files ({filteredFiles.length})
          </TabsTrigger>
          <TabsTrigger value="network" className="data-[state=active]:bg-red-500/20">
            <Globe className="h-4 w-4 mr-2" />
            Blocked IPs ({filteredIPs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="mt-4">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Quarantined Files
              </CardTitle>
              <CardDescription>Files isolated by XDR for security analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {filesLoading ? (
                <div className="text-center py-8 text-white/60">Loading...</div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <FileWarning className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No quarantined files found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Path</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Threat Type</TableHead>
                      <TableHead>Quarantined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-mono text-xs max-w-[300px] truncate">
                          {file.file_path}
                        </TableCell>
                        <TableCell>{file.agent?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {file.threat_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-white/60">
                          {file.quarantined_at ? format(new Date(file.quarantined_at), 'MMM d, HH:mm') : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(file.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {file.status === 'quarantined' && (
                              <>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      Restore
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Restore File?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will restore the file to its original location. Only do this if you're certain the file is safe.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => restoreFileMutation.mutate(file.id)}>
                                        Restore
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the quarantined file. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        className="bg-destructive text-destructive-foreground"
                                        onClick={() => deleteFileMutation.mutate(file.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="mt-4">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Network className="h-5 w-5" />
                Blocked IP Addresses
              </CardTitle>
              <CardDescription>Network connections blocked by XDR firewall rules</CardDescription>
            </CardHeader>
            <CardContent>
              {ipsLoading ? (
                <div className="text-center py-8 text-white/60">Loading...</div>
              ) : filteredIPs.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No blocked IPs found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Port</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Blocked</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIPs.map((block) => (
                      <TableRow key={block.id}>
                        <TableCell className="font-mono">{block.ip_address}</TableCell>
                        <TableCell>{block.port || 'All'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {block.direction}
                          </Badge>
                        </TableCell>
                        <TableCell>{block.agent?.name || 'Unknown'}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          {block.block_reason}
                        </TableCell>
                        <TableCell className="text-sm text-white/60">
                          {block.blocked_at ? format(new Date(block.blocked_at), 'MMM d, HH:mm') : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(block.status)}</TableCell>
                        <TableCell>
                          {block.status === 'active' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Unblock
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Unblock IP Address?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove the firewall block for {block.ip_address}. Only do this if you're certain the IP is safe.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => unblockIPMutation.mutate(block.id)}>
                                    Unblock
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
