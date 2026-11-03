# ntz duo

Portfolio of Natnael Tadele, software engineer in Addis Ababa, told through a
foldable phone.

**Concept — Hello, hello.** The page is one scroll story around an iPhone Duo.
It starts closed on its Lock Screen, turns to show its edge and back, opens like
a book and comes close until its inner display fills the window. There the
phone is live: open apps, put two side by side, page the Home Screen, pull down
Control Center. Scroll outside the screen and it folds into a tent showing
StandBy above the footer; keep scrolling and the story starts again, seamlessly.

## Run

```bash
bun install
bun dev           # http://localhost:3000
bun run build && bun start
```

Set `NEXT_PUBLIC_SITE_URL` to the production origin before deploying.

## Edit content

Everything comes from [content/site.ts](content/site.ts) (profile, contact,
socials, experience, skills, projects). Lines marked `// REVIEW` were drafted
and still need a yes. Project screenshots live in `public/projects/<slug>/`.

Deep links open an app on arrival: `/#about`, `/#contact`, `/#photos`, or any
project slug.

## Structure

```
app/                 layout (fonts, theme prepaint), page, icon
components/
  stage/             the scroll story: Stage (pin, loop, snap), story.ts (poses
                     on a clock), HeroCopy, Nav, Footer
  device/            the CSS 3D phone: geometry, pose math, Device (slabs,
                     extruded walls, camera plateau, faces, live display)
  os/                iOS 27 on the inner display: InnerDisplay, Home, widgets,
                     icons, Window (launch/close/split), StatusBar,
                     ControlCenter, Search, Alert
  outer/             the outer display: Lock Screen and StandBy
  apps/              one folder per app; registry.tsx lists them
lib/                 gsap, lenis, env, store, os (phone state), spring
docs/                research (web, Figma spec, content), app brief
scripts/shoot.mjs    headless screenshots at any moment of the story
```

## How it works

- **The device** is CSS 3D, not WebGL, so its inner display is real DOM:
  crisp at any size, interactive, accessible. Each half is a slab with a
  front, a back and a side wall of thin strips stood on edge around its
  rounded outline. Faces are shaded from their normals every frame.
- **The story** (`components/stage/story.ts`) lists poses on a clock (one unit
  is one viewport of scrolling). Every pose property follows a monotone cubic
  between keys, so motion carries through without stalls or overshoot.
- **One OS, three copies.** The phone's state is one store (`lib/os.ts`). The
  live display renders it when the device lies flat; while it folds, each half
  renders the same state as a static mirror, so an open app stays open as the
  phone closes around it.
- **Sizing.** The device is built at the zoom `k` that makes it fill the
  viewport, and its displays use CSS `zoom`, so the interactive state is never
  an upscaled raster. On phones the open device turns upright and iOS lays out
  in portrait.
- **Scroll.** Lenis on GSAP's ticker. While the phone is live, wheel input over
  it goes to the phone (app scroll views first, else Home Screen paging); the
  margin around it scrolls the page. The last frame equals the first, so the
  jump back to the top is invisible.

## Screenshots

```bash
node scripts/shoot.mjs 4.3 1440 900 light "document.querySelector('[data-os-root=live] [data-app=about]').click()"
```

Arguments: story time(s), viewport, color scheme, JS to run. Output goes to
`/tmp/duo-shots/`.

## Motion and fallbacks

- `prefers-reduced-motion`: no Lenis, no intro, no idle float; the story still
  follows the scroll position.
- `prefers-reduced-transparency`: glass becomes opaque.
- Appearance follows the system until changed in Settings, Control Center or
  the nav; the device finish follows it too (Star White / Night Sky).
