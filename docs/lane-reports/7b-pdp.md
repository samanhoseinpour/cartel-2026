# Lane 7B — Product page (PDP) · REPORT

Branch `lane/7b-pdp`, built 2026-08-02. Theme check: 0 errors in lane files (repo's 192
pre-existing locale `MatchingTranslations` errors are stock Dawn, untouched).

## ⚠️ Preview push BLOCKED — store is at Shopify's 20-theme cap

`shopify theme push --unpublished -t "Cartel 7B"` fails with **"A shop may only have 20
themes"**. The store is full of old Expanse copies/backups (see `shopify theme list`) and
deleting themes is outside this lane's authority. **Everything was verified on the machine's
development theme instead** (`shopify theme dev`, theme #160961003733 — never touches live,
all lane files confirmed byte-identical after sync). Once you delete one old Expanse backup,
run from `../cartel-7b`:

```
shopify theme push --unpublished -t "Cartel 7B" --store cartel-lash-supply-co.myshopify.com
shopify theme dev -t "Cartel 7B" --store cartel-lash-supply-co.myshopify.com
```

## What was built

- **`sections/main-product.liquid`** — Cartel PDP inside Dawn's block system: shared
  breadcrumbs → `.phero` grid (gallery | `.pinfo`). Buy box order: vendor kicker (links to
  `/collections/all?filter.p.vendor=…`), `h1.p-title`, rating row (only when review data
  exists — see metafields), price row, variant picker, `.p-buy` row (qty stepper + add-to-bag,
  volume pricing re-emitted full-width under it), stock line (`.p-stock`/`.stockdot`, low-stock
  aware, syncs on variant change via Dawn's `#Inventory-…` contract), pickup card, perks,
  `<details>` accordions (single-open via `details[name]`). Rich sections (`.pfeat`, `.cmp`
  before/after) render only when their metafields exist. Sticky mobile buy bar markup at the
  end (gated → login link, price-on-request → enquire link, else proxy submit button via
  `form=` attribute). Schema untouched.
- **`snippets/product-media-gallery.liquid`** — `<media-gallery class="gallery [gallery--rail]">`,
  viewer = `.gal-main`, thumbnails = `.gal-rail`; `.gal-tag` badge (Save $X / Best seller / New;
  Save suppressed for gated guests so no price info leaks). All Dawn slider/modal/zoom wiring
  kept (`product-thumbnail.liquid` / `product-media.liquid` unchanged).
- **`snippets/product-variant-picker.liquid`** — fieldsets became `.vgroup` with `.vgroup-h`
  legends; pills wrapped in `.vpills`, swatch options in `.shaderow` (native `swatch.color`/
  `swatch.image` values via Dawn's swatch snippets, restyled to 30px `.shadesw` circles;
  selected value shows beside the option name). `<variant-selects>` + URL updates untouched.
- **`snippets/price.liquid`** — new opt-in `cartel_pdp` path (`.p-price` / `.p-compare` /
  `.p-save` / unit price; `price == 0` → "Price on request" + "Enquire about pricing" link,
  never $0.00). Default Dawn markup untouched for every other caller. Thuya gate first, as
  before.
- **`snippets/buy-buttons.liquid`** — gate branch preserved verbatim; new `price == 0` →
  enquire-link branch (no add-to-cart); new `pickup_only` param so the PDP places
  `<pickup-availability>` after the perks; submit label hardcoded "Add to bag"
  (+ `window.variantStrings.addToCart` override in cartel-pdp.js so variant changes keep it).
- **`sections/related-products.liquid`** — `.rec-grid` of `{% render 'cartel-card' %}` with
  kick "Complete the kit" + heading "You may also like", still inside Dawn's
  `<product-recommendations>` fetch contract (endpoint render verified: 4 cards, Save badges).
- **`templates/product.json`** — blocks: vendor, title, rating, price, variant_picker
  (pills + circle swatches), quantity_selector, buy_buttons, inventory; settings:
  `thumbnail_slider` gallery, mobile thumbs shown, lightbox zoom, contain fit.
- **`assets/cartel-pdp.css`** — the 1:1 ported block untouched + appendix bridging Dawn's DOM
  (gallery, quantity, submit/payment buttons, swatches, pickup, volume list, sticky bar,
  `.rec-grid`, `.vpills`) + a dated install-fix block (see gotchas).
- **`assets/cartel-pdp.js`** — before/after `.cmp` slider (range input + mouse scrub) and the
  sticky mobile add-to-bag (IntersectionObserver: shows after the buy row scrolls above the
  viewport, hides while the footer is visible; MutationObserver mirrors the real button's
  disabled state/label, so "Sold out" propagates).
- Untouched on purpose: `snippets/quantity-input.liquid` + `snippets/unit-price.liquid`
  (cart-drawer look belongs to lane 7C), `product-thumbnail/product-media`,
  `sections/featured-product.liquid` (shares the snippets; all changes are opt-in or
  gate/zero-price branches it should have anyway — verified it still renders Dawn-style).

## Metafield definitions the client must create (namespace `custom`)

| key | type | drives | notes |
|---|---|---|---|
| `benefits` | `list.single_line_text_field` | "Key benefits" accordion | one bullet per item |
| `ingredients` | `multi_line_text_field` | Ingredients/Materials accordion | line breaks kept |
| `ingredients_label` | `single_line_text_field` | accordion label | set to `Materials` to switch; blank = "Ingredients" |
| `how_to_use` | `multi_line_text_field` | "How to use" accordion | **one step per line** → numbered-style list |
| `features` | `list.single_line_text_field` | `.pfeat` "why pros choose" band | per item: `Bold lead. Supporting copy` — text before the first ". " is bolded |
| `features_title` | `single_line_text_field` | band heading | blank = "The {vendor} standard." |
| `feature_image` | `file_reference` | band image | blank = text-only band |
| `before_image` | `file_reference` | `.cmp` comparison | band renders only when **both** images set |
| `after_image` | `file_reference` | `.cmp` comparison | |
| `compare_title` | `single_line_text_field` | comparison heading | blank = "Before & after." |

Already on the store: `reviews.rating` + `reviews.rating_count` exist as **plain numbers**
(not Shopify's structured rating type — Max2Originale has 5/2). The rating block now supports
both shapes; a future review app that writes the structured type will just work.

## Skipped / decisions (per prompt's honesty rules)

- **Wishlist `.p-wishbtn`: left out.** No wishlist app exists; a heart that links to the
  account page isn't honest wishlist behaviour. Revisit when an app is chosen.
- **Reviews section (`.revwrap`/`.rev-sum`): left out.** No review app → no review content or
  star distribution to render; faking bars/quotes is exactly what the prompt forbids. The
  rating row in the buy box is wired to the `reviews.*` metafields that do exist.
- **Specifications accordion** from the mock: not in the prompt's accordion list, no metafield
  source — skipped.
- **Share block** removed from the template JSON (not in the design; block type still in the
  schema if ever wanted).
- **"Buy it now"**: Shopify now renders `<shopify-accelerated-checkout>` (branded wallet,
  e.g. Shop Pay) instead of Dawn's old unbranded button. The bronze `.btn-bronze` styling
  applies to the unbranded fallback; the branded button only inherits the pill radius. The
  pre-hydration skeleton shows as a small dash in scriptless snapshots only.
- **Sticky bar login/enquire states** are server-rendered (they can't change client-side);
  the add state mirrors the live submit button.

## Verification done (dev theme, 1440 + 500w headless harness)

- Non-Thuya PDP: gallery (rail + main, hover zoom, badge), buy box, pills incl. sold-out
  strikethrough, qty stepper, wine Add-to-bag, stock line ("Low stock" threshold fired
  correctly on real inventory), perks, accordions (only populated ones render — kit page shows
  Description + Shipping only), related-products endpoint markup. 0 Liquid errors.
- Thuya gate simulated by temporarily inverting the vendor condition in the four lane files
  (then restored, `grep`-verified 4/0): **no price, no qty, no add-to-bag, no volume — only
  gate label + login button + register note; sticky bar shows the login CTA.** The real
  condition is byte-identical to batch 4.1's.
- Mobile (500w — headless Chrome on this Mac clamps below ~500): single-slide swipe viewer,
  thumb row with active ring, sticky bar renders + mirrors "Sold out".
- `price == 0`: no zero-price product exists in the store to render; the code path mirrors the
  frozen cartel-card logic exactly (spot-check after the catalogue import).
- Variant-change re-rendering relies on Dawn contracts that were preserved element-for-element
  (`#price-…`, `#Inventory-…`, `#Volume-…`, `#Quantity-Form-…`, `media-gallery ul` +
  `li[data-media-id]`, `ProductSubmitButton-…`); pill switching worked in the harness.

## Gotchas for other lanes (all fixed here, documented in the CSS install-fix block)

1. Dawn's `section-main-product.css` line ~990 (`.product__media-wrapper .slider-mobile-gutter
   .slider-button`) and `.thumbnail-list.slider--tablet-up .thumbnail-list__item.slider__slide`
   are (0,3,0)/(0,4,0) — the usual `.cl .x .y` bump is NOT enough on PDP gallery internals.
2. `.grid--peek` slides carry `max-width:calc(50% - …)` — override `max-width`, not just
   `width`, or mobile sliders render 2-up.
3. Dawn `.thumbnail` buttons paint a full item-height below their `<li>` (clipped to nothing by
   `overflow:hidden`) — position them absolute inside the item.
4. **`.button--secondary` sets `--alpha-button-background:0`** — overriding `--color-button`
   alone gives a transparent button; set literal `background`/`color`.
5. Grid item + percentage `min-height` painted unreliably (headless at least) — the thumb rail
   is absolute inside the sticky gallery box, flagged by a Liquid-set `gallery--rail` class.

## Outstanding / for the user

- Free a theme slot (delete one old Expanse backup in admin), then push "Cartel 7B" (commands
  above).
- The login CTAs point at `routes.account_login_url`, which currently 302s to the **new
  customer accounts** hosted page (lane 7D's discovery). Login still works and gating works
  after sign-in; only classic `/account/*` templates need the store setting change.
- No requests into other lanes' files. Cart drawer styling after add-to-cart = lane 7C.
- The shared dev theme (#160961003733) currently holds lane 7B's state; any lane's next
  `theme dev` run re-syncs it to their own worktree.
