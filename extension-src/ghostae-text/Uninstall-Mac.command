#!/bin/bash
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/com.ghost.text"
if [ -d "$DEST" ]; then rm -rf "$DEST"; echo "Removed: $DEST"; else echo "Nothing to remove."; fi
echo "Your license activation in Documents/Ghostae/License is kept."
# Revert the CEP debug flag the installer enabled (CSXS.9 - CSXS.14),
# so unsigned-extension loading does not stay on after uninstall.
for V in 9 10 11 12 13 14; do defaults delete com.adobe.CSXS.$V PlayerDebugMode 2>/dev/null; done
killall cfprefsd 2>/dev/null
echo "Restored default CEP security settings."
read -n 1 -s -r -p "Press any key to close..."
