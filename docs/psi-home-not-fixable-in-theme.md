# Homepage PSI: what the theme can't fix (batch 23, 2026-11-18)

This is the working list for the PageSpeed problems on `https://cartellash.ca/` that live **outside
this repo**: apps, pixels, admin settings and Shopify's own platform scripts. The theme-side fixes
shipped on branch `perf/psi-home-batch-23` (see "Already fixed in the theme" below).

**Short version for the client.** Here are six admin changes, in priority order. Together they are
worth roughly **+35 mobile PSI points**, plus Best Practices 100 once items 3 and 6 are done.
1. Delete the custom pixel **"Google Analytics tag (migrated)"** (Settings → Customer events).
2. Delete the custom pixel **"Meta pixel (migrated)"** (same page).
3. Decide on **Microsoft Clarity**: remove it, or only load it after cookie consent.
4. Ask **TimesAct** to stop blocking the first paint, or limit the app to product and collection pages.
5. In **Blockify**, turn off "Block unknown bots", or remove the app if fraud blocking isn't needed.
6. Check whether the **TikTok** pixel and the linked Google tag destinations are still needed.

---

## How these numbers were measured

- **No PSI numbers yet.** The keyless PageSpeed Insights API now has a quota of **0/day**, so the
  numbers below come from **Lighthouse 13.5.0 run locally** with PSI's exact user agents
  (`... Chrome-Lighthouse`) and simulated throttling.
  - **Real PSI runs go in the log at the bottom.**
- **The user agent matters because of Blockify.** It sends any browser with
  `navigator.webdriver` to google.com and **empties its cart**. Its allowlist includes
  `/Lighthouse/i`, so PSI gets through. Without that UA, a local run measures google.com.
- **Local runs read pessimistic on FCP, LCP and Speed Index.** This machine reaches Shopify with a
  TTFB of 0.66-1.7 s, while server-timing shows about 100 ms. Treat local numbers as before/after
  comparisons only.

| Homepage (local, PSI UA) | Perf | FCP | LCP | TBT | SI | A11y | BP | SEO | Agentic |
|---|---|---|---|---|---|---|---|---|---|
| Mobile, before batch 23 | 48-50 | 4.2 s | 5.1-5.6 s | 630 ms | 7.4-8.0 s | 92 | 73 | 92 | 4/4 |
| Desktop, before batch 23 | 69 | 2.5 s | 2.5 s | 0 ms | 4.4 s | 92 | 77 | 92 | 4/4 |

### Ceiling experiments

These are the same page with requests blocked through Lighthouse `--blocked-url-patterns`:

| Scenario | Mobile | Desktop |
|---|---|---|
| Live as-is | 48-50 | 69 |
| Block the Google tags, Meta, Clarity/Bing, TikTok, hCaptcha, TimesAct and Blockify | **84** | **79** |
| ...and also Shopify's checkout prefetch and the video posters | 85 | — |

So **about 35 mobile points are lost to the items in this file**. That is more than the theme can
recover on its own. Even with all of them gone, Shopify's own scripts (below) still set a floor.

---

## The items

### 1. Google tags: 10 gtag.js loads (about 1.5 MB, the largest share of TBT)

| Load | Where it comes from |
|---|---|
| `G-14LGTJ98ZC`, `AW-18419325896`, `GT-TXZCFLJH`, `GT-55KS4FB` (main frame) | **Google & YouTube app** pixel #2499346645 (API client 1780363). This is the one to keep. |
| `gtag/js?id=KEEP%20ANALYTICS.JS` (90 KB) | **Custom pixel #86966485 "Google Analytics tag (migrated)"**. "KEEP ANALYTICS.JS" is a placeholder string being used as a tag ID, so the load does nothing. |
| `G-14LGTJ98ZC`, `AW-18419325896`, `GT-TXZCFLJH`, `UA-131631605-1`, `G-HYE2PMCCFY`, each with `&cx=c` | Child destinations loaded by a Google tag. **UA-131631605-1 is Universal Analytics**, which Google shut down in 2024. The repeated G/AW IDs mean the same conversions are counted twice. |

