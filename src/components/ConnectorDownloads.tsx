import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Terminal, FileCode, Download, Shield, Building2, User } from 'lucide-react';
import { toast } from 'sonner';

export const ConnectorDownloads = () => {
  // Mock organization data - in a real app this would come from user context
  const organizationData = {
    company_name: "Your Organization",
    client_code: "ORG001",
    connector_key: "sk-client-ORG001-business-key",
    contact_email: "admin@yourorg.com"
  };

  const handleInteractiveDownload = () => {
    const instructions = `# Interactive Installer Instructions for ${organizationData.company_name}

## Step 1: Download Universal Installer
Download: https://releases.ultriumai.com/UltriumRMMAgent.exe

## Step 2: Run Interactive Setup
1. Right-click installer → "Run as Administrator"
2. Select "Interactive Setup"
3. When prompted, enter:
   - Connector Key: ${organizationData.connector_key}
   - Client Code: ${organizationData.client_code}

## Step 3: Verify Installation
- Service "UltriumRMMAgent" should be running
- Check system tray for Ultrium icon
- Agent will appear in your SafeNet dashboard within 5 minutes

## Support
Contact: ${organizationData.contact_email} if you need assistance.

## What this installer does:
✅ Installs SafeNet monitoring agent
✅ Configures secure connection to your dashboard
✅ Enables real-time threat detection
✅ Sets up automated security scanning
✅ Provides remote access capabilities (if enabled)`;

    // Create and download instructions file
    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${organizationData.company_name.replace(/[^a-zA-Z0-9]/g, '')}-Interactive-Install.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Interactive installer instructions downloaded');
  };

  const handleSilentDownload = () => {
    const powershellScript = `# Silent Deployment Script for ${organizationData.company_name}
# Generated on ${new Date().toISOString()}

param(
    [string]$LogPath = "C:\\temp\\ultrium-install.log"
)

$ErrorActionPreference = "Stop"
$Config = @{
    ConnectorKey = "${organizationData.connector_key}"
    ClientCode = "${organizationData.client_code}"
    ClientName = "${organizationData.company_name}"
    ApiUrl = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1"
    Silent = $true
    InstallPath = "C:\\Program Files\\Ultrium RMM"
    ServiceName = "UltriumRMMAgent"
    LogLevel = "Info"
}

try {
    Write-Host "Starting Ultrium SafeNet Agent deployment for $($Config.ClientName)..." -ForegroundColor Green
    
    # Download universal installer
    $InstallerUrl = "https://releases.ultriumai.com/UltriumRMMAgent.exe"
    $InstallerPath = "$env:TEMP\\UltriumRMMAgent.exe"
    
    Write-Host "Downloading installer..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $InstallerUrl -OutFile $InstallerPath
    
    # Create config file for silent install
    $ConfigPath = "$env:TEMP\\ultrium-config.json"
    $Config | ConvertTo-Json -Depth 3 | Out-File -FilePath $ConfigPath -Encoding UTF8
    
    # Run silent installation
    Write-Host "Installing SafeNet agent..." -ForegroundColor Yellow
    $Process = Start-Process -FilePath $InstallerPath -ArgumentList @(
        "-Silent"
        "-ConfigFile", $ConfigPath
        "-LogFile", $LogPath
    ) -Wait -PassThru
    
    if ($Process.ExitCode -eq 0) {
        Write-Host "✅ Installation completed successfully!" -ForegroundColor Green
        Write-Host "🛡️ SafeNet protection is now active" -ForegroundColor Cyan
        
        # Verify service is running
        Start-Sleep -Seconds 5
        $Service = Get-Service -Name $Config.ServiceName -ErrorAction SilentlyContinue
        if ($Service -and $Service.Status -eq "Running") {
            Write-Host "✅ Service is running and connected" -ForegroundColor Green
        } else {
            Write-Warning "⚠️ Service not running yet - may take a few minutes to start"
        }
        
        # Display next steps
        Write-Host ""
        Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Open your SafeNet dashboard to verify connection" -ForegroundColor White
        Write-Host "2. Review security settings and configure alerts" -ForegroundColor White
        Write-Host "3. Run initial security scan to establish baseline" -ForegroundColor White
        
    } else {
        throw "Installation failed with exit code: $($Process.ExitCode)"
    }
    
} catch {
    Write-Error "❌ Installation failed: $_"
    Write-Host "📋 Check log file: $LogPath" -ForegroundColor Yellow
    Write-Host "📧 Contact support: ${organizationData.contact_email}" -ForegroundColor Yellow
    exit 1
}

# Cleanup
Remove-Item $InstallerPath -Force -ErrorAction SilentlyContinue
Remove-Item $ConfigPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "🎉 Ultrium SafeNet Agent deployed successfully!" -ForegroundColor Green
Write-Host "🏢 Organization: $($Config.ClientName)" -ForegroundColor Cyan
Write-Host "🔑 Connector: $($Config.ClientCode)" -ForegroundColor Cyan
Write-Host "📊 Agent will appear in dashboard within 5 minutes" -ForegroundColor Yellow
Write-Host "🛡️ Your network is now protected by SafeNet" -ForegroundColor Green`;

    // Create and download PowerShell script
    const blob = new Blob([powershellScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Deploy-SafeNet-${organizationData.company_name.replace(/[^a-zA-Z0-9]/g, '')}.ps1`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Silent installer script downloaded');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">SafeNet Agent Downloads</h2>
        <p className="text-muted-foreground mt-2">
          Deploy the SafeNet monitoring agent to your devices and servers
        </p>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Your Organization Details
          </CardTitle>
          <CardDescription>
            This information will be used to configure your SafeNet agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Organization</p>
              <p className="font-medium">{organizationData.company_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Client Code</p>
              <p className="font-mono text-sm">{organizationData.client_code}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Connector Key</p>
              <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                {organizationData.connector_key}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Options */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Interactive Installer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-blue-600" />
              Interactive Installer
            </CardTitle>
            <CardDescription>
              Best for individual machines or small deployments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">How it works:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Download universal installer</li>
                <li>• Run with admin privileges</li>
                <li>• Enter connector key when prompted</li>
                <li>• Agent configures automatically</li>
              </ul>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                User-friendly
              </Badge>
              <Badge variant="outline" className="text-xs">
                Perfect for IT staff
              </Badge>
            </div>

            <Button 
              onClick={handleInteractiveDownload}
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Instructions
            </Button>
          </CardContent>
        </Card>

        {/* Silent Installer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-purple-600" />
              Silent Installer
            </CardTitle>
            <CardDescription>
              Perfect for enterprise deployments and automation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">How it works:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Pre-configured PowerShell script</li>
                <li>• Zero user interaction required</li>
                <li>• Deploy via GPO or SCCM</li>
                <li>• Automatic verification</li>
              </ul>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                Enterprise-ready
              </Badge>
              <Badge variant="outline" className="text-xs">
                Zero-touch deployment
              </Badge>
            </div>

            <Button 
              onClick={handleSilentDownload}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Script
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Features Card */}
      <Card>
        <CardHeader>
          <CardTitle>SafeNet Agent Features</CardTitle>
          <CardDescription>
            What you get when you deploy the SafeNet monitoring agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">🛡️ Real-time Protection</h4>
              <p className="text-sm text-muted-foreground">
                Continuous monitoring and threat detection
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">📊 System Monitoring</h4>
              <p className="text-sm text-muted-foreground">
                Performance metrics and health monitoring
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-purple-600">🔒 Security Scanning</h4>
              <p className="text-sm text-muted-foreground">
                Automated vulnerability assessments
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-orange-600">📱 Remote Access</h4>
              <p className="text-sm text-muted-foreground">
                Secure remote management capabilities
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-red-600">⚡ Instant Alerts</h4>
              <p className="text-sm text-muted-foreground">
                Immediate notifications for critical issues
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-cyan-600">🔄 Auto Updates</h4>
              <p className="text-sm text-muted-foreground">
                Automatic agent updates and patches
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};