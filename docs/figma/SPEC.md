# iPhone Duo (iOS 27) — Figma extraction spec

Source files (all Figma Community files, read-only):
- `MYoVvRzgOffiHOtpt0deLl` iPhone Duo Adaptive Design Starter Kit (guides, device frames)
- `DcC3DYSgdWGYJ9TSnTfVV8` iPhone Duo — iOS 27 UI Kit (templates/examples)
- `m1HrvkXWEUivJMitx97Xw0` iPhone Duo Mockup — iOS 27 UI Kit (components + bezels)
- `WFmP9mvR5sdv4RDihSJZrL` iPhone Duo — Free Mockups (photoreal frames, home screen folded, wallpapers)
- `JUa8y8QI0Xm2jdd1DNraT9` iPhone Duo UI Kit (sheets, keyboards, status bar, top bars)
- `4QZO7WH9bXIib2pQGIhAMg` "Untitled" (iPad + iPhone Duo examples: Control Center, Home Screen)
- `OLXsdMeFr86lB219iJCYNe` Apple Photos · iOS (older iOS reference)

## 0. Read this first: how the numbers were obtained

**The Figma MCP Starter-plan limit was reached early in this session.** Only about 15 MCP calls succeeded across all agents, most of them `get_metadata`. One `get_design_context` returned full styles (Device Anatomy 96:206) and one returned a single mockup export (7774:3410).

Everything else came from the files opened anonymously in the browser:
- raw image fills (frames, masks, wallpapers, app icons, bezels) were downloaded at full original resolution from Figma's image CDN
- layouts were measured by eye from canvas screenshots

Provenance tags used below:
- **[F]** exact Figma value, from MCP metadata or design context
- **[A]** measured from a downloaded asset's pixels (exact for that asset)
- **[V]** measured visually from a canvas screenshot. Expect about ±2 pt.
- **[HIG]** standard Apple iOS value, not read from these files. Use it as the default where Figma gave nothing.
- **[I]** inferred or recommended. Not in Figma.

What could **not** be extracted: no liquid-glass effect values (blur, fills, strokes), no text styles or variables, no color tokens. The one exception is a few doc tokens, listed in §3.1. None of the PNG canvas screenshots the brief asked for exist on disk, beyond the two mockup exports listed in §6.

---

## 1. Device geometry

### 1.1 Displays [F] (Device Anatomy 96:206, "Official" per Apple per the kit)

| Display / pose | Logical size (pt) | Pixels | Size class | Bars |
|---|---|---|---|---|
| Outer, portrait (closed) | **466 × 678** | 1398 × 2034 (@3x) | Compact width | Vertical rail on the trailing side |
| Outer, landscape | 678 × 466 | 2034 × 1398 | Compact width | Vertical rail on the same edge as the camera |
| **Inner, landscape (open, natural pose)** | **951 × 669** | 2670 × 1878 (≈2.807 px/pt) | Regular × Regular | Vertical rail on the trailing side |
| Inner, portrait | 669 × 951 | 1878 × 2670 | Regular × Regular | Horizontal bars, top and bottom |

- The inner wallpapers in Figma are exactly 2670×1878 px [A] and the outer ones 1398×2034 px [A]. These match the table.

### 1.2 Hinge, crease and fold [F]

- **Inner landscape:** the hinge is a vertical line at **x = 475.5 pt**, the exact centre (951/2). It splits the display into a leading pane and a trailing pane.
- **Inner portrait:** the hinge is a horizontal line at **y = 475.5 pt**.
- **Flat:** the division region is inactive and has zero width. Treat the display as one surface.
- **Partly folded (book or tabletop):** the division region becomes active. System components move away from the fold.
- **Recommended avoidance band:** **27 pt centred** on the fold (x 462–489), tagged "Recommended" in the kit.
- **Visual crease for the web clone [I]:** a 1 px line with very subtle shading at x = 475.5, for example a `linear-gradient` of `rgba(0,0,0,.04)` to `rgba(255,255,255,.04)` about 6 pt wide. Optional.

### 1.3 Safe areas and system regions [F]

- **Outer display:** the safe area is **84 pt trailing** and 0 on the top, bottom and leading edges. The 84 pt column is the vertical bar (rail).
- **Inner landscape:** the same 84 pt trailing rail (pane controls). The content area is 867 × 669.
- **Inner portrait:** horizontal bars. The top toolbar is **82 pt** tall; the status bar is inside it, using the horizontal variant (104×48).
- **Outer camera:**
  - Always present, as a round punch-out of **43 × 43 pt**.
  - It sits inside a 95 × 95 "Lens" zone at the top-right corner: x 371–466, y 0–95 in outer portrait.
  - Its centre is ≈ (418.5, 45.5).
  - In outer landscape the lens zone is at the bottom-right (x 583, y 371) and the punch-out is 24 pt above the bottom edge.
- **Inner camera:** hidden under the display until it is active. Nothing to draw.

### 1.4 Bezel and frame