- **Owner:** client admin, plus whoever runs the Google Ads / GA4 accounts.
- **Fix:**
  1. Settings → Customer events → delete "Google Analytics tag (migrated)".
  2. In Google's tag settings (the Google tag's *Destinations*), remove `UA-131631605-1`. Confirm whether `G-HYE2PMCCFY` is a property anyone still uses.
  3. Keep the Google & YouTube app as the single source.
- **Trade-off:** none for data. Double-counted conversions stop.

### 2. Meta pixel 2303643986566363 loaded twice (fbevents.js and signals config, about 440 KB)

- **Sources:** the Facebook & Instagram app pixel #2515370197, **plus** custom pixel #65536213
  "Meta pixel (migrated)", which initialises the same pixel ID again. Each page view and event
  fires twice.
- **Fix:** Settings → Customer events → delete "Meta pixel (migrated)". Keep the app pixel and set
  its data-sharing level in the Facebook & Instagram app.

### 3. Microsoft Clarity (app embed and pixel): the Best Practices failure

- **Evidence:**
  - It sets **8 of the 9 third-party cookies** Lighthouse flags (CLID, SM, MUID, MR and ANONCHK on clarity.ms, plus MUID, MR and SRM_B on c.bing.com).
  - That alone fails "Uses third-party cookies" and "Issues logged in Chrome DevTools".
  - It also adds 25 KB of script and a long task of about 120 ms at roughly 11 s.
