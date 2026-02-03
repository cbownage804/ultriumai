@echo off
setlocal EnableExtensions

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

set "INSTALL_DIR=%ProgramFiles%\Vanguard"

echo Installing to "%INSTALL_DIR%"...
mkdir "%INSTALL_DIR%" 2>nul

:: IMPORTANT: Copy the executable files FIRST before trying to install the service
echo Copying agent files...
copy /Y "%~dp0VanguardAgent.exe" "%INSTALL_DIR%\VanguardAgent.exe" >nul
if %errorLevel% neq 0 (
    echo ERROR: Failed to copy VanguardAgent.exe
    echo Source: "%~dp0VanguardAgent.exe"
    pause
    exit /b 1
)
copy /Y "%~dp0config.json" "%INSTALL_DIR%\config.json" >nul

if not exist "%INSTALL_DIR%\VanguardAgent.exe" (
    echo ERROR: VanguardAgent.exe missing after copy.
    echo Expected: "%INSTALL_DIR%\VanguardAgent.exe"
    pause
    exit /b 1
)

echo.
echo Installing Windows Service...

:: If the service already exists, update it instead of failing.
:: IMPORTANT: Must pass --service flag so agent runs in headless service mode
sc query VanguardAgent >nul 2>&1
if %errorLevel% equ 0 (
    echo Service already exists - updating configuration...
    sc stop VanguardAgent >nul 2>&1
    sc config VanguardAgent binPath= "\"%INSTALL_DIR%\VanguardAgent.exe\" --service" start= auto DisplayName= "\"Ultrium Vanguard Agent\"" >nul
) else (
    sc create VanguardAgent binPath= "\"%INSTALL_DIR%\VanguardAgent.exe\" --service" start= auto DisplayName= "\"Ultrium Vanguard Agent\"" >nul
)

if %errorLevel% neq 0 (
    echo ERROR: Failed to create/configure Windows Service.
    echo Try: sc qc VanguardAgent
    pause
    exit /b 1
)

:: Set service description
sc description VanguardAgent "Ultrium Vanguard RMM Agent - Monitors system health and executes remote commands" >nul 2>&1

echo.
echo Starting service...
net start VanguardAgent
if %errorLevel% neq 0 (
    echo WARNING: Service failed to start.
    echo - Verify credentials in: "%INSTALL_DIR%\config.json"
    echo - Check service status: sc query VanguardAgent
)

echo.
echo ============================================
echo   Installation complete!
echo ============================================
echo.
echo Configuration: "%INSTALL_DIR%\config.json"
pause

endlocal