**A. pt-exact UI-kit bezels (best for building the clone)** [F][A]. These come from `m1Hr…` 2032:3900 and are in `assets/bezels/`.

| Bezel | Size (pt) | @3x PNG (px) | Screen hole (pt) | Bezel thickness (pt) |
|---|---|---|---|---|
| Inner landscape | 1031 × 749 | 3093 × 2247 | x 40, y 40, 951 × 669 | **40 on every side** (this includes the drop-shadow and metal rim) |
| Outer portrait | 524.67 × 731.33 | 1574 × 2194 | x 29.33, y 26.67, 466 × 678 | 29.33 left/right, 26.67 top/bottom |

- The screen area is already transparent. Both come in Star White and Night Sky.
- The outer bezels have the camera punch-out painted in. The camera dot is opaque black, so put the bezel PNG **above** the screen layer.
- **To use one:** `position:absolute; left:-40pt; top:-40pt; width:1031pt` around a 951×669 screen. For the outer bezel: `left:-29.33; top:-26.67; width:524.67`.

**B. Photoreal mockup frames (best for the portfolio hero)** [A]. These come from `WFmP…`. Screen holes were cut out using the file's own screen masks.

| File (`assets/`) | px | Screen rect in PNG (x, y, w, h) | % of PNG (L / T / W / H) |
|---|---|---|---|
| `frame-open-landscape-{starwhite,nightsky}-transparent.png` | 3951 × 2815 | 83, 93, 3774, 2640 | 2.101 / 3.304 / 95.520 / 93.783 |
| `frame-open-portrait-{starwhite,nightsky}-transparent.png` | 2060 × 2892 | 68, 69, 1932, 2762 | 3.301 / 2.386 / 93.786 / 95.505 |
| `frame-folded-front-starwhite-transparent.png` | 2035 × 2813 | 111, 76, 1848, 2672 | 5.455 / 2.702 / 90.81 / 94.99 |
| `frame-folded-front-nightsky-transparent.png` | 2037 × 2815 | 112, 76, 1850, 2674 | 5.498 / 2.700 / 90.82 / 94.99 |

- **Scale:** ≈ 3.967 px per display pt for the landscape and folded frames, and 2.885 px/pt for the portrait frame.
- **Folded frame:** the left (hinge) inset is larger because the spine is visible.
- **Masks:** each frame has a matching screen mask with the same crop and size, usable as a CSS `mask-image`:
  - `screen-mask-open-landscape-cropped.png`
  - `screen-mask-open-portrait-cropped.png`
  - `screen-mask-folded-front-cropped.png` and `screen-mask-folded-front-nightsky-cropped.png` (these include the camera hole)
- **Angled views:** none exist in any of the files. The only non-front image is a hand-held front view (`mockups-raw/cover-hand-held-folded-2880x1620.png`, RGB, white background).

### 1.5 Display corner radii [A/V]

| Corner | Radius | Notes |
|---|---|---|
| Inner display, all 4 corners | **≈ 40 pt**, continuous (squircle) | Mask corner run ≈ 60–67 pt [A]. The kit schematic gives 38.5 pt [F-derived]. |
| Outer display, trailing (right) corners | **≈ 40–42 pt**, continuous | Mask run ≈ 64 pt [A]. |
| Outer display, hinge-side (left) corners | **≈ 5–7 pt** | Mask run 7–10 pt [A]. |
| Outer display, CSS sketch | `border-radius: 6pt 41pt 41pt 6pt` | |
| Device body corners | ≈ outer screen radius + bezel | |

### 1.6 Frame colours [A] (sampled from the renders)

| Finish | Sampled colours |
|---|---|
| Star White, outer metal | rgb(192,191,188) highlight, rgb(117,115,111) mid, rgb(74,72,69) shadow. Warm grey. |
| Night Sky | Blue-grey. Rim average rgb(64,76,95); rim highlights ≈ rgb(86,92,106). |
| Display border (black mask) | #000. Visible as a 1–2 pt black ring inside the metal. |

---

## 2. Home screen layout

The source files only include the **outer (folded)** home screen. The Free Mockups file marks the inner "Home Screen – Portrait/Landscape" boards as **"Soon"** (empty). The inner home spec below is therefore derived (§2.3).

### 2.1 Outer home screen, variant A: labelled grid (`4QZO…` 1:2834, 466 × 678) [V]

**Grid**
- 4 columns × 6 rows of app icons with labels. The row-6 icon "My App" carries a red badge "67".
- Icon size: **≈ 58–60 pt**.
- Column pitch **87 pt**. Row pitch **98 pt**.
- First icon left edge **≈ 27 pt**. First row top **≈ 57 pt**.
- The icon grid spans x 27–350.

**Labels**
- ≈ 12 pt, SF Pro Text Regular, white, centred under the icon, about 6 pt gap.
- No visible text shadow. On the light wallpaper they rely on a subtle shadow; use `0 0 2px rgba(0,0,0,.25)` [I].

