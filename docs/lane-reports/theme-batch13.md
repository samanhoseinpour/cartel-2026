# Batch 13 — the two gate leaks + three missing placeholders · REPORT

Installed 2026-08-16 on top of master `8f1f007`, as six commits `43281d3`…`b86faa8`.
Everything here comes out of the batch-12 CSV audit (`docs/lane-reports/csv-theme-audit.md`,
commit `9326b78`). Seven code items landed. No admin settings changed, no client input
needed, no new templates, no new dependencies, `config/settings_data.json` untouched, nothing
published.

**Nine files, not the six the packet estimated:**
`snippets/meta-tags.liquid` · `snippets/product-variant-picker.liquid` ·
`snippets/product-media-gallery.liquid` · `assets/cartel-pdp.css` ·
`sections/predictive-search.liquid` · `sections/main-cart-items.liquid` ·
`assets/cartel-cart.js` · `layout/theme.liquid` · `sections/main-product.liquid`.

`shopify theme check`: **0 new offenses.** Three warnings remain on touched files, all
pre-existing and none on a changed line — `UnusedAssign: seo_media` (already filed as dead
code in the batch-12 audit) and two known Dawn false positives (`UndefinedObject: continue`,
`UndefinedObject: scheme_classes`).

## Sync re-check — nothing was dropped

The GitHub → Shopify integration has silently dropped `.liquid` updates three times on this
project, so the nine files were pulled from draft theme `160769933525` **before** editing
(all nine identical to the repo — clean baseline) and **again after** the push. All nine came
back byte-identical to the repo. Nothing needed re-pushing.

## What changed

**1 · `og:price:amount` no longer ships a gated price to guests.** `snippets/meta-tags.liquid`
guarded the tag on page type alone, so all 34 Thuya PDPs put the exact price in `<head>` for
every logged-out visitor, scraper and social unfurl. The snippet is rendered from `<head>`
where `cartel_gated` is out of scope, so the gate is re-derived locally with the
byte-identical vendor test the other 15 gate sites use.

**2 · The variant picker no longer serialises the price — twice.**
`snippets/product-variant-picker.liquid` leaked in two places, and the audit had only caught
one of them. `data-selected-price-amount` on `<variant-selects>` printed a plain money
amount; the `<script type="application/json" data-selected-variant>` block printed the whole
variant object with `price` and `compare_at_price` in cents. Both now branch on one
`cl_vp_gated` assign. Scope is exactly the three multi-variant Thuya products — the other 31
are single-variant and the `unless product.has_only_default_variant` wrapper suppresses the
element entirely.

**Step 2b took the packet's primary route; no fallback was needed.** Before changing the
script's shape I traced its only consumer: `assets/product-info.js:154`
(`parseJsonScript` → `getSelectedVariant`), which reads `variant.id`, `.available`,
`.title` and `.featured_media?.id` and hands the object to `pickupAvailability.update()`.
It never reads `price` from that JSON — the price the theme actually uses comes from
`sourceVariantSelects.dataset.selectedPriceAmount` at `assets/global.js:1141`. Rewriting the
two price values with `replace` therefore cannot change behaviour, and it keeps every other
key byte-for-byte. Confirmed live: the served JSON is `…"available":false,"name":"Thuya Vegan
Tint - Coffee","public_title":"Coffee","options":["Coffee"],"price":0,…,"compare_at_price":null,…`.

**3 · A photo-less PDP shows a placeholder instead of an empty tinted square.**
`snippets/product-media-gallery.liquid` emitted `<ul class="product__media-list">` with zero
children when a product has no media, while `.gal-main` carries `aspect-ratio:1` and
`background:var(--prodbg)` — a half-page blank panel. The new `<li>` renders only when
`product.media.size == 0`; `assets/cartel-pdp.css` (appended verbatim from the packet) sizes
it. The slider buttons and counter were left alone as instructed: the new `<li>` carries no
`Slide-` id, so Dawn's `sliderItems` stays at 0 and the slider behaves exactly as it does
today with an empty list. Nothing about it is visibly wrong on the draft.

**4 · The search dropdown fills its 44×44 chip.** `sections/predictive-search.liquid` emitted
`<span class="psr-thumb">` with no `{% else %}`. The rule went into the section's own
`<style>` block, because that section renders on every page where `cartel-search.css` is not
loaded.

