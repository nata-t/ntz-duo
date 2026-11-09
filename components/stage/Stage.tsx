"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { lenisRef, scrollToTarget } from "@/lib/lenis";
import { os, useOS } from "@/lib/os";
import { describeDevice, enterFull } from "@/lib/full";
import { scheduleSnapshot, setFlat } from "@/lib/mirror";
import { APPS } from "@/components/apps/registry";
import { coarsePointer, finePointer, reducedMotion, webglAvailable } from "@/lib/env";
import Device, { type DeviceHandle } from "@/components/device/Device";
import DeviceGL from "@/components/device/gl/DeviceGL";
import { BODY, INNER } from "@/components/device/geometry";
import { clonePose } from "@/components/device/pose";
import InnerDisplay from "@/components/os/InnerDisplay";
import OuterDisplay from "@/components/outer/OuterDisplay";
import HeroCopy, { type HeroCopyHandle } from "./HeroCopy";
import Footer, { type FooterHandle } from "./Footer";
import Nav, { type NavHandle } from "./Nav";
import FullScreen from "./FullScreen";
import Scrollbar from "./Scrollbar";
import Mount, { Mirror } from "./Mount";
import { scrollToStory, visit } from "./navigate";
import { HERO, LENGTH, MARKS, createStory, span } from "./story";
import { stage } from "./stage-state";

/** Phones and narrow tall windows hold the open device upright. */
function isPortrait() {
  return window.innerWidth < 760 && window.innerHeight > window.innerWidth;
}

/** Zoom that makes the open device fill the viewport, leaving a margin to
 *  scroll in (and the nav's height above it). Upright, the body's sides swap. */
function fitZoom(portrait: boolean) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const mx = Math.max(portrait ? 14 : 24, vw * 0.035), my = Math.max(portrait ? 44 : 52, vh * 0.065);
  const [bw, bh] = portrait ? [BODY.h, BODY.w] : [BODY.w, BODY.h];
  return Math.min((vw - 2 * mx) / bw, (vh - 2 * my) / bh);
}

/** The open device's box on the page, and its display's: centred, at zoom k. */
function boxes(k: number, portrait: boolean) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const box = (w: number, h: number) => {
    const [bw, bh] = portrait ? [h * k, w * k] : [w * k, h * k];
    return { x: (vw - bw) / 2, y: (vh - bh) / 2, w: bw, h: bh };
  };
  return { body: box(BODY.w, BODY.h), display: box(INNER.w, INNER.h) };
}

/** The StandBy tent's outline, in device points at scale 1: its height, and
 *  how far its middle sits below the pose's origin (measured from renders). */
const TENT = { h: 590, dy: 155 };

/** Keys that scroll whatever has focus. */
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

