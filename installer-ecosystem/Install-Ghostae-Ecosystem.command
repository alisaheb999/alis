#!/bin/bash
# Ghostae Ecosystem - macOS installer
set -e

HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/panels"
CEP="$HOME/Library/Application Support/Adobe/CEP/extensions"

echo ""
echo "  GHOSTAE ECOSYSTEM - After Effects"
echo ""

if [ ! -d "$SRC" ]; then
  echo "  [ERROR] panels folder not found next to this script."
  exit 1
fi

mkdir -p "$CEP"

echo "  [1/3] Enabling CEP debug mode..."
for v in 9 10 11 12 13; do
  defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1 2>/dev/null || true
done

echo "  [2/3] Installing panels..."
for panel in "$SRC"/*; do
  [ -d "$panel" ] || continue
  name="$(basename "$panel")"
  dest="$CEP/$name"
  if [ -d "$dest" ]; then
    echo "        backup $name"
    mv "$dest" "${dest}_backup_$(date +%Y%m%d%H%M%S)"
  fi
  echo "        install $name"
  cp -R "$panel" "$dest"
done

echo "  [3/3] Verifying..."
for panel in "$SRC"/*; do
  [ -d "$panel" ] || continue
  name="$(basename "$panel")"
  if [ ! -f "$CEP/$name/CSXS/manifest.xml" ]; then
    echo "  [ERROR] $name did not install correctly."
    exit 1
  fi
done

echo ""
echo "  INSTALL COMPLETE - restart After Effects."
echo ""
