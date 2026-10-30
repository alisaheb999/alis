# GHOST TEXT → Text Style panel rebuild

## What is broken today

1. **Mixed languages.** Style names are half Bengali, half English (`সোনালি সূর্যাস্ত — Sunset Fade`), and the modal still has Bengali helper text. There is no language selector, only an internal `lang` flag and per-item `bn` flags.
2. **Preview ≠ result.** The web preview is CSS (`-webkit-text-stroke`, `text-shadow`, `background-clip: text`, `filter: drop-shadow` glow). After Effects has none of those. The applier (`tkApplyExtrude`, `tkApplyMultiColor`, `tkApplyGradient`) rebuilds an approximation, so glow disappears, gradients flatten, stroke width and shadow offsets shift, and colours read differently (no colour-space match).
3. **No true FFX pipeline for the pretty styles.** Real `.ffx` presets apply 1:1, but the CSS styles are not backed by `.ffx` files — only the small bundled pack is.
4. **Layout.** Create/Import FFX buttons are buried in a sub-header; two style families (web styles vs FFX cloud styles) are not visually separated.
5. **India / Chinese previews fail** — no Devanagari or CJK sample words and no font fallback, so those languages render as English or as boxes.

## Target UI (tab 2 of GHOST TEXT)

```text
┌──────────────────────────────────────────────┐
│ Text Styles                        [＋] [⤓]  │   ＋ Create FFX  ⤓ Import FFX
├──────────────────────────────────────────────┤
│ 🇬🇧 🇧🇩 🇮🇳 🇨🇳 🇸🇦 🇪🇸 🇮🇩 …   (flag chips)     │
├──────────────────────────────────────────────┤
│ WEB TEXT STYLES                              │
│ Some styles may not match exactly in AE.     │
│ [card][card][card]…                          │
├──────────────────────────────────────────────┤
│ FFX CLOUD TEXT STYLES        (exact match)   │
│ [png preview + FFX badge][…]                 │
└──────────────────────────────────────────────┘
```

## Fix strategy for preview ≠ result

Two style classes, honestly labelled:

**A. Web styles (approximate).** Instead of guessing, drive both sides from one spec object (fill, stroke width/colour, shadow offsets/colour, glow radius/intensity, tracking, caps). The renderer builds CSS from the spec; the AE applier builds real AE layers from the same numbers:
- fill → text fill colour
- stroke → text stroke (AE stroke width in px, matched to preview px at comp scale)
- shadow → Drop Shadow effect per offset step (or repeated instances for the 3-step extrude)
- glow → Glow effect (radius/intensity mapped from the CSS blur)
- gradient → Gradient Ramp on a duplicated fill matte, tied to text bounds (existing rig, but bounds refreshed after font change)

Also: convert every hex through sRGB → AE linear when the project is linearized, which is the main reason colours "change" after paste. Currently colours are pushed as raw /255.

**B. FFX cloud styles (exact).** Every hero style ships as a real `.ffx` + `.png` preview generated once from AE, stored in cloud storage, listed by the backend and cached locally. Applying uses `applyPreset`, so what the PNG shows is exactly what lands on the layer. Preview image is the render, not CSS — so mismatch becomes impossible for this family.

## Language layer

- Language registry: English, বাংলা, हिन्दी, 中文, العربية, Español, Bahasa, Português, Русский, 日本語 — each with flag icon, sample word, script and preferred font list.
- Style names become English-only; the sample word changes with the selected language, so one style serves all languages.
- Devanagari/CJK/Arabic: bundle-safe font stacks in the panel, plus an AE-side font-installed check with a clear "font missing" warning instead of a silent wrong render.

## Technical notes

Files touched:
- `toolkit.html` — new header actions (＋ / ⤓), language chip strip, two labelled sections.
- `js/toolkit.js` — spec-driven style renderer, language registry + chips, split render for web vs FFX cloud, remove `bn` hardcoding.
- `css/ghost-text-clean.css` — layout for chips, section headers, FFX cards.
- `js/host.jsx` — spec-driven applier: stroke/shadow/glow/gradient from the same numbers, sRGB→linear colour conversion, bounds refresh after font set.
- `js/ghost-cloud.js` / backend — list + download `.ffx` + `.png` pairs from cloud storage into the user preset folder.
- Cloud: a `text_styles` table (name, tags, ffx path, preview path, tier) plus a public storage bucket, with grants and read policies.

Delivered in two stages: stage 1 = new UI, languages, spec-driven web styles and colour fix; stage 2 = FFX cloud library (needs the actual `.ffx` files exported from AE — you can send a folder of them, or I generate them from the panel's Create FFX flow).