export default function Stage() {
  const track = useRef<HTMLElement>(null);
  const device = useRef<DeviceHandle>(null);
  const hero = useRef<HeroCopyHandle>(null);
  const footer = useRef<FooterHandle>(null);
  const nav = useRef<NavHandle>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  // null until measured: the device is built for the viewport, so it only
  // renders on the client.
  const [k, setK] = useState<number | null>(null);
  const [portrait, setPortrait] = useState(false);
  // Touch screens use the device's display through full screen.
  const [touch, setTouch] = useState(false);
  // The real-3D device where WebGL runs; the CSS build everywhere else.
  const [gl, setGl] = useState(false);
  const dark = useOS((s) => s.dark);
  const fullScreen = useOS((s) => s.screen !== null);
  // The live display renders once, into this node, which moves between the
  // device and full screen (Mount) without remounting.
  const [liveHost] = useState(() => (typeof document === "undefined" ? null : document.createElement("div")));

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = isPortrait();
        setGl(webglAvailable());
        setTouch(coarsePointer());
        // Full screen lays the OS out for the window itself.
        if (!os.get().screen) os.set({ portrait: p });
        setPortrait(p);
        setK(fitZoom(p));
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el || k === null) return;
    const reduced = reducedMotion();
    const { poseAt } = createStory(portrait);
    const pose = clonePose(HERO);
    // StandBy's pose as the story keys it; the stage moves it into the
    // room the footer leaves.
    const standby = poseAt(MARKS.standbyIn, clonePose(HERO));
    describeDevice({ display: () => boxes(k, portrait).display, portrait: isPortrait, k });
    const idle = { x: 0, y: 0, yaw: 0, pitch: 0 };
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let t = 0;
    let lastT = 0;
    let dir = 1;
    // The last press landed on the live phone (keys go to it, not the page).
    let pressed = false;
    // The device rises into place on first load.
    const intro = { v: reduced ? 1 : 0 };
    const introTween = reduced ? null : gsap.to(intro, { v: 1, duration: 2.4, delay: 0.25, ease: "expo.out" });

    let drawn = -1;
    const render = (now: number) => {
      const display = 1 - span(t, 0.05, 0.8) + span(t, 6.6, 7.0) * (1 - span(t, 8.2, 8.7)) + span(t, 9.0, 9.6);
      const w = reduced ? 0 : Math.min(1, display);
      // Nothing moves while the phone sits still: skip the frame.
      if (w === 0 && intro.v >= 1 && t === drawn) return;
      drawn = t;
      poseAt(t, pose);
      // StandBy stands centred in the room between the nav and the
      // footer, smaller where that room is short (phones).
      const sb = span(t, 5.75, MARKS.standbyIn) * (1 - span(t, MARKS.standbyOut, LENGTH));
      if (sb > 0 && footer.current) {
        const vh = window.innerHeight, top = 72, bottom = footer.current.top() - 16;
        const s = Math.max(0.2, Math.min(standby.s, (bottom - top) / (TENT.h * k)));
        const y = (((top + bottom) / 2 - TENT.dy * k * s - vh / 2) / vh) * 100;
        pose.s *= 1 + (s / standby.s - 1) * sb;
        pose.y += (y - standby.y) * sb;
      }
      // The resting device breathes, and leans toward the pointer, only
      // where it is an object on display: the hero and StandBy.
      if (w > 0) {
        const s = now / 1000;
        idle.y = Math.sin(s * 0.9) * 0.6;
        idle.yaw = Math.sin(s * 0.55) * 2.4;
        idle.pitch = Math.cos(s * 0.7) * 1.2;
        pointer.x += (pointer.tx - pointer.x) * 0.06;
        pointer.y += (pointer.ty - pointer.y) * 0.06;
        pose.y += idle.y * w;
        pose.yaw += (idle.yaw + pointer.x * 7) * w;
        pose.view += (idle.pitch - pointer.y * 5) * w;
      }
      if (intro.v < 1) {
        const r = 1 - intro.v;
        pose.y += r * 70;
        pose.yaw -= r * 70;
        pose.view += r * 18;
      }
      // Leaving flat, the halves take a copy of the live display first.
      setFlat(pose.fold < 0.4);
      device.current?.apply(pose);
      nav.current?.apply(t);
      hero.current?.apply(t);
      footer.current?.apply(t);
      if (shadow.current) {
        const sh = shadow.current;
        sh.style.opacity = String(pose.shadow * 0.9);
        // Under the device's lowest edge, sized to the device.
        const drop = BODY.h * k * pose.s * 0.5;
        sh.style.transform = `translate3d(-50%, -50%, 0) translate3d(${pose.x}vw, calc(${pose.y}vh + ${drop}px), 0) scale(${pose.s * 1.1}, ${pose.s * 0.9})`;
      }
      if (hint.current) {
        // On for the whole time the phone takes input (it goes live just
        // short of liveIn), so the way out is there wherever it's stopped.
        const h = span(t, MARKS.liveIn - 0.2, MARKS.liveIn - 0.02) * (1 - span(t, MARKS.liveOut + 0.02, MARKS.liveOut + 0.2));
        hint.current.style.opacity = String(h);
        hint.current.style.pointerEvents = h > 0.5 ? "auto" : "none";
      }

      const live = t >= MARKS.liveIn - 0.02 && t <= MARKS.liveOut + 0.02;
      if (live !== os.get().live) os.set({ live });
      if (!live) pressed = false;
      const outer = t > 5.2 && t < 8.45 ? "standby" : "lock";
      if (outer !== stage.get().outer) stage.set({ outer });
    };

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate(self) {
        const next = self.progress * LENGTH;
        if (next !== lastT) dir = next > lastT ? 1 : -1;
        lastT = t = next;
        // The story ends where it began: past the last frame, jump back to
        // the first. Both frames are the same pose, so the cut is invisible.
        if (self.progress >= 0.9995 && dir > 0) {
          const lenis = lenisRef.current;
          t = 0;
          lastT = 0;
          if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
          else window.scrollTo(0, 0);
        }
      },
    });

    // Settle into the live zone when the visitor stops just short of it on
    // the way in. Leaving is never resisted.
    let settle = 0;
    const onScroll = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const towardFromAbove = dir > 0 && t > MARKS.liveIn - 0.55 && t < MARKS.liveIn - 0.005;
        const towardFromBelow = dir < 0 && t < MARKS.liveOut + 0.45 && t > MARKS.liveOut + 0.005;
        if (towardFromAbove || towardFromBelow) {
          const target = el.offsetTop + ((towardFromAbove ? MARKS.liveIn + 0.15 : MARKS.liveOut - 0.15) / LENGTH) * (el.offsetHeight - window.innerHeight);
          scrollToTarget(target);
        }
      }, 140);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (finePointer()) window.addEventListener("pointermove", onMove, { passive: true });

    // Focus. While the phone is live, the whole device holds the wheel: its
    // display scrolls apps and pages the Home Screen, its bezel does
    // nothing, and only the margin around it scrolls the page (and folds
    // it). A gesture that starts on the phone stays the phone's as the
    // pointer drifts off, momentum included, until it rests for a moment.
    let held = 0;
    const onDevice = (x: number, y: number) => {
      const b = boxes(k, portrait).body;
      return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    };
    const onWheel = (e: WheelEvent) => {
      if (!os.get().live || os.get().screen) return;
      const now = performance.now();
      const inside = onDevice(e.clientX, e.clientY);
      if (inside || now - held < 450) {
        held = now;
        // The display handles its own; nothing else reaches the page.
        if (inside && (e.target as Element | null)?.closest?.('[data-os-root="live"]')) return;
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("wheel", onWheel, { capture: true, passive: false });

    // Keys follow the last press: after a click on the phone, arrows and
    // space scroll the app under them, never the page.
    const onDown = (e: PointerEvent) => {
      pressed = os.get().live && onDevice(e.clientX, e.clientY);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!pressed || !os.get().live || os.get().screen || !SCROLL_KEYS.has(e.key)) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key === " " && t.closest("button, a")) return;
      // An app's scroll view takes the key when it can move; overscroll
      // stops at it (globals.css), so the page never follows.
      for (let n: HTMLElement | null = t; n && n !== document.body; n = n.parentElement) {
        if (n.dataset.osRoot) break;
        if (n.scrollHeight > n.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(n).overflowY)) return;
      }
      e.preventDefault();
    };
    window.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    window.addEventListener("keydown", onKey, { capture: true });

    // Deep links: /#about (or any app id) unfolds the phone and opens it.
    const linked = window.location.hash.slice(1);
    let deep = 0;
    if (linked && APPS[linked]?.kind === "app") deep = window.setTimeout(() => visit(linked), 900);

    // Keep the folding halves in step with the phone while it's closed.
    const offOS = os.subscribe(scheduleSnapshot);
    const refresh = window.setInterval(scheduleSnapshot, 30000);

    const tick = () => render(performance.now());
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      introTween?.kill();
      st.kill();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("keydown", onKey, { capture: true });
      offOS();
      window.clearInterval(refresh);
      window.clearTimeout(settle);
      window.clearTimeout(deep);
    };
  }, [k, portrait, gl]);

  const expand = (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  );
  // On touch screens the live display is a window onto the phone: a tap
  // opens it full screen (and presses whatever was under the finger
  // there), a vertical swipe keeps scrolling the story.
  const live =
    liveHost === null ? null : (
      <>
        <Mount node={liveHost} active={!fullScreen} />
        {touch && !fullScreen ? (
          <button
            type="button"
            aria-label="Open the screen full size"
            className="absolute inset-0 z-10 touch-pan-y"
            onClick={(e) => {
              const under = document
                .elementsFromPoint(e.clientX, e.clientY)
                .find((el) => el !== e.currentTarget && el.closest('[data-os-root="live"]'));
              const target = under?.closest<HTMLElement>("button, a[href]") ?? null;
              enterFull();
              if (target) window.setTimeout(() => target.isConnected && target.click(), 480);
            }}
          />
        ) : null}
      </>
    );
  // Room under the open device for its controls.
  const below = k === null ? 0 : (window.innerHeight - (portrait ? BODY.w : BODY.h) * k) / 2;

  return (
    <section ref={track} aria-label="ntz duo" className="relative" style={{ height: `${(LENGTH + 1) * 100}svh` }}>
      <div className={`sticky top-0 h-svh w-full overflow-hidden supports-[height:100dvh]:h-dvh ${gl ? "" : "perspective-[2800px] perspective-origin-[50%_45%]"}`}>
        <Nav ref={nav} />
        <HeroCopy ref={hero} />
        <div
          ref={shadow}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(0,0,0,0.3),rgba(0,0,0,0))] opacity-0 blur-[10px]"
          style={{
            width: k ? BODY.w * k * 0.5 : 0,
            height: k ? BODY.w * k * 0.08 : 0,
          }}
        />
        <div className={`absolute inset-0 ${gl ? "" : "transform-3d"}`}>
          {k === null ? null : (
          gl ? (
            <DeviceGL
              ref={device}
              k={k}
              inner={() => <Mirror />}
              live={live}
              outer={<OuterDisplay />}
              portrait={portrait}
              finish={dark ? "night" : "star"}
            />
          ) : (
            <Device
              ref={device}
              k={k}
              inner={() => <Mirror />}
              live={live}
              outer={<OuterDisplay />}
              portrait={portrait}
              finish={dark ? "night" : "star"}
            />
          )
          )}
        </div>
        <Footer ref={footer} />

        {/* While the phone is live: how to leave it, and full screen. */}
        <div
          ref={hint}
          className="pointer-events-none absolute inset-x-0 flex flex-col items-center gap-[10px] opacity-0"
          style={{ bottom: touch ? Math.max(16, below / 2 - 44) : "max(0.6vh, 4px)" }}
        >
          {touch ? (
            <>
              <button
                type="button"
                onClick={() => enterFull()}
                className="flex items-center gap-[8px] rounded-full bg-cta px-[20px] py-[11px] text-[15px] leading-none tracking-[-0.01em] text-white transition-[background-color,scale] hover:bg-cta-hover active:scale-95"
              >
                {expand}
                Open full screen
              </button>
              <button type="button" onClick={() => scrollToStory(MARKS.liveOut + 0.9)} className="px-3 py-1 text-[12px] tracking-[-0.01em] text-ink-2">
                Swipe outside the screen to fold it.
              </button>
            </>
          ) : (
            <div className="flex items-center gap-[6px]">
              <button
                type="button"
                onClick={() => scrollToStory(MARKS.liveOut + 0.9)}
                className="rounded-full px-3 py-1.5 text-[12px] tracking-[-0.01em] whitespace-nowrap text-ink-2 transition-colors hover:text-ink"
              >
                Scroll outside the screen to fold it.
              </button>
              <button
                type="button"
                onClick={() => enterFull()}
                title="Full screen (F)"
                className="flex items-center gap-[6px] rounded-full px-3 py-1.5 text-[12px] tracking-[-0.01em] whitespace-nowrap text-ink-2 transition-colors hover:bg-page-alt hover:text-ink"
              >
                {expand}
                Full screen
                <kbd className="rounded-[4px] border border-rule px-[4px] font-sans text-[10px] leading-[14px] text-ink-3">F</kbd>
              </button>
            </div>
          )}
        </div>
      </div>
      <Scrollbar />
      {liveHost && k !== null ? createPortal(<InnerDisplay />, liveHost) : null}
      {liveHost ? <FullScreen node={liveHost} /> : null}
    </section>
  );
}
