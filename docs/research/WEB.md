# WEB research: iPhone Duo / iOS 27 portfolio simulator

Researched 2026-11-03. Sources: live pages via a headless Chrome (Playwright) and the in-app browser, raw HTML, CSS and JS pulled with curl, and news/HIG pages. Every value below was measured with `getComputedStyle` or read from shipped CSS/JS unless it is marked **(est.)**.
Screenshots: `docs/research/img/`. Apple Design Skill copy: `docs/research/apple-design-skill/`.

---

## 0. TL;DR: tokens to copy

| Token | Value |
|---|---|
| Display font | `"SF Pro Display","SF Pro Icons","Helvetica Neue",Helvetica,Arial,sans-serif` (use for ≥ 19px) |
| Text font | `"SF Pro Text",…` (for < 19px). Body 17px / 25px (1.47059) / 400 / `-0.022em` (-0.374px) |
| Hero headline (Duo "Hello, hello.") | 80px / 84px (1.05) / 600 / `-0.015em` (-1.2px) · ≤1068: 64/1.0625/-0.009em · ≤734: 48/1.0834/-0.003em |
| Lockup headline XXL ("A new iPhone enters the fold.") | 80 / 1.05 / 600 / -0.015em · ≤1068: 64 · ≤734: 40/1.1/0 |
| 18 Pro XXL lockup headline | 96px / 100px / 600 / -1.44px (-0.015em) |
| Section header ("Get the highlights.") | 48 / 1.0835 / 600 / -0.003em · ≤1068: 40/1.1/0 · ≤734: 32/1.125/+0.004em |
| Eyebrow ("iPhone Duo" above hero) | 21px / 1 / 600 / +0.011em (desktop computed). Class `eyebrow-elevated` = 28/24/21 across breakpoints |
| Lockup copy | 21 / 1.381 / 400 / +0.011em, colour `#6e6e73` with `<strong>` in `#1d1d1f` (light page) or `#86868b` (dark page) |
| Tile headline (home) | 56 / 60 / 600 / -0.28px; tile subhead 28/32/400/+0.196px; small tile headline 40/44 |
| Caption / footer | 12px / 16px (1.33337) / 400 / -0.01em (-0.12px) |
| Breakpoints | xlarge > 1440 (content max 1440), large 1069–1440, medium 735–1068, small ≤ 734 |
| Colours, light | page `#ffffff`, alt section `#f5f5f7`, footer `#f5f5f7`, text `#1d1d1f`, secondary `#6e6e73`, tertiary `#86868b`, link `#0066cc`, index section `#fafafc` |
| Colours, dark | page `#000`, alt section `#1d1d1f`, text `#f5f5f7`, secondary `#86868b`, link `#2997ff` |
| Primary button | bg `#0071e3` (hover `#0076df`, active `#006edb`), white, 17px/400, padding 11–12px × 21–22px, radius `980px`, height 44px, min width 70px |
| Secondary button | transparent, 1px ring, colour `#0066cc` (light) or `#2997ff` (dark), same metrics |
| Focus ring | `outline: 2px solid #0071e3; outline-offset: 3px` |
| Global nav | 44px tall; links 12px/400/-0.01em, `rgba(0,0,0,.8)` (light) or `rgba(255,255,255,.8)` (dark); dark bg `rgba(29,29,31,.8)` + `backdrop-filter: saturate(1.8) blur(20px)` |
| Local nav (2026 "floating capsule") | sticky 72px wrapper, inner capsule 1024×52 at top 10px, radius 18px, bg `rgba(255,255,255,.8)` + `blur(20px)`, ring `0 0 0 1px #e6e6e8`; product name 19px/600/+0.228px SF Pro Display; CTAs 12px pill 28px tall |
| Price platter (hero) | `rgba(232,232,237,.72)` + `blur(20px)`, radius `10em`, padding 10px; dark variant `rgba(51,51,54,.72)`; becomes a 100vw full-bleed bar (radius 0) at ≤1068 |
| Apple easing | `cubic-bezier(.4,0,.6,1)` (nav and flyouts, 320ms, 78 uses), `cubic-bezier(.25,.1,.3,1)` (300ms width/transform), reveal = easeInOutQuad |
| Scroll reveal ("StaggeredFadeIn") | trigger when element top reaches 85vh; each item `translateY(30px→0)` over 0.7s + `opacity 0→1` over 0.9s, easeInOutQuad, stagger 0.15s |
| iPhone Duo display ratio | ≈ 1 : 1.42 on both displays. Inner 2670×1878 px (landscape) @430ppi, outer 1398×2034 px @460ppi. Each half of the inner display has the same ratio as the outer display |
| Duo device | open 164.6 × 117.8 × 5.2 mm; closed 84.1 × 117.8 × 11.3 mm; 254 g; Night Sky (dark blue) and Star White; grade 5 titanium, mirror-polished |

---

## 1. apple.com/iphone-duo/ (product page)

### 1.1 Page skeleton (1440×900, measured offsets)

| # | Section id | y (px) | height | bg | Notes |
|---|---|---|---|---|---|
| — | global nav | 0 | 44 | white | |
| — | ribbon | 44 | 52 | `#f5f5f7` | "Lease a new iPhone… Learn more ›" 14px, link `#0066cc` |
| 1 | hero (`section-media-hero`) | 96 | 804 | white | eyebrow + "Hello, hello." + hero video + glass price platter |
| 2 | `highlights` | 900 | 1080 | `#f5f5f7` | "Get the highlights." + "Watch the film ⓘ" link; horizontal media-card gallery (7 cards, autoplay, dot-nav + play/pause pill) |
| 3 | `design` | 1980 | 1527 | white | eyebrow "Foldable design", XXL "A new iPhone enters the fold.", copy, `design` video (3 devices), colour picker (Night Sky / Star White) |
| 4 | `product-viewer` | 3507 | 988 | `#f5f5f7` | "Take a closer look." WebGL 3D viewer, pills: Foldable design (fold slider), Landscape, Portrait, Closed, Seated, Standing, Durability |
| 5 | `display` (ImmersiveHero) | 4495 | 2113 | white | "Expansive display / Think vast." `hero-display` video (Silo on the inner display opening flat), stats: Nano-texture, Wide-angle OLEDs, 3000 nits, 7.6″ |
| 6 | `versatility` | 6608 | 2224 | white | "Reimagined iOS. Anything's posable." + `versatility-hero` video, then a "Whatever shape your day takes." gallery (Split View, Siri AI, StandBy, Hands-free) |
| 7 | `cameras` | 8832 | 4149 | white | "Your new favorite camera features. Hands down." Smart Take, Duo Preview, Kid Cue, Duo FaceTime |
| 8 | `performance` | 12982 | 2702 | white | "Power on full display." A20 Pro, "Power coupled." dual battery, compare dropdown |
| 9 | `shared-features`, `siri`, `ios`, `connectivity` | 15684+ | ~1000 each | `#f5f5f7` | "All the must-haves. All on iPhone." carousels |
| 10 | `accessories`, `incentive`, `compare`, `environment`, `values`, `faq` | 19945+ | | white/`#f5f5f7` | |

