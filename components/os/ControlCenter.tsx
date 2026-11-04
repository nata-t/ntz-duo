"use client";

import { useRef, useState } from "react";
import { os, setAppearance, useOS } from "@/lib/os";

// Control Center, pulled down over everything: modules on a grid over a
// dimmed, blurred backdrop. The ones that matter
// here work: Dark Mode, brightness, and Focus as a "do not disturb" joke
// that doesn't do anything harmful. The rest are faithful decoration.

// UI kit: 62 pt modules, 15 pt gaps, in the trailing half of the display.
const CELL = 62, GAP = 15;
const span = (n: number) => n * CELL + (n - 1) * GAP;

function Toggle({ on, onClick, label, children, tint = "var(--blue)" }: { on: boolean; onClick: () => void; label: string; children: React.ReactNode; tint?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      onClick={onClick}
      className="grid size-[52px] place-items-center rounded-full transition-[background-color,transform] duration-200 text-white active:scale-90"
      style={{ background: on ? tint : "rgba(255,255,255,0.14)" }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

function Slider({ value, onChange, label, icon }: { value: number; onChange: (v: number) => void; label: string; icon: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const set = (clientY: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    onChange(Math.min(1, Math.max(0.15, 1 - (clientY - r.top) / r.height)));
  };
  return (
    <div
      ref={ref}
      role="slider"
      aria-label={label}
      aria-valuemin={15}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") onChange(Math.min(1, value + 0.1));
        if (e.key === "ArrowDown") onChange(Math.max(0.15, value - 0.1));
      }}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        set(e.clientY);
      }}
      onPointerMove={(e) => e.buttons && set(e.clientY)}
      className="relative cursor-ns-resize overflow-hidden rounded-[34px] bg-white/14 touch-none"
      style={{ width: CELL, height: span(2) }}
    >
      <div className="absolute inset-x-0 bottom-0 bg-white transition-[height] duration-75" style={{ height: `${value * 100}%` }} />
      <div className="absolute inset-x-0 bottom-[18px] grid place-items-center text-[#8e8e93]">
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          {icon}
        </svg>
      </div>
    </div>
  );
}

