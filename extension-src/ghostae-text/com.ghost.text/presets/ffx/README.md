# Built-in FFX Text Styles

Anything in this folder ships **inside** the GHOST panel as a built-in preset —
no install step, no Documents folder, it is always there after a fresh install.

## How to add a preset (100 % pinned build)

1. Copy your preset file here:
   - `My Style.ffx` — a real After Effects animation preset, or
   - `My Style.ghostffx` — a GHOST style preset (created from the panel).
2. Copy a preview image next to it with **exactly the same base name**:
   `My Style.png` (any size; 480×270 looks best in the grid).
3. Optionally add an entry to `pack.json` to control the display name, the tags
   and the sample text shown when there is no preview.

That's it. The panel lists it under **GHOST TEXT → Text Styles → FFX Text Style**
with a `BUILT-IN` badge, click applies it to the selected text layers.

## Notes

- Built-in presets cannot be deleted from the panel — use **Duplicate** to get an
  editable copy in `Documents/GHOST Creative System/Text Style Presets`.
- `.ffx` files are applied with After Effects' own `applyPreset()`, so they behave
  exactly like dragging the preset from the Effects & Presets panel.
- `.ghostffx` files are JSON: `{ "ghostffx": 1, "name": …, "groups": […], "doc": {…}, "tree": {…} }`.
  `doc` holds TextDocument values (fillColor, strokeColor, tracking, leading …),
  `tree` holds captured property trees (animators, effects, transform, layer styles).
- If a preview PNG is missing, the card falls back to the `sample` text.