The whole Duo page is **light** (white/`#f5f5f7`), unlike the black 18 Pro page.

### 1.2 Hero: "Hello, hello."

- Markup: `h1.marquee-eyebrow` "iPhone Duo" (SF Pro Display 21px/600) above `p.marquee-headline` "Hello, hello." (80px/600/-1.2px, `#1d1d1f`). Both are centred. The headline sits about 120px below the ribbon.
- **Media**: `<video muted playsinline preload=none data-inline-media data-inline-media-basepath=…/anim/hero/>`. A `<picture class=start-frame>` and a `<picture class=end-frame>` sit beside it as poster and fallback.
- **Playback is triggered, not scroll-scrubbed.** The video autoplays once when it is loaded and in view (`data-load-timeout=3000`, `pause-on-exit=false`, `unload-at-end=true`), then rests on the end frame. A circular play/replay `inline-media-ui-button` sits bottom-centre.
- **What the 3.03 s / 91-frame / 30 fps clip shows** (see `img/apple-duo-hero-unfold-every6frames.jpg`):
  | t | frames | action |
  |---|---|---|
  | 0.0–0.4 s | 0–12 | Device **closed**, held in the right hand, portrait. The outer display shows the iOS 27 home screen: Weather and Find My widgets on top, a 4×4 grid, and a **vertical dock on the right edge**. The camera hole is top-right |
  | 0.4–0.8 s | 12–24 | Device **rotates about its vertical axis** (yaw) to edge-on |
  | 0.8–1.0 s | 24–30 | Back visible, showing the Star White titanium and a two-lens camera plateau |
  | 1.0–1.6 s | 30–48 | Continues rotating to edge-on. A second hand joins and both hands pinch it like a closed book (spine to the camera) |
  | 1.6–2.0 s | 48–60 | **Unfolds** toward the viewer. The inner display swings open to about 170° (a shallow V, never fully flat) and the device scales up to fill the frame (≈ 1.9× visual size) |
  | 2.0–3.0 s | 60–90 | **Screen "lights up"**: the inner home screen is already lit. The left-pane Photos "On This Day" widget starts **heavily blurred and dark** and de-blurs and brightens to sharp over about 1 s (ease-out). The right pane shows Weather and Find My widgets, a 4×4 app grid, the vertical dock (Phone, Safari, Messages, Music) on the far right edge, and the status (9:41 + Wi-Fi) stacked vertically top-right. Search (magnifier in a glass circle) sits bottom-right, page dots bottom-centre of the right pane |
- **Glass price platter**: pill 508×64 (desktop), `rgba(232,232,237,.72)` + `backdrop-filter: blur(20px)`, radius 10em, padding 10px. The copy is 14px/600 "From $1999 or $83.29/mo. for 24 mo.*" over "Lease from $57.99/mo. for 24 mo. with Apple Upgrade◊". The blue "Buy" button sits on the right edge (73×44, `#0071e3`, 17px). It overlaps the bottom of the video because the video sits behind it. At ≤1068 it turns into a full-width bar (`left: calc(-50vw + 50%)`, `width: 100vw`, radius 0, padding 18px 0).

### 1.3 Scroll animation inventory (Apple's own "AnimSystem")

Apple uses a declarative keyframe engine whose expressions are evaluated against element geometry: `t` = element top, `b` = bottom, `h` = element height, `vh` = viewport height, `a0t` = the top of anchor 0, `css(--var)` = a CSS variable. Recreate it with GSAP ScrollTrigger (start/end strings) or with CSS `animation-timeline: view()`.

| Component | Behaviour (exact) |
|---|---|
| **StaggeredFadeIn** (headlines, lockups, galleries) | Fires once (time-based, not scrubbed) when `start: "t - 85vh"`. For each `[data-staggered-item]` i: `y: 30px→0` over `0.7s`, `opacity: 0→1` over `0.9s`, both `easeInOutQuad`, delay `i*0.15s`. Initial inline style `transform: matrix(1,0,0,1,0,30); opacity:0` |
| **Focus expression** | `t - 50vh + 50h` (element centred in the viewport) is used for a11y focus management |
| **Inline videos** (design, versatility, display) | `load-keyframe {start:"t - 100vh"/"t - 250vh", end:"b + 100vh"}` and `play-keyframe {start:"t - 65vh", end:"b"}`. The display video plays at `--trigger-video: t - 110vh` (`t - 120vh` on small). These play once and rest on the end frame |
| **ImmersiveHero** (display) | On small/xsmall only: `videoContainer scale 1.1 → 1` over `0–4s`, easeOutCubic |
| **Product viewer clip reveal** | `--clip-path-progress: 1 → 0` from `t - (70vh + localnav height)` to `t`, scrub with `ease: .3` (smoothing). On mobile: `clip-path: inset(0 calc(p*6.25vw) 0 calc(p*6.25vw) round calc(p*radius))`, so the card grows to full-bleed as you scroll in |
| **Camera hardware parallax** | Rear and front hardware images: `y` from `css(--rear-hardware-start)*a0h` to `css(--rear-hardware-end)*a0h` between `a0t - 100vh` and `a0b`, `ease: .1` (lerp smoothing). Copy fades in on overlapping ranges |
| **Local nav** | Class `localnav-over-globalnav` toggles at `end: css(--r-globalnav-height)` (44px). The local nav slides `y: 0 → -44px` with easeInOutQuad, CSS `transition: opacity .4s ease-out`, capsule `transform .23s` |
| **Highlights gallery** | Autoplay card gallery, `--autoplay-persist-duration: 6.15s` per card. Content fade-in 420–600ms, `y` 400ms. Dot-nav stagger 40ms, collapse 380ms |
| **Gallery item enter** | `x: -100%w → 0`, `opacity 0→1`, easeOutCubic |

Other curves in the page CSS: `cubic-bezier(.33,1,.68,1)` (easeOutCubic), `cubic-bezier(.3,2,.5,1)` and `cubic-bezier(.34,2.16,.64,1)` (springy overshoots for icons and buttons), `cubic-bezier(0,0,.5,1)`, `cubic-bezier(.4,.1,.4,1)`. Common transitions: `opacity 400ms ease-in-out`, `opacity 100ms linear, transform .2s ease`, `background-color 250ms linear`.

