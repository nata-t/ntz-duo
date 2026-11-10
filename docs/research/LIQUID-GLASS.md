# Liquid Glass on ntz duo (iOS 26 → iOS 27)

Research from November 2026 (Apple HIG and WWDC25/26 sessions, MacRumors, MacStories, Six Colors,
9to5Mac, and third-party measurements of Apple's Figma kits). Tags: **[A]** Apple, **[P]** press,
**[M]** third-party measurement, **[E]** estimate.

## 1. The material, and how this site renders it

Apple puts glass only on the **functional layer**: bars, rails, buttons, menus, sheets, alerts.
Content (lists, cards, widgets, photos) is never glass [A]. One exception is sliders and switches,
which turn into glass only while a finger holds them.

| Variant | Use it for | Figma values [M] |
|---|---|---|
| Regular | most controls; any glass that carries text | frost 6, refraction .7, light fill white 32%, dark #4D4D52 45% |
| Clear | controls over photos, video and wallpaper | frost 2, refraction .8, fill white 6–8%; add a ~35% black dim behind it if the media is bright |
| Tinted / prominent | the single primary action on a view | the action colour, white glyph |

**iOS 27 changes [A/P]**
- The glass is more opaque by default and blurs busy content more.
- A **darkened edge** sits just inside a **brighter specular rim**.
- Dark glass is lighter than it was in iOS 26.
- Settings › **Appearance** › **Liquid Glass** is a continuous slider from More Clear to More Tinted, with Default in the middle.
- Scrolling under a top bar shows a more defined "uniform toolbar" band.

**The CSS classes.** Defined in `app/globals.css`. In Chromium, `lib/glass.ts` adds real refraction
automatically: physics-based displacement maps and a specular rim, applied as an SVG backdrop-filter.
Just use the class; never add your own `backdrop-filter` or `backdrop-blur` to these elements.

- `glass`: regular glass. Use `bg-(--glass-strong)` for menus, popovers and sheets that carry a lot of text.
- `glass-clear`: clear glass, over photos and wallpaper. Use white glyphs on it.
- `glass glass-tint`: prominent tinted glass. Set the colour with `style={{"--tint": "var(--green)"}}`; the default is blue.
- `glass-lens`: a clear lens for a held switch knob or slider thumb (see `Toggle`/`Slider` in `components/apps/settings/ios.tsx`).
- `scroll-edge-top` / `scroll-edge-bottom`: the scroll-edge effect, a soft blur-and-fade strip under bar-less chrome. Set `[--edge:var(--grouped)]` to the colour of the view behind it.
- The tints follow `--frost` (0–1), the Liquid Glass slider. Call `setGlass(v)` from `lib/os.ts` to change it. This is already wired.

**Rules for glass elements:**
- **Never animate opacity on an ancestor of a glass element.** An ancestor below full opacity (or with a filter, mask or clip-path) cuts the glass off from its backdrop, so it goes blank. Animate the glass element itself, or use transform-only keyframes. `duo-cc`, `duo-lift` and `bloom` are safe; `duo-rise` and `duo-fade` on a parent are not.
- Refraction needs something behind the glass. Over a flat white page it reads as rim plus shadow, which is correct.
- Keep glass to the few important controls. Don't make whole lists or cards glass.
- A glass element must have a border radius (capsule or circle in most cases). Its size can change; the filter refits itself.

## 2. Shapes and controls [A/M]

**Shapes**
- Three kinds: fixed, **capsule** (the default for glass), and **concentric** (inner radius = outer radius − padding).

**Buttons**
- Toolbar and nav buttons are **44 pt glass circles**; on the Duo rail they are 48.
- The back button is a bare `‹` chevron in a circle, with no "Back" text.
- Several symbol buttons share **one glass capsule** (`RailGroup`). Text buttons ("Edit", "Select") get their own capsule and are never mixed with symbols.
- The primary action (Done ✓, Send ↑, Compose) is a separate tinted circle (`RailButton prominent`).
- Pressed glass **swells a little (≈1.06–1.1×) and glows from within**. It does not shrink: use `active:scale-110`, not `active:scale-90`.

**Large title**
- 34 pt bold, left-aligned. It collapses to a 17 pt semibold centred inline title on scroll.

**Inset grouped lists (iOS 26/27)**
- Cards: **26 pt continuous radius**, inset 16 pt.
- Rows: **52 pt** for one line, 17 pt regular label.
- Separators: inset to the text, stopping 16 pt short of the trailing edge.
- Section headers: **sentence case, ~15–17 pt semibold, secondary label colour**. No longer uppercase footnotes.
- Icon tiles: ~30 pt rounded squares.

**Controls**
- **Switch:** 64×28 with a 38×24 capsule knob. Held, the knob becomes a glass lens. Use `Toggle` from `settings/ios.tsx`.
- **Slider:** 6 pt track, 38×24 thumb that becomes a lens while dragged. Use `Slider` from `settings/ios.tsx`.
- **Segmented control:** a capsule track with no separators and a pill selection with a 2 pt gap. Height ~32–36.

**Floating panels**
- **Menus, popovers and action sheets** grow out of the button that opened them (`animate-bloom` with `origin-*` at the button). Radius ~32. Rows have a leading symbol.
- **Sheets:** at partial height they float inset ~8 pt, with radius ~34 and glass. At full height they are opaque and edge to edge.
- **Alerts:** radius ~34, title and message **left-aligned**, two capsule buttons side by side (Cancel grey on the left, the action tinted on the right).

**Tab bar**
- A floating capsule, 62 pt tall. The selected tab sits on a grey pill, which swells into a lens while it's dragged.
- Search is a separate circle at the trailing end.
- The bar minimizes to a circle when you scroll down.

## 3. iPhone Duo rules [A: HIG "Designing for iPhone Duo"]

- On the inner display in landscape (and the outer display), the nav bar, toolbar and tab bar leave the top and bottom edges. They stack in **one vertical rail on the window's outer edge**: the right edge for `slot` `full`/`right`, the left edge for `slot === "left"`.
- Rail order from the top:
  1. Back/Close
  2. the prominent action
  3. the other toolbar groups
  4. a gap
  5. the **tab bar, bottom-aligned** (as a vertical capsule)
- Items are symbol-only. Wide items (segmented controls, text buttons) may stay horizontal in the content area.
- Upright (portrait), apps use normal top and bottom bars.
- Content runs under the rail; the rail is glass floating over it.

## 4. The built-in apps today (iOS 26/27)

**Photos** [P]
- Floating tab bar: **Library | Collections**, plus a separate **search circle**.
- Library is a full-bleed grid. Top right has a "Select" capsule and a sort/view-options circle.
- Scrolling back in time morphs the tab bar into a **Years | Months | All** segmented glass control.
- Collections is a large title with sections (Recent Days, People & Pets, Pinned, Memories, Trips, Albums, Media Types, Utilities). Each section has a header with a chevron and a horizontal carousel.
- Viewer:
  - top: back circle, date/time title, "…" circle;
  - bottom: Share circle, a centre capsule (♥ / ⓘ / Edit), and a trash circle;
  - one tap hides the chrome on black.

**Settings** [P/M]
- Large title "Settings". The search field is a floating glass capsule at the **bottom** (magnifier, "Search", mic).
- The first card is the Apple Account: avatar ~60, name, "Apple Account, iCloud, and more".
- The rows follow the list spec above.
- Detail pages: a glass back circle, an optional header card (big icon, title, blurb, "Learn more…"), and the inline title.
- **iOS 27:** a new top-level **Appearance** pane: Light/Dark, the **Liquid Glass slider** (More Clear ↔ More Tinted, Default detent in the middle, live preview above it), Text Size, Bold Text, Display Zoom.
- iPad/iOS 27 sidebar: the selected row is a rounded pill highlight, not a full-bleed bar.

**Notes** [P]
- Gold/yellow accent.
- List view: large title (the folder name), a "…" circle, and grouped date sections (Pinned, Today, Previous 7 Days). Each row has a semibold title and a time plus preview line.
- At the bottom: a search capsule and a compose circle.
- Editor:
  - top: back circle, plus a glass group (share, "…");
  - while editing, a tinted ✓ Done circle;
  - a floating glass formatting toolbar (Aa, checklist, table, attach, markup).

**Contacts card** [P]
- Hero: a contact poster or a large avatar, with the name large below it.
- Under the name: **four equal glass tiles** (message, call, video, mail), each a symbol over an 11–12 pt label.
- Then inset-grouped cards (phone, email, address, notes).

**Messages / Mail compose** [P]
- Mail sheet:
  - top: an ✕ glass circle, the title "New Message", and a **blue prominent ↑ send circle**, which stays grey until the message is valid;
  - fields are hairline rows (To, Subject, then the body).
- Messages thread:
  - a centred avatar with a glass name pill;
  - at the bottom: a "+" glass circle and a glass capsule field with an inline mic, which turns into a blue ↑ send button.

**Preview (documents)** [P]
- Back circle, then the filename title with a ⌄ caret menu.
- Pages on a neutral grey canvas, each with a soft shadow.
- A glass toolbar group (markup, share, find, "…").

**App Store product page** [P]
- iOS 27 has an optional **21:9 hero header (image or video)** at the top.
- Then: icon (~118), name (bold) and subtitle, a blue **Get** capsule, and share.
- A horizontal info strip with tiny caps label, bold value and caption cells, separated by hairlines.
- Then the screenshot carousel, What's New, description and information.

**Safari** [P]
- Compact: one floating row of back circle, URL capsule and tabs circle.
- It shrinks to a tiny domain capsule while scrolling.
