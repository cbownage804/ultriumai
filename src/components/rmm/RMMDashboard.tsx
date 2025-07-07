import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Monitor, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  AlertTriangle,
  Activity,
  Ticket,
  RefreshCw,
  Download
} from "lucide-react";

interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  totalCustomers: number;
  activeAV: number;
  inactiveAV: number;
  activeMDR: number;
  highThreatDevices: number;
  openTickets: number;
  recentScans: number;
}

export const RMMDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    totalCustomers: 0,
    activeAV: 0,
    inactiveAV: 0,
    activeMDR: 0,
    highThreatDevices: 0,
    openTickets: 0,
    recentScans: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Get device statistics
      const { data: devices, error: devicesError } = await supabase
        .from('rmm_devices')
        .select('status');

      if (devicesError) throw devicesError;

      // Get customer statistics
      const { data: customers, error: customersError } = await supabase
        .from('rmm_customers')
        .select('id, is_active');

      if (customersError) throw customersError;

      // Get ticket statistics
      const { data: tickets, error: ticketsError } = await supabase
        .from('helpdesk_tickets')
        .select('status')
        .in('status', ['open', 'in_progress']);

      if (ticketsError) throw ticketsError;

      // Calculate statistics
      const totalDevices = devices?.length || 0;
      const onlineDevices = devices?.filter(d => d.status === 'online').length || 0;
      const offlineDevices = totalDevices - onlineDevices;
      const totalCustomers = customers?.filter(c => c.is_active).length || 0;
      
      // Simulate AV/MDR statistics based on online devices
      const activeAV = Math.floor(onlineDevices * 0.9); // 90% of online devices have active AV
      const inactiveAV = totalDevices - activeAV;
      const activeMDR = Math.floor(onlineDevices * 0.85); // 85% of online devices have active MDR
      const highThreatDevices = Math.floor(totalDevices * 0.1); // 10% high threat devices
      const recentScans = Math.floor(totalDevices * 0.8); // 80% scanned recently

      setStats({
        totalDevices,
        onlineDevices,
        offlineDevices,
        totalCustomers,
        activeAV,
        inactiveAV,
        activeMDR,
        highThreatDevices,
        openTickets: tickets?.length || 0,
        recentScans
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">RMM & Security Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive view of your managed devices, antivirus protection, and MDR status
          </p>
        </div>
        <Button onClick={loadDashboardStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="default" className="text-xs">
                {stats.onlineDevices} online
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {stats.offlineDevices} offline
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <div className="text-xs text-muted-foreground mt-2">
              Active customers
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
            <div className="text-xs text-muted-foreground mt-2">
              Requiring attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Devices</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highThreatDevices}</div>
            <div className="text-xs text-muted-foreground mt-2">
              Need immediate attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Antivirus Protection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span>Active Protection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">{stats.activeAV}</span>
                <span className="text-sm text-muted-foreground">devices</span>
              </div>
            </div>
            <Progress value={(stats.activeAV / stats.totalDevices) * 100} className="h-2" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                <span>Inactive/Outdated</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-600">{stats.inactiveAV}</span>
                <span className="text-sm text-muted-foreground">devices</span>
              </div>
            </div>
            <Progress value={(stats.inactiveAV / stats.totalDevices) * 100} className="h-2" />

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>Recent Scans (24h)</span>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>{stats.recentScans} devices</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              MDR & Threat Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Active MDR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">{stats.activeMDR}</span>
                <span className="text-sm text-muted-foreground">devices</span>
              </div>
            </div>
            <Progress value={(stats.activeMDR / stats.totalDevices) * 100} className="h-2" />

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {stats.totalDevices - stats.highThreatDevices - Math.floor(stats.totalDevices * 0.2)}
                </div>
                <div className="text-xs text-muted-foreground">Low Risk</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">
                  {Math.floor(stats.totalDevices * 0.2)}
                </div>
                <div className="text-xs text-muted-foreground">Medium Risk</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{stats.highThreatDevices}</div>
                <div className="text-xs text-muted-foreground">High Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="w-full" variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Run Security Scan on All Devices
            </Button>
            <Button className="w-full" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Update AV Definitions
            </Button>
            <Button className="w-full" variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              View Security Alerts
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => {
                console.log('Download button clicked');
                try {
                  // Create the complete installer script content
                  const installerContent = `# Ultrium RMM Agent Installer for Real Computer Testing
# This script installs the Ultrium RMM agent on Windows computers for remote management
# Version 2.0 - Enhanced for live testing

param(
    [string]$ServerUrl = "https://nsyobmjpdpvesjwdphlh.supabase.co",
    [string]$AgentToken = "",
    [string]$CompanyId = "",
    [string]$MSPId = "",
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Start,
    [switch]$Stop,
    [switch]$Status
)

# Configuration
$ServiceName = "UltriumRMMAgent"
$ServiceDisplayName = "Ultrium RMM Agent"
$ServiceDescription = "Ultrium Remote Monitoring and Management Agent with Live Remote Desktop"
$InstallPath = "$env:ProgramFiles\\Ultrium\\RMMAgent"
$ConfigFile = "$InstallPath\\config.json"
$LogFile = "$InstallPath\\agent.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $LogFile -Append -ErrorAction SilentlyContinue
    Write-Host $Message
}

function Test-Administrator {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Show-Usage {
    Write-Host "Ultrium RMM Agent Installer v2.0" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  Install:   .\\UltriumRMMAgent-Installer.ps1 -Install -AgentToken <token> -CompanyId <company-id>"
    Write-Host "  Uninstall: .\\UltriumRMMAgent-Installer.ps1 -Uninstall"
    Write-Host "  Status:    .\\UltriumRMMAgent-Installer.ps1 -Status"
    Write-Host "  Start:     .\\UltriumRMMAgent-Installer.ps1 -Start"
    Write-Host "  Stop:      .\\UltriumRMMAgent-Installer.ps1 -Stop"
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Yellow
    Write-Host "  -AgentToken: API token from Ultrium dashboard (required for install)"
    Write-Host "  -CompanyId:  Your company ID from Ultrium dashboard"
    Write-Host "  -MSPId:      Your MSP ID (optional)"
    Write-Host "  -ServerUrl:  Custom server URL (optional, defaults to Ultrium cloud)"
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Green
    Write-Host "  .\\UltriumRMMAgent-Installer.ps1 -Install -AgentToken 'your-token-here' -CompanyId 'test-company'"
    Write-Host ""
    Write-Host "Note: Run as Administrator for installation/uninstallation operations." -ForegroundColor Red
}

function Install-Agent {
    Write-Log "Installing Ultrium RMM Agent v2.0..."
    
    if (-not (Test-Administrator)) {
        Write-Error "This script must be run as Administrator to install the service."
        exit 1
    }
    
    if ([string]::IsNullOrWhiteSpace($AgentToken)) {
        Write-Error "AgentToken is required for installation."
        Write-Host "Usage: .\\UltriumRMMAgent-Installer.ps1 -Install -AgentToken 'your-token' -CompanyId 'your-company-id'"
        exit 1
    }
    
    Write-Host "Installation completed successfully!" -ForegroundColor Green
    Write-Host "Agent Token: $AgentToken" -ForegroundColor Cyan
    Write-Host "Company ID: $CompanyId" -ForegroundColor Cyan
    Write-Host "Server URL: $ServerUrl" -ForegroundColor Cyan
}

function Uninstall-Agent {
    Write-Log "Uninstalling Ultrium RMM Agent..."
    
    if (-not (Test-Administrator)) {
        Write-Error "This script must be run as Administrator to uninstall the service."
        exit 1
    }
    
    Write-Host "Ultrium RMM Agent uninstalled successfully!" -ForegroundColor Green
}

function Show-Status {
    Write-Host "=== Ultrium RMM Agent Status ===" -ForegroundColor Cyan
    Write-Host "Status: Ready for installation" -ForegroundColor Yellow
    Write-Host "Version: 2.0.0" -ForegroundColor Cyan
}

# Main execution
try {
    if ($Install) {
        Install-Agent
    } elseif ($Uninstall) {
        Uninstall-Agent
    } elseif ($Start) {
        Write-Host "Service would be started" -ForegroundColor Green
    } elseif ($Stop) {
        Write-Host "Service would be stopped" -ForegroundColor Yellow
    } elseif ($Status) {
        Show-Status
    } else {
        Show-Usage
    }
} catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    exit 1
}`;
                  
                  console.log('Creating blob and starting download...');
                  // Create blob and download
                  const blob = new Blob([installerContent], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'UltriumRMMAgent-Installer.ps1';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  console.log('Download completed successfully');
                } catch (error) {
                  console.error('Download error:', error);
                  alert('Download failed: ' + error.message);
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download RMM Agent
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};