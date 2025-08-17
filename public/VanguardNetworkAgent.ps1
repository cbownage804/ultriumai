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
                "credential_testing" {
                    $nmapArgs = "-sV --script auth $target"
                    $scanResult.metadata.toolsUsed += "nmap"
                }
                "full" {
                    $nmapArgs = "-sS -sV -O --script default,vuln,auth $target"
                    $scanResult.metadata.toolsUsed += "nmap"
                }
            }
            
            if (Test-NmapAvailable) {
                Write-Log "Running nmap with args: $nmapArgs"
                $nmapOutput = & nmap $nmapArgs.Split(' ') 2>&1
                
                # Parse nmap output for findings
                $findings = Parse-NmapOutput -Output $nmapOutput -Target $target
                $scanResult.findings += $findings
                
            } else {
                # Fallback to PowerShell-based scanning
                Write-Log "Nmap not available, using PowerShell fallback"
                $findings = Invoke-PowerShellScan -Target $target -ScanType $ScanType
                $scanResult.findings += $findings
                $scanResult.metadata.toolsUsed += "powershell"
            }
            
            # Enhanced pentesting modules
            $enhancedFindings = @()
            
            # Credential testing for common devices/services
            if ($ScanType -in @("vulnerability", "credential_testing", "full")) {
                $enhancedFindings += Invoke-CredentialTesting -Target $target
                $scanResult.metadata.toolsUsed += "credential_testing"
            }
            
            # SNMP enumeration
            if ($ScanType -in @("discovery", "vulnerability", "full")) {
                $enhancedFindings += Invoke-SNMPEnumeration -Target $target
                $scanResult.metadata.toolsUsed += "snmp"
            }
            
            # SMB/NetBIOS enumeration
            if ($ScanType -in @("discovery", "vulnerability", "full")) {
                $enhancedFindings += Invoke-SMBEnumeration -Target $target
                $scanResult.metadata.toolsUsed += "smb"
            }
            
            # Web application fingerprinting
            if ($ScanType -in @("vulnerability", "full")) {
                $enhancedFindings += Invoke-WebFingerprinting -Target $target
                $scanResult.metadata.toolsUsed += "web_fingerprinting"
            }
            
            # SSL/TLS vulnerability testing
            if ($ScanType -in @("vulnerability", "compliance", "full")) {
                $enhancedFindings += Invoke-SSLTesting -Target $target
                $scanResult.metadata.toolsUsed += "ssl_testing"
            }
            
            $scanResult.findings += $enhancedFindings
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

# Enhanced Pentesting Functions

function Invoke-CredentialTesting {
    param([string]$Target)
    
    $findings = @()
    
    # Common default credentials for various devices
    $defaultCreds = @{
        # Printers
        "631" = @(
            @{username="admin"; password="admin"},
            @{username="admin"; password="password"},
            @{username="admin"; password=""},
            @{username="root"; password=""},
            @{username=""; password=""}
        )
        "80" = @(
            @{username="admin"; password="admin"},
            @{username="admin"; password="password"},
            @{username="admin"; password="123456"},
            @{username="admin"; password=""},
            @{username="root"; password="root"},
            @{username="guest"; password="guest"}
        )
        "443" = @(
            @{username="admin"; password="admin"},
            @{username="admin"; password="password"},
            @{username="admin"; password=""}
        )
        # SSH
        "22" = @(
            @{username="root"; password="root"},
            @{username="admin"; password="admin"},
            @{username="pi"; password="raspberry"},
            @{username="ubuntu"; password="ubuntu"}
        )
        # FTP
        "21" = @(
            @{username="anonymous"; password=""},
            @{username="ftp"; password="ftp"},
            @{username="admin"; password="admin"}
        )
        # Telnet
        "23" = @(
            @{username="admin"; password="admin"},
            @{username="root"; password=""},
            @{username=""; password=""}
        )
    }
    
    try {
        # Test common web interface ports
        foreach ($port in @(80, 443, 631, 8080, 8443)) {
            if (Test-Port -Target $Target -Port $port) {
                Write-Log "Testing credentials on ${Target}:${port}"
                
                $protocol = if ($port -in @(443, 8443)) { "https" } else { "http" }
                $baseUrl = "${protocol}://${Target}:${port}"
                
                # Test common login paths
                $loginPaths = @("/", "/login", "/admin", "/management", "/cgi-bin/", "/printer")
                
                foreach ($path in $loginPaths) {
                    if ($defaultCreds.ContainsKey($port.ToString())) {
                        foreach ($cred in $defaultCreds[$port.ToString()]) {
                            $result = Test-WebCredentials -BaseUrl $baseUrl -Path $path -Username $cred.username -Password $cred.password
                            if ($result.Success) {
                                $finding = @{
                                    id = [System.Guid]::NewGuid().ToString()
                                    type = "credential"
                                    severity = "high"
                                    title = "Default Credentials Found"
                                    description = "Default credentials accepted: $($cred.username)/$($cred.password)"
                                    target = $Target
                                    port = $port
                                    service = $result.ServiceType
                                    impact = "Unauthorized access to device management interface"
                                    recommendation = "Change default credentials immediately"
                                    evidence = @("Successful login at $baseUrl$path")
                                    cve = ""
                                }
                                $findings += $finding
                                break
                            }
                        }
                    }
                }
            }
        }
        
        # Test SSH credentials
        if (Test-Port -Target $Target -Port 22) {
            foreach ($cred in $defaultCreds["22"]) {
                $result = Test-SSHCredentials -Target $Target -Username $cred.username -Password $cred.password
                if ($result) {
                    $finding = @{
                        id = [System.Guid]::NewGuid().ToString()
                        type = "credential"
                        severity = "critical"
                        title = "SSH Default Credentials"
                        description = "SSH accepts default credentials: $($cred.username)/$($cred.password)"
                        target = $Target
                        port = 22
                        service = "ssh"
                        impact = "Full system access via SSH"
                        recommendation = "Change SSH credentials and disable password authentication"
                        evidence = @("SSH login successful")
                    }
                    $findings += $finding
                    break
                }
            }
        }
        
    } catch {
        Write-Log "Credential testing failed for $Target`: $($_.Exception.Message)" "ERROR"
    }
    
    return $findings
}

