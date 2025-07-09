import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, Settings, Plus, Trash2, Download, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuditLogger } from '@/hooks/useAuditLogger';

interface BulkOperation {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  total_items: number;
  processed_items: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  config: any;
}

const BulkOperations = () => {
  const { toast } = useToast();
  const { logAdminAction } = useAuditLogger();
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOperationDialog, setShowNewOperationDialog] = useState(false);
  const [newOperation, setNewOperation] = useState({
    name: '',
    type: 'user_update',
    config: {}
  });

  const operationTypes = [
    { value: 'user_update', label: 'User Role Update', description: 'Update user roles in bulk' },
    { value: 'user_export', label: 'User Data Export', description: 'Export user data' },
    { value: 'subscription_update', label: 'Subscription Update', description: 'Update subscription tiers' },
    { value: 'data_cleanup', label: 'Data Cleanup', description: 'Clean up old or invalid data' },
    { value: 'notification_send', label: 'Send Notifications', description: 'Send bulk notifications to users' }
  ];

  const fetchOperations = async () => {
    try {
      // Since we don't have a bulk_operations table, let's simulate some operations
      setOperations([
        {
          id: '1',
          name: 'User Role Update - MSP Accounts',
          type: 'user_update',
          status: 'completed',
          progress: 100,
          total_items: 150,
          processed_items: 150,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          started_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
          config: { target_role: 'msp', criteria: 'account_type = msp' }
        },
        {
          id: '2',
          name: 'Subscription Tier Migration',
          type: 'subscription_update',
          status: 'running',
          progress: 65,
          total_items: 89,
          processed_items: 58,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          started_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          config: { from_tier: 'basic', to_tier: 'premium' }
        },
        {
          id: '3',
          name: 'Weekly User Export',
          type: 'user_export',
          status: 'pending',
          progress: 0,
          total_items: 500,
          processed_items: 0,
          created_at: new Date().toISOString(),
          config: { format: 'csv', include_analytics: true }
        }
      ]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch bulk operations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
    // Simulate real-time updates
    const interval = setInterval(() => {
      setOperations(prev => prev.map(op => {
        if (op.status === 'running' && op.progress < 100) {
          const newProgress = Math.min(op.progress + Math.random() * 10, 100);
          const newProcessed = Math.floor((newProgress / 100) * op.total_items);
          return {
            ...op,
            progress: newProgress,
            processed_items: newProcessed,
            status: newProgress >= 100 ? 'completed' : 'running',
            completed_at: newProgress >= 100 ? new Date().toISOString() : undefined
          };
        }
        return op;
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'running': return 'secondary';
      case 'failed': return 'destructive';
      case 'paused': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <Play className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const startOperation = async (operationId: string) => {
    try {
      setOperations(prev => prev.map(op => 
        op.id === operationId 
          ? { ...op, status: 'running', started_at: new Date().toISOString() }
          : op
      ));
      
      await logAdminAction({
        action: 'start_bulk_operation',
        resource_type: 'bulk_operation',
        resource_id: operationId,
        metadata: { operation_id: operationId }
      });
      
      toast({
        title: "Operation Started",
        description: "Bulk operation has been started successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start operation",
        variant: "destructive",
      });
    }
  };

  const pauseOperation = async (operationId: string) => {
    try {
      setOperations(prev => prev.map(op => 
        op.id === operationId 
          ? { ...op, status: 'paused' }
          : op
      ));
      
      await logAdminAction({
        action: 'pause_bulk_operation',
        resource_type: 'bulk_operation',
        resource_id: operationId,
        metadata: { operation_id: operationId }
      });
      
      toast({
        title: "Operation Paused",
        description: "Bulk operation has been paused",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause operation",
        variant: "destructive",
      });
    }
  };

  const deleteOperation = async (operationId: string) => {
    try {
      setOperations(prev => prev.filter(op => op.id !== operationId));
      
      await logAdminAction({
        action: 'delete_bulk_operation',
        resource_type: 'bulk_operation',
        resource_id: operationId,
        metadata: { operation_id: operationId }
      });
      
      toast({
        title: "Operation Deleted",
        description: "Bulk operation has been deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete operation",
        variant: "destructive",
      });
    }
  };

  const createNewOperation = async () => {
    try {
      const newOp: BulkOperation = {
        id: Date.now().toString(),
        name: newOperation.name,
        type: newOperation.type,
        status: 'pending',
        progress: 0,
        total_items: 0,
        processed_items: 0,
        created_at: new Date().toISOString(),
        config: newOperation.config
      };
      
      setOperations(prev => [newOp, ...prev]);
      setShowNewOperationDialog(false);
      setNewOperation({ name: '', type: 'user_update', config: {} });
      
      await logAdminAction({
        action: 'create_bulk_operation',
        resource_type: 'bulk_operation',
        resource_name: newOperation.name,
        metadata: { operation_type: newOperation.type }
      });
      
      toast({
        title: "Operation Created",
        description: "New bulk operation has been created",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create operation",
        variant: "destructive",
      });
    }
  };

  const exportOperations = () => {
    const csvContent = [
      'Name,Type,Status,Progress,Total Items,Processed Items,Created At,Started At,Completed At',
      ...operations.map(op => 
        `"${op.name}","${op.type}","${op.status}","${op.progress}%","${op.total_items}","${op.processed_items}","${op.created_at}","${op.started_at || 'N/A'}","${op.completed_at || 'N/A'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk_operations_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Bulk Operations</h2>
          <p className="text-muted-foreground">Manage and monitor large-scale administrative tasks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportOperations}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showNewOperationDialog} onOpenChange={setShowNewOperationDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Operation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Bulk Operation</DialogTitle>
                <DialogDescription>
                  Set up a new bulk operation to manage multiple records at once
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="operation-name">Operation Name</Label>
                  <Input
                    id="operation-name"
                    value={newOperation.name}
                    onChange={(e) => setNewOperation(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter operation name"
                  />
                </div>
                <div>
                  <Label htmlFor="operation-type">Operation Type</Label>
                  <Select 
                    value={newOperation.type} 
                    onValueChange={(value) => setNewOperation(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewOperationDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewOperation} disabled={!newOperation.name}>
                    Create Operation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Operations List */}
      <div className="space-y-4">
        {operations.map((operation) => (
          <Card key={operation.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{operation.name}</h4>
                    <Badge variant={getStatusColor(operation.status)} className="flex items-center gap-1">
                      {getStatusIcon(operation.status)}
                      {operation.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Type: {operationTypes.find(t => t.value === operation.type)?.label || operation.type}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{operation.processed_items} / {operation.total_items} items</span>
                      <span>{Math.round(operation.progress)}%</span>
                    </div>
                    <Progress value={operation.progress} className="h-2" />
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(operation.created_at).toLocaleString()}
                    {operation.started_at && (
                      <> • Started: {new Date(operation.started_at).toLocaleString()}</>
                    )}
                    {operation.completed_at && (
                      <> • Completed: {new Date(operation.completed_at).toLocaleString()}</>
                    )}
                  </div>
                  
                  {operation.error_message && (
                    <div className="text-xs text-destructive">{operation.error_message}</div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {operation.status === 'pending' && (
                    <Button variant="outline" size="sm" onClick={() => startOperation(operation.id)}>
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {operation.status === 'running' && (
                    <Button variant="outline" size="sm" onClick={() => pauseOperation(operation.id)}>
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  {operation.status === 'paused' && (
                    <Button variant="outline" size="sm" onClick={() => startOperation(operation.id)}>
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {(operation.status === 'completed' || operation.status === 'failed') && (
                    <Button variant="outline" size="sm" onClick={() => deleteOperation(operation.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {operations.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No bulk operations found</h3>
              <p className="text-muted-foreground mb-4">Create your first bulk operation to get started</p>
              <Button onClick={() => setShowNewOperationDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Operation
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BulkOperations;