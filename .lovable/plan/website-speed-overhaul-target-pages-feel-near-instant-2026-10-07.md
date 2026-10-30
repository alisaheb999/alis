# Website speed overhaul (target: pages feel near-instant)

## What the research found (live ghostae.com)
- Every page is rebuilt from scratch on each visit (no caching): 220–580 ms wait before anything arrives.
- Main code file is 664 KB (190 KB compressed) — every page downloads it, including big text/HTML blocks of Home and Text pages.
- Text page hero loads a 1.7 MB GIF at top priority; 100+ more GIFs rotate below.
- Cache Light card image is 885 KB (should be ~40 KB).
- Text page waits on Google Fonts (2 extra trips to Google).
- Style file is 177 KB; an unused animation library is still installed.
- Products page shows free resources only after a second request (late pop-in).
- A 21 KB tracking script loads on every page.

Honest note: "10x" is realistic for page weight and repeat-visit load time; first-byte time is limited by the internet itself. We will measure before and after.

## Plan (in order of impact)

1. **Edge caching of pages** — Home, Products, Text, Caption, free-resource pages served from Cloudflare's cache (refresh every few minutes in the background). Price/offer stays fresh because it is re-checked in the browser. Biggest single win.
2. **Text page hero GIF → short MP4/WebM video** (1.7 MB → ~150 KB), poster image shows instantly.
3. **Showcase GIFs → lightweight video/WebP**, only the visible ones play.
4. **Recompress images** — Cache Light card 885 KB → ~40 KB, app icons and share images re-encoded.
5. **Split the main code** — Home/Text page content and showcase list load only on their own page; remove unused library.
6. **Self-host the Bengali font** (only needed letters), no Google round-trips.
7. **Trim the style file** — remove unused styles.
8. **Products page** — free resources arrive with the page (no pop-in).
9. **Tracking script and "Ask Ghostae AI"** load only after the page is idle.
10. **Before/after measurement** with Lighthouse on mobile for each main page, numbers reported back.

## Technical details
- Caching: `setResponseHeader("cache-control", "public, s-maxage=300, stale-while-revalidate=86400")` in route/server handling for public routes; never for /admin, /account, /api, auth pages. Verify where `no-cache` originates (`src/server.ts` / config). Optional prerender for fully static routes.
- Video: ffmpeg H.264 + WebM, `<video autoplay muted loop playsinline preload="metadata" poster>`; upload via lovable-assets. Showcase: convert GIF URLs in `showcase-data.ts` to video/animated WebP, IntersectionObserver play/pause.
- Images: `product-cache.webp` resized to display size (~800 px, q75); manifest PNG/OG JPG re-encoded.
- Bundle: move `content/home-page/*`, `content/text-page/*` strings behind route-level dynamic imports; `bun remove framer-motion`; check bundle with build stats.
- Font: subset Noto Serif Bengali woff2 into `public/fonts`, `font-display: swap`, preload on /products/text only.
- `/products`: move `getFreeResources` to route loader with `ensureQueryData`.
- `/~flock.js`: identify origin; defer via idle callback or remove if unused. Assistant: `requestIdleCallback` instead of fixed 3.5 s timer.
- Lighthouse (mobile) via Playwright/CLI against preview and live, before and after.
