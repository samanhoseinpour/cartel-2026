# Batch 14 — brand links point at the brand collections · REPORT

Installed 2026-08-23 on top of master `d8e9063`, as three commits: `089908c` (steps 1–2),
`131fcfb` (step 4) and `cb202db` (step 5), plus `507040f` outside the packet (header pills, below). Step 3 left alone as instructed. Step 5 **ran after Saman confirmed** (commit `cb202db`). Nothing published, no bare push, `config/settings_data.json` untouched,
draft theme `160769933525` only. `shopify theme check`: **201 offenses before, 201 after, 0
errors** — no new offense on any touched file, none at all on the new snippet.

**Four files, not two:** `snippets/cartel-brand-url.liquid` (new) · `sections/main-product.liquid`
· `templates/index.json` · `sections/main-cart-items.liquid`. The last one is a step-4 hit the
packet did not list (below).

## Sync re-check — nothing was dropped

All four files were pulled back from draft theme `160769933525` after each push and compared to
the repo: byte-identical every time. `templates/index.json` and `main-cart-items.liquid` were
also pulled **before** editing — no theme-editor drift, so no re-apply was needed.

## Steps 1–2 · the kicker

`snippets/cartel-brand-url.liquid` is the packet's text verbatim (handleize, `products_count > 0`
guard, vendor-only escaping, no encoding of the finished URL). The only change in
`sections/main-product.liquid` is the one `href`:

```
- href="{{ routes.all_products_collection_url }}?filter.p.vendor={{ product.vendor | url_param_escape }}"
+ href="{% render 'cartel-brand-url', vendor: product.vendor %}"
```

Same class, same `shopify_attributes`, same `product.vendor != blank and block.settings.text ==
product.vendor` guard, same link text. Rendered attribute is exactly the URL — the `{%- liquid -%}`
/ `{{- -}}` trims leave no whitespace or newline inside the quotes, and the `#` comment lines emit
nothing (checked on six live PDPs, zero `Liquid error` strings).

**Sweep after the edit** — `grep -rn "filter.p.vendor" sections/ snippets/ templates/ assets/
layout/ locales/ config/`:

```
snippets/cartel-brand-url.liquid:15:    assign cl_bu_url = routes.all_products_collection_url | append: '?filter.p.vendor=' | append: cl_bu_v_esc
```

That is the snippet's own fallback branch — the string has to live somewhere. No other hit in
code; the remaining hits are `docs/lane-reports/7a-plp.md` and `7b-pdp.md` (history, left).
Nothing was an analytics payload, canonical, JSON blob or facet chip, so nothing was converted
that should not have been.

## The step-20 receipt — which brand handles resolve

Measured logged out on the draft theme, one PDP per vendor, plus the public
`/collections/<handle>/products.json` (which is Online-Store-scoped, the same count Liquid's
`products_count` uses — the Ajax `collections/<handle>.json` count is *not*: it includes
products that are not published to the Online Store and over-reports by 1–3 on four brands).

| Vendor (as typed on the product) | `handleize` | Collection | Products | Kicker now renders |
|---|---|---|---|---|
| `Thuya` (34 products) | `thuya` | exists | 34 | `/collections/thuya` |
| `Bronsun` (10) | `bronsun` | exists | 10 | `/collections/bronsun` |
| `Noemi` (7) | `noemi` | exists | 7 | `/collections/noemi` |
| `Cartel` (6) | `cartel` | exists | 6 | `/collections/cartel` |
| `Linger Beauty` (6) | `linger-beauty` | exists | 6 | `/collections/linger-beauty` |
| `Prolong` (1) + `PROLONG` (1) | `prolong` | exists | 2 | `/collections/prolong` for **both** spellings |
| `EYELASH MAKER` (10) | `eyelash-maker` | exists (not one of the six) | 10 | `/collections/eyelash-maker` |
| `CARTEL LASH & SUPPLY CO` (8) | `cartel-lash-supply-co` | none | — | fallback `…?filter.p.vendor=CARTEL%20LASH%20%26%20SUPPLY%20CO` |
| `MAX2LASH` (6) | `max2lash` | exists, **0 storefront products** | 0 | fallback `…?filter.p.vendor=MAX2LASH` |
| `LASHGOD` (2) | `lashgod` | none — the real handle is `lash-god` | — | fallback `…?filter.p.vendor=LASHGOD` |

**All six brand handles resolved**; none of the six fell back. Seven of the store's ten vendor
strings (75 of 91 products) now land on a collection; three (16 products) take the fallback.
Two side effects worth knowing: the Prolong casing split (`Prolong`/`PROLONG`) collapses to one
page because `handleize` downcases — the old facet link would have split them; and every
resolved collection's storefront product set equals the vendor's product set (34=34, 10=10,
7=7, 6=6, 6=6, 2=2, 10=10), so no customer sees a narrower brand page than the facet would
have shown.

