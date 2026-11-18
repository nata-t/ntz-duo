"use client";

import { useEffect, useRef } from "react";
import { stage } from "@/components/stage/stage-state";
import { useOS } from "@/lib/os";
import { OUTER } from "@/components/device/geometry";
import { useNow } from "@/components/os/widgets";
import Veil from "@/components/os/Veil";
import VolumeHUD from "@/components/os/VolumeHUD";
import { gsap } from "@/lib/gsap";
import { BUTTON_ICONS, DEPTH, OUTER_GLASS, canvas, clockText, loadFonts, outerSheet, paintChrome, paintScale, paintTime, wallpaper } from "@/components/device/lockart";

// The outer display (466 × 678 pt). Closed, it shows the Lock Screen; stood
// up in a tent at the end of the story, it shows StandBy in landscape. The
// two cross-fade so the change reads as the phone switching modes.
export default function OuterDisplay() {
  const mode = stage.use((s) => s.outer);
  return (
    <div className="relative h-full w-full overflow-hidden bg-black font-sans text-white select-none">
      <div className={`absolute inset-0 transition-opacity duration-700 ${mode === "lock" ? "opacity-100" : "opacity-0"}`}>
        <LockScreen />
      </div>
      <div className={`absolute inset-0 transition-opacity duration-700 ${mode === "standby" ? "opacity-100" : "opacity-0"}`}>
        <StandBy />
      </div>
      <VolumeHUD where="outer" w={OUTER.w} h={OUTER.h} />
      <Veil />
    </div>
  );
}

