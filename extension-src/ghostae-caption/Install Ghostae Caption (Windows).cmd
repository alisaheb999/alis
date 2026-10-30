@echo off
setlocal EnableExtensions
title Ghostae Caption - Installer
color 0B
set "PANEL=Ghostae Caption"
set "SRC=%~dp0%PANEL%"
set "LOG=%TEMP%\ghostae-caption-install.log"
set "OK=0"
set "DST="

> "%LOG%" echo Ghostae Caption installer log - %DATE% %TIME%

echo.
echo  ==========================================================
echo    GHOSTAE CAPTION  -  After Effects Installer (Windows)
echo  ==========================================================
echo.
echo   Log file: %LOG%
echo.

REM ---------------------------------------------------------------
REM  0. Source check
REM ---------------------------------------------------------------
if not exist "%SRC%\CSXS\manifest.xml" goto :no_source

REM ---------------------------------------------------------------
REM  1. After Effects must be closed
REM ---------------------------------------------------------------
echo  [1/6] Checking After Effects...
set /a TRY=0
:ae_check
tasklist /FI "IMAGENAME eq AfterFX.exe" 2>nul | find /I "AfterFX.exe" >nul
if errorlevel 1 goto :ae_closed
set /a TRY+=1
if %TRY% GEQ 6 (
  echo         After Effects is still running - continuing anyway.
  echo         Restart After Effects after the install finishes.
  goto :ae_closed
)
echo         After Effects is open. Please close it completely, then press a key.
pause >nul
goto :ae_check
:ae_closed
echo         OK
echo AE check done >> "%LOG%"

REM ---------------------------------------------------------------
REM  2. Unsigned extension support (CEP debug mode) - 3 methods
REM ---------------------------------------------------------------
echo  [2/6] Enabling unsigned extensions (CEP debug mode)...
set "DBG=0"
for %%V in (6 7 8 9 10 11 12 13) do (
  reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >>"%LOG%" 2>&1 && set "DBG=1"
)
if "%DBG%"=="0" (
  echo         reg.exe failed - trying PowerShell...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "6..13 | ForEach-Object { $k='HKCU:\Software\Adobe\CSXS.'+$_; if(!(Test-Path $k)){New-Item $k -Force | Out-Null}; New-ItemProperty -Path $k -Name PlayerDebugMode -Value '1' -PropertyType String -Force | Out-Null }" >>"%LOG%" 2>&1
  if not errorlevel 1 set "DBG=1"
)
if "%DBG%"=="0" (
  echo         Trying .reg import...
  > "%TEMP%\ghostae-cep.reg" echo Windows Registry Editor Version 5.00
  for %%V in (6 7 8 9 10 11 12 13) do (
    >> "%TEMP%\ghostae-cep.reg" echo.
    >> "%TEMP%\ghostae-cep.reg" echo [HKEY_CURRENT_USER\Software\Adobe\CSXS.%%V]
    >> "%TEMP%\ghostae-cep.reg" echo "PlayerDebugMode"="1"
  )
  reg import "%TEMP%\ghostae-cep.reg" >>"%LOG%" 2>&1 && set "DBG=1"
  del "%TEMP%\ghostae-cep.reg" >nul 2>&1
)
if "%DBG%"=="1" (echo         OK) else (echo         WARNING: could not write the registry key - the panel may not appear.)

REM ---------------------------------------------------------------
REM  3. Pick a writable CEP extensions folder (3 candidates)
REM ---------------------------------------------------------------
echo  [3/6] Locating the After Effects extensions folder...
call :try_target "%APPDATA%\Adobe\CEP\extensions"
if not defined DST call :try_target "%CommonProgramFiles%\Adobe\CEP\extensions"
if not defined DST call :try_target "%CommonProgramFiles(x86)%\Adobe\CEP\extensions"
if not defined DST call :try_target "%ProgramFiles%\Common Files\Adobe\CEP\extensions"
if not defined DST goto :no_target
echo         %DST%

REM ---------------------------------------------------------------
REM  4. Backup + remove the previous version
REM ---------------------------------------------------------------
echo  [4/6] Removing the previous version (if any)...
if exist "%DST%\%PANEL%" (
  attrib -R -H -S "%DST%\%PANEL%\*" /S /D >nul 2>&1
  move /Y "%DST%\%PANEL%" "%DST%\%PANEL%_backup_%RANDOM%" >>"%LOG%" 2>&1
  if exist "%DST%\%PANEL%" rmdir /S /Q "%DST%\%PANEL%" >>"%LOG%" 2>&1
)
for /d %%B in ("%DST%\%PANEL%_backup_*") do rmdir /S /Q "%%~B" >nul 2>&1
if exist "%DST%\com.ghostae.caption" rmdir /S /Q "%DST%\com.ghostae.caption" >nul 2>&1
echo         OK

