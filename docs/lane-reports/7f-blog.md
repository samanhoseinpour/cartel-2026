# Lane 7F report — Blog (index + article) + Search

Branch `lane/7f-blog`. All 12 owned files built, theme-checked (0 offenses in lane files),
uploaded to the shared dev theme `#160961003733` and render-verified there at 1440 + 390
(blog index, page 2, article, search all/type-filtered/empty, predictive JSON endpoint).
Preview today: `https://cartel-lash-supply-co.myshopify.com/?preview_theme_id=160961003733`
→ `/blogs/news`, any article, `/search?q=lash`.

## ⚠ Blocked: the "Cartel 7F" preview theme could not be created

`shopify theme push --unpublished -t "Cartel 7F"` fails with **"A shop may only have 20
themes"** — the store is at the cap (16 old Expanse copies/backups from 2021-22, Dawn,
cartel-2026/master, Cartel 7D, live). **Action needed from you:** delete one old backup in
admin, then run the push from this worktree. Until then the shared dev theme carries the
lane for preview.

## What was built

- **`sections/main-blog.liquid`** — kick/h1/lead header, category chips with live counts
  linking to `{{ blog.url }}/tagged/<handle>` (active chip from `current_tags`), featured
  split card (`.bl-feat`, newest post, page 1 unfiltered only — hidden on tag filters and
  page ≥ 2, grid offsets by 1 so nothing repeats), 3-up `.bl-grid` at 12/page, `.bl-pag`
  pagination (arrows disable at ends, `…` gap, `aria-current` on the active page),
  `.bl-promo` shoppable band (collection picker + image fallback chain), dark `.bl-news`
  newsletter band (`{% form 'customer' %}` + hidden `contact[tags]=newsletter`, success +
  error states server-side).
- **`sections/main-article.liquid`** — centred head (back link, category pill, title,
  standfirst, avatar/date/read-time, Dawn `<share-button>` restyled round), 21:9 hero,
  sticky left rail (TOC card filled by JS, share card: copy / native share / mailto,
  `.bl-shopcard` with collection setting), `.bl-body` renders `article.content` raw with
  descendant styling, tag links, **author bio as a section block** (not hardcoded),
  "Keep reading" grid (same category first, recent fallback, never the current post,
  de-duped), newsletter band, `structured_data` JSON-LD kept. Dawn's comment form was
  dropped on purpose (editorial blog; restorable from git).
- **`sections/featured-blog.liquid`** — repurposed as a **"Cartel journal teaser"** band
  (blog picker, 3–12 cards, padding via `--cl-pt/--cl-pb`) for use on any page later; it
  loads `cartel-blog.css` itself. Not referenced by any template yet. (The blog index's
  featured card lives inside main-blog, so `blog.json` stays single-section.)
- **`snippets/article-card.liquid`** — the `.bl-card` (image + category pill from tags,
  title, excerpt, initials avatar, date · read-time estimated at 200 wpm).
- **`sections/main-search.liquid`** — `.srchhead` ("Results for …" once performed), big
  `.srchbar` (kept contracts: `<predictive-search>`, `<main-search>`,
  `input[type=search]#Search-In-Template`, `button[type=reset].srch-clear`,
  `options[prefix]=last`), suggested-term chips (section setting), toolbar with count +
  **type tabs** (All/Products/Articles/Pages via `type=`) + `.ssortbtn` sort popover —
  a CSS-only `<details>` of server-side `search.sort_options` links (no cartel-search.js
  exists by design), `.srchgrid` dispatching `cartel-card` / `article-card` /
  `.srch-pagecard`, `.sload` bar + "Load more results" (next-page link, 24/page) with
  "Showing X of Y", empty state with popular-search chips + suggested collections
  (collection_list setting).
- **`sections/predictive-search.liquid`** — Cartel rows (thumb + vendor + title + price,
  Thuya gate → "Log in"), Suggestions / Products / Pages & posts groups, "View all
  results" footer. Every Dawn JS hook preserved (`#predictive-search-results`, groups
  wrapper id, `li[role=option]` ids, `button.predictive-search__item`, search-for-text,
  live region). Styles ride inside the section `<style>` because this markup renders on
  every page; the outer Dawn container is made chromeless and the `.cl` root carries the
  card look.
- **`assets/cartel-blog.css` / `cartel-search.css`** — machine ports installed untouched;
  lane additions appended (§-commented): featured card, `.bl-body` descendant rules
  (h2/h3/p/a/ul/ol/blockquote/img/figure/figcaption/iframe — pasted migration HTML needs
  no classes), share-button restyle, teaser band, search sort popover, `.bl-card` subset
  for the search grid, page cards, load-more, predictive anchor under the template bar.
- **`assets/cartel-blog.js`** — builds the TOC from rendered `.bl-body` h2s (injects
  slugified unique ids), smooth-scrolls under the sticky header (`scroll-margin-top:96px`),
  highlights the active heading on scroll, copy-link/native-share with `.toast`
  confirmation; no-ops cleanly on the index (jsdom-tested both ways, zero errors).
- **Templates** `blog.json` / `article.json` (author block preset: Joan Wong) /
  `search.json`.

## Store data findings (matters for the migration)

