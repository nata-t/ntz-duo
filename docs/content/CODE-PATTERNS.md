# ntz duo — Code patterns

Part 1 covers how `ntz` (`/home/natnael-tadele/Desktop/kilet/my-projects/ntz`) is built and written, so
ntz duo can mirror it exactly. Part 2 covers the motion techniques worth reusing from the six inspirations, aimed at
(a) an Apple-style product reveal (a device that unfolds, zooms, then folds) and (b) a seamless infinite-loop
scroll.

---

# Part 1 — How ntz is built

## Stack (from `package.json`)
- `next` 16.4.3 (App Router, static build), `react` / `react-dom` 19.3.1, `typescript` ~5.9.3
- `gsap` 3.15.0 + `@gsap/react` 2.1.2. ScrollTrigger and SplitText ship in the free gsap package.
- `lenis` 1.3.27
- `three` 0.186.1 + `@react-three/fiber` 9.8.2, used for one shader only (`components/gl/PortraitGL.tsx`)
- `tailwindcss` ^4.3.3 via `@tailwindcss/postcss`. No `tailwind.config`; all config lives in CSS.
- Package manager **bun** (`bun.lock`). Scripts: `dev`, `build`, `start`, `typecheck` (`tsc --noEmit`), `lint` (`eslint .`), plus asset scripts (`portrait`, `screens`).

## Folder conventions
```
app/                 layout.tsx, page.tsx, globals.css, not-found.tsx, sitemap.ts, robots.ts, work/[slug]/page.tsx
components/<area>/   one folder per area: home/ case/ artifacts/ gl/ transition/ cursor/ nav/ motion/ ui/ scrollbar/
lib/                 small framework-free modules: gsap.ts, lenis.ts, env.ts, time.ts, scan-state.ts, typeset.ts, barcode.ts
content/             site.ts (all copy + types), screens.ts (generated, "do not edit")
scripts/             capture-screens.mjs (puppeteer-core), optimize-screens.py, process-portrait.py, og/og.html
assets-src/          raw inputs, git-ignored ("Raw source photos never ship")
docs/                research.md, design-direction.md, review.md, direction-board.html
public/              work/<slug>/*.webp, portrait/, og.png, icon.svg, CV pdf
```
- **Components**: PascalCase file = default-exported component (`Hero.tsx`, `MotionProvider.tsx`). Hooks are camelCase (`usePageEnter.ts`). Only one CSS module exists (`scrollbar.module.css`), kept because "it is a small state machine whose later rules deliberately win".
- **lib** files: lowercase or kebab-case, named exports only.
- Import alias `@/*` → project root (`@/lib/gsap`, `@/content/site`).
- Pages stay thin. `app/page.tsx` only composes sections:
  ```tsx
  export default function Home() {
    return (<><Hero /><Statement /><Files /><About /><Contact /></>);
  }
  ```
- Dynamic routes use `generateStaticParams` and read from `content/site.ts` (`projectBySlug`, `nextProject`, `pad2`).

## TypeScript conventions
- `tsconfig`: `strict`, **`noUncheckedIndexedAccess`**, `target ES2022`, `moduleResolution: bundler`, `jsx: react-jsx`, `allowJs: false`, `scripts/` excluded.
- Index access therefore uses `!` where the code knows the element exists (`inners[0]!`, `projects[(i + 1) % projects.length]!`), or `?.` / `??`.
- Types live with their data (`content/site.ts` exports `Project`, `Role`, `Screen`, ...). Types are aliases (`type X = {}`), never `interface`. Unions are string literals (`"white" | "canary" | "pink"`).
- Props are typed inline (`{ project: p, next }: { project: Project; next: string }`). There are no separate `Props` interfaces except where a component wraps another (`TLink`: `Omit<React.ComponentProps<typeof Link>, "href"> & {...}`).
- `React.ReactNode` / `React.CSSProperties` come from the global `React` namespace, with no `import React`.
- JSDoc `/** */` explains a field, `//` explains a section. `as const` on literal maps.
- Comments say **why**, in plain sentences, often crediting the source of the idea ("artcraft's wiring", "SPYLT's scrubbed word fill", "bruno-arizio's continuity").

## Component style
- Every interactive or animated component starts with `"use client"`. Layout and page files are server components.
- **A file-top comment block** describes the component's behaviour in prose (3–10 lines) before the code. Comment density is moderate: a header block, a comment on each non-obvious step, and none on obvious JSX.
- **Hooks into DOM via `data-*` attributes**, not classnames or refs-per-element: `data-fill`, `data-fact`, `data-row`, `data-slot`, `data-shade`, `data-arrive`, `data-frame`, `data-track`, `data-note`, `data-flight`, `data-cursor="Open ↗"`, `data-magnet`, `data-zone="paper|system|scan"`, `data-section="Work"`. Queried with `gsap.utils.selector(root)` or `gsap.utils.toArray("[data-slot]", root.current)`.
- **State via data attributes for CSS**: JS sets `el.dataset.live = ""`, and Tailwind custom variants read it (`live:sticky`, `data-live:h-[...]`, `group-data-running/marquee:`).
- Long class strings are pulled into `const UPPER = "..."` at the top of the file (`const ROW = ...`, `const GEOMETRY = [...].join(" ")`).
- Arbitrary-value Tailwind is used freely: `text-[clamp(32px,4.6vw,76px)] leading-[1.02] tracking-[-0.032em]`, `col-[1/12]`, `transform-[rotate(-2deg)]`, and CSS variables in classes (`h-[calc(var(--steps)*100svh)]`, `text-(length:--big)`).
- Accessibility is built in: `aria-labelledby` on sections, a skip link, `aria-hidden` on decorative layers (marquee, canvas), SplitText with `aria: "none"` where needed, and `motion-reduce:` variants.

