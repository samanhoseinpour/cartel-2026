# Homepage PSI: what the theme can't fix (batch 23, updated in batch 24, 2026-11-18)

This is the working list for the PageSpeed problems on `https://cartellash.ca/` that live **outside
this repo**: apps, pixels, admin settings and Shopify's own platform scripts. The theme-side fixes
are listed under "Already fixed in the theme" at the bottom.

**Where we are.** Real PSI on 2026-11-18 at 16:11, after batch 23:
- **Mobile 88, desktop 98.**
- Accessibility 100, SEO 100 and Agentic Browsing 4/4 on both.
- Best Practices 96 on both (item 6).

Full rows are in the PSI log below.

**Short version for the client.** Here are five admin changes, in priority order. Items 1 and 2
hold most of the remaining mobile points (see "What 95 and 98 need").
1. **TimesAct.** Its stylesheet is the slowest request blocking the first paint on phones. Ask
   TimesAct to load it asynchronously, or switch the app embed off if no pre-order product is live.
2. **Blockify.** Its 22 KB script is preloaded at high priority, ahead of the hero image. Turn off
   "Block unknown bots", or remove the app if fraud blocking isn't needed. It also turns real AI
   shopping agents away.
3. **Two custom pixels.** Delete "Google Analytics tag (migrated)" and "Meta pixel (migrated)"
   (Settings → Customer events). They double-count, and they're the most likely source of the
   jQuery download PSI flags.
4. **Microsoft Clarity.** Remove it, or load it only after cookie consent.
5. **Checkout logo.** Replace the 153 KB `logo-dark` PNG in checkout branding with a compressed file
   or an SVG.

---

## PSI log (pagespeed.web.dev, Google's infrastructure)

| Date | Form factor | Perf | FCP | LCP | TBT | SI | CLS | A11y | BP | SEO | Agentic | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-18 16:11 | mobile | 88 | 2.0 s | 3.5 s | 30 ms | 3.5 s | 0 | 100 | 96 | 100 | 4/4 | after batch 23 |
| 2026-11-18 16:11 | desktop | 98 | 0.6 s | 0.9 s | 10 ms | 1.4 s | 0.012 | 100 | 96 | 100 | 4/4 | after batch 23 |
| _after batch 24_ | mobile | | | | | | | | | | | to be pasted |
| _after batch 24_ | desktop | | | | | | | | | | | to be pasted |

## How PSI's model scores this page

PSI loads the page once over a fast connection. It then *simulates* a slow-4G phone with
Lighthouse's "Lantern" model. Four facts explain almost everything on this page:

- **FCP.** The 57 KB HTML costs about three round trips on a cold connection. Then comes the slowest
  render-blocking request, which is TimesAct's CSS. It sits on a second cold origin
  (cdn.shopify.com), so it pays a fresh DNS and TLS setup: 900 ms on mobile. The theme's own
  stylesheets reuse the document's warm connection and cost only their bytes.
- **LCP.** The model counts every request that finished before the hero image painted, and they all
  share the bandwidth. So preloaded scripts and fonts slow the hero down even when they don't block
  rendering.
- **Speed Index.** This is mostly the observed filmstrip. A late visual change costs a lot, such as
  the hero changing slide at 6 s.
- **Priority decides what counts as render-blocking.** Shopify's Link header preloads TimesAct's CSS
  at the highest priority. The model therefore treats it as blocking even if the theme flipped it to
  async, which is why the fix has to come from TimesAct.

## The items

### 1. TimesAct pre-order app (embed): the slowest render-blocking request

- **Evidence (PSI 2026-11-18):**
  - `timesactV2.css` (7.8 KB, cdn.shopify.com) is the slowest render-blocking request: 900 ms on
    mobile, 240 ms on desktop.
  - All 307 of its selectors are `.timesact-*`, so an async load cannot restyle anything in the
    theme at first paint.
  - The embed also inlines 18 KB of `window.TimesactData` (3.3 KB of the 56 KB HTML).
  - It loads a 62 KB unminified script: minifying would save 24 KB, and 51 KB of it is unused on the
    homepage.
- **Fix, in order of preference:**
  - Ask TimesAct support to load the CSS asynchronously (`media="print"` with an onload swap), or
    only on product and collection templates.
  - Try the embed's `use_custom_script` option.
  - If no pre-order products are live, disable the app embed (Theme editor → App embeds).
- **The theme can't do it.**
  - App embed output is injected by Shopify at the end of `<head>`.
  - Shopify's Link header preloads the stylesheet at the highest priority, and PSI's model counts
    that as blocking anyway.

### 2. Blockify Fraud Filter (embed and app pixel #2551677141)

