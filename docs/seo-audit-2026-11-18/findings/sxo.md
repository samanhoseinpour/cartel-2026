# SXO findings: cartellash.ca (2026-11-18)

Scope: Search Experience (SERP-backwards) on 16 commercial and local queries, plus persona fit of the five landing-page types (home, collection, open PDP, gated Thuya PDP, blog article). The score in this file is the **SXO Gap Score**, which is separate from the SEO Health Score.

**Evidence sources**
- **GSC exports:** post-launch is 2026-08-29 to 11-15 and pre-launch is 06-10 to 08-28. Files are in `/private/tmp/claude-501/-Users-saman-Desktop-cartel-2026/5dc7dfa3-1de3-4ea0-ae91-e2300cb84b1d/scratchpad/seo-snap/gsc/`:
  - `queries_post.json`, `query_page_post.json`
  - `pages_post.json` + `pages_post_rest.json`, `pages_pre.json`
  - `compare_query.json`, `compare_page.json`
  - `country_post.json`, `device_post.json`, `inspections.json`
- **Page structure:** theme source in this repo (file:line references below), plus the saved live homepage `…/seo-snap/live/home.body`, which was captured in the CA market.
- **SERPs:** WebSearch tool, run 2026-11-18. It is US-localized and returns organic links only (see Limitations).
- **Pages opened:**
  - Beauty Pro Supplies' Thuya Lash Lifting Kit PDP
  - Curacoro's `/collections/korean-lash-lift`
  - `cartellashca.blogspot.com/2022/02/top-10-lash-supplies-must-haves.html`
  - Google Merchant Center help 6098334
  - SERoundtable's 2022-07-28 report on "Login required" free listings
- **cartellash.ca was not requested** (Cloudflare/Blockify rule).

**GSC counting notes**
- Page-level sums (68,549 impressions) exceed the property total (62.8K) because GSC counts per URL.
- The query exports drop zero-click queries alphabetically after "best l…" (`queries_post`) and "brow p…" (`query_page_post`). A query missing from the export may still have impressions.

## Headline

1. **The biggest commercial demand lands on a Product page that has no price.** The two Thuya brow-lamination queries bring 1,010 impressions. 729 of their 768 page-attributed impressions go to a *US* Google free-listing URL. Every result in that SERP is a priced, buyable PDP. Our page shows "Log in to see price" and emits no Product JSON-LD. The page type is right, but the page lacks the elements that define it.
2. **Category intent lands on the homepage or on blog posts.** Collections get 4.9% of page impressions. The proxy SERPs for category queries are collection pages and PDPs.
3. **The blog drives 79% of impressions, and every article ends at the same dead end.** All 70 articles carry one identical "Shop aftercare" card. It shows a Shopify placeholder image and links to `/collections/all`. Per the CSS, on phones (77% of clicks) the card sits above the article text.

## Query → SERP-type table

How to read this table:
- **Proxy SERP** = result-type mix in the WebSearch tool's top 15–24 links. Counts are mine.
- **Mismatch** uses the taxonomy ratings: CRITICAL / HIGH / MEDIUM / ALIGNED.
- **"n/e"** = not in the export (see the truncation note above).

