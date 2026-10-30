# Ghostae Gear — Physical Products Store

## What you will get
- **Products page section "Ghostae Gear"** (subtitle "Useful gear for creators"). It shows up to 5 published items and has a "See More" link. It sits after Digital Tools and AI and before Free.
- **/gear store page**: store name, short intro, product count, a grid, a category filter and sorting (newest, price low to high, price high to low). The grid works for 100+ items.
- **/gear/$slug detail page**: image gallery, sale price and old price, description, features, specs, compatibility, box contents, and delivery/warranty/return info. Each part is hidden when it has no verified data. The order button opens WhatsApp with the product name filled in. "Suggested Products" at the bottom shows items from the same category plus ones you pick, never the current item.
- **Admin → Gear tab**: add and edit products, categories, images, prices and costs, stock, publish/draft, and suggested items. The tab shows estimated gross profit.
- Loading, empty and error states, plus mobile, tablet and desktop layouts.

## The 4 demo products (honest handling)
- I will add USB-C 6-in-1 Hub, 4-Port USB Hub, USB-C SD/TF Card Reader and Foldable Laptop Stand with the source links and the reference prices from your document.
- They start as **Draft**. Your document says no price goes live until you confirm the purchase cost. Customers see nothing until you enter a cost and price and press Publish.
- **Images:** I won't copy Daraz or Zipper photos without permission, and I won't make up image links. You upload your own photos in the admin. Until then each item shows a clean placeholder.
- Specs I can't confirm will be left empty, not guessed.

## Technical details
- Tables: `gear_categories`, `gear_products` (slug, texts, features/specs/compat/box jsonb, source_url, source_price, procurement_cost, extra_cost, sale_price, compare_price, stock_status, status draft/published, sort_order, last_verified_at), `gear_product_images`, `gear_related`. GRANTs and RLS: anon can read published rows only, with no cost columns, through a public view or a security-definer projection. Only admins can write, and the `has_role` check also runs in admin server functions.
- Private `gear-images` bucket with signed URLs, the same pattern as free-resource images.
- Server functions: public list/detail/related (cached), admin CRUD.
- `/gear` added to the edge-cache allowlist and the sitemap. Each route gets its own head(). Draft or missing items get noindex.
- Tests: the profit calculation, the rule that drafts stay hidden, and the rule that suggestions never include the current item.

## Risks
- With no photos and no approved prices the section stays hidden, so it looks empty at first.
- Orders go through WhatsApp only. There is no cart or online payment yet.
