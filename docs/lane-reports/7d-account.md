# Lane 7D — Account (login / register / dashboard) + 404 + gift card

Branch `lane/7d-account` · preview theme **Cartel 7D `#161160495317`** · built 2026-08-02

## Built

| File | What |
| --- | --- |
| `assets/cartel-account.css` | 1:1 port from `Account.dc.html` installed over the placeholder + appended build block (selects, real checkboxes, error/success states, recover pane, pagination, totals, reset/activate card — tokens only) |
| `sections/main-login.liquid` | `.authgrid` split: wine `.authbrand` benefits panel + `.authform` card. Real-link `.atab` tabs, `customer_login` + `recover_customer_password` contracts, recover pane on Dawn's `#recover` `:target` pattern (plus a server-set `.show-recover` class so a failed recover POST re-opens the pane — Dawn loses it). Errors render in-card (`.form-alert`) and mark inputs. Password eye = class swap on the button, never `hidden` on the svg. |
| `sections/main-register.liquid` | Same shell. Fields per design: full name (split to `customer[first_name]/[last_name]` on the last space at submit; JS-off just submits empty names, which Shopify accepts), email, password, newsletter opt-in `customer[accepts_marketing]`. No credential upload, no approval step. |
| `sections/main-account.liquid` | `.dash-hi` greeting, `.statgrid` from real data only (`orders_count`, `customer.last_order.created_at`, `addresses_count`), `.acctrail` (Orders · Addresses · Account details · Log out), orders list as `.ord` rows with real fulfillment labels, styled empty state with **Start shopping**, default-address + account-details cards. |
| `sections/main-addresses.liquid` | Cards + pill inputs/selects. customer.js contract untouched (`data-customer-addresses`, `aria-expanded` toggles, `type=reset` cancel, `data-confirm-message` delete, `AddressCountryNew…` / `AddressCountry_{id}` + `data-address-country-select` province wiring — verified against `global.js`, which clears inline `display` so the styled `.field` reappears correctly). |
| `sections/main-order.liquid` | Order detail in the same vocabulary: `.ord` line rows (variant, SKU, qty×price, properties, selling plans, line discounts, fulfillment + tracking), `.trow` summary (subtotal/discounts/shipping/tax/duties/refunds/total), billing + shipping cards with status pills, cancelled-order notice. |
| `sections/main-reset-password.liquid`, `sections/main-activate-account.liquid` | Centred `.authcard`, both password fields with the eye toggle, `reset_customer_password` / `activate_customer_password` contracts incl. the decline button. |
| `sections/main-404.liquid` + `templates/404.json` + `assets/cartel-404.css` | Cream page: `.kick` "404", `.stitle` headline (setting), one line of copy (setting), search posting to `/search`, four editable chips (blocks). |
| `templates/gift_card.liquid` | Light restyle only: Hanken via the `cartel-fonts` snippet + token-value overrides (cream page, wine headings, pill code + buttons via Dawn's own `--color-button` vars). Code, QR, Apple Wallet, copy button and print behaviour untouched. |
| `templates/customers/*.json` (7) | Point at the rebuilt sections; obsolete padding settings stripped. |

Not touched: `theme.liquid` (batch 7.0 already gates `cartel-account.css` to the seven customer templates and `cartel-404.css` to 404), all shared shell files.

## Verified

- `shopify theme check`: **0 errors** repo-wide; zero offenses in any lane-7D file (203 pre-existing warnings elsewhere, mostly locale files).
- Pushed with `--unpublished -t "Cartel 7D"`; pulled every lane file back from `#161160495317` — **all 19 byte-identical** (the GitHub write-back file-drop failure mode doesn't apply to this CLI push, but checked anyway per house rule 10).
- Via `theme dev` proxy: `/no-such-page` renders the Cartel 404 (HTTP 404, `.p404`, headline, search form → `/search`, all four chips, **zero Liquid errors**); `cartel-404.css` loads there and only there; `cartel-account.css` loads on no other template (home checked).

## ⚠️ Blocked at runtime — needs ONE store setting

**The store currently runs NEW customer accounts**: `/account/login` and `/account/register` 302 to the Shopify-hosted `shopify.com/18354821/account` page, so the classic templates never render on the storefront (they parse clean and are on the theme). Until the client flips **Settings → Customer accounts → Show login links / use Legacy (classic) customer accounts, login "optional"**, none of the account acceptance checks — in-card errors, register→auto-login, dashboard counts, address CRUD, and the whole *log in to see Thuya pricing* funnel this lane exists for — can be exercised. That's also why no console/liquid-error pass on the logged-in pages is included here.

Second blocker for the Thuya spot-check: **no Thuya-vendor products exist yet** (unchanged since batch 4.1) — gate untestable until the catalogue import, or temporarily set one product's vendor to `Thuya`.

## Omitted / decisions

- **No wishlist tile** anywhere (no wishlist app installed). The mock's "Saved items" stat and rail entry are gone; benefits copy says order history / addresses / faster checkout instead. Mock's "store credit" tile also dropped (no credit app).
- **Pro badge**: renders only when the customer has tag `thuya` or `pro` (exact tag, case-insensitive). Confirm which tag the team will actually use — checkout the badge copy says "Thuya pro".
- Mock's "Keep me signed in" checkbox dropped — classic Shopify login has no remember-me input.
- Dawn's "Sign in with Shop" button dropped (not in the design). Say the word if it should return; it's a 5-line add in `main-login.liquid`.
- `logo-cream.png` doesn't exist in assets, so the brand panel renders `settings.logo` knocked to cream with the footer's existing `filter: brightness(0) invert(.97)` trick (nothing renders if no logo is set). Drop a real `assets/logo-cream.png` later and swap the `<img>` if preferred.
- 404 chips "Lash lift" → `/collections/lash-lift`, "Brows" → `/collections/brows`: same planned handles the mega-nav already links; the collections themselves don't exist until the catalogue migration (nav has the same gaps). All four chips are editable blocks.
- Register fine-print links to Terms / Privacy render only once those policies exist in admin (plain text until then).

## Client must configure

1. **Customer accounts → classic/legacy, login optional** (see blocker above) — the whole lane hinges on this.
2. Create the taxonomy collections (`lash-lift`, `brows`, …) during the catalogue migration, or repoint the 404 chips in the editor.
3. Write Privacy Policy + Terms in Settings → Policies (register fine print links to them).
4. 301s for the live site's retired URLs (admin → URL redirects) — the 404 is a safety net, not the plan.
5. Newsletter: opt-in posts Shopify's native `accepts_marketing` consent; if a `newsletter` customer tag is wanted for segmentation, add a Shopify Flow/automation — the form doesn't set tags.
6. Gift card page uses `settings.logo` when set (already themed either way).

## Requests to other lanes

None — stayed inside the 7D file list.
