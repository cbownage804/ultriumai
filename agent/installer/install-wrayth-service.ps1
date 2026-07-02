param(
  [Parameter(Mandatory = $true)] [string] $ServiceName,
  [Parameter(Mandatory = $true)] [string] $DisplayName,
  [Parameter(Mandatory = $true)] [string] $Description,
  [Parameter(Mandatory = $true)] [string] $AppDir
)

$ErrorActionPreference = "Continue"

# Force UTF-8 everywhere so the install.log is readable in Notepad/VS Code
# and native tools (sc.exe, WinSW) don't leave OEM/UTF-16 bytes behind.
try {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  [Console]::InputEncoding  = [System.Text.Encoding]::UTF8
  $OutputEncoding = [System.Text.Encoding]::UTF8
  $PSDefaultParameterValues['Out-File:Encoding']    = 'utf8'
  $PSDefaultParameterValues['Add-Content:Encoding'] = 'utf8'
  $PSDefaultParameterValues['Set-Content:Encoding'] = 'utf8'
  chcp 65001 > $null 2>&1
} catch {}

$DataDir = "C:\ProgramData\Wrayth"
$LogDir = Join-Path $DataDir "logs"
$LogPath = Join-Path $LogDir "install.log"
$WrapperPath = Join-Path $AppDir "WraythService.exe"
$AgentPath = Join-Path $AppDir "WraythAgent.exe"
$ConfigPath = Join-Path $AppDir "WraythService.xml"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# Ensure the log file starts as UTF-8 with BOM so editors auto-detect it.
if (-not (Test-Path $LogPath) -or (Get-Item $LogPath).Length -eq 0) {
  Set-Content -Path $LogPath -Value "" -Encoding utf8
}

function Write-InstallLog([string] $Message) {
  $line = "{0} {1}" -f (Get-Date -Format o), $Message
  Add-Content -Path $LogPath -Value $line -Encoding utf8
}

function Write-NativeOutput([string] $Label, $Output) {
  if ($null -eq $Output) { return }
  $text = ($Output | Out-String).TrimEnd()
  if ([string]::IsNullOrWhiteSpace($text)) { return }
  foreach ($line in $text -split "`r?`n") {
    Add-Content -Path $LogPath -Value ("  [{0}] {1}" -f $Label, $line) -Encoding utf8
  }
}

function Test-ServicePendingDelete([string] $Name) {
  try {
    $key = "HKLM:\SYSTEM\CurrentControlSet\Services\$Name"
    $value = Get-ItemProperty -Path $key -Name DeleteFlag -ErrorAction Stop
    return [int]$value.DeleteFlag -ne 0
  } catch {
    return $false
  }
}

function Get-WraythService([string] $Name) {
  return Get-CimInstance Win32_Service -Filter "Name = '$Name'" -ErrorAction SilentlyContinue
}

function Wait-ForServiceDeletion([string] $Name, [int] $Seconds = 30) {
  for ($i = 0; $i -lt ($Seconds * 2); $i++) {
    Start-Sleep -Milliseconds 500
    if (-not (Get-WraythService $Name)) { return $true }
    if (Test-ServicePendingDelete $Name) { return $false }
  }
  return -not (Get-WraythService $Name)
}

function Invoke-Native([string] $Label, [string] $File, [string[]] $Args) {
  Write-InstallLog ("{0}: {1} {2}" -f $Label, $File, ($Args -join " "))
  $output = & $File @Args 2>&1
  $exit = $LASTEXITCODE
  Write-NativeOutput $Label $output
  Write-InstallLog ("{0} exit: {1}" -f $Label, $exit)
  return $exit
}

function Invoke-WinSW([string[]] $Args) {
  return (Invoke-Native "WinSW" $WrapperPath $Args)
}

Write-InstallLog "--- Wrayth service registration start ---"
Write-InstallLog "AppDir=$AppDir"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-InstallLog "FATAL: installer is not elevated"
  exit 740
}

if (-not (Test-Path $WrapperPath)) { Write-InstallLog "FATAL: missing $WrapperPath"; exit 2 }
if (-not (Test-Path $AgentPath)) { Write-InstallLog "FATAL: missing $AgentPath"; exit 2 }
if (-not (Test-Path $ConfigPath)) { Write-InstallLog "FATAL: missing $ConfigPath"; exit 2 }

try { Unblock-File -Path $WrapperPath -ErrorAction SilentlyContinue } catch {}
try { Unblock-File -Path $AgentPath -ErrorAction SilentlyContinue } catch {}

if (Test-ServicePendingDelete $ServiceName) {
  Write-InstallLog "FATAL: service is pending deletion; reboot required"
  exit 3010
}

$existing = Get-WraythService $ServiceName
if ($existing) {
  Write-InstallLog ("Existing service found: State={0}; StartMode={1}; Path={2}" -f $existing.State, $existing.StartMode, $existing.PathName)
  try { Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue } catch {}

  if ($existing.PathName -match "WraythService\.exe") {
    [void](Invoke-WinSW @("refresh"))
  } else {
    Write-InstallLog "Legacy direct-agent service detected; deleting before wrapper install"
    & sc.exe delete $ServiceName *>> $LogPath
    Write-InstallLog ("sc delete exit: $LASTEXITCODE")
    if (-not (Wait-ForServiceDeletion $ServiceName 30)) {
      Write-InstallLog "FATAL: legacy service deletion is pending; reboot required"
      exit 3010
    }
  }
}

if (-not (Get-WraythService $ServiceName)) {
  [void](Invoke-WinSW @("install"))
}

if (-not (Get-WraythService $ServiceName)) {
  Write-InstallLog "WinSW did not create the service; falling back to New-Service"
  try {
    $binary = '"{0}"' -f $WrapperPath
    New-Service -Name $ServiceName -BinaryPathName $binary -DisplayName $DisplayName -Description $Description -StartupType Automatic -ErrorAction Stop *>> $LogPath
    Write-InstallLog "New-Service succeeded"
  } catch {
    Write-InstallLog ("New-Service failed: " + $_.Exception.Message)
  }
}

if (-not (Get-WraythService $ServiceName)) {
  Write-InstallLog "New-Service did not create the service; falling back to sc.exe create"
  $quotedWrapper = '"{0}"' -f $WrapperPath
  & sc.exe create $ServiceName binPath= $quotedWrapper start= auto DisplayName= $DisplayName *>> $LogPath
  Write-InstallLog ("sc create exit: $LASTEXITCODE")
}

$registered = Get-WraythService $ServiceName
if (-not $registered) {
  Write-InstallLog "FATAL: service is still not registered"
  exit 1603
}

& sc.exe config $ServiceName start= auto *>> $LogPath
Write-InstallLog ("sc config exit: $LASTEXITCODE")
& sc.exe description $ServiceName $Description *>> $LogPath
& sc.exe failure $ServiceName reset= 86400 actions= restart/60000/restart/60000/restart/60000 *>> $LogPath

try {
  Start-Service -Name $ServiceName -ErrorAction Stop
  Write-InstallLog "service start requested successfully"
} catch {
  # Registration is the installer contract. The agent may stop immediately if
  # the enrollment code is expired/invalid, but the service must still exist.
  Write-InstallLog ("service start failed/non-fatal: " + $_.Exception.Message)
}

$final = Get-WraythService $ServiceName
Write-InstallLog ("FINAL: Name={0}; State={1}; StartMode={2}; Path={3}" -f $final.Name, $final.State, $final.StartMode, $final.PathName)
Write-InstallLog "--- Wrayth service registration end ---"
exit 0