## Motion runtime

### `lib/gsap.ts` (verbatim): the one registration point
```ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

// One registration point for every client module.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
```
Components always `import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap"` and never import from `"gsap"` directly.

### `lib/lenis.ts` (verbatim): shared Lenis ref + scroll helper with native fallback
```ts
import type Lenis from "lenis";

// The live Lenis instance, published by MotionProvider. null before mount
// and for reduced-motion visitors — callers fall back to native scrolling.
export const lenisRef: { current: Lenis | null } = { current: null };

export function scrollToTarget(
  target: number | string | HTMLElement,
  opts: { immediate?: boolean; offset?: number } = {},
) {
  const lenis = lenisRef.current;
  if (lenis) {
    lenis.scrollTo(target, { immediate: opts.immediate, offset: opts.offset ?? 0, force: true });
    return;
  }
  let top = 0;
  if (typeof target === "number") top = target;
  else {
    const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    if (!el) return;
    top = el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0);
  }
  window.scrollTo({ top, behavior: opts.immediate ? "auto" : "smooth" });
}
```

### `components/motion/MotionProvider.tsx` (verbatim): Lenis on GSAP's ticker
```tsx
"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { lenisRef } from "@/lib/lenis";

// Site-wide scroll runtime: Lenis driven by GSAP's ticker so smooth scroll
// and every ScrollTrigger advance on the same frame (artcraft's wiring).
// Reduced-motion visitors keep native scroll and get no Lenis at all.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9 });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Web fonts change line boxes; re-measure every trigger once they land.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
```
Related helpers:
- `components/motion/IntroRelease.tsx` removes `data-intro` in a `useLayoutEffect`. Pages without an intro (404) mount it.
- `components/transition/TransitionProvider.tsx` resets scroll on route change itself. Lenis keeps its own target, so a router reset alone "would be eased back". The reset happens under the cover: `ScrollTrigger.refresh(); scrollToTarget(hash || 0, { immediate: true }); lenisRef.current?.start();`. During the leave animation it calls `lenisRef.current?.stop()`. Artcraft solves the same problem in a separate `RouteScrollReset` (Part 2 §4).

### Reduced-motion handling: four layers
1. **Pre-paint script** in `layout.tsx` sets `html[data-intro]` only when motion is allowed. CSS hides only `[data-intro-hide]` under it, and a 4.5 s timeout removes the attribute if JS fails.
2. **`lib/env.ts`** exposes `reducedMotion()`, `finePointer()`, `isDesktop()` and a cached `webglAvailable()` probe. Each returns the conservative answer on the server.
3. **Inside animations**: early return (`if (reducedMotion()) return;`) for one-shot reveals, or `gsap.matchMedia()` with `(prefers-reduced-motion: no-preference)` combined with breakpoints for scroll stages. Then `mm.revert()` tears everything down when the query flips:
   ```ts
   const mm = gsap.matchMedia();
   mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => build(true));
   mm.add("(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)", () => build(false));
   return () => mm.revert();
   ```
4. **CSS backstop** (unlayered, at the end of `globals.css`) collapses all CSS animation and transition durations to 0.01 ms. Tailwind `motion-reduce:animate-none` / `motion-reduce:hidden` cover individual elements. The result is "Complete, static, readable pages"; nothing essential depends on animation.

### Animation idioms used across components
- `useGSAP(() => {...}, { scope: root })` with a `useRef<HTMLElement>` on the section. SplitText instances are reverted in the returned cleanup.
- **Static by default, staged with JS.** Markup renders the readable static layout. JS adds `data-live`, and CSS variants switch to the sticky stage (`components/case/Screens.tsx`).
- **Pins**: `components/home/Hero.tsx` uses ScrollTrigger `pin`. `Screens.tsx` instead uses a **CSS sticky stage**: the section height is set to `calc(var(--steps)*100svh)`, a `sticky top-0 h-svh` child holds the stage, and the timeline is scrubbed `start: "top top", end: "bottom bottom"`. A negative bottom margin (`mb-[-100svh]`) plus `z-1` on the next sibling lets the next section rise over the stage.
- **Durations are expressed as scroll lengths in viewport heights** (`INTRO = 1.8; DWELL = 0.6; MOVE = 1; GROW = 1.2; HOLD = 0.6; CURTAIN = 1;`). The timeline's time unit equals one viewport of scroll.
- **Every scrubbed tween is a `fromTo` with `immediateRender: false`**, so refresh mid-scroll can't corrupt starts:
  ```ts
  const step = (target: gsap.TweenTarget, from: gsap.TweenVars, to: gsap.TweenVars, at: number) =>
    tl.fromTo(target, from, { ...to, immediateRender: false }, at);
  ```
