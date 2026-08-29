# Batch 16 — the Brands page gets its six cards (+ one dead 404 chip) · REPORT

Installed 2026-08-29 on top of `763ed01`, as two commits: `4f13b64` (step 1) and `b2405cc`
(step 2). Nothing published, `config/settings_data.json` untouched, draft theme `160769933525`
only. Delivery was `git push origin master` — the reflog shows `master -> origin/master`, no
force, no other branch touched, and no `shopify theme push` of any kind was run.
`shopify theme check`: **201 offenses before, 201 after**, identical profile, 0 on either file.

**Two files, as the packet listed** — `templates/list-collections.json` and `templates/404.json`.
One thing the packet did not list: six client write-back commits had to be merged first (below).

> **Read the "What could not be verified" section before trusting the Rule #0 result.** The
> packet's mandated `shopify theme pull` could not run at all in this environment, and one of
> the two files is consequently *not* proven drift-free.

## Rule #0 — the mandated check could not run; here is what replaced it, per file

`shopify theme pull` **failed**: `accounts.shopify.com` and `cartel-lash-supply-co.myshopify.com`
both resolve to `10.10.34.36` from this machine, so the Admin API is unreachable
(`connect ECONNREFUSED 10.10.34.36:443`). That is a network condition here, not a store problem —
`cartellash.ca` (23.227.38.32) is reachable, and so is GitHub. **No `theme pull` ran before or
after the push.** Everything below is a substitute, and the two files came out differently.

**Git side, both files — clean.** No write-back commit has ever touched either. The blobs are
the *same git objects* at `3b93108` and at `763ed01` (`list-collections.json` → `73c82bb`,
`404.json` → `caa298c`), and the last human commits to touch them are `c5eac82` (lane 7A) and
`748e535` (lane 7D). Local and origin were in sync at the moment of editing.

That proves the **git** side is consistent. It does **not** by itself prove the draft theme's
copy matched, because the packet itself (line 25) says this integration "has silently dropped
updates three times" — so the absence of a write-back commit cannot prove the absence of a
theme-editor edit.

**`templates/list-collections.json` — proven undrifted on the theme.** Independent live evidence:
the `/collections` render captured from theme `160769933525` before the sync delivered the
commits shows the `{%- else -%}` fallback branch — 24 collection cards, one `class="pgn"`, and
the *exact* master `eyebrow` / `title` / `intro` strings. That is precisely and only what a
zero-block, undrifted template produces. Michelle had not touched it.

**`templates/404.json` — NOT proven, and no longer provable.** There is no pre-push capture of
the draft theme's 404 page; the only render on file was taken after the push, so it necessarily
shows our values whether or not the push overwrote a theme-editor edit. The residual risk is low
(the blob never moved in git, and no write-back has touched it since lane 7D) but it is not zero,
and this is exactly the silent-overwrite case Rule #0 was written to prevent. If Michelle had
edited the 404 chips in the editor and that write-back was one of the dropped ones, it is gone
and leaves no trace. **Flagging rather than burying it: ask her whether she ever customised the
404 chips.**

**Post-push re-check** was likewise done by rendering rather than diffing. It does cover the
substance for these two files — the six cards and the `/collections/brow` chip both render on
`160769933525`, so the deploy demonstrably landed and nothing was silently dropped this time.

## The six write-back commits — client work, merged not clobbered

`origin/master` was six commits ahead of local when I started, all dated 2026-08-28, all
Michelle's theme-editor work:

| Commit | File | What she changed |
|---|---|---|
| `ff3aef9` `a1e58e1` `55befae` `74edd2b` | `templates/index.json` | before/after images on all four homepage pairs (`KLL_Before.avif` … `10.avif`), and relabelled `Lash & brow tint` → **`Lash Lift & Tint`** |
| `4d3a008` | `sections/footer-group.json` | footer email `kireilashco@gmail.com` → **`info@cartellash.ca`** (the previous owner's address was still live) |
| `763ed01` | `templates/page.contact.json` | filled in the whole contact section: eyebrow, heading, lead, contact email/phone, form labels, error/success copy, help block |

I fast-forwarded onto them (`git merge --ff-only`) before editing, so my two commits sit on top.
Verified intact afterwards: `git diff 763ed01 HEAD` touches only the two template files;
`index.json`, `footer-group.json` and `page.contact.json` are byte-identical between `763ed01`
and `HEAD`; `footer-group.json` at HEAD has one `info@cartellash.ca` and zero
`kireilashco@gmail.com`; `763ed01` is an ancestor of `b2405cc`, so nothing was force-pushed.

Had this batch pushed without fetching first, **all of that work would have been reverted.**

## Step 1 · the Brands page

`templates/list-collections.json` had section settings but zero blocks, so
`sections/main-list-collections.liquid:20` fell through to the `{%- else -%}` branch that
paginates **every collection on the store** — 24 cards led by ACCESSORIES, Adhesives and
AFTERCARE, plus one pagination nav. After: **exactly six cards, no pagination nav.**

All six blocks were validated field-for-field against the section's `{% schema %}` before commit —
every id exists, all six accents are legal option values used exactly once, `block_order` covers
exactly the block set, the three section settings are unchanged, and no `image` key was added.
The committed file is byte-identical to the packet's JSON block.

## Step 2 · the 404 chip

One line, as specified. The `Brows` label, block key and `block_order` are unchanged, the
collection was not renamed, and the auto-generated header comment survived.

**The packet's premise was wrong in both halves, and the truth is more interesting.**
`/collections/brows` did not 404 — it returns **301 → `/collections/brow-lamination`**. It is
absent from the sitemap because it is a *store-level URL redirect*, not a collection. So the chip
labelled "Brows" was silently landing people on Brow Lamination (11 products) instead of Brows
(25 products). Quieter than a 404 and arguably worse. **The chip was mis-targeted, not dead**, and
the fix relocates it rather than repairing a broken link.

The handle question is settled from the live sitemap: `brow` **exists**, `brows` **does not**. The
collection is *titled* "Brows" but *handled* `brow`, which is how the mismatch got written. Also:
`lash-lift` **does** exist now, so the batch 12 audit's "7 handles 404 today" line is stale for it.

## Verification — measured logged out on draft theme `160769933525`

| # | Check | Result |
|---|---|---|
| 1 | Six cards, in order Thuya · Bronsun · Noemi · Cartel · Linger Beauty · Prolong | **PASS** — 6 `bx-item`, exact order |
| 2 | No Accessories/Adhesives/Aftercare **card**, no pagination | **PASS** — 0 `class="pgn"` (was 1) |
| 3 | Counts from `c.all_products_count` | **2 of 6 differ** — see below |
| 4 | Every `Shop <name>` link resolves | **PASS** — all six HTTP **200**, empty `redirect_url` |
| 5 | Linger Beauty and Prolong show "Photos coming soon" | **FAILS AS WRITTEN** — see below |
| 6 | 404 chip → `/collections/brow` resolves | **PASS** — chip renders, target returns 200 |
| 7 | `theme check` before/after | **PASS** — 201 → 201, identical profile |

Wording note on item 2: the *words* Aftercare and adhesives do appear inside the Prolong card's
badge/eyebrow/specs and the Linger Beauty blurb. There is no Accessories, Adhesives or Aftercare
**card**, which is what the packet asked.

Caveat on item 7, so it is not read as more than it is: `theme check` has no check that validates
a template JSON's block `type` or setting ids against the section schema. For a batch that changed
only two template JSONs, 201 → 201 is a clean **no-regression** signal, not coverage of the change.
The field-for-field schema validation above is what actually covers it.

### 3 · product counts

Rendered `all_products_count` cross-checked against each collection's storefront `products.json`.
They agree exactly for all six.

| Brand | Packet expected | Card renders | Feed | Verdict |
|---|---|---|---|---|
| Thuya | 34 | **34** | 34 | matches |
| Bronsun | 10 | **10** | 10 | matches |
| Noemi | 7 | **7** | 7 | matches |
| Cartel | 6 | **5** | 5 | differs — see below |
| Linger Beauty | 6 | **6** | 6 | matches |
| Prolong | 2 | **1** | 1 | differs — see below |

The two that differ land exactly on the packet's own stated post-cleanup numbers. The packet said
Cartel reads 6 "until Michelle archives Sawako Type, then 5", and Prolong reads 2 "until the
old-owner duplicate is archived" — and the storefront now shows 5 and 1.

**What is measured:** neither *Sawako Type* nor a second Prolong product appears anywhere on the
storefront (checked against `/collections/all/products.json`, 72 published products, as well as the
two collection feeds). Cartel's five are Precision Lash Lift Comb Tool, Rainbow Hybrid Shields,
Flat Jelly Lifting Pad, Crown Jewel Lash Lift Shields, Pink Pearl Lash Lift Shields. Prolong's one
is Prolong Lash Cleanser Concentrate.

**What is not measured:** *why*. `all_products_count` and `products.json` see only products
published to the Online Store, so archived is indistinguishable from unpublished, deleted, or
merely removed from the collection. The packet says a differing count means "a product/collection
assignment problem, not a template problem", so this should be closed in admin rather than from
the storefront. **Presumed the anticipated archiving; needs one admin glance to confirm.**

### 5 · the "Photos coming soon" tile does not render — and should not

**No card renders the placeholder.** `bx-ph` appears zero times in the page (the before-render
contained "Photos coming soon" twice); all six cards emit a real `<img>`, and all six srcs sit
under `/cdn/shop/collections/` — i.e. the collections' **own images**, not the `settings.logo`
fallback, which only renders *inside* `.bx-ph`.

Both collections now have images, and they are brand logos rather than product shots: Linger
Beauty serves `Linger_Logo.jpg`, Prolong serves `Prolong_logo_higgs_b1289a48-….jpg`. The template
is behaving exactly as designed — packet item 5 was simply written against stale collection-image
state. **No change needed.**

Worth knowing for future cards: `card-collection.liquid:18` is `card_image | default: c.featured_image`,
and `c.featured_image` *also* falls back to the first product's image when a collection has no
image of its own. The placeholder tile is therefore rarer than it looks — it needs a collection
with no image **and** no product with an image.

## The theme is confirmed unpublished

From the theme's own `Shopify.theme` object on the previewed page:

```
{"name":"cartel-2026/master","id":160769933525,"schema_name":"Dawn","role":"unpublished"}
```

The published theme is a different one entirely: `{"name":"Expanse","id":132799693013,
"theme_store_id":902,"role":"main"}`, serving `/t/64/`. Fetched live, the public `/collections`
is rendered by Expanse, contains no `bx-grid6` or `bx-card` markup at all, and lists seven
collections — a different codebase from this repo. The GitHub integration writes only to
`160769933525`, and `config/settings_data.json` (the one plausibly shared file) was untouched.

**Pushing to `origin/master` cannot reach the live storefront.** Every batch so far has assumed
this; it is now measured.

## Two side effects to name before someone reports them as bugs

1. **The "Brows" label now resolves to two different collections depending on entry point.** The
   404 chip goes to `/collections/brow` (25 products). The store-level redirect
   `/collections/brows → /collections/brow-lamination` (11 products) is untouched and lives in
   *Online Store → Navigation → URL Redirects* — meaning it is **shared with the published Expanse
   theme**, not ours to change unilaterally. Any legacy external link still lands on
   brow-lamination. Retargeting the chip to the broader collection is the better default, but
   reconciling the redirect is Michelle's call.
2. **`/collections` drops from 24 linked collections to 6.** Eighteen collections lose their
   internal link from the Brands index once the theme is published. Not a defect — the page was
   never meant to be a directory — and all handles remain in the sitemap, so crawlability is
   unaffected.

## What could not be verified

- `shopify theme pull` never ran, before or after the push (Admin API unreachable). Rule #0 and
  the post-push re-check were both satisfied by substitutes, described per file above.
- **`templates/404.json`'s pre-push theme state is unknown and unrecoverable.** See Rule #0.
- The *cause* of the Cartel and Prolong count deltas (archived vs unpublished vs deleted) —
  storefront data cannot distinguish these.
- "No bare push" is asserted from process, not from the repo: git records only "update by push"
  with no refspec, and with `push.default` unset a bare `git push` would have resolved identically.
  What *is* checkable from the reflog: `master -> origin/master` only, no force, no other branch.

## Carry-forward — templates stop being ours at publish

After the theme is published, `templates/*.json` becomes **client data, not code**. Michelle adds
a seventh brand by clicking *Customize → Brands page → Add block → Brand card*, and that writes to
the live template. From that point **no batch may push a template JSON without pulling the live one
first and reconciling.** Sections, snippets and assets stay ours; templates stop being ours.

Three things sharpen this, all observed in this batch:

1. **It has already started.** Six write-back commits landed on 2026-08-28, three of them on
   `templates/*.json`, while the theme is still unpublished. The rule is live now, not at publish.
2. **`theme pull` is not guaranteed available.** It was unreachable for this entire batch. The
   write-back commits on `origin/master` carried most of the same information — `git fetch` and
   read them — but as this batch shows, that substitute cannot prove a negative for a file with no
   live capture. **If `theme pull` fails, capture the rendered page of every file you are about to
   overwrite, before you push.** That one habit would have closed the `404.json` gap.
3. **The Brands page now has six blocks with stable ids** (`thuya`, `bronsun`, `noemi`, `cartel`,
   `linger`, `prolong`). If Michelle reorders them or adds a seventh, `block_order` changes in the
   live template, and a future packet that replaces the whole file will silently discard her
   ordering. Replace-the-whole-file was correct exactly once — this time, while the block list was
   still empty.
