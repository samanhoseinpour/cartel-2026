# Batch 12 — CSV vs theme AUDIT · REPORT

Read-only audit of `exports/cartel_products_import_v3.csv` (the file that creates all 65
products at step 16) against the theme at master `07ad12b`, run 2026-08-11 after batch 11
was installed and verified.

**No theme files were changed.** This report is the only deliverable.

## Re-derivation of `DATA-PROFILE.md` — no disagreement

Every measured number re-derives exactly from the file, so it has not changed since the
packet was cut: 40 columns · 98 rows · 65 handles · metafield fill 57/28/23/5/4/4 (and no
metafield value on any continuation row) · vendors `Thuya` 34, `Bronsun` 11, `Noemi` 7,
`Cartel` 6, `Linger Beauty` 6, `Prolong` 1 (exact strings, no case variants, no trailing
space) · 12 types · 20 distinct tags · `Image Src`, `Variant Image`, `Image Alt Text`,
`Variant Compare At Price`, `Variant Barcode` empty on all 98 · `Cost per item` on 92 ·
3 rows at `0.00` (all on the one draft handle, `Published FALSE` on the same 3) ·
`Variant Inventory Tracker` = `shopify` on all 98, policy `deny` · 24 rows 0/blank grams ·
benefits 57/57 begin `["` and contain `","`, **0** backslashes, **0** ` · `, **0** `~~~`,
**0** inner double-quotes, **0** `<`/`>`, and exactly **4** items with a bare `&` ·
4–12 items per product · Option1 names `Title` 52 / `Step` 4 / `Shade` 4 / `Curl` 4 /
`Size` 1, with Option2 and Option3 empty on all 98 · SEO Title max 60, SEO Description
max 152, both filled on all 65.

## How findings were verified

Every finding was traced in the code. The highest-severity ones were then confirmed
against the **GitHub-synced draft theme `160769933525`**, logged out, via the preview
cookie. Note the store 301s to `cartellash.ca`, so the cookie must be carried across the
redirect (`curl -sL -b ck -c ck`). Findings marked **[live]** were reproduced; findings
marked *latent* render only through a code path no live template reaches today.

## Findings

