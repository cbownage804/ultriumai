#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Ultrium SafeNet RMM Agent Installer and Service
.DESCRIPTION
    Installs, configures, and (optionally) removes the SafeNet RMM monitoring agent.
.PARAMETER ConnectorKey
.PARAMETER ClientCode
.PARAMETER ClientName
.PARAMETER Silent
.PARAMETER ConfigFile
.PARAMETER LogFile
.PARAMETER Uninstall
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'

param(
    [string]$ConnectorKey,
    [string]$ClientCode,
    [string]$ClientName,
    [switch]$Silent,
    [string]$ConfigFile,
    [string]$LogFile = 'C:\temp\safenet-install.log',
    [switch]$Uninstall
)

function Get-UtcStamp { (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ') }

# ------------------- GLOBAL CONFIG -------------------
$Global:Config = @{
    ServiceName        = 'UltriumSafeNetAgent'
    ServiceDisplayName = 'Ultrium SafeNet Monitoring Agent'
    ServiceDescription = 'SafeNet RMM monitoring and security agent'
    InstallPath        = 'C:\Program Files\Ultrium SafeNet'
    ApiUrl             = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1'
    LogPath            = $LogFile
    Version            = '1.0.1'
    CheckinInterval    = 300   # seconds
    ScanInterval       = 3600  # seconds
}

# ------------------- LOGGING -------------------
function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $ts  = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $row = "[$ts] [$Level] $Message"
    Write-Host $row
    if ($Global:Config.LogPath) {
        try {
            $dir = Split-Path $Global:Config.LogPath -Parent
            if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
            Add-Content -Path $Global:Config.LogPath -Value $row -Encoding UTF8
        } catch { }
    }
}

# ------------------- CONFIG LOADER -------------------
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
            Write-Log "Failed to load configuration file: $($_.Exception.Message)" 'ERROR'
            return $false
        }
    } else {
        $Global:Config.ConnectorKey = $ConnectorKey
        $Global:Config.ClientCode   = $ClientCode
        $Global:Config.ClientName   = $ClientName
    }

    if (-not $Silent -and (-not $Global:Config.ConnectorKey -or -not $Global:Config.ClientCode)) {
        Write-Host '=== Ultrium SafeNet Agent Setup ===' -ForegroundColor Cyan
        if (-not $Global:Config.ConnectorKey) { $Global:Config.ConnectorKey = Read-Host 'Enter Connector Key' }
        if (-not $Global:Config.ClientCode)   { $Global:Config.ClientCode   = Read-Host 'Enter Client Code' }
        if (-not $Global:Config.ClientName)   { $Global:Config.ClientName   = Read-Host 'Enter Organization Name' }
    }

    return ($Global:Config.ConnectorKey -and $Global:Config.ClientCode)
}

