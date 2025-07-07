# Ultrium RMM Agent Installer v2.1 - Full Version
# Run with: PowerShell -ExecutionPolicy Bypass -File UltriumRMMAgent-Installer.ps1 -Install

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
$InstallPath = "$env:ProgramFiles\Ultrium\RMMAgent"
$ConfigFile = "$InstallPath\config.json"
$LogFile = "$InstallPath\agent.log"

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
            ip_address = $ip.IPAddress
            os_info = "$($os.Caption) $($os.Version)"
            device_type = if ($computer.PCSystemType -eq 2) { "laptop" } else { "desktop" }
            agent_version = "2.1.0-live"
            cpu_info = $cpu.Name
            total_memory = [math]::Round($memory.Sum / 1GB, 2)
            available_memory = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
            domain = $computer.Domain
            manufacturer = $computer.Manufacturer
            model = $computer.Model
            mac_address = $network.MacAddress
            architecture = $env:PROCESSOR_ARCHITECTURE
            last_boot = $os.LastBootUpTime
        }
    } catch {
        Write-Log "Error getting system info: $($_.Exception.Message)"
        return @{}
    }
}

function Register-WithServer {
    param([hashtable]$SystemInfo)
    
    $registrationData = @{
        action = "register_agent"
        hostname = $SystemInfo.hostname
        ip_address = $SystemInfo.ip_address
        os_info = $SystemInfo.os_info
        device_type = $SystemInfo.device_type
        agent_version = $SystemInfo.agent_version
        client_id = $CompanyId
        msp_id = $MSPId
        system_info = $SystemInfo
    }
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $AgentToken"
        }
        
        $response = Invoke-RestMethod -Uri "$ServerUrl/functions/v1/rmm-agent" -Method Post -Body ($registrationData | ConvertTo-Json -Depth 5) -Headers $headers
        
        if ($response.success) {
            Write-Log "Agent registered successfully. Device ID: $($response.device_id)"
            return $response.device_id
        } else {
            Write-Log "Registration failed: $($response.error)"
            return $null
        }
    } catch {
        Write-Log "Registration error: $($_.Exception.Message)"
        return $null
    }
}

function Send-Heartbeat {
    param([string]$DeviceId)
    
    try {
        # Get current system metrics
        $cpu = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average
        $memory = Get-WmiObject -Class Win32_OperatingSystem
        $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3"
        $processes = Get-Process | Measure-Object
        
        $metrics = @{
            cpu_usage = $cpu.Average
            memory_usage = [math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100, 2)
            disk_usage = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 2)
            process_count = $processes.Count
            uptime_hours = ((Get-Date) - (Get-WmiObject -Class Win32_OperatingSystem).ConvertToDateTime((Get-WmiObject -Class Win32_OperatingSystem).LastBootUpTime)).TotalHours
        }
        
        $heartbeatData = @{
            action = "heartbeat"
            device_id = $DeviceId
            metrics = $metrics
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        }
        
        $headers = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $AgentToken"
        }
        
        Invoke-RestMethod -Uri "$ServerUrl/functions/v1/rmm-agent" -Method Post -Body ($heartbeatData | ConvertTo-Json -Depth 3) -Headers $headers -TimeoutSec 30 | Out-Null
        Write-Log "Heartbeat sent successfully"
        
    } catch {
        Write-Log "Heartbeat failed: $($_.Exception.Message)"
    }
}

function Check-PendingCommands {
    param([string]$DeviceId)
    
    try {
        $commandData = @{
            action = "get_commands"
            device_id = $DeviceId
        }
        
        $headers = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $AgentToken"
        }
        
        $response = Invoke-RestMethod -Uri "$ServerUrl/functions/v1/rmm-command" -Method Post -Body ($commandData | ConvertTo-Json) -Headers $headers -TimeoutSec 30
        
        if ($response.success -and $response.commands) {
            foreach ($command in $response.commands) {
                Execute-Command -Command $command -DeviceId $DeviceId
            }
        }
        
    } catch {
        Write-Log "Error checking commands: $($_.Exception.Message)"
    }
}

