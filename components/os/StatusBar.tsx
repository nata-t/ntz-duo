"use client";

import { useMemo } from "react";
import { homeRegion, os, useOS } from "@/lib/os";
import { pullHandlers } from "./ControlCenter";
import { useNow } from "./widgets";
import { BarsGlyph, BatteryGauge, StatusRing, WifiGlyph, useBattery } from "./StatusRing";

// iPhone Duo keeps the status bar on the side: the time on top, and under
// it one circle that holds battery, Wi-Fi and signal. Tapping it opens
// Control Center, and the circle unfolds into the full readout (battery
// gauge and percentage, the network, the carrier) beside it. Upright, the
// inner display falls back to a classic horizontal status bar.
export default function StatusBar() {
  const now = useNow("m");
  const windows = useOS((s) => s.windows);
  const dark = useOS((s) => s.dark);
  const portrait = useOS((s) => s.portrait);
  const open = useOS((s) => s.overlay === "control");
  const level = useBattery();
  const region = homeRegion(windows);
  // White over the wallpaper, dark apps and Control Center; black over light apps.
  const onWallpaper = region === "full" || region === (portrait ? "left" : "right");
  const light = useOS((s) => s.statusLight !== null && s.windows.some((w) => w.id === s.statusLight && !w.closing));
  const tone = open || onWallpaper || dark || light ? "#fff" : "#000";
  const time = now
    ? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?[AP]M$/, "")
    : "9:41";
  const toggle = () => os.set({ overlay: os.get().overlay === "control" ? null : "control" });
  // Tap to open, or pull down to drag it open by hand.
  const pull = useMemo(() => pullHandlers(), []);

  if (portrait)
    return (
      <button
        type="button"
        aria-label={open ? "Close Control Center" : "Open Control Center"}
        aria-expanded={open}
        onClick={toggle}
        className="absolute top-0 right-0 left-0 z-[46] flex h-[54px] items-center gap-[6px] px-[34px] transition-colors duration-300"
        style={{ color: tone }}
      >
        <span className="mr-auto text-[16px] leading-none font-semibold tracking-[-0.01em] tabular-nums">{time}</span>
        <BarsGlyph />
        <WifiGlyph size={16} />
        <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden="true">
          <rect x=".5" y=".5" width="21" height="11" rx="3.4" fill="none" stroke="currentColor" strokeOpacity=".4" />
          <rect x="2" y="2" width={Math.max(1, 18 * level)} height="8" rx="2" fill="currentColor" />
          <path d="M23 4v4c.8-.3 1.4-1.1 1.4-2S23.8 4.3 23 4" fill="currentColor" fillOpacity=".45" />
        </svg>
      </button>
    );

  // Only the time and the circle take taps: the readout that unfolds
  // under them is display, and the rail below belongs to the app.
  return (
    <div className="pointer-events-none absolute top-[22px] right-0 z-[46] w-[84px] transition-colors duration-300" style={{ color: tone }}>
      <button
        type="button"
        aria-label={open ? "Close Control Center" : "Open Control Center"}
        aria-expanded={open}
        onClick={toggle}
        {...pull}
        className="group pointer-events-auto mx-auto flex w-[64px] touch-none flex-col items-center gap-[8px] rounded-[20px] pt-[2px] pb-[4px]"
      >
        <span className="text-[16px] leading-none font-semibold tracking-[-0.01em] tabular-nums">{time}</span>
        {/* The circle becomes the gauge in place: one swaps for the other. */}
        {/* 48 pt, on the rail's centre line: the size and line of the
            controls under it, in every app. */}
        <span className="grid size-[48px] place-items-center">
          <span
            className={`col-start-1 row-start-1 transition-[opacity,scale,filter] duration-300 ease-ios group-active:scale-110 ${open ? "scale-[1.18] opacity-0 blur-[2px]" : ""}`}
          >
            <StatusRing level={level} />
          </span>
          <span
            className={`col-start-1 row-start-1 transition-[opacity,scale,filter] duration-300 ease-ios ${open ? "" : "scale-[0.85] opacity-0 blur-[2px]"}`}
          >
            <BatteryGauge level={level} />
          </span>
        </span>
      </button>
      {/* The rest of the readout unfolds below the gauge, row by row. */}
      <div className="mt-[12px] flex flex-col items-center gap-[14px]" aria-hidden={!open}>
        <span
          className={`flex flex-col items-center gap-[2px] transition-[opacity,translate,filter] duration-300 ease-ios ${open ? "delay-[60ms]" : "-translate-y-[14px] opacity-0 blur-[3px]"}`}
        >
          <WifiGlyph size={17} />
          <span className="text-[11px] leading-[13px] font-semibold">ntz-home</span>
        </span>
        <span
          className={`flex flex-col items-center gap-[3px] transition-[opacity,translate,filter] duration-300 ease-ios ${open ? "delay-[110ms]" : "-translate-y-[28px] opacity-0 blur-[3px]"}`}
        >
          <BarsGlyph />
          <span className="text-[11px] leading-[13px] font-semibold">5G</span>
        </span>
      </div>
    </div>
  );
}