**Dock (vertical, on the right, inside the rail area)**
- Glass capsule **≈ 71 × 257 pt** at x ≈ 377, roughly vertically centred (y ≈ 254–511).
- 4 icons (Phone, Safari, Messages, Music), each **48 pt**, at a **63 pt** vertical pitch.
- Corner radius: full capsule, ≈ 35 pt.
- Fill: translucent dark glass over the wallpaper.

**Rail** (same column, top to bottom)
1. Camera punch-out 43 pt
2. "9:41" (≈ 15 pt semibold, white)
3. Wi-Fi glyph inside a thin ring (≈ 30 pt circle)

### 2.2 Outer home screen, variant B: widgets, no labels (`WFmP…` 10101:456 "Home Screen – Folded", light and dark) [V]

The same layout appears in the cover render (`mockups-raw/cover-hand-held-folded-2880x1620.png`).

**Widgets (top row)**
- Two **small widgets of ≈ 159 × 159 pt**, the size of 2×2 icons: a Weather widget and a Maps widget.
- Positioned at y ≈ 75 pt, x ≈ 20.6 and ≈ 202 pt. The gap between them is ≈ 22 pt.
- Widget corner radius **≈ 22–24 pt** (continuous).
- **Weather widget:**
  - Background: blue vertical gradient, ≈ #4A7FC1 → #2D5DA0 [V].
  - Text "San Francisco ➤" 11 pt semibold, "53°" ≈ 34 pt regular, a sun glyph, "Sunny", "H:56° L:50°" ≈ 11 pt.
  - All text white, left-aligned with a 12 pt inset.
- **Maps widget:** a map image (`assets/widgets/maps-widget-sf-512.png`) with a blue location dot.

**Icons**
- 4 columns × 4 rows, **no labels**.
- Icon size **≈ 68 pt**. Column pitch **≈ 90.5 pt** (gap ≈ 22 pt). Row pitch **≈ 92 pt**.
- First icon left edge ≈ 20.6 pt. First icon row top ≈ 258 pt.

**Dock**
- Vertical glass capsule **≈ 68 × 262 pt** at the right, starting at y ≈ 248.
- Four 49 pt icons at a 64 pt pitch.
- Light mode: the dock looks like dark translucent glass, ≈ rgba(40,40,40,.35) plus blur [V].

**Rail**
- Top: camera, then 9:41, then the Wi-Fi ring.
- Bottom: a **search button** (≈ 36 pt glass circle with a magnifier) at y ≈ 630, centred in the rail.
- Page dots: 2 dots, centred horizontally at the bottom of the grid area, ≈ 6 pt dots with 8 pt spacing. The active dot is white, the inactive one white at 40%. Visible in the cover render.

**Icon artwork** [A]
- `assets/icons/*.png` are 256×256, already masked (transparent corners).
- Corner shape ≈ continuous radius **22.5% of the icon size**. In CSS use `border-radius: 22.5%`, or no radius at all since the art is pre-masked.

### 2.3 Inner home screen (951 × 669, landscape): derived [I]

This was built from the outer layout rules, plus the iPad iOS 26-style example (`4QZO…` 1:2072) and the rail spec.

**iPad reference, measured [V]** (1210 × 834)
- 6 columns, column pitch 164 pt, row pitch 122 pt, icons ≈ 68 pt, ≈ 11 pt labels.
- Page dots ≈ 157 pt above the bottom.
- Dock: a horizontal glass dock **738 × 104 pt**, bottom-centred, 28 pt from the bottom, with 66 pt icons.

**Recommended inner layout**
- **Rail:** trailing, 84 pt wide (x 867–951). It holds:
  - the status bar (vertical) at the top
  - the **vertical dock** (same glass capsule as the outer screen, 4–6 icons, 48–56 pt, 63 pt pitch), vertically centred
  - the search button near the bottom
- **Grid area:** x 0–867. Keep icons out of the 27 pt band at x 462–489 so no icon straddles the hinge.
  - **Suggestion:** two 4-column blocks, one per half, matching the outer screen's 4 × 6 at 87 × 98 pitch.
  - Or 8 columns: icons 64 pt, column pitch ≈ 100 pt, left margin ≈ 40 pt, rows at 104 pt pitch, 5 rows.
- **Widgets:** small 159 × 159, medium 340 × 159, large 340 × 340 (by the iPhone 2×2 / 4×2 / 4×4 rule at this pitch).
- **Page dots:** centred in the grid area (x ≈ 433), about 20 pt above the bottom.
- **Wallpaper:** `wallpapers/inner-landscape-{light,dark}-2670x1878.png`, cover-fit to 951 × 669.

### 2.4 Wallpapers [A] ("Dunes" — sky, mountains, sand dune; light = daytime, dark = night with stars)

| Use | File |
|---|---|
| Outer screen, exact resolution | `wallpapers/outer-{light,dark}-1398x2034.png` |
| Inner landscape, exact resolution | `wallpapers/inner-landscape-{light,dark}-2670x1878.png` |
| High-res sources | `wallpapers/wallpaper-dunes-{light,dark}-portrait-*.png` (2766/2797 × 4000) and `wallpaper-dunes-{light,dark}-landscape-4000x2799.png` |

