# Lane 7E report — content pages (About · Contact · FAQ · Free Resources · Policies)

Branch `lane/7e-pages`. All five page templates + the default page template are built,
theme-checked (0 offenses in lane files), and verified with rendered-markup harnesses at
1440px and 500px plus 27 automated interaction tests (FAQ search/rail, resource chips,
policy TOC, compare slider, topic chips). Not merged to master.

## 1. Pages the client must create (Online Store → Pages)

The store currently has only `about-us` and `contact-us` (old Expanse pages, no template
suffix). Create these pages and assign the template in the page's **Theme template** picker:

| Page title           | Suggested handle     | Theme template   | Content                                         |
| -------------------- | -------------------- | ---------------- | ----------------------------------------------- |
| About                | `about`              | `page.about`     | none needed — all copy lives in section settings |
| Contact              | `contact`            | `page.contact`   | none needed                                     |
| FAQ                  | `faq`                | `page.faq`       | none needed — 15 starter Q&As ship in the template |
| Free Resources       | `free-resources`     | `page.resources` | none needed — 6 starter cards ship (file links to add, see §5) |
| Shipping policy      | `shipping-policy`    | `page.policy`    | **paste policy copy as page content** (h2 per section) |
| Returns & exchanges  | `return-policy`      | `page.policy`    | same                                            |
| Privacy policy       | `privacy-policy`     | `page.policy`    | same                                            |
| Terms & conditions   | `terms-of-service`   | `page.policy`    | same                                            |

Internal links in the built sections point at `/pages/faq`, `/pages/contact`,
`/pages/shipping-policy`, `/pages/return-policy`, `/pages/privacy-policy`,
`/pages/terms-of-service` — if you pick different handles, update the URLs in the section
settings (contact help cards, FAQ answers, policy cross-links).

Existing `about-us` / `contact-us`: either re-handle them to `about` / `contact` and assign
the new templates, or create fresh pages and delete the old ones — client's call.

## 2. ⚠ Preview theme "Cartel 7E" could not be created — store at Shopify's 20-theme cap

`shopify theme push --unpublished -t "Cartel 7E"` fails with "A shop may only have 20
themes". The library is full of 2021–22 Expanse copies ("Copy of Expanse", "Expanse -
Mar 24 2022", …) and lane 7D took the last free slot (`Cartel 7D`). I am not allowed to
delete themes. **Once you delete one stale backup**, run from this worktree:

```sh
cd ~/Desktop/cartel-7e
shopify theme push --unpublished -t "Cartel 7E"   # first time (creates the theme)
shopify theme dev -t "Cartel 7E"                  # preview + local watcher
```

Then re-check the pushed `.liquid` files actually landed (the GitHub integration has
dropped liquid updates twice before): `shopify theme pull -t "Cartel 7E" --only sections/`
into a scratch dir and diff.

The shared development theme was in use by other lanes' watchers the whole session (7F,
then 7C, holding port 9292 and reverting external pushes), so end-to-end verification ran
on local harnesses instead: real `python-liquid` renders of the actual section files with
the template-JSON settings, real cartel CSS, real `cartel-pages.js`, screenshotted at
1440/500. Screenshots + smoke tests live in the session scratchpad, not the repo.

## 3. Email + phone — placeholders, needs client confirmation

The mock shows `hello@cartellash.ca` and `(604) 555-0142`; the live store uses
`info@cartellash.ca` and the phone is a movie-style placeholder. Both are **section
settings** on the Contact section ("Store contact details", defaults:
`info@cartellash.ca` / `(604) 555-0142`) — nothing is hardcoded. The wholesale help card
currently mails `info@cartellash.ca` (the mock's `wholesale@cartellash.ca` doesn't exist as
far as we know). **Ask the client for the real email + phone**, then update: Contact
section settings, the wholesale card URL, and (footer lane) the footer contact rows.

## 4. Policy pages — Shopify legal policies can't take a theme template

Checkout links to `/policies/refund-policy` etc. (Settings → Policies), and those Shopify-
rendered pages cannot use theme templates. So the four designed policy pages are normal
pages under `/pages/…` (see §1) and **the client must keep the same text in Settings →
Policies** so checkout shows identical terms. The footer should link to the designed
`/pages/…` versions (footer is owned by the shell, links come from admin navigation).

One `page.policy` template serves all four pages, so **section settings and blocks are
shared across them**: the rail links + "More policies" cards (each page auto-hides its own
card), help card, CTA band and "Last updated" are shared — that's fine. Per-page policy
copy must come from **page content** (paste with an `h2` per section; the theme numbers
them and builds the "On this page" TOC automatically). The dark "short version" chips and
"Policy section" blocks exist as block types but are also shared — leave them empty unless
a line is true for *all four* policies. If per-policy chips are wanted later, a future
batch needs one template suffix per policy page (requires a `theme.liquid` edit — 7.0-prep
owner, not this lane).

An optional "Policies" menu (admin → Navigation) with the four pages can be assigned to the
section's "Policies menu" setting; without it the rail builds itself from the cross-link
blocks (already configured).

## 5. Resource files

Resource-card download buttons render only once a "File link" is set (no dead buttons).
Upload each PDF under **Content → Files**, copy its link into the card block's "File link"
(same for the featured playbook's "File link"). Cards/featured ship with realistic
placeholder copy (rod chart, adhesive guide, consult form, aftercare cards, mapping video,
tint chart) — replace freely; category names drive the filter chips automatically.

## 6. Deviations from the lane prompt (mock is the authority)

- The prompt's About list (`.ab-band` stats / `.ab-tlcard` timeline / `.ab-team`) describes
  an older design iteration. `About.dc.html` + the ported CSS actually contain: story
  split, values grid, before/after compare, brand marquee, pick-up locations, Instagram
  strip, closing CTA — that's what `cartel-story` implements (each band = a block, so the
  client can reorder/remove).
- `cartel-page-hero` is used by About and FAQ (and works for plain pages). Contact,
  Resources and Policies keep their headers inside their own sections because the mocks
  fuse them into two-column grids with functional content (form card / featured download /
  rail layout) — separate stacked sections can't reproduce those grids.
- Breadcrumbs use the shared `cartel-breadcrumbs` snippet (Home / page title). The mocks
  show deeper trails on FAQ (Home / About / FAQ) and Policies (Home / Policies / title);
  the snippet is single-owner and auto-mode, so trails stay two-level — flagging, not fixing.
- Images can't ship in JSON templates (image_picker has no defaults) — hero/story/compare/
  locations/IG tiles/resource covers all need editor uploads; empty frames render the
  greige placeholder background meanwhile.

## 7. Files touched / owned — nothing outside the lane's list

Sections: `cartel-page-hero` · `cartel-story` · `cartel-contact-cards` · `cartel-faq-list`
· `cartel-resource-grid` · `cartel-policy-body` · `main-page` (Cartel rewrite) ·
`contact-form` (Cartel rewrite, real `{% form 'contact' %}` with `contact[email]` +
`contact[body]`, success + in-card error states).
Templates: `page.json` + the five suffixed templates. Assets: the six `cartel-page-*.css`
(five ported files installed over the placeholders + lane additions appended; `-default`
authored fresh) + `cartel-pages.js`.
No changes needed in files I don't own; no requests for other lanes beyond the §3 footer
contact-row update and the §4 footer policy links (both admin/nav-side anyway).
`theme-7e-pages/` (design packet) stays untracked, same as the 7.0-prep packet.
