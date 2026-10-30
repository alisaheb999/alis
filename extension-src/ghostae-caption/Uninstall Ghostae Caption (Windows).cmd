@echo off
setlocal EnableExtensions
title Ghostae Caption - Uninstaller
color 0E
set "PANEL=Ghostae Caption"
set "FOUND=0"

echo.
echo  ==========================================================
echo    GHOSTAE CAPTION  -  Uninstaller (Windows)
echo  ==========================================================
echo.

tasklist /FI "IMAGENAME eq AfterFX.exe" 2>nul | find /I "AfterFX.exe" >nul
if not errorlevel 1 (
  color 0C
  echo  [STOP] Close After Effects completely, then run this again.
  echo.
  pause
  exit /b 2
)

choice /C YN /N /M " Remove Ghostae Caption from After Effects? [Y/N]: "
if errorlevel 2 exit /b 0
echo.

call :kill "%APPDATA%\Adobe\CEP\extensions"
call :kill "%CommonProgramFiles%\Adobe\CEP\extensions"
call :kill "%CommonProgramFiles(x86)%\Adobe\CEP\extensions"
call :kill "%ProgramFiles%\Common Files\Adobe\CEP\extensions"

echo.
if "%FOUND%"=="0" (
  echo  Ghostae Caption was not installed for this Windows user.
) else (
  color 0A
  echo  UNINSTALL COMPLETE. Restart After Effects.
)
echo.
echo  Your licence key stays valid - reinstall any time.
echo.
pause
exit /b 0

:kill
set "BASE=%~1"
if "%BASE%"=="" exit /b 0
if not exist "%BASE%" exit /b 0
for /d %%D in ("%BASE%\%PANEL%" "%BASE%\%PANEL%_backup_*" "%BASE%\com.ghostae.caption") do (
  if exist "%%~D" (
    attrib -R -H -S "%%~D\*" /S /D >nul 2>&1
    rmdir /S /Q "%%~D" >nul 2>&1
    if exist "%%~D" (
      powershell -NoProfile -ExecutionPolicy Bypass -Command "Remove-Item -LiteralPath '%%~D' -Recurse -Force -ErrorAction SilentlyContinue" >nul 2>&1
    )
    if not exist "%%~D" (
      echo   removed  %%~D
      set "FOUND=1"
    ) else (
      echo   FAILED   %%~D  ^(try Run as administrator^)
    )
  )
)
exit /b 0
