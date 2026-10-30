<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Public free-resource metadata lives in `free_resources`; anonymous users may read published rows, while admin server functions own all writes, so dashboard control cannot expose write access.
- A user owns at most one licence per product; every user-facing account query must explicitly filter by authenticated `user_id`, even when RLS also applies, because admins have broader read policies.
- Free-resource images use the private `free-resource-images` bucket and short-lived signed display URLs because public buckets are disabled for this workspace.
- Public storefront offers come only from owner-managed public offers and are recomputed server-side; never infer discounts from coupon availability, so the owner controls displayed offers.
- Admin pricing has one dedicated section; shared server-only pricing resolves canonical and legacy plan keys from published rows with catalogue fallbacks, so storefront, coupons and orders charge the same owner-managed amounts.
- Extension releases live in `extension_releases` + private `extension-releases` bucket; desktop gets ZIPs only via licence-checked short-lived signed links from `/desktop/download`, so paid ZIPs never become public.

- Public marketing HTML gets CDN caching (s-maxage 300, swr 1800) in `src/server.ts` `withEdgeCache`; keep swr below the 1h signed-image URL lifetime and never cache auth/admin/api paths.
- Text controls portal into memoized authored HTML, preserving DOM/image state; setup stays behind disclosure and purchase uses Button with server-returned amounts. Use the shared WhatsAppIcon for community branding.
- Text demonstration uses a CDN poster and click-to-load YouTube iframe before benefits; hero video falls back to its existing animated GIF on decode error so previews work in unsupported browsers.
- Text time-based price increases use one deterministic shared schedule applied after discounts in public offers, coupon previews and order creation; countdowns use server time without per-second requests so displayed and charged amounts agree.
- Purchase dialogs portal to body with scoped typography/tokens and inline Zod contact errors to isolate checkout; Text warms its lazy module after hydration for faster opening.
- Account recovery uses generic email recovery responses and verified recovery sessions; verified-email identity is revalidated before linking purchases to prevent account takeover.
- Checkout ownership requires a verified identity matching the purchase email; an HTTP-only short-lived hashed capability permits email corrections only on unclaimed pending orders, preventing session crossover and active-licence transfer.
- Lazy purchase guidance reads owned pending/paid orders; only paid matching active unexpired licences reveal keys. Browser markers select, never authorize. Text downloads share browser-safe constants.
- Account invoice PDFs are generated from authenticated owner-scoped paid orders through a lazy-loaded PDF library to avoid adding initial page weight.
- Website assistant facts use a shared server-only pricing read inside the handler and maintained public content, so answers never rely on outdated hardcoded offers.
- Android relay pairing uses admin-generated hashed expiring codes, atomic service-role-only registration, hashed device tokens and attempt limits; pairing stays isolated from order/licence activation.
- Public shareable payment pages reuse the shared checkout; submitted transfers hand off to authenticated owner-only dashboard orders with pending verification placeholders, so presentation never substitutes for payment approval.
- Coupon banners use an allow-listed security-definer public projection of explicitly published eligible coupons; admin publication remains authenticated and separate from price calculations to keep private codes private.
- Shared shell image states follow actual load/error events and source changes, including authored HTML, with viewport-aware lazy loading and no synthetic delay so missing sources never display broken icons.
- Two-column layouts go on a wrapper inside `<main>`; a global `main { display: block !important }` rule cancels grid utilities on `<main>`.
- Trust reuses payment proofs and the WhatsApp community to avoid duplicate media.
- Catalogue artwork/version labels use CDN pointers so home/products agree without changing installer versions.
- SiteHeader uses separate icon/text; favicon and app icons share icon artwork for consistent branding.
- Text licence routes under `/api/public/v1/text/*` reuse existing licences, lock SQL seat enforcement and sign machine-bound HMAC tokens with server-only `LICENSE_TOKEN_SECRET`; clients must not trust unsigned hub files, localhost replies or editable grace caches.

- Catalogue controls trials, not paid entitlements.
- Digital: shared grids, incomplete pages noindex; manual digital_orders recompute price/stock, hashed-IP limits, admin-only reads/writes.
- Digital local keys live in service-role-only inventory and allocate transactionally once per verified-paid order; delivery reads require the browser's hashed HttpOnly capability, never an order ID alone.
- Digital supplier checkout revalidates live stock and price server-side; ambiguous supplier purchase outcomes stay processing until reconciled to prevent duplicate wallet spending.
- Canboso is deferred; storefront and active order creation must not call its adapters or depend on its credentials.
- Digital delivery payloads live only in service-role-only digital_delivery_secrets; ordinary order/admin lists omit them and browser capability gates retrieval.
- Digital paid transitions require recorded verification provenance; delivered transitions require private saved material, and review publication uses a safe public projection.
- RelatedProducts ends detail pages: cached free/paid items, excluding current.
- Giveaway: HttpOnly IDs, locked RPC, preserved spins, SVG results; clearing site data resets IDs.
- Team referral commissions are computed only by the orders DB trigger and withdrawals only via locking SQL functions, so no app path can double-credit or overdraw balances.
