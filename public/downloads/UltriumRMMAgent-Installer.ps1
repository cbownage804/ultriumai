# Ultrium AI - RMM Agent Installer
# This script installs the Ultrium RMM Agent with SafeDoc and SafePass integration
# Run as Administrator

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerUrl = "https://nsyobmjpdpvesjwdphlh.supabase.co",
    
    [Parameter(Mandatory=$true)]
    [string]$AgentToken,
    
    [Parameter(Mandatory=$false)]
    [string]$ClientId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$MSPId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$InstallPath = "C:\Program Files\Ultrium\RMMAgent"
)

Write-Host "=== Ultrium AI RMM Agent Installer ===" -ForegroundColor Cyan
Write-Host "Installing RMM Agent with SafeDoc and SafePass integration..." -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

# Create installation directory
Write-Host "Creating installation directory: $InstallPath" -ForegroundColor Yellow
if (!(Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
}

# Download and create the RMM Agent service
$agentScript = @"
# Ultrium RMM Agent Service
# Provides remote monitoring, SafeDoc integration, and SafePass integration

Add-Type -AssemblyName System.Web
Add-Type -AssemblyName System.Windows.Forms

`$global:ServerUrl = "$ServerUrl"
`$global:AgentToken = "$AgentToken"
`$global:ClientId = "$ClientId"
`$global:MSPId = "$MSPId"
`$global:DeviceId = ""
`$global:WebSocket = `$null
`$global:SessionActive = `$false

# System Information Collection
function Get-SystemInfo {
    `$os = Get-CimInstance -ClassName Win32_OperatingSystem
    `$computer = Get-CimInstance -ClassName Win32_ComputerSystem
    `$cpu = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
    
    return @{
        hostname = `$env:COMPUTERNAME
        ip_address = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {`$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object -First 1).IPAddress
        os_info = "`$(`$os.Caption) `$(`$os.Version)"
        device_type = if (`$computer.PCSystemType -eq 2) { "laptop" } else { "desktop" }
        agent_version = "1.0.0-ultrium"
        cpu_info = `$cpu.Name
        total_memory = [math]::Round(`$os.TotalVisibleMemorySize / 1MB, 2)
        domain = `$computer.Domain
        manufacturer = `$computer.Manufacturer
        model = `$computer.Model
    }
}

# Performance Metrics Collection
function Get-PerformanceMetrics {
    `$cpu = Get-CimInstance -ClassName Win32_Processor | Measure-Object -Property LoadPercentage -Average
    `$memory = Get-CimInstance -ClassName Win32_OperatingSystem
    `$disk = Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DeviceID='C:'"
    
    return @{
        cpu_usage = `$cpu.Average
        memory_usage = [math]::Round(((`$memory.TotalVisibleMemorySize - `$memory.FreePhysicalMemory) / `$memory.TotalVisibleMemorySize) * 100, 2)
        disk_usage = [math]::Round(((`$disk.Size - `$disk.FreeSpace) / `$disk.Size) * 100, 2)
        network_stats = @{
            bytes_sent = (Get-Counter "\Network Interface(*)\Bytes Sent/sec" -SampleInterval 1 -MaxSamples 1).CounterSamples[0].CookedValue
            bytes_received = (Get-Counter "\Network Interface(*)\Bytes Received/sec" -SampleInterval 1 -MaxSamples 1).CounterSamples[0].CookedValue
        }
        installed_software = (Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* | Where-Object DisplayName | Measure-Object).Count
        running_processes = (Get-Process | Measure-Object).Count
    }
}

