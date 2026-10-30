@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Ghostae Ecosystem - Uninstaller

set "CEP=%APPDATA%\Adobe\CEP\extensions"

echo.
echo  Removing Ghostae panels from %CEP%
echo.

for %%N in (com.ghost.cache com.ghost.text com.ghost.presets com.ghost.bridge com.ghost.creativesystem) do (
  if exist "%CEP%\%%N" (
    rmdir /S /Q "%CEP%\%%N"
    echo  removed %%N
  )
)

echo.
echo  Done. Licence and settings in Documents\Ghostae remain.
echo.
pause
