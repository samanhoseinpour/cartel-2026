# Lane 7A report — Collection (PLP) · Brand pages · Brands index

Branch `lane/7a-plp` · built 2026-08-02 · base: batch 7.0 (`8605f71`)

## Status

| Check | Result |
| --- | --- |
| `shopify theme check` | **0 offenses in lane files** (only the pre-existing stock-Dawn `locales/bg.json` MatchingTranslations errors remain) |
| `assets/cartel-plp.js` | `node --check` clean + jsdom smoke test **15/15** (sort popover drives the hidden select and fires the bubbling `input` event facets.js listens for; drawer backdrop/Esc/scroll-lock incl. healing Dawn's leaked lock class) |
| Push to "Cartel 7A" | **BLOCKED — store is at Shopify's 20-theme limit** ("A shop may only have 20 themes"). Lanes don't delete themes. |
| Runtime acceptance checklist (1440/390) | **Pending the theme slot** — could not be run |

**Action needed from you:** free one theme slot (the old Expanse copies — e.g. "Expanse Bkup Oct25 2021" — look like candidates, but that's your call), then I run
`shopify theme push --unpublished -t "Cartel 7A"` → `shopify theme dev -t "Cartel 7A"` and finish the checklist. I did not run a plain `theme dev` here: the per-store development theme is shared and lane 7E's watcher is actively syncing it.

## What was built

**Collection PLP** (`/collections/*`)
- `sections/main-collection-banner.liquid` — shared breadcrumbs + `.collhead` band: `.kick` eyebrow (metafield `custom.eyebrow`, fallback "Shop all"), `h1.stitle.collhead-t`, `.lead.collhead-p` description, optional `.collhead-img` (setting, off by default).
- `sections/main-collection-product-grid.liquid` — `.plptop` toolbar (`#ProductCount` "Showing N of M", mobile `.filterbtn`, `.sortwrap` popover), `.activebar` chips, `.plpbody` = sticky `.filters` rail + `#ProductGridContainer > .collection > #product-grid.pgrid` of frozen `cartel-card`s, design empty-state with clear-filters, Dawn `pagination` snippet restyled to pill controls. Loads `facets.js` + `product-form.js`.
- `snippets/facets.liquid` — full rewrite, one snippet, three `part`s (`toolbar` / `active` / `rail`; omit part = all pieces, Dawn-style call for search). Facet presentation: boolean → `.fswitch` "In stock only", price → `price-facet`, list → `.fopt` checkbox rows with counts, or `.fpill` pills when every value label is short (≤4 chars, or ≤8 for variant-option filters — catches Curl/Length/Thickness, keeps Brand as rows).
- `snippets/price-facet.liquid` — Dawn `<price-range>` min/max in Cartel pill fields.
- `assets/cartel-plp.js` — `<cartel-sort>` (popover drives the hidden `sort_by` select; delegated events so facets.js's `.sorting` innerHTML swaps can't orphan listeners; degrades to a visible native select if JS is absent via `:defined` CSS) and `<cartel-facets-drawer>` (backdrop click, document-level Esc, body scroll lock synced by MutationObserver on `details[open]`).

**Every Dawn facets.js contract kept** (verified against the file line by line): `facet-filters-form` wrapping each form; `#FacetFiltersForm` / `#FacetFiltersFormMobile` (inside a real `<menu-drawer>`, since `renderAdditionalElements` unconditionally dereferences it — a hidden stub renders when filtering is off but sorting is on) / `#FacetSortForm`; `.js-filter` wrappers with stable param-name ids and id'd parents; `.active-facets-desktop`; `.sorting`; `.mobile-facets__open` (badge auto-refresh); `.facets-wrap` on checkbox groups so the clicked group's counts refresh; `.facets-container` data attributes (StandardEvents); `#ProductGridContainer > .collection`; `#product-grid[data-id]` in both filled and empty states; `#ProductCount[data-product-count]`; `<price-range>`; `<facet-remove>`. Active-state visuals ride the real `input:checked` (plus server classes), because facets.js deliberately skips re-rendering the group you just clicked.

**Brand template** (`collection.brand.json`, suffix `brand`)
- `sections/cartel-brand-hero.liquid` (new) — one section, two modes, because a JSON template can't wrap one section around the grid: **hero** (breadcrumbs, `.btabs` brand-switcher blocks, `.bhead` themed panel — logo lockup from `custom.brand_logo` wrapped in an `h1`, wordmark fallback, `custom.tagline` → description fallback, Thuya gate note when `custom.gated`/title "Thuya" and logged out — and `.bchip` category blocks) and **story** (`.bwhy` heading/image/point-blocks + `.bcross` CTA, hidden until its heading is set).
- Template order: hero → shared product grid (`enable_filtering: false`, sorting on) → story. With no rail the grid runs 4-up (`.plpbody--full .pgrid`), matching the design's `.bgrid`.
- theme.liquid (batch 7.0) already loads `cartel-brand.css` on suffix `brand` — no edits there.

**Brands index** (`/collections`)
- `sections/main-list-collections.liquid` — breadcrumbs, `.bx-head` intro, `.bx-grid6` of brand cards from blocks (collection picker + accent/badge/eyebrow/blurb/specs/image); with zero blocks it falls back to all collections (accent cycle) so the page is never blank.
- `snippets/card-collection.liquid` — the `.bx-card` (image/placeholder + badge, eyebrow, name, blurb, spec pills, count + "Shop X" pill).

**CSS** — the three packet files copied verbatim over the placeholders; everything I added sits under a marked `/* ===== LANE 7A APPENDS ===== */` tail (tokens only, no new hex): custom-element display plumbing, summary/details drawer transitions, sort popover states, `input:checked` facet states, price fields, pagination pills, loading states, `.collhead-img`, `.plpbody--full`, `.bhead-lockup` + neutral `.bhead` fallback gradient, `.bx-title`/`.bx-item`.

## Deviations from the prompt (deliberate, with reasons)

1. **Grid is 3-up at 1440, not 4-up.** The prototype CSS is `repeat(3,1fr)` beside a 258px rail; the ported stylesheet is authoritative per the packet. Brand pages (no rail) run 4-up, matching the design's own `.bgrid`.
2. **Filter drawer switches at ≤760px, not ≤989px** — that's the prototype's own container query, ported as-is. 390 (the checklist viewport) is covered.
3. **Brand hero is the shipped `.bhead` revision.** The `.bhero`/`.bnamewrap`/stats/story/CTA classes in the brief belong to an older revision that survives only as unused CSS in the design file; the shipped markup (and the ported cartel-brand.css) use `.bhead` + `.btabs` + `.bsubnav`. So there are **no stat metafields** — only logo/tagline/theme/gated.
4. **Brands index is one `.bx-grid6`, no separate featured pair** — `.bx-feat` is unused legacy CSS; the shipped markup renders all six brands as equal cards.
5. **"Showing N of M": M = `collection.products_count` (filtered), not `all_products_count`** — the checklist requires the count to update when a facet is applied; `all_products_count` never changes. N (`.cnum`) is the page slice.
6. **`.filterbtn` does not carry `.mobonly`.** cartel-plp.css's ported override tail re-asserts `.cl .mobonly{display:none}` after cartel-home's mobile flip, which would permanently hide the button; `.filterbtn`'s own media rules already handle visibility.
7. **Price facet is a styled min/max range** — Shopify's price filter is a single gte/lte pair, so the prototype's multi-select buckets can't map. Dawn's `<price-range>` element is kept.
8. **Sort labels come from `collection.sort_options` names** (English store copy — "Featured", "Best selling", …), not hardcoded, so all eight Shopify sort values work.

## Client setup needed (admin — none of this is code)

1. **Collection metafields** (namespace `custom`): `eyebrow` (single-line), `tagline` (single-line), `brand_logo` (file/image), `theme_key` (single-line: `bronsun` | `noemi` | `thuya` | `linger` | `cartel` | `prolong`), `gated` (boolean — optional, a collection titled "Thuya" gates automatically).
2. **Search & Discovery app**: turn on filters, in this order: Availability, Brand (vendor), Price, Curl, Length, Thickness. Curl/Length/Thickness must exist as variant options (or metafield filters) to appear. **The vendor filter must be on for brand deep-links (below).**
3. **Brand collections**: one per brand, template suffix **`brand`**, metafields filled; in the editor add the hero's brand-tab blocks + category-chip blocks, and the story section's bcross heading/link (band hides until set).
4. **Brands index**: `/collections` currently lists every collection (fallback); add the six "Brand card" blocks (suggested accents per the design: Cartel=Wine, Bronsun=Bronze, Noemi=Blush, Thuya=Mauve, Linger=Taupe, Prolong=Sage; badges/eyebrows/blurbs/specs are in `theme-7a-plp/design/Brands.dc.html` lines 585-590).
5. **Thuya gate test**: the store still has no Thuya-vendor product — set one product's vendor to `Thuya` to see the lock/CTA (rendering comes from the frozen `cartel-card`).

## Brand deep-links (for the other lanes)

Canonical vendor-filter URL: **`/collections/all?filter.p.vendor=<Vendor>`** (URL-encoded, e.g. `filter.p.vendor=Linger%20Beauty`; repeatable for multi-select). Requires the vendor filter enabled in Search & Discovery. Where a brand collection exists, prefer linking it directly (`/collections/<brand-handle>` — it carries the whole branded template).

## Cross-lane notes / requests

- **To the search lane (7F):** `snippets/facets.liquid` is shared with `main-search.liquid`. The Dawn-style call keeps working (omit `part` → all pieces render in sequence), but the markup is now Cartel classes: the search page needs the facet styles (they live in `cartel-plp.css`) and `cartel-plp.js` for the sort popover — without the JS it degrades to a functional native `sort_by` select. Either load those two assets from `main-search.liquid`, or ask me to split the facet styles into a shared file.
- No changes were made (or needed) outside my file list; theme.liquid's batch-7.0 case block already wires every asset, including `cartel-brand.css` on `template_suffix == 'brand'`.

## Verification detail

- `shopify theme check`: exit 0; JSON output filtered to the 14 lane files → 0 offenses.
- jsdom smoke (scratchpad, 15 assertions): popover open/close/outside/Esc, select value + bubbling `input`, optimistic label, drawer scroll-lock on/off, backdrop → summary click, Esc close, inside-click no-op, `overflow-hidden-mobile` leak healed.
- Not yet verified (needs the preview theme): AJAX facet round-trip against a real collection, chips/count refresh, drawer at 390, Thuya card states, brand/brands rendering with real metafields, console cleanliness, per-template CSS loading. I'll run the full acceptance checklist as soon as a theme slot is free.
