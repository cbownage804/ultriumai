#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Ultrium SafeNet RMM Agent Installer and Service
.DESCRIPTION
    Installs and configures the SafeNet RMM monitoring agent
.PARAMETER ConnectorKey
    The SafeNet connector key for this organization
.PARAMETER ClientCode
    The client code for this organization
.PARAMETER ClientName
    The organization name
.PARAMETER Silent
    Run in silent mode without user interaction
.PARAMETER ConfigFile
    Path to JSON configuration file
.PARAMETER LogFile
    Path to log file
.PARAMETER Uninstall
    Uninstall the SafeNet agent
#>

param(
    [string]$ConnectorKey,
    [string]$ClientCode,
    [string]$ClientName,
    [switch]$Silent,
    [string]$ConfigFile,
    [string]$LogFile = "C:\temp\safenet-install.log",
    [switch]$Uninstall
)

# Global Configuration
$Global:Config = @{
    ServiceName = "UltriumSafeNetAgent"
    ServiceDisplayName = "Ultrium SafeNet Monitoring Agent"
    ServiceDescription = "SafeNet RMM monitoring and security agent"
    InstallPath = "C:\Program Files\Ultrium SafeNet"
    ApiUrl = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1"
    LogPath = $LogFile
    Version = "1.0.0"
    CheckinInterval = 300  # 5 minutes
    ScanInterval = 3600    # 1 hour
}

# Logging Function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    if ($Global:Config.LogPath) {
        try {
            $logDir = Split-Path $Global:Config.LogPath -Parent
            if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
            Add-Content -Path $Global:Config.LogPath -Value $logEntry -Encoding UTF8
        } catch { }
    }
}

# Load Configuration
function Load-Configuration {
    if ($ConfigFile -and (Test-Path $ConfigFile)) {
        try {
            $config = Get-Content $ConfigFile | ConvertFrom-Json
            $Global:Config.ConnectorKey = $config.ConnectorKey
            $Global:Config.ClientCode = $config.ClientCode
            $Global:Config.ClientName = $config.ClientName
            $Global:Config.ApiUrl = $config.ApiUrl
            Write-Log "Configuration loaded from file: $ConfigFile"
        } catch {
            Write-Log "Failed to load configuration file: $_" "ERROR"
            return $false
        }
    } else {
        # Use command line parameters
        $Global:Config.ConnectorKey = $ConnectorKey
        $Global:Config.ClientCode = $ClientCode
        $Global:Config.ClientName = $ClientName
    }
    
    # Interactive mode if missing required parameters
    if (!$Silent -and (!$Global:Config.ConnectorKey -or !$Global:Config.ClientCode)) {
        Write-Host "=== Ultrium SafeNet Agent Setup ===" -ForegroundColor Cyan
        if (!$Global:Config.ConnectorKey) {
            $Global:Config.ConnectorKey = Read-Host "Enter Connector Key"
        }
        if (!$Global:Config.ClientCode) {
            $Global:Config.ClientCode = Read-Host "Enter Client Code"
        }
        if (!$Global:Config.ClientName) {
            $Global:Config.ClientName = Read-Host "Enter Organization Name"
        }
    }
    
    return ($Global:Config.ConnectorKey -and $Global:Config.ClientCode)
}

