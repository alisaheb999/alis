@echo off
setlocal EnableExtensions
title Ghostae Text Uninstaller

set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" (
  echo.
  echo [Ghostae] ERROR: Windows PowerShell was not found.
  echo.
  pause
  exit /b 1
)

"%PS%" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer\Install-GhostaeText.ps1" -Uninstall
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo [Ghostae] Uninstall FAILED. Error code: %RC%
  echo.
  pause
  exit /b %RC%
)

echo [Ghostae] Uninstall completed successfully.
echo Restart After Effects if it was running.
echo.
pause
exit /b 0