| # | Query | GSC post-launch: impr / avg pos → our URL (type) | Proxy SERP mix | SERP consensus | Mismatch |
|---|---|---|---|---|---|
| 1 | thuya brow lamination kit (+ "thuya brow lamination") | 399 / 6.6 and 611 / 7.6. Both → `/products/thuya-brow-lamination-kit?…country=US…utm_content=sag_organic` (US rows 337 + 392). Type: PDP, gated | 19/19 PDPs (Ellisons ×4, Curacoro ×2, Beauty Depot ×2, Faire wholesale ×2, Beauty Pro Supplies, Takeover, Browshop, …) | PDP 100% | **HIGH (functional).** The PDP has no price and no add-to-cart |
| 2 | thuya lash lift canada | "thuya lamination kit" 34 / 9.6. → `/products/thuya-lifting-kit`, `…/thuya-brow-lamination-kit` (gated PDPs) | 16 PDPs (Beauty Pro ×8, incl. "thuya lash lifting kit canada"; Curacoro ×4; Beauty Depot ×3), 2 collections, 1 directory | PDP 84% | **HIGH (functional).** Same as #1 |
| 3 | brow lamination kit canada | "brow lamination kit" 14 impr: Thuya free listing (CA) at 1.9; `/collections/brow-lamination` at 26 | 20/20 PDPs (Cosmoprof, Nail Basics ×3, Canada Beauty Supply ×2, Beauty Pro, and 13 consumer DIY kits at Canadian Glow/Bellavia) | PDP 100% | **MEDIUM.** Only our gated PDP ranks. Open alternatives (Bronsun Brow Perm Set, Noemi Innovate) don't surface |
| 4 | lash lift supplies canada | "lash lift supplies" 42 / 12.3 → `/` (31 impr at 9.4). Type: Home | 12 PDPs (Nail Basics RefectoCil ×5, Beauty Pro Thuya kit, Stacy Lash, …), 2 collection URLs (Beauty Pro `lash-lift-kits`), 3 guides (Curacoro, Nove Wholesale, a blogspot) | PDP 71% | **MEDIUM.** Home vs collection/PDP |
| 5 | lash lift supplies | same as #4 | 10 category/collection pages (Lash Jungle, PLA, Salontotal, Aston & Fincher, Phi Shop, Eyelash Emporium, …), 8 guides, 6 PDPs | Collection 42% | **MEDIUM.** Home vs collection |
| 6 | korean lash lift pads | 61 / **38** → `/collections/korean-lash-lift` (Collection) | 16/18 single-product PDPs for flat silicone pads (Augenmanufaktur ×2, Eyelash Excellence ×2, Lashbase ×2, LBLA Miko, Curacoro ÉLAN, …), 1 category, 1 blog | PDP 89% | **HIGH.** Collection vs PDP |
| 7 | korean lash lift supplies canada | n/e. The page `/collections/korean-lash-lift` has 213 impr at 20.1 | 16 PDPs (Bellavia ×5, Canadian Glow ×3, Ulta ×3, Curacoro ×3, …), 3 collections (Labapro, SalonServe, Curacoro) | PDP 84% | **ALIGNED-to-MEDIUM.** A collection is acceptable here; the rank is weak |
| 8 | lash tech supplies | 109 / **34**. → `/blogs/news/top-10-lash-supplies-must-haves` (27 impr at 18.2), `…/lash-extension-supplies-you-need-as-a-beginner-lash-tech` (18 at 12.8), `/` (17 at 6.2). Type: Blog | 16 guides/checklists, mostly supplier blogs (Stacy Lash ×2, LivBay ×2, London Lash, Lashbase, …). **2 of them are `cartellashca.blogspot.com` copies of our own posts.** Also 4 category pages (False Eyelashes UK, Walmart ×2, PLA) and 4 social/spam | Guide 67% | **ALIGNED type, MEDIUM execution.** The posts are diluted, and the checklist has no shop links (F6) |
| 9 | lash supply store | 64 / 7.9 → `http://cartellash.ca/` (10 impr at 3.1). Type: Home | 6 store hubs (Lash Affair, Xtreme Lashes, Universal, Phi Shop, Lash Lift Store, Target), 4 US local listings (MapQuest ×2, Leadstal, SanDiegoLineup), 5 guides, 5 social/app/forum/spam | Mixed: store hub + local | **ALIGNED** |
| 10 | lash supply canada | n/e | Fragmented, no dominant type. 3 guides (incl. Curacoro's "How to choose the best supplier for eyelashes in Canada"), 3 directories (CosmeticIndex ×2, …), 3 news/PR, 5 retail/marketplace pages, 1 Health Canada report, 5 spam/other | Supplier discovery | **Cartel absent.** Gap for the homepage or an About page |
| 11 | lash extension supplies canada | n/e. `/collections/lash-extension` has 111 impr at **43.3** | 7 PDPs (mostly consumer DIY cluster kits: Everymarket ×5, Canadian Glow, Beautetrade), 2 collections (Beauty Pro adhesives, Curacoro), 3 guides, 4 other | PDP 44% (DIY-skewed) | **MEDIUM** |
| 12 | bronsun tint canada | "bronsun tint" 18 / 9.7 → PDP `eyelash-and-eyebrow-dye-bronsun-15-ml`. "bronsun canada" 29 / 7 → `/collections/bronsun` | **Unusable SERP** (car window tint). Retried as "bronsun gel dye eyebrow tint canada": 17/17 PDPs (Curacoro ×12, Cosmedic UK ×3, Bellavia, Le Beauty AU) | PDP 100% | **ALIGNED** |
| 13 | noemi lash lift | 164 / 7. Split between PDPs `noemi-innovate-lash-lift-brow-lamination-system` (96 impr at 7.1) and `…-duo-2x10ml-pack…` (68 at 7) | 11/15 PDPs (Curacoro ×4, Browstar ×2, SalonCentric ×2, Cosmedic ×2, Bronsun USA), 1 brand PDF, 3 spam | PDP 73% | **ALIGNED** (split, F11) |
| 14 | lash supply (store) vancouver | n/e | 11 Fresha booking pages (one is the listing for Audrey Lashes Supply Store Inc., Burnaby), 1 directory (Lash Beautique Pro, 1125 Howe St), 5 blogs/news (incl. The Lash Mall, Langley) | Local / directory | **Cartel absent.** Local pack not observable |
| 15 | lash supply (store) burnaby | n/e | 19/19 Fresha pages, incl. Audrey Lashes Supply Store Inc. (6344 Kingsway #1, +1 778-241-9088). The follow-up "eyelash extension supplies Burnaby BC store" adds Romantic Eyes Eyelash Extension Supplies & Education (5481 Kingsway #207, via TrustAnalytica) | Local / directory | **Cartel absent** |
| 16 | lash supply store near me | 46 / 10.8 → `http://cartellash.ca/` (22 impr at 3.6) | **not checked.** The US-only tool cannot localize "near me" | n/a | not checked |

Also not checked: "eyelash extension cleanser" (45 impr at 18.1, blog), "linger beauty" (55 at 3.7, collection, which GSC shows aligned), and "lash extension supplies vancouver".

## Findings (most severe first)

Severity scale: Critical = blocks indexing or causes penalties. Nothing here is Critical.

### F1. Thuya: the largest non-branded product demand lands on a PDP with no price
- **Severity:** High
- **Owner:** `admin-content` (gate policy, Merchant Center feed) + `theme` (gate code)
- **Evidence: demand and click-through**
  - "thuya brow lamination" has 611 impr / 2 clicks / pos 7.6. "thuya brow lamination kit" has 399 / 2 / 6.6. These are the top two queries by impressions in the export.
  - 729 of their 768 page-attributed impressions go to the US free-listing URL `/products/thuya-brow-lamination-kit?variant=54526447485141&country=US&currency=USD&…utm_content=sag_organic`.
  - Free-listing (`sag_organic`) URLs total 1,660 impr / 21 clicks. Thuya accounts for 1,389 of those impressions (84%).
  - US free-listing rows convert at 0.26% (3 clicks / 1,159 impr). CA free-listing rows convert at 3.59% (18 / 501).
  - Thuya PDPs hold 2,610 of 5,884 PDP impressions (44%). Their CTR is 1.0%, against 2.29% for non-Thuya PDPs.
  - Over the last 28 days vs the prior 28, demand roughly quadrupled: 405 vs 103 impressions for "thuya brow lamination", and 299 vs 73 for "…kit". Part of this window overlaps the November core update.
- **Evidence: what the SERP shows**
  - The SERPs are 19/19 and 16/19 priced PDPs.
  - Beauty Pro Supplies' Thuya kit shows "Current price $99.95" and an Add to cart button to guests. Its pro positioning is a "Register as Licensed Pro" link in the header, not a product gate.
- **Evidence: our page**
  - The price slot shows "Log in to see price" and the buy area shows "Log in to view pricing" (`snippets/cartel-gate-cta.liquid`).
  - The gate condition is `product.vendor == 'Thuya' and customer == nil` (`sections/main-product.liquid:91`).
  - Product JSON-LD is suppressed when the gate is on (`main-product.liquid:1053-1058`).
  - URL Inspection of the canonical kit PDP: indexed, but the only rich result detected is Breadcrumbs.
- **Evidence: the gate checks nothing**
  - FAQ copy: "An account is free and takes about a minute — there's no application and nothing to prove" (`templates/page.faq.json:23`).
- **Evidence: Google policy**
  - Merchant Center help: "Prices reflected in the HTML need to match exactly the prices uploaded in Merchant Center" (help 6098334).
  - Since 2022-07-28, free listings flagged "Login required" are no longer disapproved, but they "have limited visibility on Google" (SERoundtable).
- **Recommendation**
  1. Get the client's decision. The gate verifies nothing, so the lowest-cost fix is to ungate Thuya prices (drop the vendor condition) and keep "professional line" as copy.
  2. If the gate stays, check Merchant Center → Products for "Login required" or "Mismatched value (page crawl) [price]" on the Thuya items. If either is present, exclude those items from the Google & YouTube channel rather than run them at limited visibility, and decide whether US shoppers should see them at all.
  3. In both cases, ship the explanation in F9.
- **How we'd know it failed**
  - 28 days later, "thuya brow lamination kit" CTR is still under 1% at pos ≤ 8.
  - Merchant Center still flags the Thuya items.
  - URL Inspection on the kit PDP still detects no Product or Merchant-listing result.

### F2. The blog's only commercial path is a generic placeholder card, and on phones it sits above the answer
- **Severity:** High
- **Owner:** `theme` (+ `admin-content` to pick the collections)
- **Evidence: traffic share**
  - The blog has 54,447 of 68,549 page-level impressions (79%) and 254 of 660 page-level clicks.
  - Mobile brings 502 of 655 clicks (77%).
- **Evidence: the card**
  - In `templates/article.json` the `main` section has no settings (`{}`). All 70 posts therefore render the schema defaults:
    - title "Eyelash aftercare"
    - button "Shop aftercare", linking to `routes.all_products_collection_url` = `/collections/all` (`sections/main-article.liquid:60-64, 159-161`)
  - There is no image and no collection, so the card renders `placeholder_svg_tag` (`:141-155`).
  - The card is the same on the shelf-life post (6,351 impr), the nano-mister post (2,587 impr, 32 clicks) and the supplies checklists.
- **Evidence: mobile layout**
  - `aside.bl-art-rail` comes before `.bl-art-body` in the DOM (`main-article.liquid:114-115`).
  - At ≤1040px the grid collapses to one column (`assets/cartel-blog.css:236`). At ≤760px the rail cards stretch to full width (`:258`).
  - So on phones the TOC, Share and shop cards sit between the hero image and the first paragraph. This is inferred from the CSS and was not rendered; verify with a 390px screenshot.
- **Evidence: what the winning SERP pages do**
  - For "lash tech supplies", the ranking supplier blogs (Stacy Lash, London Lash, LivBay, Lashbase) are checklists that link to their own products.
- **Recommendation**
  - `theme`:
    - Make the card per-article. Use an article metafield (e.g. `custom.shop_collection`), fall back to a tag→collection map, then fall back to the section setting.
    - Never render the placeholder; drop the image row when there's no image.
    - At ≤1040px, render the rail after the body (CSS `order`).
  - `admin-content`: interim fix in the editor today. Point the card at the real aftercare collection (`/collections/aftercare-retail` exists) and give it an image.
- **How we'd know it failed**
  - At 390px, the first paragraph of the shelf-life post still starts below the first screen.
  - Any article still links "Shop aftercare" to `/collections/all` or shows the placeholder.
  - The blog→collection/PDP click rate in GA4 is flat after 28 days.

### F3. Category queries land on the homepage or blog; collections get about 5% of impressions
- **Severity:** High
- **Owner:** `admin-content` (descriptions, titles, internal links) + `theme` (collection template)
- **Evidence: impression share**
  - Post-launch page impressions: collections 3,378 (4.9%), PDPs 5,884 (8.6%), blog 54,447 (79%).
  - Pre-launch, collections had 7,162 impressions. 3,286 of those came from `/collections/lash-god` and `/collections/untamed-artistry`, brands outside today's six, so part of the drop is the catalogue change.
- **Evidence: queries landing on the wrong type**
  - "lash lift supplies" (42 impr / 12.3) lands on `/`. The proxy SERP has 10 category pages out of 24 (Table #5). This is a MEDIUM mismatch.
  - `/collections/lash-extension` sits at 43.3 (111 impr).
  - "brow lamination supplies" lands on `/collections/brow-lamination` at 15.2, and "brow lamination kit" lands there at 26.
- **Evidence: overlapping collections**
  - There are four lift collections that could compete with each other: `lash-lift` (44 impr at 26.2), `korean-lash-lift` (213 at 20.1), `lash-lift-solutions` (86 at 28.9) and `lash-lift-brow-lamination` (31 at 12.4).
- **Evidence: the template**
  - `templates/collection.json` contains only the banner and the grid. The banner holds the breadcrumb, eyebrow, H1 and an optional description (`sections/main-collection-banner.liquid`).
  - There is nothing below the grid: no shipping or pickup strip, and no guide links.
- **Evidence: what a competitor does**
  - Curacoro's Korean Lash Lift collection is the most frequent Canadian competitor in these SERPs. It has no intro copy either.
  - It wins on breadth (51 products), CAD prices, "Free Shipping from CAD $125", and sub-collection links: lift systems by brand, rods, and under-eye pads.
  - So the gap is structure and internal linking, not word count.
- **Recommendation**
  - Pick one target collection per head term. For example, "lash lift supplies" → `/collections/lash-lift`. Then de-duplicate the lift collections.
  - Write 60–120-word descriptions (they render above the grid) that name the category, say "Canada", and state the shipping and pickup facts.
  - Set SEO titles such as "Lash Lift Supplies Canada: Korean Lift Kits, Shields & Solutions | Cartel Lash".
  - Link from the high-impression blog posts to the matching collection, with the category term as the anchor text.
  - `theme`: add an optional below-grid block to `collection.json`, either buying notes/FAQ or the existing `cartel-trust` CA strip.
- **How we'd know it failed**
  - 6 weeks later, GSC still attributes "lash lift supplies" to `/`.
  - The collections' share of page impressions is still under 10%.

### F4. US shipping promise contradicts itself in three places, in the largest impression market
- **Severity:** High
- **Owner:** `theme` (PDP hardcode) + `admin-content` (bar and trust-strip copy, and the real Shopify rate)
- **Evidence: the three versions**

  | Where | What the US visitor reads | Source |
  |---|---|---|
  | Announcement bar | "$8.99 flat-rate US shipping · Free over $120USD" | `sections/header-group.json`, `market_visibility: us` |
  | Homepage trust strip | "Free shipping $150+ USD" / "$9.99 flat rate under" | `templates/index.json`, `market_visibility: us` |
  | PDP perk | "FREE shipping on US orders over $120 USD" | `sections/main-product.liquid:761` |
  | PDP shipping accordion | "$9.99 flat-rate US shipping, free on orders over $120 USD" | `sections/main-product.liquid:871-872` |

  - So the flat rate reads $8.99 or $9.99, and the free-shipping threshold reads $120 or $150.
- **Evidence: market size**
  - The USA is the largest impression market: 23,780 impr, 135 clicks, 0.57% CTR, pos 14.1.
  - Canada for comparison: 20,258 impr, 452 clicks, 2.23% CTR.
  - US shoppers also arrive through free listings that display Merchant Center shipping.
- **What I could not verify:** which of these numbers is true. The Shopify shipping settings were not accessible.
- **Recommendation**
  - Read the true US rate and threshold in Shopify Settings → Shipping.
  - Have all three surfaces read one theme setting, or at minimum correct the PDP hardcode plus the two editor strings to the same numbers.
- **How we'd know it failed**
  - `grep -rn 'USD' sections templates` still shows two thresholds or two flat rates.
  - A US-market preview of the bar, the homepage and a PDP still disagree.

### F5. "korean lash lift pads": a broad collection ranks at 38 where the SERP wants a pad PDP
- **Severity:** Medium. The mismatch rating is HIGH, but the volume is low.
- **Owner:** `admin-content`
- **Evidence: ranking**
  - 61 impr / 1 click / pos 38 → `/collections/korean-lash-lift`.
  - Last 28 days: 31 impr at 37.
- **Evidence: SERP**
  - 16 of 18 results are single-product PDPs for flat silicone pads (Table #6).
- **Evidence: what we already have**
  - Candidate pages appear in the GSC page data: `flat-jelly-lifting-pad`, `thuya-silicone-pads` (gated), and the shield PDPs `crown-jewel-…`, `pink-pearl-…`, `rainbow-hybrid-…`.
  - `/collections/rods-shields` has 50 impr at 9.3.
  - Current stock was not verified.
- **Recommendation**
  - Make one non-gated pad PDP the target. Put "Korean lash lift pads" in its title, H1 and first line.
  - Link to it from the Korean Lash Lift description and from Rods & Shields.
  - Consider renaming that collection to "Rods, Shields & Pads".
  - Don't target the gated Thuya pads.
- **How we'd know it failed:** after 6 weeks, GSC still maps the query to the collection, or the PDP is not in the top 20.

### F6. "lash tech supplies": three overlapping posts plus two off-site copies, and no shop path from the checklist
- **Severity:** Medium
- **Owner:** `admin-content`
- **Evidence: ranking**
  - The query has 109 impr at pos 34 (Table #8).
  - Three posts target the same intent, all ranking between 24 and 43:
    - `top-10-lash-supplies-must-haves`: 1,632 impr at 24.4
    - `lash-extension-supplies-you-need-as-a-beginner-lash-tech`: 1,451 at 28.0
    - `top-12-must-have-lash-extension-supplies-…-black-friday`: 1,503 at 42.8
  - Related queries:
    - "best lash supplies": 42 impr, including `#fragment` rows at 8.5–11.2
    - "beginner lash tech supplies": 15 at 23.4
    - "best eyelash extension supplies": 11 at 36.3
- **Evidence: SERP**
  - 67% of the SERP is guides, so the blog type is aligned.
  - What loses is the dilution and the missing shop path (see F2). Two of the competing guides are our own Blogspot copies (see F7).
- **Recommendation**
  - Merge the three posts into one canonical "Lash tech supplies checklist (Canada)".
  - Link every item to its collection or PDP, and add a starter-kit CTA (`/collections/kits-sets`).
  - 301 the other two posts to it.
- **How we'd know it failed:** 8 weeks after the merge, the redirected URLs still log impressions, or the canonical post is not above pos 15 for "lash tech supplies" or "best lash supplies".

### F7. A Blogspot mirror duplicates our posts and, per search summaries, carries the old phone and address
- **Severity:** Medium
- **Owner:** `admin-content`
- **Evidence: the opened copy**
  - `cartellashca.blogspot.com/2022/02/top-10-lash-supplies-must-haves.html` is titled "Cartel Lash: Top 10 Lash Supplies Must Haves" and dated 2022-02-16.
  - It credits `cartellash.ca/blogs/news/top-10-lash-supplies-must-haves` as its source, but has no canonical tag pointing to it.
  - `/2022/05/lash-extension-supplies-you-need-as.html` ranks in the same SERP.
- **Evidence: the old NAP (unverified)**
  - The search-tool summaries attribute "(604) 437-0011" and "104-3787 Canada Way, Burnaby, BC V5G 1G5" to the 2022/05 and 2022/01 posts. Those pages were not opened.
  - The page I did open (2022/02) shows no phone or address.
- **Evidence: the site today**
  - The footer shows +1 (778) 251-5550 and info@cartellash.ca, with no street address (`sections/footer-group.json`).
  - The Organization JSON-LD has neither an address nor a phone (saved homepage).
- **Recommendation**
  - If the client owns the Blogger account, delete the blog, or cut each post to a two-line excerpt that links to the canonical URL.
  - Fix or remove the old phone.
  - Decide one public NAP and use it everywhere: footer, Organization schema, GBP and social profiles.
- **How we'd know it failed:** a manual `site:cartellashca.blogspot.com` search still returns posts after 30 days, or searching `"Cartel Lash" "437-0011"` still returns live pages.

### F8. Local: Cartel is absent from Burnaby/Vancouver supply results and sends no local signals
- **Severity:** Medium
- **Owner:** `admin-content` (GBP, NAP) + `theme` (pickup page, schema)
- **Evidence: who appears instead**
  - The proxy SERPs (Table #14–15) surface Audrey Lashes Supply Store Inc. (Burnaby, via Fresha), Romantic Eyes (Burnaby, via TrustAnalytica), Lash Beautique Pro (Vancouver), The Lash Mall (Langley) and 604lashdon (South Surrey, in-store pickup).
  - Four searches for "Cartel Lash (Supply)" with Burnaby or West Vancouver found no listing for Cartel. One `business.google.com/v/…` result appeared, but I could not tell whose it is.
- **Evidence: local demand already in GSC**
  - The homepage already earns "near me" impressions: "lash supply store near me" (46 impr at 10.8), "lash supply stores near me" (10 at 8.8), "eyelash extensions supplies near me" (6 at 14.8).
- **Evidence: the site**
  - It offers same-day pickup in "West Vancouver & Burnaby" but never says where or when.
  - There is no LocalBusiness markup, and the Organization markup has no telephone.
- **What I could not observe:** the local pack itself.
- **Recommendation**
  - `admin-content`: decide the public NAP. If staff meet customers at the pickup points during stated hours, create and verify a Google Business Profile (category "Beauty supply store"). Otherwise set it up as a service-area business.
  - `theme`:
    - Add a `/pages/local-pickup` page: the cities, hours, how pickup works, and a map only if the address is public.
    - Link it from the footer perk and the PDP pickup line.
    - Add `telephone`, `email` and `areaServed` to the Organization JSON-LD, and add LocalBusiness only if there is a public address.
- **How we'd know it failed**
  - 30 days after GBP verification, a manual Google.ca/Maps check from Burnaby for "lash supply store burnaby" still shows no Cartel.
  - The GSC "near me" queries stay under 1 click a month.

### F9. The gated PDP doesn't say why, and "Log in" sends a search visitor off-site
- **Severity:** Medium
- **Owner:** `theme` (+ `platform`: new customer accounts)
- **Evidence: the copy**
  - Gate copy: "Log in to see price", "Log in to view pricing", "New here? Create a free account — it takes a minute." (`snippets/cartel-gate-cta.liquid`).
  - The reason ("professional line") appears only in the announcement bar ("Log in to unlock pricing on Thuya professional products") and in the FAQ.
- **Evidence: the friction**
  - The store uses new customer accounts, so `/account/login` leaves the storefront.
  - Thuya cards replace quick-add with "Log in to view". The saved homepage's kits row shows this on both Thuya kits.
- **Recommendation**
  - Under the lock, add one line: "Thuya is a professional line. Prices unlock with a free account, no licence check."
  - Keep the kit contents and treatment yield visible. Competitors quote 25–55 treatments per kit.
  - Confirm that login returns the shopper to the same PDP.
- **How we'd know it failed**
  - Gated-PDP sessions that click "Log in to view pricing" still almost never reach add-to-cart in the same session.
  - Or, after login, the shopper still lands on the account page instead of the PDP.

### F10. No wholesale or trade page for the salon-owner persona
- **Severity:** Medium
- **Owner:** `admin-content`
- **Evidence: Canadian competitors lead with pro or wholesale access**
  - "Open to Licensed Beauty Professionals" (Modern Beauty, in the #4 SERP).
  - Nove Salon & Esthetics Wholesale (guide, #4).
  - "Register as Licensed Pro" and "Wholesale Lash + Brow Tinting Supplies Canada" (Beauty Pro Supplies page).
  - A Faire wholesale listing for the Thuya kit (professional-only, minimum order $137, #1).
- **Evidence: our path**
  - Wholesale is only an FAQ answer that points to the contact form's "Wholesale & trade" topic (`templates/page.faq.json:46-47`, `templates/page.contact.json:116-120`).
  - There is no URL that can rank or be linked.
- **Recommendation**
  - Create `/pages/wholesale` (the `page.json` template is enough). Cover who qualifies, minimums, brands, how to apply, and pickup.
  - Link it from the About menu, the footer and the homepage about band.
- **How we'd know it failed:** within 90 days the page earns no impressions for "wholesale lash supplies canada"-type queries, and wholesale-topic contact submissions don't rise.

### F11. "noemi lash lift" is split across two PDPs
- **Severity:** Low
- **Owner:** `admin-content`
- **Evidence:** 164 impr / 3 clicks / pos 7, split 96 / 68 between the Innovate PDP and the Innovate Duo PDP. The SERP is PDPs, so the page type is aligned.
- **Recommendation:** pick the single-pack PDP as the primary page. Link the Duo to it as a "value pack", or merge the two as variants.
- **How we'd know it failed:** GSC still splits the query across both URLs after 6 weeks.

### F12. Shopify's `/collections/vendors?q=` page competes with the curated brand collection
- **Severity:** Low
- **Owner:** `theme`
- **Evidence:**
  - "bronsun" (123 impr) splits between `/collections/bronsun` (85 at 8.3) and `/collections/vendors?q=bronsun` (23 at 8.8) / `?q=Bronsun` (2 at 10.5).
  - "bronsun canada" also lands on the vendors URL (7 at 7.6).
  - `/collections/vendors` has 125 impr post-launch.
  - Searchers land on the auto-generated page instead of the brand-hero template.
- **Recommendation:** in `layout/theme.liquid`, emit `<meta name="robots" content="noindex,follow">` when the request is `/collections/vendors`.
- **How we'd know it failed:** GSC still logs impressions on `vendors?q=` URLs 6 weeks after the change.

### F13. Footer perk says "Sign in to see prices", which overstates the gate
- **Severity:** Low
- **Owner:** `admin-content` (editor copy in `sections/footer-group.json`)
- **Evidence:** the "Free account" perk reads "Sign in to see prices, save your favourites and reorder in a tap." on every page, while only Thuya is gated.
- **Recommendation:** change it to "Sign in to see Thuya pro pricing, save favourites and reorder in a tap."
- **How we'd know it failed:** the footer still implies that all prices are hidden.

### F14. The homepage has five H1 elements, and none states what the store is
- **Severity:** Low
- **Owner:** `theme`
- **Evidence:**
  - The saved live homepage has 5 `<h1>`s: one without a text node (probably the header logo) plus the 4 slide headlines ("Stock your kit like a pro.", "Lifts that last weeks.", …).
  - The `<title>` does carry the term: "Pro Lash, Lift & Brow Supplies in Canada - Cartel Lash Supply".
  - This matters for "lash supply store" (pos 7.9).
- **Recommendation:** one H1, e.g. "Pro lash, lift & brow supplies, shipped across Canada". Demote the slide headings to `<p>` or `<h2>`. Run `/seo page` for the details.
- **How we'd know it failed:** the homepage still has more than one `<h1>`.

### F15. "lash cartel" and "lashed cartel" are brand-confusion queries (Info)
- **Severity:** Info
- **Owner:** `admin-content`
- **Evidence:** "lash cartel" has 48 impr / 3 clicks at pos 7.3, and "lashed cartel" 48 / 1 at 8.4. Search results show a separate US brand, Lashed Cartel, LLC.
- **Recommendation:** none beyond consistent naming. Use one entity name in the Organization schema, title suffix and socials. Today these vary between "Cartel Lash" and "Cartel Lash Supply".
- **How we'd know it failed:** no action is required.

### F16. Very low CTR on high-ranking blog posts suggests SERP features; unverified (Info)
- **Severity:** Info
- **Owner:** `admin-content`
- **Evidence:**
  - The shelf-life post has 6,351 impr at pos 7.5 but only 10 clicks (0.16%).
  - The aftercare-for-clients post has 4,142 impr at 16.5 and 1 click.
  - The tool cannot show AI Overview, featured snippets or People Also Ask.
- **Recommendation:** check the top 5 posts' SERPs manually on Google.ca. If an AI Overview or snippet is answering the query, put a one-paragraph direct answer plus a product bridge (F2) at the top of the post.
- **How we'd know it failed:** this is a monitoring item; the CTR stays flat.

### F17. GSC still reports `http://cartellash.ca/` as a ranking URL (Info)
- **Severity:** Info
- **Owner:** `platform` / technical audit
- **Evidence:**
  - `http://cartellash.ca/` has 519 impr and 33 clicks post-launch. It ranks for "lash supply store" (3.1) and "…near me" (3.6).
  - The 301 to https is in place (`live/log.tsv` row 5).
- **Recommendation:** no SXO action. Hand to the technical auditor to monitor consolidation.
- **How we'd know it failed:** the http URL still earns impressions after 60 days.

## What works

- **Brand and product queries land on the right page type, on page 1.** "linger beauty" → `/collections/linger-beauty` (3.8). "noemi innovate" → PDP (5.4). "bronsun canada" → `/collections/bronsun` (6.8). "noemi brow lamination" → `/collections/noemi` (6.3). "thuya regenerating cream" → PDPs (7.5). The SERPs for these are PDP or brand pages.
- **Branded search is strong.** "cartel lash" brings 131 clicks at pos 1 (79% CTR). The homepage ranks 3.1 for "lash supply store".
- **The CA shipping and pickup promise is consistent in all five places:** announcement bar, trust strip, PDP perks and accordion, footer, and meta description.
  - The $150 threshold sits between Curacoro's $125 and Beauty Pro Supplies' $199 or Beauty Depot's $200–250.
  - Among the online suppliers in these SERPs, only 604lashdon mentions pickup, so same-day pickup is a differentiator.
- **Open (non-Thuya) PDPs have everything the Product type requires:**
  - price + installments
  - stock line + "dispatched within 48 hrs"
  - pickup card
  - description, benefits, ingredients and how-to accordions
  - sticky mobile buy bar
  - "Complete the kit" recommendations
  - Product JSON-LD
- **Blog posts win informational queries.** "can clients get massages…" ranks 4.3 (66 clicks) and nano-mister 6.5 (32 clicks). The article template has a TOC, an author block (Joan Wong, lash educator), related posts and Article structured data.
- **CA free listings convert:** 3.59% CTR at avg pos 2.1.
- **The homepage title and meta description already target the head term** ("…Supplies in Canada", with the brands and "free shipping over $150").

## SXO Gap Score (site-level, indicative): 56 / 100

| Dimension | Score | Evidence |
|---|---|---|
| Page type | 8/15 | Brand and product queries are aligned. Category queries land on home or blog (F3, F5). The Thuya PDP is functionally broken (F1) |
| Content depth | 9/15 | Deep blog. Collections are an H1 plus an optional description. PDP accordions depend on metafields |
| UX signals | 9/15 | Clear CA shipping, pickup and sticky buy bar. On mobile the rail sits above the article (F2). Hidden price (F1). US copy conflict (F4) |
| Schema | 8/15 | Organization, WebSite, Article, BreadcrumbList, and Product on open PDPs. No Product on gated PDPs, no LocalBusiness, no contact fields |
| Media | 10/15 | Reels, before/after and packshots. Placeholder SVG on every article card (F2) |
| Authority | 6/15 | 4 first-name testimonials and no review aggregate. NAP inconsistent. Duplicate Blogspot content (F7) |
| Freshness | 6/10 | Relaunched 2026-08. Legacy posts still carry dated titles ("…winter-2021", "…black-friday") |

## Personas and user stories

**Personas** (each traced to a signal):
- **Lash tech (repeat pro buyer).** Signal: brand+product queries such as "noemi lash lift" (164 impr), "thuya regenerating cream" and "bronsun cream developer". Their SERPs are priced retailer PDPs.
- **Salon owner / wholesale.** Signal: "Open to Licensed Beauty Professionals", "Register as Licensed Pro", Nove Wholesale and the Faire wholesale listing in the lift and Thuya SERPs.
- **Beginner / student.** Signal: "beginner lash tech supplies" (15 at 23.4), "lash tech setup" (9). The SERPs show beginner checklists and training kits (Learning Curve Group's Thuya kit + course, Curacoro's training kit).
- **US cross-border buyer.** Signal: the USA is the largest impression market (23.8K at 0.57% CTR), and the US Thuya free listing has 729 impressions.

**User stories**
1. *Decision, lash tech.* I want to see the Thuya kit price and reorder, because I can see $99.95 at Beauty Pro Supplies. I'm blocked by "Log in to see price" and an off-site login. (Source: Table #1–2, F1.)
2. *Awareness → consideration, beginner.* I want a checklist I can shop from, because I don't know what a starter kit needs. I'm blocked by a post whose only CTA is "Shop aftercare" → all products. (Source: "lash tech supplies" SERP 67% checklists; F2, F6.)
3. *Consideration, salon owner.* I want trade pricing and proof you're an established Canadian distributor, because I buy in volume. I'm blocked by having no wholesale page and no visible address. (Source: competitor wholesale/pro headings; F10, F7.)
4. *Decision, local tech.* I ran out mid-week and want pickup today. I'm blocked because Cartel doesn't appear in Burnaby results and I can't find a pickup location or hours. (Source: "near me" GSC rows and the Burnaby SERP; F8.)
5. *Decision, US buyer.* I found the kit in Google Shopping and want to know the landed cost. I'm blocked by the price gate and three shipping promises. (Source: US free-listing CTR 0.26%; F1, F4.)

### What each page type gives the personas (from the templates)

| Need | Home | Collection | PDP (open) | PDP (Thuya, gated) | Blog article |
|---|---|---|---|---|---|
| Price visibility | ✓ cards (Thuya cards gated) | ✓ cards | ✓ price + installments | ✗ "Log in to see price" | ✗ no prices; card links to `/collections/all` |
| Shipping/pickup clarity | ✓ CA (bar + strip); ✗ US conflict | ◐ bar only | ✓ perks, pickup card, accordion (CA); ✗ US conflict | ◐ perks, but nothing to buy | ◐ bar only |
| Trust / pro credentials | ◐ 4 testimonials, brand marquee, "made by lash artists"; no address | ◐ brand-hero "why" points on brand template only | ◐ "100% authentic pro stock"; rating only if metafield | ◐ same, minus rich results | ✓ author block |
| Comparison | ✗ | ◐ filters/sort (config not verified) | ◐ before/after slider if metafields | ✗ | ◐ "best X" listicles |
| Education | ◐ resources row, before/after | ✗ description only | ✓ benefits, ingredients, how-to (if filled) | ✓ same | ✓ core strength |
| Path to purchase | ✓ hero CTAs, add to bag | ✓ add to bag | ✓ buy + sticky bar | ✗ off-site login, then return | ✗ one generic card |

### Persona scores

Scores are Relevance / Clarity / Trust / Action, 25 each. They are judgement scores from the templates, not user testing.

| Page | Persona | R | C | T | A | Total | Rating | Weakest dimension → fix |
|---|---|---|---|---|---|---|---|---|
| Home | Lash tech | 18 | 20 | 15 | 22 | 75 | Good | Trust → review counts / named salons |
| Home | Salon owner | 14 | 14 | 11 | 8 | 47 | Needs work | Action → wholesale CTA (F10) |
| Home | Beginner | 14 | 16 | 14 | 15 | 59 | Needs work | Relevance → "start here" kit entry |
| Home | US buyer | 15 | 9 | 12 | 18 | 54 | Needs work | Clarity → one US rate (F4) |
| Collection | Lash tech | 20 | 18 | 13 | 22 | 73 | Good | Trust → description + shipping strip (F3) |
| Collection | Salon owner | 14 | 13 | 10 | 9 | 46 | Needs work | Action → trade link |
| Collection | Beginner | 12 | 11 | 11 | 16 | 50 | Needs work | Clarity → buying notes below grid (F3) |
| PDP (open) | Lash tech | 23 | 21 | 15 | 23 | 82 | Excellent | Trust → reviews |
| PDP (open) | Salon owner | 16 | 17 | 12 | 12 | 57 | Needs work | Action → volume pricing / trade |
| PDP (open) | Beginner | 15 | 16 | 13 | 18 | 62 | Good | Trust → how-to / benefits filled |
| PDP (open) | US buyer | 20 | 12 | 13 | 20 | 65 | Good | Clarity → matches bar/home (F4) |
| PDP (gated) | Lash tech | 23 | 8 | 12 | 8 | 51 | Needs work | Clarity + Action → ungate or explain (F1, F9) |
| PDP (gated) | Salon owner | 15 | 7 | 10 | 6 | 38 | Critical mismatch | Action (F1, F10) |
| PDP (gated) | Beginner | 12 | 6 | 9 | 5 | 32 | Critical mismatch | Clarity → why gated (F9) |
| PDP (gated) | US buyer | 20 | 5 | 9 | 6 | 40 | Needs work | Clarity → price (F1) |
| Blog | Lash tech | 10 | 12 | 17 | 6 | 45 | Needs work | Action → per-article shop card (F2) |
| Blog | Salon owner | 8 | 10 | 14 | 4 | 36 | Critical mismatch | Action → wholesale link |
| Blog | Beginner | 21 | 13 | 17 | 7 | 58 | Needs work | Action + Clarity (mobile rail) (F2) |

**Weakest persona:** salon owner (average 45), but the export shows no observable query volume for this persona.

**Systemic issues:**
- The gated PDP is the lowest row for every persona.
- Blog "Action" is the lowest dimension on the highest-volume page type.

**Priority, weighted by volume:**
1. F1 + F9 (gated PDP)
2. F2 (blog bridge; beginners and blog are 79% of impressions)
3. F3 / F5 (collections)
4. F10 (wholesale)

## Limitations

- **SERPs come from a US-localized, non-Google proxy.**
  - No local pack, Maps, Shopping, ads, People Also Ask or AI Overview is visible.
  - Spam and preview domains (blogspot, duckdns, `.oembed`) appear that Google.ca would likely not rank.
  - Classifications use the result-type mix, not rank order.
  - Vancouver/Burnaby localization was impossible.
  - "bronsun tint canada" returned car window tint results and was re-run with product terms.
- **cartellash.ca was not fetched.** Page analysis comes from the theme source and one saved CA-market homepage. Editor content was not verified: collection descriptions, metafields, current stock, live US-market rendering. F2's mobile ordering is inferred from the CSS.
- **GSC exports are capped.** Zero-click queries are truncated alphabetically, so the absence of a query is not proof that it had zero impressions.
- **The November 2026 core update has been rolling out since 11-10.** Last-28-day deltas are partly volatility.
- **Merchant Center, Google Business Profile and Shopify shipping settings were not accessible.** Free-listing status is inferred from the `utm_content=sag_organic` URLs.
- **The old-NAP attribution in F7 rests on search-tool summaries of pages that were not opened.**

**Cross-skill follow-ups:**
- `/seo content`: consolidation in F6, E-E-A-T in F7
- `/seo schema`: Organization contact fields, LocalBusiness
- `/seo local`: GBP and NAP (F8)
- `/seo page`: homepage H1s, collection templates

Generate a PDF report? Use `/seo google report`.

## Structured findings (for audit-data.json, category "Search Experience")

```json
{"category":"Search Experience","sxo_gap_score":56,"findings":[
{"id":"SXO-01","severity":"High","owner":["admin-content","theme"],"title":"Thuya demand (1,010 impr, mostly US free listings) lands on a price-less gated PDP; SERP is 100% priced PDPs"},
{"id":"SXO-02","severity":"High","owner":["theme","admin-content"],"title":"Every article's only CTA is a placeholder 'Shop aftercare' card to /collections/all, above the body on phones"},
{"id":"SXO-03","severity":"High","owner":["admin-content","theme"],"title":"Category queries land on home/blog; collections 4.9% of impressions; 4 overlapping lift collections"},
{"id":"SXO-04","severity":"High","owner":["theme","admin-content"],"title":"US shipping copy contradicts itself ($8.99 vs $9.99; $120 vs $150) in the largest impression market"},
{"id":"SXO-05","severity":"Medium","owner":["admin-content"],"title":"'korean lash lift pads': collection at pos 38 vs 89% PDP SERP"},
{"id":"SXO-06","severity":"Medium","owner":["admin-content"],"title":"'lash tech supplies': 3 overlapping posts at pos 24-43 + no shop path"},
{"id":"SXO-07","severity":"Medium","owner":["admin-content"],"title":"cartellashca.blogspot.com duplicates posts without canonical; legacy NAP per search summaries"},
{"id":"SXO-08","severity":"Medium","owner":["admin-content","theme"],"title":"Absent from Burnaby/Vancouver supply results; no pickup page, GBP or local schema"},
{"id":"SXO-09","severity":"Medium","owner":["theme","platform"],"title":"Gated PDP gives no reason; login leaves the storefront"},
{"id":"SXO-10","severity":"Medium","owner":["admin-content"],"title":"No wholesale/trade landing page"},
{"id":"SXO-11","severity":"Low","owner":["admin-content"],"title":"'noemi lash lift' split across two PDPs"},
{"id":"SXO-12","severity":"Low","owner":["theme"],"title":"/collections/vendors?q= competes with curated brand collections"},
{"id":"SXO-13","severity":"Low","owner":["admin-content"],"title":"Footer 'Sign in to see prices' overstates the gate"},
{"id":"SXO-14","severity":"Low","owner":["theme"],"title":"Homepage has 5 H1 elements"},
{"id":"SXO-15","severity":"Info","owner":["admin-content"],"title":"'lash cartel'/'lashed cartel' brand confusion"},
{"id":"SXO-16","severity":"Info","owner":["admin-content"],"title":"Blog CTR anomalies; SERP features unverified"},
{"id":"SXO-17","severity":"Info","owner":["platform"],"title":"http://cartellash.ca/ still reported as ranking URL despite 301"}]}
```
