"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { os, useOS } from "@/lib/os";
import { volumeHUD } from "@/lib/buttons";

// iOS 26's volume HUD, by the buttons. The Duo's volume buttons sit on its
// top edge, so on a display held landscape (the open inner, or the shut
// outer) the HUD runs along the top under them, as iPad's does; held
// upright, that edge is on the right and the HUD stands there.
//
// A Liquid Glass capsule slides in from the edge, white fill rising from
// the speaker end. While a button is down the capsule swells toward volume
// up or gives toward volume down (×1.03 / ×0.96, springs ~0.3 s, settling
// ~0.6 s after release). Pushed past either end, it stretches toward the
// push (≈ 77% drift, 73% longer, 92% as thick, capped near 4 pt) and springs
// back. Idle a moment, it thins to a line; then it slides away.

const LONG = 172, THICK = 32, THIN = 8;
const COLLAPSE = 1.1, HIDE = 2.1;

type Props = {
  /** Which display this is: it shows while that display is the one in use. */
  where: "inner" | "outer";
  /** Display size, points. */
  w: number;
  h: number;
};

function Speaker({ level }: { level: number }) {
  const waves = level <= 0 ? -1 : level < 0.34 ? 1 : level < 0.67 ? 2 : 3;
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path d="M3.5 9h3.2L11 5v14l-4.3-4H3.5z" fill="currentColor" />
      {waves < 0 ? (
        <path d="M15 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        [1, 2, 3].map((i) => (
          <path
            key={i}
            d={i === 1 ? "M14 9.6a3.4 3.4 0 0 1 0 4.8" : i === 2 ? "M16.6 7.2a6.8 6.8 0 0 1 0 9.6" : "M19.2 4.8a10.2 10.2 0 0 1 0 14.4"}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-opacity duration-150"
            style={{ opacity: i <= waves ? 1 : 0.22 }}
          />
        ))
      )}
    </svg>
  );
}

export default function VolumeHUD({ where, w, h }: Props) {
  const volume = useOS((s) => s.volume);
  const upright = where === "inner" && h > w;
  const slot = useRef<HTMLDivElement>(null);
  const capsule = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const glyph = useRef<HTMLDivElement>(null);
  const state = useRef({ shown: false, hide: 0, thin: 0 });

  // Where the buttons are: under them on the top edge (inner, landscape:
  // 773 of 951 pt across; outer: 283 of 466), or on the right, upright.
  const along = where === "outer" ? (283 / 466) * w : upright ? (773 / 951) * h : (773 / 951) * w;
  const box = upright
    ? { right: 9, top: along - LONG / 2, width: THICK, height: LONG }
    : { top: 9, left: along - LONG / 2, width: LONG, height: THICK };
  const axis = upright ? "y" : "x";
  const across = upright ? "x" : "y";
  // Upright, the speaker sits at the bottom and up is up the screen.
  const sign = upright ? -1 : 1;

  useEffect(() => {
    const el = capsule.current, s = slot.current;
    if (!el || !s) return;
    gsap.set(s, { [across]: upright ? 70 : -70 });
    const st = state.current;
    const thickness = (v: number) => (upright ? { width: v } : { height: v });
    const off = volumeHUD.subscribe(() => {
      const ev = volumeHUD.get();
      const mine = where === "inner" ? os.get().live : !os.get().live;
      if (!mine || !os.get().awake) return;
      // In: slide from the edge, full thickness, glyph showing.
      if (!st.shown) {
        st.shown = true;
        gsap.fromTo(s, { [across]: upright ? 46 : -46, scale: 0.7 }, { [across]: 0, scale: 1, duration: 0.42, ease: "back.out(1.5)", overwrite: true });
      }
      gsap.to(el, { ...thickness(THICK), duration: 0.3, ease: "power3.out", overwrite: "auto" });
      if (glyph.current) gsap.to(glyph.current, { opacity: 1, duration: 0.15, overwrite: true });
      // The press: swell toward up, give toward down; past an end, stretch.
      if (ev.held && ev.dir) {
        if (ev.limit) {
          const push = 4 * ev.dir * sign;
          gsap.timeline({ overwrite: true })
            .to(el, { [axis]: push * 0.77, [upright ? "scaleY" : "scaleX"]: 1 + (4 * 0.73) / LONG, [upright ? "scaleX" : "scaleY"]: 0.92, duration: 0.14, ease: "power2.out" })
            .to(el, { [axis]: 0, scaleX: 1, scaleY: 1, duration: 0.6, ease: "elastic.out(1, 0.55)" });
        } else {
          gsap.to(el, { [upright ? "scaleY" : "scaleX"]: ev.dir > 0 ? 1.03 : 0.96, [axis]: 0, duration: 0.3, ease: "power2.out", overwrite: "auto" });
        }
      } else if (!ev.held) {
        gsap.to(el, { scaleX: 1, scaleY: 1, [axis]: 0, duration: 0.6, ease: "power3.out", overwrite: "auto" });
      }
      // Idle: thin to a line, then away.
      window.clearTimeout(st.thin);
      window.clearTimeout(st.hide);
      st.thin = window.setTimeout(() => {
        gsap.to(el, { ...thickness(THIN), duration: 0.45, ease: "power3.inOut" });
        if (glyph.current) gsap.to(glyph.current, { opacity: 0, duration: 0.2 });
      }, COLLAPSE * 1000);
      st.hide = window.setTimeout(() => {
        st.shown = false;
        gsap.to(s, { [across]: upright ? 70 : -70, scale: 0.8, duration: 0.38, ease: "power2.in" });
      }, HIDE * 1000);
    });
    return () => {
      off();
      window.clearTimeout(st.thin);
      window.clearTimeout(st.hide);
    };
  }, [where, upright, axis, across, sign]);

  // The fill follows the level on a quick, critically damped spring.
  useEffect(() => {
    if (fill.current) gsap.to(fill.current, { [upright ? "height" : "width"]: `${volume * 100}%`, duration: 0.3, ease: "power3.out" });
  }, [volume, upright]);

  return (
    <div ref={slot} aria-hidden="true" className="pointer-events-none absolute z-[55] grid place-items-center" style={box}>
      <div
        ref={capsule}
        className="glass relative grid overflow-hidden rounded-full text-black/80"
        style={upright ? { width: THICK, height: LONG } : { width: LONG, height: THICK }}
      >
        <div
          ref={fill}
          className={`absolute bg-white/95 ${upright ? "inset-x-0 bottom-0" : "inset-y-0 left-0"}`}
          style={upright ? { height: `${volume * 100}%` } : { width: `${volume * 100}%` }}
        />
        <div
          ref={glyph}
          className={`absolute grid place-items-center text-[#3a3a3c] mix-blend-normal ${upright ? "inset-x-0 bottom-[7px]" : "inset-y-0 left-[9px]"}`}
        >
          <Speaker level={volume} />
        </div>
      </div>
    </div>
  );
}
