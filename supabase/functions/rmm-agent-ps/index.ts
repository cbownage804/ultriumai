import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'text/plain',
}

// PowerShell agent script with RustDesk integration and compliance scanning
const generatePowerShellAgent = (apiUrl: string, apiKey: string, agentId: string) => {
  // Escape all double quotes and backticks for embedding in JavaScript
  const script = `#Requires -Version 5.1
# Ultrium Vanguard Agent - PowerShell Edition
# Auto-registers, sends heartbeats, executes commands, compliance scanning, RustDesk integration

param(
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Test
)

$ErrorActionPreference = "SilentlyContinue"
$ProgressPreference = "SilentlyContinue"

# ============== CONFIGURATION ==============
$script:Config = @{
    ApiUrl = "${apiUrl}"
    ApiKey = "${apiKey}"
    AgentId = "${agentId}"
    HeartbeatInterval = 60
    CommandPollInterval = 30
    LogPath = Join-Path $env:ProgramData 'Vanguard\\logs'
    ConfigPath = Join-Path $env:ProgramData 'Vanguard\\config.json'
    ServiceName = 'VanguardAgent'
    ServiceDisplayName = 'Ultrium Vanguard Agent'
}

# ============== LOGGING ==============
function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logMessage = "[$timestamp] [$Level] $Message"
    
    if (-not (Test-Path $script:Config.LogPath)) {
        New-Item -ItemType Directory -Path $script:Config.LogPath -Force | Out-Null
    }
    
    $logFile = Join-Path $script:Config.LogPath ('agent_' + (Get-Date -Format 'yyyyMMdd') + '.log')
    Add-Content -Path $logFile -Value $logMessage
    
    switch ($Level) {
        'ERROR' { Write-Host $logMessage -ForegroundColor Red }
        'WARN'  { Write-Host $logMessage -ForegroundColor Yellow }
        default { Write-Host $logMessage }
    }
}

# ============== SYSTEM INFO ==============
function Get-SystemInfo {
    $os = Get-CimInstance Win32_OperatingSystem
    $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
    $disk = Get-CimInstance Win32_LogicalDisk -Filter 'DeviceID=''C:'''
    $network = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' } | Select-Object -First 1
    $rustdeskId = Get-RustDeskId
    
    @{
        hostname = $env:COMPUTERNAME
        ip_address = $network.IPAddress
        os_version = $os.Caption + ' ' + $os.Version
        cpu_model = $cpu.Name
        cpu_cores = $cpu.NumberOfCores
        total_memory_gb = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
        total_disk_gb = [math]::Round($disk.Size / 1GB, 2)
        domain = $env:USERDOMAIN
        username = $env:USERNAME
        rustdesk_id = $rustdeskId
        agent_version = '1.0.0-ps'
    }
}

function Get-SystemMetrics {
    $cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
    $os = Get-CimInstance Win32_OperatingSystem
    $disk = Get-CimInstance Win32_LogicalDisk -Filter 'DeviceID=''C:'''
    
    $memUsed = $os.TotalVisibleMemorySize - $os.FreePhysicalMemory
    $memPercent = [math]::Round(($memUsed / $os.TotalVisibleMemorySize) * 100, 2)
    $diskPercent = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 2)
    
    @{
        cpu_percent = [math]::Round($cpu, 2)
        memory_percent = $memPercent
        disk_percent = $diskPercent
        timestamp = (Get-Date).ToUniversalTime().ToString('o')
    }
}

# ============== RUSTDESK INTEGRATION ==============
function Get-RustDeskId {
    $rustdeskPaths = @(
        (Join-Path $env:APPDATA 'RustDesk\\config\\RustDesk.toml'),
        (Join-Path $env:ProgramFiles 'RustDesk\\RustDesk.toml'),
        'C:\\RustDesk\\RustDesk.toml'
    )
    
    foreach ($path in $rustdeskPaths) {
        if (Test-Path $path) {
            $content = Get-Content $path -Raw
            if ($content -match 'id\\s*=\\s*[''"]?([0-9]+)[''"]?') {
                return $matches[1]
            }
        }
    }
    
    $regPath = 'HKCU:\\SOFTWARE\\RustDesk\\RustDesk\\config'
    if (Test-Path $regPath) {
        $id = (Get-ItemProperty -Path $regPath -Name 'id' -ErrorAction SilentlyContinue).id
        if ($id) { return $id }
    }
    
    return $null
}

function Install-RustDesk {
    param([string]$RelayServer = '')
    
    Write-Log 'Installing RustDesk...'
    $installerUrl = 'https://github.com/rustdesk/rustdesk/releases/latest/download/rustdesk-1.2.3-x86_64.exe'
    $installerPath = Join-Path $env:TEMP 'rustdesk_installer.exe'
    
    try {
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
        Start-Process -FilePath $installerPath -ArgumentList '--silent-install' -Wait
        Write-Log 'RustDesk installed successfully'
        return $true
    }
    catch {
        Write-Log ('Failed to install RustDesk: ' + $_) -Level 'ERROR'
        return $false
    }
}

# ============== COMPLIANCE SCANNING ==============
function Invoke-ComplianceScan {
    param([string]$Framework = 'CIS')
    
    Write-Log ('Starting compliance scan: ' + $Framework)
    $results = @()
    
    switch ($Framework.ToUpper()) {
        'CIS' { $results = Get-CISComplianceChecks }
        'NIST' { $results = Get-NISTComplianceChecks }
        'PCI' { $results = Get-PCIComplianceChecks }
        default { $results = Get-CISComplianceChecks }
    }
    
    Write-Log ('Compliance scan complete: ' + $results.Count + ' checks performed')
    return $results
}

function Get-CISComplianceChecks {
    $checks = @()
    
    # CIS 1.1.1 - Password history
    $pwHistory = (net accounts | Select-String 'Password history').ToString() -replace '.*:\\s*', ''
    $checks += @{
        check_id = 'CIS-1.1.1'
        name = 'Enforce password history'
        status = if ([int]$pwHistory -ge 24) { 'pass' } else { 'fail' }
        current_value = $pwHistory
        expected_value = '24 or more'
        severity = 'medium'
        remediation = 'Set via: net accounts /uniquepw:24'
    }
    
    # CIS 2.3.1.1 - Administrator account
    $adminEnabled = (Get-LocalUser -Name 'Administrator' -ErrorAction SilentlyContinue).Enabled
    $checks += @{
        check_id = 'CIS-2.3.1.1'
        name = 'Administrator account status'
        status = if (-not $adminEnabled) { 'pass' } else { 'fail' }
        current_value = if ($adminEnabled) { 'Enabled' } else { 'Disabled' }
        expected_value = 'Disabled'
        severity = 'high'
        remediation = 'Disable via: net user Administrator /active:no'
    }
    
    # CIS 2.3.1.2 - Guest account
    $guestEnabled = (Get-LocalUser -Name 'Guest' -ErrorAction SilentlyContinue).Enabled
    $checks += @{
        check_id = 'CIS-2.3.1.2'
        name = 'Guest account status'
        status = if (-not $guestEnabled) { 'pass' } else { 'fail' }
        current_value = if ($guestEnabled) { 'Enabled' } else { 'Disabled' }
        expected_value = 'Disabled'
        severity = 'high'
        remediation = 'Disable via: net user Guest /active:no'
    }
    
    # CIS 9.1.1 - Firewall Domain
    $fwDomain = (Get-NetFirewallProfile -Profile Domain).Enabled
    $checks += @{
        check_id = 'CIS-9.1.1'
        name = 'Windows Firewall Domain Profile'
        status = if ($fwDomain) { 'pass' } else { 'fail' }
        current_value = if ($fwDomain) { 'Enabled' } else { 'Disabled' }
        expected_value = 'Enabled'
        severity = 'critical'
        remediation = 'Enable via: Set-NetFirewallProfile -Profile Domain -Enabled True'
    }
    
    # CIS 9.2.1 - Firewall Private
    $fwPrivate = (Get-NetFirewallProfile -Profile Private).Enabled
    $checks += @{
        check_id = 'CIS-9.2.1'
        name = 'Windows Firewall Private Profile'
        status = if ($fwPrivate) { 'pass' } else { 'fail' }
        current_value = if ($fwPrivate) { 'Enabled' } else { 'Disabled' }
        expected_value = 'Enabled'
        severity = 'critical'
        remediation = 'Enable via: Set-NetFirewallProfile -Profile Private -Enabled True'
    }
    
    # CIS 9.3.1 - Firewall Public
    $fwPublic = (Get-NetFirewallProfile -Profile Public).Enabled
    $checks += @{
        check_id = 'CIS-9.3.1'
        name = 'Windows Firewall Public Profile'
        status = if ($fwPublic) { 'pass' } else { 'fail' }
        current_value = if ($fwPublic) { 'Enabled' } else { 'Disabled' }
        expected_value = 'Enabled'
        severity = 'critical'
        remediation = 'Enable via: Set-NetFirewallProfile -Profile Public -Enabled True'
    }
    
    # Windows Defender
    $defenderEnabled = (Get-MpComputerStatus -ErrorAction SilentlyContinue).AntivirusEnabled
    $checks += @{
        check_id = 'CIS-18.9.45.4'
        name = 'Windows Defender Antivirus'
        status = if ($defenderEnabled) { 'pass' } else { 'fail' }
        current_value = if ($defenderEnabled) { 'Enabled' } else { 'Disabled' }
        expected_value = 'Enabled'
        severity = 'critical'
        remediation = 'Enable Windows Defender via Security Center'
    }
    
    # Real-time protection
    $rtProtection = (Get-MpComputerStatus -ErrorAction SilentlyContinue).RealTimeProtectionEnabled
    $checks += @{
        check_id = 'CIS-18.9.45.4.1'
        name = 'Real-time Protection'
        status = if ($rtProtection) { 'pass' } else { 'fail' }
        current_value = if ($rtProtection) { 'Enabled' } else { 'Disabled' }
        expected_value = 'Enabled'
        severity = 'critical'
        remediation = 'Enable via: Set-MpPreference -DisableRealtimeMonitoring $false'
    }
    
    # UAC
    $uacEnabled = (Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System).EnableLUA
    $checks += @{
        check_id = 'CIS-2.3.17.1'
        name = 'UAC Enabled'
        status = if ($uacEnabled -eq 1) { 'pass' } else { 'fail' }
        current_value = if ($uacEnabled -eq 1) { 'Enabled' } else { 'Disabled' }
        expected_value = 'Enabled'
        severity = 'high'
        remediation = 'Enable UAC via Control Panel'
    }
    
    # BitLocker
    $bitlocker = Get-BitLockerVolume -MountPoint 'C:' -ErrorAction SilentlyContinue
    $checks += @{
        check_id = 'CIS-18.9.11.1'
        name = 'BitLocker Drive Encryption'
        status = if ($bitlocker.ProtectionStatus -eq 'On') { 'pass' } else { 'fail' }
        current_value = $bitlocker.ProtectionStatus
        expected_value = 'On'
        severity = 'high'
        remediation = 'Enable BitLocker via manage-bde'
    }
    
    # SMBv1
    $smbv1 = (Get-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -ErrorAction SilentlyContinue).State
    $checks += @{
        check_id = 'CIS-18.3.2'
        name = 'SMBv1 Protocol Disabled'
        status = if ($smbv1 -eq 'Disabled') { 'pass' } else { 'fail' }
        current_value = $smbv1
        expected_value = 'Disabled'
        severity = 'critical'
        remediation = 'Disable via: Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol'
    }
    
    return $checks
}

function Get-NISTComplianceChecks {
    $checks = @()
    
    # AC-2: Inactive accounts
    $inactiveUsers = Get-LocalUser | Where-Object { $_.Enabled -and $_.LastLogon -lt (Get-Date).AddDays(-90) }
    $checks += @{
        check_id = 'NIST-AC-2'
        name = 'Inactive User Accounts'
        status = if ($inactiveUsers.Count -eq 0) { 'pass' } else { 'fail' }
        current_value = '' + $inactiveUsers.Count + ' inactive accounts'
        expected_value = '0 inactive accounts'
        severity = 'medium'
        remediation = 'Review and disable inactive accounts'
    }
    
    # SC-7: Firewall
    $allProfilesEnabled = (Get-NetFirewallProfile | Where-Object { -not $_.Enabled }).Count -eq 0
    $checks += @{
        check_id = 'NIST-SC-7'
        name = 'Boundary Protection (Firewall)'
        status = if ($allProfilesEnabled) { 'pass' } else { 'fail' }
        current_value = if ($allProfilesEnabled) { 'All profiles enabled' } else { 'Some profiles disabled' }
        expected_value = 'All profiles enabled'
        severity = 'critical'
        remediation = 'Enable all firewall profiles'
    }
    
    # SI-2: Patching
    $lastUpdate = (Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 1).InstalledOn
    $daysSinceUpdate = if ($lastUpdate) { ((Get-Date) - $lastUpdate).Days } else { 999 }
    $checks += @{
        check_id = 'NIST-SI-2'
        name = 'System Patching'
        status = if ($daysSinceUpdate -le 30) { 'pass' } else { 'fail' }
        current_value = '' + $daysSinceUpdate + ' days since last patch'
        expected_value = '30 days or less'
        severity = 'high'
        remediation = 'Install pending Windows Updates'
    }
    
    return $checks
}

function Get-PCIComplianceChecks {
    $checks = @()
    
    # PCI 1.4 - Firewall
    $fwEnabled = (Get-NetFirewallProfile | Where-Object { $_.Enabled }).Count -eq 3
    $checks += @{
        check_id = 'PCI-1.4'
        name = 'Personal Firewall Software'
        status = if ($fwEnabled) { 'pass' } else { 'fail' }
        current_value = if ($fwEnabled) { 'All profiles enabled' } else { 'Incomplete' }
        expected_value = 'All profiles enabled'
        severity = 'high'
        remediation = 'Enable Windows Firewall for all profiles'
    }
    
    # PCI 5.1 - Anti-virus
    $avEnabled = (Get-MpComputerStatus -ErrorAction SilentlyContinue).AntivirusEnabled
    $checks += @{
        check_id = 'PCI-5.1'
        name = 'Anti-virus Deployed'
        status = if ($avEnabled) { 'pass' } else { 'fail' }
        current_value = if ($avEnabled) { 'Active' } else { 'Not active' }
        expected_value = 'Active'
        severity = 'critical'
        remediation = 'Enable Windows Defender'
    }
    
    # PCI 5.2 - AV Current
    $avDefs = (Get-MpComputerStatus -ErrorAction SilentlyContinue).AntivirusSignatureLastUpdated
    $defsAge = if ($avDefs) { ((Get-Date) - $avDefs).Days } else { 999 }
    $checks += @{
        check_id = 'PCI-5.2'
        name = 'Anti-virus Definitions Current'
        status = if ($defsAge -le 7) { 'pass' } else { 'fail' }
        current_value = '' + $defsAge + ' days old'
        expected_value = '7 days or less'
        severity = 'high'
        remediation = 'Update Windows Defender definitions'
    }
    
    # PCI 6.2 - Patches
    $hotfixes = Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 1
    $patchAge = if ($hotfixes) { ((Get-Date) - $hotfixes.InstalledOn).Days } else { 999 }
    $checks += @{
        check_id = 'PCI-6.2'
        name = 'Security Patches Applied'
        status = if ($patchAge -le 30) { 'pass' } else { 'fail' }
        current_value = '' + $patchAge + ' days since last patch'
        expected_value = 'Within 30 days'
        severity = 'critical'
        remediation = 'Apply pending security updates'
    }
    
    return $checks
}

# ============== API COMMUNICATION ==============
function Invoke-AgentApi {
    param([string]$Action, [hashtable]$Body = @{})
    
    $headers = @{
        'Content-Type' = 'application/json'
        'X-VANGUARD-KEY' = $script:Config.ApiKey
    }
    
    $Body['agent_id'] = $script:Config.AgentId
    $Body['hostname'] = $env:COMPUTERNAME
    
    try {
        $uri = $script:Config.ApiUrl + '?action=' + $Action
        $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body ($Body | ConvertTo-Json -Depth 10) -ErrorAction Stop
        return $response
    }
    catch {
        Write-Log ('API call failed (' + $Action + '): ' + $_) -Level 'ERROR'
        return $null
    }
}

function Send-Heartbeat {
    $metrics = Get-SystemMetrics
    $systemInfo = Get-SystemInfo
    
    $body = @{
        metrics = $metrics
        system_info = $systemInfo
        timestamp = (Get-Date).ToUniversalTime().ToString('o')
    }
    
    $response = Invoke-AgentApi -Action 'heartbeat' -Body $body
    Write-Log ('Heartbeat sent - CPU: ' + $metrics.cpu_percent + '% MEM: ' + $metrics.memory_percent + '%')
    return $response
}

function Register-Agent {
    $systemInfo = Get-SystemInfo
    
    $body = @{
        system_info = $systemInfo
        capabilities = @('compliance_scan', 'command_exec', 'rustdesk', 'file_transfer')
    }
    
    $response = Invoke-AgentApi -Action 'register' -Body $body
    
    if ($response) {
        Write-Log 'Agent registered successfully'
        return $true
    }
    return $false
}

function Get-PendingCommands {
    $response = Invoke-AgentApi -Action 'poll_commands'
    if ($response -and $response.commands) {
        return $response.commands
    }
    return @()
}

function Send-CommandResponse {
    param([string]$CommandId, [hashtable]$Result)
    
    $body = @{
        command_id = $CommandId
        result = $Result
        completed_at = (Get-Date).ToUniversalTime().ToString('o')
    }
    
    Invoke-AgentApi -Action 'command_response' -Body $body
}

# ============== COMMAND EXECUTION ==============
function Invoke-AgentCommand {
    param([hashtable]$Command)
    
    Write-Log ('Executing command: ' + $Command.type)
    $result = @{ success = $false; output = ''; error = '' }
    
    try {
        switch ($Command.type) {
            'compliance_scan' {
                $framework = if ($Command.payload.framework) { $Command.payload.framework } else { 'CIS' }
                $scanResults = Invoke-ComplianceScan -Framework $framework
                $result.success = $true
                $result.output = $scanResults | ConvertTo-Json -Depth 10
                $result.scan_type = 'compliance'
                $result.framework = $framework
            }
            
            'powershell' {
                $output = Invoke-Expression $Command.payload.script 2>&1
                $result.success = $true
                $result.output = $output | Out-String
            }
            
            'cmd' {
                $output = cmd /c $Command.payload.command 2>&1
                $result.success = $true
                $result.output = $output | Out-String
            }
            
            'get_system_info' {
                $result.success = $true
                $result.output = Get-SystemInfo | ConvertTo-Json -Depth 5
            }
            
            'get_processes' {
                $procs = Get-Process | Select-Object Id, ProcessName, CPU, WorkingSet64, StartTime | ConvertTo-Json
                $result.success = $true
                $result.output = $procs
            }
            
            'get_services' {
                $services = Get-Service | Select-Object Name, DisplayName, Status, StartType | ConvertTo-Json
                $result.success = $true
                $result.output = $services
            }
            
            'install_rustdesk' {
                $installResult = Install-RustDesk -RelayServer $Command.payload.relay_server
                $result.success = $installResult
                $result.output = if ($installResult) { 'RustDesk installed' } else { 'Installation failed' }
            }
            
            'get_rustdesk_id' {
                $id = Get-RustDeskId
                $result.success = $true
                $result.output = @{ rustdesk_id = $id } | ConvertTo-Json
            }
            
            'restart' {
                Write-Log 'System restart requested'
                $result.success = $true
                $result.output = 'Restart initiated'
                Restart-Computer -Force
            }
            
            'shutdown' {
                Write-Log 'System shutdown requested'
                $result.success = $true
                $result.output = 'Shutdown initiated'
                Stop-Computer -Force
            }
            
            default {
                $result.error = 'Unknown command type: ' + $Command.type
            }
        }
    }
    catch {
        $result.success = $false
        $result.error = $_.Exception.Message
        Write-Log ('Command execution failed: ' + $_) -Level 'ERROR'
    }
    
    Send-CommandResponse -CommandId $Command.id -Result $result
}

# ============== SERVICE MANAGEMENT ==============
function Install-Service {
    Write-Log 'Installing Vanguard Agent service...'
    
    $installDir = Join-Path $env:ProgramData 'Vanguard'
    if (-not (Test-Path $installDir)) {
        New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    }
    
    $scriptPath = Join-Path $installDir 'VanguardAgent.ps1'
    Copy-Item -Path $PSCommandPath -Destination $scriptPath -Force
    
    $script:Config | ConvertTo-Json | Set-Content -Path $script:Config.ConfigPath
    
    $taskAction = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-ExecutionPolicy Bypass -WindowStyle Hidden -File ' + $scriptPath)
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartInterval (New-TimeSpan -Minutes 1) -RestartCount 3
    
    Register-ScheduledTask -TaskName $script:Config.ServiceName -Action $taskAction -Trigger $trigger -Principal $principal -Settings $settings -Force
    
    Write-Log 'Service installed successfully'
    Write-Host 'Vanguard Agent installed. Starting...'
    Start-ScheduledTask -TaskName $script:Config.ServiceName
}

function Uninstall-Service {
    Write-Log 'Uninstalling Vanguard Agent...'
    
    Stop-ScheduledTask -TaskName $script:Config.ServiceName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $script:Config.ServiceName -Confirm:$false -ErrorAction SilentlyContinue
    
    $installDir = Join-Path $env:ProgramData 'Vanguard'
    Remove-Item -Path $installDir -Recurse -Force -ErrorAction SilentlyContinue
    
    Write-Log 'Service uninstalled successfully'
}

# ============== MAIN LOOP ==============
function Start-AgentLoop {
    Write-Log 'Starting Vanguard Agent...'
    
    $registered = Register-Agent
    if (-not $registered) {
        Write-Log 'Failed to register agent, retrying...' -Level 'WARN'
    }
    
    $lastHeartbeat = [DateTime]::MinValue
    $lastCommandPoll = [DateTime]::MinValue
    
    while ($true) {
        try {
            $now = Get-Date
            
            if (($now - $lastHeartbeat).TotalSeconds -ge $script:Config.HeartbeatInterval) {
                Send-Heartbeat
                $lastHeartbeat = $now
            }
            
            if (($now - $lastCommandPoll).TotalSeconds -ge $script:Config.CommandPollInterval) {
                $commands = Get-PendingCommands
                foreach ($cmd in $commands) {
                    Invoke-AgentCommand -Command $cmd
                }
                $lastCommandPoll = $now
            }
            
            Start-Sleep -Seconds 5
        }
        catch {
            Write-Log ('Error in main loop: ' + $_) -Level 'ERROR'
            Start-Sleep -Seconds 30
        }
    }
}

# ============== ENTRY POINT ==============
if ($Install) {
    Install-Service
}
elseif ($Uninstall) {
    Uninstall-Service
}
elseif ($Test) {
    Write-Host '=== Vanguard Agent Test ===' -ForegroundColor Cyan
    Write-Host 'System Info:'
    Get-SystemInfo | Format-List
    Write-Host ''
    Write-Host 'System Metrics:'
    Get-SystemMetrics | Format-List
    Write-Host ''
    Write-Host ('RustDesk ID: ' + (Get-RustDeskId))
    Write-Host ''
    Write-Host 'Running CIS Compliance Scan...'
    $results = Invoke-ComplianceScan -Framework 'CIS'
    $passed = ($results | Where-Object { $_.status -eq 'pass' }).Count
    $failed = ($results | Where-Object { $_.status -eq 'fail' }).Count
    Write-Host ('Results: ' + $passed + ' passed, ' + $failed + ' failed')
    $results | ForEach-Object {
        $color = if ($_.status -eq 'pass') { 'Green' } else { 'Red' }
        Write-Host ('  [' + $_.status.ToUpper() + '] ' + $_.name) -ForegroundColor $color
    }
}
else {
    Start-AgentLoop
}
`
  return script
}

serve(async (req) => {
  console.log('=== RMM PowerShell Agent Generator ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const apiKey = url.searchParams.get('key') || Deno.env.get('VANGUARD_API_KEY') || 'vanguard-agent-key';
    const agentId = url.searchParams.get('agent_id') || crypto.randomUUID();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const apiUrl = `${supabaseUrl}/functions/v1/vanguard-agent-api`;
    
    const script = generatePowerShellAgent(apiUrl, apiKey, agentId);
    
    console.log(`Generated PowerShell agent for ID: ${agentId}`);
    
    return new Response(script, {
      headers: {
        ...corsHeaders,
        'Content-Disposition': `attachment; filename="VanguardAgent_${agentId.substring(0, 8)}.ps1"`,
      },
    });
  } catch (error) {
    console.error('Error generating agent:', error);
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
