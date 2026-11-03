"use client";

import { homeRegion, os, useOS } from "@/lib/os";
import { useNow } from "./widgets";

// iPhone Duo keeps the status bar on the side: time on top, then cellular,
// Wi-Fi and battery stacked below it in the trailing column. Tapping it
// pulls down Control Center.
export default function StatusBar() {
  const now = useNow("m");
  const windows = useOS((s) => s.windows);
  const dark = useOS((s) => s.dark);
  const portrait = useOS((s) => s.portrait);
  const region = homeRegion(windows);
  // White over the wallpaper and dark apps, black over light apps.
  const onWallpaper = region === "full" || region === (portrait ? "left" : "right");
  const light = useOS((s) => s.statusLight !== null && s.windows.some((w) => w.id === s.statusLight && !w.closing));
  const tone = onWallpaper || dark || light ? "#fff" : "#000";
  const time = now
    ? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?[AP]M$/, "")
    : "9:41";

  return (
    <button
      type="button"
      aria-label="Open Control Center"
      onClick={() => os.set({ overlay: os.get().overlay === "control" ? null : "control" })}
      className={
        portrait
          ? "absolute top-0 right-0 left-0 z-40 flex h-[54px] items-center gap-[6px] px-[34px] transition-colors duration-300"
          : "absolute top-[22px] right-0 z-40 flex w-[84px] flex-col items-center gap-[7px] pt-[2px] pb-[6px] transition-colors duration-300"
      }
      style={{ color: tone }}
    >
      <span className={`text-[16px] leading-none font-semibold tracking-[-0.01em] tabular-nums ${portrait ? "mr-auto" : ""}`}>{time}</span>
      <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 4.8} y={9 - i * 2.8} width="3.2" height={3 + i * 2.8} rx=".9" fill="currentColor" />
        ))}
      </svg>
      <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
        <path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.1-1.1A10 10 0 0 0 8 .8 10 10 0 0 0 .9 3.7L2 4.8a8.4 8.4 0 0 1 6-2.4" fill="currentColor" />
        <path d="M8 5.6c1.4 0 2.7.5 3.7 1.4l1.1-1.1A7 7 0 0 0 8 4a7 7 0 0 0-4.8 1.9L4.3 7c1-.9 2.3-1.4 3.7-1.4" fill="currentColor" />
        <path d="M8 8.8c.6 0 1.1.2 1.5.6L8 11 6.5 9.4c.4-.4.9-.6 1.5-.6" fill="currentColor" />
      </svg>
      <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden="true">
        <rect x=".5" y=".5" width="21" height="11" rx="3.4" fill="none" stroke="currentColor" strokeOpacity=".4" />
        <rect x="2" y="2" width="15" height="8" rx="2" fill="currentColor" />
        <path d="M23 4v4c.8-.3 1.4-1.1 1.4-2S23.8 4.3 23 4" fill="currentColor" fillOpacity=".45" />
      </svg>
    </button>
  );
}
