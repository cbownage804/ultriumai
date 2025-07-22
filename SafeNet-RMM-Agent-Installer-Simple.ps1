#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Ultrium SafeNet RMM Agent Installer & Service (final)
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

# --------- Helpers ----------
function Get-UtcStamp { (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }

$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# --------- Global Config ----------
$Global:Config = @{
    ServiceName        = "UltriumSafeNetAgent"
    ServiceDisplayName = "Ultrium SafeNet Monitoring Agent"
    ServiceDescription = "SafeNet RMM monitoring and security agent"
    InstallPath        = "C:\Program Files\Ultrium SafeNet"
    ApiUrl             = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1"
    LogPath            = $LogFile
    Version            = "1.0.1"
    CheckinInterval    = 300     # seconds
    ScanInterval       = 3600    # seconds
}

# --------- Logging ----------
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] [$Level] $Message"
    Write-Host $line
    try {
        if ($Global:Config.LogPath) {
            $dir = Split-Path $Global:Config.LogPath -Parent
            if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
            Add-Content -Path $Global:Config.LogPath -Value $line -Encoding UTF8
        }
    } catch {}
}

# --------- Load config ----------
function Load-Configuration {
    if ($ConfigFile -and (Test-Path $ConfigFile)) {
        try {
            $cfg = Get-Content $ConfigFile | ConvertFrom-Json
            $Global:Config.ConnectorKey = $cfg.ConnectorKey
            $Global:Config.ClientCode   = $cfg.ClientCode
            $Global:Config.ClientName   = $cfg.ClientName
            if ($cfg.ApiUrl) { $Global:Config.ApiUrl = $cfg.ApiUrl }
            Write-Log "Configuration loaded from file: $ConfigFile"
        } catch {
            Write-Log ("Failed to load configuration file: {0}" -f $_.Exception.Message) "ERROR"
            return $false
        }
    } else {
        $Global:Config.ConnectorKey = $ConnectorKey
        $Global:Config.ClientCode   = $ClientCode
        $Global:Config.ClientName   = $ClientName
    }

    if (!$Silent -and (-not $Global:Config.ConnectorKey -or -not $Global:Config.ClientCode)) {
        Write-Host "=== Ultrium SafeNet Agent Setup ===" -ForegroundColor Cyan
        if (-not $Global:Config.ConnectorKey) { $Global:Config.ConnectorKey = Read-Host "Enter Connector Key" }
        if (-not $Global:Config.ClientCode)   { $Global:Config.ClientCode   = Read-Host "Enter Client Code" }
        if (-not $Global:Config.ClientName)   { $Global:Config.ClientName   = Read-Host "Enter Organization Name" }
    }

    return ($Global:Config.ConnectorKey -and $Global:Config.ClientCode)
}