| # | Severity | Where (`file:line`) | What the data does | What the template assumes | Smallest fix | Code or admin |
|---|---|---|---|---|---|---|
| 1 | **breaks** | `snippets/meta-tags.liquid:30` | 34 products arrive with vendor `Thuya`, whose prices are gated from guests | The `og:price:amount` tag is guarded only by `request.page_type == 'product'` — no vendor or customer test, so it prints the exact price to every logged-out visitor, scraper and social unfurl. **[live]** `content="17.93"` on `thuya-vegan-tint` while the body rendered zero `$` amounts | Wrap the block in the same `{%- unless cartel_gated -%}` already used at `sections/main-product.liquid:1016`; `cartel_gated` must be re-derived in the snippet since it is not in scope there | Code |
| 2 | **breaks** | `snippets/product-variant-picker.liquid:101-102` | 3 of the 34 Thuya products carry a real option axis (`thuya-silicone-pads`, `thuya-eyebrow-eyelash-dye`, `thuya-vegan-tint`) | `{{ product.selected_or_first_available_variant \| json }}` serialises `price` and `compare_at_price` in cents into a `<script>` with no gate. **[live]** `price: 1793`. The other 31 Thuya products are single-variant, and the `unless product.has_only_default_variant` wrapper at `:11` suppresses the whole element — confirmed live on a single-variant PDP | Gate the `<script>` alone, or strip `price`/`compare_at_price` from the serialised object when gated | Code |
| 3 | **breaks** | `templates/index.json` (tiles), `sections/main-cart-items.liquid:108-111` (empty-cart chips) | The catalogue is organised by tag; the collections these links point at do not exist | 7 of the 9 hardcoded handles **404 today**: `lash-lift`, `lash-extension`, `brows`, `dyes-tints`, `korean-lash-lift`, `adhesives`, `brow-lamination`. Only `all` and `best-sellers` resolve. **[live]** `snippets/cartel-pick-collection.liquid:39-41` already carries a comment flagging this | Create the collections (admin). The cart chips already fail soft via `\| default: routes.all_products_collection_url`; the homepage tiles have no such fallback and should get one | **Admin** (+ optional code) |
| 4 | **degrades** | `snippets/product-media-gallery.liquid:79` + `assets/cartel-pdp.css:49` | `Image Src` empty on all 98 rows; all 65 import photo-less and 18 stay that way permanently | `<slider-component class="… gal-main">` is emitted unconditionally, and CSS gives it `aspect-ratio:1; background:var(--prodbg)`. **[live]** `<ul class="product__media-list">` renders with **zero inner content** → an empty half-page tinted square in the left hero column. `cartel-pdp.css:483` deliberately keeps that column open, so batch 11's `.product--no-media` work does not cover it | Render a `placeholder_svg_tag` inside `.gal-main` when `product.media.size == 0`, matching the card fallback | Code |
| 5 | **degrades** | `sections/predictive-search.liquid:83-93`, styled at `:27` | Photo-less products appear in the search dropdown | `<span class="psr-thumb">` is emitted unconditionally with **no `{% else %}`**, and is styled 44×44 with `--prodbg`. **[live]** an image-less result rendered `<span class="psr-thumb"></span>` — an empty tinted chip. The article branch at `:126-138` *does* have a fallback, so this is an internal inconsistency | Add the `{%- else -%}{{ 'product-1' \| placeholder_svg_tag: 'psr-img' }}` arm | Code |
| 6 | **degrades** | `assets/cartel-cart.js:133-135` + `assets/cartel-cart.css:144` | Photo-less products get saved for later | The JS returns `''` for a missing image while `.saved-img` paints a 1:1 `--prodbg` tile → an empty square with only the remove-X floating in it. `sections/main-cart-items.liquid:205` correctly emits `data-image=""`; there is simply no placeholder branch in JS | Emit an inline SVG (or a CSS background) in the `else` arm of the ternary | Code |
| 7 | **degrades** | no consumer exists | `custom.thickness` is filled on 4 products (`0.15`, `0.07`, `0.05`, `0.02`) | **Nothing reads it.** `metafields.custom.thickness` returns zero hits repo-wide, and there is no PDP spec row of any kind. The data imports invisible. The PLP facet is not a defect: `snippets/facets.liquid` is fully generic over `results.filters`, so it renders a thickness filter only if one is configured in Search & Discovery, and tolerates its absence vacuously | Either add a spec row to the PDP accordion stack, or accept that the field is admin-facing only. Whether a thickness facet is enabled is `needs admin check` | Code + admin |
| 8 | **degrades** | `snippets/cartel-card-kit.liquid:20-23`, `sections/cartel-product-row.liquid` | `Kit` tag on 8 products; `custom.includes` on only 3 of them | The `Kit` **tag is inert on the PDP** — no kit panel exists and nothing keys off the tag. The only `includes` consumer is the kit *card*, reachable solely via a `cartel-product-row` section with `card_style == 'kit'` pointing at a merchant-picked collection. The 5 kit products with no `includes` fall back to `p.description \| strip_html \| truncatewords: 16`, so a kit card shows prose where a contents list was designed | Fill `includes` on the 5 (data), and wire a kit row to a Kits collection (admin). **No empty-panel defect** — the `!= blank` guard at `:47` holds | **Admin/data** |
| 9 | **degrades** | `layout/theme.liquid:23-28` | All 65 SEO Titles are authored to ≤60 chars (max exactly 60) | `{%- unless page_title contains shop.name %} &ndash; {{ shop.name }}{% endunless -%}` appends the store name on top of the supplied title, pushing every one of them past 60 and into SERP truncation. The `unless` only prevents literal duplication | Suppress the suffix when `template.name == 'product'`, or when `page_title` came from a product SEO Title | Code |
| 10 | **degrades** | `sections/main-collection-product-grid.liquid:98-106`, count at `:45-49`, toolbar at `:51-60` | `Korean Lash Lift` and `Henna` are designed mega-menu children with **0 products** | The no-filter empty state reads "Nothing here yet / This collection is being restocked, check back soon" — copy that implies a temporary stock-out for a category that has never had stock. A `0 products` count line and the full sort toolbar still render, because the toolbar is gated on the setting, not on product count | Either drop both children from the menu (admin) or add a "coming soon" variant of the empty state and suppress the toolbar at 0 products | **Admin** (+ optional code) |
| 11 | **degrades** *latent* | `snippets/card-product.liquid:67-115` | Photo-less products | Dawn's card closes its media block with **no `{% else %}`**, so a real photo-less product becomes a filled `card--text` square (`card_style: "standard"`, so `component-card.css:432` does not collapse it) — a visually different card in the same grid. The placeholder arm at `:589-620` only fires for a *null* product. Unreachable today: `card-product`, `featured-collection`, `collage` and `featured-product` are in **no** template | Add the missing `{%- else -%}` placeholder arm before anyone enables those sections | Code |
| 12 | cosmetic *latent* | `snippets/price.liquid:143-155` | `Variant Compare At Price` empty on all 98 rows | The `unless` never tests `compare_at_price`, so an `<s class="price-item price-item--regular">` is emitted for every nil compare-at, hidden only by `component-price.css:57-63`. **Not reachable today** — `main-product.liquid:133-138` is the sole live caller and passes `cartel_pdp: true`, taking the Cartel branch. **[live]** zero `price-item--regular` across PDP, search and predictive search | Add a `compare_at_price` test to the `unless`, whenever the Dawn branch is next used | Code |
| 13 | cosmetic *latent* | `snippets/price.liquid:164-172` | No product ever has a compare-at price | `Sale` and `Sold out` badge spans are emitted unconditionally whenever `show_badges` is truthy, with no price test (`featured-product.liquid:139` passes `true`; `main-product.liquid:136` passes `false`). Same dormancy as #12 | Gate each badge on its own condition | Code |
| 14 | cosmetic | `sections/main-product.liquid:801` (and `:828`, `:813`, `:810`, `:901`) | 4 benefit items contain a bare `&` (`Lash & Brow Dye`, `Cysteamine & TGA`) | Benefits, features, ingredients and how-to are output **completely unescaped** — `{{ cl_benefit }}` with no filter. This is the opposite of the double-escape the packet guarded against: nothing escapes them even once. Today's data is safe (0 `<`, `>`, `"`), and the 4 `&` items render correctly | Add exactly one `\| escape`. A second would print `&amp;amp;` | Code |
| 15 | cosmetic | `snippets/quick-order-list-row.liquid` (13 price sites) | 34 gated Thuya products | Raw prices with **zero** vendor/customer test — a complete gate bypass. Unreachable only because `bulk-quick-order-list` is in no template and `card-product` never requests bulk quick-add | Gate it, or delete the bulk path, before anyone enables bulk quick-add | Code |
| 16 | cosmetic | `snippets/card-collection.liquid:43-47` | Whole collections import with no product images | `collection.featured_image` falls back to the first product's image, so brand/collection cards flip to the "Photos coming soon" placeholder. This is the theme's **best** fallback and behaves correctly — but it will be the default state of `/collections` at import until photos are uploaded | None. Upload photos | **Admin/data** |
| 17 | cosmetic | `assets/cartel-plp.css:102`, `assets/cartel-search.css:50`; `sections/main-product.liquid:1002-1008` | — | Dead code: `.pcompare` (line-through "was" price) is styled but never emitted by `cartel-card`, which has no compare-at path at all; `seo_media` is assigned twice and never read, a leftover from a hand-written JSON-LD block replaced by `structured_data` | Delete both | Code |

