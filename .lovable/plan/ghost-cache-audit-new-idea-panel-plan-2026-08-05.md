# GHOST CACHE audit + new "Idea" panel plan

## Part 1 — GHOST CACHE scan results (issues found)

### Must fix
1. **Sidebar resize is dead.** `ghost-sidebar.js` writes `--sidebar-width`, but the newest sheet `ghost-cache-shell.css` pins the width from `var(--gcs-sidebar, 188px)` with `!important` — and `--gcs-sidebar` is never set anywhere. Result: drag-resize appears to work (state saved) but nothing moves, and the grid offset in `style.css` can disagree with the visible sidebar → gap/overlap.
2. **Dead UI code in `ghost-library.js`** referencing elements that no longer exist in `index.html`: `cloudNewButton`, `cloudNewText`, `cloudLibraryButton`. Those branches never run (leftover from an earlier redesign).
3. **API base URL hardcoded in 8 files** (`ghost-caption`, `ghost-cloud`, `ghost-patch`, `ghost-removebg`, `ghost-storyboard`, `ghost-system`, `ghost-template-data`). Only `ghost-cloud.js` honours the stored override, so a base-URL change breaks the other features silently. Needs one shared `GhostConfig.baseUrl`.
4. **`/ghost/send` can finish twice.** In `ghost-web-link.js` the 512 MB guard calls `done(error)` while the stream keeps flowing, and `stream.on("error")` can call `done` again → "headers already sent" throw. Needs a one-shot `done` latch.

### Should fix
5. **Two uncoordinated responsive systems**: `style.css` has 620/760/880px breakpoints while `ghost-cache-shell.css` is all-unconditional `!important` — narrow dock and wide floating panel behave identically. Consolidate into one breakpoint set.
6. **Sidebar drag writes `localStorage` on every mousemove** (sync disk write in CEP) → stutter. Use the existing `GhostPerf.rafThrottle`/`debounce`.
7. **19 stylesheets on one panel**, several overlapping in purpose. Merge the legacy patch sheets (`ghost-ui-fixes`, `ghost-patch`, `ghost-redesign-2026`) into the token/shell layer so cascade order stops being load-bearing.
8. **No shared timeout/retry policy** in `ghost-cloud.js`; each caller invents its own fallback → inconsistent behaviour on flaky networks.
9. **`ghost-search.js` cache never evicts** (grows per distinct query); `system-ui.js` still contains a placeholder `https://your-domain.com/ghost/`.
10. **Third-party AI hosts called directly from the panel** (`command-enhancements.js`, `ghost-system.js`): OpenAI/Anthropic/Groq/OpenRouter/Google. Should route through our own backend so keys never live in the panel.

---

## Part 2 — The "Idea" panel

### What it should feel like
A seventh GHOST panel (`GHOSTAE IDEA`) that looks like a small, clean reference browser:
- **Top**: search field + source chips (All / Pinterest / Behance / Dribbble / Pexels / Giphy / ArtStation / Lexica).
- **Left rail (collapsible, same pattern as CACHE)**: Discover, Boards (saved ideas), Inbox, Sites.
- **Main**: masonry grid of idea cards. Hover = enlarge; click = detail sheet with source link, palette swatches pulled from the image, and one primary action.
- **Bottom bar**: paste-a-link field + drop zone ("drop an image or link here") and a live bridge status dot.

### The hard part, stated honestly
Loading Pinterest/Behance/Dribbble *inside* CEP is the blocker, not the timeline part:
- CEP's CEF is old (Chromium ~65) and those sites are heavy React/CSP apps — many simply won't render or will crash the panel.
- They send `X-Frame-Options`/`frame-ancestors`, so a plain `<iframe>` is refused.
- They need a logged-in session; a proxy strips cookies, breaks OAuth, and puts us in ToS/scraping territory.
- No official Pinterest "browse" API for this use case (their API is OAuth + business scoped).

So: a real in-panel Pinterest browser is **not the right build**. Reverse-proxying to strip headers would technically render something, but it will break constantly and it is exactly the "বারবার ভুল" outcome we want to avoid.

### The approach that works in one pass — three lanes
**Lane A — Discover (real in-panel browsing, license-safe).**
Backend aggregator endpoint `GET /api/public/v1/idea/search?q=&source=&page=` that fans out to sources with proper APIs/feeds (Pexels, Pixabay, Giphy, Openverse, Lexica, plus RSS/oEmbed-friendly boards) and returns one normalised shape: `{ id, source, title, thumb, full, page_url, width, height, license }`. This renders natively in the panel grid — fast, no CEF limits, no login. This covers 80% of "idea browsing" without embedding anything.

**Lane B — Sites (launcher + armed bridge).**
The Sites tab shows the curated site tiles (Pinterest, Behance, Dribbble, ArtStation, Motionographer…). Clicking a tile opens it in the **system browser** via `CSInterface.openURLInDefaultBrowser` — the user's real logged-in session, full site, zero rendering risk. The panel simultaneously shows "Bridge armed — right-click any image → Send to After Effects".

**Lane C — Inbox (the return path, already built).**
The bridge already exists and works end-to-end: MV3 extension context-menu → `POST http://127.0.0.1:37421/ghost/send` → the panel's Node server downloads the file to the GHOST inbox folder → `evalScript` → `GhostHost.addLayerToComp()` imports it into the active comp. For Idea we extend it rather than reinvent it:
- Add `POST /ghost/idea` — same payload, but it **stages** the item into the Inbox grid instead of importing immediately (so the user curates first, then clicks "Add to timeline").
- Idea grid cards get the same single-action button as CACHE: `Save` → `Add to timeline`.
- Downloaded files register as a local source so they show up in CACHE too.
- Add drag-and-drop and paste support on the panel drop zone (a browser drag carries `text/uri-list`), so the bridge is a convenience, not a requirement.

### Timeline import — why this is the safe part
Nothing new is needed in ExtendScript. Every path (Discover download, Inbox item, dropped link, pasted URL) ends the same way: **file on disk → `GhostHost.addLayerToComp(path)`**. Images/video/audio import as footage; multi-select import creates a comp from the selection. Only one code path to test.

### Guardrails so it doesn't break later
- Discover requests are proxied and cached server-side (per query, ~10 min) so provider keys stay on the backend and quotas survive.
- Downloads go through the same Node downloader as the bridge: size cap, MIME allowlist, redirect-follow, one-shot completion latch (also fixes issue 4 above).
- Every card's `page_url` is kept, so attribution/licence is always one click away.
- Panel registered with the same narrow-dock rules the CACHE fix produces, so it works in a 320px-wide dock from day one.

### Build order
1. Fix CACHE issues 1–4 (they also unblock the shared shell/bridge code Idea reuses).
2. Backend: `/api/public/v1/idea/search` aggregator + cache; extend the bridge with `/ghost/idea`.
3. Panel: `idea.html` + `css/ghost-idea.css` + `js/ghost-idea.js`; register `com.ghost.idea.panel` in `CSXS/manifest.xml`.
4. Lanes A → C, then Boards (local JSON store), then the palette/detail sheet.
5. CACHE cleanups 5–10, version bump, single ZIP at the end.

### One decision needed from you
For Lane B, do you want to keep it as "open in system browser + Send to AE" (reliable), or should I *also* attempt an experimental in-panel embed for the few sites that allow framing — knowing it may render poorly on older AE builds?
