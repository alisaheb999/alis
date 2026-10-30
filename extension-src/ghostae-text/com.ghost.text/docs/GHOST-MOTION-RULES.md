# Ghostae Text — Motion Rules (v3.22.5)

Hand this whole file to any AI. It contains the exact rules that make
**Preview == Apply** in the Ghost Text After Effects panel. Presets built with
these rules work; anything invented outside them breaks.

There are two separate jobs. Do not mix them.

- **JOB A — Ghost Motion JSON pack** (the `+` button in the Animations tab).
  No code editing. This is the normal way to add animations.
- **JOB B — a built-in preset card** (edit 3 files). Only for expression-driven
  motion like the `Pop In` family.

---

## GOLDEN RULES (both jobs)

1. **One source of truth.** `js/ghost-motion.js` normalizes the JSON and builds
   the execution plan. Preview CSS and the After Effects animator both read
   that plan. Never write a second, hand-made translation of a motion.
2. **Never invent property names.** Only the canonical names in the table below
   exist. An unknown key inside `from {}` is a hard validation error (by
   design — silent dropping is what used to make Apply differ from Preview).
3. **Offset state, not end state.** `from {}` describes where the text starts.
   The animation always resolves to the AE rest values (opacity 100, position
   `[0,0]`, scale `[100,100]`, rotation 0, blur `[0,0]`, tracking 0, skew 0).
4. **A value equal to its rest value is dropped** (it would be a no-op). So
   `"scale": 100` or `"opacity": 100` does nothing — leave it out.
5. **Time is one system.** Seconds by default. `"12f"` or `{ "frames": 12 }`
   means frames and is snapped to the comp frame rate. Never mix units in one
   animation.
6. **Test before shipping**: `node test/ghost-apply.test.js` and
   `node test/ghost-preview.test.js` must both print `ALL PASSED`.
   In the panel console: `GhostText.diagnoseMotion("Preset Name")` must print
   `OK` — it compares the plan against what After Effects actually built.

---

# JOB A — Write a Ghost Motion JSON pack

## A1. Envelope

```json
{
  "format": "ghostae-animation-pack",
  "version": 1,
  "animations": [ { /* one animation */ } ]
}
```

Reply with JSON only — no prose, no markdown fence, no comments.
Each animation needs a **unique short name** (2–3 words).

## A2. Animation fields

| Field | Type | Range / values | Default |
|---|---|---|---|
| `name` | string | unique, 2–3 words | required |
| `basis` | string | `chars` \| `charsExcl` \| `words` \| `lines` | `chars` |
| `direction` | string | `in` (animate on) \| `out` (animate off) | `in` |
| `duration` | seconds | 0.05 – 30 (keep 0.4 – 2.0 for real work) | 1.2 |
| `stagger` | seconds | 0 – 2 (keep 0.02 – 0.15) | 0.05 |
| `easing` | string | `linear` \| `easeIn` \| `easeOut` \| `easeInOut` \| `smooth` | `smooth` |
| `from` | object | offset state, see A3 | required |
| `selector` | object | range selector, see A4 | optional |
| `keyframes` | array | explicit keyframes, see A5 | optional |

`duration` is **per unit**, not the total. Total = `duration + stagger × (units − 1)`.

## A3. `from {}` — the only allowed properties

| JSON key (aliases) | AE property | Dim | Unit | Rest | Clamp |
|---|---|---|---|---|---|
| `opacity`, `alpha` | ADBE Text Opacity | 1 | % | 100 | 0 … 100 |
| `position`, `pos` | ADBE Text Position | 2 | px | `[0,0]` | ±12000 |
| `posX`/`px`, `posY`/`py` | ↑ single axis | 1 | px | 0 | ±12000 |
| `scale` (number = uniform, or `[x,y]`) | ADBE Text Scale | 2 | % | `[100,100]` | −1000 … 1000 |
| `scaleX`, `scaleY` | ↑ single axis | 1 | % | 100 | −1000 … 1000 |
| `rotation`, `rotZ` | ADBE Text Rotation | 1 | deg | 0 | ±3600 |
| `rotX`, `rotationX` | ADBE Text Rotation X | 1 | deg | 0 | ±3600 — **turns the layer 3D** |
| `rotY`, `rotationY` | ADBE Text Rotation Y | 1 | deg | 0 | ±3600 — **turns the layer 3D** |
| `blur` (number = uniform, or `[x,y]`) | ADBE Text Blur | 2 | px | `[0,0]` | 0 … 500 |
| `tracking`, `letterSpacing` | ADBE Text Tracking Amount | 1 | px | 0 | −500 … 1000 |
| `skew` | ADBE Text Skew | 1 | deg | 0 | ±85 |
| `color` + `"useColor": true` | ADBE Text Fill Color | 4 | hex / rgba | — | colour is ignored unless `useColor` is true |