**5 · Saved-for-later cards fill their tile.** `savedCardHTML()` returned `''` for a missing
image while `.saved-img` paints a 1:1 `--prodbg` tile. JS cannot call `placeholder_svg_tag`,
so `sections/main-cart-items.liquid` now stashes one in `<template id="cl-saved-placeholder">`
and `assets/cartel-cart.js` clones its `innerHTML`. The template sits outside `.js-contents`
— the only node `cart.js` and `cartel-cart.js` re-render — and outside the empty/has-items
branch, because a shopper can empty the bag with items still saved.

**The packet's conditional CSS for step 5 was not needed.** It asked to check whether
`.card-photo` is written `img.card-photo`; it is not — `assets/cartel-home.css:125` is a
plain class selector and that sheet loads globally (`layout/theme.liquid:299`), so it sizes
an `<svg>` exactly as it sizes an `<img>`. Verified live: the placeholder measures 288×288 in
a 288×288 tile. No rule was added to `cartel-cart.css`.

**6 · Product titles keep their authored length.** `layout/theme.liquid` appended
` – Cartel Lash` unless the title already contained the shop name *literally*, which pushed
hand-authored ≤60-character SEO Titles past the point where search results truncate. Product
pages now use the authored title as-is; every other template keeps the suffix.

**7 · Metafield copy is escaped — exactly once.** `sections/main-product.liquid` printed
benefits, ingredients, the ingredients heading, the how-to steps and the feature list with no
filter at all. On the two that build HTML the escape goes **before** `newline_to_br`.

**The features loop needed a different shape than the packet assumed.** The packet expected a
single `{{ cl_ft }}` output; the loop actually splits each item into `cl_ft_lead` and
`cl_ft_rest` and prints both. The escape therefore went on **both outputs, one each** —
escaping `cl_ft` at the source would have broken `remove_first: cl_ft_lead`, which matches
against the raw string. Net result is still exactly one `| escape` per rendered value.

## Verification

Run against the GitHub-synced draft theme `160769933525`, logged **out**, on
`thuya-vegan-tint` (Thuya · 4 Shade variants · no photos — the one product that exercises
steps 1, 2 and 3 at once) unless stated. The store 301s to `cartellash.ca`, so the preview
cookie is carried across the redirect (`curl -sL -b ck -c ck`). Interactive checks were
driven over CDP with fixed delays — Chrome's own readiness heuristics (`--dump-dom`,
`--virtual-time-budget`) hang on these pages.

**Eight of the nine checks ran and passed. One could not be run. One passed with a caveat
worth reading.**

| # | Check | Result |
| --- | --- | --- |
| 1 | No price in a gated PDP's source | **pass, with a caveat — see below** |
| 2 | Picker still works | **pass** |
| 3 | Log in and re-check | **NOT RUN — no test customer credentials** |
| 4 | Non-Thuya PDP untouched | **pass** |
| 5 | Photo-less PDP placeholder, desktop + mobile | **pass** |
| 6 | Search dropdown placeholder | **pass** |
| 7 | Saved for later, both cart states | **pass** |
| 8 | Titles | **pass** |
| 9 | Escaping | **pass live; the bare-`&` case is not testable on today's data** |

### 1 · The three theme leaks are closed. The remaining hits are Shopify's, not ours.

On the gated PDP, logged out:

- `og:price:amount` / `og:price:currency` — **absent entirely** (`og:price` matches: 0).
- `data-selected-price-amount="0.0"`.
- `data-selected-variant` JSON — `"price":0`, `"compare_at_price":null`.
- Rendered text: `document.body.innerText.includes('17.93')` → **false**;
  `…includes('1793')` → **false**. The buy box shows only `$150` (the free-shipping
  threshold) and the gate CTAs "Log in to see price" / "Log in to view pricing" ×2 / "Log in
  to unlock pricing on Thuya professional products". The four other `$` amounts on the page
  (`$27.00 · $3.50 · $8.00 · $20.00`) are all inside `.card` — the "You may also like" row,
  which is non-Thuya products correctly showing their prices.

