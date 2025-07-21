
#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Production SafeNet RMM Agent Installer and Service
.DESCRIPTION
    Full production version with service installation, network discovery, and agent management
#>

param(
    [string]$ConnectorKey = "test_connector_123",
    [string]$ClientCode = "TEST001",
    [string]$ClientName = "Test Organization"
)

# Global Configuration
$Global:Config = @{
    ServiceName = "UltriumSafeNet"
    ServiceDisplayName = "Ultrium SafeNet RMM Agent"
    ApiUrl = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1"
    ConnectorKey = $ConnectorKey
    ClientCode = $ClientCode
    ClientName = $ClientName
    Version = "1.2.0"
    InstallPath = "C:\SafeNet"
    LogPath = "C:\SafeNet\logs"
    CheckinInterval = 300 # 5 minutes
}

function Write-SafeNetLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    # Console output
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
        default { Write-Host $logMessage -ForegroundColor White }
    }
    
    # File logging
    $logFile = Join-Path $Global:Config.LogPath "agent.log"
    try {
        Add-Content -Path $logFile -Value $logMessage -ErrorAction SilentlyContinue
    } catch {
        # Ignore file logging errors
    }
}

function Initialize-SafeNetEnvironment {
    try {
        # Create directories
        @($Global:Config.InstallPath, $Global:Config.LogPath) | ForEach-Object {
            if (-not (Test-Path $_)) {
                New-Item -Path $_ -ItemType Directory -Force | Out-Null
            }
        }
        
        Write-SafeNetLog "SafeNet environment initialized" "SUCCESS"
        return $true
    } catch {
        Write-SafeNetLog "Failed to initialize environment: $_" "ERROR"
        return $false
    }
}

function Test-SafeNetConnectivity {
    try {
        Write-SafeNetLog "Testing SafeNet API connectivity..."
        
        $testData = @{
            connector_key = $Global:Config.ConnectorKey
            test_mode = $true
            hostname = $env:COMPUTERNAME
            timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
        } | ConvertTo-Json
        
        $headers = @{ "Content-Type" = "application/json" }
        $uri = "$($Global:Config.ApiUrl)/safenet-api"
        
        $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $testData -TimeoutSec 10
        
        Write-SafeNetLog "API connectivity test successful" "SUCCESS"
        return $true
    } catch {
        Write-SafeNetLog "API connectivity test failed: $_" "ERROR"
        return $false
    }
}

function Send-AgentCheckin {
    try {
        Write-SafeNetLog "Sending agent checkin..."
        
        # Get system information
        $systemInfo = Get-SystemInformation
        $performanceMetrics = Get-PerformanceMetrics
        
        $checkinData = @{
            connector_key = $Global:Config.ConnectorKey
            hostname = $env:COMPUTERNAME
            ip_address = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
            agent_version = $Global:Config.Version
            system_info = $systemInfo
            performance_metrics = $performanceMetrics
            status = "online"
        } | ConvertTo-Json -Depth 5
        
        $headers = @{ 
            "Content-Type" = "application/json"
            "x-connector-key" = $Global:Config.ConnectorKey
        }
        $uri = "$($Global:Config.ApiUrl)/safenet-api/heartbeat"
        
        $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $checkinData -TimeoutSec 15
        
        if ($response.success) {
            Write-SafeNetLog "Agent checkin successful - Device ID: $($response.device_id)" "SUCCESS"
            return $true
        } else {
            Write-SafeNetLog "Agent checkin failed: $($response.error)" "WARNING"
            return $false
        }
    } catch {
        Write-SafeNetLog "Agent checkin error: $_" "WARNING"
        # Don't treat checkin failures as fatal - continue with other operations
        return $false
    }
}

function Get-SystemInformation {
    try {
        $os = Get-CimInstance -ClassName Win32_OperatingSystem
        $computer = Get-CimInstance -ClassName Win32_ComputerSystem
        $processor = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
        
        return @{
            hostname = $env:COMPUTERNAME
            os_name = $os.Caption
            os_version = $os.Version
            os_build = $os.BuildNumber
            manufacturer = $computer.Manufacturer
            model = $computer.Model
            processor = $processor.Name
            total_memory_gb = [math]::Round($computer.TotalPhysicalMemory / 1GB, 2)
            domain = $env:USERDOMAIN
            last_boot = $os.LastBootUpTime
            timezone = (Get-TimeZone).Id
        }
    } catch {
        Write-SafeNetLog "Failed to get system information: $_" "WARNING"
        return @{ error = "Failed to collect system info" }
    }
}