### 1.4 Product viewer ("Take a closer look.")

- A real-time **WebGL 3D viewer** on Apple's in-house engine (`vendors~lotus-lib.built.js`). It loads a scene `…/f/static//scenes/iPhoneDuo_US_L_ktx.lsd` plus `.lsd` and `.gltf` meshes, `.ktx` textures and `.exr` LUTs.
- The **lock-screen wallpaper is procedural** (`scene-wallpaper.gltf`, with `sky_3k`, `hills_5k`, `dune_far_3k`, `dune_close_3k` textures and `*_color_ramp_lut.exr`, `stars_color_ramp_lut`). The desert-dunes wallpaper is rendered with colour-ramp LUTs, which allows day-to-night shifts (light: pale sand, blue sky; dark: violet dunes, starry dusk).
- Left column: glass pills (`+` icon, 17px/600 label) that expand into a card (17px/400 body with a bold lead-in).
- **"Foldable design" has a detent slider** (`role=slider`, `aria-valuenow` default `0.333` = "partially folded", 0 = closed, 1 = open; thumb 60px wide, blue `#0071e3` with a `‹›` glyph, track grey). Dragging scrubs the 3D hinge angle live: 0 is closed, outer display, portrait 9:41 lock screen; 1 is open flat, inner display, landscape 9:41 lock screen with dunes. Up/down chevrons on the left step through the pills, and a close ✕ sits top-right.
- 2D fallback stills (no WebGL): `/v/iphone-duo/f/images/overview/product-viewer/{foldable,landscape,portrait,closed,laptop(=seated),tent(=standing),display,durability}__<hash>_{small,medium,large}{,_2x}.jpg`
- Screens: `img/apple-duo-1440-2900.jpg`. Pane captures showed the closed, ⅓ and open states.

### 1.5 Media assets: URL patterns (for the unfold animation)

Apple's inline-media convention is **`<basepath>{small|medium|large}{,_2x}.mp4`** (H.264 `avc1.640034`). No `xlarge` or HEVC variants exist on this page (404). Base: `https://www.apple.com/105/media/us/iphone-duo/2026/`

| Clip | Path | large_2x specs |
|---|---|---|
| **Hero unfold (closed → rotate → open, screen lights up)** | `9305e4b9-72d9-4c05-9381-b572adadd5e5/anim/hero/large_2x.mp4` | 1932×1280, 30 fps, 91 frames, 3.03 s, 2.0 MB (large 684 KB, medium 645 KB, medium_2x 1.79 MB, small 443 KB, small_2x 1.33 MB) |
| Display: half-open V to flat, Silo playing | `9305e4b9-…/anim/hero-display/large_2x.mp4` | 3576×2000, 30 fps, 150 frames, 5.0 s, 11.9 MB |
| Versatility: laptop pose → book/StandBy → tent FaceTime | `350b2add-c10c-41d9-b8d1-e5b2204b8bcd/anim/versatility-hero/large_2x.mp4` | 2100×1296, 30 fps, 110 frames, 3.67 s, 2.8 MB |
| Design: three devices fan out (StandBy, lock screen, Duo Preview) | `350b2add-…/anim/design/large_2x.mp4` | 2544×1628, 30 fps, 80 frames, 2.67 s, 6.1 MB |
| Highlights cards | `…/anim/highlights-{display,camera,battery}/`, `350b2add-…/anim/highlights-{chip,durability}/` | |
| Camera features | `9305e4b9-…/anim/{smart-take,duo-preview,kid-cue,duo-facetime,cinematic-mode,low-light,timelapse}/` | |
| Film (HLS) | `9305e4b9-…/films/product/iphone-duo-product-tpl-us-2026_16x9.m3u8` | |
| AR model | `9305e4b9-…/ar/iPhone_Duo_e-sim_Star-White_Variant.usdz` | |
| Hero posters | `/v/iphone-duo/f/images/overview/media-hero/hero_startframe__fcol1x2us8i2_{small,medium,large}{,_2x}.jpg`, `hero_endframe__gdt3l3spaqie_*.jpg` | |
| Display posters | `/v/iphone-duo/f/images/overview/product-stories/immersive/hero-display_{startframe__r42exuol7yi6,endframe__5jdq3w2xk362}_*.jpg` | |

There are no PNG/JPG frame sequences: Apple ships **videos plus start/end-frame posters**. To scroll-scrub the unfold, extract frames yourself, e.g. `ffmpeg -i large_2x.mp4 -vf scale=1280:-1 frames/%03d.webp` (91 frames), then draw to a canvas from scroll progress. All of these are Apple copyrighted assets, so use them only as private reference or placeholders. For the portfolio, render your own device in CSS/3D.
Reference frames are saved as `img/apple-duo-hero-f{00,20,40,50,60,75,90}.jpg` and contact sheets as `img/apple-duo-*-contact-sheet.jpg`.

### 1.6 Navigation

- **Global nav**: 44px, content max 1024px (padding 0 22px). Items: Apple logo, Store, Mac, iPad, iPhone, Watch, Vision, AirPods, Home, Entertainment, Accessories, Support, Search, Bag, at 12px/400. It is absolutely positioned, not sticky, on product pages and transparent over a white page. On hover a flyout opens (mega-menu): headers 12px `#6e6e73`/`#86868b`, links with 7px 11px padding. The curtain behind is `rgba(232,232,237,.4)` + `blur(20px)` (dark: `rgba(0,0,0,.4)`). Transitions: `opacity .32s cubic-bezier(.4,0,.6,1) 80ms`; items `opacity 0→1, translateY(-4px→0)`, staggered by `--r-globalnav-flyout-group-delay`, closing at `min(.16s + 20ms*n, .24s)`.
- **Local nav (new Liquid Glass "capsule")**: `nav#localnav` sticky top, 72px tall. The inner `.localnav-wrap` is a floating capsule 1024×52, `top: 10px`, `border-radius: 18px`, `background: rgba(255,255,255,.8)`, `backdrop-filter: blur(20px)`, `box-shadow: 0 0 0 1px rgb(230,230,232)`. Left: "iPhone Duo" (19px/600). Right: an "Explore" pill (12px, white, ring `#86868b`, 61×28) and a "Buy" pill (`#0071e3`, 41×28). **Explore** morphs the capsule into a panel holding a horizontal product carousel (iPhone family thumbnails, 107×152 cards, radius 20px, paddle buttons) and **section tabs** (Highlights, Design, Cameras, Performance, Shared Features, Accessories; 17px/500, pills radius 170px, selected = `#1d1d1f` bg with white text). Timings: `--localnav-anim-duration .4s ease-out`, explore in .15s, out .1s.
- **Ribbon**: `#f5f5f7` bar, 14px text, "Learn more ›" link with chevron icon `icon-after more`.