function LockScreen() {
  const dark = useOS((s) => s.dark);
  const awake = useOS((s) => s.awake);
  const root = useRef<HTMLDivElement>(null);
  // Waking, the Lock Screen settles from a touch larger as the light comes up.
  const wasAwake = useRef(awake);
  useEffect(() => {
    if (awake && !wasAwake.current && root.current)
      gsap.fromTo(root.current, { scale: 1.04 }, { scale: 1, duration: 0.6, ease: "power3.out", clearProps: "transform" });
    wasAwake.current = awake;
  }, [awake]);
  const theme = dark ? "dark" : "light";
  const time = useRef<HTMLCanvasElement>(null);
  const chrome = useRef<HTMLCanvasElement>(null);
  const now = useNow("m");
  const zoom = stage.use((s) => s.zoom);

  // The clock and the chrome, by the same hand as the GPU's. The chrome is
  // painted aside first: a canvas clears when it's resized, so both are
  // resized and drawn in one go, and never show blank.
  useEffect(() => {
    let alive = true;
    const scale = paintScale(zoom);
    const w = Math.round(OUTER.w * scale), h = Math.round(OUTER.h * scale);
    void loadFonts().then(async () => {
      const [aside, a] = canvas(w, h);
      await paintChrome(a, w, h, "outer");
      if (!alive) return;
      for (const el of [time.current, chrome.current]) if (el && (el.width !== w || el.height !== h)) Object.assign(el, { width: w, height: h });
      const t = time.current?.getContext("2d");
      if (t) paintTime(t, w, h, "outer", theme, now ?? new Date());
      const c = chrome.current?.getContext("2d");
      if (c) {
        c.clearRect(0, 0, w, h);
        c.drawImage(aside, 0, 0);
      }
    });
    return () => {
      alive = false;
    };
  }, [theme, now, zoom]);

  // Shut and still, this is the picture the GPU draws as the phone starts
  // to open (lockart.ts): each sheet of the wallpaper pushed in by its own
  // depth, the clock behind the ridge, the chrome in front. Here the
  // notification and the controls are real Liquid Glass.
  const sheet = (name: "base" | "sky" | "ridge" | "dune", depth: number) => (
    <img src={wallpaper(theme, name)} alt="" draggable={false} className="absolute max-w-none" style={outerSheet(depth)} />
  );
  return (
    <div ref={root} className="absolute inset-0 overflow-hidden">
      {sheet("base", DEPTH.ridge)}
      {sheet("sky", DEPTH.sky)}
      <canvas ref={time} aria-label={now ? clockText(now).time : undefined} className="absolute inset-0 h-full w-full" />
      {sheet("ridge", DEPTH.ridge)}
      {sheet("dune", DEPTH.dune)}
      <canvas ref={chrome} aria-hidden="true" className="absolute inset-0 h-full w-full" />

      {/* One notification: the invitation. */}
      {/* Its foot sits on the camera button's: one baseline along the bottom. */}
      <div
        className="glass-clear absolute rounded-[26px] p-[14px]"
        style={{ left: N.left, right: N.right, bottom: N.bottom, height: N.h }}
      >
        <div className="flex items-start gap-[11px]">
          <span className="grid size-[38px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-[#c9d6ff]">
            <img src="/portrait/source.webp" alt="" className="mt-[6px] w-full" draggable={false} />
          </span>
          <span className="min-w-0 text-[14px] leading-[1.3]">
            <span className="flex justify-between gap-2">
              <span className="truncate font-semibold">Natnael Tadele</span>
              <span className="shrink-0 text-white/70">now</span>
            </span>
            <span className="block text-white/90">Hello, hello. Open me up: the work is on the inside.</span>
          </span>
        </div>
      </div>

      {/* Flashlight and camera, stacked in the rail under the camera. */}
      <div
        className="absolute flex -translate-x-1/2 flex-col items-center"
        style={{ left: OUTER_GLASS.camX, bottom: B.bottom, gap: B.gap }}
      >
        {BUTTON_ICONS.map((d) => (
          <span key={d} className="glass-clear grid place-items-center rounded-full" style={{ width: B.size, height: B.size }}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d={d} fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}

const N = OUTER_GLASS.notice, B = OUTER_GLASS.buttons;

/** StandBy in landscape: an analog clock beside the month, as on iPhone. */
function StandBy() {
  const now = useNow("s");
  const d = now ?? new Date(2026, 10, 3, 10, 9, 30);
  const h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
  const hourA = ((h % 12) + m / 60) * 30, minA = (m + s / 60) * 6, secA = s * 6;
  const year = d.getFullYear(), month = d.getMonth(), today = d.getDate();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  // Laid out landscape, then turned to sit upright on the standing device.
  return (
    <div
      className="absolute -rotate-90 bg-black"
      style={{
        width: OUTER.h,
        height: OUTER.w,
        left: (OUTER.w - OUTER.h) / 2,
        top: (OUTER.h - OUTER.w) / 2,
      }}
    >
      <svg className="absolute top-1/2 left-[34px] -translate-y-1/2" width="300" height="300" viewBox="-50 -50 100 100" aria-hidden="true">
        {Array.from({ length: 60 }, (_, i) => (
          <line key={i} x1="0" y1={i % 5 ? -46 : -44} x2="0" y2="-48.5" stroke={i % 5 ? "#5a5a5e" : "#fff"} strokeWidth={i % 5 ? 0.6 : 1.3} transform={`rotate(${i * 6})`} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <text key={i} x={Math.sin((i * Math.PI) / 6) * 36} y={-Math.cos((i * Math.PI) / 6) * 36 + 4.2} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#fff" fontFamily="var(--font-display)">
            {i === 0 ? 12 : i}
          </text>
        ))}
        <line x1="0" y1="0" x2="0" y2="-23" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" transform={`rotate(${hourA})`} />
        <line x1="0" y1="0" x2="0" y2="-38" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${minA})`} />
        <g transform={`rotate(${secA})`}>
          <line x1="0" y1="9" x2="0" y2="-42" stroke="#ff9f0a" strokeWidth=".9" />
        </g>
        <circle r="2.4" fill="#ff9f0a" />
        <circle r=".9" fill="#000" />
      </svg>

      <div className="absolute top-1/2 right-[40px] w-[270px] -translate-y-1/2">
        <p className="mb-[10px] text-[17px] font-semibold tracking-[0.02em] text-[#ff453a] uppercase">
          {d.toLocaleDateString("en-US", { month: "long" })}
        </p>
        <div className="grid grid-cols-7 gap-y-[9px] text-center text-[15px] font-semibold tabular-nums">
          {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
            <span key={i} className="text-[12px] text-white/50">
              {w}
            </span>
          ))}
          {cells.map((n, i) => (
            <span key={i} className="grid place-items-center">
              {n === null ? null : (
                <span
                  className={`grid size-[26px] place-items-center rounded-full leading-none ${n === today ? "bg-[#ff453a]" : ""} ${
                    n !== today && (i % 7 === 0 || i % 7 === 6) ? "text-[rgba(255,255,255,0.5)]" : "text-white"
                  }`}
                >
                  {n}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