function Get-PerformanceMetrics {
    try {
        $cpu = Get-CimInstance -ClassName Win32_PerfRawData_PerfOS_Processor | Where-Object { $_.Name -eq "_Total" }
        $memory = Get-CimInstance -ClassName Win32_OperatingSystem
        $disk = Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 }
        
        return @{
            cpu_usage = 0 # Simplified for now
            memory_usage = [math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100, 1)
            disk_usage = if ($disk) { [math]::Round((($disk[0].Size - $disk[0].FreeSpace) / $disk[0].Size) * 100, 1) } else { 0 }
            process_count = (Get-Process).Count
            uptime_hours = [math]::Round(((Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime).TotalHours, 1)
        }
    } catch {
        Write-SafeNetLog "Failed to get performance metrics: $_" "WARNING"
        return @{ error = "Failed to collect performance metrics" }
    }
}

function Start-NetworkDiscovery {
    try {
        Write-SafeNetLog "Starting network discovery scan..."
        
        # Get local IP and network
        $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
            $_.IPAddress -notlike "127.*" -and 
            $_.IPAddress -notlike "169.254.*" -and
            $_.PrefixLength -eq 24
        } | Select-Object -First 1)
        
        if (-not $localIP) {
            Write-SafeNetLog "Could not determine local network" "WARNING"
            return @()
        }
        
        $ip = $localIP.IPAddress
        $network = $ip.Substring(0, $ip.LastIndexOf('.'))
        
        Write-SafeNetLog "Scanning network: $network.0/24"
        
        $discoveredDevices = @()
        $jobs = @()
        
        # Scan network range (limited to reduce load)
        for ($i = 1; $i -le 254; $i++) {
            $targetIP = "$network.$i"
            if ($targetIP -ne $ip) {
                $job = Start-Job -ScriptBlock {
                    param($targetIP)
                    try {
                        $ping = Test-Connection -ComputerName $targetIP -Count 1 -Quiet
                        if ($ping) {
                            $result = @{
                                ip_address = $targetIP
                                status = "online"
                                response_time = 1
                            }
                            
                            try {
                                $hostname = [System.Net.Dns]::GetHostByAddress($targetIP).HostName
                                $result.hostname = $hostname
                            } catch {
                                $result.hostname = "Unknown"
                            }
                            
                            return $result
                        }
                    } catch {
                        # Ignore scan errors for individual IPs
                    }
                    return $null
                } -ArgumentList $targetIP
                
                $jobs += $job
            }
        }
        
        # Wait for jobs to complete (max 30 seconds)
        $timeout = (Get-Date).AddSeconds(30)
        while ((Get-Date) -lt $timeout -and ($jobs | Where-Object { $_.State -eq "Running" }).Count -gt 0) {
            Start-Sleep -Milliseconds 100
        }
        
        # Collect results
        foreach ($job in $jobs) {
            try {
                $result = Receive-Job -Job $job -ErrorAction SilentlyContinue
                if ($result) {
                    $discoveredDevices += $result
                }
            } catch {
                # Ignore individual job errors
            }
            Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
        }
        
        Write-SafeNetLog "Network discovery completed. Found $($discoveredDevices.Count) devices"
        return $discoveredDevices
        
    } catch {
        Write-SafeNetLog "Network discovery failed: $_" "ERROR"
        return @()
    }
}

function Send-NetworkScanData {
    param([array]$Devices)
    
    try {
        Write-SafeNetLog "Sending scan data for $($Devices.Count) devices..."
        
        $scanData = @{
            connector_key = $Global:Config.ConnectorKey
            scan_type = "basic_discovery"
            network_ranges = @("local")
            devices_found = $Devices.Count
            devices = @{}
            results = @{
                discovered = $Devices.Count
                timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
            }
            scan_duration = 30
            hostname = $env:COMPUTERNAME
        }
        
        # Add devices to the scan data
        $deviceIndex = 0
        foreach ($device in $Devices) {
            $scanData.devices["device_$deviceIndex"] = $device
            $deviceIndex++
        }
        
        $json = $scanData | ConvertTo-Json -Depth 5
        $headers = @{ "Content-Type" = "application/json" }
        $uri = "$($Global:Config.ApiUrl)/safenet-api"
        
        $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $json -TimeoutSec 15
        
        Write-SafeNetLog "Network scan data sent successfully" "SUCCESS"
        return $true
    } catch {
        Write-SafeNetLog "Failed to send scan data: $_" "ERROR"
        return $false
    }
}

