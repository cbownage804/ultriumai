# Vanguard Network Scanning Agent for Windows
# PowerShell-based agent for internal network penetration testing

param(
    [Parameter(Mandatory=$false)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$ConnectorName = $env:COMPUTERNAME,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "Unknown",
    
    [Parameter(Mandatory=$false)]
    [switch]$Install,
    
    [Parameter(Mandatory=$false)]
    [switch]$Uninstall,
    
    [Parameter(Mandatory=$false)]
    [switch]$Service
)

# Global Configuration
$Global:Config = @{
    ServiceName = "VanguardNetworkAgent"
    ServiceDisplayName = "Vanguard Network Scanning Agent"
    InstallPath = "$env:ProgramFiles\Vanguard\NetworkAgent"
    ApiEndpoint = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-network-connector"
    LogPath = "$env:ProgramData\Vanguard\Logs\network-agent.log"
    ConfigPath = "$env:ProgramData\Vanguard\config.json"
    ConnectorId = [System.Guid]::NewGuid().ToString()
    HeartbeatInterval = 60 # seconds
    ScanTimeout = 1800 # 30 minutes
}

# Logging Function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    Write-Host $logMessage
    
    # Ensure log directory exists
    $logDir = Split-Path $Global:Config.LogPath -Parent
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    }
    
    Add-Content -Path $Global:Config.LogPath -Value $logMessage
}

# Configuration Management
function Save-Config {
    param([hashtable]$Config)
    
    $configDir = Split-Path $Global:Config.ConfigPath -Parent
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Force -Path $configDir | Out-Null
    }
    
    $Config | ConvertTo-Json -Depth 3 | Set-Content -Path $Global:Config.ConfigPath
    Write-Log "Configuration saved to $($Global:Config.ConfigPath)"
}

function Load-Config {
    if (Test-Path $Global:Config.ConfigPath) {
        try {
            $config = Get-Content -Path $Global:Config.ConfigPath | ConvertFrom-Json
            return $config
        } catch {
            Write-Log "Failed to load config: $($_.Exception.Message)" "ERROR"
            return $null
        }
    }
    return $null
}

# Network Scanning Functions
function Test-NmapAvailable {
    try {
        $nmap = Get-Command nmap -ErrorAction SilentlyContinue
        return $nmap -ne $null
    } catch {
        return $false
    }
}