**The caveat.** The packet's check 1 asks for *zero* hits for `17.93` and `1793` in the
source. That is not achievable and never was. The raw HTML still contains the price in three
script blocks, all injected by Shopify through `{{ content_for_header }}`
(`layout/theme.liquid:84`) and none of them theme-authored — verified by grepping the whole
repo for their markers, which returns nothing:

- the Web Pixels Manager loader (`wpmLoader`) — 9 occurrences of `17.93`
- `window.ShopifyAnalytics.meta` — 4 occurrences of `1793`
- the `<script class="analytics">` bootstrap — 2 occurrences of `17.93`

The one match outside any `<script>` is a false positive: a stylesheet cache-buster,
`?v=17933591812325749411784462745`.

The same price is also public at `/products.json` with no cookie at all. **The Thuya gate is
a merchandising device, not an access control** — it can keep prices out of everything the
theme renders, which it now does completely, but it cannot keep them out of Shopify's own
analytics payload or the storefront JSON API. Worth stating plainly to the client so nobody
believes the prices are actually secret.

### 2 · Picker still works

Switched Shade from `Coffee` to `Golden Brown` on the gated PDP: the selection changed, the
URL gained `?variant=54476495814869`, `data-selected-price-amount` stayed `0.0` on both,
the lock and "Log in to view pricing" were still rendered afterwards, the visible `$` count
was unchanged at 8 (all recommendations), and **`Runtime.exceptionThrown` / console output
was empty** before and after.

### 3 · Logged-in re-check — not run

Blocked on not having test customer credentials for this store. Nothing else stood in the
way. What would close it, in one pass: log in as any customer and confirm on the same PDP
that `og:price:amount` is back, that `data-selected-variant` carries the real `price: 1793`,
and that `data-selected-price-amount` shows the real amount. All three are the `else`/
un-gated arm of a single `customer == nil` test that the logged-out run has already exercised
in the `true` direction, and check 4 below proves the gate has not gone site-wide.

### 4 · Non-Thuya control is untouched

`sensitive-tape` (CARTEL LASH & SUPPLY CO), logged out, still carries
`<meta property="og:price:amount" content="8.00">` and
`<meta property="og:price:currency" content="CAD">`, and renders `$8.00` in the buy box. This
is the control that would catch a gate that had quietly gone site-wide; it did not.

### 5 · Photo-less PDP

| | `.gal-main` | placeholder | overflow |
| --- | --- | --- | --- |
| 1440px | 597 × 597 | 597 × 597 | — |
| 390px | — | 350 × 350 | `scrollWidth` 390, so none |

The placeholder fills the previously-empty square exactly at both widths. A product **with** a
photo is unchanged: `sensitive-tape` renders 0 `.gal-ph`, 1 `.product__media-list > li`, and
`.gal-main` still measures 597 × 597.

**Follow-up, now done — see "The branded placeholder tile" below.** The placeholder art was
Shopify's `product-1`, which draws an apparel backpack: off-brand for a lash-supply store, and
at 597 × 597 the largest thing on the PDP. It has been replaced across all nine surfaces by a
branded "Photo coming soon" tile.

### 6 · Search dropdown

`/search/suggest?q=brush&section_id=predictive-search`: 1 `<svg class="psr-ph">` — on the
image-less Bronsun brush set — **0** empty `<span class="psr-thumb"></span>`, and the
`.cl .psr-thumb .psr-ph{…}` rule present in the section's own `<style>`. The article rows are
unchanged.

### 7 · Saved for later — both cart states

`<template id="cl-saved-placeholder">` renders with an empty cart **and** with lines in the
bag. The served (minified) `cartel-cart.js` contains
`function savedPh(){const t=document.getElementById("cl-saved-placeholder");return t?t.innerHTML:""}`
and `savedCardHTML` calls it.

| card | placeholder svg | real `<img>` | tile | artwork | remove-X topmost | price |
| --- | --- | --- | --- | --- | --- | --- |
| image-less | yes | no | 288 × 288 | 288 × 288 | yes | Log in for price |
| with image | no | yes | 288 × 288 | — | yes | CA$8.00 |

### 8 · Titles

The discriminating case is `sensitive-tape`, whose SEO Title does **not** contain the shop
name — before this batch it was suffixed, now it is not:

| page | `<title>` | len |
| --- | --- | --- |
| `/products/sensitive-tape` | `Nichiban - Sensitive Tape (Japan)` | 33 |
| `/products/thuya-vegan-tint` | `Thuya Vegan Tint \| Cartel Lash Supply` | 37 |
| `/blogs/news` | `Blog – Cartel Lash` | suffix kept |
| `/policies/refund-policy` | `Refund policy – Cartel Lash` | suffix kept |

`/collections/all`, `/pages/about-us` and `/` already contained the shop name in their
authored titles, so they were never suffixed — unchanged behaviour, not a regression.

### 9 · Escaping — live half passes; the bare-`&` half is not testable yet

Live, across every product on the store that has these accordions:

| product | benefit `<li>` | `<br>` in ingredients | how-to `<li>` |
| --- | --- | --- | --- |
| `noemi-innovate-lash-lift-brow-lamination-system` | 6 | 0 (single-line) | **15** |
| `set-of-cosmetic-brushes-bronsun-4-pcs` | 7 | **2** | 2 |
| `thuya-vegan-tint` | 6 | — | — |

`&amp;amp;` count across all 30 live PDPs: **0**. Benefits still render one bullet per item,
ingredients still emit `<br>`, and the how-to still splits into steps — which is the exact
regression the escape-before-`newline_to_br` ordering could have caused, proven on real
multi-line data.

**What could not be exercised:** none of the 30 products currently in the store has an
ampersand in any of the five metafields, so the four items the packet is actually aimed at
(`Lash & Brow Dye`, `Cysteamine & TGA`) cannot be rendered until the step-16 import. Rather
than leave that unproven, the four pipelines were run against those recorded strings in a
local Liquid engine (python-liquid 2.3.0):

| pipeline | output |
| --- | --- |
| `{{ x \| escape }}` | `Works as a Lash &amp; Brow Dye` |
| `{{ x \| escape \| newline_to_br }}` | `Cysteamine &amp; TGA<br />…Parfum &amp; colour` |
| how-to, full per-step chain | 3 `<li>`, each with one `&amp;` |
| features, escape on both outputs | `<b>Salon strength.</b> Built for Lash &amp; Brow Dye work.` |
| control: `{{ x \| escape \| escape }}` | `Lash &amp;amp; Brow Dye` — what we are avoiding |

`strip_html` in that engine leaves `&amp;` intact, matching Shopify's documented behaviour,
which is why `{{ cl_step_text }}` at `main-product.liquid:826` must not be escaped a second
time. **This is an emulation, not Shopify's Liquid** — treat it as strong but not conclusive,
and re-check one `&` item on a real PDP immediately after the step-16 import. The downside if
the two engines disagree is bounded: `strip_html` decoding the entity would put a raw `&`
back in the output, which is exactly today's behaviour, not a new break.

## Still open — not in this batch, no code change can close them

Carried forward from the batch-12 audit, unchanged:

- **Seven of nine hardcoded collection handles still 404** — `lash-lift`,
  `lash-extension`, `brows`, `dyes-tints`, `korean-lash-lift`, `adhesives`,
  `brow-lamination`. Only `all` and `best-sellers` resolve. They are visible right now as the
  four shortcut chips on the empty-cart panel. Admin: the collections need creating.
- **Product photos** — uploaded by hand, not in the import file.
- **`custom.includes` on 5 of the 8 `Kit`-tagged products**, and the `Korean Lash Lift` /
  `Henna` mega-menu children with 0 products.
- **`custom.thickness` has no consumer** anywhere in the theme; 4 products' data imports
  invisible.

---

# Follow-up — the branded placeholder tile

Commits `2407af1` (build) and `5875f79` (one regression, caught in verification). Eleven
files. Raised by the note above and approved before build: mark direction and scope were both
chosen by the client.

Shopify's `placeholder_svg_tag` drew `product-1`, an apparel backpack, at every product-media
fallback in the theme. `snippets/cartel-photo-placeholder.liquid` replaces it everywhere.

**Scope: all nine surfaces** — PDP hero, product cards, kit cards, saved-for-later, cart
lines, cart drawer, cart notification, drawer upsell, search chip. Keeping every surface on
one placeholder was the point of step 5 above; changing only the PDP would have re-opened the
divergence that batch closed.