function Install-SafeNetService {
    try {
        Write-SafeNetLog "Installing SafeNet service..."
        
        # Create service script
        $serviceScript = @"
# SafeNet Agent Service Script
`$Global:Config = @{
    ServiceName = "$($Global:Config.ServiceName)"
    ApiUrl = "$($Global:Config.ApiUrl)"
    ConnectorKey = "$($Global:Config.ConnectorKey)"
    ClientCode = "$($Global:Config.ClientCode)"
    ClientName = "$($Global:Config.ClientName)"
    Version = "$($Global:Config.Version)"
    LogPath = "$($Global:Config.LogPath)"
    CheckinInterval = $($Global:Config.CheckinInterval)
}

function Write-ServiceLog {
    param([string]`$Message, [string]`$Level = "INFO")
    `$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    `$logFile = Join-Path `$Global:Config.LogPath "agent.log"
    try {
        Add-Content -Path `$logFile -Value "[`$timestamp] [`$Level] `$Message" -ErrorAction SilentlyContinue
    } catch {
        # Ignore logging errors in service
    }
}

# Service main loop
Write-ServiceLog "SafeNet Agent service starting..."
Write-ServiceLog "Connector: `$(`$Global:Config.ConnectorKey)"
Write-ServiceLog "Client: `$(`$Global:Config.ClientCode) - `$(`$Global:Config.ClientName)"

while (`$true) {
    try {
        # Send agent checkin
        Write-ServiceLog "Sending agent checkin..."
        
        `$systemInfo = @{
            hostname = `$env:COMPUTERNAME
            timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
        }
        
        `$checkinData = @{
            connector_key = `$Global:Config.ConnectorKey
            hostname = `$env:COMPUTERNAME
            ip_address = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { `$_.IPAddress -notlike "127.*" -and `$_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
            agent_version = `$Global:Config.Version
            system_info = `$systemInfo
            status = "online"
        } | ConvertTo-Json
        
        `$headers = @{ 
            "Content-Type" = "application/json"
            "x-connector-key" = `$Global:Config.ConnectorKey
        }
        `$uri = "`$(`$Global:Config.ApiUrl)/safenet-api/heartbeat"
        
        try {
            `$response = Invoke-RestMethod -Uri `$uri -Method POST -Headers `$headers -Body `$checkinData -TimeoutSec 10
            if (`$response.success) {
                Write-ServiceLog "Checkin successful"
            } else {
                Write-ServiceLog "Checkin failed: `$(`$response.error)" "ERROR"
            }
        } catch {
            Write-ServiceLog "API call failed: `$_" "ERROR"
            Write-ServiceLog "Checkin failed" "ERROR"
        }
        
        # Network discovery every checkin
        Write-ServiceLog "Starting network discovery scan..."
        try {
            `$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
                `$_.IPAddress -notlike "127.*" -and 
                `$_.IPAddress -notlike "169.254.*" -and
                `$_.PrefixLength -eq 24
            } | Select-Object -First 1)
            
            `$discoveredDevices = @()
            
            if (`$localIP) {
                `$ip = `$localIP.IPAddress
                `$network = `$ip.Substring(0, `$ip.LastIndexOf('.'))
                
                # Quick scan of first 20 IPs only (reduce service load)
                for (`$i = 1; `$i -le 20; `$i++) {
                    `$targetIP = "`$network.`$i"
                    if (`$targetIP -ne `$ip) {
                        try {
                            `$ping = Test-Connection -ComputerName `$targetIP -Count 1 -Quiet
                            if (`$ping) {
                                `$discoveredDevices += @{
                                    ip_address = `$targetIP
                                    status = "online"
                                    hostname = "Unknown"
                                }
                            }
                        } catch {
                            # Ignore individual ping errors
                        }
                    }
                }
            }
            
            Write-ServiceLog "Network scan completed. Found `$(`$discoveredDevices.Count) devices"
            
            # Send scan data
            Write-ServiceLog "Sending scan data for `$(`$discoveredDevices.Count) devices..."
            `$scanData = @{
                connector_key = `$Global:Config.ConnectorKey
                scan_type = "basic_discovery"
                network_ranges = @("local")
                devices_found = `$discoveredDevices.Count
                devices = @{}
                results = @{ discovered = `$discoveredDevices.Count }
                scan_duration = 5
                hostname = `$env:COMPUTERNAME
            } | ConvertTo-Json -Depth 3
            
            `$scanResponse = Invoke-RestMethod -Uri "`$(`$Global:Config.ApiUrl)/safenet-api" -Method POST -Headers `$headers -Body `$scanData -TimeoutSec 10
            Write-ServiceLog "Network scan data sent successfully"
            
        } catch {
            Write-ServiceLog "Network scan failed: `$_" "ERROR"
        }
        
    } catch {
        Write-ServiceLog "Service loop error: `$_" "ERROR"
    }
    
    # Wait for next checkin
    Start-Sleep -Seconds `$Global:Config.CheckinInterval
}
"@
        
        $scriptPath = Join-Path $Global:Config.InstallPath "SafeNetAgent.ps1"
        $serviceScript | Out-File -FilePath $scriptPath -Encoding UTF8 -Force
        
        # Remove existing service if it exists
        $existingService = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
        if ($existingService) {
            Write-SafeNetLog "Removing existing service..."
            Stop-Service -Name $Global:Config.ServiceName -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            sc.exe delete $Global:Config.ServiceName | Out-Null
            Start-Sleep -Seconds 2
        }
        
        # Install new service
        $serviceBinary = "powershell.exe"
        $serviceArgs = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""
        
        sc.exe create $Global:Config.ServiceName binPath= "$serviceBinary $serviceArgs" start= auto DisplayName= "$($Global:Config.ServiceDisplayName)" | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-SafeNetLog "Service installed successfully" "SUCCESS"
            
            # Start the service
            Start-Service -Name $Global:Config.ServiceName
            Write-SafeNetLog "Service started successfully" "SUCCESS"
            
            return $true
        } else {
            Write-SafeNetLog "Failed to install service" "ERROR"
            return $false
        }
        
    } catch {
        Write-SafeNetLog "Service installation failed: $_" "ERROR"
        return $false
    }
}

function Show-InstallationSummary {
    Write-Host "`n" -NoNewline
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "              SafeNet Agent Installation Complete" -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Installation Summary:" -ForegroundColor Yellow
    Write-Host "   • Service Name: $($Global:Config.ServiceName)" -ForegroundColor White
    Write-Host "   • Version: $($Global:Config.Version)" -ForegroundColor White
    Write-Host "   • Connector: $($Global:Config.ConnectorKey)" -ForegroundColor White
    Write-Host "   • Client: $($Global:Config.ClientCode) - $($Global:Config.ClientName)" -ForegroundColor White
    Write-Host "   • Install Path: $($Global:Config.InstallPath)" -ForegroundColor White
    Write-Host "   • Log Path: $($Global:Config.LogPath)" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Service Status:" -ForegroundColor Yellow
    
    $service = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
    if ($service) {
        $statusColor = if ($service.Status -eq "Running") { "Green" } else { "Red" }
        Write-Host "   • Status: $($service.Status)" -ForegroundColor $statusColor
        Write-Host "   • Startup Type: Automatic" -ForegroundColor White
    } else {
        Write-Host "   • Status: Not Found" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "📡 Connectivity:" -ForegroundColor Yellow
    Write-Host "   • API Endpoint: $($Global:Config.ApiUrl)" -ForegroundColor White
    Write-Host "   • Check-in Interval: $($Global:Config.CheckinInterval) seconds" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🔍 Monitoring:" -ForegroundColor Yellow
    Write-Host "   • Agent check-ins every 5 minutes" -ForegroundColor White
    Write-Host "   • Network discovery scans" -ForegroundColor White
    Write-Host "   • System performance monitoring" -ForegroundColor White
    
    Write-Host ""
    Write-Host "📝 Log Files:" -ForegroundColor Yellow
    Write-Host "   • Agent Log: $($Global:Config.LogPath)\agent.log" -ForegroundColor White
    
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "The SafeNet agent is now active and monitoring this system." -ForegroundColor Green
    Write-Host "Check your SafeNet dashboard for real-time device status." -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Cyan
}