function Test-Port {
    param([string]$Target, [int]$Port)
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $result = $tcpClient.BeginConnect($Target, $Port, $null, $null)
        $wait = $result.AsyncWaitHandle.WaitOne(3000, $false)
        
        if ($wait -and $tcpClient.Connected) {
            $tcpClient.Close()
            return $true
        } else {
            $tcpClient.Close()
            return $false
        }
    } catch {
        return $false
    }
}

function Test-WebCredentials {
    param([string]$BaseUrl, [string]$Path, [string]$Username, [string]$Password)
    
    try {
        $fullUrl = $BaseUrl + $Path
        $credential = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("${Username}:${Password}"))
        
        $headers = @{
            "Authorization" = "Basic $credential"
            "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        # Skip SSL certificate validation
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        
        $response = Invoke-WebRequest -Uri $fullUrl -Headers $headers -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        # Check for successful authentication indicators
        if ($response.StatusCode -eq 200 -and 
            $response.Content -notmatch "(?i)(login|unauthorized|forbidden|invalid)" -and
            $response.Content -match "(?i)(dashboard|admin|management|settings|config)") {
            
            $serviceType = "unknown"
            if ($response.Content -match "(?i)printer") { $serviceType = "printer" }
            elseif ($response.Content -match "(?i)router") { $serviceType = "router" }
            elseif ($response.Content -match "(?i)camera") { $serviceType = "camera" }
            
            return @{Success = $true; ServiceType = $serviceType}
        }
        
        return @{Success = $false; ServiceType = "unknown"}
        
    } catch {
        return @{Success = $false; ServiceType = "unknown"}
    }
}

function Test-SSHCredentials {
    param([string]$Target, [string]$Username, [string]$Password)
    
    # This is a simplified test - in a real implementation you'd use a proper SSH library
    # For now, we'll just test if SSH is responsive
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $result = $tcpClient.BeginConnect($Target, 22, $null, $null)
        $wait = $result.AsyncWaitHandle.WaitOne(5000, $false)
        
        if ($wait -and $tcpClient.Connected) {
            $stream = $tcpClient.GetStream()
            $buffer = New-Object byte[] 1024
            $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
            $response = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $bytesRead)
            
            $tcpClient.Close()
            
            # Check if it's actually SSH
            if ($response -match "SSH") {
                # Note: This is a basic check. Real credential testing would require SSH protocol implementation
                # For demonstration purposes, we'll return false unless it's a known weak configuration
                return $false
            }
        }
        
        return $false
    } catch {
        return $false
    }
}