- **Geometry lives in CSS variables**, animated by GSAP: `step(frame, { "--grow": 0 }, { "--grow": 1, duration: GROW, ease: "power2.inOut" }, t)`, with `w-[calc(var(--fw)_+_(100%_-_var(--fw))*var(--grow))]`.
- **One-shot reveals**: `ScrollTrigger.create({ trigger, start: "top 85%", once: true, onEnter: () => gsap.to(els, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.08 }) })` into `overflow-clip` masks.
- **Scrubbed word fill** (`Statement.tsx`): `SplitText.create(el, { type: "words" })` then `gsap.from(words, { color: "#6f6b64", ease: "none", stagger: 0.12, scrollTrigger: { start: "top 78%", end: "bottom 42%", scrub: true } })`.
- **Stacking cards** (`Files.tsx`): `position: sticky` with `top: calc(var(--stick) + var(--i) * var(--step))`. A shade on the covered card is scrubbed from the next card's `top bottom` to its sticky top.
- **Marquee** (`components/ui/Marquee.tsx`): four copies, a CSS keyframe to `translateX(-50%)`, paused until an IntersectionObserver sets `data-running`.
- **Page transitions**: `TLink` wraps `next/link` and calls `navigate(href, { flight, label })`. The provider runs leave (clip-path sheet `inset(100% 0 0 0)` → `inset(0)`, 0.7 s `power3.inOut`), then `router.push(..., { scroll: false })`, resets scroll, then enters (0.95 s `power2.inOut`). Pages register enter animations with `usePageEnter(fn)`. A clicked artifact can be cloned into a fixed layer and flown into the next page's header (shared element).
- **Eases**: arrivals `expo.out`; scans and transitions `power2.inOut` / `power3.inOut`; scrub segments `power2.inOut` or `none`; stamps `power4.out` in 0.14–0.16 s; check pops `back.out(3)`. CSS tokens: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` and `--ease-scan: cubic-bezier(0.65, 0, 0.35, 1)`.

## `app/layout.tsx` (verbatim, minus the SVG filter body)
```tsx
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Nothing_You_Could_Do, Schibsted_Grotesk } from "next/font/google";
import MotionProvider from "@/components/motion/MotionProvider";
import TransitionProvider from "@/components/transition/TransitionProvider";
import Nav from "@/components/nav/Nav";
import Cursor from "@/components/cursor/Cursor";
import Scrollbar from "@/components/scrollbar/Scrollbar";
import { person } from "@/content/site";
import "./globals.css";