function Install-Nmap {
    Write-Log "Installing Nmap..."
    
    try {
        # Download and install Nmap
        $nmapUrl = "https://nmap.org/dist/nmap-7.94-setup.exe"
        $nmapInstaller = "$env:TEMP\nmap-setup.exe"
        
        Write-Log "Downloading Nmap installer..."
        Invoke-WebRequest -Uri $nmapUrl -OutFile $nmapInstaller
        
        Write-Log "Installing Nmap silently..."
        Start-Process -FilePath $nmapInstaller -ArgumentList "/S" -Wait
        
        # Add Nmap to PATH
        $nmapPath = "${env:ProgramFiles(x86)}\Nmap"
        if (Test-Path $nmapPath) {
            $env:PATH += ";$nmapPath"
            [Environment]::SetEnvironmentVariable("PATH", $env:PATH, [EnvironmentVariableTarget]::Machine)
        }
        
        Remove-Item $nmapInstaller -Force
        Write-Log "Nmap installed successfully"
        return $true
    } catch {
        Write-Log "Failed to install Nmap: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Invoke-NetworkScan {
    param(
        [string[]]$Targets,
        [string]$ScanType = "discovery",
        [hashtable]$Options = @{}
    )
    
    $results = @()
    
    foreach ($target in $Targets) {
        Write-Log "Scanning target: $target"
        
        try {
            $scanResult = @{
                target = $target
                status = "completed"
                findings = @()
                metadata = @{
                    scanTime = Get-Date
                    toolsUsed = @()
                    coverage = 100
                }
            }
            
            switch ($ScanType) {
                "discovery" {
                    $nmapArgs = "-sn $target"
                    $scanResult.metadata.toolsUsed += "nmap"
                }
                "vulnerability" {
                    $nmapArgs = "-sV --script vuln $target"
                    $scanResult.metadata.toolsUsed += "nmap"
                }
                "compliance" {
                    $nmapArgs = "-sV --script ssl-enum-ciphers,ssh-audit $target"
                    $scanResult.metadata.toolsUsed += "nmap"
                }
                "full" {
                    $nmapArgs = "-sS -sV -O --script default,vuln $target"
                    $scanResult.metadata.toolsUsed += "nmap"
                }
            }
            
            if (Test-NmapAvailable) {
                Write-Log "Running nmap with args: $nmapArgs"
                $nmapOutput = & nmap $nmapArgs.Split(' ') 2>&1
                
                # Parse nmap output for findings
                $findings = Parse-NmapOutput -Output $nmapOutput -Target $target
                $scanResult.findings = $findings
                
            } else {
                # Fallback to PowerShell-based scanning
                Write-Log "Nmap not available, using PowerShell fallback"
                $findings = Invoke-PowerShellScan -Target $target -ScanType $ScanType
                $scanResult.findings = $findings
                $scanResult.metadata.toolsUsed += "powershell"
            }
            
            $results += $scanResult
            
        } catch {
            Write-Log "Scan failed for target $target`: $($_.Exception.Message)" "ERROR"
            $results += @{
                target = $target
                status = "failed"
                findings = @()
                metadata = @{
                    scanTime = Get-Date
                    error = $_.Exception.Message
                }
            }
        }
    }
    
    return $results
}

function Parse-NmapOutput {
    param([string]$Output, [string]$Target)
    
    $findings = @()
    $lines = $Output -split "`n"
    
    foreach ($line in $lines) {
        if ($line -match "(\d+)/tcp\s+open\s+(\w+)") {
            $port = $matches[1]
            $service = $matches[2]
            
            $finding = @{
                id = [System.Guid]::NewGuid().ToString()
                type = "exposure"
                severity = "info"
                title = "Open Port Detected"
                description = "Port $port is open running $service"
                target = $Target
                port = [int]$port
                service = $service
                impact = "Port may be accessible to attackers"
                recommendation = "Review if this service should be publicly accessible"
                evidence = @($line)
            }
            
            # Assess severity based on common vulnerable services
            if ($service -in @("telnet", "ftp", "smtp", "http")) {
                $finding.severity = "medium"
                $finding.impact = "Potentially insecure service exposed"
            }
            
            $findings += $finding
        }
        
        # Parse vulnerability script results
        if ($line -match "VULNERABLE") {
            $finding = @{
                id = [System.Guid]::NewGuid().ToString()
                type = "vulnerability"
                severity = "high"
                title = "Vulnerability Detected"
                description = $line.Trim()
                target = $Target
                impact = "System may be compromised"
                recommendation = "Apply security patches immediately"
                evidence = @($line)
            }
            
            $findings += $finding
        }
    }
    
    return $findings
}

function Invoke-PowerShellScan {
    param([string]$Target, [string]$ScanType)
    
    $findings = @()
    
    try {
        # Basic port scanning with PowerShell
        $commonPorts = @(21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 1433, 3389, 5432)
        
        foreach ($port in $commonPorts) {
            try {
                $tcpClient = New-Object System.Net.Sockets.TcpClient
                $result = $tcpClient.BeginConnect($Target, $port, $null, $null)
                $wait = $result.AsyncWaitHandle.WaitOne(1000, $false)
                
                if ($wait -and $tcpClient.Connected) {
                    $tcpClient.Close()
                    
                    $finding = @{
                        id = [System.Guid]::NewGuid().ToString()
                        type = "exposure"
                        severity = "info"
                        title = "Open Port Detected"
                        description = "Port $port is open"
                        target = $Target
                        port = $port
                        impact = "Port may be accessible to attackers"
                        recommendation = "Review if this service should be accessible"
                        evidence = @("TCP connection successful to ${Target}:${port}")
                    }
                    
                    $findings += $finding
                } else {
                    $tcpClient.Close()
                }
            } catch {
                # Port closed or filtered
            }
        }
        
    } catch {
        Write-Log "PowerShell scan failed: $($_.Exception.Message)" "ERROR"
    }
    
    return $findings
}

# API Communication Functions
function Register-Connector {
    param([hashtable]$Config)
    
    try {
        $networkRanges = Get-NetworkRanges
        $capabilities = @("discovery", "vulnerability", "basic_scan")
        
        if (Test-NmapAvailable) {
            $capabilities += "compliance"
            $toolsAvailable = @("nmap", "powershell")
        } else {
            $toolsAvailable = @("powershell")
        }
        
        $registrationData = @{
            action = "register"
            connectorId = $Config.ConnectorId
            data = @{
                name = $Config.ConnectorName
                location = $Config.Location
                networkRanges = $networkRanges
                capabilities = $capabilities
                version = "1.0.0"
                osInfo = @{
                    platform = "windows"
                    version = [System.Environment]::OSVersion.Version.ToString()
                    hostname = $env:COMPUTERNAME
                }
                toolsAvailable = $toolsAvailable
            }
        }
        
        $headers = @{
            'Content-Type' = 'application/json'
            'apikey' = $Config.ApiKey
        }
        
        $response = Invoke-RestMethod -Uri $Global:Config.ApiEndpoint -Method POST -Body ($registrationData | ConvertTo-Json -Depth 3) -Headers $headers
        Write-Log "Connector registered successfully: $($response.connectorId)"
        return $true
        
    } catch {
        Write-Log "Failed to register connector: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Send-Heartbeat {
    param([hashtable]$Config)
    
    try {
        $systemMetrics = Get-SystemMetrics
        
        $heartbeatData = @{
            action = "heartbeat"
            connectorId = $Config.ConnectorId
            data = @{
                metrics = $systemMetrics
                activeScans = 0
            }
        }
        
        $headers = @{
            'Content-Type' = 'application/json'
            'apikey' = $Config.ApiKey
        }
        
        $response = Invoke-RestMethod -Uri $Global:Config.ApiEndpoint -Method POST -Body ($heartbeatData | ConvertTo-Json -Depth 3) -Headers $headers
        
        # Check for pending scan jobs
        if ($response.pendingJobs -and $response.pendingJobs.Count -gt 0) {
            Write-Log "Found $($response.pendingJobs.Count) pending scan jobs"
            foreach ($job in $response.pendingJobs) {
                Start-ScanJob -Job $job -Config $Config
            }
        }
        
        return $true
        
    } catch {
        Write-Log "Heartbeat failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-ScanJob {
    param([object]$Job, [hashtable]$Config)
    
    Write-Log "Starting scan job: $($Job.id)"
    
    try {
        $scanResults = Invoke-NetworkScan -Targets $Job.targets -ScanType $Job.scan_type -Options $Job.options
        
        # Send results back to platform
        $resultData = @{
            action = "results"
            connectorId = $Config.ConnectorId
            data = @{
                jobId = $Job.id
                scanResults = $scanResults
                status = "completed"
            }
        }
        
        $headers = @{
            'Content-Type' = 'application/json'
            'apikey' = $Config.ApiKey
        }
        
        $response = Invoke-RestMethod -Uri $Global:Config.ApiEndpoint -Method POST -Body ($resultData | ConvertTo-Json -Depth 5) -Headers $headers
        Write-Log "Scan job completed: $($Job.id)"
        
    } catch {
        Write-Log "Scan job failed: $($_.Exception.Message)" "ERROR"
        
        # Report failure
        $resultData = @{
            action = "results"
            connectorId = $Config.ConnectorId
            data = @{
                jobId = $Job.id
                scanResults = @()
                status = "failed"
                error = $_.Exception.Message
            }
        }
        
        try {
            $headers = @{
                'Content-Type' = 'application/json'
                'apikey' = $Config.ApiKey
            }
            Invoke-RestMethod -Uri $Global:Config.ApiEndpoint -Method POST -Body ($resultData | ConvertTo-Json -Depth 3) -Headers $headers
        } catch {
            Write-Log "Failed to report job failure: $($_.Exception.Message)" "ERROR"
        }
    }
}

function Get-NetworkRanges {
    try {
        $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
        $ranges = @()
        
        foreach ($adapter in $adapters) {
            $ipConfig = Get-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
            foreach ($ip in $ipConfig) {
                if ($ip.IPAddress -ne "127.0.0.1") {
                    $network = "$($ip.IPAddress)/$($ip.PrefixLength)"
                    $ranges += $network
                }
            }
        }
        
        return $ranges
    } catch {
        Write-Log "Failed to get network ranges: $($_.Exception.Message)" "ERROR"
        return @("192.168.1.0/24")
    }
}

function Get-SystemMetrics {
    try {
        $cpu = Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 1
        $memory = Get-Counter "\Memory\% Committed Bytes In Use" -SampleInterval 1 -MaxSamples 1
        $disk = Get-Counter "\LogicalDisk(_Total)\% Free Space" -SampleInterval 1 -MaxSamples 1
        
        return @{
            cpu_usage = [math]::Round(100 - $cpu.CounterSamples[0].CookedValue, 2)
            memory_usage = [math]::Round($memory.CounterSamples[0].CookedValue, 2)
            disk_usage = [math]::Round(100 - $disk.CounterSamples[0].CookedValue, 2)
        }
    } catch {
        return @{
            cpu_usage = 0
            memory_usage = 0
            disk_usage = 0
        }
    }
}

# Service Management Functions
function Install-Service {
    param([hashtable]$Config)
    
    try {
        # Create installation directory
        if (-not (Test-Path $Global:Config.InstallPath)) {
            New-Item -ItemType Directory -Force -Path $Global:Config.InstallPath | Out-Null
        }
        
        # Copy script to installation directory
        $servicePath = Join-Path $Global:Config.InstallPath "VanguardNetworkAgent.ps1"
        Copy-Item $PSCommandPath $servicePath -Force
        
        # Create service configuration
        Save-Config -Config $Config
        
        # Install and start service
        $serviceCmd = "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$servicePath`" -Service"
        
        # Remove existing service if it exists
        $existingService = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
        if ($existingService) {
            Stop-Service -Name $Global:Config.ServiceName -Force
            sc.exe delete $Global:Config.ServiceName | Out-Null
            Start-Sleep 2
        }
        
        # Create new service
        New-Service -Name $Global:Config.ServiceName -DisplayName $Global:Config.ServiceDisplayName -BinaryPathName $serviceCmd -StartupType Automatic
        Start-Service -Name $Global:Config.ServiceName
        
        Write-Log "Vanguard Network Agent service installed and started"
        return $true
        
    } catch {
        Write-Log "Failed to install service: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Uninstall-Service {
    try {
        $service = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
        if ($service) {
            Stop-Service -Name $Global:Config.ServiceName -Force
            sc.exe delete $Global:Config.ServiceName | Out-Null
            Write-Log "Service uninstalled"
        }
        
        if (Test-Path $Global:Config.InstallPath) {
            Remove-Item $Global:Config.InstallPath -Recurse -Force
            Write-Log "Installation files removed"
        }
        
        return $true
    } catch {
        Write-Log "Failed to uninstall service: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Main Service Loop
function Start-ServiceLoop {
    param([hashtable]$Config)
    
    Write-Log "Starting Vanguard Network Agent service loop"
    
    # Register connector on startup
    if (-not (Register-Connector -Config $Config)) {
        Write-Log "Failed to register connector, retrying in 60 seconds" "ERROR"
    }
    
    while ($true) {
        try {
            Send-Heartbeat -Config $Config
            Start-Sleep $Global:Config.HeartbeatInterval
        } catch {
            Write-Log "Service loop error: $($_.Exception.Message)" "ERROR"
            Start-Sleep 30
        }
    }
}

# Main Execution Logic
function Main {
    Write-Log "Vanguard Network Agent starting..."
    
    # Check for administrator privileges
    if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
        Write-Log "Administrator privileges required" "ERROR"
        exit 1
    }
    
    if ($Install) {
        if (-not $ApiKey) {
            Write-Host "API Key is required for installation"
            $ApiKey = Read-Host "Please enter your Vanguard API key"
        }
        
        $config = @{
            ApiKey = $ApiKey
            ConnectorId = $Global:Config.ConnectorId
            ConnectorName = $ConnectorName
            Location = $Location
        }
        
        # Install Nmap if not available
        if (-not (Test-NmapAvailable)) {
            Write-Log "Nmap not found, installing..."
            Install-Nmap
        }
        
        if (Install-Service -Config $config) {
            Write-Host "Vanguard Network Agent installed and started successfully!"
            Write-Host "Connector ID: $($config.ConnectorId)"
            Write-Host "The agent will appear in your dashboard within 2 minutes."
        } else {
            Write-Host "Installation failed. Check logs: $($Global:Config.LogPath)"
            exit 1
        }
        
    } elseif ($Uninstall) {
        if (Uninstall-Service) {
            Write-Host "Vanguard Network Agent uninstalled successfully!"
        } else {
            Write-Host "Uninstall failed. Check logs: $($Global:Config.LogPath)"
            exit 1
        }
        
    } elseif ($Service) {
        $config = Load-Config
        if ($config) {
            Start-ServiceLoop -Config $config
        } else {
            Write-Log "Configuration not found, service cannot start" "ERROR"
            exit 1
        }
        
    } else {
        Write-Host "Vanguard Network Scanning Agent"
        Write-Host "Usage:"
        Write-Host "  -Install -ApiKey <key> [-ConnectorName <name>] [-Location <location>]"
        Write-Host "  -Uninstall"
        Write-Host ""
        Write-Host "Example:"
        Write-Host "  .\VanguardNetworkAgent.ps1 -Install -ApiKey 'your-api-key' -ConnectorName 'Main Office' -Location 'Dallas, TX'"
    }
}

# Run main function
Main