**Fallback proof — no scratch render needed.** The three no-collection vendors above are the
live fallback. All three hrefs start with the literal `/collections/all?filter.p.vendor=`
(no `%2Fcollections`, no `&amp;`), and are byte-identical to what the old kicker produced.
`MAX2LASH` also exercises the `products_count > 0` guard on a collection that *exists* but is
empty on the storefront, and `LASHGOD` exercises the missing-handle branch: neither threw.

**And the fallback is still a no-op on this store.** `/collections/all?filter.p.vendor=Thuya`,
`=MAX2LASH`, `=LASHGOD` and `=EYELASH%20MAKER` all render H1 "Products", *"Showing 1–12 of 91
products"*, the same twelve page-1 cards as bare `/collections/all`. The only facet inputs on
the page are `filter.v.availability` and `filter.v.price.*`; `filter.v.availability=1` correctly
returns 67, so filtering works — the vendor facet is simply not enabled in Search & Discovery.
Admin-side, as the packet said.

## The part of the packet's premise that is not true yet

**None of the six brand collections has the `brand` template assigned.** Ajax
`collections/<handle>.json` reports `template_suffix: null` for all six, and every brand page
on the draft theme renders `templates/collection.json` (`__banner` + `__product-grid`), not
`templates/collection.brand.json`. So today the kicker lands on a page with H1 "Thuya" (or
"Linger Beauty", …), the collection description under it and the product grid — a real brand
page, not "All products", but **no hero, no lockup, no story band.**

The template itself is fine. Forcing it with `/collections/<handle>?view=brand` on the draft
theme renders `__brand-hero` + `__product-grid` + `__brand-story` for all six, and shows what
step 20 did and did not fill:

| | `custom.theme_key` | `custom.tagline` | `custom.brand_logo` |
|---|---|---|---|
| Thuya | `thuya` → `.bhead.thuya` | "Professional lash lift, brow & tint" (+ trade-line note) | **not set** → wordmark `<h1>` |
| Bronsun | `bronsun` | "Eyebrow & eyelash tinting, perfected" | not set |
| Noemi | `noemi` | "Korean-inspired lash lift & lamination" | not set |
| Cartel | `cartel` | "House lash-lift shields, rods & tools" | not set |
| Linger Beauty | `linger` | "Lash extension trays & adhesives" | not set |
| Prolong | `prolong` | "Lash cleanser & aftercare" | not set |

Two admin actions finish the story, no theme change needed: set **Theme template = brand** on
each of the six collections (Collections › *brand* › Online store › Theme template), and upload
the six `custom.brand_logo` files. Until the first one is done, the verify step's "themed hero
with logo lockup and tagline" cannot pass on any brand, and that is not something this batch
can fix.

## Step 4 — ran

The first probe of the session saw `/collections/dyes-tints` 200 with 10 products and
`/collections/tints-dyes` 404. Forty minutes later, and on two further checks,
`/collections/dyes-tints` → **301** → `/collections/tints-dyes` (200, "Tints & Dyes", 10
products). The collection's `updated_at` is `2026-08-22T20:21 PT`, so the rename most likely
landed the evening before and the first probe hit a stale edge — either way it is done, so
step 4 ran.

`grep -rn dyes-tints .` before: 6 hits — `templates/index.json:55` (hero slide 3 button),
`templates/index.json:350` (`c4` tile), **`sections/main-cart-items.liquid:111`**, and three
under `docs/lane-reports/`. The cart hit was not in the packet: it is a Liquid
`collections['dyes-tints'].url | default: …` lookup, and Liquid lookups do not follow URL
redirects — on the draft theme the empty-cart "Dyes & Tints" chip had already started rendering
`href="/collections/all"`. All three code hits now say `tints-dyes`. After: only the three
`docs/lane-reports/` hits remain.

Live on the draft theme: hero "Shop brows & tints" button and the Dyes & Tints tile both emit
`href="/collections/tints-dyes"`, which returns 200 with no redirect; the cart chip is back to
`href="/collections/tints-dyes"`.

Still carrying the old handle, **admin data, not the repo**: the navigation menu — *Shop › Tints
& Dyes* and its level-3 child (`HeaderMenu-shop-tints-dyes`, `HeaderMenu-shop-tints-dyes-tints-dyes`,
`HeaderDrawer-shop-tints-dyes-tints-dyes`) all link `/collections/dyes-tints` and ride the 301.
Worth repointing in Navigation while it is fresh.

## Step 5 — ran (confirmed by Saman, same day)

