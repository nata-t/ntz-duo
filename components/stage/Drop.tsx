"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { boot } from "@/lib/boot";
import { os } from "@/lib/os";
import { coarsePointer, reducedMotion } from "@/lib/env";
import { deviceRect } from "./stage-state";

// A drop of Liquid Glass over the page (lib/glass.ts bends whatever's under
// it). While the loader is up it drifts over the greeting, on its own. As
// the page opens it glides to the mouse and follows it from then on, round
// the page but never onto the phone: it keeps out of a margin round the
// phone's outline on screen (DeviceGL projects it every frame), resting
// where the mouse last was outside it, and it's pushed aside, or off,
// when the phone moves into it.
//
// Its own layer above everything, never inside anything that fades:
// opacity on a glass element's ancestor blanks its backdrop.

/** Follow the mouse round the page once it's open. Off: the drop leaves
 *  with the loader. */
const ROAM = false;
/** How far (px) the drop keeps from the phone's outline, past its own rim. */
const CLEARANCE = 28;

/** Where the loader's greeting is: the drop drifts across it. */
export const dropHome = { x: 0, y: 0, w: 300, h: 120 };

export default function Drop() {
  const lens = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = lens.current;
    if (!el || reducedMotion()) return;
    const vw = () => window.innerWidth,
      vh = () => window.innerHeight;
    if (!dropHome.x) Object.assign(dropHome, { x: vw() / 2, y: vh() / 2 });
    const drop = {
      x: dropHome.x - dropHome.w * 0.4,
      y: dropHome.y,
      vx: 0,
      vy: 0,
      stretch: 1,
      angle: 0,
      scale: 0,
      shown: 1,
    };
    // `follow` runs 0 → 1 as the page opens: from drifting to following.
    const mode = { follow: 0 };
    const pointer = { x: 0, y: 0, known: false };
    const rest = { x: 0, y: 0, known: false };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.known = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const entrance = gsap.to(drop, {
      scale: 1,
      duration: 1.1,
      delay: 0.5,
      ease: "back.out(1.7)",
    });
    let glide: gsap.core.Tween | null = null;
    // A touch screen has no mouse to follow: the drop goes with the loader.
    const roam = ROAM && !coarsePointer();
    const offBoot = boot.subscribe(() => {
      const { phase } = boot.get();
      if (phase === "revealing" && !glide)
        glide = gsap.to(mode, {
          follow: 1,
          duration: 1.4,
          ease: "power2.inOut",
        });
    });

    let last = performance.now();
    let hidden = false;
    const frame = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const s = now / 1000;
      const r = el.offsetWidth / 2;

      // Drifting over the word.
      const dx = dropHome.x + Math.sin(s * 0.62) * dropHome.w * 0.42;
      const dy = dropHome.y + Math.sin(s * 0.97 + 0.8) * dropHome.h * 0.22;

      // The phone's no-go zone: its outline, plus the drop's rim and a margin.
      const z = deviceRect.on
        ? {
            l: deviceRect.x - r - CLEARANCE,
            t: deviceRect.y - r - CLEARANCE,
            r: deviceRect.x + deviceRect.w + r + CLEARANCE,
            b: deviceRect.y + deviceRect.h + r + CLEARANCE,
          }
        : null;
      const inside = (x: number, y: number) =>
        !!z && x > z.l && x < z.r && y > z.t && y < z.b;

      // Following: the mouse while it's clear of the phone, else wherever
      // it last was that was.
      if (pointer.known && !inside(pointer.x, pointer.y))
        Object.assign(rest, { x: pointer.x, y: pointer.y, known: true });
      const fx = rest.known ? rest.x : drop.x,
        fy = rest.known ? rest.y : drop.y;

      const f = mode.follow;
      const tx = dx + (fx - dx) * f,
        ty = dy + (fy - dy) * f;
      const k = 1 - Math.exp(-dt * (2.6 + 8.4 * f));
      let nx = drop.x + (tx - drop.x) * k,
        ny = drop.y + (ty - drop.y) * k;

      // Out of the zone by the shortest way, as the phone comes at it.
      let away = false;
      if (f > 0 && z && inside(nx, ny)) {
        const out = [
          { d: nx - z.l, x: z.l, y: ny },
          { d: z.r - nx, x: z.r, y: ny },
          { d: ny - z.t, x: nx, y: z.t },
          { d: z.b - ny, x: nx, y: z.b },
        ].sort((a, b) => a.d - b.d)[0]!;
        nx = out.x;
        ny = out.y;
        // No room left on screen (the phone's open and fills it).
        away =
          nx < -r * 0.3 ||
          ny < -r * 0.3 ||
          nx > vw() + r * 0.3 ||
          ny > vh() + r * 0.3;
      }
      drop.vx = (nx - drop.x) / Math.max(dt, 1e-3);
      drop.vy = (ny - drop.y) / Math.max(dt, 1e-3);
      drop.x = nx;
      drop.y = ny;

      // Gone in full screen, with nothing to follow, and once the page is
      // open without the phone's outline to steer by.
      const off =
        f > 0 && (!roam || !deviceRect.on || os.get().screen !== null || away);
      drop.shown +=
        ((off ? 0 : 1) - drop.shown) * (1 - Math.exp(-dt * (off ? 9 : 5)));
      const scale = drop.scale * drop.shown;
      if (scale < 0.01 !== hidden)
        el.style.visibility = (hidden = scale < 0.01) ? "hidden" : "";
      if (hidden) return;

      // Moving fast, it pulls long along its path, the way a drop would.
      const speed = Math.hypot(drop.vx, drop.vy);
      const want = 1 + Math.min(0.26, speed / 3800);
      drop.stretch += (want - drop.stretch) * (1 - Math.exp(-dt * 10));
      if (speed > 30) drop.angle = Math.atan2(drop.vy, drop.vx);
      const a = (drop.angle * 180) / Math.PI;
      const sx = drop.stretch * scale,
        sy = (scale / drop.stretch) * (0.96 + 0.04 * drop.stretch);
      el.style.transform = `translate3d(${drop.x}px, ${drop.y}px, 0) translate(-50%, -50%) rotate(${a}deg) scale(${sx}, ${sy}) rotate(${-a}deg)`;
    };
    gsap.ticker.add(frame);

    return () => {
      gsap.ticker.remove(frame);
      entrance.kill();
      glide?.kill();
      offBoot();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      ref={lens}
      aria-hidden="true"
      className="glass-lens pointer-events-none fixed top-0 left-0 z-[1001] size-[clamp(96px,10.5vw,148px)] rounded-full [--lg-bezel:34] [--lg-depth:30] [--lg-blur:0.2] motion-reduce:hidden"
      style={{ transform: "scale(0)" }}
    />
  );
}
