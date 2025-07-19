import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, Plus, Settings, Users, Key, Trash2, Copy, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface MSPClient {
  id: string;
  client_name: string;
  client_code: string;
  contact_email: string;
  contact_phone?: string;
  connector_key: string;
  is_active: boolean;
  created_at: string;
  device_count?: number;
}

export const MSPClientManager = () => {
  const [clients, setClients] = useState<MSPClient[]>([]);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({
    client_name: '',
    client_code: '',
    contact_email: '',
    contact_phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Mock data for now - in real implementation, this would come from Supabase
  useEffect(() => {
    // Simulate loading clients
    setClients([
      {
        id: '1',
        client_name: 'Acme Corporation',
        client_code: 'ACME01',
        contact_email: 'admin@acme.com',
        contact_phone: '+1-555-0123',
        connector_key: 'sk-client-ACME01-x8k9m2n4',
        is_active: true,
        created_at: '2024-01-15T10:00:00Z',
        device_count: 24
      },
      {
        id: '2',
        client_name: 'Tech Solutions LLC',
        client_code: 'TECH02',
        contact_email: 'it@techsolutions.com',
        connector_key: 'sk-client-TECH02-p7q3r5t8',
        is_active: true,
        created_at: '2024-01-20T14:30:00Z',
        device_count: 12
      },
      {
        id: '3',
        client_name: 'Global Services Inc',
        client_code: 'GLOBAL03',
        contact_email: 'support@globalservices.com',
        connector_key: 'sk-client-GLOBAL03-w2e5r8t1',
        is_active: false,
        created_at: '2024-02-01T09:15:00Z',
        device_count: 0
      }
    ]);
  }, []);

  const generateClientCode = (clientName: string) => {
    const cleaned = clientName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const code = cleaned.substring(0, 6) + String(Math.floor(Math.random() * 100)).padStart(2, '0');
    return code;
  };

  const generateConnectorKey = (clientCode: string) => {
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `sk-client-${clientCode}-${randomStr}`;
  };

  const handleAddClient = async () => {
    if (!newClient.client_name || !newClient.contact_email) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const clientCode = newClient.client_code || generateClientCode(newClient.client_name);
      const connectorKey = generateConnectorKey(clientCode);

      const client: MSPClient = {
        id: Date.now().toString(),
        client_name: newClient.client_name,
        client_code: clientCode,
        contact_email: newClient.contact_email,
        contact_phone: newClient.contact_phone,
        connector_key: connectorKey,
        is_active: true,
        created_at: new Date().toISOString(),
        device_count: 0
      };

      setClients(prev => [...prev, client]);
      setNewClient({ client_name: '', client_code: '', contact_email: '', contact_phone: '' });
      setIsAddingClient(false);

      toast({
        title: "Client Added",
        description: `${client.client_name} has been added successfully.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add client.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = (clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
    toast({
      title: "Client Removed",
      description: "Client has been removed from your MSP."
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard.`
    });
  };

  const downloadClientAgent = (client: MSPClient, deploymentType: 'powershell' | 'config' | 'universal') => {
    if (deploymentType === 'config') {
      // Generate client-specific configuration file
      const configContent = JSON.stringify({
        ConnectorKey: client.connector_key,
        ClientCode: client.client_code,
        ClientName: client.client_name,
        ApiUrl: "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1",
        StorageUrl: "https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/rmm-agents",
        ContactEmail: client.contact_email,
        Settings: {
          CheckinInterval: 300,
          MetricsInterval: 60,
          EnableRemoteCommands: true,
          AutoUpdate: true
        }
      }, null, 2);

      const blob = new Blob([configContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ultrium-config-${client.client_code}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Config Downloaded",
        description: `Configuration file for ${client.client_name} downloaded. Use with universal EXE/MSI.`
      });
      return;
    }

    if (deploymentType === 'universal') {
      // Generate universal installer command
      const configUrl = `${window.location.origin}/functions/rmm-client-config?client=${client.client_code}`;
      const command = `# Universal Ultrium RMM Agent Installation
# For client: ${client.client_name} (${client.client_code})

# Method 1: Direct installation with config URL
.\\UltriumRMMAgent.exe -ConfigUrl "${configUrl}" -Install

# Method 2: Installation with config file
# 1. Download config: ultrium-config-${client.client_code}.json
# 2. Run: .\\UltriumRMMAgent.exe -ConfigFile "ultrium-config-${client.client_code}.json" -Install

# Method 3: Command line parameters
.\\UltriumRMMAgent.exe -ConnectorKey "${client.connector_key}" -ClientCode "${client.client_code}" -Install

# MSI Installation (silent)
msiexec /i UltriumRMMAgent.msi /quiet CONNECTOR_KEY="${client.connector_key}" CLIENT_CODE="${client.client_code}"

# Generated: ${new Date().toISOString()}
# Contact: ${client.contact_email}`;

      const blob = new Blob([command], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Install-${client.client_code}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Installation Guide Downloaded",
        description: `Universal installation commands for ${client.client_name} downloaded.`
      });
      return;
    }

    // Original PowerShell script approach
    const scriptContent = `# Ultrium RMM Agent - Client: ${client.client_name}
# Auto-configured for client: ${client.client_code}

param(
    [string]$ConnectorKey = "${client.connector_key}",
    [string]$ClientCode = "${client.client_code}",
    [string]$ClientName = "${client.client_name}",
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Service
)

# This script is pre-configured for ${client.client_name}
# Contact: ${client.contact_email}
# Generated: ${new Date().toISOString()}

Write-Host "Ultrium RMM Agent for ${client.client_name}" -ForegroundColor Green
Write-Host "Client Code: ${client.client_code}" -ForegroundColor Cyan
Write-Host "Connector Key: ${client.connector_key}" -ForegroundColor Yellow

# Download the full PowerShell agent from your domain
$AgentUrl = "${window.location.origin}/UltriumRMMAgent.ps1"
$TempScript = "$env:TEMP\\UltriumRMMAgent.ps1"

try {
    Write-Host "Downloading RMM agent..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $AgentUrl -OutFile $TempScript -UseBasicParsing
    
    if (Test-Path $TempScript) {
        Write-Host "Executing RMM agent with client configuration..." -ForegroundColor Green
        
        # Execute with client-specific parameters
        & $TempScript -ConnectorKey $ConnectorKey -ClientCode $ClientCode -DeviceName "$env:COMPUTERNAME-$ClientCode" @args
    } else {
        Write-Error "Failed to download RMM agent"
    }
} catch {
    Write-Error "Error: $($_.Exception.Message)"
} finally {
    # Clean up
    if (Test-Path $TempScript) {
        Remove-Item $TempScript -Force -ErrorAction SilentlyContinue
    }
}`;

    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `UltriumRMM-${client.client_code}.ps1`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Agent Downloaded",
      description: `RMM agent for ${client.client_name} has been downloaded.`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MSP Client Management</h2>
          <p className="text-muted-foreground">Manage your clients and distribute RMM agents with data isolation</p>
        </div>
        <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new client with isolated data and dedicated connector key.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  value={newClient.client_name}
                  onChange={(e) => {
                    setNewClient(prev => ({
                      ...prev,
                      client_name: e.target.value,
                      client_code: generateClientCode(e.target.value)
                    }));
                  }}
                  placeholder="e.g., Acme Corporation"
                />
              </div>
              <div>
                <Label htmlFor="client_code">Client Code</Label>
                <Input
                  id="client_code"
                  value={newClient.client_code}
                  onChange={(e) => setNewClient(prev => ({ ...prev, client_code: e.target.value.toUpperCase() }))}
                  placeholder="Auto-generated"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Unique identifier for the client (auto-generated from name)
                </p>
              </div>
              <div>
                <Label htmlFor="contact_email">Contact Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={newClient.contact_email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="admin@client.com"
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={newClient.contact_phone}
                  onChange={(e) => setNewClient(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="+1-555-0123"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddClient} disabled={isLoading} className="flex-1">
                  {isLoading ? 'Adding...' : 'Add Client'}
                </Button>
                <Button variant="outline" onClick={() => setIsAddingClient(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              {clients.filter(c => c.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.reduce((sum, client) => sum + (client.device_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connectors</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Client connectors
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Directory</CardTitle>
          <CardDescription>
            Manage your MSP clients and their isolated RMM environments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Devices</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Connector Key</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.client_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{client.client_code}</Badge>
                  </TableCell>
                  <TableCell>{client.contact_email}</TableCell>
                  <TableCell>{client.device_count || 0}</TableCell>
                  <TableCell>
                    <Badge variant={client.is_active ? 'default' : 'secondary'}>
                      {client.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[120px]">{client.connector_key}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(client.connector_key, 'Connector key')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => downloadClientAgent(client, 'powershell')}>
                            PowerShell Script
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadClientAgent(client, 'config')}>
                            Config File
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadClientAgent(client, 'universal')}>
                            Installation Guide
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {clients.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No clients added yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your first client to start managing isolated RMM environments
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};