Allowed meta keys inside `from`: `useColor`, `color`, `name`, `comment`, `notes`.
**Anything else = validation error.** No `translateY`, no `filter`, no
`letter-spacing`, no `z`, no `anchor`, no `wiggle`, no expressions.

## A4. `selector {}` — optional, all numbers

`start` 0–100 (def 0), `end` 0–100 (def 100), `offset` −100…100 (def 0),
`shape`: `square` | `rampup` | `rampdown` | `triangle` | `round` | `smooth`
(def `square`), `easeHigh` / `easeLow` −100…100 (def 0),
`randomize` bool (def false).

Hierarchy — never confuse these three levels:

```text
Text Animator            "GHOST MOTION — <name>"   (one per preset, signed)
  ├── Animator Properties  ← the values from from{}  (offset state)
  └── Range Selector       ← start/end/offset/shape/ease/randomize
        └── Offset is the ONLY keyframed selector property
```

The engine solves the selector window from `duration`, `stagger` and the unit
count, then keyframes **Offset** from off-text to past-text. Do not try to
hand-animate `start`/`end` — you will fight the solver.

## A5. `keyframes []` — optional, for motion the sweep cannot express

Use only when you need a real multi-step curve (overshoot, hold, bounce).

```json
"keyframes": [
  { "property": "posY", "time": 0,      "value": 60, "interpolation": "bezier", "easeIn": 85, "easeOut": 20 },
  { "property": "posY", "time": "6f",   "value": -8, "interpolation": "bezier" },
  { "property": "posY", "time": 0.5,    "value": 0,  "interpolation": "linear" }
]
```

- `property` must be a key from A3 and must also exist in `from {}`.
- `time`: seconds, `"12f"`, or `{ "frames": 12 }` — relative to the layer start,
  snapped to the comp frame rate.
- `interpolation`: `bezier` (default) | `linear` | `hold`.
- `easeIn` / `easeOut`: 0.1 – 100 influence; omitted = the animation easing.
- Times are sorted automatically; duplicates on the same time are not allowed.

## A6. Quality checklist for every generated animation

- 2–5 properties maximum. More reads as noise.
- `opacity: 0` in almost every `in` animation, otherwise text pops at full alpha.
- Motion distance: `posX/posY` 20–120 px; `blur` 8–40; `tracking` 6–30;
  `rotation` 8–180; `scale` 0 or 30–160.
- `stagger` 0.03–0.08 for `chars`, 0.08–0.15 for `words`, 0.12–0.25 for `lines`.
- `smooth` easing for reveals, `easeOut` for slides, `linear` only for typewriter.
- No two animations in one pack with the same name or the same `from` block.

## A7. Reference pack (valid, copy the shape)

```json
{
  "format": "ghostae-animation-pack",
  "version": 1,
  "animations": [
    {
      "name": "Blur Rise",
      "basis": "chars", "direction": "in",
      "duration": 1.0, "stagger": 0.05, "easing": "smooth",
      "from": { "opacity": 0, "posY": 60, "blur": 20 },
      "selector": { "shape": "rampup", "easeHigh": 40 }
    },
    {
      "name": "Word Drift Out",
      "basis": "words", "direction": "out",
      "duration": 0.8, "stagger": 0.1, "easing": "easeIn",
      "from": { "opacity": 0, "posX": -40, "tracking": 12 }
    }
  ]
}
```

---

# JOB B — Add a built-in preset card (the `Pop In` recipe)

The four working `Pop In` presets are **expression driven**, not keyframed.
Copy that recipe exactly. Three files, one identical name in all three.

## B1. `js/toolkit.js` — the card

Add one entry to the `ANIMATIONS` array (top of the file):

```js
{ name: "Pop In Scale", group: "word", anim: "tk-anim-popin-scale", seq: "word" },
{ name: "Bounce Drop", group: "word", anim: "tk-anim-bounce-drop", seq: "word" },
```

- `name` — must match the `case` in `host.jsx` **character for character**.
- `group` — one of `word`, `char`, `bounce`, `color`, `layer` (filter chips).
- `anim` — the CSS class from B2.
- `seq` — animation basis used by the sequencer (`word`, `char`, `line`).

## B2. `css/toolkit.css` — the preview

