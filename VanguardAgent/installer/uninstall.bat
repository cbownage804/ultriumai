@echo off
setlocal EnableExtensions

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

set "INSTALL_DIR=%ProgramFiles%\Vanguard"

echo Stopping service...
net stop VanguardAgent 2>nul

echo Removing service...
sc delete VanguardAgent 2>nul

echo Removing files...
rmdir /S /Q "%INSTALL_DIR%" 2>nul

echo.
echo Uninstallation complete!
pause

endlocal
