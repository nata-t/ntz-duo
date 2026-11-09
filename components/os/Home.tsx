"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { os, useDims, useOS, type Slot } from "@/lib/os";
import { projects } from "@/content/site";
import AppIcon from "./AppIcon";
import {
  CalendarWidget,
  ClockWidget,
  ExperienceWidget,
  MapWidget,
  PortraitWidget,
  StackWidget,
  WeatherWidget,
  WorkWidget,
} from "./widgets";

// The inner display's Home Screen. Open flat in landscape it reads as two
// pages of a book: a large widget on the left, small widgets and the icon
// grid on the right, and the system's trailing rail with the status bar,
// the dock and Search. Held upright (portrait) it falls back to the classic
// iPhone arrangement: status bar on top, dock along the bottom. With an app
// in one half, the Home Screen shrinks into the other half and keeps working.

/** The trailing rail: status bar, dock and Search (UI kit: 84 pt). */
export const SIDE = 84;
/** Portrait's top status bar band. */
export const TOP = 54;
const ICON = 62, CELL = 96, ROW = 102, SMALL = 158, GAP = 22, LARGE_W = 344, LARGE_H = 488;

export const DOCK = ["contact", "mail", "photos", "settings"];
const GRID = [
  ...projects.slice(2).map((p) => p.slug),
  ...projects.slice(0, 2).map((p) => p.slug),
  "about",
  "resume",
  "notes",
  "github",
  "linkedin",
  "telegram",
];

type Layout = "land" | "land-half" | "port" | "port-half";
export const pageCount = (layout: Layout) => (layout === "port" ? 3 : layout === "port-half" ? 1 : 2);
/** Pages the Home Screen has in a region, for wheel paging. */
export const homePages = (portrait: boolean, region: Slot) =>
  pageCount(portrait ? (region === "full" ? "port" : "port-half") : region === "full" ? "land" : "land-half");

function Icons({ ids, x0, y0, cell = CELL, row = ROW, mirror }: { ids: string[]; x0: number; y0: number; cell?: number; row?: number; mirror: boolean }) {
  return (
    <>
      {ids.map((id, i) => (
        <div key={id} className="absolute" style={{ left: x0 + (i % 4) * cell + (cell - (ICON + 18)) / 2, top: y0 + Math.floor(i / 4) * row }}>
          <AppIcon id={id} size={ICON} mirror={mirror} />
        </div>
      ))}
    </>
  );
}