- **Evidence:**
  - `ip-blocker-embed.min.js` (22 KB) is preloaded at High priority and finishes before the hero
    image, so PSI's LCP model charges for it.
  - On every page view it also adds a 5 KB inline config and a Cloudflare Radar IP lookup on a cold
    origin (`ip-check-perf.radar.cloudflare.com`, plus its preconnect).
  - It also adds three app-proxy calls (`/apps/theme-core/p/api/geo|check|owner`) and a
    requestAnimationFrame polling loop.
  - `initBotBlocker` sends any browser with `navigator.webdriver` to google.com, and most AI
    shopping agents have it.
  - `initCheckoutTrap` POSTs `/cart/clear.js` for any cart missing its marker attribute.
  - The Lighthouse UA is allowlisted, so Agentic Browsing still scores 4/4, but real agents are
    turned away.
  - The previously "unidentified" app pixel #2551677141 (API client 2309454) is Blockify's tracking
    pixel (`accountID: BLOCKIFY_TRACKING-123`).
- **Fix:** in Blockify, turn off **Block unknown bots**, or allowlist AI agent user agents. If fraud
  blocking isn't needed, remove the app.

### 3. The two "migrated" custom pixels (and jQuery)

| Load | Where it comes from |
|---|---|
| `gtag/js?id=KEEP%20ANALYTICS.JS` (90 KB) | **Custom pixel #86966485 "Google Analytics tag (migrated)"**. "KEEP ANALYTICS.JS" is a placeholder being used as a tag ID, so the load does nothing. |
| Meta pixel 2303643986566363, initialised a second time | **Custom pixel #65536213 "Meta pixel (migrated)"**. The Facebook & Instagram app pixel #2515370197 already loads it, so every page view and event fires twice. |
| `jquery/3.7.1/jquery.min.js` from ajax.googleapis.com (31 KB, 20 KB unused) | Not in the theme or the page HTML; it shows up only in PSI's run. Most likely one of these two custom pixels, which run in a lax sandbox that can load scripts. If it survives their deletion, the next suspect is an app. |

- **Owner:** client admin, plus whoever runs the Google Ads / GA4 accounts.
- **Fix:**
  1. Settings → Customer events → delete both custom pixels.
  2. Keep the Google & YouTube app (#2499346645) and the Facebook & Instagram app as the single
     sources.
  3. In the Google tag's *Destinations*, remove the dead Universal Analytics ID `UA-131631605-1`, and
     confirm whether `G-HYE2PMCCFY` is still used.
- **Trade-off:** none for data. Double-counted conversions stop.

### 4. Microsoft Clarity (app embed and pixel #3056369877)

- **Evidence:**
  - Clarity has the only long task on the page: 78 ms on mobile, 57 ms on desktop.
  - It uses 186 ms of main-thread time.
  - `clarity.js` has a one-day cache lifetime.
  - TBT is fine today (30 ms), so this matters less than items 1-3.
- **Fix:** remove the Clarity app, **or** use Clarity's consent API, wired to Shopify's Customer
  Privacy banner, so nothing loads before consent.
- **Trade-off:** you lose session recordings for visitors who don't consent.

### 5. Checkout logo PNG (153 KB)

- **Evidence:**
  - `cdn.shopify.com/.../files/logo-dark_x320.png` (152.8 KB) is in PSI's payload list.
  - The theme never references it: the header uses `logo-dark.avif`.
  - The `_x320` size, plus Shopify's checkout prefetch running at the same time, points to Shopify
    prefetching the **checkout** logo.
- **Fix:** in Settings → Checkout → Branding, upload a compressed logo (a 320 px tall wordmark
  should be well under 20 KB) or an SVG. Real checkouts load it too.

### 6. Best Practices 96: shop.app `/pay/hop` answers 429

- **Evidence:**
  - The only failing Best Practices audit is a console error: "Failed to load resource: 429" on
    `shop.app/pay/hop`.
  - That URL is an iframe created by Shopify's shop-cart-sync module (`chunk.casing_…esm.js`,
    injected by `content_for_header`). This was verified in saved devtools logs.
  - Automated browsers get 403 (local Lighthouse) or 429 (PSI). It is a shop.app rate limit on
    Google's servers, not a site bug.
- **Decision (2026-11-18): leave it.**
  - The theme could only remove it by stripping that script from `content_for_header`.
  - That would also switch off Shop app cart sync for Shop Pay customers, and it would break
    silently when Shopify changes the markup.
- **If 100 is ever required:** ask Shopify Support whether Shop app cart sync can be turned off for
  the storefront.

### 7. TikTok pixel

- App pixel #417562837 (CABVM03C77U6RIQIQG60), about 48 KB. Keep it only if TikTok ads are running.

### 8. Synctrack and the preconnect warning

- PSI warns that it found more than 4 `preconnect` hints.
- Two of them are unused:
  - `media.synctrack.io`, injected by an app; nothing on the page loads from it.
  - Blockify's `ip-check-perf.radar.cloudflare.com`.
