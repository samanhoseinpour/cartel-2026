# Batch 19 — the policy canonical + the /collections meta description

**Branch** `seo/batch19-policy-canonical` · **commit** `9d7bf1e` · base `97e8e86` (current `origin/master`)
**Date** 2026-08-30 · **Status: BUILT AND VERIFIED IN LOGIC — NOT MERGED, NOT PUSHED.**

> The on-store preview render is **blocked**: the Shopify CLI lost API access to the store partway
> through this session. Nothing has reached `master`. See *Blocked* below for the one thing needed
> to finish.

---

## What shipped in the commit

Two files, two hunks, exactly as the packet specified. Both FIND anchors were re-checked against
the batch base (`master` had moved three commits since the packet was measured) and both were
still unique: one `rel="canonical"` in `layout/theme.liquid`, one `assign d = page_description`
in `snippets/cartel-meta-description.liquid`.

| Step | File | Result |
|---|---|---|
| 1 | `layout/theme.liquid:8` | conditional canonical, handle-whitelisted `case` |
| 1b | `snippets/cartel-meta-description.liquid:41` | `list-collections` guard, inserted above `cl_from_admin` |

Neither hunk was retyped from the packet into a test — the verification below renders the
**shipped files themselves**.

---

## Verification

### 1. `shopify theme check` — unchanged

**198 offenses before, 198 after, delta 0.** The single `layout/theme.liquid` offense is
`UndefinedObject: Unknown object 'scheme_classes' used.` — byte-identical in the before and after
runs, pre-existing and unrelated to this batch. No file's count changed.

### 2–5b. Logic verification — 31 cases, 0 failures

`theme dev` and `theme push` were both unavailable (see *Blocked*), so the two hunks were extracted
verbatim from the committed files and rendered through python-liquid 2.3.0 against every route in
the packet's sweep. All 31 cases pass.

**Item 2 — the four mappings.** Each `/policies/` page emits the absolute `/pages/` twin:

| Rendered on | `<link rel="canonical">` |
|---|---|
| `/policies/shipping-policy` | `https://cartellash.ca/pages/shipping-policy` |
| `/policies/refund-policy` | `https://cartellash.ca/pages/return-policy` |
| `/policies/privacy-policy` | `https://cartellash.ca/pages/privacy-policy` |
| `/policies/terms-of-service` | `https://cartellash.ca/pages/terms-of-service` |

The refund-policy → **return-policy** asymmetry the packet flagged is correct.

**Item 3 — the four targets are live.** All four `/pages/` twins return HTTP 200 with full rendered
pages (157,744 / 157,211 / 157,915 / 157,398 bytes), fetched from the live storefront with a browser
User-Agent. No `when` branch points at a 404, so none had to be deleted.

**Item 4 — regression across every other template.** Twelve routes checked; each still emits its own
`canonical_url` verbatim: homepage, product, collection, article, `/pages/about`, **paginated
collection (`/collections/all?page=2`, pagination parameter intact)**, collections list, search,
cart, 404, login, gift card.

**Item 5 — other policy documents.** `contact-information`, `subscription-policy`, `legal-notice`
and a hypothetical `shipping-policy-2` all fall through the `case` and canonical to themselves.

**Item 5b — the /collections description.** The duplicate is closed and nothing else moved:

- `/collections` → *"Every pro line on the Cartel shelf: Thuya, Bronsun, NOEMI, Linger Beauty, Prolong and our own house range, stocked authentic in Canada."*
- `/` → still the shop line, unchanged.
- The two are no longer identical.
- `/collections/lash-lift` (admin copy wins), `/collections/cleanser-shampoo` (hand-written branch), and a paginated collection (` Page 2.` suffix intact) all emit what they did before.
- Paginated `/collections` gets the branch copy **plus** the ` Page 2.` suffix.

**The guard is the narrowest possible exception to precedence rule 1**, confirmed three ways:
`/collections` carrying genuine admin copy keeps it; a normal collection whose admin copy happens
to be shop-line-shaped is *not* cleared; and with `shop.description` blank the route still resolves
to the branch copy rather than emptying.

### The `shop.url` trailing-slash risk — ruled out on live output

`shop.url | append: '/pages/…'` would emit a double slash if `shop.url` ended in one. Settled
empirically rather than assumed: `snippets/cartel-breadcrumbs.liquid:145` already renders
`shop.url | append: cl_url` in live BreadcrumbList JSON-LD, and `/collections/lash-lift` returns
`"item": "https://cartellash.ca/collections/all"` — a single slash. `shop.url` carries no trailing
slash on this store.

### Other edge cases

- A `/policies/` URL with a **query string** or a **trailing slash** falls through the `case` and keeps `canonical_url`. Fails safe — no wrong canonical.
- **Locale prefixes** are not a live concern: the storefront emits `lang="en"` with zero `hreflang` / `rel="alternate"` links, so one locale is published.
- Served from the `.myshopify.com` host, the canonical correctly names the primary domain — which is why the packet chose `shop.url` over `request.origin`.
- `/pages/shipping-policy` (page_type `page`) is untouched; only `request.page_type == 'policy'` enters the branch.

### Adversarial review — 0 confirmed defects

Five independent reviewers (Liquid semantics, regression surface, Shopify platform, edge cases, SEO
semantics) over both hunks, then two adversarial refuters per finding. **3 findings raised, 3 unique,
0 dropped unverified, 0 survived.**

All three were the same observation from three different lenses: `snippets/meta-tags.liquid:3`
derives `og:url` from `canonical_url`, so after this change the four policy pages emit
`rel="canonical"` → `/pages/…` while `og:url` still says `/policies/…`. Refuted 6/6, on grounds
worth keeping: the diff does not touch `meta-tags.liquid`, so that byte is **identical before and
after** — it is the pre-existing status quo, not a regression; og:url is not a canonicalization
signal for search; and the policy pages carry no share UI. Recorded as an observation for a future
batch, not a blocker for this one. Two lenses returned no findings at all.

