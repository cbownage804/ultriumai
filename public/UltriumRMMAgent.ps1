# Ultrium RMM Agent - Universal Edition
# Version: 2.0.0
# Supports: Individual Users, MSP Clients, and Business Customers

param(
    [string]$ConnectorKey = "",
    [string]$ClientCode = "",
    [string]$ConfigUrl = "",
    [string]$DeviceIP = "",
    [string]$DeviceName = "",
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Service,
    [switch]$Interactive,
    [string]$ConfigFile = ""
)

# Dynamic Configuration Loading
function Load-ClientConfiguration {
    Write-Log "Loading client configuration..."
    
    # Priority order for configuration:
    # 1. Command line parameters
    # 2. Configuration file
    # 3. Download from ConfigUrl
    # 4. Interactive prompt
    
    if ($ConfigFile -and (Test-Path $ConfigFile)) {
        Write-Log "Loading configuration from file: $ConfigFile"
        $Config = Get-Content $ConfigFile | ConvertFrom-Json
        
        if ($Config.ConnectorKey) { $Script:Config.ConnectorKey = $Config.ConnectorKey }
        if ($Config.ClientCode) { $Script:Config.ClientCode = $Config.ClientCode }
        if ($Config.ClientName) { $Script:Config.ClientName = $Config.ClientName }
        if ($Config.ApiUrl) { $Script:Config.ApiUrl = $Config.ApiUrl }
    }
    elseif ($ConfigUrl) {
        Write-Log "Downloading configuration from: $ConfigUrl"
        try {
            $Config = Invoke-RestMethod -Uri $ConfigUrl -Method GET -TimeoutSec 30
            
            if ($Config.ConnectorKey) { $Script:Config.ConnectorKey = $Config.ConnectorKey }
            if ($Config.ClientCode) { $Script:Config.ClientCode = $Config.ClientCode }
            if ($Config.ClientName) { $Script:Config.ClientName = $Config.ClientName }
            if ($Config.ApiUrl) { $Script:Config.ApiUrl = $Config.ApiUrl }
            
            Write-Log "Configuration downloaded successfully for client: $($Config.ClientName)"
        }
        catch {
            Write-Log "Failed to download configuration: $($_.Exception.Message)" "ERROR"
        }
    }
    
    # Apply command line overrides
    if ($ConnectorKey) { $Script:Config.ConnectorKey = $ConnectorKey }
    if ($ClientCode) { $Script:Config.ClientCode = $ClientCode }
    
    # Update device name with client code if available
    if ($Script:Config.ClientCode) {
        $Script:Config.DeviceName = "$($Script:Config.DeviceName)-$($Script:Config.ClientCode)"
    }
}