/** One page, in the region's own coordinates. */
function Page({ page, width, height, layout, rail, mirror }: { page: number; width: number; height: number; layout: Layout; rail: boolean; mirror: boolean }) {
  const pair = 2 * SMALL + GAP;
  const style = { width, left: page * width };
  // Upright, columns narrow to fit a phone-width screen (full screen on a
  // phone is about 400 pt across).
  const col = Math.min(132, (width - 24) / 4);

  if (layout === "port-half")
    return (
      <div className="absolute top-0 h-full" style={style}>
        <Icons ids={[...GRID, ...DOCK]} x0={(width - 4 * col) / 2} y0={28} cell={col} row={(height - 50) / 4} mirror={mirror} />
      </div>
    );

  if (layout === "port") {
    const cx = (width - pair) / 2;
    // The tall widget gives up height before it crowds Search and the dock.
    const largeH = Math.min(LARGE_H, height - (TOP + 26) - GAP - SMALL - 196);
    return (
      <div className="absolute top-0 h-full" style={style}>
        {page === 0 ? (
          <>
            <div className="absolute flex" style={{ left: cx, top: TOP + 26, gap: GAP }}>
              <WeatherWidget size={SMALL} />
              <MapWidget size={SMALL} />
            </div>
            <Icons ids={GRID} x0={(width - 4 * col) / 2} y0={TOP + 26 + SMALL + 40} cell={col} row={122} mirror={mirror} />
          </>
        ) : page === 1 ? (
          <>
            <div className="absolute" style={{ left: (width - LARGE_W) / 2, top: TOP + 26 }}>
              <PortraitWidget w={LARGE_W} h={largeH} />
            </div>
            <div className="absolute flex" style={{ left: cx, top: TOP + 26 + largeH + GAP, gap: GAP }}>
              <ClockWidget size={SMALL} />
              <CalendarWidget size={SMALL} />
            </div>
          </>
        ) : (
          <>
            <div className="absolute" style={{ left: (width - LARGE_W) / 2, top: TOP + 26 }}>
              <ExperienceWidget w={LARGE_W} h={largeH} />
            </div>
            <div className="absolute" style={{ left: cx, top: TOP + 26 + largeH + GAP }}>
              <StackWidget w={pair} h={SMALL} />
            </div>
          </>
        )}
      </div>
    );
  }

  // Landscape: the right-hand block is small widgets over the grid; open
  // full, the left page carries one large widget.
  const full = layout === "land";
  const half = (width + SIDE) / 2;
  const area = full ? width - half : width;
  const left = full ? half : 0;
  const x0 = left + (area - 4 * CELL) / 2;
  const wx = left + (area - pair) / 2;
  const top = 80;

  return (
    <div className="absolute top-0 h-full" style={style}>
      {full ? (
        <div className="absolute" style={{ left: (half - LARGE_W) / 2, top: (height - LARGE_H) / 2 }}>
          {page === 0 ? <PortraitWidget w={LARGE_W} h={LARGE_H} /> : <ExperienceWidget w={LARGE_W} h={LARGE_H} />}
        </div>
      ) : null}
      {page === 0 && !rail ? (
        // A left half has no rail, so the dock's apps join the grid.
        <Icons ids={[...GRID, ...DOCK]} x0={x0} y0={56} row={128} mirror={mirror} />
      ) : page === 0 ? (
        <>
          <div className="absolute flex" style={{ left: wx, top, gap: GAP }}>
            <WeatherWidget size={SMALL} />
            <MapWidget size={SMALL} />
          </div>
          <Icons ids={GRID} x0={x0} y0={top + SMALL + 26} mirror={mirror} />
        </>
      ) : (
        <>
          <div className="absolute flex" style={{ left: wx, top, gap: GAP }}>
            <ClockWidget size={SMALL} />
            <CalendarWidget size={SMALL} />
          </div>
          <div className="absolute" style={{ left: wx, top: top + SMALL + GAP }}>
            <StackWidget w={pair} h={SMALL} />
          </div>
          <div className="absolute" style={{ left: wx, top: top + 2 * (SMALL + GAP) }}>
            <WorkWidget w={pair} h={124} />
          </div>
        </>
      )}
    </div>
  );
}