REM ---------------------------------------------------------------
REM  5. Copy - robocopy, then xcopy, then PowerShell
REM ---------------------------------------------------------------
echo  [5/6] Installing files...
mkdir "%DST%\%PANEL%" >nul 2>&1
robocopy "%SRC%" "%DST%\%PANEL%" /E /NFL /NDL /NJH /NJS /NP /R:2 /W:1 >>"%LOG%" 2>&1
if exist "%DST%\%PANEL%\CSXS\manifest.xml" goto :copied
echo         robocopy failed - trying xcopy...
xcopy "%SRC%" "%DST%\%PANEL%\" /E /I /H /Y /Q >>"%LOG%" 2>&1
if exist "%DST%\%PANEL%\CSXS\manifest.xml" goto :copied
echo         xcopy failed - trying PowerShell...
set "GA_SRC=%SRC%"
set "GA_DST=%DST%\%PANEL%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; New-Item -ItemType Directory -Force -Path $env:GA_DST | Out-Null; Copy-Item -LiteralPath (Join-Path $env:GA_SRC '*') -Destination $env:GA_DST -Recurse -Force" >>"%LOG%" 2>&1
if exist "%DST%\%PANEL%\CSXS\manifest.xml" goto :copied
goto :copy_failed
:copied
echo         OK

REM ---------------------------------------------------------------
REM  6. Verify
REM ---------------------------------------------------------------
echo  [6/6] Verifying the installation...
set "MISS="
for %%F in ("CSXS\manifest.xml" "index.html" "js\panel.js" "js\host.jsx" "js\ghost-gate.js" "presets\catalog.js") do (
  if not exist "%DST%\%PANEL%\%%~F" set "MISS=%%~F"
)
if defined MISS goto :verify_failed
echo         OK - all required files present
set "OK=1"

REM ---------------------------------------------------------------
REM  Clean up: remove the extracted source folder
REM ---------------------------------------------------------------
attrib -R -H -S "%SRC%\*" /S /D >nul 2>&1
rmdir /S /Q "%SRC%" >>"%LOG%" 2>&1
if exist "%SRC%" (
  set "GA_SRC=%SRC%"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Remove-Item -LiteralPath $env:GA_SRC -Recurse -Force -ErrorAction SilentlyContinue" >>"%LOG%" 2>&1
)
if exist "%SRC%" attrib +H "%SRC%" /S /D >nul 2>&1

color 0A
echo.
echo  ==========================================================
echo    INSTALL COMPLETE
echo  ==========================================================
echo.
echo    Installed to : %DST%\%PANEL%
echo.
echo    Next steps:
echo      1. Start After Effects
echo      2. Window ^> Extensions ^> Ghostae Caption
echo      3. Enter your licence key in the panel
echo.
echo    Licence key / support : WhatsApp +880 1345 407572
echo.
pause
exit /b 0

REM ================= helpers =================
:try_target
if defined DST exit /b 0
set "CAND=%~1"
if "%CAND%"=="" exit /b 0
if "%CAND:~0,1%"=="%%" exit /b 0
mkdir "%CAND%" >nul 2>&1
if not exist "%CAND%" exit /b 0
>"%CAND%\.ghostae_write_test" echo test 2>nul
if not exist "%CAND%\.ghostae_write_test" exit /b 0
del "%CAND%\.ghostae_write_test" >nul 2>&1
set "DST=%CAND%"
echo target=%CAND% >> "%LOG%"
exit /b 0

REM ================= failures =================
:no_source
color 0C
echo  [X] The "%PANEL%" folder was not found next to this installer.
echo.
echo      Extract the whole ZIP first (right click ^> Extract All),
echo      then run this installer from the extracted folder.
echo.
pause
exit /b 1

:no_target
color 0C
echo  [X] No writable Adobe CEP extensions folder could be created.
echo.
echo      Fix: right click this installer ^> "Run as administrator".
echo      Log: %LOG%
echo.
pause
exit /b 2

:copy_failed
color 0C
echo  [X] Copying the extension failed with all three methods.
echo.
echo      Try: close After Effects, pause your antivirus, then
echo           right click this installer ^> "Run as administrator".
echo      Log: %LOG%
echo.
pause
exit /b 3

:verify_failed
color 0C
echo  [X] Installation incomplete - missing: %MISS%
echo.
echo      The source folder was NOT deleted, so you can run the
echo      installer again. Log: %LOG%
echo.
pause
exit /b 4