# --------- Service Script ----------
function Create-ServiceScript {
$serviceScript = @"
#Requires -RunAsAdministrator

function Get-UtcStamp { (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }

`$Global:Config = @{
    ConnectorKey     = "$($Global:Config.ConnectorKey)"
    ClientCode       = "$($Global:Config.ClientCode)"
    ClientName       = "$($Global:Config.ClientName)"
    ApiUrl           = "$($Global:Config.ApiUrl)"
    CheckinInterval  = $($Global:Config.CheckinInterval)
    ScanInterval     = $($Global:Config.ScanInterval)
    InstallPath      = "$($Global:Config.InstallPath)"
    ServiceName      = "$($Global:Config.ServiceName)"
    Version          = "$($Global:Config.Version)"
    LogPath          = "$($Global:Config.InstallPath)\logs\agent.log"
}

function Write-ServiceLog {
    param([string]`$Message, [string]`$Level = "INFO")
    `$ts   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    `$line = "[`$ts] [`$Level] `$Message"
    try {
        `$dir = Split-Path `$Global:Config.LogPath -Parent
        if (!(Test-Path `$dir)) { New-Item -ItemType Directory -Path `$dir -Force | Out-Null }
        Add-Content -Path `$Global:Config.LogPath -Value `$line -Encoding UTF8
    } catch {}
}

function Invoke-SafeNetAPI {
    param(
        [string]`$Endpoint,
        [hashtable]`$Data,
        [string]`$Method = "POST",
        [int]`$TimeoutSec = 30
    )
    try {
        `$uri = "`$(`$Global:Config.ApiUrl)/`$Endpoint"
        `$headers = @{ "Content-Type" = "application/json" }
        `$json = `$Data | ConvertTo-Json -Depth 10

        Write-ServiceLog "API Request: `$Method `$uri" "DEBUG"
        Write-ServiceLog "Payload: `$json" "DEBUG"

        return Invoke-RestMethod -Uri `$uri -Method `$Method -Headers `$headers -Body `$json -TimeoutSec `$TimeoutSec
    } catch {
        # Pull as much detail as possible
        `$err = `$_.Exception
        `$status = `$null
        `$respBody = `$null
        try {
            if (`$err.Response) {
                `$status = `$err.Response.StatusCode.value__
                `$reader = New-Object System.IO.StreamReader(`$err.Response.GetResponseStream())
                `$respBody = `$reader.ReadToEnd()
                `$reader.Close()
            }
        } catch {}

        Write-ServiceLog ("API call failed: HTTP {0} - {1}" -f `$status, `$err.Message) "ERROR"
        if (`$respBody) {
            Write-ServiceLog ("API error body: {0}" -f `$respBody) "ERROR"
        }
        return `$null
    }
}

function Get-SystemInfo {
    try {
        `$hostname = `$env:COMPUTERNAME
        if ([string]::IsNullOrEmpty(`$hostname)) { `$hostname = "Unknown" }

        `$ip = "127.0.0.1"
        try {
            `$ad = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | ? { `$_.IPAddress -notlike "127.*" -and `$_.IPAddress -notlike "169.254.*" }
            if (`$ad) { `$ip = `$ad[0].IPAddress }
        } catch {}

        `$osName    = "Windows"; `$osVer = "Unknown"; `$osBuild = "Unknown"
        try {
            `$os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
            if (`$os) {
                if (`$os.Caption)     { `$osName  = `$os.Caption }
                if (`$os.Version)     { `$osVer   = `$os.Version }
                if (`$os.BuildNumber) { `$osBuild = `$os.BuildNumber }
            }
        } catch {}

        `$domain = `$env:USERDOMAIN
        if ([string]::IsNullOrEmpty(`$domain)) { `$domain = "Unknown" }

        return @{
            hostname     = `$hostname
            ip_address   = `$ip
            domain       = `$domain
            os_name      = `$osName
            os_version   = `$osVer
            os_build     = `$osBuild
            last_checkin = Get-UtcStamp
        }
    } catch {
        Write-ServiceLog "System info failed: `$(`$_.Exception.Message)" "ERROR"
        return @{
            hostname     = `$env:COMPUTERNAME
            ip_address   = "127.0.0.1"
            domain       = "Unknown"
            os_name      = "Windows"
            os_version   = "Unknown"
            os_build     = "Unknown"
            last_checkin = Get-UtcStamp
        }
    }
}

function Get-NetworkDevices {
    try {
        `$devices = @()
        `$localIPs = (Get-NetIPAddress | ? { `$_.AddressFamily -eq "IPv4" -and `$_.IPAddress -ne "127.0.0.1" -and `$_.IPAddress -notlike "169.254.*" }).IPAddress
        foreach (`$ip in `$localIPs) {
            if (`$ip -like "169.254.*") { continue }
            `$net = `$ip.Substring(0, `$ip.LastIndexOf('.'))
            `$common = @(1,2,3,4,5,10,11,12,13,14,15,20,21,22,23,24,25,100,101,102,103,104,105,110,111,112,113,114,115,200,201,202,203,204,205,210,211,212,213,214,215,254)
            foreach (`$i in `$common) {
                `$t = "`$net.`$i"
                if (`$t -eq `$ip -or `$t -like "169.254.*") { continue }
                try {
                    `$pong = Test-Connection -ComputerName `$t -Count 1 -Quiet -ErrorAction SilentlyContinue
                    if (`$pong) {
                        try { `$hn = [System.Net.Dns]::GetHostByAddress(`$t).HostName } catch { `$hn = "Unknown" }
                        `$devices += @{
                            ip_address = `$t
                            hostname   = `$hn
                            device_type= "computer"
                            os_family  = "unknown"
                            status     = "online"
                            risk_level = "low"
                            device_name= `$hn
                            is_managed = `$false
                            is_critical= `$false
                        }
                    }
                } catch {}
            }
            break
        }
        return `$devices
    } catch {
        Write-ServiceLog "Network scan failed: `$(`$_.Exception.Message)" "ERROR"
        return @()
    }
}

function Send-Checkin {
    `$info = Get-SystemInfo
    `$payload = @{
        connector_key = `$Global:Config.ConnectorKey
        agent_version = `$Global:Config.Version
        system_info   = `$info
        status        = "online"
        last_scan     = Get-UtcStamp
    }
    Write-ServiceLog "Sending checkin..."
    `$r = Invoke-SafeNetAPI -Endpoint "rmm-agent-checkin" -Data `$payload
    if (`$r) { Write-ServiceLog "Checkin OK" } else { Write-ServiceLog "Checkin failed" "ERROR" }
}

function Send-NetworkScan {
    Write-ServiceLog "Starting discovery scan..."
    `$start = Get-Date
    `$dev   = Get-NetworkDevices
    `$stop  = Get-Date
    `$payload = @{
        connector_key  = `$Global:Config.ConnectorKey
        scan_type      = "basic_discovery"
        network_ranges = @("local")
        devices_found  = `$dev.Count
        scan_duration  = [math]::Round((`$stop-`$start).TotalSeconds,2)
        hostname       = `$env:COMPUTERNAME
        results        = @{ discovered = `$dev.Count }
        devices        = `$dev
    }
    `$r = Invoke-SafeNetAPI -Endpoint "safenet-api/scan-data" -Data `$payload
    if (`$r) { Write-ServiceLog "Scan data sent" } else { Write-ServiceLog "Scan send failed" "ERROR" }
}

function Start-ServiceLoop {
    Write-ServiceLog "Service loop starting..."
    `$lastCheckin = 0
    `$lastScan    = 0
    `$startTicks  = (Get-Date).Ticks

    while (`$true) {
        try {
            `$nowTicks   = (Get-Date).Ticks
            `$uptimeSecs = (`$nowTicks - `$startTicks) / 10000000

            if (`$uptimeSecs -gt 30 -and (`$nowTicks - `$lastCheckin)/10000000 -gt `$Global:Config.CheckinInterval) {
                Send-Checkin
                `$lastCheckin = `$nowTicks
            }

            if (`$uptimeSecs -gt 300 -and (`$nowTicks - `$lastScan)/10000000 -gt `$Global:Config.ScanInterval) {
                Send-NetworkScan
                `$lastScan = `$nowTicks
            }

            Start-Sleep -Seconds 60
        } catch {
            Write-ServiceLog "Loop error: `$(`$_.Exception.Message)" "ERROR"
            Start-Sleep -Seconds 300
        }
    }
}

if (`$args.Count -gt 0 -and `$args[0] -eq 'service') {
    `$retries = 0
    do {
        try {
            Write-ServiceLog "=== SafeNet Agent Service Start (try `$(`$retries+1)) ==="
            Start-ServiceLoop
            break
        } catch {
            Write-ServiceLog "Fatal start error: `$(`$_.Exception.Message)" "ERROR"
            `$retries++
            if (`$retries -lt 3) {
                Start-Sleep 60
            } else {
                exit 1
            }
        }
    } while (`$retries -lt 3)
} else {
    Write-Host "SafeNet Agent - Use 'service' parameter to run as service"
}
"@

    $path = Join-Path $Global:Config.InstallPath "SafeNet-Agent.ps1"
    try {
        $serviceScript | Out-File -FilePath $path -Encoding UTF8 -Force
        Write-Log "Service script created: $path"
        return $path
    } catch {
        Write-Log ("Failed to create service script: {0}" -f $_.Exception.Message) "ERROR"
        return $null
    }
}

# --------- Install Service ----------
function Install-SafeNetService {
    $scriptPath = Create-ServiceScript
    if (!$scriptPath) { return $false }

    try {
        # Ensure dirs
        New-Item -ItemType Directory -Path $Global:Config.InstallPath -Force | Out-Null
        New-Item -ItemType Directory -Path (Join-Path $Global:Config.InstallPath "logs") -Force | Out-Null

        $nssmPath = Join-Path $Global:Config.InstallPath "nssm.exe"
        if (!(Test-Path $nssmPath)) {
            Write-Log "Downloading NSSM..."
            $urls = @(
                "https://nssm.cc/ci/nssm-2.24-101-g897c7ad.zip",
                "https://github.com/kirillkovalenko/nssm/raw/master/win64/nssm.exe"
            )
            $downloaded = $false
            foreach ($u in $urls) {
                try {
                    if ($u -like "*.zip") {
                        $zip = Join-Path $Global:Config.InstallPath "nssm.zip"
                        Invoke-WebRequest -Uri $u -OutFile $zip -UseBasicParsing
                        Add-Type -AssemblyName System.IO.Compression.FileSystem
                        [IO.Compression.ZipFile]::ExtractToDirectory($zip, $Global:Config.InstallPath)
                        $exe = Get-ChildItem $Global:Config.InstallPath -Recurse -Filter nssm.exe | Select-Object -First 1
                        if ($exe) {
                            Copy-Item $exe.FullName $nssmPath -Force
                            Remove-Item $zip -Force
                            Get-ChildItem $Global:Config.InstallPath -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
                            $downloaded = $true
                            break
                        }
                    } else {
                        Invoke-WebRequest -Uri $u -OutFile $nssmPath -UseBasicParsing
                        $downloaded = $true
                        break
                    }
                } catch {
                    Write-Log ("Failed to download from {0}: {1}" -f $u, $_.Exception.Message) "ERROR"
                }
            }
            if (-not $downloaded) { Write-Log "All NSSM download attempts failed" "ERROR"; return $false }
            Write-Log "NSSM downloaded successfully"
        }

        # Remove existing
        $ex = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
        if ($ex) {
            Write-Log "Removing existing service..."
            & $nssmPath stop   $Global:Config.ServiceName | Out-Null
            & $nssmPath remove $Global:Config.ServiceName confirm | Out-Null
            Start-Sleep 2
        }

        $psExe   = "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"
        $param   = "-ExecutionPolicy Bypass -NoProfile -Command `"& '$scriptPath' service`""

        & $nssmPath install $Global:Config.ServiceName $psExe | Out-Null
        & $nssmPath set $Global:Config.ServiceName AppParameters $param        | Out-Null
        & $nssmPath set $Global:Config.ServiceName AppDirectory  $Global:Config.InstallPath | Out-Null
        & $nssmPath set $Global:Config.ServiceName DisplayName   $Global:Config.ServiceDisplayName | Out-Null
        & $nssmPath set $Global:Config.ServiceName Description   $Global:Config.ServiceDescription | Out-Null
        & $nssmPath set $Global:Config.ServiceName Start         SERVICE_AUTO_START | Out-Null

        # Logging
        $svcLog = Join-Path $Global:Config.InstallPath "logs\service.log"
        & $nssmPath set $Global:Config.ServiceName AppStdout $svcLog | Out-Null
        & $nssmPath set $Global:Config.ServiceName AppStderr $svcLog | Out-Null
        & $nssmPath set $Global:Config.ServiceName AppRotateFiles 1  | Out-Null
        & $nssmPath set $Global:Config.ServiceName AppRotateOnline 1 | Out-Null
        & $nssmPath set $Global:Config.ServiceName AppRotateBytes 10485760 | Out-Null

        # Recovery
        & $nssmPath set $Global:Config.ServiceName AppExit Default Restart   | Out-Null
        & $nssmPath set $Global:Config.ServiceName AppRestartDelay 30000     | Out-Null
        & $nssmPath set $Global:Config.ServiceName AppThrottle 1500          | Out-Null

        Write-Log "Windows service installed with NSSM: $($Global:Config.ServiceName)"
        return $true
    } catch {
        Write-Log ("Failed to install service: {0}" -f $_.Exception.Message) "ERROR"
        return $false
    }
}

# --------- Uninstall ----------
function Uninstall-SafeNetAgent {
    Write-Log "Starting SafeNet agent uninstallation..."
    try {
        $svc = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
        if ($svc) {
            if ($svc.Status -eq "Running") { Stop-Service $Global:Config.ServiceName -Force -ErrorAction SilentlyContinue }
            sc.exe delete $Global:Config.ServiceName | Out-Null
            Write-Log "Service removed"
        }
        if (Test-Path $Global:Config.InstallPath) {
            Remove-Item $Global:Config.InstallPath -Recurse -Force
            Write-Log "Installation directory removed"
        }
        Write-Host "SafeNet agent uninstalled successfully!" -ForegroundColor Green
        return $true
    } catch {
        Write-Log ("Uninstallation failed: {0}" -f $_.Exception.Message) "ERROR"
        return $false
    }
}

# --------- MAIN ----------
try {
    Write-Host "=== Ultrium SafeNet RMM Agent v$($Global:Config.Version) ===" -ForegroundColor Cyan

    if ($Uninstall) { if (Uninstall-SafeNetAgent) { exit 0 } else { exit 1 } }

    if (!(Load-Configuration)) {
        Write-Host "Missing required configuration (ConnectorKey, ClientCode)" -ForegroundColor Red
        if (!$Silent) {
            Write-Host ""
            Write-Host "Usage: .\SafeNet-RMM-Agent-Installer.ps1 -ConnectorKey 'your-key' -ClientCode 'your-code'" -ForegroundColor Yellow
            Write-Host "   or: .\SafeNet-RMM-Agent-Installer.ps1 -ConfigFile 'config.json'" -ForegroundColor Yellow
            Write-Host ""
            Read-Host "Press Enter to close this window..."
        }
        exit 1
    }

    # If already installed and not silent => prompt
    $existing = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "SafeNet agent is already installed" -ForegroundColor Yellow
        if (!$Silent) {
            $ans = Read-Host "Reinstall? (y/N)"
            if ($ans -match '^[Yy]$') { Uninstall-SafeNetAgent | Out-Null } else { exit 0 }
        } else {
            Uninstall-SafeNetAgent | Out-Null
        }
    }

    if (Install-SafeNetService) {
        Write-Log "Waiting for service to initialize..."
        Start-Sleep 3
        try { Start-Service -Name $Global:Config.ServiceName -ErrorAction Stop } catch { Write-Log ("Start-Service failed: {0}" -f $_.Exception.Message) "ERROR" }
        Start-Sleep 5
        $svc = Get-Service -Name $Global:Config.ServiceName
        if ($svc.Status -eq "Running") {
            Write-Log "Service is running successfully!" "SUCCESS"
            Write-Host "SafeNet agent installed and running!" -ForegroundColor Green
            Write-Host "Agent will appear in dashboard within 5 minutes" -ForegroundColor Yellow
            exit 0
        } else {
            Write-Log "Service failed to start - Status: $($svc.Status)" "ERROR"
            exit 1
        }
    } else {
        exit 1
    }
} catch {
    Write-Log ("Script failed: {0}" -f $_.Exception.Message) "ERROR"
    Write-Host "Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}