---

## 3. iOS 27 UI language

### 3.1 Tokens actually present in the files [F]

| Token | Value |
|---|---|
| `fills/secondary` | `rgba(120,120,128,0.16)` |
| Glass background style name (on sheets) | "Liquid Glass – Regular – Medium". Its effect values were not readable. |

The doc tokens (`#0e0e0c`, `#2d6bff`, `#ff5b1a`, Inter, SF Compact Text 11 pt) belong to the starter kit's documentation pages, not to iOS.

### 3.2 Liquid glass recipe [I], approximated to match the renders (Figma values unavailable)

```css
/* Regular glass (buttons, rail capsules, tab bar, dock, sheets) */
--glass-bg-light: rgba(255,255,255,0.22);
--glass-bg-dark:  rgba(40,40,44,0.32);
backdrop-filter: blur(18px) saturate(180%);       /* sheets/medium: blur(30px) */
border: 0.5px solid rgba(255,255,255,0.45);        /* dark: rgba(255,255,255,0.18) */
box-shadow:
  inset 0 1px 0 rgba(255,255,255,0.55),            /* specular top highlight */
  inset 0 -1px 0 rgba(255,255,255,0.12),
  0 8px 24px rgba(0,0,0,0.12);                      /* dark: rgba(0,0,0,0.35) */
/* Clear glass (over media, e.g. Music/Photos): bg rgba(255,255,255,0.08), same blur. */
```

- **Shapes:** buttons are circles, button groups are capsules, sheets are continuous rounded rects.
- **Colour on glass:** symbols and labels are near-black #1C1C1E on light glass and white on dark glass. On the vertical tab bar, the selected tab uses system-red tint, as in the Music example.

### 3.3 Colours [HIG] (light / dark), iOS 26/27

| Token | Light | Dark |
|---|---|---|
| systemBlue | #007AFF | #0A84FF |
| systemRed | #FF3B30 | #FF453A |
| systemGreen | #34C759 | #30D158 |
| systemOrange | #FF9500 | #FF9F0A |
| systemYellow | #FFCC00 | #FFD60A |
| systemPink | #FF2D55 | #FF375F |
| systemPurple | #AF52DE | #BF5AF2 |
| systemTeal | #30B0C7 | #40C8E0 |
| systemIndigo | #5856D6 | #5E5CE6 |
| systemGray | #8E8E93 | #8E8E93 |
| label | #000000 | #FFFFFF |
| secondaryLabel | rgba(60,60,67,.60) | rgba(235,235,245,.60) |
| tertiaryLabel | rgba(60,60,67,.30) | rgba(235,235,245,.30) |
| quaternaryLabel | rgba(60,60,67,.18) | rgba(235,235,245,.16) |
| systemBackground | #FFFFFF | #000000 |
| secondarySystemBackground | #F2F2F7 | #1C1C1E |
| tertiarySystemBackground | #FFFFFF | #2C2C2E |
| systemGroupedBackground | #F2F2F7 | #000000 |
| systemFill | rgba(120,120,128,.20) | rgba(120,120,128,.36) |
| secondarySystemFill | rgba(120,120,128,.16) [F] | rgba(120,120,128,.32) |
| tertiarySystemFill | rgba(118,118,128,.12) | rgba(118,118,128,.24) |
| quaternarySystemFill | rgba(116,116,128,.08) | rgba(118,118,128,.18) |
| separator | rgba(60,60,67,.29) | rgba(84,84,88,.65) |
| opaqueSeparator | #C6C6C8 | #38383A |

### 3.4 Typography [HIG] (SF Pro; Display at 20 pt and above, Text below)

| Style | Size / line height (pt) | Weight | Tracking (pt) |
|---|---|---|---|
| Large Title | 34 / 41 | Bold (nav large title); Regular as a text style | +0.40 |
| Title 1 | 28 / 34 | Regular (Bold when emphasised) | +0.38 |
| Title 2 | 22 / 28 | Regular | −0.26 |
| Title 3 | 20 / 25 | Regular | −0.45 |
| Headline | 17 / 22 | Semibold | −0.43 |
| Body | 17 / 22 | Regular | −0.43 |
| Callout | 16 / 21 | Regular | −0.31 |
| Subheadline | 15 / 20 | Regular | −0.23 |
| Footnote | 13 / 18 | Regular | −0.08 |
| Caption 1 | 12 / 16 | Regular | 0 |
| Caption 2 | 11 / 13 | Regular | +0.06 |

- Home screen icon labels: ≈ 12 pt Regular [V]. Rail time "9:41": ≈ 15 pt Semibold [V].

### 3.5 Status bar [F] (`JUa8…` 1:4113)

**Variants**

| Variant | Node | Size | Contents / where |
|---|---|---|---|
| Vertical | 1:4114 | 50 × 86, placed at 48 × 86 | Stacked: time, signal, Wi-Fi, battery. Used in the rail. |
| Horizontal | 1:4122 | 104 × 48 | For inner portrait, inside the 82 pt top bar. |

