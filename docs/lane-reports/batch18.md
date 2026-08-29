# Batch 18 — the preset stops promising pro pricing, and brand lockups stop being cropped · REPORT

Installed 2026-08-29 on top of `c5b3206`, as two commits: `b0a03b4` (step 1) and `4479a5b`
(steps 2–4). Nothing published, `config/settings_data.json` untouched, draft theme
`160769933525` only. Delivery was `git push origin master` — `c5b3206..4479a5b`, no force, no
other branch, and no `shopify theme push` of any kind.
`shopify theme check`: **201 offenses before, 201 after**, check-for-check identical, 0 on any of
the four edited files.

**Four files, five steps, seven edit sites — exactly as the packet listed.** Every anchor was
found by FIND text at a count asserted to be exactly 1; no line numbers were trusted. As it
happened none had drifted.

> **The packet's step-5 list is incomplete, and §5 corrects it.** It names "at least Linger Beauty
> and Prolong". In fact **all six** brand collections carry logo lockups, and the two the packet
> names are not the worst cases. The packet anticipated this ("Michelle may have uploaded more
> images since") and asked for the recount; this is it.

## 1 · Rule #0 — `theme pull` WORKS from this environment

Probed, not assumed. The Admin API is healthy this run:

```
accounts.shopify.com   -> 23.227.39.20      (not the 10.10.34.36 blackhole of batch 16)
cartellash.ca          -> 23.227.38.32
shopify theme list     -> authenticated, full theme table returned
shopify theme pull     -> exit 0, "The theme 'cartel-2026/master' (#160769933525) has been pulled."
```

Confirmed live from the theme table: `cartel-2026/master` **#160769933525 [unpublished]** is the
GitHub-connected draft, and **Expanse #132799693013** is still `[live]`. Pushing `origin/master`
reaches the draft and cannot reach the storefront.

`theme pull` overwrites the working tree, which would destroy local state before drift could be
reported. **Pulled into a scratch directory and diffed instead**, so nothing was ever at risk.

### 1a · Drift — eight template JSONs differ on disk, none differ in content

A raw byte comparison flags eight files. All eight are **serializer noise only**:

| File | raw delta | after stripping Shopify's JSONC banner |
|---|---|---|
| `templates/collection.brand.json` | +363 b | identical |
| `templates/collection.json` | +363 b | identical |
| `templates/list-collections.json` | +363 b | identical |
| `templates/page.about.json` | +679 b | identical |
| `templates/page.faq.json` | +525 b | identical |
| `templates/page.json` | +363 b | identical |
| `templates/page.policy.json` | +363 b | identical |
| `templates/page.resources.json` | +449 b | identical |

The theme copies carry the auto-generated `/* … may be updated by the Shopify admin theme
editor … */` banner (363 bytes) that git does not; the three larger deltas add whitespace on top
of it. Comparing parsed structures — banner stripped, `json.loads` on both sides — every one is
**equal leaf-for-leaf**. Byte-size arithmetic alone would have called three of these real drift;
it is not.

`git fetch origin` → 0 ahead / 0 behind. **No client write-back was pending.** In particular
`templates/list-collections.json` carries **no `image_fit` key on any of its six blocks**, so the
push could not clobber editor work and every card keeps today's behaviour.

## 2 · Files touched

| File | Step | Change |
|---|---|---|
| `sections/cartel-contact-cards.liquid` | 1 | preset `help` block copy |
| `sections/main-list-collections.liquid` | 2a, 2b | pass `card_fit:`, add the `image_fit` select |
| `snippets/card-collection.liquid` | 3a, 3b, 3c | document the arg, derive `fit_class`, apply it |
| `assets/cartel-brands.css` | 4 | `.is-logo` treatment + 600px padding override |

`4 files changed, 26 insertions(+), 4 deletions(-)`. The block-level schema defaults above the
preset (the `how` line, the `note` textarea) were not touched.

The step-1 replacement is **byte-identical** to `templates/page.contact.json:121`, asserted
programmatically rather than by eye:

```
preset : Stocking Cartel in your studio, salon or academy? Tell us about your business and we'll take it from there.
live   : Stocking Cartel in your studio, salon or academy? Tell us about your business and we'll take it from there.
IDENTICAL
```

### 2a · Why the other three `card-collection` callers are safe

`card-collection.liquid` has three callers besides the one edited — the paginated branch of the
same section (`main-list-collections.liquid:46`), `collage.liquid:118`, and
`collection-list.liquid:87`. None passes `card_fit`. `{% render %}` is an isolated scope, so
`card_fit` is nil in all three, `fit_class` stays `''`, and their markup is unchanged. Confirmed
by `theme check`: `UndefinedObject` held at 3, gaining nothing.

## 3 · `shopify theme check` — 201 before, 201 after

Compared check-for-check, not just on the total, per the packet:

| check | before | after | delta |
|---|---|---|---|
| MatchingTranslations | 192 | 192 | +0 |
| RemoteAsset | 3 | 3 | +0 |
| UndefinedObject | 3 | 3 | +0 |
| OrphanedSnippet | 2 | 2 | +0 |
| UnusedAssign | 1 | 1 | +0 |
| **TOTAL** | **201** | **201** | **+0** |

Offenses located in the four touched files: **0 before, 0 after.**

## 4 · Pre- and post-push renders of the draft

Both captured from draft `160769933525` over `cartellash.ca` with a browser User-Agent and a
preview cookie jar (bare curl gets a Cloudflare 403). **Proof of theme**, which batch 16 could not
produce: the rendered HTML echoes `themeId":"160769933525"`, and the synced asset resolves under
`/cdn/shop/t/71/`.

| | pre-push sha256 | post-push sha256 | bytes |
|---|---|---|---|
| `/collections` | `681234ce05188e9c9b24` | `6cc264a20e0b8a5649e0` | 160625 → 160625 |
| `/pages/contact` | `7071168444fc3789c548` | `e1785af0d27241923f68` | 162580 → 162580 |

The shas differ; the pages do not. Normalising the volatile per-request fields, the **only**
difference on either page is Shopify's analytics token `__st.u`:

```
< var __st={... "u":"b7892baf3e62", "p":"collections"};
> var __st={... "u":"0da129712ce2", "p":"collections"};
```

Everything else is byte-identical. GitHub sync landed the push on the draft in **~10 s**.

Assertions held on both sides of the push:

- `/collections` — 6 `bx-imgwrap` tiles, **0** carrying `is-logo` (no block opted in yet). Step 4 ✅
- `/pages/contact` — the words "pro pricing" appear **0 times**; the Wholesale & trade card is
  unchanged, still showing batch 17's live sentence. Step 2 ✅

## 5 · Step 5 — which cards are cropped · **all six, not two**

Measured on the rendered page, tile **383 × 208** (3-col grid, 22 px gaps), ratio 1.84:

| Collection | Source image | Format | Lost to `object-fit:cover` | Symptom |
|---|---|---|---|---|
| bronsun | `Bronsun_logo.jpg` 900×900 | JPG, opaque white | **46 %** top+bottom | white slab hides the bronze accent |
| cartel | `Cartel_Logo_white_BG.jpg` 900×900 | JPG, opaque white | **46 %** top+bottom | white slab hides the wine accent |
| linger-beauty | `Linger_Logo.jpg` 900×900 | JPG, opaque white | **46 %** top+bottom | white slab hides the taupe accent |
| prolong | `Prolong_logo_higgs_*.jpg` 900×900 | JPG, opaque white | **46 %** top+bottom | white slab hides the sage accent |
| noemi | `Logo_NOEMI_png_1.png` 900×410 | PNG, RGBA | 16 % left+right | wordmark clipped both sides |
| thuya | `Logo_thuya_black.png` 900×510 | PNG, RGBA | 4 % top+bottom | mild crop; "PROFESSIONAL LINE" clipped |

**Every one is a lockup, not a product photo** — the filenames say so and the images confirm it.
So all six want **Image treatment → Logo**.

Two corrections to how the defect was described. First, the 46 % figure is *canvas* lost, not
wordmark lost: on the square JPGs the mark sits in the middle band and survives the crop, so the
visible symptom is the white rectangle blanking the accent gradient, not a chopped logo. Second,
the card where the lockup itself is genuinely clipped is **NOEMI** — neither of the two the packet
names. The PNG alpha was checked (`colortype=6, RGBA` on both PNGs), confirming the packet's
reasoning that `multiply` is a no-op for them and only drops the white box on the four JPGs.

`templates/list-collections.json` was **not** hand-edited, per the packet's instruction.

## 6 · Verification

| # | Check | Result |
|---|---|---|
| 1 | `theme check` count unchanged | ✅ 201 → 201, check-for-check |
| 2 | `/pages/contact` unchanged, "pro pricing" nowhere | ✅ 0 occurrences, card unchanged |
| 3 | Fresh **Cartel contact cards** section carries the new sentence | ⏸ **needs the theme editor** |
| 4 | `/collections` — all six cards unchanged | ✅ 6 tiles, 0 `is-logo` |
| 5 | One card set to **Logo** renders whole, accent visible | ✅ **proven locally** (below) |
| 6 | Mobile 390 px — logo cards fit with reduced padding | ✅ measured |

Steps 3 and the real-card half of 5 need Shopify admin UI and are **not done** — see §7.

### 6a · How step 5 was proven without the editor

`templates/list-collections.json` was temporarily given `"image_fit": "logo"` on the
`linger-beauty` block **in the working tree only**, after both real commits were already sealed,
served through `shopify theme dev`, then reverted with `git checkout --`. The file is untouched in
git and carries 0 `image_fit` keys.

DOM: `is-logo` appeared on exactly one tile, total occurrences 1; the other five kept bare
`bx-imgwrap`. Computed style, at both widths:

```
viewport 1440   bx-imgwrap          tile=[383,208] img=[383,208] fit=cover    blend=normal   pad=0px
                bx-imgwrap is-logo  tile=[383,208] img=[383,208] fit=contain  blend=multiply pad=30px 26px
viewport  390   bx-imgwrap          tile=[348,208] img=[348,208] fit=cover    blend=normal   pad=0px
                bx-imgwrap is-logo  tile=[348,208] img=[348,208] fit=contain  blend=multiply pad=22px 20px
```

The img box equals the tile box exactly at both widths — **zero overflow** — so `border-box` makes
the padding shrink the content box rather than spill it. The 600 px media query fires (30/26 →
22/20). Step 6 ✅

Screenshots (headless Chrome via CDP, session-local) show the Linger tile rendering the wordmark
whole with the **taupe accent gradient visible through it** — the white JPG box drops out — while
the five untouched cards show the defects tabulated in §5.

**A risk raised at design time is now closed, negative.** `mix-blend-mode` blends against the
nearest ancestor stacking context, so if `.bx-card` or any ancestor established one the white
would have dropped against the wrong layer. It does not: the blend resolves against
`.bx-imgwrap`'s own gradient, confirmed visually at 1440 and 390.

## 7 · Left for admin — the theme-editor steps

1. **Customize → Brands page** on draft `160769933525`: set **Image treatment → Logo** on all six
   cards (§5). Do not hand-edit `templates/list-collections.json`.
2. Add a scratch **Cartel contact cards** section to any page, confirm the Wholesale & trade block
   arrives with the new sentence, then delete the scratch section (verification 3).

## 8 · Out of scope — four more "pro pricing" strings

Not touched, flagged for a judgment call before publish:

```
sections/main-login.liquid:70       "Unlock Thuya pro pricing."
sections/main-register.liquid:35    "Unlock Thuya pro pricing."
snippets/cart-drawer.liquid:280     "Log in to reveal pro pricing and check out."
sections/main-cart-items.liquid:400 "Log in or create a free account to reveal pro pricing…"
```

These are arguably fine — they describe a free account unlocking Thuya's pricing, not a trade
tier, which is a different claim from the wholesale card's. They are outside batch 18's stated
scope and were left alone.

## 9 · Housekeeping

`shopify theme dev` provisioned development theme **#161963933909** during verification (the old
`#160961003733` had expired). It is a throwaway and never touched the draft or the live theme, but
it occupies a slot against the store's theme cap and can be deleted from admin.