### 1.7 Copy tone

Short, punny, two-beat headlines with a full stop: "Hello, hello.", "A new iPhone enters the fold.", "Think vast.", "Reimagined iOS. Anything's posable.", "Your new favorite camera features. Hands down.", "Power on full display.", "Power coupled.", "All the must-haves. All on iPhone.", "Whatever shape your day takes." Eyebrows are plain nouns ("Foldable design", "Expansive display", "Versatility"). Body copy is benefit-first, uses superlatives ("thinnest iPhone… largest display ever"), and carries footnote superscripts.

---

## 2. apple.com and /iphone-18-pro/: global language

### 2.1 Home (`img/apple-home-1440-*.jpg`)
- The global nav goes **dark** when the hero is dark: `rgba(29,29,31,.8)` + `saturate(1.8) blur(20px)`, links `rgba(255,255,255,.8)`.
- Tiles: full-width hero tiles 1425×692; 2-up grid tiles 695×580, **12px gutters** (`margin: 0 0 12px`), alternating `#f5f5f7` and `#000` (theme-dark). Content is centred at the top: headline 56/60/600 (-0.28px), subhead 28/32/400 (+0.196px), small tiles 40/44 and 21/25, callout 19/23 `#86868b`.
- CTAs are paired pills: primary "Learn more" (`#0071e3`, 131×44) and secondary "Buy"/"Shop"/"Pre-order" (outline; text `#0066cc` on light, `#2997ff` on dark).
- The iPhone Duo tile (`apple-home-1440-1400.jpg`) is `#f5f5f7`, headline "iPhone Duo", sub "Hello, hello." with a **typewriter or decoding effect** (DOM text "Hello, hello.Hello, Hello. hel…"; the subhead cycles through partial strings), plus a looping video of the device unfolding in hands.

### 2.2 iPhone 18 Pro (dark product page, `img/apple-18pro-1440-*.jpg`)
- Body `#000`. Sections alternate `#000` and `#1d1d1f`; the end-of-page index section is `#fafafc`, and incentive/environment sections are `#f5f5f7` (light).
- Hero: left-aligned eyebrow-super 32/36/600 "iPhone 18 Pro" and headline-elevated **80/84/600/-1.2px** "Pro further." in `#f5f5f7`. A dark glass price platter sits bottom-right (`rgba(51,51,54,.72)`).
- Type scale seen: 96/100 (xxl lockup), 64/68/-0.576px (xl lockup), 56/60 (ps-headline), 48/48 stat value (white), 40/40 stat, 28/32 card headline (`rgba(255,255,255,.92)`), 24/28 label, 21/29 copy (`#86868b`), 19/23, 17/25 body, 14/18 stat caption (`#6e6e73`), 12/16 fine print.
- Links on dark: `#2997ff`. Dot-nav dots are `rgba(255,255,255,.36)`, hover .64; the current dot is a stretched pill.

### 2.3 Footer (`img/apple-footer-1440.jpg`)
- Background `#f5f5f7`. Content 980px max (1024 incl. 22px padding), all text **12px/16px/400/-0.12px**.
- Order: footnotes block (`rgba(0,0,0,.56)` ≈ `#6e6e73`, padding 17px 0 11px, paragraphs separated by 0.8em, superscript refs) → breadcrumbs (Apple logo › iPhone › iPhone Duo) → **directory, 5 columns** (section titles 12px/600 `rgba(0,0,0,.88)`, links `rgba(0,0,0,.72)` with a 0.8em line gap; "Shop and Learn", "Apple Wallet", "Account", "Entertainment", "Apple Store", "For Business", "For Education", "For Healthcare", "For Government", "Apple Values", "About Apple") → "More ways to shop: Find an Apple Store or other retailer near you. Or call 1-800-MY-APPLE." (link `#0066cc`, padding-bottom 19px, hairline below) → legal row: "Copyright © 2026 Apple Inc. All rights reserved." + links separated by 1px `#d2d2d7` dividers (Privacy Policy | Terms of Use | Sales and Refunds | Legal | Site Map), locale "United States" on the right.

### 2.4 Link / "Learn more ›" style
17px (14px in ribbons), `#0066cc` (light) or `#2997ff` (dark), no underline (underline on hover), followed by a chevron `›` icon (`.icon-after.more`, about 0.6em, 0.3em gap). "Watch the film" uses a circled-play icon after the text.

---

## 3. iOS 27 on iPhone Duo (what to simulate)

### 3.1 Hardware facts (Apple Tech Specs 148588, Newsroom 2026-09-09)
- **Inner**: 7.6″ Super Retina XDR OLED, **1878 × 2670 px @ 430 ppi**, ProMotion 120Hz, 1600 nits HDR, 3000 nits outdoor, nano-texture cover over 10+ ultrathin layers, under-display FaceTime camera (hidden until active).
- **Outer**: 5.4″, **1398 × 2034 px @ 460 ppi**, about 90% of the 18 Pro's screen area. The front camera sits in the **top-right corner hole** (portrait), vertically aligned with the side controls.
- Aspect ratio is about **1:1.4 on both** (inner landscape 2670/1878 = 1.42; outer 2034/1398 = 1.455). Each half of the open inner display matches the outer display's proportions, which is why Split View is fixed at **50/50**.
- Logical size **(est., @3×)**: inner ≈ 890×626 pt (landscape), outer ≈ 466×678 pt. For a CSS mock, use `aspect-ratio: 1878/2670` (inner portrait) and `1398/2034` (outer).
- Body: open **164.6 × 117.8 × 5.2 mm**, closed **84.1 × 117.8 × 11.3 mm**, 254 g. Grade 5 titanium frame with a mirror-polished finish, 3D-printed titanium hinge cover, hinge with 100+ components and a magnet array, IP68, Ceramic Shield 2. Colours **Night Sky** (dark navy that reads blue-black) and **Star White** (warm ivory/champagne titanium). Accessories: Case (sand, navy blue) $79, Folio (taupe, navy blue) $129. Price from $1,999. A20 Pro, dual battery, 48MP Fusion Main + 48MP Fusion Ultra Wide (a two-lens horizontal pill plateau in the top-left of the back), 12MP outer camera.
- Crease: not visible head-on in most lighting; visible in bright sun on dark UI; you can feel it (9to5Mac review). The device rests at about 170° rather than fully flat in Apple's renders.