- **All 70 posts are already imported** on blog `news` (title currently **"Blog"**) —
  with images, correct slugs and dates. The templates handle them today.
- **No category tags yet** → chips show no per-tag counts, article pages show no pill,
  `/tagged/…` 404s. **Tag vocabulary the migration must apply (one per post):**
  `Technique`, `Education`, `Business`, `Supplies` (matched case-insensitively; chip URLs
  use the handles `technique|education|business|supplies`). The design's `product` key =
  the `Supplies` tag.
- **No excerpts yet** → standfirst is empty on articles. Set the excerpt (preferred) or
  the metafield below per post.
- Suggest renaming the blog to **"The Journal"** in admin (breadcrumb/back-link use
  `blog.title`; design says "The Journal").

## Metafields

- `article.metafields.custom.standfirst` (single-line text) — fallback when
  `article.excerpt` is empty (excerpt wins when both exist, per the lane spec's order).
- `blog.metafields.custom.count_technique| count_education | count_business |
  count_supplies` (integer, optional) — **exact chip counts**. Liquid can only count
  tags across the first 50 posts (and only on the unfiltered view), so with 70 posts the
  window counts undercount; these four values (set once at migration) override. Without
  them the All chip is always exact; tag chips fall back to the 50-post window count and
  the active chip to the filtered total.

## Author block

`main-article` block "Author bio" (limit 1): name / role / bio, preset filled with Joan
Wong. Head byline uses the Shopify article author; initials avatars are generated from
the name. Additional authors later = edit the block or add per-template variants.

## Acceptance checklist status

- Index featured + grid + chips ✓ (12/page ✓, page 2 = 12 cards, no featured ✓; chip
  `/tagged/` URLs + active logic verified in markup — end-to-end once posts are tagged).
- Article TOC from real h2s ✓ (jsdom: 6/6 links, unique ids injected, scroll + hash ✓;
  rail sticky at 96px, bounded by the grid).
- Body styling h2/h3/p/ul/ol/blockquote/img/figcaption ✓ on the real migrated HTML
  (numbered-circle ol, bullet ul, plum links — screenshots in the lane packet notes).
- Related never includes the current post ✓.
- Search products AND articles ✓, type tabs filter ✓, sort works (Relevance / Price ↑↓ —
  all `search.sort_options` Shopify exposes) ✓, empty state ✓.
- Predictive dropdown Cartel-styled ✓; keyboard hooks preserved (Dawn's
  `li, button.predictive-search__item` walker, aria-selected, activedescendant ids).
- **Thuya gated card: not runtime-verifiable — the store still has no Thuya-vendor
  products** (unchanged since batch 4.1). The gate is cartel-card's own logic (frozen
  snippet) + the same condition in predictive rows; parse-verified.
- `cartel-blog.css`+`js` load on blog/article only, `cartel-search.css` on search only ✓
  (theme.liquid batch-7.0 case block, confirmed in served HTML). No JS errors (jsdom).

## Parallel-lane / infra notes (important)

- **20-theme cap** (above) — one admin deletion unblocks the `Cartel 7F` push.
- **`shopify theme dev` renders the proxy-owner's LOCAL worktree**, not the remote theme
  — lanes cannot verify each other through one proxy (7C's :9292 shows 7C's files). I
  ran my own proxy on :9293 for verification and shut it down after; 7C's dev was left
  untouched. My two early full `theme dev` syncs (before I understood the race) may have
  briefly reverted other lanes' dev-theme uploads made before ~17:10; 7E re-pushed right
  after, and rendering is local-per-proxy anyway — but worth a heads-up at merge time.
  Cooperative pattern all lanes should use: `shopify theme push --development --nodelete
  --only <own files>`.
- **Silent settings stripping:** template JSON uploaded while the theme still holds the
  OLD section schema gets its unknown settings **silently removed** (blog.json lost its
  heading/per_page on first push — no error). Remedy: re-upload the section (byte change
  to bust Shopify's schema cache), then the template, then `theme pull --only` + diff.
  All 12 lane files verified byte-identical on the dev theme.
- Schema gotcha: range settings need **≥ 3 steps** (featured-blog's post_limit 3–6/3 was
  rejected; now 3–12/3).

## Requests for files I don't own

- **None required.** Search sorting/type tabs are self-contained, so no `facets.liquid`
  change (7A) is needed. If storefront *filters* (price/availability) are ever wanted on
  search, that would go through 7A's facets — the design shows none, so I didn't wire it.
- FYI 7C (cart/conversion): the blog/article/search pages render the `cartel-offer-tab` /
  `cartel-email-popup` stubs from theme.liquid — nothing needed, just noting they appear
  on these templates too once filled.

## Design-file gaps flagged for Claude Design

- `Blog.dc.html` computes `featuredCard` / `showFeature` in renderVals but **never
  renders the featured card markup** — composed here as `.bl-feat` (documented in the
  cartel-blog.css §1 comment) from the card/promo language.
- The prototype's TOC heading says **"In this article"** (spec text said "On this page")
  — went with the design copy.
- `.srch-popchip` is used in the search empty state but has no rule in the port — styled
  in my appended section to match `.srchchip`.
