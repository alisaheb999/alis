@echo off
setlocal
title Ghostae Text - Installer
echo ==========================================
echo   Ghostae Text  -  After Effects Installer
echo ==========================================
echo.

set "SRC=%~dp0com.ghost.text"
if not exist "%SRC%\CSXS\manifest.xml" (
  echo [ERROR] com.ghost.text folder not found next to this installer.
  echo Please unzip the whole package first, then run this file again.
  pause & exit /b 1
)

set "DEST=%APPDATA%\Adobe\CEP\extensions\com.ghost.text"

echo Closing After Effects is recommended before continuing.
pause

if exist "%DEST%" (
  echo Removing previous version...
  rmdir /s /q "%DEST%"
)
echo Copying files...
xcopy "%SRC%" "%DEST%" /E /I /Y /Q >nul
if errorlevel 1 (
  echo [ERROR] Copy failed. Try running this installer as Administrator.
  pause & exit /b 1
)

echo Enabling unsigned extensions (CEP debug mode)...
for %%V in (9 10 11 12 13 14) do (
  reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)

echo.
echo [DONE] Installed to:
echo   %DEST%
echo.
echo Open After Effects and go to:  Window ^> Extensions ^> Ghostae Text
echo.
pause
