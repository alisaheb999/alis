# GHOST CACHE audit + new IDEA panel

## Part 1 — GHOST CACHE scan results

Issues found in `extension-src/GHOST Creative System`:

1. Sidebar resize was dead — the CSS read `--gcs-sidebar` while the JS wrote `--sidebar-width`. Fixed.
2. Sidebar drag wrote `localStorage` on every mouse-move (disk-backed in CEP, so the drag stuttered). Now debounced. Fixed.
3. Dead code in `ghost-library.js` — `checkForNewCloudAssets()` and a removed `cloudLibraryButton` lookup. Removed.
4. The production host was hardcoded in 8 separate files, so a base-URL override only moved part of the app. All of them now read one `js/ghost-config.js`. Fixed.
5. Bridge (`ghost-web-link.js`) could call its completion callback twice (size guard + stream error + timeout), producing "headers already sent" and a silent failed import. Callback is now latched. Fixed.
6. Search result cache grew without bound over a long session. Now pruned by age and capped. Fixed.
7. Placeholder `your-domain.com` shown in the updates UI. Replaced. Fixed.

Still open (small, will do with the panel work): grid re-render on every filter keystroke instead of a debounced pass, and thumbnail decode not being cancelled when a category changes mid-load.

## Part 2 — IDEA panel

### The hard part, honestly

Loading Pinterest/Behance/Dribbble inside the panel as a real browser does not work reliably:

- Those sites send `X-Frame-Options` / `frame-ancestors` CSP, so an iframe stays blank.
- CEP's embedded Chromium is several years old; modern site JS often fails outright.
- Even when a page renders, we cannot read pixels out of a cross-origin frame, so "drag to timeline" has no legal path from inside the frame.
- Logged-in boards need the user's session cookies, which the panel does not have.

So the panel must not pretend to be a browser. Three lanes instead, all landing in one place.

### Lane A — Discover (native grid, default view)

Backend aggregator route returns normalised results from licence-safe providers (Pexels, Pixabay, Openverse, Lexica). Panel renders its own card grid — fast, themed, works in the small panel width. Each card: preview, source badge, "Stage" button.

### Lane B — Sites (launcher)

Curated tiles (Pinterest, Behance, Dribbble, ArtStation, Motionographer…). Clicking opens the site in the system browser where the user is already signed in. No iframe, no blank panel.

### Lane C — Inbox (the return path)

The existing MV3 browser extension already talks to the panel's local server on `127.0.0.1:37421`. Extend it:

- New `POST /ghost/idea` — downloads the file to the GHOST inbox folder and *stages* it instead of importing immediately (right-click "Save to GHOST Idea" in the browser).
- `GET /ghost/idea` — panel polls/reads the staged list.
- Panel shows staged items as cards; "Add to timeline" then calls `GhostHost.addLayerToComp()`.
- Paste a URL or drop a file into the panel uses the same staging code path.

This split is why the flow is reliable: the browser does the authenticated browsing, the local bridge does the download, and only a real file on disk ever reaches After Effects.

```text
Browser (logged in)  ──right-click──▶  MV3 extension
                                          │ POST /ghost/idea
                                          ▼
                           panel local server :37421
                                          │ download to inbox
                                          ▼
                              IDEA ▸ Inbox (staged cards)
                                          │ "Add to timeline"
                                          ▼
                            GhostHost.addLayerToComp()
```

### UI

Same Ultra Clean language as TOOLS: three segmented tabs (Discover / Sites / Inbox), collapsible rail, right-anchored search, 2-column grid down to 260px panel width. No emoji.

## Technical notes

- New panel `com.ghost.idea.panel` registered in `CSXS/manifest.xml`, page `idea.html`, logic in `js/ghost-idea.js`, styles in `css/ghost-idea.css`.
- Backend: one server route (`/api/public/v1/idea/search`) fanning out to providers, cached, keys server-side only.
- Staged items keep `{ file, name, source, pageUrl, bytes }` so attribution can be shown and written into the project comment.
- Bridge groundwork for Lane C is already in place (`/ghost/idea` routes, `GhostWebLink.stage()`, `importFile()`, `clearStaged()`).