export default function Home({ region, mirror = false }: { region: Slot; mirror?: boolean }) {
  const page = useOS((s) => s.page);
  const portrait = useOS((s) => s.portrait);
  const { w: W, h: H } = useDims();
  const strip = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; dx: number } | null>(null);

  // The region the Home Screen occupies on the display.
  const full = region === "full";
  const layout: Layout = portrait ? (full ? "port" : "port-half") : full ? "land" : "land-half";
  const pages = pageCount(layout);
  const at = Math.min(page, pages - 1);
  let x = 0, y = 0, width = W, height = H;
  if (!full) {
    if (portrait) {
      height = H / 2 - 5.5;
      y = region === "right" ? H / 2 + 5.5 : 0;
    } else {
      width = W / 2 - 5.5;
      x = region === "right" ? W / 2 + 5.5 : 0;
    }
  }
  // In landscape the trailing rail belongs to whatever touches the right
  // edge; the pages stop short of it.
  const rail = !portrait && (full || region === "right");
  const inner = rail ? width - SIDE : width;

  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    if (mirror) {
      el.style.transform = `translate3d(${-at * inner}px,0,0)`;
      return;
    }
    gsap.to(el, { x: -at * inner, duration: 0.55, ease: "expo.out", overwrite: true });
  }, [at, inner, mirror]);

  const onDown = (e: React.PointerEvent) => {
    if (mirror || (e.target as HTMLElement).closest("button")) return;
    drag.current = { x: e.clientX, dx: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !strip.current) return;
    const scale = (e.currentTarget as HTMLElement).getBoundingClientRect().width / width;
    d.dx = (e.clientX - d.x) / scale;
    const edge = (at === 0 && d.dx > 0) || (at === pages - 1 && d.dx < 0) ? 0.35 : 1;
    gsap.set(strip.current, { x: -at * inner + d.dx * edge });
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const next = Math.abs(d.dx) > inner * 0.18 ? Math.min(pages - 1, Math.max(0, at + (d.dx < 0 ? 1 : -1))) : at;
    if (next !== at) os.set({ page: next });
    else if (strip.current) gsap.to(strip.current, { x: -at * inner, duration: 0.5, ease: "expo.out" });
  };

  const dotsX = layout === "land" ? (inner + (inner + SIDE) / 2) / 2 : inner / 2;

  return (
    <div
      data-home
      className="absolute overflow-hidden"
      style={{ left: x, top: y, width, height, touchAction: "pan-y" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* Pages stop at the rail: the next one waits off to the side. */}
      <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: inner }}>
        <div ref={strip} className="absolute inset-y-0 left-0" style={{ width: inner }}>
          {Array.from({ length: pages }, (_, i) => (
            <Page key={i} page={i} width={inner} height={height} layout={layout} rail={rail || portrait} mirror={mirror} />
          ))}
        </div>
      </div>

      {pages > 1 ? (
        // Upright, the dots sit over Search, clear of it.
        <div className="absolute flex gap-[8px]" style={{ left: dotsX - (pages * 7 + (pages - 1) * 8) / 2, bottom: portrait ? 170 : 26 }}>
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              tabIndex={mirror ? -1 : 0}
              aria-label={`Page ${i + 1}`}
              onClick={() => os.set({ page: i })}
              className={`size-[7px] rounded-full transition-colors duration-300 ${i === at ? "bg-[rgba(255,255,255,0.95)]" : "bg-[rgba(255,255,255,0.4)]"}`}
            />
          ))}
        </div>
      ) : null}

      {rail ? <Dock vertical width={width} height={height} mirror={mirror} /> : layout === "port" ? <Dock vertical={false} width={width} height={height} mirror={mirror} /> : null}
    </div>
  );
}

/** The dock and the Search button: in the trailing rail in landscape,
 *  along the bottom in portrait. */
function Dock({ vertical, width, height, mirror }: { vertical: boolean; width: number; height: number; mirror: boolean }) {
  const size = 52, pad = 8, gap = 12;
  const long = DOCK.length * size + (DOCK.length - 1) * gap + 2 * pad;
  const thick = size + 2 * pad;
  const box = vertical
    ? { left: width - SIDE + (SIDE - thick) / 2, top: height / 2 - long / 2 + 34, width: thick, height: long }
    : { left: (width - long) / 2, top: height - thick - 24, width: long, height: thick };
  const search = vertical ? { left: width - SIDE + (SIDE - 46) / 2, top: height - 66 } : { left: (width - 46) / 2, top: height - thick - 24 - 62 };

  return (
    <>
      <div className={`glass-clear absolute flex items-center ${vertical ? "flex-col" : "flex-row"}`} style={{ ...box, padding: pad, gap, borderRadius: thick / 2 }}>
        {DOCK.map((id) => (
          <div key={id} style={{ width: size, height: size }} className="grid place-items-center">
            <div className="-mx-[9px]">
              <AppIcon id={id} size={size} label={false} mirror={mirror} />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        tabIndex={mirror ? -1 : 0}
        aria-label="Search"
        onClick={() => os.set({ overlay: "search" })}
        className="glass-clear absolute grid size-[46px] place-items-center rounded-full text-white transition-transform active:scale-90"
        style={search}
      >
        <svg width="19" height="19" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="m13 13 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
    </>
  );
}
