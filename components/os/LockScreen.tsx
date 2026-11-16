"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { os, unlock, useDims, useOS } from "@/lib/os";
import { BUTTON_ICONS, GLASS_BUTTONS, canvas as makeCanvas, loadFonts, paintChrome, paintTime, wallpaper, type Panel } from "@/components/device/lockart";
import { playUnlock } from "./unlock";

// The inner display's Lock Screen, live. While the phone folds, the GPU
// draws this same picture (lockart.ts): the wallpaper's sky, the clock
// behind the ridge and the dunes, the kit's chrome in front. Flat, it's
// DOM, so it can be swiped away: drag up from the home indicator and the
// clock rides up with the finger behind the ridge; let go high enough (or
// fast enough) and it leaves, and the Home Screen springs in (unlock.ts).

/** How far up (share of the display's height), or how fast (pt per ms),
 *  a swipe must go to unlock. */
const DISTANCE = 0.14;
const SPEED = 0.6;
/** The home indicator's touch zone: the bottom of the display. */
const ZONE = 0.24;

let opener: (() => void) | null = null;
/** Open the phone as a swipe would (deep links, keyboard). */
export function openLock() {
  if (!os.get().locked) return;
  if (opener) opener();
  else unlock();
}

export default function LockScreen() {
  const locked = useOS((s) => s.locked);
  const dark = useOS((s) => s.dark);
  const live = useOS((s) => s.live);
  const awake = useOS((s) => s.awake);
  const { w: W, h: H } = useDims();
  const portrait = H > W;
  const layout: Panel = portrait ? "outer" : "inner";
  const theme = dark ? "dark" : "light";
  const [shown, setShown] = useState(locked);
  const [leaving, setLeaving] = useState(false);
  if (locked && !shown) setShown(true);
  if (locked && leaving) setLeaving(false);
  const root = useRef<HTMLDivElement>(null);
  const rider = useRef<HTMLDivElement>(null);
  const time = useRef<HTMLCanvasElement>(null);
  const chrome = useRef<HTMLCanvasElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const drag = useRef<{ y: number; t: number; dy: number; v: number; id: number } | null>(null);

  // The clock and the chrome, painted by the same hand as the GPU's.
  useLayoutEffect(() => {
    if (!shown) return;
    let alive = true;
    const scale = Math.min(3, (window.devicePixelRatio || 1) * 1.5);
    const paint = async () => {
      await loadFonts();
      if (!alive) return;
      const now = new Date();
      for (const [el, kind] of [
        [time.current, "time"],
        [chrome.current, "chrome"],
      ] as const) {
        if (!el) continue;
        const w = Math.round(W * scale), h = Math.round(H * scale);
        if (el.width !== w || el.height !== h) {
          el.width = w;
          el.height = h;
        }
        const x = el.getContext("2d")!;
        if (kind === "time") paintTime(x, w, h, layout, theme, now);
        else {
          // Painted at the panel's own proportions, so the circle stays round
          // on a full screen of another shape; centred, flush to its height.
          const ph = h, pw = layout === "inner" ? ph * (951 / 669) : ph * (466 / 678);
          const [c, cx] = makeCanvas(pw, ph);
          await paintChrome(cx, pw, ph, layout);
          if (!alive) return;
          x.clearRect(0, 0, w, h);
          x.drawImage(c, (w - pw) / 2, 0);
        }
      }
    };
    void paint();
    const id = window.setInterval(() => void paint(), 15000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [shown, W, H, layout, theme]);

  // Coming back to the Lock Screen: everything in its place.
  useEffect(() => {
    if (!locked) return;
    if (rider.current) gsap.set(rider.current, { clearProps: "transform,opacity" });
  }, [locked]);

  // Waking, the Lock Screen settles from a touch larger as the light comes up.
  const wasAwake = useRef(awake);
  useEffect(() => {
    if (awake && !wasAwake.current && root.current)
      gsap.fromTo(root.current, { scale: 1.04 }, { scale: 1, duration: 0.6, ease: "power3.out", clearProps: "transform" });
    wasAwake.current = awake;
  }, [awake]);

  // A moment after the phone goes live, iOS's prompt.
  useEffect(() => {
    const el = hint.current;
    if (!el || !shown) return;
    gsap.killTweensOf(el);
    if (live && locked) gsap.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.6, delay: 1.1, ease: "power2.out" });
    else gsap.set(el, { opacity: 0 });
  }, [live, locked, shown]);

  const leave = () => {
    const el = rider.current, display = root.current?.closest<HTMLElement>("[data-os-root]");
    setLeaving(true);
    unlock();
    if (display) playUnlock(display);
    if (el)
      gsap.to(el, {
        y: -H * 0.62,
        opacity: 0,
        duration: 0.34,
        ease: "power2.in",
        onComplete: () => {
          setShown(false);
          setLeaving(false);
        },
      });
    else setShown(false);
  };

  useEffect(() => {
    opener = leave;
    return () => {
      if (opener === leave) opener = null;
    };
  });

  const scaleOf = () => {
    const r = root.current?.getBoundingClientRect();
    // Upright, the display is turned a quarter: its height runs across the screen.
    return r ? (portrait && !os.get().screen ? r.width : r.height) / H || 1 : 1;
  };

  const onDown = (e: React.PointerEvent) => {
    if (!os.get().live || leaving || e.button > 0) return;
    drag.current = { y: e.clientY, t: performance.now(), dy: 0, v: 0, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (rider.current) gsap.killTweensOf(rider.current);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id || !rider.current) return;
    const now = performance.now();
    const dy = Math.max(0, (d.y - e.clientY) / scaleOf());
    d.v = (dy - d.dy) / Math.max(1, now - d.t);
    d.dy = dy;
    d.t = now;
    // The clock rides up with the finger, fading as it goes.
    gsap.set(rider.current, { y: -dy, opacity: 1 - Math.min(0.85, dy / (H * 0.55)) });
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    if (d.dy > H * DISTANCE || (d.v > SPEED && d.dy > 12)) return leave();
    if (!rider.current) return;
    if (d.dy < 4) {
      // A tap: the clock hops to show the way, and the prompt comes up.
      gsap.timeline()
        .to(rider.current, { y: -18, duration: 0.16, ease: "power2.out" })
        .to(rider.current, { y: 0, duration: 0.55, ease: "elastic.out(1, 0.5)" });
      if (hint.current) gsap.to(hint.current, { opacity: 1, y: 0, duration: 0.3 });
    } else gsap.to(rider.current, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" });
  };

  if (!shown) return null;

  return (
    <div ref={root} className="absolute inset-0 z-[47] overflow-hidden" aria-label="Lock Screen">
      {!leaving ? (
        <img src={wallpaper(theme, "base")} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div ref={rider} className="absolute inset-0 will-change-transform">
        <canvas ref={time} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      </div>
      {!leaving ? (
        // The ridge and the dunes stand in front of the clock.
        <img src={wallpaper(theme, "front")} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <canvas
        ref={chrome}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-200"
        style={{ opacity: leaving ? 0 : 1 }}
      />
      {/* Flashlight and camera: Liquid Glass, where the GPU paints them as
          the phone folds. The chrome is laid at the panel's proportions,
          centred, so they follow it. */}
      <GlassButtons layout={layout} w={W} h={H} hidden={leaving} />
      <p
        ref={hint}
        className="pointer-events-none absolute inset-x-0 text-center text-[13px] font-medium tracking-[-0.01em] text-white/85 opacity-0"
        style={{ bottom: 22 }}
      >
        Swipe up to open
      </p>
      {/* The home indicator's zone takes the swipe; Enter opens too. */}
      <button
        type="button"
        aria-label="Swipe up to open"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={(e) => {
          // Keyboard activation only: pointer taps are handled above.
          if (e.detail === 0) leave();
        }}
        className="absolute inset-x-0 bottom-0 cursor-grab touch-none outline-none active:cursor-grabbing"
        style={{ height: `${ZONE * 100}%` }}
      />
    </div>
  );
}

function GlassButtons({ layout, w, h, hidden }: { layout: Panel; w: number; h: number; hidden: boolean }) {
  if (hidden) return null;
  const b = GLASS_BUTTONS[layout];
  const k = h / b.panel.h, pw = b.panel.w * k;
  const size = b.size * k;
  return (
    <div
      className="pointer-events-none absolute flex -translate-x-1/2 flex-col items-center"
      style={{ left: (w - pw) / 2 + pw - b.right * k, bottom: b.bottom * k, gap: b.gap * k }}
    >
      {BUTTON_ICONS.map((d) => (
        <span key={d} className="glass-clear grid place-items-center rounded-full" style={{ width: size, height: size }}>
          <svg width={22 * k} height={22 * k} viewBox="0 0 24 24" aria-hidden="true">
            <path d={d} fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </span>
      ))}
    </div>
  );
}