### 3.2 iOS 27 Duo UI system ("vertical controls")
Sources: Apple HIG *Designing for iPhone Duo* (copied at `apple-design-skill/references/hig/designing-for-iphone-duo.md`), the "Design for iPhone Duo" Tech Talk, MacRumors, 9to5Mac.

- **Closed (outer display)**: the status bar, **Dynamic Island (vertical, top-right, expands downward for Live Activities)**, toolbars and **tab bars move to the right side** in a vertical column. The content area is left. The Home Screen dock is **vertical on the right edge** (4 icons). The status bar is a **"circular, flexible system that nestles into the corner"**: time "9:41" with a ring-style Wi-Fi/battery glyph stacked under it, top-right.
- **Open, landscape (inner)**: controls stay **on the right side**, the same height as on the outer display, for continuity. The Home Screen shows **two Home Screen pages plus Today View** (a vertical widget column) **on the left**. The hero frame shows the left pane as a large Photos widget and the right pane as widgets plus a 4×4 grid, with the vertical dock at the far right. Search is a glass circle bottom-right and page dots sit bottom-centre.
- **Open, portrait (inner)**: the **only pose with standard horizontal bars**; the dock and tab bars return to the bottom.
- **Toolbar order on the vertical axis**: top = navigation (Back/Close), then the prominent action (Done), then the remaining groups. The system inserts a gap between the former top-bar and bottom-bar groups. Overflow goes into a "…" menu bottom-to-top. Text buttons and segmented controls stay in a horizontal bar near content (e.g. the Mail list's filters stay above the list pane).
- **Tab bar on the side**: in Music, New and Library live in a right-hand vertical bar. On the inner display, info-dense apps (Health) present the tab bar as a **sidebar**.
- **Split View**: swipe up from the bottom, pause in the centre, drag the app left or right; the Home Screen appears in the other half, and tapping an app fills it. Two windows of the same app work too (Safari). The split is **fixed 50/50, not resizable**. **Tap the divider to pair apps** (an "App Pair" relaunches together). Drag the divider fully to an edge to return to full screen. In Split View each app's controls sit on **its outer edge** (the left app has controls on the left). In portrait the **pinned video** sits on top while the app below resizes in real time.
- **Fold awareness**: when partially folded, the fold region becomes a reserved region. Alerts, sheets and menus slide aside so they don't rest on the fold, split views re-centre on the hinge, and grids should use even column counts. **Poses**: Closed, Open landscape, Book (partially folded landscape), Laptop/"Seated" (bottom half flat; controls on the bottom half), Tent/"Standing" (inverted V, outer display shows FaceTime or StandBy), hands-free portrait.
- **StandBy**: works on **either display, even when not charging**. Faces: clock (big analog/digital), Photos (Shared Albums), **new Calendar and Weather faces**, widgets. There is a soft-glow alarm. In the versatility video, Book pose shows the left half as a black StandBy clock face ("Wed Apr 1", large analog clock with an orange second hand, mini-month calendar) and the right half as a full-bleed photo.
- **Content continuity**: content "reacts as it folds", reorients when turned, and switches displays when flipped. The 9to5Mac review praises the "gorgeous software transition when you unfold".
- **Camera features using the outer display**: Duo Preview (subject sees a live preview), Kid Cue (playful animation draws kids' eyes to the lens), Duo FaceTime, Smart Take (auto-capture when everyone is posing).
- **Siri AI app** (iOS 27): a dedicated app with conversation cards in a 2-column masonry (see `img/apple-duo-1440-15700.jpg`: left pane cards "Weekly Priorities", "Sacred Lotus", "Niagara Falls Activities"; right pane Mail with a vertical glass toolbar: back, up/down group, trash/folder group).

### 3.3 Liquid Glass (iOS 26 to 27) recipe

- **Two layers only**: content (never glass) and a functional layer (tab bars, toolbars, sidebars, sheets, popovers, alerts) that floats in **Liquid Glass**. Glass has **no colour of its own**: it blurs and adjusts the luminosity of what is beneath. Labels are monochrome and flip dark or light based on the backdrop luminance.
- **Variants**: *Regular* (most UI and text-heavy surfaces) and *Clear* (over photos/video; add a **35% black dimming layer** if the content is bright; this is the one number Apple publishes).
- **iOS 27 changes**: "more uniform refraction and improved contrast". A **Liquid Glass slider** in Settings › Appearance goes from "ultraclear to fully tinted". App icons are sharper. Icon styles are Default, Dark, Clear (all-glass) and Tinted.
- Visual traits: **lensing/refraction at the rim** (content bends at the edges), **specular highlights** that move with device tilt, soft adaptive shadow, capsule and concentric radii (corner radius = device radius minus inset), **morphing** between shapes (tab bar ↔ segmented control; buttons merge in a `GlassEffectContainer`). Tab bars **minimise on scroll** (Safari collapses to just the URL). A **scroll-edge effect** blurs and fades content under bars instead of using a solid bar background.
- **Web recipe** (from the curated skill guide plus kube.io):
  ```css
  .glass{ /* regular */
    background: rgba(255,255,255,.62);            /* 60–80% (dark: rgba(30,30,32,.6)) */
    backdrop-filter: blur(24px) saturate(1.4);   /* regular 20–40px, clear 8–16px; saturate 1.2–1.5 */
    -webkit-backdrop-filter: blur(24px) saturate(1.4);
    border-radius: 999px;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.75),       /* top specular rim */
      inset 0 -1px 0 rgba(255,255,255,.18),
      inset 0 0 0 .5px rgba(255,255,255,.35),    /* hairline */
      0 8px 24px rgba(0,0,0,.12);                /* lift */
  }
  .glass.clear{ background: rgba(255,255,255,.18); backdrop-filter: blur(10px) saturate(1.5); }
  @media (prefers-reduced-transparency: reduce){ .glass{ background: rgb(242,242,247); backdrop-filter:none } }
  ```
  For true **refraction** (Chromium only), use `backdrop-filter: url(#lg)` with an SVG `feDisplacementMap`. Generate the displacement map from a **convex squircle bezel** `y = (1-(1-x)^4)^(1/4)` with Snell refraction (n = 1.5), and encode X/Y in R/G (128 = neutral). `scale` = max displacement in px. Add a specular rim via a second `feImage` + `feBlend` (opacity 0.2–0.5). Optionally run three displacement passes per RGB channel for chromatic fringing. Fall back to the CSS-only recipe in Safari and Firefox. Animate only `scale`, because rebuilding the map is expensive.

### 3.4 Photos app (iOS 26/27)
- The **tab bar returned**: a floating glass capsule with two tabs, **Library** and **Collections**, plus a **separate circular glass Search button** at the bottom-right.
- When you scroll up in Library, the tab bar **morphs into a glass segmented control: Years | Months | All**. The search button stays. Glass Select and "…" buttons sit top-right over the grid. Collections are expandable/collapsible sections (Memories, Pinned, Albums, People & Pets, Trips, Utilities).
- iOS 27 additions: star ratings (1–5) and keywords, extract a video frame as a still, Spatial Reframe, enhanced Clean Up, Extend, two new Utilities folders, and loading up to 70% faster.
- On Duo (inner, landscape) the tab bar becomes a vertical side bar or sidebar per the HIG.

### 3.5 Default wallpapers
- The **iPhone Duo / iOS 27 default** is **desert dunes in front of a mountain range**. Light: pale sand, hazy mountains, soft blue morning sky. Dark: violet dunes, dark mountains, starry dusk sky with a pink horizon. It ships in 1398×2034 (outer) and 2670×1878 (inner) light/dark variants (about 4–8 images; iClarified and iGeeksBlog host them). Apple's 3D viewer renders it procedurally with colour-ramp LUTs (sky, hills, far dunes, near dunes, stars). The lock screen uses a giant, tall, condensed "9:41" over the sky with the date ("Wed Apr 1") above; on the outer display a flashlight icon sits bottom-right and a camera icon sits on the side column.

---

## 4. Apple Design Skill (github.com/dickwu/apple-design-skill)

The full copy is at **`docs/research/apple-design-skill/`** (SKILL.md, README.md, AGENTS.md, GEMINI.md, `references/` with 124 HIG pages including **`hig/designing-for-iphone-duo.md`** (Apple, 2026-09-09) and the curated **`hig/liquid-glass.md`**, `code-audit.md`, `cross-platform.md`, `hig-lookup.md`, `scripts/pull-hig.mjs`). Repo HEAD: `ff4ebdd` (HIG refresh 2026-10-28).

Rules worth enforcing in this project:
- **Type minimums**: mobile default 17pt, minimum 11pt. Contrast is 4.5:1 for text ≤ 17pt and 3:1 for ≥ 18pt or bold. Touch targets are 44×44pt by default with a 28pt minimum.
- **Liquid Glass** goes on the functional layer only. Keep custom glass surfaces few. Use one, at most two, tinted primary actions per view. Colour the *background* of the primary action, not its label. Use a scroll-edge effect instead of a solid bar. Honour Reduce Transparency (opaque fallback), Increase Contrast and Reduce Motion (no morph or refraction animation).
- **Duo specifics**: build from size classes (compact = outer, regular = inner). Put bars on the vertical axis except in inner portrait. Order toolbars top-down: Back/Close, then the prominent action, then groups. Give every toolbar item both a title and a symbol. Keep interactive elements off the fold when partially folded. Make "Arrangement views" (split or overlay) adapt to the fold. Prefer even grid columns. Avoid extreme relayout while folding ("favor small adjustments").
- **Craft lens**: one signature element, with everything else quiet. Avoid the three "AI-template looks" (cream + serif + terracotta; near-black + one acid accent; hairline broadsheet). Use numbers, not adjectives.
- Eight principles (June 2026): Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, Delight.

---

## 5. quynh.moe: portfolio study

> **Note:** the live site (Quynh Cao "Zizi" Folio, 2026) is **not a phone/OS simulation**. It is a **two-panel "dual-screen" app shell**, and that maps well onto a Duo inner display (left pane = context, right pane = content). Its patterns are listed below because they transfer directly.

**Stack**: Vite SPA (React-style chunks `index-*.js` and `Home-*.js`), **GSAP 3.15.0** and **Lenis 1.3.26** (`window.lenis`, default options). Fonts are **Helvetica Now Display** (UI and headings) and **JetBrains Mono** (12px uppercase labels). Colours: page `#e6e1df`, panels `#fff9f7`, ink `#1a0902`, accent orange about `#ff5a17`.

**Layout**: `documentElement.scrollHeight = 900` (no page scroll). Two `section.panel`s are inset **8px** from the viewport with an **8px gap** and `border-radius: 8px`. The left panel is 593×884 (≈ 41%), the right 823×884. Scrolling happens inside the right panel (Lenis-driven).

**Intro / loading** (`img/quynh-intro-sequence.jpg`, times from navigation):
1. 0–0.9 s: `#0a0a0a` screen with a centred line-drawn black cat (Kiki's Jiji) that blinks.
2. ~2.0 s: labels split out of the cat, "(20 ZIZI" sliding left and "26) FOLIO" sliding right, in orange mono.
3. ~3.2 s: the cat is gone and "(2026) ZIZI FOLIO" collapses to the centre.
4. ~4.5 s: an **orange full-screen fill with two cream panels torn open** (rough, paper-tear edged mask) wipes vertically to reveal the layout.
5. ~7 s: home. Thumbnails cascade in as a vertical stack (stagger ≈ 0.018–0.06 s), and the cookie toast arrives bottom-centre.

**Home (Work)**:
- The **right panel is a vertical one-at-a-time project reel**. The centred project is large (≈575×640). Previous and next appear as small thumbnails (≈170×120) peeking at the top and bottom edges. Wheel input moves to the next item (smooth, lerped). The index ("03") sits at left mid-height and the year ("2021") at right, both mono.
- Over the media, a **slot-machine title stack**: category in the left column and project name in the right ("Mobile Application ═ Monster Chat App"), with the neighbouring items' names dimmed above and below. On scroll the stacks roll vertically.
- **Idle/hover expand**: about 1 s after scrolling stops, or on hover, the centred media **expands to fill the entire right panel** (full-bleed, 8px radius, ≈ 0.6–0.7 s power3.inOut). It shrinks back when you scroll.
- The **left panel is ambient**: the location "NAM DINH, VIETNAM" at top (mono 12px) and a big clock "13:19" (44px/600). **Each elapsed second adds a radial line plus a numeric tick** fanning around the clock (00–59). It resets at the minute with a quick collapse. Bottom: "INVERT COLOR" toggle and "SOUND:" toggle with a waveform glyph (UI sounds).

**Navigation / page transitions**: top-right nav WORK · ABOUT · PLAYGROUND (mono 12px) and an email link with ↗.
- Switching pages animates **both panels independently**. The left content fades and greys out (≈ 0.3 s) while the new heading rises in line by line through a mask. Example: "Playground" (72px/600/-2px) with a huge odometer counter "23"/"34" (160px) rolling digits. About: "A bit more about myself" (≈ 56px) with the left panel typing **"Beyond the screen…" along a diagonal path, letter by letter**. The right panel cross-fades its background (white ↔ `#e6e1df`) and lays out new content (Playground = masonry of 4 columns with 8px gaps).
- **Project detail = shared-element hand-off**. Clicking the expanded media keeps it as the right-panel hero (no flash). The **left panel recolours to a project tint** (e.g. `#e9f4ff` for Travala) and shows the title (≈ 56px/600), then a **definition table** (INFO / YEAR / CATEGORY / CLIENT / INDUSTRY, mono labels, 1px hairline rows) whose values **scramble-decode** in (random glyphs resolving over about 0.5 s, stagger 0.018 s/char). The right panel then scrolls through case-study images (gallery tiles 8px radius). A small ✕ close button sits bottom-right. The document title becomes "Travala Travel — Web App Design" (a client-side route change; the exact slug was not captured).
- **Mobile** (390w, `img/quynh-mobile-t7000.jpg`): a single column of centred images and a **bottom floating glass toolbar** (grid icon + "WORK" label, clock, sunrise/theme, menu) with radius ≈ 14px.

**Motion vocabulary in the bundle** (count of uses): `power2.out` ×28, `power2.in` ×15, `power3.inOut` ×12, `sine.inOut` ×10, `power3.out` ×10, `power4.out` ×9, `back.out(2–3)`, `elastic.out(1,.4–.5)` (playful UI), `expo.out`. Durations cluster at **0.5 s** (×20), 0.6, 0.45, 0.35, 0.3, 0.7, 1.0–1.1, 1.8 (intro). Staggers: **0.018** (chars), 0.04, 0.05–0.075.

**Patterns to transfer to the Duo sim**: (1) a two-pane shell where the left pane is ambient context and the right pane is content, which is exactly the inner-display Split View; (2) wheel input stepping a reel with lerp; (3) idle auto-expand of the focused item; (4) a shared-element open into a detail view with the left pane recolouring; (5) scramble-decoded metadata; (6) a live clock with second ticks as "life".

---

## 6. Animation references

### 6.1 oryzo.ai (Lusion, "ORYZO — AI-powered cork coaster")
- **Stack**: Astro, plus one big hoisted bundle (1.1 MB) with **three.js** (WebGLRenderer, `postprocessing`), **GSAP SplitText** (lines, chars, words with `mask:"lines"`/`"chars"`), GSAP **Flip** and **Observer**, **Rive** (`/rive/oryzo.riv`), and MSDF text. Scroll uses a **custom scrollManager** with normalised wheel (`normalizeWheel`) and lerped virtual scroll. Animations are **pure functions of scroll progress**: `math.fit(progress, start, end, from, to, ease)` with ease functions such as `cubicOut` (×52), `smoothstep` (×66), `backOut` (×14), `cubicInOut` (×12) and `expoOut` (×10). There are no tweens for scroll content.
- **Intro** (`img/oryzo-intro-*`): olive `#4f5f3e` field. A **vector-drawing animation** (Illustrator-style bezier handles and anchor points in orange) constructs the coaster ring; the ring fills; then a **cut to a photoreal 3D cork coaster on a cutting mat** (shallow depth of field), with the camera pushing in.
- **Scroll story** (`img/oryzo-scroll-*`): dark brown `#1c140f` stage with a warm radial glow. The coaster rotates in 3D (tilt to face-on). Headline "ISN'T JUST A COASTER." (uppercase, condensed) on the left and copy on the right. "Powered by AI*" reveals by chars. A **fullscreen RGB edge-glow** frame (cyan → magenta → orange gradient border, like Apple Intelligence's Siri glow) pulses in. A 3D hand holds the coaster. Nav dots and a scroll progress bar sit on the right edge.
- **Text reveal recipe (from code)**: for char i of N, `opacity = fit(p, .5 + i/N*.2, 1.5 + i/N*.2, 0, 1)` and `blur(fit(...)px → 0)`; lines `translateY(fit(...)·-1em)` with cubicOut. Exits are mirrored with `fit(p2, I*.2, I*.2+.8, 1, 0)`. In other words, **overlapping per-char windows (20% spread) give a scroll-scrubbed stagger**. Nav items: `fit(t-.5, c*.3, c*.3+.6, 1, 0, cubicOut)`.
- **Feel**: heavy smoothing (lerp ≈ 0.08–0.1), cinematic, all scrubbed, product-hero camera moves, film grain and bloom.

### 6.2 igloo.inc (Abeto, Igloo Inc.)
- **Stack**: Vite loader (6 KB) → `App3D-*.js` (1.5 MB) with **three.js** (`__THREE__`) and **GSAP**. *Everything renders in WebGL*, including UI text (IBM Plex Mono via MSDF data textures). Geometry is Draco `.drc` (igloo, mountain, shattered rings, Pudgy Penguin, smoke trails), textures KTX2. There are volume textures (`peachesbody_64.ktx2`), a fluid sim (velocity/dye shaders), caustics, bokeh and blue noise. Page height = viewport: a **virtual scroll** driven by the `wheel` event (`passive:false`, deltaY accumulated and lerped).
- **Intro** (`img/igloo-intro-*`): pale cold grey `#a5a9b2`. Tiny mono "LOADING…" with a dot progress, then the **igloo wireframe outline draws in**, then a camera fly-in to a photoreal snowy igloo on a mountain at dusk.
- **Scroll** (`img/igloo-scroll-*`): each scroll step is a **camera/scene transition**. The igloo **explodes into ice blocks**; portfolio items appear as objects **frozen inside ice crystals** with HUD callouts (mono labels such as "PORTFOLIO_CO_01 PUDGY PENGUINS", leader lines, coordinates, "CLICK TO EXPLORE"). A **frosted shattered-ring** portal (fisheye lens distortion) leads to a stage with a fur-shaded Pudgy Penguin on a glowing platform ("LinkedIn" link). Ends with an ice ring logo.
- **Motion values**: eases `none` ×37 (scrub), `sine.out` ×22, `power2.out` ×16, `power2.inOut` ×16, custom `inOut1/inOut3`; durations 0.4, 1.25, 2, 2.5, 3 s (slow, glacial camera moves). Sound toggle "Sound: OFF" bottom-left.
- **Feel**: one continuous 3D world, scroll = camera dolly. Frost and shatter transitions take about 1.25–3 s with sine/power2 ease. HUD typography stays tiny (≈ 10–11px mono, wide tracking).

### 6.3 yaas-energy.com (YAAS zero-sugar energy)
- **Stack**: Vite + React chunks, **GSAP 3.15 + ScrollTrigger + ScrollSmoother/normalizeScroll + Flip + Observer**, **Lenis** `{lerp: 0.1, wheelMultiplier: 1, autoRaf: false}` driven by `gsap.ticker.add(t => lenis.raf(t*1000))` with `gsap.ticker.lagSmoothing(0)` and `lenis.on('scroll', ScrollTrigger.update)`. 3D cans run on **OGL** (`/models/can.glb`, `useCanMaterials`, `renderOnDemand`). Rive is also present. Fonts: **Soledago** (psychedelic display), **Bounded**, Helvetica Neue.
- **Intro**: a coral-gradient screen with the "LOADING ENERGY" wordmark and a % counter bottom-centre (0→100). Then a soft **mesh gradient** (pink → orange → yellow, blurred blobs) with a huge white "YAAS" wordmark; **3D cans fly in** from the corners, rotating, overlapping the type.
- **Scroll mechanics (from code)**:
  - Pinned sections use `start: "top top"`, `end: () => "+=" + N*innerHeight`, `scrub: true`, `pin: true`, `invalidateOnRefresh: true`. The scroll length is expressed in viewport multiples.
  - **Card stack** (photo deck): pinned timeline where card g goes `y → fr`, `rotate: ±xt` (alternating sign), `ease: "power2.inOut", duration: 1` at position g, plus `opacity → 0, duration: .35, ease: "power1.in"` at g+0.65. Cards are stacked with `xPercent:-50` and descending zIndex.
  - **Flavor carousel** ("5 FLAVORS. 1 ENERGY.", Wild Strawberry): snap `{snapTo: 1, directional: true, delay: 0.08, duration: {min: .2, max: …}, ease: "none"}`. The background colour floods per flavour.
  - "THIS ISN'T ABOUT HYPING YOU UP…": a **3D curved carousel of photos** (cylindrical arc, cards rotateY toward the edges) scrubbed horizontally.
  - Lifestyle images then scale from card to **full-bleed** with a caption ("HANGING WITH THE SQUAD", "ROAD TRIP / FESTIVAL RUN").
  - Tweens: `power3.out` (most), `power2.inOut`, durations 0.6, 0.75, 1, 1.15 s.
- **Feel**: loud, bouncy, colour-flood transitions, everything pinned and scrubbed under a Lenis lerp of 0.1.

### 6.4 cornrevolution.resn.global (Resn for Pioneer/Corteva)
- **Stack**: webpack `loader.*.js` (420 KB) from CloudFront, **GSAP v2 (TweenMax/TimelineMax, `Power3.easeOut/easeIn`)**, and a custom WebGL engine (three/ogl-style) with **MSDF fonts** (`gilroy-msdf.png`, `manifold-msdf.png`, `gradient-map.png`) and a post-noise texture. Page height = viewport (**virtual scroll**). Fonts: Gilroy (body) and Manifold CF Extra Bold (uppercase display).
- **Intro**: black, with an **outline-stroke Pioneer logo drawing on** plus a "9% … 91% Loading your experience" counter (centred, small).
- **Scroll story** (`img/corn-*`): chaptered scenes, each a 3D set. "FIRST, A SOLID FOUNDATION." over **glowing orange DNA-like particle ribbons** with hotspot dots. "OUR BREEDERS DIAL IT IN FURTHER." over a **cut-away pot with a seedling and its roots growing** (scroll-scrubbed growth). "LESS THAN 0.01% OF SEEDS MAKE IT." over a macro kernel with a constellation of points and an orange nebula sky. A circular "EXPLORE THE ___" hotspot button and section labels ("SCIENCE", "RESULT") sit on the right with a circular progress icon.
- **Feel**: documentary, scroll = time-lapse. Headlines are uppercase, 3 lines, left-aligned at about 40% height, with Power3.easeOut reveals (lines up about 40px, about 1 s, stagger about 0.1 s). Deep teal/green to orange colour grading.

### 6.5 Synthesis: motion language for the Duo portfolio
- **Smooth scroll**: Lenis `{lerp: 0.1, wheelMultiplier: 1}`, ticked by GSAP (`lagSmoothing(0)`), as on YAAS and quynh.
- **Apple-grade reveals**: `y: 30 → 0` over 0.7 s plus opacity over 0.9 s, easeInOutQuad, stagger 0.15 s, triggered at 85vh. Big headline lines can use the Oryzo per-char blur-to-sharp (`blur(8px) → 0`, 20% window spread) for signature moments only.
- **Hero unfold**: pin for about 250–300vh. Scrub progress drives (a) device yaw 0→180→360°, (b) hinge angle 0→170°, (c) scale 1→1.9, (d) inner screen brightness 0.4→1 with the left widget blur 24px→0 near the end (frames 60–90 of Apple's clip). Use `ease: "none"` on the scrub plus Lenis smoothing; inner segments with `power2.inOut`.
- **Pinned scenes** as in YAAS: `end: "+=" + n*innerHeight`, `scrub: true`, snap `{snapTo: 1, directional: true, delay: .08}` for pose stops (Closed, Book, Laptop, Tent, Open).
- **In-device interaction**: quynh-style shared-element open (≈ 0.6 s `power3.inOut`), panel recolour, scramble text 0.018 s/char. Use `elastic.out(1, .45)` and `back.out(2)` sparingly for app-icon taps (iOS spring feel; Apple's springy beziers are `cubic-bezier(.34,2.16,.64,1)` and `cubic-bezier(.3,2,.5,1)`).
- **Nav and system chrome**: `cubic-bezier(.4,0,.6,1)` 320 ms (Apple nav) for all glass bars.

---

## 7. Source links
- https://www.apple.com/iphone-duo/ · https://www.apple.com/iphone-18-pro/ · https://www.apple.com/
- https://www.apple.com/newsroom/2026/09/apple-unveils-iphone-duo/ · https://support.apple.com/en-us/148588 (Tech Specs)
- https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo · https://developer.apple.com/videos/play/tech-talks/111466/
- https://www.macrumors.com/roundup/iphone-duo/ · https://www.macrumors.com/2026/09/23/iphone-duo-split-view-not-like-ipad/ · https://9to5mac.com/2026/10/21/iphone-duo-review/
- https://support.apple.com/guide/iphone/open-two-apps-in-split-view-on-iphone-duo-iphrj13y9uxz/ios
- https://www.apple.com/os/ios/ · https://www.macrumors.com/guide/ios-26-liquid-glass/ · https://www.macrumors.com/guide/ios-26-photos-app/
- https://kube.io/blog/liquid-glass-css-svg/ (refraction recipe)
- https://www.iclarified.com/102102/download-the-official-iphone-duo-wallpaper-here (wallpapers)
- https://github.com/dickwu/apple-design-skill
- https://quynh.moe · https://oryzo.ai · https://www.igloo.inc · https://yaas-energy.com · https://cornrevolution.resn.global
