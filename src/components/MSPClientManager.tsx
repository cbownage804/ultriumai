import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertCircle, Building2, Plus, Settings, TrendingUp, Download, Terminal, FileCode } from 'lucide-react';
import { useSafeWebData } from '@/hooks/useSafeWebData';
import { useAccountType } from '@/hooks/useAccountType';
import { toast } from 'sonner';

export const MSPClientManager = () => {
  const { mspClients, loading, addMspClient, fetchMspClients } = useSafeWebData();
  const { isMSPOrMSSP, loading: accountLoading } = useAccountType();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    domain: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    billing_email: '',
    subscription_plan: 'basic',
    monthly_price: '',
    max_assets: ''
  });

  // Security check - redirect or show error if user is not MSP/MSSP
  if (accountLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isMSPOrMSSP) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Access Denied</CardTitle>
          <CardDescription>
            This feature is only available for MSP and MSSP accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            To access MSP client management features, please upgrade your account to an MSP or MSSP plan.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.contact_name || !formData.contact_email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const result = await addMspClient({
      ...formData,
      monthly_price: formData.monthly_price ? parseFloat(formData.monthly_price) : undefined,
      max_assets: formData.max_assets ? parseInt(formData.max_assets) : undefined,
    });

    if (result.success) {
      toast.success('MSP client created successfully');
      setIsDialogOpen(false);
      setFormData({
        company_name: '',
        domain: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        billing_email: '',
        subscription_plan: 'basic',
        monthly_price: '',
        max_assets: ''
      });
      await fetchMspClients();
    } else {
      toast.error('Failed to create MSP client');
    }
  };

  const handleInteractiveDownload = (client: any) => {
    const instructions = `# Interactive Installer Instructions for ${client.company_name}

## Step 1: Download Universal Installer
Download: https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/rmm-installers/UltriumRMMAgent.exe

## Step 2: Run Interactive Setup
1. Right-click installer → "Run as Administrator"
2. Select "Interactive Setup"
3. When prompted, enter:
   - Connector Key: ${client.connector_key || `sk-client-${client.client_code}-generated`}
   - Client Code: ${client.client_code}

## Step 3: Verify Installation
- Service "UltriumRMMAgent" should be running
- Check system tray for Ultrium icon
- Agent will appear in your MSP dashboard within 5 minutes

Contact: ${client.contact_email} if you need assistance.`;

    // Create and download instructions file
    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${client.company_name.replace(/[^a-zA-Z0-9]/g, '')}-Interactive-Install.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Interactive installer instructions downloaded for ${client.company_name}`);
  };

  const handleSilentDownload = (client: any) => {
    const powershellScript = `# Silent Deployment Script for ${client.company_name}
# Generated on ${new Date().toISOString()}

param(
    [string]$LogPath = "C:\\temp\\ultrium-install.log"
)

$ErrorActionPreference = "Stop"
$Config = @{
    ConnectorKey = "${client.connector_key || `sk-client-${client.client_code}-generated`}"
    ClientCode = "${client.client_code}"
    ClientName = "${client.company_name}"
    MSPName = "Your MSP"
    ApiUrl = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1"
    Silent = $true
    InstallPath = "C:\\Program Files\\Ultrium RMM"
    ServiceName = "UltriumRMMAgent"
    LogLevel = "Info"
}

try {
    Write-Host "Starting Ultrium RMM Agent deployment for $($Config.ClientName)..." -ForegroundColor Green
    
    # Download universal installer
    $InstallerUrl = "https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/rmm-installers/UltriumRMMAgent.exe"
    $InstallerPath = "$env:TEMP\\UltriumRMMAgent.exe"
    
    Write-Host "Downloading installer..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $InstallerUrl -OutFile $InstallerPath
    
    # Create config file for silent install
    $ConfigPath = "$env:TEMP\\ultrium-config.json"
    $Config | ConvertTo-Json -Depth 3 | Out-File -FilePath $ConfigPath -Encoding UTF8
    
    # Run silent installation
    Write-Host "Installing agent..." -ForegroundColor Yellow
    $Process = Start-Process -FilePath $InstallerPath -ArgumentList @(
        "-Silent"
        "-ConfigFile", $ConfigPath
        "-LogFile", $LogPath
    ) -Wait -PassThru
    
    if ($Process.ExitCode -eq 0) {
        Write-Host "✅ Installation completed successfully!" -ForegroundColor Green
        Write-Host "📊 Agent is now reporting to your MSP" -ForegroundColor Cyan
        
        # Verify service is running
        Start-Sleep -Seconds 5
        $Service = Get-Service -Name $Config.ServiceName -ErrorAction SilentlyContinue
        if ($Service -and $Service.Status -eq "Running") {
            Write-Host "✅ Service is running and connected" -ForegroundColor Green
        } else {
            Write-Warning "⚠️ Service not running yet - may take a few minutes to start"
        }
    } else {
        throw "Installation failed with exit code: $($Process.ExitCode)"
    }
    
} catch {
    Write-Error "❌ Installation failed: $_"
    Write-Host "📋 Check log file: $LogPath" -ForegroundColor Yellow
    Write-Host "📧 Contact support: ${client.contact_email}" -ForegroundColor Yellow
    exit 1
}

# Cleanup
Remove-Item $InstallerPath -Force -ErrorAction SilentlyContinue
Remove-Item $ConfigPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "🎉 Ultrium RMM Agent deployed successfully!" -ForegroundColor Green
Write-Host "🏢 Client: $($Config.ClientName)" -ForegroundColor Cyan
Write-Host "🔑 Connector: $($Config.ClientCode)" -ForegroundColor Cyan
Write-Host "📊 Agent will appear in MSP dashboard within 5 minutes" -ForegroundColor Yellow`;

    // Create and download PowerShell script
    const blob = new Blob([powershellScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Deploy-UltriumRMM-${client.company_name.replace(/[^a-zA-Z0-9]/g, '')}.ps1`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Silent installer script downloaded for ${client.company_name}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'trial': return 'bg-blue-500 text-white';
      case 'suspended': return 'bg-orange-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-gold-100 text-gold-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <h2 className="text-2xl font-bold tracking-tight">MSP Client Management</h2>
          <p className="text-muted-foreground">Manage your managed service provider clients</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New MSP Client</DialogTitle>
              <DialogDescription>
                Create a new client account for your managed services
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    placeholder="company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name *</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => handleInputChange('contact_name', e.target.value)}
                    placeholder="Enter contact name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contact@company.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_email">Billing Email</Label>
                  <Input
                    id="billing_email"
                    type="email"
                    value={formData.billing_email}
                    onChange={(e) => handleInputChange('billing_email', e.target.value)}
                    placeholder="billing@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subscription_plan">Subscription Plan</Label>
                  <Select 
                    value={formData.subscription_plan} 
                    onValueChange={(value) => handleInputChange('subscription_plan', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic ($299/mo)</SelectItem>
                      <SelectItem value="professional">Professional ($599/mo)</SelectItem>
                      <SelectItem value="enterprise">Enterprise ($1299/mo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_price">Monthly Price ($)</Label>
                  <Input
                    id="monthly_price"
                    type="number"
                    step="0.01"
                    value={formData.monthly_price}
                    onChange={(e) => handleInputChange('monthly_price', e.target.value)}
                    placeholder="299.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_assets">Max Assets</Label>
                  <Input
                    id="max_assets"
                    type="number"
                    value={formData.max_assets}
                    onChange={(e) => handleInputChange('max_assets', e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Client</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mspClients.length}</div>
            <p className="text-xs text-muted-foreground">
              Active managed accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${mspClients.reduce((sum, client) => sum + client.monthly_price, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total recurring revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Threats</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {mspClients.reduce((sum, client) => sum + (client.threat_stats?.critical_threats || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all clients
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Accounts</CardTitle>
          <CardDescription>Manage your MSP client accounts and their subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {mspClients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Monthly Fee</TableHead>
                  <TableHead>Threats</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mspClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.company_name}</p>
                        {client.domain && (
                          <p className="text-sm text-muted-foreground">{client.domain}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.contact_name}</p>
                        <p className="text-sm text-muted-foreground">{client.contact_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanColor(client.subscription_plan)}>
                        {client.subscription_plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(client.subscription_status)}>
                        {client.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      ${client.monthly_price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {client.threat_stats && (
                        <div className="flex gap-1">
                          {client.threat_stats.critical_threats > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {client.threat_stats.critical_threats} critical
                            </Badge>
                          )}
                          {client.threat_stats.total_threats > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {client.threat_stats.total_threats} total
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                              <Download className="h-4 w-4" />
                              Download Agent
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleInteractiveDownload(client)}>
                              <Terminal className="h-4 w-4 mr-2" />
                              Interactive Installer
                              <span className="ml-auto text-xs text-muted-foreground">User types key</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSilentDownload(client)}>
                              <FileCode className="h-4 w-4 mr-2" />
                              Silent Installer
                              <span className="ml-auto text-xs text-muted-foreground">PowerShell script</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No MSP clients yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first managed service client
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Client
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