# Configuration
$Script:Config = @{
    ApiUrl = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1"
    StorageUrl = "https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/rmm-agents"
    ConnectorKey = $ConnectorKey
    ClientCode = $ClientCode
    ClientName = ""
    DeviceIP = if ($DeviceIP) { $DeviceIP } else { (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress }
    DeviceName = if ($DeviceName) { $DeviceName } else { $env:COMPUTERNAME }
    CheckinInterval = 300 # 5 minutes
    MetricsInterval = 60  # 1 minute
    LogPath = "$env:ProgramData\UltriumRMM\agent.log"
    ServiceName = "UltriumRMMAgent"
    ServiceDisplayName = "Ultrium RMM Agent"
    MSIFileName = "UltriumRMMAgent.msi"
}

# Load configuration from various sources
Load-ClientConfiguration

# Ensure log directory exists
$LogDir = Split-Path $Script:Config.LogPath -Parent
if (!(Test-Path $LogDir)) {
    New-Item -Path $LogDir -ItemType Directory -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Write-Host $LogMessage
    Add-Content -Path $Script:Config.LogPath -Value $LogMessage
}

# System Information Collection
function Get-SystemInfo {
    try {
        $OS = Get-WmiObject Win32_OperatingSystem
        $CPU = Get-WmiObject Win32_Processor | Select-Object -First 1
        $Memory = Get-WmiObject Win32_ComputerSystem
        $Disk = Get-WmiObject Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 }
        
        return @{
            hostname = $Script:Config.DeviceName
            ip_address = $Script:Config.DeviceIP
            os_name = $OS.Caption
            os_version = $OS.Version
            cpu_model = $CPU.Name
            cpu_cores = $CPU.NumberOfCores
            total_ram = [math]::Round($Memory.TotalPhysicalMemory / 1GB, 2)
            disk_info = $Disk | ForEach-Object { 
                @{
                    drive = $_.DeviceID
                    total = [math]::Round($_.Size / 1GB, 2)
                    free = [math]::Round($_.FreeSpace / 1GB, 2)
                }
            }
            domain = $env:USERDOMAIN
            last_boot = (Get-Date $OS.LastBootUpTime)
            timezone = (Get-TimeZone).Id
        }
    }
    catch {
        Write-Log "Error collecting system info: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Performance Metrics Collection
function Get-PerformanceMetrics {
    try {
        $CPU = (Get-Counter "\Processor(_Total)\% Processor Time").CounterSamples[0].CookedValue
        $Memory = Get-WmiObject Win32_OperatingSystem
        $MemoryUsed = (($Memory.TotalVisibleMemorySize - $Memory.FreePhysicalMemory) / $Memory.TotalVisibleMemorySize) * 100
        
        $DiskUsage = 0
        $Disks = Get-WmiObject Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 }
        foreach ($Disk in $Disks) {
            $DiskUsage += (($Disk.Size - $Disk.FreeSpace) / $Disk.Size) * 100
        }
        $DiskUsage = $DiskUsage / $Disks.Count
        
        return @{
            cpu_usage = [math]::Round($CPU, 2)
            ram_usage = [math]::Round($MemoryUsed, 2)
            disk_usage = [math]::Round($DiskUsage, 2)
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
    }
    catch {
        Write-Log "Error collecting performance metrics: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Network Security Check
function Get-SecurityStatus {
    try {
        $Firewall = Get-NetFirewallProfile | Where-Object { $_.Enabled -eq $true }
        $Antivirus = Get-WmiObject -Namespace "root\SecurityCenter2" -Class AntiVirusProduct -ErrorAction SilentlyContinue
        $Updates = Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 10
        
        return @{
            firewall_enabled = $Firewall.Count -gt 0
            antivirus_products = $Antivirus | ForEach-Object { $_.displayName }
            recent_updates = $Updates | ForEach-Object { 
                @{
                    kb = $_.HotFixID
                    installed = $_.InstalledOn
                }
            }
            windows_defender = (Get-MpComputerStatus -ErrorAction SilentlyContinue).AntivirusEnabled
        }
    }
    catch {
        Write-Log "Error collecting security status: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Process and Service Monitoring
function Get-ProcessInfo {
    try {
        $TopProcesses = Get-Process | Sort-Object CPU -Descending | Select-Object -First 10
        $Services = Get-Service | Where-Object { $_.Status -eq "Stopped" -and $_.StartType -eq "Automatic" }
        
        return @{
            top_cpu_processes = $TopProcesses | ForEach-Object {
                @{
                    name = $_.ProcessName
                    cpu = $_.CPU
                    memory = [math]::Round($_.WorkingSet / 1MB, 2)
                    pid = $_.Id
                }
            }
            failed_services = $Services | ForEach-Object {
                @{
                    name = $_.Name
                    display_name = $_.DisplayName
                    status = $_.Status
                }
            }
        }
    }
    catch {
        Write-Log "Error collecting process info: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# API Communication
function Invoke-ApiCall {
    param(
        [string]$Endpoint,
        [hashtable]$Body,
        [string]$Method = "POST"
    )
    
    try {
        $Headers = @{
            "Content-Type" = "application/json"
        }
        
        $JsonBody = $Body | ConvertTo-Json -Depth 10
        $Url = "$($Script:Config.ApiUrl)/$Endpoint"
        
        Write-Log "Making API call to: $Url" "DEBUG"
        
        $Response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $JsonBody -TimeoutSec 30
        return $Response
    }
    catch {
        Write-Log "API call failed: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Device Registration/Check-in
function Start-DeviceCheckin {
    Write-Log "Starting device check-in..."
    
    $SystemInfo = Get-SystemInfo
    if (!$SystemInfo) {
        Write-Log "Failed to collect system info for check-in" "ERROR"
        return
    }
    
    $SecurityStatus = Get-SecurityStatus
    $ProcessInfo = Get-ProcessInfo
    
    $CheckinData = @{
        connector_key = $Script:Config.ConnectorKey
        device_info = $SystemInfo
        security_status = $SecurityStatus
        process_info = $ProcessInfo
        agent_version = "1.0.0"
        agent_type = "powershell"
    }
    
    $Response = Invoke-ApiCall -Endpoint "rmm-agent-checkin" -Body $CheckinData
    if ($Response) {
        Write-Log "Device check-in successful"
        return $Response.device_id
    } else {
        Write-Log "Device check-in failed" "ERROR"
        return $null
    }
}

# Metrics Reporting
function Send-Metrics {
    param([string]$DeviceId)
    
    if (!$DeviceId) {
        Write-Log "No device ID available for metrics" "ERROR"
        return
    }
    
    $Metrics = Get-PerformanceMetrics
    if (!$Metrics) {
        Write-Log "Failed to collect metrics" "ERROR"
        return
    }
    
    $MetricsData = @{
        connector_key = $Script:Config.ConnectorKey
        device_id = $DeviceId
        metrics = $Metrics
    }
    
    $Response = Invoke-ApiCall -Endpoint "rmm-agent-metrics" -Body $MetricsData
    if ($Response) {
        Write-Log "Metrics sent successfully"
    } else {
        Write-Log "Failed to send metrics" "ERROR"
    }
}

# Command Execution
function Invoke-RemoteCommand {
    param(
        [string]$Command,
        [string]$CommandId
    )
    
    try {
        Write-Log "Executing command: $Command"
        
        $Output = ""
        $Error = ""
        
        if ($Command.StartsWith("Get-") -or $Command.StartsWith("Test-") -or $Command.StartsWith("Show-")) {
            # Safe PowerShell commands
            $Result = Invoke-Expression $Command 2>&1
            if ($Result) {
                $Output = $Result | Out-String
            }
        } elseif ($Command.StartsWith("cmd:")) {
            # CMD commands
            $CmdCommand = $Command.Substring(4)
            $Result = cmd /c $CmdCommand 2>&1
            $Output = $Result | Out-String
        } else {
            $Error = "Command type not supported or potentially unsafe"
        }
        
        # Send result back
        $ResultData = @{
            connector_key = $Script:Config.ConnectorKey
            command_id = $CommandId
            output = $Output
            error = $Error
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
        
        Invoke-ApiCall -Endpoint "rmm-command-result" -Body $ResultData
        Write-Log "Command execution completed"
        
    } catch {
        Write-Log "Command execution failed: $($_.Exception.Message)" "ERROR"
        
        $ResultData = @{
            connector_key = $Script:Config.ConnectorKey
            command_id = $CommandId
            output = ""
            error = $_.Exception.Message
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
        
        Invoke-ApiCall -Endpoint "rmm-command-result" -Body $ResultData
    }
}

# Check for pending commands
function Get-PendingCommands {
    param([string]$DeviceId)
    
    if (!$DeviceId) { return }
    
    $CommandData = @{
        connector_key = $Script:Config.ConnectorKey
        device_id = $DeviceId
    }
    
    $Response = Invoke-ApiCall -Endpoint "rmm-get-commands" -Body $CommandData
    if ($Response -and $Response.commands) {
        foreach ($Command in $Response.commands) {
            Invoke-RemoteCommand -Command $Command.command -CommandId $Command.id
        }
    }
}

# MSI Download and Installation
function Install-MSIAgent {
    param([string]$UserId)
    
    Write-Log "Searching for available MSI installers..."
    
    try {
        # Get list of available MSI files for the user
        $ListUrl = "$($Script:Config.StorageUrl)/"
        $Response = Invoke-RestMethod -Uri $ListUrl -Method GET -ErrorAction SilentlyContinue
        
        # Find the first MSI file for this user
        $MSIFile = $null
        if ($UserId) {
            # Try to find user-specific MSI
            $MSIFile = "$UserId/UltriumRMMAgent.msi"
            $DownloadUrl = "$($Script:Config.StorageUrl)/$MSIFile"
            
            try {
                # Test if user-specific MSI exists
                $TestResponse = Invoke-WebRequest -Uri $DownloadUrl -Method HEAD -ErrorAction Stop
                Write-Log "Found user-specific MSI: $MSIFile"
            }
            catch {
                # Fallback to generic MSI location
                $MSIFile = "shared/UltriumRMMAgent.msi"
                $DownloadUrl = "$($Script:Config.StorageUrl)/$MSIFile"
                Write-Log "User-specific MSI not found, trying shared location"
            }
        } else {
            # Use generic MSI location
            $MSIFile = "shared/UltriumRMMAgent.msi"
            $DownloadUrl = "$($Script:Config.StorageUrl)/$MSIFile"
        }
        
        $TempPath = "$env:TEMP\UltriumRMMAgent.msi"
        
        Write-Log "Downloading MSI from: $DownloadUrl"
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempPath -TimeoutSec 300
        
        if (Test-Path $TempPath) {
            Write-Log "MSI downloaded successfully. Installing..."
            
            # Install MSI silently
            $Arguments = "/i `"$TempPath`" /quiet /norestart CONNECTOR_KEY=`"$($Script:Config.ConnectorKey)`""
            $Process = Start-Process -FilePath "msiexec.exe" -ArgumentList $Arguments -Wait -PassThru
            
            if ($Process.ExitCode -eq 0) {
                Write-Log "MSI installation completed successfully"
                
                # Clean up temp file
                Remove-Item $TempPath -Force -ErrorAction SilentlyContinue
                
                return $true
            } else {
                Write-Log "MSI installation failed with exit code: $($Process.ExitCode)" "ERROR"
                return $false
            }
        } else {
            Write-Log "Failed to download MSI file" "ERROR"
            return $false
        }
        
    } catch {
        Write-Log "MSI installation error: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Service Installation
function Install-Service {
    Write-Log "Installing Ultrium RMM Agent as Windows Service..."
    
    try {
        $ServicePath = "`"$PSCommandPath`" -Service -ConnectorKey `"$($Script:Config.ConnectorKey)`""
        
        # Create service
        New-Service -Name $Script:Config.ServiceName -DisplayName $Script:Config.ServiceDisplayName -BinaryPathName "powershell.exe -ExecutionPolicy Bypass -File $ServicePath" -StartupType Automatic
        
        Write-Log "Service installed successfully"
        Write-Log "Starting service..."
        Start-Service -Name $Script:Config.ServiceName
        Write-Log "Service started successfully"
        
    } catch {
        Write-Log "Service installation failed: $($_.Exception.Message)" "ERROR"
    }
}

# Service Removal
function Uninstall-Service {
    Write-Log "Uninstalling Ultrium RMM Agent service..."
    
    try {
        Stop-Service -Name $Script:Config.ServiceName -Force -ErrorAction SilentlyContinue
        Remove-Service -Name $Script:Config.ServiceName
        Write-Log "Service uninstalled successfully"
    } catch {
        Write-Log "Service uninstallation failed: $($_.Exception.Message)" "ERROR"
    }
}

# Main Agent Loop
function Start-AgentLoop {
    Write-Log "Starting Ultrium RMM Agent v1.0.0"
    Write-Log "Device: $($Script:Config.DeviceName) ($($Script:Config.DeviceIP))"
    Write-Log "Connector Key: $($Script:Config.ConnectorKey)"
    
    if (!$Script:Config.ConnectorKey) {
        Write-Log "No connector key provided. Agent cannot start." "ERROR"
        return
    }
    
    $DeviceId = $null
    $LastCheckin = 0
    $LastMetrics = 0
    
    while ($true) {
        try {
            $CurrentTime = [DateTimeOffset]::Now.ToUnixTimeSeconds()
            
            # Device check-in
            if (($CurrentTime - $LastCheckin) -ge $Script:Config.CheckinInterval) {
                $DeviceId = Start-DeviceCheckin
                $LastCheckin = $CurrentTime
            }
            
            # Send metrics
            if ($DeviceId -and ($CurrentTime - $LastMetrics) -ge $Script:Config.MetricsInterval) {
                Send-Metrics -DeviceId $DeviceId
                $LastMetrics = $CurrentTime
            }
            
            # Check for pending commands
            if ($DeviceId) {
                Get-PendingCommands -DeviceId $DeviceId
            }
            
            Start-Sleep -Seconds 30
            
        } catch {
            Write-Log "Agent loop error: $($_.Exception.Message)" "ERROR"
            Start-Sleep -Seconds 60
        }
    }
}

# Main execution logic
try {
    if ($Install) {
        Install-Service
    } elseif ($Uninstall) {
        Uninstall-Service
    } elseif ($Service) {
        Start-AgentLoop
    } else {
        # Interactive mode
        Write-Host "Ultrium RMM Agent - PowerShell Edition"
        Write-Host "======================================"
        Write-Host ""
        
        if (!$Script:Config.ConnectorKey) {
            $Script:Config.ConnectorKey = Read-Host "Enter Connector Key"
        }
        
        Write-Host "Device Name: $($Script:Config.DeviceName)"
        Write-Host "Device IP: $($Script:Config.DeviceIP)"
        Write-Host "Connector Key: $($Script:Config.ConnectorKey)"
        Write-Host ""
        
        $Choice = Read-Host "Choose action: (R)un Agent, (I)nstall Service, (T)est Connection, (Q)uit"
        
        switch ($Choice.ToUpper()) {
            "R" { Start-AgentLoop }
            "I" { Install-Service }
            "T" { 
                Write-Host "Testing connection..."
                $DeviceId = Start-DeviceCheckin
                if ($DeviceId) {
                    Write-Host "Connection successful! Device ID: $DeviceId" -ForegroundColor Green
                } else {
                    Write-Host "Connection failed!" -ForegroundColor Red
                }
            }
            "Q" { exit }
            default { Write-Host "Invalid choice" }
        }
    }
    
} catch {
    Write-Log "Critical error: $($_.Exception.Message)" "ERROR"
    Write-Host "Critical error occurred. Check log at: $($Script:Config.LogPath)" -ForegroundColor Red
}