Commit `cb202db`: the six marquee blocks `b1`–`b6` in `templates/index.json` now carry
`/collections/thuya`, `/collections/bronsun`, `/collections/noemi`, `/collections/linger-beauty`,
`/collections/cartel`, `/collections/prolong` — those six values only, no markup change. Pulled
`index.json` from the draft theme before editing (no editor drift) and after the push
(byte-identical). Live on the draft theme the "Brands we carry" strip renders
`<a class="brandname" href="/collections/thuya">Thuya</a>` … for all six, in both loop groups.
Styling is unchanged: `.cl .brandname` (0,2,0) beats the `.cl a{color:inherit}` reset (0,1,1),
so the anchor paints exactly like the span did, with the hover the prototype already defined.

**One follow-up, left for the packet author because it is a markup change:** the marquee's
second `.mq-group` is `aria-hidden="true"` (the seamless-loop clone) and, now that the names are
anchors, it contains 12 focusable links — 24 tab stops per sweep, half of them invisible to
screen readers (axe `aria-hidden-focus`). One-line fix in `sections/cartel-marquee.liquid`:
add `{% unless first_half %}tabindex="-1"{% endunless %}` to the `<a class="brandname">`. Not
applied here.

Same caveat as the kicker: until the `brand` template is assigned in admin, these six routes
land on the generic collection header.

## Outside the packet — header pills with a dropdown now go to their page (`507040f`)

Saman's request, same day: on desktop, clicking **Shop** or **About** should navigate to the
menu item's link; the dropdown should open on hover only. Hover-open already existed
(`assets/cartel-nav.js`, batch 5) — the problem was that the panel was already open by the
time the pill was clicked, so the click handler toggled it shut and nothing navigated.
A `<summary>` has no `href`, so:

- `snippets/header-mega-menu.liquid` and `snippets/header-dropdown-menu.liquid`: the top-level
  `<summary>` now carries `data-href="{{ link.url }}"`. Live values: **Shop →
  `/collections/all`**, **About → `/pages/about`**.
- `assets/cartel-nav.js`: on a hover device a *pointer* click navigates there (cmd/ctrl-click
  and middle-click open a new tab, as an `<a>` would). Keyboard Enter/Space on a `<summary>`
  also dispatches a click but with `detail === 0`, and keeps the **toggle** — keyboard users
  have no hover, so the pill stays their way into the panel. Touch keeps Dawn's native toggle
  (`canHover()` is false). A blank or `#` menu link falls back to the toggle, so a menu item
  that points nowhere never becomes a dead click.

Verified in jsdom against the live header HTML + the pushed JS, nine paths: hover opens (and
writes `aria-expanded`), pointer click navigates without toggling, cmd-click / middle-click
open a new tab, keyboard click toggles with no navigation (both directions), About navigates,
`#` falls back to toggle, no-hover click is not intercepted. `theme check` 201 → 201. The CDN
serves Shopify's minified build of the new file (contains `navTarget` / `data-href` /
`auxclick`).

## Verify — logged out, draft theme `160769933525`

1. **Thuya PDP** (`/products/thuya-styling-wax-for-brows`) → `<a class="p-brand" href="/collections/thuya">Thuya</a>` → `/collections/thuya`: HTTP 200, H1 "Thuya", "34 products", 12 cards on page 1, all gated (lock, logged out). H1 is not "All products". Hero: see above.
2. **Linger Beauty PDP** (`/products/wonderlock`) → `href="/collections/linger-beauty"`: no `%` anywhere in the href, HTTP 200, H1 "Linger Beauty", 6 cards.
3. **Bronsun** → `/collections/bronsun` (200, H1 "Bronsun", 10 cards); **Noemi** → `/collections/noemi` (200, H1 "Noemi", 7 cards); **Cartel** → `/collections/cartel` (6); **Prolong/PROLONG** → `/collections/prolong` (2), visible kicker text keeps each product's raw casing.
4. **Fallback**: three live vendors, hrefs quoted in the table; literal `/collections/…`, not `%2F`; all three return products (the unfiltered 91).
5. **theme check**: 201 → 201 offenses, 0 errors, nothing new.
6. **Gate untouched**: logged-out Thuya PDP still renders `cartel-gate--card` with the padlock SVG and "Log in to see price", "Log in to view pricing" buy-area and sticky CTAs, no `data-selected-price-amount`, no `$` amount in the main section. Bronsun PDP renders `<span class="p-price">$20.00 CAD</span>` and zero gate markup. The gate-test grep count (`product.vendor == 'Thuya' and customer == nil`) is identical at `HEAD~2` and `HEAD` — 16 string matches (14 live sites + 2 doc-comment mentions; `card-product.liquid` matches on `card_product.vendor`), and `git show --stat` for both commits touches no gate site.
7. **Step 4**: hero button and tile → `/collections/tints-dyes`, 200, no redirect hop.

## Still open — admin side, nothing here a theme change can close