## Confirmed fine

Everything below was checked and needs no re-check.

- **The Thuya gate is airtight on comparison.** All **15** vendor tests are byte-identical
  `product.vendor == 'Thuya' and customer == nil` — no `downcase`, no `strip`, no
  `contains`, anywhere: `price.liquid:15`, `buy-buttons.liquid:30`,
  `card-product.liquid:44`, `cartel-card.liquid:10`, `cartel-card-kit.liquid:9`,
  `product-media-gallery.liquid:50`, `cart-drawer.liquid:26` and `:104`,
  `cartel-drawer-upsell.liquid:92`, `main-product.liquid:92`,
  `featured-product.liquid:109`, `predictive-search.liquid:101`,
  `main-cart-items.liquid:27` and `:137`, `cart-notification-product.liquid:10`.
  The CSV writes exactly `Thuya` on 34 rows, so all 15 agree. **No other vendor is caught**
  — there is no `contains`-based vendor test in the repo, so `Bronsun`, `Noemi`, `Cartel`,
  `Linger Beauty` and `Prolong` are unaffected. The only `downcase`/`strip` in the theme
  are `cartel-brand-hero.liquid:17` (collection theming) and `main-account.liquid:13-14`
  (a customer-tag badge); neither feeds the price gate.
  *The fragility to know about: all 15 fail together on any casing or whitespace drift.*
