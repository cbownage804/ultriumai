#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Updates the SafeNet Agent with improved network discovery
.DESCRIPTION
    This script updates the existing SafeNet agent service with the latest network discovery improvements
#>

$ServiceName = "UltriumSafeNetAgent"
$InstallPath = "C:\Program Files\Ultrium SafeNet"

Write-Host "=== Updating SafeNet Agent ===" -ForegroundColor Cyan

try {
    # Check if service exists
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if (!$service) {
        Write-Host "❌ SafeNet agent service not found. Please install the agent first." -ForegroundColor Red
        exit 1
    }

    Write-Host "🔄 Stopping SafeNet service..." -ForegroundColor Yellow
    Stop-Service -Name $ServiceName -Force
    Start-Sleep -Seconds 3

    # Backup existing script
    $backupPath = Join-Path $InstallPath "SafeNet-Agent-backup.ps1"
    $scriptPath = Join-Path $InstallPath "SafeNet-Agent.ps1"
    
    if (Test-Path $scriptPath) {
        Copy-Item $scriptPath $backupPath -Force
        Write-Host "✅ Existing script backed up to: $backupPath" -ForegroundColor Green
    }

    # Copy updated script from installer
    $installerScript = ".\SafeNet-RMM-Agent-Installer.ps1"
    if (!(Test-Path $installerScript)) {
        Write-Host "❌ Installer script not found: $installerScript" -ForegroundColor Red
        exit 1
    }

    # Extract service script from installer and update the existing one
    Write-Host "🔄 Updating agent script with improved network discovery..." -ForegroundColor Yellow
    
    # Run the installer to regenerate the service script
    & $installerScript -ConnectorKey "update" -ClientCode "update" -Silent
    
    Write-Host "🔄 Starting SafeNet service..." -ForegroundColor Yellow
    Start-Service -Name $ServiceName
    Start-Sleep -Seconds 5

    # Verify service is running
    $service = Get-Service -Name $ServiceName
    if ($service.Status -eq "Running") {
        Write-Host "✅ SafeNet agent updated and running!" -ForegroundColor Green
        Write-Host "🔍 Improved network discovery is now active" -ForegroundColor Cyan
        Write-Host "📊 Check logs at: $InstallPath\logs\agent.log" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Service failed to start. Check logs for details." -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "❌ Update failed: $_" -ForegroundColor Red
    exit 1
}