---

## Pre-push `<head>` captures (live `master`, before any merge)

`/` — `scratchpad/b19-before_.head.txt`
```
<link rel="canonical" href="https://cartellash.ca/">
<title>Pro Lash, Lift &amp; Brow Supplies in Canada - Cartel Lash Supply</title>
<meta name="description" content="Pro lash lift, brow lamination and lash extension supplies, shipped across Canada. Thuya, Bronsun, Noemi and Linger Beauty - free shipping over $150.">
<meta property="og:url" content="https://cartellash.ca/">
```

`/policies/shipping-policy` — `scratchpad/b19-before_policies_shipping-policy.head.txt`
```
<link rel="canonical" href="https://cartellash.ca/policies/shipping-policy">
<title>Shipping policy &ndash; Cartel Lash</title>
<meta name="description" content="Shipping policy for Cartel Lash, the pro lash and brow supply shop for Canadian artists. The full text in plain English, before you order.">
<meta property="og:url" content="https://cartellash.ca/policies/shipping-policy">
```

`/collections` before — byte-identical to `/`, which is the Semrush error this batch closes:
```
<meta name="description" content="Pro lash lift, brow lamination and lash extension supplies, shipped across Canada. Thuya, Bronsun, Noemi and Linger Beauty - free shipping over $150.">
```

Post-push captures: **not taken — nothing has been pushed.**

---

## Blocked

**The Shopify CLI lost API access to the store mid-session.** `theme list` succeeded at the start of
this session (it is what measured the 21 themes below) and fails now. Every theme command —
`list`, `dev`, `push` — dies identically:

```
Error connecting to your store cartel-lash.myshopify.com: GraphQL Error (Code: 404):
{"response":{"errors":"Not Found","status":404,...},"request":{"query":"query publicApiVersions ..."}}
```

`--verbose` places the fault on the shop, not the CLI: `Token validation -> It's expired: false`, then
`POST https://cartel-lash.myshopify.com/admin/api/unstable/graphql.json` → **404 Not Found** in 511 ms.
Six retries over two minutes, all identical. This store's Admin API has been intermittent before
(blackholed one morning, fully working by afternoon).

**To finish, re-authenticate** — it needs a browser, so it has to be run interactively:

```
shopify auth logout && shopify theme list
```

Once that returns the theme list, the remaining work is the rendered sweep on a preview theme and
then the merge.

### The preview theme, when access returns

The packet's RULE #0 route — an unpublished duplicate — is **unavailable**: the store holds 20
non-development themes, which is Shopify's cap. A duplicate cannot be created until a stale
`Expanse` backup is deleted in admin. The agreed substitute is the existing development theme
**161963933909**, which does not count against the cap: push to it, then verify on the real domain
with `?preview_theme_id=161963933909`.

---

## Steps 2 and 3 — admin state as measured 2026-08-30

**Step 2 (footer menu) — already done, except one row.** The live footer already links all four
`/pages/` twins:

| Label | href on live | Status |
|---|---|---|
| Shipping policy | `/pages/shipping-policy` | done |
| Returns | `/pages/return-policy` | done |
| Privacy policy | `/pages/privacy-policy` | done |
| Terms & conditions | `/pages/terms-of-service` | done |

**Still open:** footer **Company → Wholesale → `/pages/contact`**. The footer has no `Wholesale`
row at all (`/pages/contact` is present, labelled *Contact*).

**Step 2b (policy page titles) — done by the client, not re-run**, per the packet's §0.

**Step 3 (two theme-editor settings) — both still open.** Not hand-edited: `templates/page.policy.json`
takes editor write-backs, and the packet forbids touching it in the repo.

1. **The Returns cross-link still says 30 days.** `templates/page.policy.json:22` reads
   *"30 days, unopened products, no drama — here's how it works."* Confirmed rendering live on
   **three** pages (`/pages/shipping-policy`, `/pages/privacy-policy`, `/pages/terms-of-service`),
   while the body of `/pages/return-policy` says *"You may request a return within 14 days of
   delivery."* This is a live customer-facing contradiction and is the highest-value item left.
   Change to: *"14 days, unopened products, no drama — here's how it works."*
2. **The shared intro.** `templates/page.policy.json:7` currently reads *"The plain-English version
   of how we ship, what happens if something isn't right, and how we look after your information."*
   Worth noting the string already names all three topics, so the packet's suggested rewrite only
   removes the "how we ship" lead. Low value; left to the client's judgement.

---

## Item 6 — after deploy

Request re-indexing of the four `/policies/` URLs in Search Console, then watch the duplicates drop
over subsequent crawls. Not same-day. Note one thing found during review that shapes the
expectation: **no `/policies/` URL appears in Shopify's sitemap** — `sitemap_pages_1.xml` lists the
eight `/pages/` URLs and no policy documents — so these URLs are discovered by crawl, not by
submission, and will re-crawl on Google's own schedule.

---

## Open items

- [ ] Re-authenticate the Shopify CLI (interactive; blocks everything below)
- [ ] Push the branch to dev theme 161963933909 and run the rendered sweep (items 2–5b on real pages)
- [ ] Capture post-push `<head>` for `/policies/shipping-policy` and `/`
- [ ] Merge to `master` and push in a quiet hour — **explicitly not done; `master` is production**
- [ ] Admin: footer Company → Wholesale → `/pages/contact`
- [ ] Admin: policy section Returns cross-link 30 days → 14 days
- [ ] Admin: decide on the shared policy intro string
- [ ] Search Console re-index request for the four `/policies/` URLs
