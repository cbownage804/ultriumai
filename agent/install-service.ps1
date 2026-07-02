# Wrayth agent — install as a Windows Service running under SYSTEM.
# Usage (elevated PowerShell):
#   powershell -ExecutionPolicy Bypass -File install-service.ps1
#
# Requires WraythAgent.exe and wrayth-config.json in the same directory.

$ErrorActionPreference = "Stop"

$svcName = "WraythAgent"
$svcDisplay = "Wrayth Device Agent"
$svcDescription = "Reports device security posture to Wrayth and executes approved actions."

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$exe = Join-Path $here "WraythAgent.exe"
$cfg = Join-Path $here "wrayth-config.json"

if (-not (Test-Path $exe)) { throw "WraythAgent.exe not found next to installer." }
if (-not (Test-Path $cfg)) { throw "wrayth-config.json not found next to installer." }

$installDir = "C:\Program Files\Wrayth"
$dataDir = "C:\ProgramData\Wrayth"
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

Copy-Item -Force $exe (Join-Path $installDir "WraythAgent.exe")
Copy-Item -Force $cfg (Join-Path $dataDir "wrayth-config.json")

# Remove any prior instance
$existing = Get-Service -Name $svcName -ErrorAction SilentlyContinue
if ($existing) {
  Stop-Service -Name $svcName -Force -ErrorAction SilentlyContinue
  sc.exe delete $svcName | Out-Null
  Start-Sleep -Seconds 2
}

$binPath = "`"$installDir\WraythAgent.exe`""
sc.exe create $svcName binPath= $binPath start= auto DisplayName= $svcDisplay obj= LocalSystem | Out-Null
sc.exe description $svcName $svcDescription | Out-Null
sc.exe failure $svcName reset= 86400 actions= restart/60000/restart/60000/restart/60000 | Out-Null
Start-Service -Name $svcName

Write-Host "Wrayth Agent installed and running as SYSTEM."
