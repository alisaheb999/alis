# Admin panel UI overhaul + mismatch fixes

## What the user will see
- One consistent dark Ghostae look across every admin page (Home, Products, Release Hub, AI Brain, Logs, Billing, Feedback) — same card style, corner roundness, spacing, button and badge styles.
- Cleaner sidebar: active item clearly highlighted, distinct icons (Products and Release Hub currently share the same icon), refresh/sign-out grouped neatly.
- Consistent language: menu and page titles in Bangla with English product terms (today it mixes "হোম", "Release Hub", "Total Licenses", "Sign out" randomly).
- Stat cards (orders, revenue, licences, devices) in one shared style on every page.
- Mobile: same top bar and bottom nav look as desktop, no overflowing tables.

## Mismatches found
- ~860 hardcoded colours (slate/blue/white/#060606/#e34850) instead of the site's theme colours — admin looks different from the main site.
- Mixed corner styles (rounded-md / lg / xl / 2xl) for the same kind of card.
- Old Caption-only plan list (Ultra/Team) in licence issuing that no longer matches real products/prices.
- Hidden leftover sections (old "keys" and "patch" tabs) not reachable from the menu — remove or fold into Products.
- Duplicate stat-card markup in several files.

## Technical details
- Add admin tokens (surface, surface-2, border-subtle, success, warning, danger) in `src/styles.css`; replace hardcoded classes in `src/routes/admin.tsx` and `src/components/ghost/Admin*.tsx`.
- Create shared `AdminCard`, `AdminStat`, `AdminBadge`, `AdminSection` primitives; standardise radius to `rounded-xl` (cards) / `rounded-lg` (controls).
- Remove dead `keys`/`patch` branches; licence plan options read from the products catalog.
- No backend/logic changes; verify each tab via signed-in Playwright screenshots (desktop + mobile).
