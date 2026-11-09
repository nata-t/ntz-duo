"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useOS } from "@/lib/os";
import { reducedMotion } from "@/lib/env";
import { scrollToStory, storyTrack } from "./navigate";
import { CHAPTERS, LENGTH } from "./story";

// The page's scrollbar, as iOS would draw it: a vertical page control. Each
// chapter of the story is a dot; the one you're in stretches into a capsule
// that fills as you read it, like the Lock Screen's progress page control.
//
// At rest the dots float bare on the page. Scrolling lifts a Liquid Glass
// capsule under them and names the chapter in a glass pill beside it, the
// way Photos names the month you're scrubbing past. Hovering morphs that
// capsule into a menu of chapters; click one to go there. Drag along the
// control to scrub the story: each row spans its own chapter, so the
// capsule under the pointer fills as the phone moves through it. Crossing
// into a chapter gives a visual tap, a stand-in for the haptic detent.
//
// The story loops, so the control does too: past StandBy, Hello fills again.
//
// Hidden on touch screens (they keep the native indicator) and in full
// screen, where the phone has the whole window.
export default function Scrollbar() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    const wide = window.matchMedia("(min-width: 768px)");
    const sync = () => setEnabled(!coarse.matches && wide.matches);
    sync();
    coarse.addEventListener("change", sync);
    wide.addEventListener("change", sync);
    return () => {
      coarse.removeEventListener("change", sync);
      wide.removeEventListener("change", sync);
    };
  }, []);
  return enabled ? <Chapters /> : null;
}

/** Row heights at rest (a dot, the current capsule) and open, and the
 *  control's padding: the scroll pill sits beside the capsule from these. */
const ROW = 16;
const CURRENT = 40;
const PAD = 10;
/** How long the control stays awake after the scroll stops, in ms. */
const IDLE = 900;

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** The chapter at story time t, and how far through it. */
function locate(t: number) {
  let i = 0;
  CHAPTERS.forEach((c, j) => {
    if (t >= c.from) i = j;
  });
  const from = CHAPTERS[i]!.from;
  const end = CHAPTERS[i + 1]?.from ?? LENGTH;
  return { i, f: clamp((t - from) / (end - from)) };
}

