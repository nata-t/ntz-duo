"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { lenisRef, scrollToTarget } from "@/lib/lenis";
import { openApp, os, useOS } from "@/lib/os";
import { APPS } from "@/components/apps/registry";
import { finePointer, reducedMotion, webglAvailable } from "@/lib/env";
import Device, { type DeviceHandle } from "@/components/device/Device";
import DeviceGL from "@/components/device/gl/DeviceGL";
import { BODY } from "@/components/device/geometry";
import { clonePose } from "@/components/device/pose";
import InnerDisplay from "@/components/os/InnerDisplay";
import OuterDisplay from "@/components/outer/OuterDisplay";
import HeroCopy, { scrollToStory, type HeroCopyHandle } from "./HeroCopy";
import Footer, { type FooterHandle } from "./Footer";
import Nav, { type NavHandle } from "./Nav";
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

export default function Stage() {
  const track = useRef<HTMLElement>(null);
  const device = useRef<DeviceHandle>(null);
  const hero = useRef<HeroCopyHandle>(null);
  const footer = useRef<FooterHandle>(null);
  const nav = useRef<NavHandle>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLButtonElement>(null);
  // null until measured: the device is built for the viewport, so it only
  // renders on the client.
  const [k, setK] = useState<number | null>(null);
  const [portrait, setPortrait] = useState(false);
  // The real-3D device where WebGL runs; the CSS build everywhere else.
  const [gl, setGl] = useState(false);
  const dark = useOS((s) => s.dark);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = isPortrait();
        setGl(webglAvailable());
        os.set({ portrait: p });
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
    const idle = { x: 0, y: 0, yaw: 0, pitch: 0 };
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let t = 0;
    let lastT = 0;
    let dir = 1;
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
        const h = span(t, MARKS.liveIn + 0.1, MARKS.liveIn + 0.35) * (1 - span(t, MARKS.liveOut, MARKS.liveOut + 0.2));
        hint.current.style.opacity = String(h);
        hint.current.style.pointerEvents = h > 0.5 ? "auto" : "none";
      }

      const live = t >= MARKS.liveIn - 0.02 && t <= MARKS.liveOut + 0.02;
      if (live !== os.get().live) os.set({ live });
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

    // Deep links: /#about (or any app id) unfolds the phone and opens it.
    const linked = window.location.hash.slice(1);
    let deep = 0;
    if (linked && APPS[linked]?.kind === "app") {
      deep = window.setTimeout(() => {
        scrollToStory(MARKS.liveIn + 0.15);
        window.setTimeout(() => openApp(linked, null), 1400);
      }, 900);
    }

    const tick = () => render(performance.now());
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      introTween?.kill();
      st.kill();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.clearTimeout(settle);
      window.clearTimeout(deep);
    };
  }, [k, portrait, gl]);

  return (
    <section ref={track} aria-label="ntz duo" className="relative" style={{ height: `${(LENGTH + 1) * 100}svh` }}>
      <div className="sticky top-0 h-svh w-full overflow-hidden" style={gl ? undefined : { perspective: "2800px", perspectiveOrigin: "50% 45%" }}>
        <Nav ref={nav} />
        <HeroCopy ref={hero} />
        <div
          ref={shadow}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 rounded-[50%] opacity-0"
          style={{
            width: k ? BODY.w * k * 0.5 : 0,
            height: k ? BODY.w * k * 0.08 : 0,
            background: "radial-gradient(closest-side, rgba(0,0,0,0.3), rgba(0,0,0,0))",
            filter: "blur(10px)",
          }}
        />
        <div className="absolute inset-0" style={gl ? undefined : { transformStyle: "preserve-3d" }}>
          {k === null ? null : (
          gl ? (
            <DeviceGL
              ref={device}
              k={k}
              inner={(half) => <InnerDisplay mirror half={half} />}
              live={<InnerDisplay />}
              outer={<OuterDisplay />}
              portrait={portrait}
              finish={dark ? "night" : "star"}
            />
          ) : (
            <Device
              ref={device}
              k={k}
              inner={(half) => <InnerDisplay mirror half={half} />}
              live={<InnerDisplay />}
              outer={<OuterDisplay />}
              portrait={portrait}
              finish={dark ? "night" : "star"}
            />
          )
          )}
        </div>
        <Footer ref={footer} />
        <button
          ref={hint}
          type="button"
          onClick={() => scrollToStory(MARKS.liveOut + 0.9)}
          className="absolute bottom-[max(0.6vh,4px)] left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-[12px] tracking-[-0.01em] whitespace-nowrap text-ink-2 opacity-0 transition-colors hover:text-ink"
        >
          {portrait ? "Swipe outside the screen, or tap here, to fold it." : "Scroll outside the screen to fold it."}
        </button>
      </div>
    </section>
  );
}