**The mark** is a lash fan over a lid arc: eight stroke-only paths in a 64 × 32 viewBox,
`currentColor`, no fill. One path set therefore tints and scales from a 44px search chip to a
190px hero with no second asset and no network request — which matters when 65 photo-less
products land at once. Stroke width is pinned in screen pixels with `vector-effect:
non-scaling-stroke` and stepped per size, so it stays optically even instead of ballooning on
the hero.

**Four sizes.** Only `lg` and `md` carry the "Photo coming soon" label; below roughly 100px
there is no room for type, so the mark stands alone.

Two cascade decisions, both load-bearing:

- **`.clph.clph` is doubled on purpose.** The per-surface classes the tile sits on
  (`.card-photo`, `.line-photo`, `.ci-photo`, `.uc-photo`) set `background:#fff` and their own
  padding, and three of them live in sheets that load *after* `cartel-home.css`. A single
  class would lose the reset.
- **The tile sets no width, height or position.** Each surface class already owns those —
  absolute-fill on the cards, flow-fill in the cart, a fixed 52px on the drawer upsell — and
  duplicating them is how the two drift apart. `cartel-pdp.css`'s `.gal-ph` rule had to give
  up its `display:block`, which at (0,4,0) was silently outranking the tile's flex centring.

## The regression, and why the percentage looked fine for six surfaces

The first build sized the tile's padding in **percent**. A percentage padding resolves against
the *containing block's* inline size, not the element's own — harmless on the cards and the
hero, where the tile fills its parent, but the drawer upsell photo is a fixed 52px box inside
a much wider `<a class="uc-link">`. There `16%` resolved to 230px a side, and under
`border-box` a padding larger than the declared width wins: the 52px tile computed to
**461 × 461 with a 0 × 0 mark inside it**. Six of the eight measurements passed before this one
failed, which is the case for measuring every surface rather than the representative one.
All four sizes now use px, tuned to reproduce the proportions the percentages gave where they
did work.

## Verification — every surface measured on the draft theme, logged out

| size | surface | how | tile | mark | stroke | label |
| --- | --- | --- | --- | --- | --- | --- |
| lg | PDP hero @1440 | natural | 597 × 597 | 163 × 82 | 2.4px | yes, no wrap |
| lg | PDP hero @390 | natural | 350 × 350 | 107 × 53 | 2.4px | yes, no wrap |
| md | product card @1440 | natural | 287 × 287 | 104 × 52 | 1.9px | yes, no wrap |
| md | product card @390 | natural | 169 × 169 | 63 × 32 | 1.9px | yes, no wrap |
| sm | cart line | constructed | 90 × 104 | 41 × 20 | 1.5px | none — correct |
| sm | drawer / notification line | constructed | 74 × 90 | 31 × 16 | 1.5px | none — correct |
| xs | drawer upsell | constructed | 52 × 52 | 25 × 13 | 1.3px | none — correct |
| xs | predictive search chip | natural | 44 × 44 | 20 × 10 | 1.3px | none — correct |

Every tile computed `display:flex` on `rgb(239,230,215)` (`--prodbg`), mark opacity `.34`, and
the mark fits inside its tile at every size. **Zero console errors or exceptions across the
run.** The backpack is gone from the gallery (`svg[viewBox*="525.5"]`: none).

**"Natural" vs "constructed."** The four natural rows rendered from real data — the PDP hero
on `thuya-vegan-tint`, and the image-less Bronsun brush set as a card and a search chip on
`/search?q=brush`. The four constructed rows could not: **every image-less product on the
store is sold out**, so no cart line, drawer line or upsell card can hold one. Those were
measured by putting the exact markup the snippet emits into the real container inside the real
`.cl` scope, which proves the CSS; the Liquid `{% else %}` branch was confirmed by reading
each file. Re-check them naturally once the step-16 import brings purchasable photo-less
products in.

`shopify theme check`: 0 offenses on all 11 touched files, theme total unchanged at 201.
`theme pull --only` re-check: all 11 files came back byte-identical to the repo.

**Deliberately left alone.** `snippets/card-collection.liquid`'s `.bx-ph` keeps its own
treatment (store logo + "Photos coming soon"). It is a *collection* tile, not a product photo,
it is already branded, and its plural label is correct for a collection. Dawn's dormant
`card-product.liquid` / `collage` / `featured-collection` placeholders were also left as-is —
they are in no live template, per the batch-12 audit.
