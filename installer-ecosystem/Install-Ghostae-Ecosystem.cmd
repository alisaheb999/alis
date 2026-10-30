@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Ghostae Ecosystem - Installer

REM ==========================================================
REM  Installs every Ghostae panel found in .\panels\ into the
REM  per-user Adobe CEP extensions folder. No admin rights.
REM      Install-Ghostae-Ecosystem.cmd        (interactive)
REM      Install-Ghostae-Ecosystem.cmd /S     (silent)
REM ==========================================================

set "SRC=%~dp0panels"
set "CEP=%APPDATA%\Adobe\CEP\extensions"
set "SILENT=0"
for %%A in (%*) do if /I "%%~A"=="/S" set "SILENT=1"

echo.
echo  ==========================================
echo    GHOSTAE ECOSYSTEM - After Effects
echo  ==========================================
echo.

if not exist "%SRC%" (
  echo  [ERROR] panels folder not found next to this script.
  goto :fail
)

tasklist /FI "IMAGENAME eq AfterFX.exe" 2>nul | find /I "AfterFX.exe" >nul
if not errorlevel 1 (
  echo  After Effects is running - please close it, then press a key.
  if "%SILENT%"=="0" pause >nul
)

echo  [1/3] Enabling CEP debug mode...
for %%V in (9 10 11 12 13) do (
  reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)

echo  [2/3] Installing panels...
if not exist "%CEP%" mkdir "%CEP%" >nul 2>&1
for /d %%P in ("%SRC%\*") do (
  set "NAME=%%~nxP"
  set "DEST=%CEP%\!NAME!"
  if exist "!DEST!" (
    echo        backup !NAME!
    move /Y "!DEST!" "!DEST!_backup_%RANDOM%" >nul 2>&1
  )
  echo        install !NAME!
  robocopy "%%~P" "!DEST!" /E /NFL /NDL /NJH /NJS /NP /R:2 /W:1 >nul
  if errorlevel 8 (
    echo  [ERROR] Copy failed for !NAME!.
    goto :fail
  )
)

echo  [3/3] Verifying...
for /d %%P in ("%SRC%\*") do (
  if not exist "%CEP%\%%~nxP\CSXS\manifest.xml" (
    echo  [ERROR] %%~nxP did not install correctly.
    goto :fail
  )
)

echo.
echo  INSTALL COMPLETE
echo  Start After Effects: Window ^> Extensions ^> Ghostae ...
echo.
if "%SILENT%"=="0" pause
exit /b 0

:fail
echo.
if "%SILENT%"=="0" pause
exit /b 1