function Chapters() {
  const root = useRef<HTMLElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const rows = useRef<(HTMLButtonElement | null)[]>([]);
  const progress = useRef(0);
  const dragged = useRef(false);
  const tapped = useRef(false);
  const [cur, setCur] = useState(0);
  const full = useOS((s) => s.screen !== null);

  const paint = () => {
    if (fill.current) fill.current.style.transform = `translate3d(0, ${(progress.current - 1) * 100}%, 0)`;
  };

  // Follow the story every frame. The track's geometry is cached; only the
  // scroll position is read per frame.
  useEffect(() => {
    const el = root.current!;
    const html = document.documentElement;
    html.classList.add("no-scrollbar");
    const geo = { top: 0, range: 1 };
    const measure = () => {
      const track = storyTrack();
      if (!track) return;
      geo.top = track.offsetTop;
      geo.range = Math.max(1, track.offsetHeight - window.innerHeight);
    };
    measure();
    const track = storyTrack();
    const ro = new ResizeObserver(measure);
    if (track) ro.observe(track);
    window.addEventListener("resize", measure);

    let last = -1;
    let idx = -1;
    let moved = 0;
    const tick = () => {
      const t = clamp((window.scrollY - geo.top) / geo.range) * LENGTH;
      const now = performance.now();
      if (t !== last) {
        if (last >= 0) {
          moved = now;
          el.dataset.scrolling = "";
        }
        last = t;
        const { i, f } = locate(t);
        progress.current = f;
        if (i !== idx) {
          idx = i;
          setCur(i);
        }
        paint();
      } else if (el.dataset.scrolling !== undefined && now - moved > IDLE) {
        delete el.dataset.scrolling;
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      html.classList.remove("no-scrollbar");
    };
  }, []);

  // A new chapter: the fill moves to its capsule, which taps once.
  useLayoutEffect(() => {
    paint();
    if (!tapped.current) {
      tapped.current = true;
      return;
    }
    if (reducedMotion()) return;
    dots.current[cur]?.animate([{ scale: "1" }, { scale: "1.6 1.08" }, { scale: "1" }], {
      duration: 420,
      easing: "cubic-bezier(0.2, 1.3, 0.4, 1)",
    });
  }, [cur]);

  // Hover (or focus) opens the menu after a beat, so grazing the window's
  // edge doesn't; leaving closes it after a short grace. Dragging scrubs.
  useEffect(() => {
    const el = root.current!;
    let timer = 0;
    let press: { y: number; id: number } | null = null;
    let dragging = false;

    const open = (delay: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => (el.dataset.open = ""), delay);
    };
    const close = () => {
      window.clearTimeout(timer);
      if (dragging) return;
      timer = window.setTimeout(() => delete el.dataset.open, 260);
    };

    // Each row spans its own chapter, top to bottom.
    const scrub = (y: number) => {
      const boxes = rows.current.map((r) => r!.getBoundingClientRect());
      let i = boxes.findIndex((b) => y < b.bottom);
      if (i < 0) i = boxes.length - 1;
      const b = boxes[i]!;
      const from = CHAPTERS[i]!.from;
      const end = CHAPTERS[i + 1]?.from ?? LENGTH;
      // Short of the very end: the last frame jumps back to the first.
      const t = Math.min(LENGTH - 0.02, from + clamp((y - b.top) / b.height) * (end - from));
      scrollToStory(t, { immediate: true });
    };

    const onEnter = () => open(90);
    const onLeave = () => close();
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      press = { y: e.clientY, id: e.pointerId };
      dragged.current = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!press) return;
      if (!dragging && Math.abs(e.clientY - press.y) > 4) {
        dragging = true;
        dragged.current = true;
        el.setPointerCapture(press.id);
        el.dataset.dragging = "";
        open(0);
      }
      if (dragging) scrub(e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      press = null;
      if (!dragging) return;
      dragging = false;
      delete el.dataset.dragging;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      const r = el.getBoundingClientRect();
      const inside = e.clientX >= r.left - 14 && e.clientX <= window.innerWidth && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) close();
    };
    const onFocusIn = () => open(0);
    const onFocusOut = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node | null)) close();
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  const here = CHAPTERS[cur]!;

  return (
    <nav
      ref={root}
      aria-label="Chapters"
      className={`group/bar fixed inset-y-0 right-[10px] z-40 my-auto h-fit animate-dock touch-none select-none transition-opacity duration-500 before:absolute before:-inset-y-[14px] before:-right-[10px] before:-left-[14px] before:content-[''] ${
        full ? "pointer-events-none opacity-0" : ""
      }`}
    >
      {/* The glass under the dots: a capsule while scrolling, the menu while open. */}
      <div
        aria-hidden="true"
        className="glass absolute inset-y-0 right-0 w-[27px] rounded-[13.5px] opacity-0 transition-[width,border-radius,opacity] duration-500 ease-ios group-data-open/bar:w-[156px] group-data-open/bar:rounded-[22px] group-data-open/bar:opacity-100 group-data-scrolling/bar:opacity-100 motion-reduce:transition-none"
      />

      <ol className="relative py-[10px]">
        {CHAPTERS.map((c, i) => {
          const current = i === cur;
          return (
            <li key={c.id}>
              <button
                ref={(n) => {
                  rows.current[i] = n;
                }}
                type="button"
                aria-label={c.label}
                aria-current={current ? "step" : undefined}
                onClick={() => {
                  if (!dragged.current) scrollToStory(c.go);
                }}
                className={`group/row relative flex w-[27px] items-center justify-center rounded-full transition-[height] duration-500 ease-ios group-data-open/bar:h-[36px] focus-visible:outline-offset-[-2px] motion-reduce:transition-none ${
                  current ? "h-[40px]" : "h-[16px]"
                }`}
              >
                <span
                  ref={(n) => {
                    dots.current[i] = n;
                  }}
                  className={`relative block w-[7px] overflow-hidden rounded-full transition-[height,background-color] duration-500 ease-ios motion-reduce:transition-none ${
                    current ? "h-[28px] bg-ink/20" : "h-[7px] bg-ink/30 group-hover/row:bg-ink/60"
                  }`}
                >
                  {current ? <span ref={fill} className="absolute inset-0 rounded-full bg-ink will-change-transform" /> : null}
                </span>

                {/* The menu row: the chapter's symbol and name. */}
                <span
                  aria-hidden="true"
                  style={{ "--i": i } as React.CSSProperties}
                  className={`pointer-events-none absolute top-1/2 right-[25px] flex w-[112px] -translate-y-1/2 translate-x-[10px] items-center gap-[9px] text-[13px] leading-none tracking-[-0.01em] whitespace-nowrap opacity-0 transition-[opacity,translate] duration-300 ease-ios group-data-open/bar:pointer-events-auto group-data-open/bar:translate-x-0 group-data-open/bar:opacity-100 group-data-open/bar:[transition-delay:calc(var(--i)*22ms)] motion-reduce:transition-none ${
                    current ? "font-semibold text-ink" : "text-ink-2 group-hover/row:text-ink"
                  }`}
                >
                  <Glyph id={c.id} />
                  {c.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* While scrolling: the chapter you're in, beside its capsule. */}
      <div
        aria-hidden="true"
        style={{ translate: `0 ${PAD + cur * ROW + CURRENT / 2 - 15}px` }}
        className="glass pointer-events-none absolute top-0 right-[36px] flex h-[30px] origin-right scale-90 items-center gap-[7px] rounded-full pr-[13px] pl-[11px] text-[13px] leading-none font-semibold tracking-[-0.01em] whitespace-nowrap text-ink opacity-0 transition-[opacity,scale,translate] duration-500 ease-ios group-data-scrolling/bar:scale-100 group-data-scrolling/bar:opacity-100 group-data-open/bar:scale-90! group-data-open/bar:opacity-0! motion-reduce:transition-none"
      >
        <Glyph id={here.id} />
        {here.label}
      </div>
    </nav>
  );
}

/** SF Symbols-like marks for each chapter, drawn on a 24-point grid. */
function Glyph({ id }: { id: (typeof CHAPTERS)[number]["id"] }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {id === "hello" ? (
        // iphone
        <>
          <rect x="6.5" y="2.5" width="11" height="19" rx="3" />
          <path d="M10.5 5.5h3" />
        </>
      ) : id === "design" ? (
        // camera plateau
        <>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="9.5" cy="9.5" r="2.6" />
          <circle cx="9.5" cy="15.5" r="1.4" />
          <circle cx="15.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
        </>
      ) : id === "unfold" ? (
        // book.pages: a phone opened like a book
        <>
          <path d="M12 6.5C10 5 7 4.5 3.5 5v13.5C7 18 10 18.5 12 20c2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z" />
          <path d="M12 6.5V20" />
        </>
      ) : id === "live" ? (
        // square.grid.2x2
        <>
          <rect x="4" y="4" width="7" height="7" rx="2" />
          <rect x="13" y="4" width="7" height="7" rx="2" />
          <rect x="4" y="13" width="7" height="7" rx="2" />
          <rect x="13" y="13" width="7" height="7" rx="2" />
        </>
      ) : (
        // clock, for StandBy
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </>
      )}
    </svg>
  );
}