function Execute-Command {
    param([object]$Command, [string]$DeviceId)
    
    Write-Log "Executing command: $($Command.command)"
    
    $result = @{
        command_id = $Command.id
        success = $false
        output = ""
        error = ""
        exit_code = 0
    }
    
    try {
        switch ($Command.command_type) {
            "powershell" {
                $output = Invoke-Expression $Command.command 2>&1
                $result.success = $true
                $result.output = $output -join "`n"
            }
            "cmd" {
                $output = cmd /c $Command.command 2>&1
                $result.success = $true
                $result.output = $output -join "`n"
            }
            "system_info" {
                $sysInfo = Get-SystemInfo
                $result.success = $true
                $result.output = $sysInfo | ConvertTo-Json -Depth 3
            }
            default {
                $result.error = "Unknown command type: $($Command.command_type)"
            }
        }
    } catch {
        $result.error = $_.Exception.Message
        $result.exit_code = 1
    }
    
    # Send result back to server
    try {
        $headers = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $AgentToken"
        }
        
        $resultData = @{
            action = "command_result"
        } + $result
        
        Invoke-RestMethod -Uri "$ServerUrl/functions/v1/rmm-command" -Method Post -Body ($resultData | ConvertTo-Json -Depth 3) -Headers $headers -TimeoutSec 30 | Out-Null
        Write-Log "Command result sent for: $($Command.id)"
        
    } catch {
        Write-Log "Failed to send command result: $($_.Exception.Message)"
    }
}

