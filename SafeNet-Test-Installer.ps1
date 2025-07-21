#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Simple test installer for SafeNet RMM Agent
.DESCRIPTION
    Minimal test version to verify connectivity and basic functionality
#>

param(
    [string]$ConnectorKey = "test_connector_123",
    [string]$ClientCode = "TEST001",
    [string]$ClientName = "Test Organization"
)

# Test Configuration - Using your actual Supabase project
$Global:Config = @{
    ServiceName = "UltriumSafeNetTest"
    ServiceDisplayName = "Ultrium SafeNet Test Agent"
    ApiUrl = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1"
    ConnectorKey = $ConnectorKey
    ClientCode = $ClientCode
    ClientName = $ClientName
    Version = "1.0.0-test"
}

function Write-TestLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $(if($Level -eq "ERROR") {"Red"} elseif($Level -eq "SUCCESS") {"Green"} else {"White"})
}

function Test-ApiConnectivity {
    Write-TestLog "Testing API connectivity..."
    try {
        $testData = @{
            connector_key = $Global:Config.ConnectorKey
            test_mode = $true
            hostname = $env:COMPUTERNAME
            timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
        }
        
        $uri = "$($Global:Config.ApiUrl)/safenet-api"
        $headers = @{ "Content-Type" = "application/json" }
        $body = $testData | ConvertTo-Json
        
        Write-TestLog "Attempting connection to: $uri"
        $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body -TimeoutSec 10
        
        Write-TestLog "✅ API connectivity test successful!" "SUCCESS"
        Write-TestLog "Response: $($response | ConvertTo-Json -Compress)"
        return $true
    } catch {
        Write-TestLog "❌ API connectivity test failed: $_" "ERROR"
        return $false
    }
}

function Get-BasicSystemInfo {
    try {
        $os = Get-CimInstance -ClassName Win32_OperatingSystem
        $computer = Get-CimInstance -ClassName Win32_ComputerSystem
        
        return @{
            hostname = $env:COMPUTERNAME
            os_name = $os.Caption
            os_version = $os.Version
            manufacturer = $computer.Manufacturer
            model = $computer.Model
            total_memory_gb = [math]::Round($computer.TotalPhysicalMemory / 1GB, 2)
            domain = $env:USERDOMAIN
            username = $env:USERNAME
        }
    } catch {
        Write-TestLog "Failed to get system info: $_" "ERROR"
        return @{ error = "Failed to collect system info" }
    }
}

# Main Test
try {
    Write-Host "=== SafeNet Agent Test Installer ===" -ForegroundColor Cyan
    Write-TestLog "Testing SafeNet RMM Agent connectivity..."
    Write-TestLog "API URL: $($Global:Config.ApiUrl)"
    Write-TestLog "Connector: $($Global:Config.ConnectorKey)"
    Write-TestLog "Client: $($Global:Config.ClientCode) - $($Global:Config.ClientName)"
    
    # Test basic system info collection
    Write-TestLog "Collecting system information..."
    $systemInfo = Get-BasicSystemInfo
    Write-TestLog "System: $($systemInfo.hostname) - $($systemInfo.os_name)"
    
    # Test API connectivity
    if (Test-ApiConnectivity) {
        Write-TestLog "🎉 All tests passed! SafeNet agent is ready for installation." "SUCCESS"
        Write-Host "`n✅ Test completed successfully!" -ForegroundColor Green
        Write-Host "📋 System: $($systemInfo.hostname)" -ForegroundColor Yellow
        Write-Host "🔗 API: Connected to SafeNet backend" -ForegroundColor Yellow
        Write-Host "🆔 Connector: $($Global:Config.ConnectorKey)" -ForegroundColor Yellow
    } else {
        Write-TestLog "❌ Tests failed. Please check network connectivity." "ERROR"
        Write-Host "`n❌ Test failed! Check network connectivity and try again." -ForegroundColor Red
    }
    
} catch {
    Write-TestLog "Test failed: $_" "ERROR"
    Write-Host "`n❌ Test failed: $_" -ForegroundColor Red
}

Write-Host "`nPress any key to continue..." -ForegroundColor Cyan
Read-Host