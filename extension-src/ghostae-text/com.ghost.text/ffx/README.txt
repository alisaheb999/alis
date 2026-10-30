GHOST TOOLKIT — FFX preset folder
=================================

Drop After Effects preset files (.ffx) into this folder. The GHOST TOOLKIT panel
scans it on launch and shows every preset in the "FFX Presets" sections.

Slots the panel expects by default (rename your presets to match, or just add
your own files — anything ending in .ffx is listed):

  Animation tab
    GHOST_Kinetic_Rise.ffx     → falls back to the built-in "Slide Up" build
    GHOST_Elastic_Drop.ffx     → falls back to the built-in "Drop Bounce" build

  Color & FX tab
    GHOST_Neon_Look.ffx        → falls back to the built-in "Ghost Cyan" look
    GHOST_Gold_Cinematic.ffx   → falls back to the built-in "Molten Gold" look

How to save a preset from After Effects:
  1. Select the animated properties / effects on a layer.
  2. Animation ▸ Save Animation Preset…
  3. Save the .ffx into this folder using one of the names above.
  4. Reopen the GHOST TOOLKIT panel — the badge turns from "FFX*" to "FFX".

A "FFX*" badge means the file is not installed yet; clicking still works because
the panel builds the equivalent animation/look with a script fallback.
