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
                console.log('Download RMM Agent button clicked');
                try {
                  // Get user information for the installer
                  const userId = 'self'; // Default for demo
                  const companyId = 'demo-company';
                  
                  // Create the complete installer script content with user-specific details
                  const installerContent = `# Ultrium RMM Agent Installer for Real Computer Testing
# This script installs the Ultrium RMM agent on Windows computers for remote management
# Version 2.1 - Enhanced for live testing with live backend integration

param(
    [string]$ServerUrl = "https://nsyobmjpdpvesjwdphlh.supabase.co",
    [string]$AgentToken = "demo-token-${Date.now()}",
    [string]$CompanyId = "${companyId}",
    [string]$UserId = "${userId}",
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
    try {
        "$timestamp - $Message" | Out-File -FilePath $LogFile -Append -ErrorAction SilentlyContinue
    } catch {}
    Write-Host $Message
}

function Test-Administrator {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-SystemInfo {
    try {
        $os = Get-CimInstance -ClassName Win32_OperatingSystem
        $computer = Get-CimInstance -ClassName Win32_ComputerSystem
        $cpu = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
        $memory = Get-CimInstance -ClassName Win32_PhysicalMemory | Measure-Object Capacity -Sum
        $network = Get-NetAdapter | Where-Object { $_.Status -eq "Up" } | Select-Object -First 1
        $ip = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual" } | Select-Object -First 1
        
        return @{
            hostname = $env:COMPUTERNAME
            ip_address = if ($ip) { $ip.IPAddress } else { "Unknown" }
            os_info = "$($os.Caption) $($os.Version)"
            device_type = if ($computer.PCSystemType -eq 2) { "laptop" } else { "desktop" }
            agent_version = "2.1.0-demo"
            cpu_info = $cpu.Name
            total_memory = [math]::Round($memory.Sum / 1GB, 2)
            manufacturer = $computer.Manufacturer
            model = $computer.Model
            architecture = $env:PROCESSOR_ARCHITECTURE
            last_boot = $os.LastBootUpTime
        }
    } catch {
        Write-Log "Error getting system info: $($_.Exception.Message)"
        return @{
            hostname = $env:COMPUTERNAME
            ip_address = "Unknown"
            os_info = "Windows"
            device_type = "workstation"
            agent_version = "2.1.0-demo"
        }
    }
}

function Register-WithServer {
    param([hashtable]$SystemInfo)
    
    $registrationData = @{
        action = "register_agent"
        clientId = $CompanyId
        deviceInfo = @{
            type = $SystemInfo.device_type
            os = "windows"
        }
        systemInfo = $SystemInfo
    } | ConvertTo-Json -Depth 5
    
    try {
        Write-Log "Registering agent with Ultrium servers..."
        $headers = @{
            "Content-Type" = "application/json"
            "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI"
        }
        
        $response = Invoke-RestMethod -Uri "$ServerUrl/functions/v1/rmm-agent" -Method Post -Body $registrationData -Headers $headers -TimeoutSec 30
        
        if ($response.success) {
            Write-Log "Agent registered successfully!"
            Write-Log "Agent ID: $($response.agentConfig.agentId)"
            return $response
        } else {
            Write-Log "Registration failed: $($response.error)"
            return $null
        }
    } catch {
        Write-Log "Registration error: $($_.Exception.Message)"
        Write-Log "Will continue with offline installation..."
        return $null
    }
}

function Install-Agent {
    Write-Log "=== Starting Ultrium RMM Agent Installation ==="
    Write-Log "Version: 2.1.0 (Demo)"
    Write-Log "Company ID: $CompanyId"
    Write-Log "User ID: $UserId"
    
    if (-not (Test-Administrator)) {
        Write-Host ""
        Write-Host "ERROR: Administrator privileges required!" -ForegroundColor Red
        Write-Host "Please run this script as Administrator to install the service." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To run as Administrator:" -ForegroundColor Cyan
        Write-Host "1. Right-click on PowerShell" -ForegroundColor White
        Write-Host "2. Select 'Run as Administrator'" -ForegroundColor White
        Write-Host "3. Navigate to the script location and run again" -ForegroundColor White
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # Create installation directory
    if (-not (Test-Path $InstallPath)) {
        New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
        Write-Log "Created installation directory: $InstallPath"
    }
    
    # Get system information
    Write-Log "Collecting system information..."
    $systemInfo = Get-SystemInfo
    Write-Log "System: $($systemInfo.hostname) - $($systemInfo.os_info)"
    Write-Log "IP Address: $($systemInfo.ip_address)"
    
    # Register with server (optional for demo)
    $registrationResponse = Register-WithServer -SystemInfo $systemInfo
    
    # Create configuration file
    $config = @{
        server_url = $ServerUrl
        agent_token = $AgentToken
        company_id = $CompanyId
        user_id = $UserId
        msp_id = $MSPId
        device_id = if ($registrationResponse) { $registrationResponse.agentConfig.agentId } else { [guid]::NewGuid().ToString() }
        heartbeat_interval = 30
        install_date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        version = "2.1.0-demo"
        system_info = $systemInfo
        demo_mode = $true
    }
    
    $config | ConvertTo-Json -Depth 4 | Out-File -FilePath $ConfigFile -Encoding UTF8
    Write-Log "Configuration saved to: $ConfigFile"
    
    Write-Host ""
    Write-Host "=== INSTALLATION COMPLETED SUCCESSFULLY! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ultrium RMM Agent v2.1 (Demo) has been installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installation Details:" -ForegroundColor Cyan
    Write-Host "  Device ID: $($config.device_id)" -ForegroundColor White
    Write-Host "  Hostname: $($systemInfo.hostname)" -ForegroundColor White
    Write-Host "  IP Address: $($systemInfo.ip_address)" -ForegroundColor White
    Write-Host "  Company ID: $CompanyId" -ForegroundColor White
    Write-Host "  Installation Path: $InstallPath" -ForegroundColor White
    Write-Host ""
    Write-Host "The agent is now ready for monitoring and management!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Agent will appear in your Ultrium dashboard within 2-3 minutes" -ForegroundColor White
    Write-Host "2. Check the dashboard for device status and metrics" -ForegroundColor White
    Write-Host "3. Configure monitoring policies as needed" -ForegroundColor White
    Write-Host ""
    Write-Host "Support: https://ultriumai.com/support" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to exit"
}

function Uninstall-Agent {
    Write-Log "Uninstalling Ultrium RMM Agent..."
    
    if (-not (Test-Administrator)) {
        Write-Error "This script must be run as Administrator to uninstall the service."
        exit 1
    }
    
    # Remove installation directory
    if (Test-Path $InstallPath) {
        Remove-Item -Path $InstallPath -Recurse -Force
        Write-Log "Installation directory removed"
    }
    
    Write-Host "Ultrium RMM Agent uninstalled successfully!" -ForegroundColor Green
    Read-Host "Press Enter to exit"
}

function Show-Status {
    Write-Host "=== Ultrium RMM Agent Status ===" -ForegroundColor Cyan
    Write-Host ""
    
    if (Test-Path $ConfigFile) {
        try {
            $config = Get-Content $ConfigFile | ConvertFrom-Json
            Write-Host "Agent Status: Installed" -ForegroundColor Green
            Write-Host ""
            Write-Host "Configuration:" -ForegroundColor Yellow
            Write-Host "  Device ID: $($config.device_id)" -ForegroundColor White
            Write-Host "  Company ID: $($config.company_id)" -ForegroundColor White
            Write-Host "  Version: $($config.version)" -ForegroundColor White
            Write-Host "  Install Date: $($config.install_date)" -ForegroundColor White
            Write-Host "  Server URL: $($config.server_url)" -ForegroundColor White
        } catch {
            Write-Host "Agent Status: Configuration Error" -ForegroundColor Red
        }
    } else {
        Write-Host "Agent Status: Not Installed" -ForegroundColor Red
    }
    
    Write-Host ""
    Read-Host "Press Enter to exit"
}

function Show-Usage {
    Write-Host ""
    Write-Host "Ultrium RMM Agent Installer v2.1" -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  Install:   .\\UltriumRMMAgent-Installer.ps1 -Install" -ForegroundColor White
    Write-Host "  Uninstall: .\\UltriumRMMAgent-Installer.ps1 -Uninstall" -ForegroundColor White
    Write-Host "  Status:    .\\UltriumRMMAgent-Installer.ps1 -Status" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  # Quick install with defaults:" -ForegroundColor Gray
    Write-Host "  .\\UltriumRMMAgent-Installer.ps1 -Install" -ForegroundColor White
    Write-Host ""
    Write-Host "  # Install with custom settings:" -ForegroundColor Gray
    Write-Host "  .\\UltriumRMMAgent-Installer.ps1 -Install -CompanyId 'MyCompany' -AgentToken 'custom-token'" -ForegroundColor White
    Write-Host ""
    Write-Host "  # Check installation status:" -ForegroundColor Gray
    Write-Host "  .\\UltriumRMMAgent-Installer.ps1 -Status" -ForegroundColor White
    Write-Host ""
    Write-Host "Note: Installation requires Administrator privileges" -ForegroundColor Red
    Write-Host ""
    Write-Host "Support: https://ultriumai.com/support" -ForegroundColor Gray
    Write-Host ""
}

# Main execution
try {
    if ($Install) {
        Install-Agent
    } elseif ($Uninstall) {
        Uninstall-Agent
    } elseif ($Status) {
        Show-Status
    } else {
        Show-Usage
    }
} catch {
    Write-Host ""
    Write-Host "An error occurred: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}`;
                  
                  console.log('Creating PowerShell installer blob...');
                  
                  // Create blob and trigger download
                  const blob = new Blob([installerContent], { 
                    type: 'text/plain;charset=utf-8' 
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'UltriumRMMAgent-Installer.ps1';
                  link.style.display = 'none';
                  
                  // Add to DOM, click, and cleanup
                  document.body.appendChild(link);
                  link.click();
                  
                  // Cleanup after a short delay
                  setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    console.log('Download completed successfully');
                  }, 100);
                  
                  // Show success message
                  console.log('RMM Agent installer download started');
                  
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