// A newspaper grotesk for the system, a business-machine mono for data,
// and a ballpoint hand for anything written onto paper.
const display = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted-grotesk", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-ibm-plex-mono", display: "swap" });
const hand = Nothing_You_Could_Do({ subsets: ["latin"], weight: "400", variable: "--font-nothing-you-could-do", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ntz.vercel.app";
const DESCRIPTION =
  "Natnael Tadele is a full-stack software engineer in Addis Ababa building banking, logistics and education systems in TypeScript and Go.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${person.name} — ${person.title}`, template: `%s — ${person.name}` },
  description: DESCRIPTION,
  authors: [{ name: person.name, url: "https://github.com/nata-t" }],
  openGraph: {
    type: "website",
    siteName: "ntz",
    title: `${person.name} — ${person.title}`,
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Natnael Tadele, software engineer" }],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0f0f0e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before first paint. When motion is allowed, mark the document so
// elements the intro is about to animate start hidden (no flash between
// paint and hydration). The page's enter animation removes the mark; the
// timeout guarantees the page never stays hidden if scripts fail.
const PREPAINT = `(function(){try{var d=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.setAttribute('data-intro','');setTimeout(function(){d.removeAttribute('data-intro')},4500)}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${hand.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      </head>
      <body>
        <a
          href="#main"
          className="fixed top-3 left-page z-200 bg-sys-ink px-3.5 py-2.5 font-mono text-[12px] tracking-[0.04em] text-sys uppercase transform-[translateY(-160%)] transition-[transform] duration-250 ease-out focus-visible:transform-none"
        >
          Skip to content
        </a>
        <InkFilters />
        <MotionProvider>
          <TransitionProvider>
            <Nav />
            <main id="main">{children}</main>
            <Scrollbar />
            <Cursor />
          </TransitionProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
// InkFilters(): a hidden <svg> with filter#ink-rough (feTurbulence + feDisplacementMap + speckle), used by .stamp.
```
Font pattern: each `next/font/google` call exposes a `--font-<family>` variable on `<html>`, and `@theme` maps the role tokens (`--font-display/mono/hand`) to those variables plus fallbacks.

## `app/globals.css`: Tailwind v4 setup (head, verbatim)
```css
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities) source(none);

@source "../app";
@source "../components";

/* Plain :hover, not v4's (hover: hover)-gated default, so a tap still
   shows the hover state on touch screens. */
@custom-variant hover (&:hover);

/* Inclusive cut-offs (max-width), unlike the theme's exclusive ranges. */
@custom-variant max-xs (@media (max-width: 480px));
@custom-variant max-phone (@media (max-width: 600px));

/* Inside a section whose scroll stage is running (JS sets data-live on it). */
@custom-variant live (&:where([data-live] *));

/* The hero's stacked layout: phones, tablets, tall windows. */
@custom-variant stacked {
  @media (width < 64rem), (max-aspect-ratio: 4/5) {
    @slot;
  }
}

@theme {
  --color-*: initial;

  /* Paper world */
  --color-paper: #ffffff;
  --color-canary: var(--color-paper);
  --color-pink: var(--color-paper);
  --color-ink: #171614;
  --color-ink-2: rgba(23, 22, 20, 0.64);
  --color-ink-3: rgba(23, 22, 20, 0.42);
  --color-rule: rgba(23, 22, 20, 0.18);
  --color-ballpoint: #2b3fbf;

  /* System world */
  --color-sys: #0f0f0e;
  --color-sys-raised: #1a1917;
  --color-sys-ink: #ffffff;
  --color-sys-mute: rgba(255, 255, 255, 0.6);
  --color-sys-faint: rgba(255, 255, 255, 0.38);
  --color-sys-rule: rgba(255, 255, 255, 0.14);

  /* Shared */
  --color-stamp: #d93a26;
  --color-stamp-ink: #f2644d;
  --color-scan: #f4fff8;
  --shadow-scan:
    0 0 10px 1px rgba(244, 255, 248, 0.75),
    0 0 48px 8px rgba(196, 255, 222, 0.2);

  --spacing-page: clamp(16px, 2.8vw, 40px);
  --spacing-gutter: clamp(12px, 1.7vw, 24px);
  --spacing-nav: 64px;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-scan: cubic-bezier(0.65, 0, 0.35, 1);

  /* next/font sets the --font-<family> variables on <html>. */
  --font-display: var(--font-schibsted-grotesk), "Helvetica Neue", Arial, sans-serif;
  --font-mono: var(--font-ibm-plex-mono), ui-monospace, Menlo, Consolas, monospace;
  --font-hand: var(--font-nothing-you-could-do), "Bradley Hand", "Segoe Print", cursive;

  /* The system caret, blinking once the pointer rests. */
  --animate-blink: blink 1.05s steps(2, jump-none) infinite;
  @keyframes blink { 50% { opacity: 0; } }
  /* ...--animate-sweep */
}

/* Inline: these read variables set on the element that animates. */
@theme inline {
  /* Paused until the marquee is on screen (Marquee sets data-running). */
  --animate-marquee: marquee var(--speed, 28s) linear infinite var(--dir, normal) paused;
  @keyframes marquee { to { transform: translateX(-50%); } }
}
```
What to copy from this setup:
- **No preflight.** Only `theme.css` and `utilities.css` are imported, and `utilities` uses `source(none)` with explicit `@source` dirs. The site keeps its own small reset in `@layer base` (box-sizing, zeroed margins, unstyled lists, links and buttons, `img/svg/canvas/video { display:block; max-width:100% }`, `::selection`, `:focus-visible`).
- **`--color-*: initial`** wipes Tailwind's palette, so only the site's tokens exist (`bg-sys`, `text-sys-mute`, `border-sys-rule`).
- Spacing tokens give utilities: `px-page`, `gap-gutter`, `h-nav`. Ease tokens give `ease-out`.
- `@theme inline` holds animations that read per-element variables.
- Component classes (`.mono`, `.hand`, `.stamp`, `.paper-surface`, `.split-mask`) sit in `@layer components`, so utilities override them.
- Paint recipes too long for a class attribute are `@utility` (e.g. `clip-above-line { clip-path: inset(0 0 calc(100% - var(--line)) 0); }`, `perforated-top`, `ticket-notches`, `receipt-edge`).
- Lenis CSS lives in `@layer base` (`html.lenis, html.lenis body { height: auto }`, `.lenis.lenis-smooth { scroll-behavior: auto !important }`, `[data-lenis-prevent]`, `.lenis-stopped { overflow: hidden }`).
- Body: `background: var(--color-sys)`, `font-size: 17px; line-height: 1.5`, antialiased, `overflow-x: clip`.
- The token values drifted from `DESIGN.md`: paper became `#ffffff` and `--grain: none`. Use the CSS, not the doc, as the truth.

## ESLint (`eslint.config.mjs`, verbatim)
```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "next-env.d.ts", "assets-src/**", "scripts/og/**"]),
]);
```
There is no Prettier config in ntz. Formatting is long lines (~120–150 chars), double quotes, semicolons and trailing commas.

## `.claude/launch.json` (verbatim)
```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "ntz-dev",  "runtimeExecutable": "bun", "runtimeArgs": ["run", "dev", "--port", "3100"],   "port": 3100 },
    { "name": "ntz-prod", "runtimeExecutable": "bun", "runtimeArgs": ["run", "start", "--port", "3200"], "port": 3200 }
  ]
}
```
For ntz duo, use different ports (e.g. 3300/3400) so both can run at once.

## Other config
- `next.config.ts`: `reactStrictMode: true`, `poweredByHeader: false`, `images.formats: ["image/avif","image/webp"]`, `experimental.agentUpgrade: "security"`.
- `postcss.config.mjs`: `{ plugins: { "@tailwindcss/postcss": {} } }`.
- `.gitignore` covers `assets-src/`, `brand`, `*.tsbuildinfo`, `next-env.d.ts`, `.env*`.
- `app/sitemap.ts` and `app/robots.ts` use `NEXT_PUBLIC_SITE_URL`.
- Images go through `next/image` with explicit width and height from content (2400×1500).

---

# Part 2 — Motion patterns from inspirations

Root: `/home/natnael-tadele/Desktop/kilet/my-projects/inspirations/`. ntz's own source-level review is in
`ntz/docs/research.md`. This section pulls the techniques and excerpts that matter for the two ntz duo targets.

## 1. GSAP-Awwwards-Website (SPYLT): Vite + React, GSAP ScrollSmoother + SplitText

**Smooth scrolling.** `src/App.jsx` uses `ScrollSmoother.create({ smooth: 3, effects: true })` over a `#smooth-wrapper/#smooth-content` pair. ntz duo should keep Lenis instead.

**Pinned scrubbed clip-path "portal"** (`src/components/VideoPinSection.jsx`): a circle grows from 6% to full screen while pinned. This is the closest SPYLT has to a product zoom-in.
```js
const tl = gsap.timeline({
  scrollTrigger: { trigger: ".vd-pin-section", start: "-15% top", end: "200% top", scrub: 1.5, pin: true },
});
tl.to(".video-box", { clipPath: "circle(100% at 50% 50%)", ease: "power1.inOut" });
// initial style: clipPath: "circle(6% at 50% 50%)" (mobile: starts at 100%)
```

**Horizontal pinned track** (`src/components/FlavorSlider.jsx`): pin the section and translate it by its overflow plus extra dwell.
```js
const scrollAmount = sliderRef.current.scrollWidth - window.innerWidth;
gsap.timeline({ scrollTrigger: { trigger: ".flavor-section", start: "2% top",
  end: `+=${scrollAmount + 1500}px`, scrub: true, pin: true } })
  .to(".flavor-section", { x: `-${scrollAmount + 1500}px`, ease: "power1.inOut" });
```

**Clip-path centre-line wipe** (`src/components/ClipPathTitle.jsx`, `src/sections/BenefitSection.jsx`): titles start as a zero-width vertical line, `polygon(50% 0, 50% 0, 50% 100%, 50% 100%)`, then scrub open one after another to `polygon(0% 0%, 100% 0, 100% 100%, 0% 100%)` with `ease: "circ.out"` and `scrub: 1.5`. The same primitive works for a device screen "switching on".

**Split-text reveals** (`src/sections/HeroSection.jsx`, `NutritionSection.jsx`, `MessageSection.jsx`):
```js
const titleSplit = SplitText.create(".hero-title", { type: "chars" });
tl.from(titleSplit.chars, { yPercent: 200, stagger: 0.02, ease: "power2.out" }, "-=0.5");
// paragraphs: SplitText.create(p, { type: "words, lines", linesClass: "paragraph-line" }) → lines are overflow:hidden masks
// .from(split.words, { yPercent: 300, rotate: 3, ease: "power1.inOut", duration: 1, stagger: 0.01 })
// scrubbed word colour fill: gsap.to(split.words, { color: "#faeade", ease: "power1.in", stagger: 1, scrollTrigger: { scrub: true } })
```

**Hero exit "tilt away"** (`HeroSection.jsx`): `gsap.timeline({ scrollTrigger: { start: "1% top", end: "bottom top", scrub: true } }).to(".hero-container", { rotate: 7, scale: 0.9, yPercent: 30, ease: "power1.inOut" })`. Useful for folding the previous scene out of view.

**Overlapping pinned sections** (`src/sections/TestimonialSection.jsx`): `gsap.set(".testimonials-section", { marginTop: "-140vh" })` pulls the next section up over a pinned one, then a second pinned timeline brings cards in with `pinTl.from(".vd-card", { yPercent: 150, stagger: 0.2 })`.

**Eases used:** `power1.inOut` (scrub), `circ.out` / `circ.inOut` (clip wipes), `power2.out` (chars).

## 2. award-winning-website (Zentry clone): Vite + React, GSAP ScrollTrigger, native scroll

**Pinned scrub: a card grows to fill the viewport** (`src/components/About.jsx`). This is the simplest "zoom the device to full screen" primitive.
```js
gsap.timeline({ scrollTrigger: { trigger: "#clip", start: "center center", end: "+=800 center",
  scrub: 0.5, pin: true, pinSpacing: true } })
  .to(".mask-clip-path", { width: "100vw", height: "100vh", borderRadius: 0 });
```
Animating `width/height` causes layout. For ntz duo, prefer `scale` or ntz's `--grow` CSS-variable approach.

**Polygon frame morph on exit** (`src/components/Hero.jsx`): the frame is set to a skewed polygon and scrubbed from a full rect:
```js
gsap.set("#video-frame", { clipPath: "polygon(14% 0, 72% 0, 88% 90%, 0 95%)", borderRadius: "0% 0% 40% 10%" });
gsap.from("#video-frame", { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", borderRadius: "0% 0% 0% 0%",
  ease: "power1.inOut", scrollTrigger: { trigger: "#video-frame", start: "center center", end: "bottom center", scrub: true } });
```

**3D word reveal** (`src/components/AnimatedTitle.jsx` + `src/index.css` `.animated-word`): words start rotated behind the page plane and swing in.
```css
.animated-word { opacity: 0; transform: translate3d(10px, 51px, -60px) rotateY(60deg) rotateX(-40deg);
  transform-origin: 50% 50% -150px !important; will-change: opacity, transform; }
```
```js
gsap.timeline({ scrollTrigger: { trigger, start: "100 bottom", end: "center bottom", toggleActions: "play none none reverse" } })
  .to(".animated-word", { opacity: 1, transform: "translate3d(0,0,0) rotateY(0deg) rotateX(0deg)", ease: "power2.inOut", stagger: 0.02 }, 0);
```
Pushing `transform-origin` behind the plane (`-150px` z) makes elements hinge like a fold. This is directly reusable for device panels.

**Click-to-expand transition** (`Hero.jsx`): the next video scales from a small preview to `width/height: 100%` while the current one scales from 0, `power1.inOut`. Smaller pieces: hover tilt with `transformPerspective: 500` (`VideoPreview.jsx`) and a double-label button swap.

## 3. fizzi-soda-brand: Next 15 + r3f/drei + GSAP

**One shared WebGL canvas for the whole page** (`src/components/ViewCanvas.tsx`): a fixed, pointer-events-none `<Canvas>` renders every section's `<View>` scissored into its DOM rect.
```tsx
<Canvas style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", overflow: "hidden",
  pointerEvents: "none", zIndex: 30 }} shadows dpr={[1, 1.5]} gl={{ antialias: true }} camera={{ fov: 30 }}>
  <Suspense fallback={null}><View.Port /></Suspense>
</Canvas>
```

**GSAP scrubs 3D object transforms directly**, the core of a 3D "device unfolds / zooms / folds" (`src/slices/Hero/Scene.tsx`):
```ts
const scrollTl = gsap.timeline({ defaults: { duration: 2 },
  scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 1.5 } });
scrollTl
  .to(groupRef.current.rotation, { y: Math.PI * 2 })
  .to(can1Ref.current.position, { x: -0.2, y: -0.7, z: -2 }, 0)
  .to(can1Ref.current.rotation, { z: 0.3 }, 0)
  // ...
  .to(groupRef.current.position, { x: 1, duration: 3, ease: "sine.inOut" }, 1.3);
```
For a foldable device, the hinge would be `panelRef.current.rotation.y` from `Math.PI` (closed) to `0` (open) and back, with the camera `position.z` (or group scale) as the zoom.

**Pinned 3D scene with keyframes on one axis** (`src/slices/SkyDive/Scene.tsx`): `scrollTrigger: { trigger: ".skydive", pin: true, start: "top top", end: "+=2000", scrub: 1.5 }`. It also tweens `body` `backgroundColor` inside the scrubbed timeline (a section colour change as a scroll event) and moves words with `keyframes: [{x:0,y:0,z:-1}, {...getXYPositions(-7), z:-7}]`. Helpers keep every move on one designed 75° axis: `getXPosition = d => d * Math.cos(ANGLE)`.

**Object travels between pinned text blocks** (`src/slices/AlternatingText/Scene.tsx`): `pin: true, endTrigger: ".alternating-text-container", start: "top top", end: "bottom bottom", scrub: true`. The can swaps sides (`position.x` ±1, `rotation.y` ±0.4, `ease: "circ.inOut"`) for each text section. This is a good model for a device that stays on screen while copy blocks scroll past.

**DOM/3D intro handshake** (`src/hooks/useStore.ts` + `slices/Hero/index.tsx`): a zustand `ready` flag is set by the 3D scene once refs exist, and the DOM headline timeline waits for it (`if (!ready && isDesktop) return;`). Mobile gets a static image instead of 3D.

## 4. artcraft-website-next: Next 16 + Lenis + r3f (ntz's engineering backbone)

**Lenis + ticker + route reset** (`src/components/motion-provider.tsx`). ntz's MotionProvider was copied from this, with `lerp: 0.12, anchors: true`. Its `RouteScrollReset` is the reusable part ntz folded into its TransitionProvider:
```tsx
// Snap Lenis to the top on each new route, except on the first render, on back/forward and for #hash targets.
useEffect(() => {
  if (pathname === lastPathname.current) return;
  lastPathname.current = pathname;
  const traversed = traversalPath.current === pathname;   // set by a popstate listener
  traversalPath.current = null;
  if (traversed || window.location.hash) return;
  lenisRef.current?.scrollTo(0, { immediate: true, force: true });
}, [pathname]);
```

**Progressive-enhancement reveals** (`src/components/reveal-manager.tsx`): `[data-reveal]` is visible in the server HTML. Only `gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", ...)` hides and reveals it.
```ts
const HIDDEN = { autoAlpha: 0, y: 28, filter: "blur(8px)" } as const;
const SHOWN = { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out", overwrite: true,
  clearProps: "all" } as const; // clearProps: a lingering blur(0px) keeps a composited layer and kills subpixel AA
```

**Scrubbed word build + hold** (`src/components/campaign/manifesto.tsx`): words go from `opacity 0.15, y 6` to `1, 0` at `i * 0.5`, a sweep rule runs `scaleX 0→1`, then `tl.to({}, { duration: 4 }); // hold`. An **empty tween as a dwell** is the standard way to hold a pinned frame.

**WebGL hygiene** (`src/lib/webgl-support.ts`, `src/components/landing/hero-galaxy.tsx`): probe once before mounting a canvas (ntz copied this into `lib/env.ts`). Use `dpr={[1, 1.5]}`, and pause off screen with `frameloop={onScreen ? "always" : "never"}`, driven by an IntersectionObserver (`rootMargin: "600px 0px"`) plus `visibilitychange`.

**Infinite conveyor without visible seams** (`hero-galaxy.tsx` ~l.485): cards are recycled only once fully past the viewport corner: "Cards travel until fully past the viewport corner (plus a card of margin) before wrapping — the death is never on screen." Scroll feeds the conveyor as `P = st.idleP + (window.scrollY * mv.scrub) / 1000`.

**Master intro clock** (`src/lib/intro.ts`): one `introClock.t` advanced from `gsap.ticker`. Any input fast-forwards it (`ffScale`), so nothing jump-cuts.

Eases: `power3.out` (reveals), `power2.out` (rules), CSS `cubic-bezier(0.2, 0.9, 0.2, 1)`.

## 5. bruno-arizio: vanilla ES classes, Three.js, GSAP 2, custom PJAX

**Infinite vertical slider: the modulo wrap** (`app/components/Canvas/Home/index.js`). This is the reference for "scroll past the end returns to the top". Scroll is virtual (wheel/touch → `target`), smoothed with lerp, and items are relocated by the total height when they leave on the far side.
```js
update() {
  const height = this.sizes.environment.height * 1.33
  this.indexInfinite = Math.round(this.scroll.values.target / height)
  let index = this.indexInfinite % this.covers.length
  if (this.indexInfinite < 0) index = (this.covers.length - Math.abs(this.indexInfinite % this.covers.length)) % this.covers.length
  this.position.current += (this.scroll.values.target - this.position.current) * 0.1   // lerp
  this.calculate()
}
calculate() {
  const heightTotal = height * this.covers.length
  each(this.projects, (child) => {
    child.isAfter = child.position.y < -height
    child.isBefore = child.position.y > height
    if (this.direction === 'down' && child.isBefore) child.location -= heightTotal   // recycle to the far end
    if (this.direction === 'up' && child.isAfter) child.location += heightTotal
    child.update(this.position.current)
  })
}
onCheck() { this.scroll.values.target = height * this.indexInfinite }   // debounced snap to nearest item
```
Wheel input goes through `normalize-wheel` (`app/index.js`: `const speed = Normalize(event).pixelY * 0.2`). A horizontal DOM version of the same recycle logic is in `app/classes/Slider.js`: `element.position += clientWidth` when `isBefore`, applied with `TweenMax.set(element, { x })`.

**Persistent canvas across routes + WebGL transition** (`app/index.js` `onRequest`): fetch the HTML, `await this.page.hide()`, swap `.content`, `await this.canvas.onChange(slug, this.slug, page.index)` (the title meshes interpolate from old to new positions), then `page.show()`. The canvas never unmounts, so the clicked object becomes the next page's header.

**Physical "wobble" distortion** (`app/shaders/title-vert.glsl`, `Canvas/Home/Title.js`):
```glsl
newPosition.z -= distortion * max(pow(distortionX, length(position.x)/50.0) + pow(distortionY, length(position.y)/50.0), 2.2);
```
`distortion` is tweened `5 → 0` with `Power4.easeOut` over 2 s on entry, and it yoyos while dragging. The same uniform can add a subtle bend to a screen plane as it folds.

## 6. musabhassan.com: SvelteKit 5, anime.js, Three.js

**Horizontal "typeset" letter reveal** (`src/lib/animations.ts` `letterSlideIn`): every letter is in a clip mask, letters start at `translateX(150%)` and their word mask at `80%`, and both slide to 0. The original `innerHTML` is restored on completion. Eases: in `cubicBezier(.2, .58, .43, 1)`, out `BezierEasing(.32, .24, .76, .26)`.

**Opposite-direction mask wipe** (`maskSlideIn`): the mask moves from `+100%` while the content moves from `-100%`, with `cubicBezier(.58,.14,.06,.97)`. This gives a crisp shutter that reads well on a device screen change.

**Lerped drag track with clamped ends and velocity → shader** (`src/lib/sections/work.svelte`):
```ts
this.currentPosition = this.lerp(this.currentPosition, this.targetPosition, this.lerpSpeed); // 0.1
workScrollState.speed = Math.round((this.currentPosition - this.targetPosition) * 100) / 100;
listContainer.style.transform = `translate3d(${Math.round(this.currentPosition * 100) / 100}px, 0px, 0px)`;
```
The speed feeds `uOffset` in `src/lib/effects/work-slider/shaders.ts` (`position.x += sin(uv.y * PI) * offset.x`), so planes bend with velocity. WebGL is gated by `getGPUTier()`: tier ≥ 2, not mobile, fps ≥ 30.

---

## 7. Recipes for ntz duo

### 7a. Apple-style product reveal: unfold → zoom → fold
None of the inspirations does exactly this. Combine ntz's sticky stage (`components/case/Screens.tsx`), Zentry's
behind-the-plane transform origin, fizzi's object-transform scrub and ntz's own CSS-3D tri-fold
(`components/artifacts/Artifact.tsx` `Trifold()`: panels `origin-right` / `origin-left` with
`transform-[rotateY(var(--fold,18deg))]` inside `perspective-[60em]`, flattened by `in-data-open:[--fold:0deg]`).

DOM/CSS-3D version (no WebGL; crisp screenshots; cheapest):
```tsx
// Section height = steps × 100svh; the sticky child is the stage (ntz's Screens pattern).
// <section ref={root} className="relative data-live:h-[calc(var(--steps)*100svh)]">
//   <div className="live:sticky live:top-0 live:h-svh live:overflow-clip perspective-[1600px]">
//     <div data-device className="[transform-style:preserve-3d] [--fold:1] [--zoom:0]">
//       <div data-left  className="origin-right [transform:rotateY(calc(var(--fold)*-180deg))] [backface-visibility:hidden]" />
//       <div data-right className="origin-left  [transform:rotateY(calc(var(--fold)*180deg))]  [backface-visibility:hidden]" />
//     </div>
//   </div>
// </section>
const UNFOLD = 1.2, DWELL = 0.6, ZOOM = 1.4, HOLD = 0.8, FOLD = 1.2; // in viewport heights
useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const el = root.current!;
    const device = el.querySelector<HTMLElement>("[data-device]")!;
    el.dataset.live = "";
    el.style.setProperty("--steps", String(UNFOLD + DWELL + ZOOM + HOLD + FOLD + 1));
    const tl = gsap.timeline({ defaults: { ease: "none" },
      scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: true, invalidateOnRefresh: true } });
    const step = (t: gsap.TweenTarget, from: gsap.TweenVars, to: gsap.TweenVars, at: number) =>
      tl.fromTo(t, from, { ...to, immediateRender: false }, at);
    let t = 0;
    step(device, { "--fold": 1, rotateX: 12, y: "8vh" }, { "--fold": 0, rotateX: 0, y: 0, duration: UNFOLD, ease: "power2.inOut" }, t);
    t += UNFOLD + DWELL;
    step(device, { "--zoom": 0 }, { "--zoom": 1, duration: ZOOM, ease: "power2.inOut" }, t);   // scale/--grow to full stage
    t += ZOOM + HOLD;                                                                          // tl.to({}, {duration}) also works as a dwell
    step(device, { "--zoom": 1 }, { "--zoom": 0, duration: FOLD * 0.5, ease: "power2.inOut" }, t);
    step(device, { "--fold": 0 }, { "--fold": 1, duration: FOLD, ease: "power3.in" }, t + FOLD * 0.3);
    return () => { delete el.dataset.live; el.style.removeProperty("--steps"); };
  });
  return () => mm.revert();
}, { scope: root });
```
Notes:
- Drive geometry through CSS variables (`--fold`, `--zoom`, like ntz's `--grow`) so the layout follows the viewport without re-measuring.
- Use `scale` for the zoom rather than width/height (Zentry animates width/height, which causes layout).
- Screen content changing inside the device: use a SPYLT centre-line `clip-path` wipe or a musab opposite-direction mask, placed at timeline labels.
- A WebGL version follows fizzi: one fixed canvas, a GLTF device, and GSAP tweening `hinge.rotation.y` and `camera.position.z` on the same scrubbed timeline. Probe WebGL first (`lib/env.ts`) and fall back to the DOM version.
- **Image-sequence scrubbing** (the classic AirPods technique) is not used in any inspiration. If needed: preload N frames, draw `frames[Math.round(progress * (N - 1))]` to a `<canvas>` from `onUpdate: self => ...` of the same ScrollTrigger, and skip it under reduced motion.
- Reduced motion: no `data-live`, so the static layout shows the device open with the screens stacked below.

### 7b. Seamless infinite-loop scroll (past the end → back to the top)
Lenis 1.3.27 (already in ntz) supports this natively. `node_modules/lenis/README.md` documents `infinite`: "Enable infinite scrolling! `syncTouch: true` is required on touch devices". Internally `scroll` returns `modulo(animatedScroll, limit)` and `scrollTo` picks the shortest wrapped distance (`dist/lenis.mjs` ~l.795).
```ts
const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9, infinite: true, syncTouch: true });
```
To make the jump from `limit` to `0` invisible:
1. **End the document with a clone of its first viewport.** The last `100svh` must render exactly what `scrollY = 0` renders (the hero), so modulo lands on identical pixels. Mark the clone `aria-hidden` and `inert`. This is the same trick as ntz's `Marquee` (two copies, `translateX(-50%)`) and the inverse of bruno's recycle-by-`heightTotal`.
2. **Scroll-linked animations must agree at both ends.** A ScrollTrigger at the top (hero intro scrub) and its counterpart on the clone must produce the same frame. The simplest way is to give the clone no triggers and keep the hero's scrub state at progress 0 static.
3. **Refresh** `ScrollTrigger` after the wrap only if layout changed. Lenis already calls `ScrollTrigger.update` per frame via `lenis.on("scroll", ScrollTrigger.update)`.
4. **Native fallback**: with no Lenis (reduced motion or touch without `syncTouch`), the page simply ends. Show a "Back to top ↑" (ntz footer uses `scrollToTarget(0)`) instead of the clone, or hide the clone with `motion-reduce:hidden`.
5. Alternative, fully virtual (bruno-arizio): no document scroll. Wheel/touch → `target`, lerp 0.1 → `current`, sections positioned with `y = location - current`, and each moved by `±heightTotal` once it is a full height past the edge. Index = `((round(target / h) % n) + n) % n`. This gives full control (snap, velocity effects) but loses native scrolling, find-in-page and anchor links. Prefer Lenis `infinite`.