# Create Service Script
function Create-ServiceScript {
    $serviceScript = @"
#Requires -RunAsAdministrator
# SafeNet RMM Agent Service Script
# This script runs as a Windows service to monitor the system

`$Global:Config = @{
    ConnectorKey = "$($Global:Config.ConnectorKey)"
    ClientCode = "$($Global:Config.ClientCode)"
    ClientName = "$($Global:Config.ClientName)"
    ApiUrl = "$($Global:Config.ApiUrl)"
    CheckinInterval = $($Global:Config.CheckinInterval)
    ScanInterval = $($Global:Config.ScanInterval)
    InstallPath = "$($Global:Config.InstallPath)"
    ServiceName = "$($Global:Config.ServiceName)"
    LogPath = "`$(`$Global:Config.InstallPath)\logs\agent.log"
}

function Write-ServiceLog {
    param([string]`$Message, [string]`$Level = "INFO")
    `$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    `$logEntry = "[`$timestamp] [`$Level] `$Message"
    try {
        `$logDir = Split-Path `$Global:Config.LogPath -Parent
        if (!(Test-Path `$logDir)) { New-Item -ItemType Directory -Path `$logDir -Force | Out-Null }
        Add-Content -Path `$Global:Config.LogPath -Value `$logEntry -Encoding UTF8
    } catch { }
}

function Invoke-SafeNetAPI {
    param([string]`$Endpoint, [hashtable]`$Data, [string]`$Method = "POST")
    try {
        `$uri = "`$(`$Global:Config.ApiUrl)/`$Endpoint"
        `$headers = @{ "Content-Type" = "application/json" }
        `$body = `$Data | ConvertTo-Json -Depth 10
        
        `$response = Invoke-RestMethod -Uri `$uri -Method `$Method -Headers `$headers -Body `$body -TimeoutSec 30
        return `$response
    } catch {
        Write-ServiceLog "API call failed: `$_" "ERROR"
        return `$null
    }
}

function Get-SystemInfo {
    try {
        `$os = Get-CimInstance -ClassName Win32_OperatingSystem
        `$computer = Get-CimInstance -ClassName Win32_ComputerSystem
        `$processor = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
        `$memory = Get-CimInstance -ClassName Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum
        `$disk = Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object { `$_.DriveType -eq 3 }
        
        return @{
            hostname = `$env:COMPUTERNAME
            domain = `$env:USERDOMAIN
            os_name = `$os.Caption
            os_version = `$os.Version
            os_build = `$os.BuildNumber
            manufacturer = `$computer.Manufacturer
            model = `$computer.Model
            processor = `$processor.Name
            memory_gb = [math]::Round(`$memory.Sum / 1GB, 2)
            disk_info = `$disk | ForEach-Object { 
                @{
                    drive = `$_.DeviceID
                    size_gb = [math]::Round(`$_.Size / 1GB, 2)
                    free_gb = [math]::Round(`$_.FreeSpace / 1GB, 2)
                    used_percent = [math]::Round(((`$_.Size - `$_.FreeSpace) / `$_.Size) * 100, 2)
                }
            }
            uptime_hours = [math]::Round((Get-Date) - `$os.LastBootUpTime).TotalHours, 2)
            ip_addresses = (Get-NetIPAddress | Where-Object { `$_.AddressFamily -eq "IPv4" -and `$_.IPAddress -ne "127.0.0.1" }).IPAddress
            last_checkin = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
        }
    } catch {
        Write-ServiceLog "Failed to collect system info: `$_" "ERROR"
        return @{ error = "Failed to collect system info" }
    }
}

function Get-NetworkDevices {
    try {
        `$devices = @()
        `$localIPs = (Get-NetIPAddress | Where-Object { `$_.AddressFamily -eq "IPv4" -and `$_.IPAddress -ne "127.0.0.1" }).IPAddress
        
        foreach (`$ip in `$localIPs) {
            `$network = `$ip.Substring(0, `$ip.LastIndexOf('.'))
            for (`$i = 1; `$i -le 254; `$i++) {
                `$targetIP = "`$network.`$i"
                if (`$targetIP -ne `$ip) {
                    `$ping = Test-Connection -ComputerName `$targetIP -Count 1 -Quiet -TimeoutSeconds 1
                    if (`$ping) {
                        try {
                            `$hostname = [System.Net.Dns]::GetHostByAddress(`$targetIP).HostName
                        } catch {
                            `$hostname = "Unknown"
                        }
                        
                        `$devices += @{
                            ip_address = `$targetIP
                            hostname = `$hostname
                            device_type = "computer"
                            os_family = "unknown"
                            status = "online"
                            risk_level = "low"
                            device_name = `$hostname
                            is_managed = `$false
                            is_critical = `$false
                        }
                    }
                }
            }
            break # Only scan first network for demo
        }
        
        return `$devices
    } catch {
        Write-ServiceLog "Network scan failed: `$_" "ERROR"
        return @()
    }
}

function Send-Checkin {
    `$systemInfo = Get-SystemInfo
    `$checkinData = @{
        connector_key = `$Global:Config.ConnectorKey
        agent_version = "1.0.0"
        system_info = `$systemInfo
        status = "online"
        last_scan = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
        hostname = `$env:COMPUTERNAME
        ip_address = (Get-NetIPAddress | Where-Object { `$_.AddressFamily -eq "IPv4" -and `$_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1).IPAddress
    }
    
    Write-ServiceLog "Sending agent checkin..."
    `$response = Invoke-SafeNetAPI -Endpoint "rmm-agent-checkin" -Data `$checkinData
    if (`$response) {
        Write-ServiceLog "Checkin successful"
    } else {
        Write-ServiceLog "Checkin failed" "ERROR"
    }
}

function Send-NetworkScan {
    Write-ServiceLog "Starting network discovery scan..."
    `$devices = Get-NetworkDevices
    
    `$scanData = @{
        connector_key = `$Global:Config.ConnectorKey
        scan_type = "basic_discovery"
        network_ranges = @("local")
        devices_found = `$devices.Count
        scan_duration = 5
        hostname = `$env:COMPUTERNAME
        results = @{ discovered = `$devices.Count }
        devices = `$devices
    }
    
    Write-ServiceLog "Sending scan data for `$(`$devices.Count) devices..."
    `$response = Invoke-SafeNetAPI -Endpoint "safenet-api/scan-data" -Data `$scanData
    if (`$response) {
        Write-ServiceLog "Network scan data sent successfully"
    } else {
        Write-ServiceLog "Failed to send scan data" "ERROR"
    }
}

# Main Service Loop
function Start-ServiceLoop {
    Write-ServiceLog "SafeNet Agent service starting..."
    Write-ServiceLog "Connector: `$(`$Global:Config.ConnectorKey)"
    Write-ServiceLog "Client: `$(`$Global:Config.ClientCode) - `$(`$Global:Config.ClientName)"
    
    `$lastCheckin = 0
    `$lastScan = 0
    
    while (`$true) {
        try {
            `$currentTime = (Get-Date).Ticks
            
            # Regular checkin
            if ((`$currentTime - `$lastCheckin) / 10000000 -gt `$Global:Config.CheckinInterval) {
                Send-Checkin
                `$lastCheckin = `$currentTime
            }
            
            # Network scan
            if ((`$currentTime - `$lastScan) / 10000000 -gt `$Global:Config.ScanInterval) {
                Send-NetworkScan
                `$lastScan = `$currentTime
            }
            
            Start-Sleep -Seconds 60
            
        } catch {
            Write-ServiceLog "Service loop error: `$_" "ERROR"
            Start-Sleep -Seconds 300  # Wait 5 minutes on error
        }
    }
}

# Service entry point - simplified for NSSM
try {
    # Ensure we can write to the log directory first
    `$logDir = Split-Path `$Global:Config.LogPath -Parent
    if (!(Test-Path `$logDir)) { 
        New-Item -ItemType Directory -Path `$logDir -Force | Out-Null 
    }
    
    Write-ServiceLog "SafeNet Agent starting via NSSM..."
    Write-ServiceLog "Starting main service loop..."
    Start-ServiceLoop
} catch {
    # Try to log the error if possible
    try {
        Write-ServiceLog "Service startup failed: `$_" "ERROR"
    } catch {
        # If we can't log, write to Windows Event Log
        Write-EventLog -LogName Application -Source "SafeNet Agent" -EventId 1000 -EntryType Error -Message "SafeNet Agent startup failed: `$_" -ErrorAction SilentlyContinue
    }
    exit 1
}
"@

    $scriptPath = Join-Path $Global:Config.InstallPath "SafeNet-Agent.ps1"
    try {
        $serviceScript | Out-File -FilePath $scriptPath -Encoding UTF8
        Write-Log "Service script created: $scriptPath"
        return $scriptPath
    } catch {
        Write-Log "Failed to create service script: $_" "ERROR"
        return $null
    }
}

# Install Service using NSSM
function Install-SafeNetService {
    $scriptPath = Create-ServiceScript
    if (!$scriptPath) { return $false }
    
    try {
        # Check if service already exists and remove it first
        $existingService = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
        if ($existingService) {
            Write-Log "Removing existing service..." "WARNING"
            if ($existingService.Status -eq "Running") {
                Stop-Service -Name $Global:Config.ServiceName -Force
            }
            & sc.exe delete $Global:Config.ServiceName | Out-Null
            Start-Sleep -Seconds 3  # Wait for complete removal
        }
        
        # Download NSSM if not present
        $nssmPath = Join-Path $Global:Config.InstallPath "nssm.exe"
        if (-not (Test-Path $nssmPath)) {
            Write-Log "Downloading NSSM..."
            try {
                # Download NSSM 64-bit version
                $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
                $nssmZip = Join-Path $env:TEMP "nssm.zip"
                $nssmExtract = Join-Path $env:TEMP "nssm"
                
                Invoke-WebRequest -Uri $nssmUrl -OutFile $nssmZip -UseBasicParsing
                Expand-Archive -Path $nssmZip -DestinationPath $nssmExtract -Force
                
                # Copy the appropriate architecture version
                $arch = if ([Environment]::Is64BitOperatingSystem) { "win64" } else { "win32" }
                $nssmExePath = Join-Path $nssmExtract "nssm-2.24\$arch\nssm.exe"
                Copy-Item -Path $nssmExePath -Destination $nssmPath
                
                # Cleanup
                Remove-Item -Path $nssmZip -Force -ErrorAction SilentlyContinue
                Remove-Item -Path $nssmExtract -Recurse -Force -ErrorAction SilentlyContinue
                
                Write-Log "NSSM downloaded successfully"
            } catch {
                Write-Log "Failed to download NSSM: $_" "ERROR"
                return $false
            }
        }
        
        $serviceName = $Global:Config.ServiceName
        $displayName = $Global:Config.ServiceDisplayName
        
        Write-Log "Installing service with NSSM: $serviceName"
        
        # Install service using NSSM
        $nssmResult = & $nssmPath install $serviceName "powershell.exe" "-ExecutionPolicy" "Bypass" "-NoProfile" "-File" "`"$scriptPath`""
        if ($LASTEXITCODE -eq 0) {
            Write-Log "NSSM service installed successfully"
            
            # Configure service with NSSM
            & $nssmPath set $serviceName DisplayName "$displayName"
            & $nssmPath set $serviceName Description "$($Global:Config.ServiceDescription)"
            & $nssmPath set $serviceName Start SERVICE_AUTO_START
            & $nssmPath set $serviceName AppDirectory "`"$($Global:Config.InstallPath)`""
            
            # Set up logging
            $logsPath = Join-Path $Global:Config.InstallPath "logs"
            & $nssmPath set $serviceName AppStdout "`"$logsPath\service-output.log`""
            & $nssmPath set $serviceName AppStderr "`"$logsPath\service-error.log`""
            & $nssmPath set $serviceName AppRotateFiles 1
            & $nssmPath set $serviceName AppRotateOnline 1
            & $nssmPath set $serviceName AppRotateBytes 1048576  # 1MB
            
            Write-Log "Service configured with NSSM successfully"
            return $true
        } else {
            Write-Log "NSSM service installation failed with exit code: $LASTEXITCODE" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Failed to install service with NSSM: $_" "ERROR"
        return $false
    }
}

# Uninstall Function
function Uninstall-SafeNetAgent {
    Write-Log "Starting SafeNet agent uninstallation..."
    
    try {
        # Stop and remove service
        $service = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
        if ($service) {
            if ($service.Status -eq "Running") {
                Stop-Service -Name $Global:Config.ServiceName -Force
                Write-Log "Service stopped"
            }
            
            # Use sc.exe for Windows PowerShell compatibility
            $result = & sc.exe delete $Global:Config.ServiceName
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Service removed successfully"
            } else {
                Write-Log "Service removal completed with code: $LASTEXITCODE" "WARNING"
            }
            
            # Wait for service to be fully removed
            Start-Sleep -Seconds 2
        }
        
        # Remove installation directory
        if (Test-Path $Global:Config.InstallPath) {
            Remove-Item -Path $Global:Config.InstallPath -Recurse -Force
            Write-Log "Installation directory removed"
        }
        
        Write-Host "[SUCCESS] SafeNet agent uninstalled successfully!" -ForegroundColor Green
        return $true
    } catch {
        Write-Log "Uninstallation failed: $_" "ERROR"
        return $false
    }
}

# Main Installation Function
function Install-SafeNetAgent {
    Write-Log "Starting SafeNet agent installation..."
    Write-Log "Version: $($Global:Config.Version)"
    Write-Log "Connector: $($Global:Config.ConnectorKey)"
    Write-Log "Client: $($Global:Config.ClientCode) - $($Global:Config.ClientName)"
    
    try {
        # Create installation directory
        if (!(Test-Path $Global:Config.InstallPath)) {
            New-Item -ItemType Directory -Path $Global:Config.InstallPath -Force | Out-Null
            Write-Log "Created installation directory: $($Global:Config.InstallPath)"
        }
        
        # Create logs directory
        $logsPath = Join-Path $Global:Config.InstallPath "logs"
        if (!(Test-Path $logsPath)) {
            New-Item -ItemType Directory -Path $logsPath -Force | Out-Null
        }
        
        # Install and start service
        if (Install-SafeNetService) {
            try {
                Start-Service -Name $Global:Config.ServiceName -ErrorAction Stop
                Write-Log "Service start command executed"
                
                # Verify service is running
                Start-Sleep -Seconds 5
                $service = Get-Service -Name $Global:Config.ServiceName
                if ($service.Status -eq "Running") {
                    Write-Host "[SUCCESS] SafeNet agent installed and running!" -ForegroundColor Green
                    Write-Host "[INFO] Protection is now active for $($Global:Config.ClientName)" -ForegroundColor Cyan
                    Write-Host "[INFO] Agent will appear in dashboard within 5 minutes" -ForegroundColor Yellow
                    return $true
                } else {
                    Write-Log "Service status: $($service.Status)" "ERROR"
                    # Try to get more details about why it failed
                    $eventLogs = Get-EventLog -LogName System -Source "Service Control Manager" -Newest 5 -ErrorAction SilentlyContinue | Where-Object { $_.Message -like "*$($Global:Config.ServiceName)*" }
                    if ($eventLogs) {
                        foreach ($log in $eventLogs) {
                            Write-Log "Event Log: $($log.Message)" "ERROR"
                        }
                    }
                    throw "Service failed to start - Status: $($service.Status)"
                }
            } catch {
                Write-Log "Failed to start service: $_" "ERROR"
                throw "Service startup failed: $_"
            }
        }
        
        return $false
    } catch {
        Write-Log "Installation failed: $_" "ERROR"
        Write-Host "[ERROR] Installation failed: $_" -ForegroundColor Red
        return $false
    }
}

# Main Script Logic
try {
    Write-Host "=== Ultrium SafeNet RMM Agent v$($Global:Config.Version) ===" -ForegroundColor Cyan
    
    if ($Uninstall) {
        if (Uninstall-SafeNetAgent) {
            exit 0
        } else {
            exit 1
        }
    }
    
    if (!(Load-Configuration)) {
        Write-Host "[ERROR] Missing required configuration (ConnectorKey, ClientCode)" -ForegroundColor Red
        exit 1
    }
    
    # Check if already installed
    $existingService = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "[WARNING] SafeNet agent is already installed" -ForegroundColor Yellow
        $response = Read-Host "Reinstall? (y/N)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            Uninstall-SafeNetAgent | Out-Null
        } else {
            exit 0
        }
    }
    
    $success = Install-SafeNetAgent
    if ($success) {
        exit 0
    } else {
        exit 1
    }
    
} catch {
    Write-Log "Script failed: $_" "ERROR"
    Write-Host "[ERROR] Installation failed: $_" -ForegroundColor Red
    exit 1
}