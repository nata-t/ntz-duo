"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { reducedMotion } from "@/lib/env";
import { exitFull, full, toggleFull } from "@/lib/full";
import { os, useOS } from "@/lib/os";
import Mount from "./Mount";

/** The device's display corner, in points. */
const CORNER = 48;

// Full screen. The display's rectangle grows out of the device to the
// window's edges while the device-sized picture gives way to the
// window-sized layout; leaving, the window-sized picture shrinks back onto
// the device, where the live display is already waiting under it.
export default function FullScreen({ node }: { node: HTMLElement }) {
  const phase = full.use((s) => s.phase);
  const screen = useOS((s) => s.screen);
  const root = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const exit = useRef<HTMLButtonElement>(null);

  // F toggles full screen while the phone is live.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "f" && e.key !== "F") return;
      if (e.metaKey || e.ctrlKey || e.altKey || !os.get().live) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      toggleFull();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useLayoutEffect(() => {
    if (phase !== "enter" && phase !== "exit") return;
    const el = root.current, g = ghost.current;
    if (!el || !g) return;
    const { ghost: still, from, k, zoom } = full.get();
    const vw = window.innerWidth, vh = window.innerHeight;
    const enter = phase === "enter";

    // The still sits exactly where it was taken: on the device's display,
    // or filling the window.
    Object.assign(g.style, { left: `${enter ? from.x : 0}px`, top: `${enter ? from.y : 0}px`, zoom: String(zoom) });
    if (still) {
      g.replaceChildren(still.node);
      still.settle();
    }

    const box = (p: number) => {
      const r = CORNER * k * (1 - p);
      const top = from.y * (1 - p), left = from.x * (1 - p);
      const right = (vw - from.x - from.w) * (1 - p), bottom = (vh - from.y - from.h) * (1 - p);
      return `inset(${top}px ${right}px ${bottom}px ${left}px round ${r}px)`;
    };
    const p = { v: enter ? 0 : 1 };
    const draw = () => {
      const v = p.v;
      el.style.clipPath = box(v);
      el.style.backgroundColor = `rgba(0,0,0,${Math.min(1, v * 3)})`;
      if (enter) {
        // The device-sized picture hands over to the full layout early, so
        // most of the growth happens on the real thing.
        g.style.opacity = String(1 - gsap.utils.clamp(0, 1, (v - 0.05) / 0.35));
        if (layer.current) {
          layer.current.style.opacity = String(gsap.utils.clamp(0, 1, (v - 0.05) / 0.35));
          layer.current.style.transform = `scale(${0.94 + 0.06 * v})`;
        }
      } else {
        g.style.opacity = String(gsap.utils.clamp(0, 1, (v - 0.05) / 0.4));
      }
    };
    draw();
    const tween = gsap.to(p, {
      v: enter ? 1 : 0,
      duration: reducedMotion() ? 0 : enter ? 0.62 : 0.55,
      ease: "expo.out",
      onUpdate: draw,
      onComplete: () => {
        g.replaceChildren();
        el.style.clipPath = "";
        full.set({ phase: enter ? "on" : "off", ghost: null });
      },
    });
    return () => void tween.kill();
  }, [phase]);

  useEffect(() => {
    if (phase === "on") exit.current?.focus({ preventScroll: true });
  }, [phase]);

  if (phase === "off") return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[70] touch-none overflow-hidden overscroll-none"
      style={{ pointerEvents: phase === "exit" ? "none" : undefined }}
    >
      <div ref={layer} className="absolute inset-0 origin-center">
        {screen ? (
          <div style={{ width: screen.w, height: screen.h, zoom: screen.z }}>
            <Mount node={node} active />
          </div>
        ) : null}
      </div>
      <div ref={ghost} aria-hidden="true" className="pointer-events-none absolute" />

      <button
        ref={exit}
        type="button"
        onClick={() => exitFull()}
        aria-label="Exit full screen"
        title="Exit full screen (F)"
        className={`absolute bottom-[max(14px,env(safe-area-inset-bottom))] left-[max(14px,env(safe-area-inset-left))] z-10 grid size-[40px] place-items-center rounded-full bg-[rgba(28,28,30,0.55)] text-white shadow-[inset_0_0.5px_0_rgba(255,255,255,0.28),0_6px_20px_rgba(0,0,0,0.22)] backdrop-blur-[16px] backdrop-saturate-[1.6] transition-[opacity,scale,background-color] duration-300 hover:bg-[rgba(28,28,30,0.72)] active:scale-90 ${
          phase === "on" ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
        </svg>
      </button>
    </div>
  );
}
