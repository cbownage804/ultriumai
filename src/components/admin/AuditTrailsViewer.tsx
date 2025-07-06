import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Eye, Calendar, User, Shield, Database, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AuditTrail {
  id: string;
  admin_user_id: string;
  admin_email: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
  created_at: string;
}

export const AuditTrailsViewer = () => {
  const [auditTrails, setAuditTrails] = useState<AuditTrail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [selectedTrail, setSelectedTrail] = useState<AuditTrail | null>(null);
  const { toast } = useToast();

  const fetchAuditTrails = async () => {
    try {
      let query = supabase
        .from('admin_audit_trails')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      const { data, error } = await query;
      if (error) throw error;
      
      setAuditTrails(data?.map(trail => ({
        ...trail,
        ip_address: trail.ip_address as string
      })) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch audit trails",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditTrails();
  }, []);

  const exportAuditTrails = () => {
    const csvContent = [
      'Timestamp,Admin Email,Action,Resource Type,Resource Name,IP Address',
      ...filteredTrails.map(trail => 
        `"${format(new Date(trail.created_at), 'yyyy-MM-dd HH:mm:ss')}","${trail.admin_email}","${trail.action}","${trail.resource_type}","${trail.resource_name || 'N/A'}","${trail.ip_address || 'N/A'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin_audit_trails_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredTrails = auditTrails.filter(trail => {
    const matchesSearch = trail.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trail.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trail.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (trail.resource_name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = actionFilter === 'all' || trail.action === actionFilter;
    const matchesResource = resourceFilter === 'all' || trail.resource_type === resourceFilter;

    return matchesSearch && matchesAction && matchesResource;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('delete')) return 'destructive';
    if (action.includes('create') || action.includes('add')) return 'secondary';
    if (action.includes('update') || action.includes('edit')) return 'default';
    return 'outline';
  };

  const uniqueActions = [...new Set(auditTrails.map(trail => trail.action))];
  const uniqueResourceTypes = [...new Set(auditTrails.map(trail => trail.resource_type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Audit Trails
              </CardTitle>
              <CardDescription>
                Complete log of all administrative actions and system changes
              </CardDescription>
            </div>
            <Button onClick={exportAuditTrails} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by admin, action, or resource..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {uniqueResourceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrails.map((trail) => (
                  <TableRow key={trail.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">
                            {format(new Date(trail.created_at), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(trail.created_at), 'HH:mm:ss')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{trail.admin_email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeColor(trail.action)}>
                        {trail.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">{trail.resource_type}</div>
                        {trail.resource_name && (
                          <div className="text-xs text-muted-foreground">{trail.resource_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground max-w-xs truncate">
                        {trail.metadata?.description || 'No additional details'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono">{trail.ip_address || 'N/A'}</span>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedTrail(trail)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Audit Trail Details</DialogTitle>
                            <DialogDescription>
                              Complete information about this administrative action
                            </DialogDescription>
                          </DialogHeader>
                          {selectedTrail && (
                            <ScrollArea className="max-h-96">
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Timestamp</label>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(selectedTrail.created_at), 'PPpp')}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Admin</label>
                                    <p className="text-sm text-muted-foreground">{selectedTrail.admin_email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Action</label>
                                    <p className="text-sm text-muted-foreground">{selectedTrail.action}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Resource Type</label>
                                    <p className="text-sm text-muted-foreground">{selectedTrail.resource_type}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Resource Name</label>
                                    <p className="text-sm text-muted-foreground">{selectedTrail.resource_name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">IP Address</label>
                                    <p className="text-sm font-mono text-muted-foreground">{selectedTrail.ip_address || 'N/A'}</p>
                                  </div>
                                </div>

                                {selectedTrail.old_values && (
                                  <div>
                                    <label className="text-sm font-medium">Previous Values</label>
                                    <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">
                                      {JSON.stringify(selectedTrail.old_values, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {selectedTrail.new_values && (
                                  <div>
                                    <label className="text-sm font-medium">New Values</label>
                                    <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">
                                      {JSON.stringify(selectedTrail.new_values, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {selectedTrail.metadata && Object.keys(selectedTrail.metadata).length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium">Metadata</label>
                                    <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">
                                      {JSON.stringify(selectedTrail.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                <div>
                                  <label className="text-sm font-medium">User Agent</label>
                                  <p className="text-xs text-muted-foreground break-all">
                                    {selectedTrail.user_agent || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </ScrollArea>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTrails.length === 0 && (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No audit trails found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};