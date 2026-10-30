#!/bin/bash
# Ghostae Caption - macOS installer
cd "$(dirname "$0")" || exit 1

PANEL="Ghostae Caption"
SRC="./$PANEL"
LOG="/tmp/ghostae-caption-install.log"
: > "$LOG"

echo ""
echo "  =========================================================="
echo "    GHOSTAE CAPTION  -  After Effects Installer (macOS)"
echo "  =========================================================="
echo ""

fail() {
  echo ""
  echo "  [X] $1"
  echo "      Log: $LOG"
  echo ""
  read -r -p "  Press enter to close" _
  exit 1
}

[ -f "$SRC/CSXS/manifest.xml" ] || fail "'$PANEL' folder not found next to this installer. Extract the whole ZIP first."

echo "  [1/6] Checking After Effects..."
tries=0
while pgrep -x "After Effects" >/dev/null 2>&1 || pgrep -f "Adobe After Effects" >/dev/null 2>&1; do
  tries=$((tries + 1))
  if [ "$tries" -ge 6 ]; then
    echo "        Still running - continuing anyway (restart AE afterwards)."
    break
  fi
  echo "        After Effects is open. Quit it, then press enter."
  read -r _
done
echo "        OK"

echo "  [2/6] Enabling unsigned extensions (CEP debug mode)..."
for v in 6 7 8 9 10 11 12 13; do
  defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1 >>"$LOG" 2>&1
done
killall cfprefsd >>"$LOG" 2>&1
echo "        OK"

echo "  [3/6] Locating the extensions folder..."
DST=""
for cand in "$HOME/Library/Application Support/Adobe/CEP/extensions" \
            "/Library/Application Support/Adobe/CEP/extensions"; do
  mkdir -p "$cand" >>"$LOG" 2>&1
  if [ -d "$cand" ] && [ -w "$cand" ]; then DST="$cand"; break; fi
done
[ -n "$DST" ] || fail "No writable Adobe CEP extensions folder. Try again with admin rights."
echo "        $DST"

echo "  [4/6] Removing the previous version (if any)..."
rm -rf "$DST/$PANEL" "$DST/com.ghostae.caption" >>"$LOG" 2>&1
echo "        OK"

echo "  [5/6] Installing files..."
mkdir -p "$DST/$PANEL" || fail "Could not create $DST/$PANEL"
if ! cp -R "$SRC/." "$DST/$PANEL/" >>"$LOG" 2>&1; then
  echo "        cp failed - trying ditto..."
  ditto "$SRC" "$DST/$PANEL" >>"$LOG" 2>&1 || fail "Copying the extension failed."
fi
chmod -R u+rw "$DST/$PANEL" >>"$LOG" 2>&1
xattr -dr com.apple.quarantine "$DST/$PANEL" >>"$LOG" 2>&1
echo "        OK"

echo "  [6/6] Verifying the installation..."
for f in "CSXS/manifest.xml" "index.html" "js/panel.js" "js/host.jsx" "js/ghost-gate.js" "presets/catalog.js"; do
  [ -e "$DST/$PANEL/$f" ] || fail "Installation incomplete - missing $f. The source folder was kept so you can retry."
done
echo "        OK - all required files present"

# Clean up the extracted source folder
rm -rf "$SRC" >>"$LOG" 2>&1

echo ""
echo "  =========================================================="
echo "    INSTALL COMPLETE"
echo "  =========================================================="
echo ""
echo "    Installed to : $DST/$PANEL"
echo ""
echo "    Next steps:"
echo "      1. Start After Effects"
echo "      2. Window > Extensions > Ghostae Caption"
echo "      3. Enter your licence key in the panel"
echo ""
echo "    Licence key / support : WhatsApp +880 1345 407572"
echo ""
read -r -p "  Press enter to close" _