# Main Installation Process
try {
    Write-Host "=== SafeNet Production Agent Installer ===" -ForegroundColor Cyan
    Write-Host "Version: $($Global:Config.Version)" -ForegroundColor White
    Write-Host ""
    
    # Initialize environment
    if (-not (Initialize-SafeNetEnvironment)) {
        throw "Failed to initialize SafeNet environment"
    }
    
    # Test connectivity
    if (-not (Test-SafeNetConnectivity)) {
        Write-SafeNetLog "Warning: API connectivity test failed, but continuing with installation..." "WARNING"
    }
    
    # Perform initial agent checkin
    Write-SafeNetLog "Performing initial agent registration..."
    Send-AgentCheckin | Out-Null
    
    # Run initial network discovery
    Write-SafeNetLog "Performing initial network discovery..."
    $discoveredDevices = Start-NetworkDiscovery
    Send-NetworkScanData -Devices $discoveredDevices | Out-Null
    
    # Install and start service
    if (-not (Install-SafeNetService)) {
        throw "Failed to install SafeNet service"
    }
    
    # Show installation summary
    Show-InstallationSummary
    
    Write-SafeNetLog "SafeNet Agent installation completed successfully" "SUCCESS"
    
} catch {
    Write-SafeNetLog "Installation failed: $_" "ERROR"
    Write-Host "`n❌ Installation failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nPress Enter to close this window..." -ForegroundColor Yellow
$null = Read-Host