# Agent Registration
function Register-Agent {
    `$systemInfo = Get-SystemInfo
    `$registrationData = @{
        action = "register_agent"
        hostname = `$systemInfo.hostname
        ip_address = `$systemInfo.ip_address
        os_info = `$systemInfo.os_info
        device_type = `$systemInfo.device_type
        agent_version = `$systemInfo.agent_version
        client_id = `$global:ClientId
        msp_id = `$global:MSPId
    }
    
    try {
        `$response = Invoke-RestMethod -Uri "`$(`$global:ServerUrl)/functions/v1/rmm-agent-manager" -Method Post -Body (`$registrationData | ConvertTo-Json) -ContentType "application/json" -Headers @{"Authorization" = "Bearer `$(`$global:AgentToken)"}
        
        if (`$response.success) {
            `$global:DeviceId = `$response.config.agent_id
            Write-Host "Agent registered successfully. Device ID: `$(`$global:DeviceId)" -ForegroundColor Green
            return `$true
        }
    } catch {
        Write-Host "Registration failed: `$(`$_.Exception.Message)" -ForegroundColor Red
        return `$false
    }
    return `$false
}

# Heartbeat Function
function Send-Heartbeat {
    if (-not `$global:DeviceId) { return }
    
    `$metrics = Get-PerformanceMetrics
    `$heartbeatData = @{
        action = "heartbeat"
        device_id = `$global:DeviceId
        metrics = `$metrics
    }
    
    try {
        Invoke-RestMethod -Uri "`$(`$global:ServerUrl)/functions/v1/rmm-agent-manager" -Method Post -Body (`$heartbeatData | ConvertTo-Json) -ContentType "application/json" -Headers @{"Authorization" = "Bearer `$(`$global:AgentToken)"} | Out-Null
    } catch {
        Write-Host "Heartbeat failed: `$(`$_.Exception.Message)" -ForegroundColor Yellow
    }
}

# SafeDoc Integration - File Scanning
function Invoke-SafeDocScan {
    param([string]`$FilePath)
    
    if (-not (Test-Path `$FilePath)) { return }
    
    `$fileInfo = Get-Item `$FilePath
    `$fileHash = (Get-FileHash `$FilePath -Algorithm SHA256).Hash
    
    `$scanData = @{
        action = "scan_document"
        file_path = `$FilePath
        file_hash = `$fileHash
        file_size = `$fileInfo.Length
        mime_type = [System.Web.MimeMapping]::GetMimeMapping(`$FilePath)
        device_id = `$global:DeviceId
        user_context = `$env:USERNAME
    }
    
    try {
        `$response = Invoke-RestMethod -Uri "`$(`$global:ServerUrl)/functions/v1/safedoc-agent-integration" -Method Post -Body (`$scanData | ConvertTo-Json) -ContentType "application/json" -Headers @{"Authorization" = "Bearer `$(`$global:AgentToken)"}
        
        if (`$response.success) {
            Write-Host "SafeDoc scan initiated for: `$FilePath" -ForegroundColor Green
        }
    } catch {
        Write-Host "SafeDoc scan failed: `$(`$_.Exception.Message)" -ForegroundColor Red
    }
}

# SafePass Integration - Clipboard Monitoring
function Start-ClipboardMonitoring {
    `$previousClipboard = ""
    
    while (`$true) {
        try {
            if ([System.Windows.Forms.Clipboard]::ContainsText()) {
                `$currentClipboard = [System.Windows.Forms.Clipboard]::GetText()
                
                if (`$currentClipboard -ne `$previousClipboard -and `$currentClipboard.Length -gt 0) {
                    # Check if clipboard contains potential password patterns
                    if (`$currentClipboard -match "^[A-Za-z0-9!@#`$%^&*()_+-=\[\]{}|;:,.<>?]{8,}$" -and `$currentClipboard.Length -le 128) {
                        # Potential password detected - sync with SafePass
                        `$syncData = @{
                            action = "get_context_suggestions"
                            context = @{
                                clipboard_content = `$currentClipboard
                                user = `$env:USERNAME
                                timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                            }
                            device_id = `$global:DeviceId
                        }
                        
                        try {
                            Invoke-RestMethod -Uri "`$(`$global:ServerUrl)/functions/v1/safepass-agent-integration" -Method Post -Body (`$syncData | ConvertTo-Json) -ContentType "application/json" -Headers @{"Authorization" = "Bearer `$(`$global:AgentToken)"} | Out-Null
                        } catch {
                            # Silent fail for clipboard monitoring
                        }
                    }
                    
                    `$previousClipboard = `$currentClipboard
                }
            }
        } catch {
            # Silent fail for clipboard monitoring
        }
        
        Start-Sleep -Seconds 2
    }
}

# File System Watcher for SafeDoc
function Start-FileSystemWatcher {
    `$watcher = New-Object System.IO.FileSystemWatcher
    `$watcher.Path = "C:\Users\"
    `$watcher.Filter = "*.*"
    `$watcher.IncludeSubdirectories = `$true
    `$watcher.EnableRaisingEvents = `$true
    
    `$action = {
        `$path = `$Event.SourceEventArgs.FullPath
        `$changeType = `$Event.SourceEventArgs.ChangeType
        
        # Monitor for new files in Downloads, Desktop, Documents
        if (`$changeType -eq "Created" -and (`$path -like "*\Downloads\*" -or `$path -like "*\Desktop\*" -or `$path -like "*\Documents\*")) {
            # Check if it's a potentially risky file type
            `$extension = [System.IO.Path]::GetExtension(`$path).ToLower()
            `$riskyExtensions = @(".exe", ".msi", ".bat", ".cmd", ".scr", ".vbs", ".js", ".jar", ".zip", ".rar", ".7z")
            
            if (`$extension -in `$riskyExtensions) {
                Start-Job -ScriptBlock { Invoke-SafeDocScan -FilePath `$using:path }
            }
        }
    }
    
    Register-ObjectEvent -InputObject `$watcher -EventName "Created" -Action `$action
}

# Main Agent Loop
function Start-Agent {
    Write-Host "Starting Ultrium RMM Agent..." -ForegroundColor Green
    
    # Register agent
    if (-not (Register-Agent)) {
        Write-Host "Failed to register agent. Exiting." -ForegroundColor Red
        return
    }
    
    # Start background monitoring
    Start-Job -ScriptBlock `${function:Start-ClipboardMonitoring}
    Start-FileSystemWatcher
    
    Write-Host "Agent started successfully. Monitoring system..." -ForegroundColor Green
    
    # Main heartbeat loop
    while (`$true) {
        Send-Heartbeat
        Start-Sleep -Seconds 30
    }
}

# Start the agent
Start-Agent
"@

# Write the agent script to file
$agentScript | Out-File -FilePath "$InstallPath\UltriumRMMAgent.ps1" -Encoding UTF8

# Create the service wrapper
$serviceScript = @"
# Ultrium RMM Agent Service Wrapper
`$scriptPath = "$InstallPath\UltriumRMMAgent.ps1"
PowerShell.exe -ExecutionPolicy Bypass -File `$scriptPath
"@

$serviceScript | Out-File -FilePath "$InstallPath\ServiceWrapper.ps1" -Encoding UTF8

# Create Windows Service
Write-Host "Creating Windows Service..." -ForegroundColor Yellow

$serviceName = "UltriumRMMAgent"
$serviceDisplayName = "Ultrium AI RMM Agent"
$serviceDescription = "Ultrium AI Remote Monitoring and Management Agent with SafeDoc and SafePass integration"

# Stop and remove existing service if it exists
if (Get-Service -Name $serviceName -ErrorAction SilentlyContinue) {
    Write-Host "Stopping existing service..." -ForegroundColor Yellow
    Stop-Service -Name $serviceName -Force
    sc.exe delete $serviceName
    Start-Sleep -Seconds 3
}

# Create new service
$serviceCommand = "PowerShell.exe -ExecutionPolicy Bypass -File `"$InstallPath\ServiceWrapper.ps1`""
sc.exe create $serviceName binPath= $serviceCommand start= auto DisplayName= $serviceDisplayName
sc.exe description $serviceName $serviceDescription

# Configure service recovery options
sc.exe failure $serviceName reset= 86400 actions= restart/60000/restart/60000/restart/60000

# Create configuration file
$config = @{
    server_url = $ServerUrl
    agent_token = $AgentToken
    client_id = $ClientId
    msp_id = $MSPId
    device_id = ""
    features = @{
        safedoc_integration = $true
        safepass_integration = $true
        remote_access = $true
        file_monitoring = $true
        clipboard_sync = $true
    }
    install_date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    version = "1.0.0-ultrium"
}

$config | ConvertTo-Json -Depth 4 | Out-File -FilePath "$InstallPath\config.json" -Encoding UTF8

# Create uninstaller
$uninstallScript = @"
# Ultrium RMM Agent Uninstaller
Write-Host "Uninstalling Ultrium RMM Agent..." -ForegroundColor Yellow

# Stop and remove service
if (Get-Service -Name "UltriumRMMAgent" -ErrorAction SilentlyContinue) {
    Stop-Service -Name "UltriumRMMAgent" -Force
    sc.exe delete "UltriumRMMAgent"
}

# Remove installation directory
if (Test-Path "$InstallPath") {
    Remove-Item -Path "$InstallPath" -Recurse -Force
}

Write-Host "Ultrium RMM Agent uninstalled successfully." -ForegroundColor Green
"@

$uninstallScript | Out-File -FilePath "$InstallPath\Uninstall.ps1" -Encoding UTF8

# Start the service
Write-Host "Starting Ultrium RMM Agent service..." -ForegroundColor Yellow
Start-Service -Name $serviceName

# Wait a moment and check service status
Start-Sleep -Seconds 3
$service = Get-Service -Name $serviceName

if ($service.Status -eq "Running") {
    Write-Host "" -ForegroundColor Green
    Write-Host "=== INSTALLATION SUCCESSFUL ===" -ForegroundColor Green
    Write-Host "Ultrium RMM Agent has been installed and started successfully!" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "Service Name: $serviceName" -ForegroundColor Cyan
    Write-Host "Install Path: $InstallPath" -ForegroundColor Cyan
    Write-Host "Server URL: $ServerUrl" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor Green
    Write-Host "Features Enabled:" -ForegroundColor Yellow
    Write-Host "  ✓ Remote Monitoring & Management" -ForegroundColor Green
    Write-Host "  ✓ SafeDoc Document Security Scanning" -ForegroundColor Green
    Write-Host "  ✓ SafePass Password Management Integration" -ForegroundColor Green
    Write-Host "  ✓ Real-time System Monitoring" -ForegroundColor Green
    Write-Host "  ✓ Clipboard Synchronization" -ForegroundColor Green
    Write-Host "  ✓ File System Monitoring" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "To uninstall: Run '$InstallPath\Uninstall.ps1' as Administrator" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Green
} else {
    Write-Host "WARNING: Service installed but not running. Check Windows Event Logs for details." -ForegroundColor Red
    Write-Host "Service Status: $($service.Status)" -ForegroundColor Yellow
}

Write-Host "Installation complete!" -ForegroundColor Green
"@