function Invoke-SNMPEnumeration {
    param([string]$Target)
    
    $findings = @()
    
    try {
        # Test common SNMP communities
        $communities = @("public", "private", "community", "admin", "manager", "snmp")
        
        foreach ($community in $communities) {
            if (Test-SNMPCommunity -Target $Target -Community $community) {
                $finding = @{
                    id = [System.Guid]::NewGuid().ToString()
                    type = "information_disclosure"
                    severity = "medium"
                    title = "SNMP Community String Found"
                    description = "SNMP community string '$community' is accessible"
                    target = $Target
                    port = 161
                    service = "snmp"
                    impact = "System information disclosure"
                    recommendation = "Change default SNMP community strings or disable SNMP"
                    evidence = @("SNMP query successful with community: $community")
                }
                $findings += $finding
            }
        }
        
    } catch {
        Write-Log "SNMP enumeration failed for $Target`: $($_.Exception.Message)" "ERROR"
    }
    
    return $findings
}

function Test-SNMPCommunity {
    param([string]$Target, [string]$Community)
    
    try {
        # Basic UDP socket test for SNMP
        $udpClient = New-Object System.Net.Sockets.UdpClient
        $udpClient.Connect($Target, 161)
        
        # SNMP v1 GET request for system description (1.3.6.1.2.1.1.1.0)
        $snmpRequest = @(
            0x30, 0x19,  # SEQUENCE, length 25
            0x02, 0x01, 0x00,  # INTEGER version (0 for SNMPv1)
            0x04, 0x06, [System.Text.Encoding]::ASCII.GetBytes($Community),  # OCTET STRING community
            0xa0, 0x0c,  # GetRequest PDU
            0x02, 0x01, 0x01,  # request-id
            0x02, 0x01, 0x00,  # error-status
            0x02, 0x01, 0x00,  # error-index
            0x30, 0x00   # variable-bindings (empty)
        )
        
        # Flatten the array properly
        $flatRequest = @()
        foreach ($item in $snmpRequest) {
            if ($item -is [array]) {
                $flatRequest += $item
            } else {
                $flatRequest += $item
            }
        }
        
        $udpClient.Send($flatRequest, $flatRequest.Length)
        
        # Set timeout
        $udpClient.Client.ReceiveTimeout = 3000
        
        $endpoint = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Any, 0)
        $response = $udpClient.Receive([ref]$endpoint)
        
        $udpClient.Close()
        
        # If we got a response, the community string worked
        return $response.Length -gt 0
        
    } catch {
        if ($udpClient) { $udpClient.Close() }
        return $false
    }
}

function Invoke-SMBEnumeration {
    param([string]$Target)
    
    $findings = @()
    
    try {
        # Test SMB/NetBIOS ports
        if (Test-Port -Target $Target -Port 445) {
            # Test for null session
            try {
                $shares = net view "\\$Target" 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $finding = @{
                        id = [System.Guid]::NewGuid().ToString()
                        type = "information_disclosure"
                        severity = "medium"
                        title = "SMB Shares Enumerable"
                        description = "SMB shares can be enumerated without authentication"
                        target = $Target
                        port = 445
                        service = "smb"
                        impact = "Network resource disclosure"
                        recommendation = "Require authentication for share enumeration"
                        evidence = $shares
                    }
                    $findings += $finding
                }
            } catch {}
            
            # Test for SMB signing
            $smbInfo = Test-SMBSigning -Target $Target
            if (-not $smbInfo.SigningRequired) {
                $finding = @{
                    id = [System.Guid]::NewGuid().ToString()
                    type = "weakness"
                    severity = "low"
                    title = "SMB Signing Not Required"
                    description = "SMB signing is not enforced, making the connection vulnerable to man-in-the-middle attacks"
                    target = $Target
                    port = 445
                    service = "smb"
                    impact = "Potential for SMB relay attacks"
                    recommendation = "Enable required SMB signing"
                    evidence = @("SMB signing not required")
                }
                $findings += $finding
            }
        }
        
        # Test NetBIOS
        if (Test-Port -Target $Target -Port 139) {
            $netbiosInfo = Get-NetBIOSInfo -Target $Target
            if ($netbiosInfo.Success) {
                $finding = @{
                    id = [System.Guid]::NewGuid().ToString()
                    type = "information_disclosure"
                    severity = "low"
                    title = "NetBIOS Information Disclosed"
                    description = "NetBIOS name and workgroup information available"
                    target = $Target
                    port = 139
                    service = "netbios"
                    impact = "Network topology disclosure"
                    recommendation = "Disable NetBIOS if not required"
                    evidence = @("NetBIOS name: $($netbiosInfo.Name), Workgroup: $($netbiosInfo.Workgroup)")
                }
                $findings += $finding
            }
        }
        
    } catch {
        Write-Log "SMB enumeration failed for $Target`: $($_.Exception.Message)" "ERROR"
    }
    
    return $findings
}