- **Gated surfaces that correctly suppress price:** JSON-LD
  (`main-product.liquid:1016`, `featured-product.liquid:530`), Shop Pay
  `payment_terms` (`main-product.liquid:166`), cart `data-price`
  (`main-cart-items.liquid:204` → `cartel-cart.js:138`), the gallery Save badge
  (`product-media-gallery.liquid:53`), pickup availability (`buy-buttons.liquid:155`)
  and the volume-pricing note (`main-product.liquid:141`).
- **Batch 11's benefits normalisation is the only path.** `main-product.liquid:766-777` is
  the sole reader of `custom.benefits` repo-wide; the `","` branch covers 100% of today's
  data (the ` · ` and `~~~` branches never fire, as intended); and
  `{% if cl_acc_benefits.size > 0 %}` at `:792` correctly hides the accordion for the 8
  products with no value. `custom.features` uses the same pattern at `:859-872`.
- `custom.ingredients_label | default: 'Ingredients'` is present at `:779` — the 18
  products with ingredients but no label are covered. `newline_to_br` on ingredients
  (`:813`) and on how-to (`:824`, as a split device) both intact.
- **Options are clean.** The picker is wrapped in `unless product.has_only_default_variant`
  (`product-variant-picker.liquid:11`), and all 52 single-variant rows are literally
  `Title` / `Default Title`, so the placeholder option renders **no visible row** — and
  `main-product.liquid:19-23` skips the picker stylesheets entirely for those. There is
  no colour or size axis assumption anywhere (zero hits for option-name tests), and
  nothing indexes `option1/2/3`; swatches key off Shopify's swatch *object*, never a name.
  `Step`, `Shade`, `Curl` and `Size` all render as ordinary pill rows.
- **No compare-at state renders visibly anywhere.** Every live guard is
  `compare_at_price > price`, and nil fails it: `cartel-card.liquid:17`,
  `cartel-card-kit.liquid:16`, `product-media-gallery.liquid:53`, `price.liquid:53`.
  **No percent-off chip exists in the theme at all** — no template computes a percentage
  discount, so no `0%` state is reachable. All "save" copy is absolute money.
- **No template prints `Free` for a product price.** Every `price == 0` path renders
  "Price on request" plus an "Enquire about pricing" link to the contact page —
  `price.liquid:45-49`, `cartel-card.liquid:62-75`, `cartel-card-kit.liquid:65-73`,
  `buy-buttons.liquid:43-50`, `main-product.liquid:945-948`,
  `predictive-search.liquid:106`, `cart-drawer.liquid:214`, `main-cart-items.liquid:293`,
  `cart-notification-product.liquid:45`, `cartel-cart.js:143`. The three `Free` strings in
  the theme are all shipping copy. Note this path is **unreachable as imported**: the only
  `0.00` rows belong to `long-term-brow-perm-composition`, which is `draft` with
  `Published FALSE`. It becomes live the moment that product is activated.
- **The Description accordion is guarded.** `main-product.liquid:783`
  `{%- if product.description != blank -%}` wraps the whole `<details>`, so the 3 body-less
  products (`long-term-brow-perm-composition`, `prolong-lash-cleanser`,
  `cashmere-dream-lash-trays-0-07`) get **no heading and no empty panel**. Side effect
  worth knowing: `open` sits on the Description block, so those 3 PDPs open with every
  accordion closed.
- **Meta description needs no fallback.** `layout/theme.liquid:30-32` emits the tag only
  when `page_description` is set and has no `| default:` — but all 65 rows carry an SEO
  Description (≤152 chars), so it always resolves. `snippets/meta-tags.liquid:5` has its
  own `| default: shop.description | default: shop.name` chain for og/twitter.
- **No structured-data or OG image defect.** Shopify's `structured_data` filter **omits**
  the `image` key rather than emitting an empty one, and `page_image` falls back to the
  store's social image — **[live]** a photo-less PDP emitted
  `og:image = …/logo-dark.png` and a Product JSON-LD block with **no `image` key at all**.
  There is no hand-rolled Product JSON-LD anywhere.