# ------------------- SERVICE SCRIPT CREATOR -------------------
function Create-ServiceScript {
    if (!(Test-Path $Global:Config.InstallPath)) {
        New-Item -ItemType Directory -Path $Global:Config.InstallPath -Force | Out-Null
    }
    $logDir = Join-Path $Global:Config.InstallPath 'logs'
    if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

    $serviceScript = @"
#Requires -RunAsAdministrator
function Get-UtcStamp { (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }

`$Global:Config = @{
    ConnectorKey    = "$($Global:Config.ConnectorKey)"
    ClientCode      = "$($Global:Config.ClientCode)"
    ClientName      = "$($Global:Config.ClientName)"
    ApiUrl          = "$($Global:Config.ApiUrl)"
    CheckinInterval = $($Global:Config.CheckinInterval)
    ScanInterval    = $($Global:Config.ScanInterval)
    InstallPath     = "$($Global:Config.InstallPath)"
    ServiceName     = "$($Global:Config.ServiceName)"
    Version         = "$($Global:Config.Version)"
    LogPath         = "$($Global:Config.InstallPath)\logs\agent.log"
}

function Write-ServiceLog {
    param([string]`$Message, [string]`$Level = "INFO")
    `$ts   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    `$row  = "[`$ts] [`$Level] `$Message"
    try {
        `$dir = Split-Path `$Global:Config.LogPath -Parent
        if (!(Test-Path `$dir)) { New-Item -ItemType Directory -Path `$dir -Force | Out-Null }
        Add-Content -Path `$Global:Config.LogPath -Value `$row -Encoding UTF8
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
        `$uri     = "`$(`$Global:Config.ApiUrl)/`$Endpoint"
        `$headers = @{ "Content-Type" = "application/json" }
        `$body    = `$Data | ConvertTo-Json -Depth 10

        Write-ServiceLog "API Request: `$Method `$uri" "DEBUG"
        Write-ServiceLog "Payload: `$body" "DEBUG"

        Invoke-RestMethod -Uri `$uri -Method `$Method -Headers `$headers -Body `$body -TimeoutSec `$TimeoutSec
    } catch {
        `$err      = `$_.Exception
        `$status   = `$null
        `$respBody = `$null
        try {
            if (`$err.Response) {
                `$status   = `$err.Response.StatusCode.value__
                `$reader   = New-Object System.IO.StreamReader(`$err.Response.GetResponseStream())
                `$respBody = `$reader.ReadToEnd()
                `$reader.Close()
            }
        } catch {}

        Write-ServiceLog ("API call failed: HTTP {0} - {1}" -f `$status, `$err.Message) "ERROR"
        if (`$respBody) { Write-ServiceLog ("API error body: {0}" -f `$respBody) "ERROR" }
        return `$null
    }
}

function Get-SystemInfo {
    try {
        `$hostname = `$env:COMPUTERNAME
        if ([string]::IsNullOrEmpty(`$hostname)) { `$hostname = "Unknown" }

        `$ip = "127.0.0.1"
        try {
            `$ad = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { `$_.IPAddress -notlike "127.*" -and `$_.IPAddress -notlike "169.254.*" }
            if (`$ad) { `$ip = `$ad[0].IPAddress }
        } catch {}

        `$osName="Windows"; `$osVer="Unknown"; `$osBuild="Unknown"
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
        `$localIPs = (Get-NetIPAddress | Where-Object { `$_.AddressFamily -eq "IPv4" -and `$_.IPAddress -ne "127.0.0.1" -and `$_.IPAddress -notlike "169.254.*" }).IPAddress
        Write-ServiceLog "Starting network discovery for `$(`$localIPs.Count) local IPs" "INFO"

        foreach (`$ip in `$localIPs) {
            if (`$ip -like "169.254.*") { continue }
            `$net     = `$ip.Substring(0, `$ip.LastIndexOf('.'))
            `$common  = @(1,2,3,4,5,10,11,12,13,14,15,20,21,22,23,24,25,100,101,102,103,104,105,110,111,112,113,114,115,200,201,202,203,204,205,210,211,212,213,214,215,254)
            `$countSc = 0
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
                `$countSc++
                if (`$countSc % 20 -eq 0) {
                    Write-ServiceLog "Scanned `$countSc/`$(`$common.Count) addresses, found `$(`$devices.Count)" "INFO"
                }
            }
            break
        }
        Write-ServiceLog "Network scan completed. Found `$(`$devices.Count) devices" "INFO"
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
        hostname      = `$info.hostname
        ip_address    = `$info.ip_address
        agent_version = `$Global:Config.Version
        system_info   = `$info
        status        = "online"
        last_scan     = Get-UtcStamp
    }
    Write-ServiceLog "Sending checkin..."
    `$r = Invoke-SafeNetAPI -Endpoint "rmm-agent-checkin" -Data `$payload
    if (`$r) { 
        Write-ServiceLog "Checkin OK" 
    } else { 
        Write-ServiceLog "Checkin failed" "ERROR"
        try {
            `$dump = Join-Path `$Global:Config.InstallPath "last-checkin.json"
            `$payload | ConvertTo-Json -Depth 10 | Out-File `$dump -Encoding UTF8
            Write-ServiceLog "Saved payload to `$dump" "DEBUG"
        } catch {}
    }
    Write-ServiceLog ("Heartbeat OK @ {0}" -f (Get-UtcStamp))
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
    for (`$i = 1; `$i -le 3; `$i++) {
        try {
            Write-ServiceLog "=== SafeNet Agent Service Start (try `$i) ===" "INFO"
            Start-ServiceLoop
            break
        } catch {
            Write-ServiceLog "Fatal start error: `$(`$_.Exception.Message)" "ERROR"
            if (`$i -lt 3) { Start-Sleep 60 } else { exit 1 }
        }
    }
} else {
    Write-Host "SafeNet Agent - Use 'service' parameter to run as service"
}
"@

    $scriptPath = Join-Path $Global:Config.InstallPath 'SafeNet-Agent.ps1'
    try {
        $serviceScript | Out-File -FilePath $scriptPath -Encoding UTF8
        Write-Log "Service script created: $scriptPath"
        return $scriptPath
    } catch {
        Write-Log "Failed to create service script: $($_.Exception.Message)" 'ERROR'
        return $null
    }
}

# ------------------- SERVICE INSTALL -------------------
function Install-SafeNetService {
    $scriptPath = Create-ServiceScript
    if (-not $scriptPath) { return $false }

    try {
        $nssmPath = Join-Path $Global:Config.InstallPath 'nssm.exe'
        if (!(Test-Path $nssmPath)) {
            Write-Log 'Downloading NSSM...'
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            $urls = @(
                'https://nssm.cc/ci/nssm-2.24-101-g897c7ad.zip',
                'https://github.com/kirillkovalenko/nssm/raw/master/win64/nssm.exe'
            )
            $downloaded = $false
            foreach ($url in $urls) {
                try {
                    if ($url -like '*.zip') {
                        $zip = Join-Path $Global:Config.InstallPath 'nssm.zip'
                        Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
                        Add-Type -AssemblyName System.IO.Compression.FileSystem
                        [IO.Compression.ZipFile]::ExtractToDirectory($zip, $Global:Config.InstallPath)
                        $exe = Get-ChildItem -Path $Global:Config.InstallPath -Recurse -Filter 'nssm.exe' | Select-Object -First 1
                        if ($exe) {
                            Copy-Item $exe.FullName $nssmPath -Force
                            Remove-Item $zip -Force
                            Get-ChildItem -Path $Global:Config.InstallPath -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
                            $downloaded = $true
                            break
                        }
                    } else {
                        Invoke-WebRequest -Uri $url -OutFile $nssmPath -UseBasicParsing
                        $downloaded = $true
                        break
                    }
                } catch {
                    Write-Log ("Failed to download from {0}: {1}" -f $url, $_.Exception.Message) 'ERROR'
                }
            }
            if (-not $downloaded) {
                Write-Log 'All NSSM download attempts failed' 'ERROR'
                return $false
            }
            Write-Log 'NSSM downloaded successfully'
        }

        # Remove old
        $existing = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
        if ($existing) {
            Write-Log 'Removing existing service...'
            & $nssmPath stop   $Global:Config.ServiceName 2>$null
            & $nssmPath remove $Global:Config.ServiceName confirm 2>$null
            Start-Sleep 2
        }

        $psExe = "${env:WINDIR}\System32\WindowsPowerShell\v1.0\powershell.exe"
        & $nssmPath install $Global:Config.ServiceName $psExe

        # Use -Command to keep quotes intact
        $param = "-ExecutionPolicy Bypass -NoProfile -Command `"& '$scriptPath' service`""
        & $nssmPath set $Global:Config.ServiceName AppParameters $param
        & $nssmPath set $Global:Config.ServiceName AppDirectory  $Global:Config.InstallPath
        & $nssmPath set $Global:Config.ServiceName DisplayName   $Global:Config.ServiceDisplayName
        & $nssmPath set $Global:Config.ServiceName Description   $Global:Config.ServiceDescription
        & $nssmPath set $Global:Config.ServiceName Start         SERVICE_AUTO_START

        # Logging to file
        $svcLog = Join-Path $Global:Config.InstallPath 'logs\service.log'
        & $nssmPath set $Global:Config.ServiceName AppStdout $svcLog
        & $nssmPath set $Global:Config.ServiceName AppStderr $svcLog
        & $nssmPath set $Global:Config.ServiceName AppRotateFiles 1
        & $nssmPath set $Global:Config.ServiceName AppRotateOnline 1
        & $nssmPath set $Global:Config.ServiceName AppRotateBytes 10485760

        & $nssmPath set $Global:Config.ServiceName AppExit Default Restart
        & $nssmPath set $Global:Config.ServiceName AppRestartDelay 30000
        & $nssmPath set $Global:Config.ServiceName AppThrottle 1500

        Write-Log ("Windows service installed with NSSM: {0}" -f $Global:Config.ServiceName)
        return $true
    } catch {
        Write-Log "Failed to install service: $($_.Exception.Message)" 'ERROR'
        return $false
    }
}