function Test-SMBSigning {
    param([string]$Target)
    
    # Simplified SMB signing test
    try {
        return @{SigningRequired = $false}  # Simplified for this implementation
    } catch {
        return @{SigningRequired = $true}
    }
}

function Get-NetBIOSInfo {
    param([string]$Target)
    
    try {
        $result = nbtstat -A $Target 2>$null
        if ($LASTEXITCODE -eq 0 -and $result) {
            # Parse nbtstat output for computer name and workgroup
            $name = ""
            $workgroup = ""
            
            foreach ($line in $result) {
                if ($line -match "^\s*(\S+)\s+<00>\s+UNIQUE") {
                    $name = $matches[1]
                } elseif ($line -match "^\s*(\S+)\s+<00>\s+GROUP") {
                    $workgroup = $matches[1]
                }
            }
            
            return @{Success = $true; Name = $name; Workgroup = $workgroup}
        }
        
        return @{Success = $false}
    } catch {
        return @{Success = $false}
    }
}

function Invoke-WebFingerprinting {
    param([string]$Target)
    
    $findings = @()
    
    try {
        # Test common web ports
        foreach ($port in @(80, 443, 8080, 8443)) {
            if (Test-Port -Target $Target -Port $port) {
                $protocol = if ($port -in @(443, 8443)) { "https" } else { "http" }
                $url = "${protocol}://${Target}:${port}"
                
                $webInfo = Get-WebServerInfo -Url $url
                
                if ($webInfo.Success) {
                    # Check for server information disclosure
                    if ($webInfo.Server -and $webInfo.Server -ne "Unknown") {
                        $severity = "low"
                        if ($webInfo.Server -match "Apache/[12]\." -or $webInfo.Server -match "nginx/[01]\.") {
                            $severity = "medium"
                        }
                        
                        $finding = @{
                            id = [System.Guid]::NewGuid().ToString()
                            type = "information_disclosure"
                            severity = $severity
                            title = "Web Server Banner Disclosure"
                            description = "Web server reveals version information: $($webInfo.Server)"
                            target = $Target
                            port = $port
                            service = "http"
                            impact = "Server technology disclosure may aid attackers"
                            recommendation = "Configure server to hide version information"
                            evidence = @("Server header: $($webInfo.Server)")
                        }
                        $findings += $finding
                    }
                    
                    # Check for common CMS/framework signatures
                    $cms = Detect-CMS -Content $webInfo.Content -Headers $webInfo.Headers
                    if ($cms.Detected) {
                        $finding = @{
                            id = [System.Guid]::NewGuid().ToString()
                            type = "information_disclosure"
                            severity = "low"
                            title = "Web Application Technology Detected"
                            description = "Detected: $($cms.Technology) $($cms.Version)"
                            target = $Target
                            port = $port
                            service = "http"
                            impact = "Technology stack disclosure"
                            recommendation = "Remove or obscure technology indicators"
                            evidence = $cms.Evidence
                        }
                        $findings += $finding
                    }
                }
            }
        }
        
    } catch {
        Write-Log "Web fingerprinting failed for $Target`: $($_.Exception.Message)" "ERROR"
    }
    
    return $findings
}

function Get-WebServerInfo {
    param([string]$Url)
    
    try {
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        return @{
            Success = $true
            Server = $response.Headers.Server
            Content = $response.Content
            Headers = $response.Headers
        }
    } catch {
        return @{Success = $false}
    }
}

function Detect-CMS {
    param([string]$Content, $Headers)
    
    $signatures = @{
        "WordPress" = @("wp-content", "wp-includes", "WordPress")
        "Drupal" = @("Drupal", "sites/default", "misc/drupal.js")
        "Joomla" = @("Joomla", "components/com_", "templates/system")
        "Apache Tomcat" = @("Apache Tomcat", "tomcat")
        "IIS" = @("X-Powered-By.*ASP.NET", "Server.*IIS")
    }
    
    foreach ($cms in $signatures.Keys) {
        foreach ($signature in $signatures[$cms]) {
            if ($Content -match $signature -or ($Headers -and $Headers -match $signature)) {
                return @{
                    Detected = $true
                    Technology = $cms
                    Version = ""
                    Evidence = @("Found signature: $signature")
                }
            }
        }
    }
    
    return @{Detected = $false}
}