export default function ControlCenter() {
  const dark = useOS((s) => s.dark);
  const portrait = useOS((s) => s.portrait);
  const brightness = useOS((s) => s.brightness);
  const [wifi, setWifi] = useState(true);
  const [bt, setBt] = useState(true);
  const [air, setAir] = useState(false);
  const [cell, setCell] = useState(true);
  const [focus, setFocus] = useState(false);
  const [rot, setRot] = useState(true);
  const [volume, setVolume] = useState(0.6);
  const close = () => os.set({ overlay: null });

  return (
    <div className="absolute inset-0 z-[44] text-white" onClick={close}>
      {/* Only the layers animate, never their parent: an ancestor fading
          in would cut the blur off from what's behind it. */}
      <div className="absolute inset-0 animate-[duo-fade_0.3s_ease-out_backwards] bg-black/35 backdrop-blur-[30px] backdrop-saturate-150" />
      <div
        className={`absolute grid animate-[duo-cc_0.46s_var(--ease-ios)_backwards] ${portrait ? "top-[70px] left-1/2 -translate-x-1/2" : "top-[24px] right-[108px]"}`}
        style={{ gap: GAP, gridTemplateColumns: `repeat(4, ${CELL}px)`, gridAutoRows: `${CELL}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Connectivity, 2 × 2 */}
        <div className="col-span-2 row-span-2 grid grid-cols-2 place-items-center rounded-[32px] bg-white/12 p-[8px]">
          <Toggle on={air} onClick={() => setAir(!air)} label="Airplane Mode" tint="#ff9500">
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" fill="currentColor" />
          </Toggle>
          <Toggle on={cell} onClick={() => setCell(!cell)} label="Cellular Data" tint="#34c759">
            <path d="M6 18V8M10 18V5M14 18v-7M18 18v-4" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </Toggle>
          <Toggle on={wifi} onClick={() => setWifi(!wifi)} label="Wi-Fi">
            <path d="M12 6c3 0 5.8 1.2 7.8 3.1l1.4-1.4A13 13 0 0 0 12 4a13 13 0 0 0-9.2 3.7l1.4 1.4A11 11 0 0 1 12 6m0 4c1.9 0 3.6.7 4.9 1.9l1.4-1.4A9 9 0 0 0 12 8a9 9 0 0 0-6.3 2.5l1.4 1.4A7 7 0 0 1 12 10m0 4c.8 0 1.5.3 2 .8L12 17l-2-2.2c.5-.5 1.2-.8 2-.8" fill="currentColor" />
          </Toggle>
          <Toggle on={bt} onClick={() => setBt(!bt)} label="Bluetooth">
            <path d="m7 7 10 10-5 4V3l5 4L7 17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </Toggle>
        </div>

        {/* Now Playing, 2 × 2 */}
        <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-[32px] bg-white/12 p-[16px]">
          <div className="flex items-center gap-[10px]">
            <span className="size-[44px] rounded-[10px] bg-[linear-gradient(135deg,#ff8a00,#e52e71)]" />
            <span className="min-w-0 text-[13px] leading-[1.25]">
              <span className="block truncate font-semibold">Not Playing</span>
              <span className="block truncate text-white/60">ntz duo</span>
            </span>
          </div>
          <div className="flex items-center justify-around">
            {["M18 6v12L9 12zM7 6h2v12H7z", "M8 5v14l11-7z", "M6 6v12l9-6zM15 6h2v12h-2z"].map((d) => (
              <svg key={d} width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path d={d} fill="currentColor" />
              </svg>
            ))}
          </div>
        </div>

        {/* Brightness and volume: tall sliders. */}
        <div className="col-1 row-[4/span_2]">
          <Slider
            value={brightness}
            onChange={(v) => os.set({ brightness: v })}
            label="Brightness"
            icon={
              <>
                <circle cx="12" cy="12" r="4.5" fill="currentColor" />
                {Array.from({ length: 8 }, (_, i) => (
                  <rect key={i} x="11" y="1.5" width="2" height="3.5" rx="1" fill="currentColor" transform={`rotate(${i * 45} 12 12)`} />
                ))}
              </>
            }
          />
        </div>
        <div className="col-2 row-[4/span_2]">
          <Slider
            value={volume}
            onChange={setVolume}
            label="Volume"
            icon={<path d="M4 9h4l5-4v14l-5-4H4zM16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
          />
        </div>

        {/* Dark Mode: the one that changes the whole site. */}
        <button
          type="button"
          aria-pressed={dark}
          onClick={() => setAppearance(dark ? "light" : "dark")}
          className="col-span-2 flex items-center gap-[10px] rounded-full bg-white/12 px-[5px] text-left row-3 transition-colors hover:bg-white/18"
        >
          <span className={`grid size-[52px] shrink-0 place-items-center rounded-full ${dark ? "bg-white text-black" : "bg-[rgba(255,255,255,0.16)] text-white"}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
            </svg>
          </span>
          <span className="text-[13px] leading-[1.2] whitespace-nowrap">
            <span className="block font-semibold">Dark Mode</span>
            <span className="block text-white/60">{dark ? "On" : "Off"}</span>
          </span>
        </button>

        {/* Focus */}
        <button
          type="button"
          aria-pressed={focus}
          onClick={() => setFocus(!focus)}
          className="col-span-2 flex items-center gap-[10px] rounded-full bg-white/12 px-[5px] text-left row-3 transition-colors hover:bg-white/18"
        >
          <span className={`grid size-[52px] shrink-0 place-items-center rounded-full ${focus ? "bg-[#5e5ce6]" : "bg-[rgba(255,255,255,0.16)]"}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5" fill="currentColor" />
            </svg>
          </span>
          <span className="text-[13px] leading-[1.2] whitespace-nowrap">
            <span className="block font-semibold">Focus</span>
            <span className="block text-white/60">{focus ? "Do Not Disturb" : "Off"}</span>
          </span>
        </button>

        {/* Small round controls. */}
        {[
          { label: "Orientation Lock", on: rot, set: () => setRot(!rot), d: "M12 4a8 8 0 1 0 8 8M20 4v5h-5", tint: "#ff3b30" },
          { label: "Screen Mirroring", on: false, set: () => {}, d: "M3 6h18v10H3zM8 20h8M12 16v4" },
          { label: "Flashlight", on: false, set: () => {}, d: "M8 2h8v4l-2 4v12h-4V10L8 6z" },
          { label: "Timer", on: false, set: () => {}, d: "M12 6a8 8 0 1 0 0 16 8 8 0 0 0 0-16M12 10v4l2.5 2.5M10 2h4" },
        ].map((c, i) => (
          <div key={c.label} className="grid place-items-center" style={{ gridColumn: 3 + (i % 2), gridRow: 4 + Math.floor(i / 2) }}>
            <button
              type="button"
              aria-label={c.label}
              aria-pressed={c.on}
              onClick={c.set}
              className="grid size-[62px] place-items-center rounded-full transition-[background-color,transform] active:scale-90"
              style={{ background: c.on ? (c.tint ?? "#fff") : "rgba(255,255,255,0.12)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path d={c.d} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <p className="absolute bottom-[22px] left-1/2 -translate-x-1/2 animate-[duo-fade_0.4s_0.2s_ease-out_backwards] text-[12px] text-white/60">
        Tap anywhere to close
      </p>
    </div>
  );
}
