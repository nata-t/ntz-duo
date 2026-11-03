# Brief for app authors (ntz duo)

The site is a scroll-driven iPhone Duo (Apple's book-style foldable, iOS 27). When the
device lies open, its inner display (951 × 669 pt, landscape) is a live React OS. Apps open
in windows: full screen (951 × 669) or Split View halves (≈ 472 × 669 each, fixed 50/50).

## Where your code goes
- Only edit files inside your app's folder: `components/apps/<app>/`. Add as many files as
  you like there (components, a `*.module.css` for keyframes or anything Tailwind can't do).
- Do not edit `lib/`, `components/os/`, `components/device/`, `components/stage/`, `app/`,
  `content/` or `globals.css`. If you need something there, say so in your final report.
- No new npm dependencies. Available: react 19, next 16, gsap 3.15 (`import { gsap } from "@/lib/gsap"`).

## Contract
Your default export receives `AppProps` (components/apps/types.ts):
`{ id, width, height, slot: "full" | "left" | "right", mirror, close }`.
- Lay out for `width × height` (pt = CSS px inside the OS, which is zoomed as a whole).
  Must work at 951 × 669 AND at ~472 × 669. Use `width` to switch layouts (e.g. < 600 → compact).
- `mirror`: true for the static copies drawn while the device folds. When true, render
  the same first frame but skip effects, timers, autoplay, listeners.
- The status bar sits on the right edge (78 pt column, top ~110 pt). When `slot !== "left"`,
  CSS var `--safe-right` is `52px`: keep important controls out of the top-right 78 × 110 area.
- The window draws a "•••" multitasking control at the top centre (≈ 44 × 22 at y 7) and a
  home indicator at the bottom centre (≈ 200 × 22). Leave those spots clear of buttons.
- Scrolling: make your scroll container `overflow-y-auto overscroll-contain no-scrollbar`
  with a fixed height (`h-full`). The OS routes the mouse wheel to it natively.
- iPhone Duo HIG (docs/research/apple-design-skill/references/hig/designing-for-iphone-duo.md):
  in landscape, toolbars and tab bars sit on the SIDE (vertical), on the window's outer edge
  (left edge for `slot === "left"`, right edge otherwise), in Liquid Glass. Navigation
  (Back/Close) at the top of that vertical bar.

## Design language
- iOS 27 + Liquid Glass inside apps; apple.com marketing pages for "detail" content.
- Theme: everything must work in light and dark. Use the semantic Tailwind tokens from
  `app/globals.css` (they flip with `[data-theme]`): `bg-bg bg-bg-2 bg-bg-3 bg-grouped
  bg-grouped-2 text-label text-label-2 text-label-3 bg-fill bg-fill-2 bg-fill-3 border-sep
  text-blue bg-blue text-green …`, and the apple.com tokens `bg-page bg-page-alt text-ink
  text-ink-2 text-ink-3 border-rule text-link`. Utility classes `.glass` (regular Liquid
  Glass) and `.glass-clear` (over photos). Fonts: `font-sans` (SF Pro Text → Inter),
  `font-display` (SF Pro Display → Inter). Never hard-code white/black backgrounds for
  surfaces; use the tokens.
- Apple web type scale (scale it to the window: these are desktop px, inside the phone use
  ~55–65% of them): hero 80/1.05/600/-0.015em, section 48/1.08/600/-0.003em, eyebrow
  21/600, lockup copy 21/1.38 color text-ink-2 with <strong> in text-ink, body 17/1.47/-0.022em,
  caption 12/1.33. Buttons: #0071e3 pill (radius 980px), 17px; links `text-link` with " ›".
- Motion: Apple's scroll reveal = element rises 30 px + fades, 0.7–0.9 s, ease
  cubic-bezier(0.4,0,0.6,1), stagger 0.15 s, triggered when it enters the scroll view
  (use IntersectionObserver with `root` = your scroll container). Respect
  `prefers-reduced-motion`. Keep effects cheap: no backdrop-filter on large scrolling areas.
- Read `docs/research/WEB.md` (apple.com tokens and patterns) before designing.
- Content: `content/site.ts` (profile, contact, socials, experience, skills, projects).
  Never invent facts (no fake testimonials, numbers, clients). Images: `/portrait/source.webp`
  (keyed-out portrait, RGBA 787×1100, B&W), project screens `/projects/<slug>/*.webp`
  (2400×1500, 16:10), confidential projects only have `placeholder-N.svg`.

## Checking your work
The dev server runs at http://localhost:3300 (do not start another; if it's down, run
`bun run dev --port 3300` in the project root in the background).
Screenshot the phone with an app open:

```
node scripts/shoot.mjs 4.3 1440 900 light "document.querySelector('[data-os-root=live] [data-app=about]').click()"
```
(args: story time 4.3 = phone open and live, viewport w h, color scheme, JS to run.)
Output: /tmp/duo-shots/t4.3-1440x900-light.png — Read it to look. Try dark too, and split view:
`os` actions are not on window, so to test split view click the window's "•••" button
(dispatch a keydown Enter on `[aria-label="Window options"]`, then click `[aria-label="Left Half"]`).
Run `bun run typecheck` and `bun run lint` before finishing.
