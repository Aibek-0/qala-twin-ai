@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title QALA TWIN AI - Launcher
echo Starting QALA TWIN AI...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1" -OpenBrowser
if errorlevel 1 (
    echo.
    echo Could not start QALA TWIN AI. See the error above.
    echo Logs are in the .runtime folder.
    pause
    exit /b 1
)
echo.
echo QALA TWIN AI is ready. You can close this window.
timeout /t 5 >nul
exit /b 0