Two lines, and the timing must equal the AE motion or the card lies:

```css
@keyframes tkPopInScale { 0% { transform: scale(0); opacity: 0; } 24% { transform: scale(1.18); opacity: 1; } 36% { transform: scale(.94); } 60% { transform: scale(1); } 100% { transform: scale(1); } }
.tk-anim-popin-scale { animation: tkPopInScale 2.33s infinite ease-out; display: inline-block; animation-fill-mode: both; }
```

Rules: keep the `2.33s infinite` window used by the whole `Pop In` family, land
on the rest state by `60%`, and hold it to `100%` (that gap is the read pause).

## B3. `js/host.jsx` — the real After Effects build

Add a `case "<exact name>":` inside the `switch (name)` of
`tkApplySingleAnimation` (near the existing `Pop In` cases) and follow all of:

1. **Guard first**: `if (isText) { ... }` — never touch text properties on a
   non-text layer.
2. **Sliders for every tunable number** (`ADBE Slider Control` on
   `ADBE Effect Parade`), named `GHOST <something>`, so the user can edit the
   result. The expression reads them by name — never hardcode magic numbers in
   the expression.
3. **Animators must be named `"GHOST ..."`**. The cleanup loop removes only
   `GHOST`-prefixed animators and sliders — an unprefixed animator stacks
   forever on every later apply (that was a real bug).
4. **One motion animator + one opacity animator.** Motion holds the offset
   value, opacity holds 0; both driven by an Expression Selector.
5. **Expression Selector, always**:
   ```js
   var sel = anim.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
   sel.property("ADBE Text Range Type2").setValue(3);   // 3 = per-unit basis
   sel.property("ADBE Text Expressible Amount").expression = expr;
   ```
6. **Standard expression head** — start time from an `IN` marker, fall back to
   `inPoint`, stagger by `textIndex`:
   ```js
   var head = "delay = 0.15;\nvar startT = inPoint;\nif (marker.numKeys > 0) {\n  try { startT = marker.key('IN').time; } catch(e) {}\n}\nt = time - startT - (textIndex - 1) * delay;\n";
   ```
   Body: `if (t > 0) { <curve 100 -> 0> } else { 100; }` for motion, and
   `if (t > 0) { 0; } else { 100; }` for opacity.
   Elastic curve: `Math.exp(-decay*t) * (100*Math.cos(t*w) + amp*Math.sin(t*w))`
   with `w = freq * Math.PI * 2`. Smooth curve: `ease(t, 0, dur, 100, 0)`.
7. **Write the `IN` marker** at the end, inside try/catch:
   ```js
   try { layer.property("Marker").setValueAtTime(layer.inPoint, new MarkerValue("IN")); } catch (e) {}
   ```
8. **Match-name fallbacks.** 3D variants do not exist in every AE build. Try in
   order and bail out cleanly:
   ```js
   var tries = [["ADBE Text Scale 3D", [0,0,100]], ["ADBE Text Scale", [0,0]]];
   // loop, addProperty in try/catch, first success wins
   if (!prop) { try { anim.remove(); } catch (e) {} return "\"" + name + "\" is not supported by this After Effects version."; }
   ```
9. **ExtendScript (ES3) only**: `var` only, no `let`/`const`, no arrow
   functions, no template literals, no `Array.prototype.forEach/map`, no
   trailing commas, no `instanceof Array` on AE values (duck-type `.length`),
   and **unique variable names per case** (a `switch` shares one scope).
10. **Never report success on failure.** Return a message string, never
    silently `break` after a failed `addProperty`.

## B4. Verify a built-in preset

```bash
node --check js/toolkit.js        # host.jsx: copy to a .js file first
node test/ghost-apply.test.js
node test/ghost-preview.test.js
```
Then in After Effects: apply twice on the same layer — the second apply must
**replace**, not duplicate (idempotency), and the card preview must match what
the comp does.

---

## Which file for which problem

| I want to change… | Edit |
|---|---|
| preset list / names / groups | `js/toolkit.js` (`ANIMATIONS` array) |
| card preview animation | `css/toolkit.css` |
| what After Effects actually builds | `js/host.jsx` (`switch (name)`) |
| JSON schema, aliases, timing, easing | `js/ghost-motion.js` |
| apply transaction / verify / retry | `js/ghost-apply-engine.js` |
| pasted-pack parsing, AI prompt text | `js/ghost-anim-pack.js` |

Never edit `src/routeTree.gen.ts`-style generated files, and never change the
`GHOST ` name prefix or the `GM3|` signature format — cleanup and idempotency
depend on both.
