#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "=========================================="
echo "  Ghostae Text  -  After Effects Installer"
echo "=========================================="
echo

SRC="$(pwd)/com.ghost.text"
if [ ! -f "$SRC/CSXS/manifest.xml" ]; then
  echo "[ERROR] com.ghost.text folder not found next to this installer."
  echo "Unzip the whole package first, then run this file again."
  read -n 1 -s -r -p "Press any key to close..."; exit 1
fi

DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/com.ghost.text"

echo "Closing After Effects is recommended before continuing."
read -n 1 -s -r -p "Press any key to continue..."; echo

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
echo "Copying files..."
cp -R "$SRC" "$DEST"
xattr -dr com.apple.quarantine "$DEST" 2>/dev/null || true

echo "Enabling unsigned extensions (CEP debug mode)..."
for V in 9 10 11 12 13 14; do
  defaults write com.adobe.CSXS.$V PlayerDebugMode 1 2>/dev/null || true
done
killall cfprefsd 2>/dev/null || true

echo
echo "[DONE] Installed to:"
echo "  $DEST"
echo
echo "Open After Effects: Window > Extensions > Ghostae Text"
echo
read -n 1 -s -r -p "Press any key to close..."