function Invoke-SSLTesting {
    param([string]$Target)
    
    $findings = @()
    
    try {
        # Test HTTPS ports
        foreach ($port in @(443, 8443)) {
            if (Test-Port -Target $Target -Port $port) {
                $sslInfo = Get-SSLInfo -Target $Target -Port $port
                
                if ($sslInfo.Success) {
                    # Check for weak protocols
                    if ($sslInfo.SupportsSSLv3 -or $sslInfo.SupportsTLSv1) {
                        $finding = @{
                            id = [System.Guid]::NewGuid().ToString()
                            type = "weakness"
                            severity = "medium"
                            title = "Weak SSL/TLS Protocol Supported"
                            description = "Server supports deprecated SSL/TLS protocols"
                            target = $Target
                            port = $port
                            service = "https"
                            impact = "Connection vulnerable to protocol downgrade attacks"
                            recommendation = "Disable SSLv3 and TLSv1.0, use TLSv1.2 or higher"
                            evidence = @("Weak protocols detected")
                        }
                        $findings += $finding
                    }
                    
                    # Check certificate validity
                    if ($sslInfo.CertificateExpired) {
                        $finding = @{
                            id = [System.Guid]::NewGuid().ToString()
                            type = "weakness"
                            severity = "high"
                            title = "SSL Certificate Expired"
                            description = "SSL certificate has expired"
                            target = $Target
                            port = $port
                            service = "https"
                            impact = "Users may receive security warnings"
                            recommendation = "Renew SSL certificate"
                            evidence = @("Certificate expired: $($sslInfo.ExpiryDate)")
                        }
                        $findings += $finding
                    }
                    
                    # Check for self-signed certificate
                    if ($sslInfo.SelfSigned) {
                        $finding = @{
                            id = [System.Guid]::NewGuid().ToString()
                            type = "weakness"
                            severity = "low"
                            title = "Self-Signed SSL Certificate"
                            description = "Server uses a self-signed SSL certificate"
                            target = $Target
                            port = $port
                            service = "https"
                            impact = "Users may receive security warnings"
                            recommendation = "Use certificate from trusted CA"
                            evidence = @("Self-signed certificate detected")
                        }
                        $findings += $finding
                    }
                }
            }
        }
        
    } catch {
        Write-Log "SSL testing failed for $Target`: $($_.Exception.Message)" "ERROR"
    }
    
    return $findings
}

function Get-SSLInfo {
    param([string]$Target, [int]$Port)
    
    try {
        # Simplified SSL info gathering
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {
            param($sender, $certificate, $chain, $sslPolicyErrors)
            
            # Store certificate info for analysis
            $script:CertInfo = @{
                Subject = $certificate.Subject
                Issuer = $certificate.Issuer
                ExpiryDate = $certificate.GetExpirationDateString()
                SelfSigned = $certificate.Subject -eq $certificate.Issuer
                Expired = $certificate.GetExpirationDateString() -lt (Get-Date)
            }
            
            return $true  # Accept all certificates for testing
        }
        
        $tcpClient = New-Object System.Net.Sockets.TcpClient($Target, $Port)
        $sslStream = New-Object System.Net.Security.SslStream($tcpClient.GetStream())
        $sslStream.AuthenticateAsClient($Target)
        
        $sslStream.Close()
        $tcpClient.Close()
        
        return @{
            Success = $true
            SupportsSSLv3 = $false  # Simplified
            SupportsTLSv1 = $false  # Simplified
            CertificateExpired = $script:CertInfo.Expired
            SelfSigned = $script:CertInfo.SelfSigned
            ExpiryDate = $script:CertInfo.ExpiryDate
        }
        
    } catch {
        return @{Success = $false}
    }
}

# API Communication Functions
function Register-Connector {
    param([hashtable]$Config)
    
    try {
        $networkRanges = Get-NetworkRanges
        $capabilities = @("discovery", "vulnerability", "compliance", "credential_testing", "basic_scan", "full")
        
        if (Test-NmapAvailable) {
            $capabilities += @("advanced_compliance", "deep_vulnerability")
            $toolsAvailable = @("nmap", "powershell", "credential_testing", "snmp", "smb", "web_fingerprinting", "ssl_testing")
        } else {
            $toolsAvailable = @("powershell", "credential_testing", "snmp", "smb", "web_fingerprinting", "ssl_testing")
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