- **Every card and cart media surface has a placeholder.** `cartel-card.liquid:31-39`,
  `cartel-card-kit.liquid:34-42`, `cart-drawer.liquid:111-122`,
  `main-cart-items.liquid:145-157`, `cart-notification-product.liquid:16-27`,
  `cartel-drawer-upsell-card.liquid:41-49` all render `placeholder_svg_tag`. **[live]** an
  image-less product rendered `<svg class="card-photo">` in search results. Related
  products, cart recommendations, home rows, the PLP grid and search all route through
  `cartel-card`, so all inherit it.
- **No `images['missing.jpg']`** anywhere in the theme — that trap is not present.
- The homepage brand spotlight (`sections/cartel-spotlight.liquid`) references no product,
  price or vendor; its images come from a theme-editor `image_picker`, so the import
  cannot affect it.
- Sold-out rendering (struck pills, disabled Add to bag) is wired correctly across
  `buy-buttons.liquid:87-151`, `cartel-card.liquid:72`, `cartel-card-kit.liquid:70`,
  `product-variant-options.liquid:36-117` and `cartel-pdp.css:296`. Per the packet, the
  4 rows already at zero inventory are step 18's job, not a defect.

## Data notes — record only, no code action

- `Lash Cleanser` and `Cleansers` both exist as tags (1 product each).
- The `Dyes` type survived step 09's normalisation; `Tints & Dyes` is a tag on 10 products
  but a type on only 1.
- **Six types map to no mega-menu child tag** — `Hybrid Dye` (3), `Developer` (5),
  `Lash Cleanser` (1), `Lash Tray` (4), `Lash Adhesive` (2), `Dyes` (1) = 16 products.
  None of those strings appears anywhere in the theme. They are reachable only via
  `/collections/all`, site search, or a generic Product-type facet if one is enabled.
  `Developer` additionally appears as a search *suggestion* string at
  `sections/main-search.liquid:258` — a chip, not a link.
- 24 rows have 0 or blank `Variant Grams` — shipping-label only; nothing on the storefront
  renders weight.
- The live store's old-owner vendors are `PROLONG` and `CARTEL LASH & SUPPLY CO`, which
  will sit beside the CSV's `Prolong` and `Cartel` in the brand facet while both sets are
  live. Known — step 13's open half, not a bug.
- The mega menu itself is admin-side (`main-menu-2026`, bound at
  `sections/header-group.json:59`), not in theme code.

## Suggested batch 13, grouped by file

Ordered by value per unit of risk. This is a suggestion, not a decision.

1. **`snippets/meta-tags.liquid`** — finding 1. The gate leak, 34 products, one guard.
2. **`snippets/product-variant-picker.liquid`** — finding 2. Same class of leak.
3. **`snippets/product-media-gallery.liquid`** — finding 4. The largest visual defect;
   affects every product on day one.
4. **`sections/predictive-search.liquid`** + **`assets/cartel-cart.js`** — findings 5 and 6.
   Both are the same missing-`else` shape as 4 and can be reviewed together.
5. **`layout/theme.liquid`** — finding 9. One-line condition, SEO-wide effect.
6. **`sections/main-product.liquid`** — finding 14, a single `| escape` on four outputs.
7. Defer 11, 12, 13 and 15 (all dormant) and 17 (dead code) to a cleanup pass — none can
   affect a customer until a dormant section is enabled.

Admin/data items, which no code change can close: create the 7 missing collections
(finding 3, the only **breaks**-severity item that is not code), decide the fate of
`Korean Lash Lift` and `Henna` (10), fill `includes` on the 5 kit products and wire a kit
row (8), and upload product photos (4, 16).

## Checks that could not be closed here

Each depends on store state the CSV cannot describe. Flagged, per the packet, rather than
inferred:

- **Metafield definition types.** Not visible from the file. Relevant because a stored
  value keeps the type it was written with, so changing a definition later will not
  convert the 65 products' existing values.
- **Whether the 7 missing collections get created, and with what rules** — finding 3 is
  proven as a 404 today, but not whether step 16 or a later step fixes it.
- **The contents of the `main-menu-2026` navigation and its mega-menu children** — the
  reason findings 8 and 10 are marked admin.
- **Whether a thickness filter is configured in Search & Discovery** (finding 7).
- **Which theme is published, and the published sales channels.** All live checks in this
  report were run against draft theme `160769933525` as instructed.
