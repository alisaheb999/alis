#!/bin/bash
# Ghostae Caption - macOS uninstaller
PANEL="Ghostae Caption"
echo ""
echo "  GHOSTAE CAPTION  -  Uninstaller (macOS)"
echo ""

if pgrep -x "After Effects" >/dev/null 2>&1 || pgrep -f "Adobe After Effects" >/dev/null 2>&1; then
  echo "  [STOP] Quit After Effects first, then run this again."
  read -r -p "  Press enter to close" _
  exit 2
fi

read -r -p "  Remove Ghostae Caption? [y/N]: " ans
case "$ans" in y|Y) ;; *) exit 0 ;; esac

found=0
for base in "$HOME/Library/Application Support/Adobe/CEP/extensions" \
            "/Library/Application Support/Adobe/CEP/extensions"; do
  for d in "$base/$PANEL" "$base/com.ghostae.caption"; do
    if [ -d "$d" ]; then
      rm -rf "$d" && { echo "   removed  $d"; found=1; } || echo "   FAILED   $d"
    fi
  done
done

echo ""
if [ "$found" = "0" ]; then
  echo "  Ghostae Caption was not installed."
else
  echo "  UNINSTALL COMPLETE. Restart After Effects."
fi
echo "  Your licence key stays valid - reinstall any time."
echo ""
read -r -p "  Press enter to close" _