Bare `theme dev` was used throughout — never `theme dev --theme <id>`, which syncs the real theme
and triggers write-back commits. `git status` confirmed no write-back was produced.

## 10 · Step 5 completed at install time — 2026-08-29

All six Brand card blocks were set to **Image treatment → Logo** in the theme editor on draft
`160769933525`. Shopify wrote the change back as **`4e9f45a`** ("Update from Shopify for theme
cartel-2026/master"), fast-forwarded into `master`:

```
thuya  bronsun  noemi  cartel  linger-beauty  prolong   ->  image_fit: "logo"   (6/6)
```

The write-back also added Shopify's 363-byte JSONC banner to `templates/list-collections.json`,
which is why the file no longer parses with a bare `json.loads` — strip the leading `/* … */`
first (§1a).

**The editor showed the stale schema until the tab was hard-reloaded.** Shopify's editor fetches
each section's schema once at page load, so a tab opened before the sync landed renders the old
settings list and the new **Image treatment** select is simply absent. Verified the schema *was*
live on the theme (`theme pull --only sections/main-list-collections.liquid` → `image_fit` at
line 126) before concluding it was a client-side cache. Cmd+Shift+R fixed it.

Live theme re-checked after the change: **Expanse `#132799693013` is still `[live]`** and a
no-cookie fetch of `cartellash.ca/collections` returns `themeId":"132799693013"` with 0 `is-logo`.
Nothing was published.

### 10a · Two things left open

1. **`4e9f45a` is authored by `shopify[bot]`.** History was rewritten on 2026-08-23 specifically to
   make `saman` the sole contributor; this write-back reintroduces a bot author. Fixing it needs
   another rewrite and a force-push — not done here, flagged for a decision.
2. **The four square-source lockups now render small.** `object-fit:contain` fits the whole 900×900
   canvas — most of which is whitespace — into a 383×208 tile, so Bronsun, Cartel, Linger and
   Prolong scale to roughly a 148 px square while the two wide PNGs (Thuya, Noemi) fill much more
   of their tile. The row reads unevenly. This is a source-image issue, not a CSS one: trimming the
   whitespace margins on those four JPGs and re-uploading would even it out without touching code.