- **Fix:** remove the Clarity app, **or** configure Clarity to wait for cookie consent (Clarity's
  consent API, wired to Shopify's Customer Privacy banner). Then no cookies are set before
  consent, which is the state PSI tests.
- **Trade-off:** you lose session recordings for visitors who don't consent.

### 4. TimesAct pre-order app (embed): the last render-blocking request

- **Evidence:**
  - `timesactV2.css` (48 KB, cdn.shopify.com) is render-blocking on every page and is the **last** blocking request to finish. Lighthouse puts the wasted time at **1,527 ms on mobile and 871 ms on desktop**.
  - The embed also inlines 18 KB of `window.TimesactData` and loads a 63 KB unminified script (about 25 KB could be saved by minifying it).
- **Fix, in order of preference:**
  - ask TimesAct support to load the CSS asynchronously, or to restrict the embed to product and collection templates;
  - try the embed's `use_custom_script` option;
  - if no pre-order products are live, disable the app embed in the theme editor (App embeds).
- **The theme can't do it.** App embed output is injected by Shopify at the end of `<head>`.

### 5. Blockify Fraud Filter (embed): agents redirected, carts cleared, early bytes

- **Evidence:**
  - `initBotBlocker` sends any browser with `navigator.webdriver` (which most AI shopping agents and headless browsers have) to google.com.
  - `initCheckoutTrap` POSTs `/cart/clear.js` for any cart missing its marker attribute.
  - Its 69 KB script is **preloaded at High priority** during the LCP window.
  - It adds three app-proxy calls (`/apps/theme-core/p/api/geo|check|owner`), a Cloudflare Radar IP lookup and a requestAnimationFrame polling loop to every page view.
- **Not scored, but it matters:** "agentic SEO" means agents can browse and buy. Blockify stops
  real ones, even though Lighthouse's own UA is allowlisted and the Agentic Browsing score stays
  4/4.
- **Fix:** in Blockify, turn off **Block unknown bots**, or allowlist AI agent user agents. If
  fraud blocking isn't actually needed, remove the app.

### 6. TikTok pixel and the unidentified app pixel

- **TikTok:** app pixel #417562837 (CABVM03C77U6RIQIQG60), about 48 KB. Keep it only if TikTok
  ads are running.
- **Unidentified pixel:** app pixel #2551677141 (API client 2309454). Identify it in Settings →
  Customer events and remove it if it's unused.

### 7. Synctrack

- `<link rel="preconnect" href="https://media.synctrack.io">` is injected by an app, and nothing
  on the page uses it. Lighthouse flags it as an unused preconnect. Remove it, or ask the app to
  drop it.

### 8. Shopify platform floor (merchant settings can't remove these)

| What | Effect | Lever |
|---|---|---|
| `checkout-web` prefetch (about 130 sequential requests from 11 s to 45 s) | Keeps Lighthouse's trace open to its 45 s cap ("page loaded too slowly"), which stretches TTI and the Speed Index window | None. Stripping it from `content_for_header` is fragile and slows real checkouts |
| `accelerated-checkout-backwards-compat.css` | Render-blocking on every page | None |
| `shop.app/pay/hop` + `/pay/session` iframes | Third-party cookie `_shop_app_essential`, plus a CSP frame-ancestors console error | Shop Pay / "Sign in with Shop" settings. Disabling them costs conversions, so this is a business decision. Otherwise raise it with Shopify Support |
| Web pixels manager (`/cdn/wpm/*.js`), perf-kit, trekkie | Main-thread time (wpm about 1.4 s of CPU on throttled mobile) | Fewer pixels (items 1-6) shrink it |

**Best Practices 100 needs items 3 and 8 (shop.app)**, which the theme can't control.

### 9. Content (client)

- **Alt text in Content → Files** for `Website_banner.avif` (hero), `founder-training-studio.webp`
  (About band) and the reel videos.
- **Why it still matters:** the theme now falls back to a decorative `alt=""`, which passes
  Lighthouse. Real descriptions are better for image search and screen readers, and when one is
  set it wins.

---

## Already fixed in the theme (branch `perf/psi-home-batch-23`)

1. Hero dots no longer animate `width`. That animation produced about 27 layout frames per slide
   change, which was 76% of Lighthouse's layout-based Speed Index on the live trace.
2. Seven bare `transition:<time>` (= `all`) rules in `cartel-home.css` are now enumerated. Before,
   the cart drawer's deferred CSS landing animated the close button's geometry through about 26
   layout frames.
3. Video posters are off the first-paint path. The slide-2 hero poster (80 KB) and the reel
   posters (about 40 KB each) used to compete with the LCP image.
4. The hero LCP image is now preloaded through the `Link` header.
5. The email popup's 12-second auto-open no longer focuses the email field. That focus triggered
   Shopify's hCaptcha loader, about 1 MB on every visit. hCaptcha now loads when a shopper
   actually focuses the field, and the form is still protected.
6. Card and kit images request the size they actually render at.
7. `product-form.js` loads once, from `theme.liquid`, which clears the "duplicated JavaScript"
   insight.
8. Accessibility: the marquee brand names now meet 3:1 contrast (3.61:1), and every homepage
   `<img>` has an `alt`.

**Follow-ups to consider (theme):**

| Item | When / why |
|---|---|
| Hero autoplay waits for the first interaction | Only if real PSI still shows SI above about 4 s. Agreed 2026-11-18. |
| Lower-resolution video source on phones | The slide-2 MP4 is 1080p and 1.6 MB even at 390 px. Needs `<video>` built from `video.sources` with `<source media>`; `video_tag` only emits the top rendition. |
| Footer payment icons as lazy `<img>` instead of inline SVG | About 6 KB gzip off every HTML document. |

## How to re-measure

```
LH=/Users/saman/.npm/_npx/1722e863ebfd623b/node_modules/lighthouse/cli/index.js   # 13.5.0
MUA='Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse'
node $LH https://cartellash.ca/ --emulatedUserAgent="$MUA" \
  --only-categories=performance,accessibility,best-practices,seo,agentic-browsing \
  --output=json --output-path=mobile.json --chrome-flags="--headless=new"
# desktop: add --preset=desktop and use the "...Safari/537.36 Chrome-Lighthouse" UA
# what-if: add --blocked-url-patterns='*googletagmanager.com*' (etc.) to price an admin change
```

- **Cloudflare:** keep to about 15 storefront loads a day. Each Lighthouse run is one page load.

## PSI log (pagespeed.web.dev, Google's infrastructure)

| Date | Form factor | Perf | FCP | LCP | TBT | SI | CLS | A11y | BP | SEO | Agentic | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| _before_ | mobile | | | | | | | | | | | to be pasted |
| _before_ | desktop | | | | | | | | | | | to be pasted |
| _after batch 23_ | mobile | | | | | | | | | | | |
| _after batch 23_ | desktop | | | | | | | | | | | |