# ------------------- UNINSTALL -------------------
function Uninstall-SafeNetAgent {
    Write-Log 'Starting SafeNet agent uninstallation...'
    try {
        $svc = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
        if ($svc) {
            if ($svc.Status -eq 'Running') {
                Stop-Service -Name $Global:Config.ServiceName -Force
                Write-Log 'Service stopped'
            }
            try {
                $r = & sc.exe delete $Global:Config.ServiceName
                if ($LASTEXITCODE -eq 0) { Write-Log 'Service removed' } else { Write-Log "Service delete returned: $r" 'ERROR' }
            } catch { Write-Log "Service removal error: $($_.Exception.Message)" 'ERROR' }
        }
        if (Test-Path $Global:Config.InstallPath) {
            Remove-Item -Path $Global:Config.InstallPath -Recurse -Force
            Write-Log 'Installation directory removed'
        }
        Write-Host 'SafeNet agent uninstalled successfully!' -ForegroundColor Green
        return $true
    } catch {
        Write-Log "Uninstallation failed: $($_.Exception.Message)" 'ERROR'
        return $false
    }
}

# ------------------- MAIN INSTALL -------------------
function Install-SafeNetAgent {
    Write-Log 'Starting SafeNet agent installation...'
    Write-Log "Version: $($Global:Config.Version)"
    Write-Log "Connector: $($Global:Config.ConnectorKey)"
    Write-Log ("Client: {0} - {1}" -f $Global:Config.ClientCode, (if ($Global:Config.ClientName) { $Global:Config.ClientName } else { 'Default Client' }))

    try {
        if (!(Test-Path $Global:Config.InstallPath)) {
            New-Item -ItemType Directory -Path $Global:Config.InstallPath -Force | Out-Null
            Write-Log "Created installation directory: $($Global:Config.InstallPath)"
        }
        $logs = Join-Path $Global:Config.InstallPath 'logs'
        if (!(Test-Path $logs)) { New-Item -ItemType Directory -Path $logs -Force | Out-Null }

        if (Install-SafeNetService) {
            Write-Log 'Waiting for service to initialize...'
            Start-Sleep 3
            try {
                Start-Service -Name $Global:Config.ServiceName -ErrorAction Stop
                Write-Log 'Start-Service issued'
            } catch {
                Write-Log "Start-Service failed: $($_.Exception.Message)" 'ERROR'
            }

            Start-Sleep 5
            $svc = Get-Service -Name $Global:Config.ServiceName
            if ($svc.Status -eq 'Running') {
                Write-Log '✅ Service is running successfully!' 'SUCCESS'
                Write-Host 'SafeNet agent installed and running!' -ForegroundColor Green
                Write-Host ("Service logs: {0}" -f (Join-Path $Global:Config.InstallPath 'logs\service.log')) -ForegroundColor Yellow
                return $true
            } else {
                Write-Log "❌ Service failed to start - Status: $($svc.Status)" 'ERROR'
                return $false
            }
        }
        return $false
    } catch {
        Write-Log "Installation failed: $($_.Exception.Message)" 'ERROR'
        Write-Host "Installation failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# ------------------- MAIN -------------------
try {
    Write-Host "=== Ultrium SafeNet RMM Agent v$($Global:Config.Version) ===" -ForegroundColor Cyan

    if ($Uninstall) { if (Uninstall-SafeNetAgent) { exit 0 } else { exit 1 } }

    if (!(Load-Configuration)) {
        Write-Host 'Missing required configuration (ConnectorKey, ClientCode)' -ForegroundColor Red
        if (-not $Silent) {
            Write-Host ''
            Write-Host "Usage: .\SafeNet-RMM-Agent-Installer.ps1 -ConnectorKey 'your-key' -ClientCode 'your-code'" -ForegroundColor Yellow
            Write-Host "   or: .\SafeNet-RMM-Agent-Installer.ps1 -ConfigFile 'config.json'" -ForegroundColor Yellow
            Write-Host ''
            Write-Host 'Press Enter to close this window...' -ForegroundColor Yellow
            $null = Read-Host
        }
        exit 1
    }

    $existing = Get-Service -Name $Global:Config.ServiceName -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host 'SafeNet agent is already installed' -ForegroundColor Yellow
        if (-not $Silent) {
            $resp = Read-Host 'Reinstall? (y/N)'
            if ($resp -match '^[Yy]$') {
                Uninstall-SafeNetAgent | Out-Null
            } else { exit 0 }
        } else {
            Uninstall-SafeNetAgent | Out-Null
        }
    }

    if (Install-SafeNetAgent) { exit 0 } else { exit 1 }

} catch {
    Write-Log "Script failed: $($_.Exception.Message)" 'ERROR'
    Write-Host "Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}