param(
  [Parameter(Mandatory = $true)] [string] $ServiceName,
  [Parameter(Mandatory = $true)] [string] $DisplayName,
  [Parameter(Mandatory = $true)] [string] $Description,
  [Parameter(Mandatory = $true)] [string] $AppDir
)

$ErrorActionPreference = "Continue"

$DataDir = "C:\ProgramData\Wrayth"
$LogDir = Join-Path $DataDir "logs"
$LogPath = Join-Path $LogDir "install.log"
$WrapperPath = Join-Path $AppDir "WraythService.exe"
$AgentPath = Join-Path $AppDir "WraythAgent.exe"
$ConfigPath = Join-Path $AppDir "WraythService.xml"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-InstallLog([string] $Message) {
  Add-Content -Path $LogPath -Value ("{0} {1}" -f (Get-Date -Format o), $Message)
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

function Invoke-WinSW([string[]] $Args) {
  Write-InstallLog ("WinSW: {0}" -f ($Args -join " "))
  & $WrapperPath @Args *>> $LogPath
  $exit = $LASTEXITCODE
  Write-InstallLog ("WinSW exit: $exit")
  return $exit
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