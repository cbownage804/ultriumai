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
    Version = "1.0.1"
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
        # Get basic info safely to avoid hanging
        `$hostname = `$env:COMPUTERNAME
        if ([string]::IsNullOrEmpty(`$hostname)) { `$hostname = "Unknown" }
        
        # Get primary IP address with error handling
        `$ipAddress = "127.0.0.1"
        try {
            `$adapters = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | 
                Where-Object { `$_.IPAddress -notlike "127.*" -and `$_.IPAddress -notlike "169.254.*" }
            if (`$adapters) {
                `$ipAddress = `$adapters[0].IPAddress
            }
        } catch {
            `$ipAddress = "127.0.0.1"
        }
        
        # Get OS info with timeout protection
        `$osName = "Windows"
        `$osVersion = "Unknown"
        `$osBuild = "Unknown"
        try {
            `$os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction SilentlyContinue
            if (`$os) {
                if (`$os.Caption) { `$osName = `$os.Caption }
                if (`$os.Version) { `$osVersion = `$os.Version }
                if (`$os.BuildNumber) { `$osBuild = `$os.BuildNumber }
            }
        } catch {
            # Keep defaults
        }
        
        `$domain = `$env:USERDOMAIN
        if ([string]::IsNullOrEmpty(`$domain)) { `$domain = "Unknown" }
        
        return @{
            hostname = `$hostname
            ip_address = `$ipAddress
            domain = `$domain
            os_name = `$osName
            os_version = `$osVersion
            os_build = `$osBuild
            last_checkin = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
        }
    } catch {
        Write-ServiceLog "Failed to collect system info: `$_" "ERROR"
        # Return valid defaults to avoid database constraint errors
        return @{
            hostname = if (`$env:COMPUTERNAME) { `$env:COMPUTERNAME } else { "Unknown" }
            ip_address = "127.0.0.1"
            domain = if (`$env:USERDOMAIN) { `$env:USERDOMAIN } else { "Unknown" }
            os_name = "Windows"
            os_version = "Unknown"
            os_build = "Unknown"
            last_checkin = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
        }
    }
}