function Install-Agent {
    Write-Log "Installing Ultrium RMM Agent v2.1..."
    
    if (-not (Test-Administrator)) {
        Write-Error "This script must be run as Administrator to install the service."
        exit 1
    }
    
    if ([string]::IsNullOrWhiteSpace($AgentToken)) {
        Write-Error "AgentToken is required for installation."
        Write-Host "Usage: .\UltriumRMMAgent-Installer.ps1 -Install -AgentToken 'your-token' -CompanyId 'your-company-id'"
        exit 1
    }
    
    # Create installation directory
    if (-not (Test-Path $InstallPath)) {
        New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
        Write-Log "Created installation directory: $InstallPath"
    }
    
    # Get system information and register
    $systemInfo = Get-SystemInfo
    $deviceId = Register-WithServer -SystemInfo $systemInfo
    
    if (-not $deviceId) {
        Write-Error "Failed to register with server. Please check your token and network connection."
        exit 1
    }
    
    # Create configuration file
    $config = @{
        server_url = $ServerUrl
        agent_token = $AgentToken
        company_id = $CompanyId
        msp_id = $MSPId
        device_id = $deviceId
        heartbeat_interval = 30
        command_check_interval = 10
        install_date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        version = "2.1.0-live"
        system_info = $systemInfo
    }
    
    $config | ConvertTo-Json -Depth 4 | Out-File -FilePath $ConfigFile -Encoding UTF8
    Write-Log "Configuration saved to: $ConfigFile"
    
    # Create the main agent service script
    $ServiceScriptContent = @"
# Ultrium RMM Agent Service - Live Version
`$ConfigPath = "$ConfigFile"
`$LogPath = "$LogFile"

function Write-AgentLog {
    param([string]`$Message)
    `$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    try {
        "`$timestamp - `$Message" | Out-File -FilePath `$LogPath -Append
    } catch {}
}

function Load-Config {
    try {
        if (Test-Path `$ConfigPath) {
            return Get-Content `$ConfigPath | ConvertFrom-Json
        }
    } catch {
        Write-AgentLog "Error loading config: `$(`$_.Exception.Message)"
    }
    return `$null
}

function Send-Heartbeat {
    param([object]`$Config)
    
    try {
        `$cpu = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average
        `$memory = Get-WmiObject -Class Win32_OperatingSystem
        `$disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3" | Select-Object -First 1
        
        `$metrics = @{
            cpu_usage = `$cpu.Average
            memory_usage = [math]::Round(((`$memory.TotalVisibleMemorySize - `$memory.FreePhysicalMemory) / `$memory.TotalVisibleMemorySize) * 100, 2)
            disk_usage = if (`$disk) { [math]::Round(((`$disk.Size - `$disk.FreeSpace) / `$disk.Size) * 100, 2) } else { 0 }
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        }
        
        `$heartbeatData = @{
            action = "heartbeat"
            device_id = `$Config.device_id
            metrics = `$metrics
        }
        
        `$headers = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer `$(`$Config.agent_token)"
        }
        
        Invoke-RestMethod -Uri "`$(`$Config.server_url)/functions/v1/rmm-agent" -Method Post -Body (`$heartbeatData | ConvertTo-Json -Depth 3) -Headers `$headers -TimeoutSec 30 | Out-Null
        Write-AgentLog "Heartbeat sent successfully"
        
    } catch {
        Write-AgentLog "Heartbeat failed: `$(`$_.Exception.Message)"
    }
}

function Check-Commands {
    param([object]`$Config)
    
    try {
        `$commandData = @{
            action = "get_commands"
            device_id = `$Config.device_id
        }
        
        `$headers = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer `$(`$Config.agent_token)"
        }
        
        `$response = Invoke-RestMethod -Uri "`$(`$Config.server_url)/functions/v1/rmm-command" -Method Post -Body (`$commandData | ConvertTo-Json) -Headers `$headers -TimeoutSec 30
        
        if (`$response.success -and `$response.commands) {
            foreach (`$command in `$response.commands) {
                Write-AgentLog "Executing command: `$(`$command.command)"
                
                `$result = @{
                    action = "command_result"
                    command_id = `$command.id
                    success = `$false
                    output = ""
                    error = ""
                }
                
                try {
                    switch (`$command.command_type) {
                        "powershell" {
                            `$output = Invoke-Expression `$command.command 2>&1
                            `$result.success = `$true
                            `$result.output = `$output -join "`n"
                        }
                        "cmd" {
                            `$output = cmd /c `$command.command 2>&1
                            `$result.success = `$true
                            `$result.output = `$output -join "`n"
                        }
                        default {
                            `$result.error = "Unknown command type"
                        }
                    }
                } catch {
                    `$result.error = `$_.Exception.Message
                }
                
                # Send result back
                try {
                    Invoke-RestMethod -Uri "`$(`$Config.server_url)/functions/v1/rmm-command" -Method Post -Body (`$result | ConvertTo-Json -Depth 3) -Headers `$headers -TimeoutSec 30 | Out-Null
                    Write-AgentLog "Command result sent for: `$(`$command.id)"
                } catch {
                    Write-AgentLog "Failed to send command result: `$(`$_.Exception.Message)"
                }
            }
        }
        
    } catch {
        Write-AgentLog "Error checking commands: `$(`$_.Exception.Message)"
    }
}

# Main service loop
Write-AgentLog "Starting Ultrium RMM Agent v2.1..."

`$config = Load-Config
if (-not `$config) {
    Write-AgentLog "ERROR: Could not load configuration"
    exit 1
}

Write-AgentLog "Loaded configuration for device: `$(`$config.device_id)"

# Main loop
while (`$true) {
    try {
        Send-Heartbeat -Config `$config
        Check-Commands -Config `$config
        
        Start-Sleep -Seconds `$config.heartbeat_interval
        
    } catch {
        Write-AgentLog "ERROR in main loop: `$(`$_.Exception.Message)"
        Start-Sleep -Seconds 60
    }
}
"@
    
    $ServiceScriptPath = "$InstallPath\service.ps1"
    $ServiceScriptContent | Out-File -FilePath $ServiceScriptPath -Encoding UTF8
    
    # Create Windows Service
    $servicePath = "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ServiceScriptPath`""
    
    try {
        # Stop and remove existing service if it exists
        if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
            Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
            sc.exe delete $ServiceName | Out-Null
            Start-Sleep -Seconds 3
        }
        
        # Create new service
        New-Service -Name $ServiceName -DisplayName $ServiceDisplayName -Description $ServiceDescription -BinaryPathName $servicePath -StartupType Automatic | Out-Null
        Write-Log "Service '$ServiceDisplayName' created successfully"
        
        # Start the service
        Start-Service -Name $ServiceName
        Write-Log "Service '$ServiceDisplayName' started successfully"
        
        # Wait and check status
        Start-Sleep -Seconds 5
        $service = Get-Service -Name $ServiceName
        
        if ($service.Status -eq "Running") {
            Write-Host ""
            Write-Host "=== INSTALLATION SUCCESSFUL ===" -ForegroundColor Green
            Write-Host "Ultrium RMM Agent v2.1 has been installed and started!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Device ID: $deviceId" -ForegroundColor Cyan
            Write-Host "Hostname: $($systemInfo.hostname)" -ForegroundColor Cyan
            Write-Host "IP Address: $($systemInfo.ip_address)" -ForegroundColor Cyan
            Write-Host "Installation Path: $InstallPath" -ForegroundColor Cyan
            Write-Host "Log File: $LogFile" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "The agent is now communicating with the Ultrium server and ready for remote management." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "To uninstall: .\UltriumRMMAgent-Installer.ps1 -Uninstall" -ForegroundColor Yellow
            Write-Host "To check status: .\UltriumRMMAgent-Installer.ps1 -Status" -ForegroundColor Yellow
        } else {
            Write-Host "WARNING: Service installed but not running properly." -ForegroundColor Red
            Write-Host "Check the log file at: $LogFile" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Log "ERROR: Failed to create or start service: $($_.Exception.Message)"
        exit 1
    }
}

function Uninstall-Agent {
    Write-Log "Uninstalling Ultrium RMM Agent..."
    
    if (-not (Test-Administrator)) {
        Write-Error "This script must be run as Administrator to uninstall the service."
        exit 1
    }
    
    try {
        # Stop and remove service
        if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
            Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
            sc.exe delete $ServiceName | Out-Null
            Write-Log "Service removed successfully"
        }
        
        # Remove installation directory
        if (Test-Path $InstallPath) {
            Remove-Item -Path $InstallPath -Recurse -Force
            Write-Log "Installation directory removed"
        }
        
        Write-Host "Ultrium RMM Agent uninstalled successfully!" -ForegroundColor Green
        
    } catch {
        Write-Log "ERROR during uninstall: $($_.Exception.Message)"
        exit 1
    }
}

function Show-Status {
    Write-Host "=== Ultrium RMM Agent Status ===" -ForegroundColor Cyan
    
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host "Service Status: $($service.Status)" -ForegroundColor $(if ($service.Status -eq "Running") { "Green" } else { "Red" })
        Write-Host "Service Start Type: $($service.StartType)" -ForegroundColor Yellow
    } else {
        Write-Host "Service Status: Not Installed" -ForegroundColor Red
    }
    
    if (Test-Path $ConfigFile) {
        $config = Get-Content $ConfigFile | ConvertFrom-Json
        Write-Host ""
        Write-Host "Configuration:" -ForegroundColor Yellow
        Write-Host "  Device ID: $($config.device_id)" -ForegroundColor Cyan
        Write-Host "  Server URL: $($config.server_url)" -ForegroundColor Cyan
        Write-Host "  Company ID: $($config.company_id)" -ForegroundColor Cyan
        Write-Host "  Version: $($config.version)" -ForegroundColor Cyan
        Write-Host "  Install Date: $($config.install_date)" -ForegroundColor Cyan
    }
    
    if (Test-Path $LogFile) {
        Write-Host ""
        Write-Host "Recent Log Entries:" -ForegroundColor Yellow
        Get-Content $LogFile -Tail 5 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    }
}

function Show-Usage {
    Write-Host "Ultrium RMM Agent Installer v2.1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  Install:   .\UltriumRMMAgent-Installer.ps1 -Install -AgentToken <token> -CompanyId <company-id>"
    Write-Host "  Uninstall: .\UltriumRMMAgent-Installer.ps1 -Uninstall"
    Write-Host "  Status:    .\UltriumRMMAgent-Installer.ps1 -Status"
    Write-Host "  Start:     .\UltriumRMMAgent-Installer.ps1 -Start"
    Write-Host "  Stop:      .\UltriumRMMAgent-Installer.ps1 -Stop"
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Yellow
    Write-Host "  -AgentToken: API token from Ultrium dashboard (required for install)"
    Write-Host "  -CompanyId:  Your company ID from Ultrium dashboard"
    Write-Host "  -MSPId:      Your MSP ID (optional)"
    Write-Host "  -ServerUrl:  Custom server URL (optional, defaults to Ultrium cloud)"
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Green
    Write-Host "  .\UltriumRMMAgent-Installer.ps1 -Install -AgentToken 'abc123' -CompanyId 'company456'"
}

# Main execution
try {
    if ($Install) {
        Install-Agent
    } elseif ($Uninstall) {
        Uninstall-Agent
    } elseif ($Start) {
        Start-Service -Name $ServiceName
        Write-Host "Service started" -ForegroundColor Green
    } elseif ($Stop) {
        Stop-Service -Name $ServiceName -Force
        Write-Host "Service stopped" -ForegroundColor Yellow
    } elseif ($Status) {
        Show-Status
    } else {
        Show-Usage
    }
} catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    exit 1
}