# =============================================================================
# Vanguard Agent Build Script
# =============================================================================
# Builds and packages the Windows agent as a single-file EXE
# =============================================================================

param(
    [switch]$Release,
    [switch]$Package
)

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot
$Configuration = if ($Release) { "Release" } else { "Debug" }
$OutputDir = "$ProjectDir\dist"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Vanguard Agent Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Clean previous builds
if (Test-Path $OutputDir) {
    Remove-Item $OutputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDir | Out-Null

Write-Host "[1/3] Building Vanguard Agent ($Configuration)..." -ForegroundColor Yellow

# Build the project
dotnet publish "$ProjectDir\VanguardAgent.csproj" `
    -c $Configuration `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -o "$OutputDir\publish"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[2/3] Copying files..." -ForegroundColor Yellow

# Copy the EXE
Copy-Item "$OutputDir\publish\VanguardAgent.exe" "$OutputDir\VanguardAgent.exe"

# Copy config template
Copy-Item "$ProjectDir\config.json" "$OutputDir\config.json"

# Copy README
Copy-Item "$ProjectDir\README.md" "$OutputDir\README.md"

Write-Host "[3/3] Creating installer package..." -ForegroundColor Yellow

# Create a simple batch installer that copies files AND installs the service
$installerContent = @'
@echo off
echo ============================================
echo   Ultrium Vanguard Agent Installer
echo ============================================
echo.

:: Check for admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run as Administrator
    pause
    exit /b 1
)

set INSTALL_DIR=C:\Program Files\Vanguard

echo Installing to %INSTALL_DIR%...
mkdir "%INSTALL_DIR%" 2>nul

:: IMPORTANT: Copy the executable files FIRST before trying to install the service
echo Copying agent files...
copy /Y "%~dp0VanguardAgent.exe" "%INSTALL_DIR%\" >nul
if %errorLevel% neq 0 (
    echo ERROR: Failed to copy VanguardAgent.exe
    pause
    exit /b 1
)
copy /Y "%~dp0config.json" "%INSTALL_DIR%\" >nul

echo.
echo Installing Windows Service...
:: Use sc.exe to create the service pointing to the installed EXE
sc create VanguardAgent binPath= "%INSTALL_DIR%\VanguardAgent.exe" start= auto DisplayName= "Ultrium Vanguard Agent"
if %errorLevel% neq 0 (
    echo WARNING: Service may already exist or failed to create.
)

:: Set service description
sc description VanguardAgent "Ultrium Vanguard RMM Agent - Monitors system health and executes remote commands"

echo.
echo Starting service...
net start VanguardAgent
if %errorLevel% neq 0 (
    echo WARNING: Service failed to start. Check configuration.
)

echo.
echo ============================================
echo   Installation complete!
echo ============================================
echo.
echo Configuration: %INSTALL_DIR%\config.json
pause
'@

$installerContent | Out-File -FilePath "$OutputDir\install.bat" -Encoding ASCII

# Create uninstaller
$uninstallerContent = @'
@echo off
echo ============================================
echo   Ultrium Vanguard Agent Uninstaller
echo ============================================
echo.

:: Check for admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run as Administrator
    pause
    exit /b 1
)

set INSTALL_DIR=C:\Program Files\Vanguard

echo Stopping service...
net stop VanguardAgent 2>nul

echo Removing service...
sc delete VanguardAgent 2>nul

echo Removing files...
rmdir /S /Q "%INSTALL_DIR%" 2>nul

echo.
echo Uninstallation complete!
pause
'@

$uninstallerContent | Out-File -FilePath "$OutputDir\uninstall.bat" -Encoding ASCII

if ($Package) {
    Write-Host ""
    Write-Host "Creating ZIP package..." -ForegroundColor Yellow
    
    Compress-Archive -Path "$OutputDir\*" -DestinationPath "$OutputDir\VanguardAgent-win-x64.zip" -Force
    
    Write-Host ""
    Write-Host "Package created: $OutputDir\VanguardAgent-win-x64.zip" -ForegroundColor Green
}

# Cleanup
Remove-Item "$OutputDir\publish" -Recurse -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output directory: $OutputDir" -ForegroundColor White
Write-Host ""
Write-Host "Files:" -ForegroundColor White
Get-ChildItem $OutputDir | ForEach-Object { Write-Host "  - $($_.Name)" }
