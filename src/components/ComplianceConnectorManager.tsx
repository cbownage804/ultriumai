import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useComplianceManager } from "@/hooks/useComplianceManager";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, Play, Pause, Trash2, RefreshCw } from "lucide-react";

interface Connector {
  id: string;
  connector_type: string;
  connector_name: string;
  status: string;
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_frequency: string;
  error_message: string | null;
  created_at: string;
}

interface ComplianceConnectorManagerProps {
  connectors: Connector[];
  onRefresh: () => void;
}

export const ComplianceConnectorManager = ({ connectors, onRefresh }: ComplianceConnectorManagerProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newConnector, setNewConnector] = useState({
    type: '',
    name: '',
    configuration: ''
  });
  
  const { createConnector, syncConnector, loading } = useComplianceManager();
  const { toast } = useToast();

  const connectorTypes = [
    { value: 'microsoft_365', label: 'Microsoft 365', description: 'Connect to Microsoft 365 for email, SharePoint, and Teams compliance data' },
    { value: 'domain_controller', label: 'Domain Controller', description: 'Connect to Active Directory domain controllers for user and policy data' },
    { value: 'aws', label: 'Amazon Web Services', description: 'Connect to AWS for cloud infrastructure compliance data' },
    { value: 'google_workspace', label: 'Google Workspace', description: 'Connect to Google Workspace for email, Drive, and admin console data' },
    { value: 'security_tools', label: 'Security Tools', description: 'Connect to security platforms like CrowdStrike, Splunk, Okta, etc.' }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      error: 'destructive',
      connecting: 'outline'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const handleCreateConnector = async () => {
    if (!newConnector.type || !newConnector.name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    let configuration = {};
    if (newConnector.configuration) {
      try {
        configuration = JSON.parse(newConnector.configuration);
      } catch (error) {
        toast({
          title: "Configuration Error",
          description: "Invalid JSON configuration",
          variant: "destructive"
        });
        return;
      }
    }

    const result = await createConnector(newConnector.type, newConnector.name, configuration);
    
    if (result.success) {
      toast({
        title: "Connector Created",
        description: `${newConnector.name} connector has been created successfully`
      });
      setIsCreateDialogOpen(false);
      setNewConnector({ type: '', name: '', configuration: '' });
      onRefresh();
    } else {
      toast({
        title: "Creation Failed",
        description: result.error || "Failed to create connector",
        variant: "destructive"
      });
    }
  };

  const handleSyncConnector = async (connectorId: string, connectorName: string) => {
    const result = await syncConnector(connectorId);
    
    if (result.success) {
      toast({
        title: "Sync Started",
        description: `${connectorName} sync has been initiated`
      });
      onRefresh();
    } else {
      toast({
        title: "Sync Failed",
        description: result.error || "Failed to start sync",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Connectors</h2>
          <p className="text-muted-foreground">Manage your data sources for compliance monitoring</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Connector
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Connector</DialogTitle>
              <DialogDescription>
                Connect a new data source for compliance monitoring
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="connector-type">Connector Type *</Label>
                <Select value={newConnector.type} onValueChange={(value) => setNewConnector(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select connector type" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectorTypes.map(type => (
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
              
              <div>
                <Label htmlFor="connector-name">Connector Name *</Label>
                <Input
                  id="connector-name"
                  placeholder="e.g., Company Microsoft 365"
                  value={newConnector.name}
                  onChange={(e) => setNewConnector(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="connector-config">Configuration (JSON)</Label>
                <Textarea
                  id="connector-config"
                  placeholder='{"tenant_id": "your-tenant-id", "client_id": "your-client-id"}'
                  value={newConnector.configuration}
                  onChange={(e) => setNewConnector(prev => ({ ...prev, configuration: e.target.value }))}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: JSON configuration for the connector
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateConnector} disabled={loading}>
                  Create Connector
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connectors.map(connector => (
          <Card key={connector.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{connector.connector_name}</CardTitle>
                {getStatusBadge(connector.status)}
              </div>
              <CardDescription>
                {connectorTypes.find(t => t.value === connector.connector_type)?.label || connector.connector_type}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sync Frequency:</span>
                  <span className="capitalize">{connector.sync_frequency}</span>
                </div>
                
                {connector.last_sync_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Sync:</span>
                    <span>{new Date(connector.last_sync_at).toLocaleDateString()}</span>
                  </div>
                )}
                
                {connector.next_sync_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Sync:</span>
                    <span>{new Date(connector.next_sync_at).toLocaleDateString()}</span>
                  </div>
                )}
                
                {connector.error_message && (
                  <div className="text-destructive text-xs mt-2 p-2 bg-destructive/10 rounded">
                    {connector.error_message}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSyncConnector(connector.id, connector.connector_name)}
                  disabled={loading || connector.status === 'connecting'}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Sync
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-1" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {connectors.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Connectors Configured</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by creating your first compliance connector to begin monitoring your systems
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Connector
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};