- Assign the `brand` template to the six brand collections; upload `custom.brand_logo` ×6.
- Enable the Vendor (Brand) filter in Search & Discovery — or the fallback stays an unfiltered catalogue for `CARTEL LASH & SUPPLY CO`, `MAX2LASH`, `LASHGOD`.
- `LASHGOD` products can't reach their collection because its handle is `lash-god`, not `lashgod`; `max2lash` exists but shows 0 products on the storefront while 6 `MAX2LASH` products are live; `glamcor` holds 0 products. Renaming/assigning in admin makes the snippet pick them up with no code change — that is what the `handleize` rule buys.
- `Cartel` (6) vs `CARTEL LASH & SUPPLY CO` (8): two vendor strings for the house brand; only the first has a collection.
- Navigation menu still links `/collections/dyes-tints` (rides the 301).
- `docs/lane-reports/csv-theme-audit.md:39` says `dyes-tints` 404s — stale since the collection was created 2026-08-16.

## Step 5 follow-up — a11y: the marquee's duplicate tab stops (`05388c0`)

Batch 15. One line, one file: `sections/cartel-marquee.liquid`, the `<a class="brandname">`
branch inside `.mq-group`.

**The note above understated it.** It proposed `{% unless first_half %}`, which assumes the
duplicates are only the loop clone. They are not: the section pads each group to twelve items
(`repeats = 12 | divided_by: brand_count` → 2 with six brands) *and* renders the group twice, so
`first_half` alone would still have left **12** focusable anchors, not 6. The guard that is
actually correct is the one the file already uses to place `shopify_attributes` —
`first_half and first_pass`, the single canonical copy of each block:

```liquid
{%- unless first_half and first_pass %} tabindex="-1"{% endunless %}
```

The `{%- ` sits inside the tag, so nothing but the attribute changes in the markup. The
`{%- else -%}` `<span class="brandname">` branch is untouched — a span is not focusable.

**Before → after, measured on the draft theme homepage (logged out):**

| | before (`8dbae37`) | after (`05388c0`) |
|---|---|---|
| `.marquee a.brandname` | 24 | 24 |
| `…a.brandname:not([tabindex="-1"])` | **24** | **6** |
| focusable inside the `aria-hidden="true"` clone group | **12** | **0** |
| theme-editor targets (`shopify_attributes`) | 6 | **6** |
| tab stops to cross the strip | 24 | 6 |

**Theme-editor targets are unchanged.** `editor_attrs` is assigned by the same
`first_half and first_pass` guard and was not touched. Rendering the section at `HEAD~1` and at
`HEAD` against the live six-block config and diffing the parsed anchors: class, href, link text,
group index and `shopify_attributes` are identical on all 24 anchors — `tabindex` is the only
delta. (`shopify_attributes` renders empty on storefront requests — 0 `data-shopify-editor-*`
anywhere on the page — so the 6-target count is from the render diff, not the storefront HTML.)

**Verified on `160769933525`** (`Shopify.theme.id` confirmed 160769933525, role `unpublished`),
headless Chrome over CDP:

1. 24 anchors / 6 without `tabindex="-1"`.
2. Group 0 (no `aria-hidden`): 12 anchors, 6 focusable. Group 1 (`aria-hidden="true"`): 12
   anchors, **0** focusable. Every focusable anchor is in group 0.
3. Real `Tab` key traversal from the kicker: six marquee stops, in brand order — Thuya,
   Bronsun, Noemi, Linger Beauty, Cartel, Prolong — no stop inside an `aria-hidden` subtree,
   then straight out to `button.caro-btn`.
4. Clicking still navigates. A real `Input.dispatchMouseEvent` press/release on the centre of a
   `tabindex="-1"` duplicate (`elementFromPoint` → `A.brandname`) landed on
   `/collections/thuya`; so did `.click()` on the canonical anchor. Duplicates keep their
   `href`, `pointer-events: auto`, no `disabled`, no `aria-hidden` on the anchors themselves.
5. Marquee still scrolls: `animation-name: marq`, `animation-duration: 63.996s` from
   `--mq-dur:63996ms`, track 3965px, two `.mq-group`s, the second still `aria-hidden="true"`.
6. `theme check --output json`: 201 → 201 offenses, and the two offense sets are identical
   check-for-check — no new offenses, none resolved. `cartel-marquee.liquid` has none.

**Out of scope, found while sweeping the page.** The homepage still has six `aria-hidden-focus`
elements — none in the marquee. They are the CTA pairs inside the inactive `.hero-slide`s of
`#herowrap` ("Shop the collection" / "Explore lash lift", "Shop brows & tints" / "Browse
brands", "Shop adhesives" / "Shop best sellers"): the carousel marks the off-screen slides
`aria-hidden="true"` but leaves their links in the tab order. Pre-existing, unrelated to step 5,
not touched here.