- Remove Synctrack's (or the app) if it isn't needed. Blockify's goes with item 2.

### 9. Shopify platform floor (merchant settings can't remove these)

| What | Effect | Lever |
|---|---|---|
| `shopify.exit_interstitial` (Shopify's external-link warning) | 21 KB inline script at the very top of `<head>`: 8.2 KB of the 56 KB HTML, parsed before anything else | None |
| `checkout-web` prefetch (`c1/*.js`, about 450 KB) | The largest payloads after the hero video, late in the trace | None. Stripping it from `content_for_header` is fragile and slows real checkouts |
| `accelerated-checkout-backwards-compat.css` | Render-blocking on every page (same origin, 3 KB) | None |
| shop-js (`loader.init-shop-cart-sync` plus about 18 chunks), `standard-events.js`, `standard-actions.js` | High-priority requests to cdn.shopify.com in the first-paint window | None. They back Shop Pay and the WebMCP / agentic features |
| Web pixels manager, perf-kit, trekkie | Main-thread time | Fewer pixels (items 2-4 and 7) shrink it |
| Hero image preload without `fetchpriority` | PSI marks "fetchpriority=high should be applied to the image preload request" in red. The `<img>` itself has `fetchpriority="high"`, but Shopify's `image_tag` `preload: true` header only carries `imagesrcset` and `imagesizes`. Unscored; accepted | Needs Shopify to pass `fetchpriority` into the Link header |

### 10. Content (client)

- **Alt text in Content → Files** for `Website_banner.avif` (hero), `founder-training-studio.webp`
  (About band) and the reel videos.
- **Why it still matters:** the theme falls back to a decorative `alt=""`, which passes Lighthouse.
  Real descriptions are better for image search and screen readers, and when one is set it wins.

---

## Decisions on file

| Date | Decision | Cost / benefit |
|---|---|---|
| 2026-11-18 | The hero and announcement bar keep **rotating on load**. | The 6 s slide change is the late visual change in PSI's filmstrip. Starting rotation on the visitor's first scroll, tap or key would be worth about +1 on mobile and +1 on desktop (Speed Index). Batch 24 made the change cheaper instead: phones now get a 720p video and an 1100w poster. |
| 2026-11-18 | **Best Practices 96** is accepted (item 6). | Reaching 100 would mean stripping Shopify's own script. |

## What 95 and 98 need

PSI moves ±3-5 points between runs of the same page.

| | Mobile | Desktop |
|---|---|---|
| Real PSI after batch 23 | 88 | 98 |
| + batch 24 (theme, below) | ~89-91 | 98-99 |
| + TimesAct CSS async, or its embed off (item 1) | +3 to +5 | about +0.5 |
| + Blockify preload gone (item 2) | about +1 | small |
| + rotation starts on first interaction (declined) | about +1 | about +1 |
| Floor | Shopify's head scripts and the 57 KB document on a cold connection keep 98 out of reach with this app stack | 99-100 is reachable |

---

## Already fixed in the theme

### Batch 25 (branch `feat/blur-up-batch-25`): blur-up previews, a felt-speed change

1. **What it does.** Every photo box shows a blurred 32px copy of its photo from Shopify's CDN until
   the photo has loaded and decoded, instead of a flat burgundy, beige or white box. It is for
   shoppers on slow phones, not for the score.
2. **What it costs PSI.** The previews are CSS backgrounds, which can't lazy-load, so every rendered
   photo box fetches one at first layout.
   - **Measured on the dev theme:** 26 preview requests on the homepage (hero 3, best sellers 8, kits
     6, reels 4, about band 1, resources 3, the visible before/after pair; hidden pairs and the
     popup fetch none).
   - **Size:** each is 0.9-1.1 KB (WebP for Chrome's Accept header, JPEG XL where accepted), about
     29 KB of bodies in all. A 16px copy saves only ~25%, because WebP's floor is ~0.8 KB.
   - **Effect:** they finish before the hero, so PSI's LCP model counts their bytes. In real Chrome
     throttled to 1.6 Mbps / 150 ms, the hero LCP was 4.76-4.88 s with previews and 4.76-5.85 s
     without them (two runs each, too few to resolve under ~200 ms). Check the first PSI row after
     batch 25 against this.
3. **What it doesn't change.** Low-detail placeholders don't become the LCP element. Chromium also
   scales an upscaled image's LCP size down to its natural size, so a 32px preview can't win. On
   the dev theme the LCP elements stayed the real photos: hero `<img>`, PDP gallery and PLP card.
   CLS was unchanged with the previews on and off (the PLP's 0.10 on a throttled phone load comes
   from its toolbar, `.plptop-r`/`.sorting`, and predates batch 25).
4. **Without JS** nothing changes and no preview is fetched.

### Batch 24 (branch `perf/psi-home-batch-24`)

1. **Hanken Grotesk is no longer preloaded.**
   - Its 34.7 KB downloaded in the same window as the hero image, and PSI's LCP model charged for
     it: about 0.1-0.17 s of mobile LCP.
   - The metric-matched fallback keeps the later swap shift-free. Measured on the real homepage
     markup with the font delayed 1.5 s, CLS was 0.0002 at 412 px and 0.0004 at 1350 px.
   - Even with no Arial installed it stayed at 0.0019 and 0.0054.
2. **Phones get a 720p hero video and an 1100w poster.**
   - The slide-2 `<video>` is now built from `video.sources`, with
     `<source media="(max-width: 760px)">` for phones.
   - The 1080p file (1.6 MB) and the 1600w poster are now desktop-only.
3. **The hero image sizes match the real slot.** There is now a 1200w candidate, and `sizes` switches
   at 1280 px instead of 1360 px. Before this, PSI desktop pulled the 1600w file (92.5 KB) for a
   1200 × 679 slot.
4. **No forced reflow on the hero's first activation** (PSI "Forced reflow": `cartel-home.js:1:3136`).

### Batch 23 (branch `perf/psi-home-batch-23`, merged as `6ae3be5`)

1. **Hero dots no longer animate `width`.** That animation produced about 27 layout frames per slide
   change, which was 76% of Lighthouse's layout-based Speed Index on the live trace.
2. **Seven bare `transition:<time>` rules** (which mean `all`) in `cartel-home.css` are now
   enumerated. Before, the cart drawer's deferred CSS landing animated the close button's geometry
   through about 26 layout frames.
3. **Video posters are off the first-paint path.** The slide-2 hero poster (80 KB) and the reel
   posters (about 40 KB each) used to compete with the LCP image.
4. **The hero LCP image is preloaded** through the `Link` header.
5. **The email popup's 12-second auto-open no longer focuses the email field.**
   - That focus triggered Shopify's hCaptcha loader: about 1 MB on every visit.
   - hCaptcha now loads when a shopper actually focuses the field, and the form is still protected.
6. **Card and kit images** request the size they actually render at.
7. **`product-form.js` loads once**, from `theme.liquid`, which clears the "duplicated JavaScript"
   insight.
8. **Accessibility:** the marquee brand names now meet 3:1 contrast (3.61:1), and every homepage
   `<img>` has an `alt`.

**Follow-ups to consider (theme):**

| Item | When / why |
|---|---|
| Rotation starts on first interaction | Declined 2026-11-18 (see Decisions). It is the largest theme-side Speed Index lever left. |
| Footer payment icons as lazy `<img>` instead of inline SVG | −6.5 KB brotli on every HTML document. On its own it doesn't get the document under the next round-trip step in PSI's model (about 44 KB), so it's a real-user win, not a score one. |
| Slides 3-4 download at first layout | They're `loading=lazy` but sit in the viewport under `opacity:0` (45 KB mobile, 103 KB desktop). Deferring them doesn't help PSI while rotation runs on load, because they would still load during the trace. |
| The popup image is 900w on phones | Its size ladder has no 600 or 750 step. It loads after `load`, so it isn't scored. |
| Fallback font on Linux | Adding `local('Liberation Sans')`, which is metric-identical to Arial, to the fallback faces would make the swap shift-free on Linux too. It can't be verified on this Mac. PSI's desktop CLS of 0.012 on the header may come from this swap. |
| WebMCP form annotations | PSI lists "13 forms missing annotations" under Agentic Browsing. It is informative, not scored; Shopify's own WebMCP adapter already passes. |

## Local Lighthouse numbers (batch 23, for A/B only)

- **The keyless PSI API has a quota of 0/day.** These numbers come from Lighthouse 13.5.0 run
  locally with PSI's exact user agents (`... Chrome-Lighthouse`) and simulated throttling.
- **The user agent matters because of Blockify.** It sends any browser with `navigator.webdriver` to
  google.com and **empties its cart**. Its allowlist includes `/Lighthouse/i`, so PSI gets through.
  Without that UA, a local run measures google.com.
- **Local runs read pessimistic.** This machine reaches Shopify with a TTFB of 0.66-1.7 s, while
  server-timing shows about 100 ms. Treat local numbers as before/after comparisons only.

| Scenario (local, PSI UA) | Mobile | Desktop |
|---|---|---|
| Live before batch 23 | 48-50 | 69 |
| Google tags, Meta, Clarity/Bing, TikTok, hCaptcha, TimesAct and Blockify blocked | 84 | 79 |

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

- **Cloudflare:** keep to about 15 storefront loads a day. Each Lighthouse run is one page load. On
  2026-11-18 the batch-23 testing tripped a challenge: even a plain curl got `cf-mitigated: challenge`.
