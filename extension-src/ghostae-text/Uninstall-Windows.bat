@echo off
title Ghostae Text - Uninstaller
set "DEST=%APPDATA%\Adobe\CEP\extensions\com.ghost.text"
if exist "%DEST%" (
  rmdir /s /q "%DEST%"
  echo Removed: %DEST%
) else (
  echo Nothing to remove.
)
echo Your license activation in Documents\Ghostae\License is kept.
rem Revert the CEP debug flag the installer enabled (CSXS.9 - CSXS.14),
rem so unsigned-extension loading does not stay on after uninstall.
for %%V in (9 10 11 12 13 14) do reg delete "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /f >nul 2>&1
echo Restored default CEP security settings.
pause
