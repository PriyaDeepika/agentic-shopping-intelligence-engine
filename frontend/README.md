# Threadloop Storefront

A ground-up rebuild of the storefront frontend, built entirely on your Myntra
styles dataset (`Myntra_styles.xlsx` → `products.json`, 682 items with
matching images). No branding, copy, or product data from the reference
frontend was reused — only the general page layout / UX pattern.

## What changed vs. the reference frontend

- All product data now comes from **your** dataset. Nothing is hardcoded.
- Images load from `/images/{id}.jpg` (see `public/images/`, copied 1:1 from
  your `images.zip`). Any product whose image is missing falls back to a
  text placeholder instead of breaking the grid — none currently are missing.
- Categories, colors, genders, article types, usages, and seasons are all
  **derived from the dataset at runtime** (`src/lib/catalog.ts`), not
  hardcoded lists — add more rows/images later and the filters update
  automatically.
- Visual language (typography scale, spacing, hero/category-strip/grid
  layout, sticky nav, animated stats, card motion) mirrors the reference
  app's UX, rebuilt from scratch with new copy, a new name ("Threadloop"),
  system fonts instead of the bundled Satoshi files, and lucide-react icons
  instead of the bundled SVGs.

## Backend integration (zero backend code changes)

- `src/lib/api/client.ts` and `types.ts` mirror the **existing** FastAPI
  contract exactly (`GET /products`, `GET /products/{id}`, `POST /search`,
  `POST /cart`, `POST /coupon`) — same endpoints, same request/response
  shapes.
- The only backend-adjacent change is **data, not code**:
  `backend/backend/data/products.json` was regenerated from your dataset
  (see `gen_products.py`) using the exact same `Product` schema the backend
  already expects. This was verified by loading it through the real
  `app.models.product.Product` model and `product_loader.py` — 682/682
  parse cleanly, 0 missing images.
- `GET /products` caps `page_size` at 100 and has no gender/article-type/
  usage/season query params, so — without touching the backend — the
  frontend pages through the full catalog once on load, caches it in
  memory, and does faceted filtering, search suggestions, and "similar
  products" client-side (`src/lib/catalog.ts`).
- Cart and Wishlist are **localStorage-backed**, per your spec
  (`src/lib/hooks/useCart.tsx`, `useWishlist.tsx`). The cart page also calls
  the existing `POST /coupon` endpoint live to show applicable coupons —
  that integration was preserved rather than dropped.
- If the backend is unreachable, pages show an inline "can't reach backend"
  banner instead of crashing (`src/components/common/OfflineBanner.tsx`).

## Pages

- `/` — home (hero, dynamic category strip, new arrivals, top rated, on sale)
- `/shop` — full listing with gender/category/article-type/color/usage/
  season filters, price slider, sort, live search (`?q=`), pagination
- `/category/[slug]` — dynamic category deep-link, redirects into `/shop`
  pre-filtered
- `/product/[id]/[slug]` — product detail, size picker, add to cart,
  wishlist, "you may also like" (similar products)
- `/cart`, `/wishlist` — localStorage-backed

## Running it

```bash
cd project
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_URL at your backend
npm install
npm run dev
```

The backend itself needs no changes — just run it as you already do,
pointing `NEXT_PUBLIC_API_URL` at it.

## Scope note

This build covers everything in your explicit requirements list (listing,
detail, search, filters, wishlist, cart, similar products, dynamic
categories). The reference app also has an AI-assistant surface (chat /
wardrobe / recommend / budget-optimizer, backed by `/chat`, `/wardrobe`,
`/recommend`, `/optimize`) that wasn't in your requirements list — those
backend routes are untouched and ready to wire up if you want that page
rebuilt too, just say the word.