function Get-NetworkDevices {
    try {
        `$devices = @()
        `$localIPs = (Get-NetIPAddress | Where-Object { 
            `$_.AddressFamily -eq "IPv4" -and 
            `$_.IPAddress -ne "127.0.0.1" -and 
            `$_.IPAddress -notlike "169.254.*"
        }).IPAddress
        
        Write-ServiceLog "Starting network discovery for `$(`$localIPs.Count) local IPs" "INFO"
        
        foreach (`$ip in `$localIPs) {
            # Skip APIPA/link-local addresses
            if (`$ip -like "169.254.*") {
                Write-ServiceLog "Skipping APIPA address: `$ip" "INFO"
                continue
            }
            
            `$network = `$ip.Substring(0, `$ip.LastIndexOf('.'))
            Write-ServiceLog "Scanning network: `$network.0/24 (excluding APIPA ranges)" "INFO"
            
            # Use synchronous scanning to avoid job issues in service context
            `$commonIPs = @(1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 100, 101, 102, 103, 104, 105, 110, 111, 112, 113, 114, 115, 200, 201, 202, 203, 204, 205, 210, 211, 212, 213, 214, 215, 254)
            `$scannedCount = 0
            
            foreach (`$i in `$commonIPs) {
                `$targetIP = "`$network.`$i"
                `$scannedCount++
                
                # Log progress every 20 IPs
                if (`$scannedCount % 20 -eq 0) {
                    Write-ServiceLog "Scanned `$scannedCount/`$(`$commonIPs.Count) addresses, found `$(`$devices.Count) online devices" "INFO"
                }
                
                # Skip scanning APIPA addresses and self
                if (`$targetIP -ne `$ip -and `$targetIP -notlike "169.254.*") {
                    try {
                        # Use Test-Connection without -TimeoutSec for PowerShell 5.1 compatibility
                        `$pingResult = Test-Connection -ComputerName `$targetIP -Count 1 -Quiet -ErrorAction SilentlyContinue
                        if (`$pingResult) {
                            try {
                                `$hostname = [System.Net.Dns]::GetHostByAddress(`$targetIP).HostName
                            } catch {
                                `$hostname = "Unknown"
                            }
                            
                            `$device = @{
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
                            
                            `$devices += `$device
                            Write-ServiceLog "Found device: `$(`$device.ip_address) (`$(`$device.hostname))" "INFO"
                        }
                    } catch {
                        # Silently continue for individual failures
                    }
                }
            }
            
            break # Only scan first network for demo
        }
        
        Write-ServiceLog "Network scan completed. Found `$(`$devices.Count) devices" "INFO"
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
    `$startTime = (Get-Date).Ticks
    
    while (`$true) {
        try {
            `$currentTime = (Get-Date).Ticks
            `$runningTime = (`$currentTime - `$startTime) / 10000000 # seconds
            
            # Regular checkin - start after 30 seconds
            if (`$runningTime -gt 30 -and (`$currentTime - `$lastCheckin) / 10000000 -gt `$Global:Config.CheckinInterval) {
                Send-Checkin
                `$lastCheckin = `$currentTime
            }
            
            # Network scan - start after 5 minutes to allow service to stabilize
            if (`$runningTime -gt 300 -and (`$currentTime - `$lastScan) / 10000000 -gt `$Global:Config.ScanInterval) {
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

# Service entry point
if (`$args.Count -gt 0 -and `$args[0] -eq 'service') {
    `$maxRetries = 3
    `$retryCount = 0
    
    while (`$retryCount -lt `$maxRetries) {
        try {
            Write-ServiceLog "=== SafeNet Agent Service Starting (Attempt `$(`$retryCount + 1)/`$maxRetries) ===" "INFO"
            Write-ServiceLog "PowerShell Version: `$(`$PSVersionTable.PSVersion)" "INFO"
            Write-ServiceLog "Working Directory: `$(Get-Location)" "INFO"
            
            Write-ServiceLog "Starting main service loop..." "INFO"
            Start-ServiceLoop
            # If we reach here, the service ended unexpectedly
            break
        } catch {
            `$retryCount++
            Write-ServiceLog "Service failed to start: `$_" "ERROR"
            Write-ServiceLog "Stack trace: `$(`$_.ScriptStackTrace)" "ERROR"
            
            if (`$retryCount -lt `$maxRetries) {
                Write-ServiceLog "Retrying in 60 seconds (attempt `$(`$retryCount + 1)/`$maxRetries)..." "ERROR"
                Start-Sleep -Seconds 60
            } else {
                Write-ServiceLog "Maximum retry attempts reached. Service will exit." "ERROR"
                exit 1
            }
        }
    }
} else {
    # Non-service mode - installer usage
    Write-Host "SafeNet Agent - Use 'service' parameter to run as service"
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

# Install Service
function Install-SafeNetService {
    $scriptPath = Create-ServiceScript
    if (!$scriptPath) { return $false }
    
    try {
        # Download and setup NSSM
        $nssmPath = Join-Path $Global:Config.InstallPath "nssm.exe"
        if (!(Test-Path $nssmPath)) {
            Write-Log "Downloading NSSM..."
            $nssmUrls = @(
                "https://nssm.cc/ci/nssm-2.24-101-g897c7ad.zip",
                "https://github.com/kirillkovalenko/nssm/raw/master/win64/nssm.exe"
            )
            
            $downloaded = $false
            foreach ($url in $nssmUrls) {
                try {
                    if ($url -like "*.zip") {
                        # Download and extract zip
                        $zipPath = Join-Path $Global:Config.InstallPath "nssm.zip"
                        Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
                        Add-Type -AssemblyName System.IO.Compression.FileSystem
                        [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $Global:Config.InstallPath)
                        
                        # Find nssm.exe in extracted files
                        $nssmExe = Get-ChildItem -Path $Global:Config.InstallPath -Recurse -Name "nssm.exe" | Select-Object -First 1
                        if ($nssmExe) {
                            $fullNssmPath = Join-Path $Global:Config.InstallPath $nssmExe
                            Copy-Item $fullNssmPath $nssmPath
                            Remove-Item $zipPath -Force
                            # Clean up extracted folders
                            Get-ChildItem -Path $Global:Config.InstallPath -Directory | Remove-Item -Recurse -Force
                            $downloaded = $true
                            break
                        }
                    } else {
                        # Direct exe download
                        Invoke-WebRequest -Uri $url -OutFile $nssmPath -UseBasicParsing
                        $downloaded = $true
                        break
                    }
                } catch {
                    Write-Log "Failed to download from $url`: $_" "ERROR"
                    continue
                }
            }
            
            if (!$downloaded) {
                Write-Log "All NSSM download attempts failed" "ERROR"
                return $false
            }
            Write-Log "NSSM downloaded successfully"
        }
        
        # Check if service already exists and remove it first
        $existingService = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
        if ($existingService) {
            Write-Log "Removing existing service..."
            if ($existingService.Status -eq "Running") {
                & $nssmPath stop $Global:Config.ServiceName
            }
            & $nssmPath remove $Global:Config.ServiceName confirm
            Start-Sleep -Seconds 2
        }
        
        # Install service using NSSM with correct parameters
        $nssm = Join-Path $Global:Config.InstallPath "nssm.exe"
        $servicePath = "powershell.exe"
        
        & $nssm install $Global:Config.ServiceName $servicePath
        
        # Force-set parameters with proper quoting - use single quotes to preserve inner double quotes
        & $nssm set $Global:Config.ServiceName AppParameters '-ExecutionPolicy Bypass -NoProfile -File "C:\Program Files\Ultrium SafeNet\SafeNet-Agent.ps1" service'
        & $nssm set $Global:Config.ServiceName AppDirectory "C:\Program Files\Ultrium SafeNet"
        & $nssm set $Global:Config.ServiceName DisplayName $Global:Config.ServiceDisplayName
        & $nssm set $Global:Config.ServiceName Description $Global:Config.ServiceDescription
        & $nssm set $Global:Config.ServiceName Start SERVICE_AUTO_START
        
        # Configure logging
        $logFile = Join-Path $Global:Config.InstallPath "logs\service.log"
        & $nssm set $Global:Config.ServiceName AppStdout $logFile
        & $nssm set $Global:Config.ServiceName AppStderr $logFile
        
        # Configure recovery actions - auto-restart on failure
        & $nssm set $Global:Config.ServiceName AppExit Default Restart
        & $nssm set $Global:Config.ServiceName AppRestartDelay 30000
        
        # Verify NSSM kept the quotes properly
        Write-Log "Verifying NSSM configuration..."
        $params = & $nssm get $Global:Config.ServiceName AppParameters 2>&1
        Write-Log "AppParameters result: $params"
        
        # Check if quotes are preserved around the .ps1 path
        if ($params -like '*"C:\Program Files\Ultrium SafeNet\SafeNet-Agent.ps1"*') {
            Write-Log "✅ NSSM parameters correctly quoted" 
        } else {
            Write-Log "❌ NSSM lost quotes - attempting to fix..." "ERROR"
            # Try again with different quoting approach
            & $nssm set $Global:Config.ServiceName AppParameters '-ExecutionPolicy Bypass -NoProfile -File "C:\Program Files\Ultrium SafeNet\SafeNet-Agent.ps1" service'
            $params2 = & $nssm get $Global:Config.ServiceName AppParameters 2>&1
            Write-Log "Second attempt result: $params2"
        }
        
        Write-Log "Windows service installed with NSSM: $($Global:Config.ServiceName)"
        return $true
    } catch {
        Write-Log "Failed to install service: $_" "ERROR"
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
            # Use sc.exe for compatibility with older PowerShell versions
            try {
                $result = & sc.exe delete $Global:Config.ServiceName
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "Service removed"
                } else {
                    Write-Log "Failed to remove service: $result" "ERROR"
                }
            } catch {
                Write-Log "Service removal error: $_" "ERROR"
            }
        }
        
        # Remove installation directory
        if (Test-Path $Global:Config.InstallPath) {
            Remove-Item -Path $Global:Config.InstallPath -Recurse -Force
            Write-Log "Installation directory removed"
        }
        
        Write-Host "SafeNet agent uninstalled successfully!" -ForegroundColor Green
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
    Write-Log "Client: $($Global:Config.ClientCode) - $(if($Global:Config.ClientName) { $Global:Config.ClientName } else { 'Default Client' })"
    
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
            Write-Log "Waiting for service to initialize..."
            Start-Sleep -Seconds 3
            
            $serviceStarted = $false
            try {
                Start-Service -Name $Global:Config.ServiceName -ErrorAction Stop
                Write-Log "Start-Service command executed successfully"
                $serviceStarted = $true
            } catch {
                Write-Log "Start-Service command failed: $_" "ERROR"
            }
            
            # Wait and check actual service status regardless of Start-Service result
            Start-Sleep -Seconds 5
            $service = Get-Service -Name $Global:Config.ServiceName
            
            if ($service.Status -eq "Running") {
                Write-Log "✅ Service is running successfully!" "SUCCESS"
                Write-Host "SafeNet agent installed and running!" -ForegroundColor Green
                Write-Host "Protection is now active for $($Global:Config.ClientName)" -ForegroundColor Cyan
                Write-Host "Agent will appear in dashboard within 5 minutes" -ForegroundColor Yellow
                Write-Host "Service logs: $(Join-Path $Global:Config.InstallPath 'logs\service.log')" -ForegroundColor Yellow
                return $true
            } else {
                Write-Log "❌ Service failed to start - Status: $($service.Status)" "ERROR"
                
                # Get NSSM service configuration for diagnostics
                Write-Log "NSSM Service Configuration:" "ERROR"
                $nssmPath = Join-Path $Global:Config.InstallPath "nssm.exe"
                try {
                    $appPath = & $nssmPath get $Global:Config.ServiceName Application 2>&1
                    $appParams = & $nssmPath get $Global:Config.ServiceName AppParameters 2>&1
                    $appDir = & $nssmPath get $Global:Config.ServiceName AppDirectory 2>&1
                    Write-Log "Application: $appPath" "ERROR"
                    Write-Log "AppParameters: $appParams" "ERROR"
                    Write-Log "AppDirectory: $appDir" "ERROR"
                } catch {
                    Write-Log "Could not get NSSM config: $_" "ERROR"
                }
                
                # Test the PowerShell script directly
                Write-Log "Testing PowerShell script directly..." "ERROR"
                $scriptPath = Join-Path $Global:Config.InstallPath "SafeNet-Agent.ps1"
                try {
                    $testResult = & powershell.exe -ExecutionPolicy Bypass -NoProfile -File $scriptPath 2>&1
                    Write-Log "Script test result: $testResult" "ERROR"
                } catch {
                    Write-Log "Script test failed: $_" "ERROR"
                }
                
                # Test with service parameter (what NSSM actually runs) - skip in silent mode
                if (!$Silent) {
                    Write-Log "Testing with 'service' parameter..." "ERROR"
                    try {
                        $serviceTestJob = Start-Job -ScriptBlock {
                            param($scriptPath)
                            try {
                                & powershell.exe -ExecutionPolicy Bypass -NoProfile -File $scriptPath service 2>&1
                            } catch {
                                "Job error: $_"
                            }
                        } -ArgumentList $scriptPath
                        
                        $serviceTestResult = Wait-Job -Job $serviceTestJob -Timeout 15 | Receive-Job
                        if ($serviceTestJob.State -eq "Running") {
                            Remove-Job -Job $serviceTestJob -Force
                            Write-Log "Service test timed out after 15 seconds (service likely hanging)" "ERROR"
                        } else {
                            Write-Log "Service test result: $serviceTestResult" "ERROR"
                            Remove-Job -Job $serviceTestJob -Force
                        }
                    } catch {
                        Write-Log "Service test failed: $_" "ERROR"
                    }
                }
                
                # Check Windows Event Log for service startup errors
                Write-Log "Checking Windows Event Log for recent service errors..." "ERROR"
                try {
                    $events = Get-WinEvent -FilterHashtable @{LogName='System'; ID=7034,7031,7030,7022,7023,7024} -MaxEvents 10 -ErrorAction SilentlyContinue | 
                        Where-Object {$_.TimeCreated -gt (Get-Date).AddMinutes(-5) -and $_.Message -like "*$($Global:Config.ServiceName)*"}
                    if ($events) {
                        foreach ($event in $events) {
                            Write-Log "Event Log: $($event.Id) - $($event.LevelDisplayName) - $($event.Message)" "ERROR"
                        }
                    } else {
                        Write-Log "No recent service errors found in Event Log" "ERROR"
                    }
                } catch {
                    Write-Log "Could not read Event Log: $_" "ERROR"
                }
                
                # Test the exact command NSSM is trying to run
                Write-Log "Testing exact NSSM command..." "ERROR"
                try {
                    $nssmCommand = "-ExecutionPolicy Bypass -NoProfile -File `"$scriptPath`" service"
                    Write-Log "NSSM Command: powershell.exe $nssmCommand" "ERROR"
                    $exactResult = & powershell.exe -ExecutionPolicy Bypass -NoProfile -File $scriptPath service 2>&1
                    Write-Log "Exact command result: $exactResult" "ERROR"
                } catch {
                    Write-Log "Exact command failed: $_" "ERROR"
                }
                
                # Check service logs for more details
                $logFile = Join-Path $Global:Config.InstallPath "logs\service.log"
                if (Test-Path $logFile) {
                    Write-Log "Service log contents:" "ERROR"
                    $logContent = Get-Content $logFile -Tail 10 -ErrorAction SilentlyContinue
                    foreach ($line in $logContent) {
                        Write-Log "LOG: $line" "ERROR"
                    }
                } else {
                    Write-Log "No service log file found at $logFile" "ERROR"
                }
                
                # Try to get service status details
                try {
                    $serviceDetails = Get-WmiObject -Class Win32_Service -Filter "Name='$($Global:Config.ServiceName)'"
                    if ($serviceDetails) {
                        Write-Log "Service State: $($serviceDetails.State)" "ERROR"
                        Write-Log "Service ExitCode: $($serviceDetails.ExitCode)" "ERROR"
                        Write-Log "Service ProcessId: $($serviceDetails.ProcessId)" "ERROR"
                    }
                } catch {
                    Write-Log "Could not get service details: $_" "ERROR"
                }
                
                # Early return on failure to avoid more testing
                Write-Log "Installation failed: Service failed to start - Status: $($service.Status)" "ERROR"
                Write-Host "`n❌ Installation failed! Manual debugging steps:" -ForegroundColor Red
                Write-Host "1. Check NSSM configuration:" -ForegroundColor Yellow
                Write-Host "   `$nssm = `"C:\Program Files\Ultrium SafeNet\nssm.exe`"" -ForegroundColor Cyan
                Write-Host "   & `$nssm get UltriumSafeNetAgent AppParameters" -ForegroundColor Cyan
                Write-Host "`n2. Restart service and check logs:" -ForegroundColor Yellow
                Write-Host "   & `$nssm restart UltriumSafeNetAgent" -ForegroundColor Cyan  
                Write-Host "   Get-Content `"C:\Program Files\Ultrium SafeNet\logs\service.log`" -Tail 100 -Wait" -ForegroundColor Cyan
                Write-Host "`n3. Test exact command manually:" -ForegroundColor Yellow
                Write-Host "   & `"`$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe`" -ExecutionPolicy Bypass -NoProfile -File `"C:\Program Files\Ultrium SafeNet\SafeNet-Agent.ps1`" service" -ForegroundColor Cyan
                return $false
            }
        }
        
        return $false
    } catch {
        Write-Log "Installation failed: $_" "ERROR"
        Write-Host "Installation failed: $_" -ForegroundColor Red
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
        Write-Host "Missing required configuration (ConnectorKey, ClientCode)" -ForegroundColor Red
        if (!$Silent) {
            Write-Host ""
            Write-Host "Usage: .\SafeNet-RMM-Agent-Installer.ps1 -ConnectorKey 'your-key' -ClientCode 'your-code'" -ForegroundColor Yellow
            Write-Host "   or: .\SafeNet-RMM-Agent-Installer.ps1 -ConfigFile 'config.json'" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Press Enter to close this window..." -ForegroundColor Yellow
            $null = Read-Host
        }
        exit 1
    }
    
    # Check if already installed
    $existingService = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "SafeNet agent is already installed" -ForegroundColor Yellow
        if (!$Silent) {
            $response = Read-Host "Reinstall? (y/N)"
            if ($response -eq 'y' -or $response -eq 'Y') {
                Uninstall-SafeNetAgent | Out-Null
            } else {
                exit 0
            }
        } else {
            # In silent mode, just update
            Uninstall-SafeNetAgent | Out-Null
        }
    }
    
    if (Install-SafeNetAgent) {
        exit 0
    } else {
        exit 1
    }
    
} catch {
    Write-Log "Script failed: $_" "ERROR"
    Write-Host "Installation failed: $_" -ForegroundColor Red
    exit 1
}