**Placement in the rail**
- **Outer portrait:** x = W − 72 (the 12 pt rail inset), y = 24 + 43 + 6 = **73** (directly under the camera).
- **Inner landscape:** y = 24. Another UI-kit variant puts a 44-wide status bar at (rail x + 14, y 30), 68 tall on the inner display and 118 tall on the outer display.

**Look [V]**
- "9:41" in white, ≈ 15 pt semibold, centred.
- Below it, the Wi-Fi glyph inside a thin circular ring of ≈ 30 pt. That is how the examples render connectivity.
- Light content on dark wallpapers or media; dark (#000) on light app backgrounds, as in the Notes light example.

### 3.6 Side navigation: rail, vertical tab bar and buttons [F] (UI kit, pane controls 13:10164 / 16:12385)

**Rail geometry**
- **Rail:** 84 pt wide, flush to the trailing edge (x = W − 84).
- **Control column:** 48 pt wide at rail x = 12, which leaves **24 pt** to the screen edge.
- The controls start at y = 122 (inner) or y = 172 (outer) and end at **H − 24**.

**Controls**
- **Single glass button:** 48 × 48 circle, with a 12 pt gap to the next control (60 pt pitch). Examples: Back "‹", Close "✕", Share.
- **Grouped capsule:** 48 × 100, 4 pt padding, holding two 36 × 36 symbols at y 4 and 60. The gap above it is 10.
- **Vertical tab bar:**
  - 46 × 238. Its glass background is 48 × 242, extending −1 / −2 pt past the bar.
  - Bottom-aligned, **24 pt** above the bottom edge. Inner display: y ≈ 403–645.
  - **5 tabs**, each 41 × 54, at a 46 pt pitch (they overlap by 8). Icons only.
  - Selected tab: the tint colour (red in Music) plus a light pill highlight [V].
- **Left-side rail:** in the left app of a split view the rail mirrors to the leading edge. It has no status bar, its controls start at (24, 24), and a second capsule sits at y = 521.

**Top toolbars**
- **In-app top toolbar (inside panes):** y = 24, 54 tall. Buttons are 48 × 48 with a 16 pt inset. The title is centred, ≈ 17 pt semibold.

**Top bars (`JUa8…` 1:4276)**

| Variant | Size (pt) |
|---|---|
| Default | 600 × 82 |
| Large Title | 600 × 133 (large title 34 pt bold [HIG]) |
| Compact Large | 600 × 82 |
| Style4 | 600 × 82 |

- On screen they span the full width at 82 pt tall.
- The top bar used inside a sheet is 70 pt tall (another kit uses 58).

### 3.7 Sidebar [F] (Inner open 951 × 669: Notes example 17:19574 light, 17:20279 dark)

**Columns:** **340 sidebar + 527 content + 84 rail = 951**.

**Sidebar top toolbar**
- y 24, 54 tall.
- Sidebar-toggle button 48 × 48 at x 16; "…" button at x 281.3; centred title "Notes" in 15–17 pt semibold.

**List**
- Section header "Today": 22 pt bold [V].
- Rows inset 8 pt, corner radius ≈ 12 pt [V]. The selected row is filled with an accent (yellow #E6B800-ish in Notes [V]), with white text and a trailing thumbnail.

**Sidebar bottom toolbar**
- y 593, 340 × 76.
- Holds a capsule **search field**: glass/fill, ≈ 300 × 36 pt [V], with a magnifier, "Search" placeholder and a mic glyph.

**Colours [V]**
- Light: sidebar ≈ #F2F2F7-ish against white content, separated by a hairline.
- Dark: sidebar black, content black, with a #2C2C2E hairline.

### 3.8 Sheets [F] (`JUa8…` 1:4112, 20 examples)

**Detents and insets**

| Detent | Height | Inset | Width on each display |
|---|---|---|---|
| Large | Full height, runs off the bottom edge | 8 pt from the sides and top | Outer portrait 450 × 670 at (8, 8). Inner landscape: centred 653 × 661 at (149, 8), or a leading-pane sheet 468 × 661 at (8, 8). Inner portrait: 653 × 869 at (8, 82). |
| Medium | **356** (365 on inner portrait) | 8 pt from the sides and bottom | Outer 450 × 356 at (8, 314); inner centred 653 × 356 at (149, 305) |
| Small (compact bar) | **80** | 28 pt from the sides and bottom | Outer 410 × 80 at (28, 570); inner centred 653 × 80 |

**Sheet contents**
- A full-screen dim overlay sits behind the sheet. Use `rgba(0,0,0,.2)` [I].
- The sheet has its own **76 pt rail** with a status bar and 48 pt buttons 58 pt apart, plus a 58–70 pt top toolbar with a centred title (inner) or a left title at (16, 32) (outer).

**Style [I]**
- Sheet corner radius ≈ 38–40 pt on the corners near the device edge (concentric with the display) and ≈ 28–32 pt otherwise.
- Grabber 36 × 5 pt, radius 2.5, `rgba(60,60,67,.3)`, 5 pt from the top. The kit draws a short grabber centred at the top [V].

### 3.9 Keyboard [F] (`JUa8…` 1:161 and UI kit)

**Full keyboard assembly** = 48 pt accessory bar, 8 pt gap, then the body. The body has a 25 pt autocorrection strip at y = 12, the key layout at y = 37, and bottom padding.

| Display / orientation | Assembly | Key layout | Bottom padding |
|---|---|---|---|
| Outer portrait | 466 × 344 | 466 × 200 | 39 |
| Outer landscape | 678 × 292 | 678 × 160 | 39 |
| Inner portrait | 669 × 406.7 | 669 × 294.7 | 19 |
| Inner landscape | 951 × 309.3 | 951 × 196.3 | 20 |

**Outer portrait key grid (UI kit)**
- Rows 442 wide at x 12. **Key height 43**, row pitch 54.
- Row 1: 10 keys 38.8 wide, 6 pt gaps.
- Row 2: 9 keys 39.3 wide, indented 20.
- Row 3: Shift 45, 7 keys 41.3 wide at a 47.3 pitch, Delete 45.
- Row 4: 123-switch 56, Space 311, Return 63.

**Inner (UI kit, 950 × 242 at y 427)**
- Key area 802 × 208 at x 74, with 66 pt side columns for emoji (left) and mic (right).
- Key height 43, row pitch 55. Top-row keys 68 × 43 with 10 pt gaps.

**Style [HIG/I]**
- Keys radius 8.5 pt; letters 22–25 pt SF Pro Regular.
- Light keys #FFFFFF on a glass base `rgba(210,212,218,.85)`; dark keys `rgba(255,255,255,.22)` on `rgba(30,30,30,.85)`.
- Key shadow `0 1px 0 rgba(0,0,0,.3)`.

### 3.10 Split view / multitasking [F] (UI kit 17:13296 / 17:15813)

**Windows**

| App | x | Size | Contents |
|---|---|---|---|
| Left app | 0 | 470 × 669 | **Leading** rail of 84 pt (no status bar) + content 386 |
| Right app | 481 | 470 × 669 | Content 385.5 + **trailing** rail with status bar and tab bar |

- **Divider:** the 11 pt gap at x 470–481, so it straddles the hinge at 475.5.
- **Handle:** a **3 × 46 pt** grabber at x 474, y 311.5 (vertically centred). Draw it as a capsule, radius 1.5, white at about 60–70% on dark or #000 at 30% on light [I].

**Corner radii [I]**
- Outer corners follow the display radius, ≈ 40.
- Inner corners next to the divider use ≈ 24–28 pt continuous corners.
- The divider background is black.

### 3.11 Control Center [V] (iPadOS-style reference, `4QZO…` 1:897; no iPhone Duo version in the files)

**Placement**
- Over the dimmed, blurred lock or home screen, in the top-right area.

**Module grid**

| Module | Size |
|---|---|
| Base unit (1×1, round) | **≈ 62 pt** |
| 2×2 (connectivity cluster, now-playing) | ≈ 138 pt |
| Sliders (brightness, volume) | 1×2, ≈ 62 × 130 pt (tall capsules) |
| Gap | ≈ 14–16 pt |

- **Connectivity cluster:** Airplane, AirDrop/hotspot, Wi-Fi (blue when active), cellular/Bluetooth.
- **Focus:** a 2×1 capsule labelled "Title / Detail" with a moon glyph.
- **Small toggles:** camera, silent (red when on), rotation lock, screen mirroring, battery, flashlight.

**Look**
- Clear glass with a strong blur.
- Active toggles fill with their system colour (Wi-Fi #0A84FF, mute #FF3B30) and a white glyph.
- Inactive toggles: `rgba(255,255,255,.18)` glass with a white glyph.

**Adapting it to the Duo [I]**
- Place it in the trailing half of the inner display, to the right of the fold.
- 4 columns × 62 pt + 3 × 15 gaps = 293 pt wide, starting about 24 pt from the top.

### 3.12 Music and Notes examples (reference for in-app chrome) [V]

- **Music, inner and outer** (DcC3 36:2291 / 36:3519):
  - Full-bleed artwork with a magenta tint, a tracklist on the right, a glass rail and vertical tab bar (Home, Browse grid, Radio, Library, Search in red).
  - A floating glass **mini-player capsule** at the bottom: ≈ 365 × 34 pt at y ≈ 621 on inner.
- **Notes** (17:19574 / 17:20279): the sidebar pattern described in §3.7.

---

## 4. Photos app

### 4.1 Reference file (older iOS, `OLX…` 2009:1129, 390 × 844 iPhone) [V]

**Library ("All Photos")**
- Nav title "All Photos", 17 pt semibold, centred, with a blue "Select" on the right.
- **3-column square grid**: cells ≈ 129 pt with ≈ 1.5 pt gutters, edge to edge.
- Light: white background. Dark: black background.

**Other screens**
- An old-style bottom tab bar with 4 tabs (Library, For You, Albums, Search).
- "What's New in Photos" onboarding sheets (light and dark), with a big bold title and a blue full-width "Continue" button (≈ 50 pt tall, radius 12).

### 4.2 iOS 26/27 Photos look for the clone [I/HIG]

**Tab bar and toolbars**
- A **single scroll** with Library on top and Collections below. In iOS 26 it is split into **two tabs: "Library" and "Collections"**, plus a separate **Search** button.
- They sit in a floating **liquid-glass tab bar** capsule at the bottom.
- On the Duo this goes **into the vertical rail tab bar** in landscape (inner and outer) and becomes a bottom capsule only in inner portrait.
- Toolbar actions are glass circles at the top (48 pt): Select, plus "…"/filter.

**Library grid**
- Default zoom 3 columns on compact width; 5–7 columns on regular width.
- On inner landscape (867 pt content width): 6 columns × ≈ 143 pt, 1–2 pt gaps.
- A month/day header overlay sits at the top in large-title style (34 pt bold) over a gradient.

**Collections**
- Horizontal carousels of rounded cards (radius ≈ 16–20 pt): Recent Days, People & Pets, Memories, Pinned, Albums.
- Section headers in Title 3 semibold with a chevron.

**Sidebar on inner landscape**
- Use the 340 pt sidebar pattern (§3.7) listing Library, Collections, Albums, Media Types, and Utilities.
- The detail pane shows the grid.

---

## 5. StandBy mode

**Not present in any of the provided nodes.** Recommended layout [I/HIG]:

**When it shows:** the device is charging, on its side, in landscape. That is **outer landscape 678 × 466** or **inner landscape 951 × 669**.

**Layout**
- Pure black background (#000), with no status bar except a small charging indicator.
- **Widgets view:** two stacked-widget slots side by side, each a square with radius ≈ 32 pt and an ≈ 24 pt gap, vertically centred.
  - Inner: each ≈ 410 × 410 pt, one per half of the hinge, which gives a natural dual-pane split at 475.5.
  - Outer: each ≈ 300 × 300 pt.
  - Typical pairing: a large analog clock on the left and a calendar or weather on the right.
- **Clock view:** a full-width digital time in SF Pro Rounded at about 200–260 pt, with the date in red or the accent colour.

**Night mode:** everything is tinted monochrome red (#FF3B30 at about 60%).

---

## 6. File inventory

All paths are relative to `docs/figma/`. **★ = best device-frame assets.**

**Top level**

| File | What it is |
|---|---|
| `SPEC.md` | This document |
| `mockup-folded-front-white.png` | MCP screenshot of mockup 7774:3410 (Star White folded section, 1643×1343, opaque, checkerboard + wallpaper) |
| `mockup-folded-front-white@2x.png` | MCP @2x export of the same section (3286×2686, opaque) |
| `uikit-templates-metadata.xml` | Full node tree of the UI kit Templates page (DcC3, page 0:1); the source of the §3.6–3.10 numbers |

**`assets/bezels/`: pt-exact UI-kit bezels, screen transparent, @3x**

| File | What it is |
|---|---|
| ★ `bezel-inner-landscape-starwhite-1031x749pt@3x.png` | **OPEN.** 3093×2247. Screen hole 951×669 at (40, 40) pt. |
| ★ `bezel-inner-landscape-nightsky-1031x749pt@3x.png` | Same, Night Sky |
| ★ `bezel-outer-portrait-starwhite-524.67x731.33pt@3x.png` | **FOLDED.** 1574×2194. Screen hole 466×678 at (29.33, 26.67) pt. Camera dot painted in. |
| ★ `bezel-outer-portrait-nightsky-524.67x731.33pt@3x.png` | Same, Night Sky |

**`assets/`: photoreal frames with transparent screen and outside, cropped to the device**

| File | What it is |
|---|---|
| ★ `frame-open-landscape-starwhite-transparent.png` | **OPEN, front, landscape.** 3951×2815. |
| `frame-open-landscape-nightsky-transparent.png` | Same, Night Sky |
| ★ `frame-open-portrait-starwhite-transparent.png` | **OPEN, front, portrait.** 2060×2892. |
| `frame-open-portrait-nightsky-transparent.png` | Same, Night Sky |
| ★ `frame-folded-front-starwhite-transparent.png` | **FOLDED, front.** 2035×2813. Camera dot kept. |
| `frame-folded-front-nightsky-transparent.png` | Same, Night Sky. 2037×2815. |
| `screen-mask-open-landscape-cropped.png` | Screen-shape mask aligned 1:1 with the open-landscape frames |
| `screen-mask-open-portrait-cropped.png` | Screen-shape mask aligned 1:1 with the open-portrait frames |
| `screen-mask-folded-front-cropped.png` | Folded screen mask with camera hole, aligned with the Star White folded frame |
| `screen-mask-folded-front-nightsky-cropped.png` | Folded screen mask with camera hole, aligned with the Night Sky folded frame |

**`assets/mockups-raw/`: original Figma fills (4096×3072 canvas, opaque black screen) and source masks**

| File | What it is |
|---|---|
| `frame-open-landscape-{starwhite,nightsky}-blackscreen-4096x3072.png` | Original open-landscape frames |
| `frame-open-portrait-{starwhite,nightsky}-blackscreen-4096x3072.png` | Original open-portrait frames |
| `frame-folded-front-{starwhite,nightsky}-blackscreen-4096x3072.png` | Original folded frames |
| `frame-folded-front-starwhite-blackscreen-512x384.png` | Low-res copy of the folded Star White frame |
| `screen-mask-open-{landscape,portrait}-4096x3072.png` | Green source masks for the open frames |
| `screen-mask-folded-front-4096x3072.png` / `-512x384.png` | Green source mask for the folded frame (and low-res copy) |
| `checkerboard-tile-256.png` | Figma transparency checker; not needed |
| `cover-hand-held-folded-2880x1620.png` | Hand-held folded phone showing the outer home screen. RGB, white background. Reference or hero only. |

**`assets/wallpapers/`**

| File | What it is |
|---|---|
| `outer-{light,dark}-1398x2034.png` | Outer display wallpaper at native px |
| `inner-landscape-{light,dark}-2670x1878.png` | Inner landscape wallpaper at native px |
| `wallpaper-dunes-{light,dark}-portrait-{2766,2797}x4000.png` | High-res portrait sources |
| `wallpaper-dunes-{light,dark}-landscape-4000x2799.png` | High-res landscape sources |
| `thumb-*`, `wallpaper-thumb-*` | Small previews |

**`assets/icons/`: 256×256 pre-masked app icons (RGBA)**

- **Apple apps:** phone, safari, messages, music, facetime, calendar, photos, camera-lens, mail, clock, reminders, maps, apple-tv, news, app-store, wallet, health.
- **Third-party look-alikes:**
  - `rocket.png`
  - `app-ring-wave.png`
  - `app-u-shield-314x309.png`: 314×309 on a white square

**`assets/widgets/`**

| File | What it is |
|---|---|
| `maps-widget-sf-512.png` | Map tile used in the Maps small widget |

The only canvas screenshots on disk are the two `mockup-folded-front-white*` files. Every other screen was examined live in the browser and is described in this document.

---

## 7. Nodes not accessed, or only partly accessed

All gaps are caused by the **Figma MCP Starter-plan call limit** (account `natnael tadele`, Starter / View seats only). To fill them:
- wait for the monthly reset, or use a paid Full or Dev seat, then rerun `get_design_context` on the nodes below; or
- in the Figma app, select a frame and use Export → PNG @2x / SVG.

| Node(s) | What we got | What is missing |
|---|---|---|
| MYoV 96:30 (Start Here) | Structure only | Text |
| MYoV 96:537 (Device Frames) | Structure. Symbols 8:3–8:377: Device / Screen-only / Guides × 6 poses; device symbol = screen + 8 pt per side | Styles |
| MYoV 90:9700, 96:2631 (Navigation), 96:4615 (Adaptive Patterns), 96:4663 (Components) | Long text docs, glanced at in the browser | Text and values |
| MYoV 90:9692 | Cover only | — |
| m1Hr 2032:3900 (Components) | Bezel PNGs; buttons, status bar, pane controls and tab-bar components seen visually | Component styles |
| DcC3 13:10164, 16:12385 (Pane controls) | Geometry via instances in the Templates metadata | Glass effect values |
| DcC3 templates | Templates page node tree (see `uikit-templates-metadata.xml`) | Screenshots |
| DcC3 40:11015 | Empty 48×48 frame "carousel 1" | — |
| DcC3 examples 36:2291, 36:3519, 17:19574, 17:20279 | Viewed in the browser | — |
| DcC3 examples 17:19552, 17:20271 | Not viewed (likely outer Notes, light and dark) | Everything |
| WFmP 8487:3027 / 3033 / 3069 / 3075 / 7774:3412 | Frames obtained as raw image fills | No section screenshots |
| WFmP 10101:316 / 10101:313 / 7715:5079 | All wallpaper boards; images downloaded | — |
| WFmP inner "Home Screen – Portrait/Landscape" boards | Marked "Soon" (empty) in the source file | — |
| JUa8 1:4335 (second top-bar set) | — | Not accessed |
| JUa8 1:4113 / 1:4276 / 1:4112 / 1:161 | Metadata only | No visuals or styles (sheets render as grey wireframes in the browser) |
| OLX 2009:1129 | Viewed visually | Metadata |
| 4QZO 1:897, 1:2072, 1:2834 | Viewed visually | — |
| Any StandBy design | Not present in the supplied nodes | — |
| Any inner home screen design | Not present in the supplied nodes | — |
| Liquid-glass effect values, text styles, colour variables | — | All (`get_variable_defs` and `get_design_context` were blocked) |
