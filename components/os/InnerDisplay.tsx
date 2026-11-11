"use client";

import { useEffect, useRef, useState } from "react";
import { DISPLAY_CORNER, DIVIDER, applyGlass, closeWindow, goHome, homeRegion, os, swapSides, syncAppearance, useDims, useOS } from "@/lib/os";
import { exitFull } from "@/lib/full";
import Home, { homePages } from "./Home";
import Window from "./Window";
import StatusBar from "./StatusBar";
import ControlCenter, { cc } from "./ControlCenter";
import Search from "./Search";
import Alert from "./Alert";

// The inner display. Rendered three times: once live (flat, interactive)
// and once per half while the device folds, as a mirror of the same state.
export default function InnerDisplay({ mirror = false }: { mirror?: boolean; half?: "L" | "R" }) {
  const dark = useOS((s) => s.dark);
  const windows = useOS((s) => s.windows);
  const live = useOS((s) => s.live);
  const brightness = useOS((s) => s.brightness);
  const overlay = useOS((s) => s.overlay);
  const fullScreen = useOS((s) => s.screen !== null);
  const ccShown = cc.use((s) => s.shown);
  // Spotlight stays mounted while it animates away.
  const [searchShown, setSearchShown] = useState(false);
  if (overlay === "search" && !searchShown) setSearchShown(true);
  const root = useRef<HTMLDivElement>(null);
  const region = homeRegion(windows);
  const { w: W, h: H } = useDims();
  const portrait = H > W;

  // The live copy owns appearance: follow the system until Settings says otherwise.
  useEffect(() => {
    if (mirror) return;
    try {
      const a = localStorage.getItem("duo:appearance");
      if (a === "light" || a === "dark" || a === "auto") os.set({ appearance: a });
      const g = parseFloat(localStorage.getItem("duo:glass") ?? "");
      if (g >= 0 && g <= 1) os.set({ glass: g });
    } catch {}
    syncAppearance();
    applyGlass();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", syncAppearance);
    return () => mq.removeEventListener("change", syncAppearance);
  }, [mirror]);

  // Wheel input: inner scroll views take it while they can scroll that way;
  // otherwise it pages the Home Screen. Nothing reaches the page behind.
  useEffect(() => {
    const el = root.current;
    if (mirror || !el) return;
    let acc = 0, lock = 0;
    const onWheel = (e: WheelEvent) => {
      if (!os.get().live) return;
      const dy = e.deltaY, dx = e.deltaX;
      let n = e.target as HTMLElement | null;
      while (n && n !== el) {
        const cs = getComputedStyle(n);
        const canY = /(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1;
        const canX = /(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth + 1;
        if (canY && Math.abs(dy) >= Math.abs(dx)) {
          const atTop = n.scrollTop <= 0, atEnd = n.scrollTop + n.clientHeight >= n.scrollHeight - 1;
          if ((dy < 0 && !atTop) || (dy > 0 && !atEnd)) return; // native scroll, contained
          e.preventDefault();
          return;
        }
        if (canX && Math.abs(dx) > Math.abs(dy)) return;
        n = n.parentElement;
      }
      e.preventDefault();
      const region = homeRegion(os.get().windows);
      if (region === null || os.get().overlay) return;
      const now = performance.now();
      if (now < lock) return;
      acc += Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (Math.abs(acc) > 70) {
        const page = Math.min(homePages(os.get().portrait, region) - 1, Math.max(0, os.get().page + Math.sign(acc)));
        if (page !== os.get().page) os.set({ page });
        acc = 0;
        lock = now + 650;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [mirror]);

  // Keyboard: Escape goes home (or closes what's on top); at home, it
  // leaves full screen.
  useEffect(() => {
    if (mirror) return;
    const onKey = (e: KeyboardEvent) => {
      // Apps handle their own Escape first (closing a viewer, leaving an album).
      if (!os.get().live || e.key !== "Escape" || e.defaultPrevented) return;
      const s = os.get();
      if (s.alert) os.set({ alert: null });
      else if (s.overlay) os.set({ overlay: null });
      else if (s.focus) closeWindow(s.focus);
      else if (s.windows.length === 0 && s.screen) exitFull();
      else goHome();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mirror]);

  return (
    <div
      ref={root}
      data-os-root={mirror ? "mirror" : "live"}
      data-theme={dark ? "dark" : "light"}
      data-lenis-prevent={!mirror && live ? "" : undefined}
      aria-hidden={mirror || undefined}
      inert={mirror || !live || undefined}
      // Isolated: windows and the status bar stack above the wallpaper
      // only, never above what the device lays over its screen (the black
      // of a sleeping display).
      className="relative isolate overflow-hidden bg-black font-sans tracking-[-0.01em] text-label select-none"
      // Full screen there's no device around it, so the display keeps its
      // own corners against the black.
      style={{ width: W, height: H, borderRadius: fullScreen ? DISPLAY_CORNER : undefined, touchAction: live && !mirror ? "none" : undefined }}
    >
      <img
        src={`/wallpapers/${portrait ? "outer" : "dunes"}-${dark ? "dark" : "light"}${portrait ? "" : "-landscape"}.webp`}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {region ? <Home region={region} mirror={mirror} /> : null}

      {windows.map((w) => (
        <Window key={w.id} win={w} mirror={mirror} />
      ))}

      {/* Split View's divider sits on the hinge; tap the grabber to swap sides. */}
      {windows.some((w) => !w.closing && w.slot !== "full") ? (
        <button
          type="button"
          tabIndex={mirror ? -1 : 0}
          aria-label="Swap apps"
          onClick={swapSides}
          className="group absolute z-[4] grid animate-[duo-fade_0.3s_ease-out_both] place-items-center bg-black"
          style={
            portrait
              ? { left: 0, top: (H - DIVIDER) / 2, width: W, height: DIVIDER }
              : { top: 0, left: (W - DIVIDER) / 2, width: DIVIDER, height: H }
          }
        >
          <span
            className={`rounded-full bg-white/65 transition-[background-color,scale] duration-300 group-hover:scale-125 group-hover:bg-white/90 ${portrait ? "h-[2.5px] w-[44px]" : "h-[44px] w-[2.5px]"}`}
          />
        </button>
      ) : null}

      <StatusBar />

      {/* Control Center stays while it closes, folding back into the circle. */}
      {!mirror && (overlay === "control" || ccShown) ? <ControlCenter /> : null}
      {!mirror && (overlay === "search" || searchShown) ? (
        <Search closing={overlay !== "search"} onClosed={() => setSearchShown(false)} />
      ) : null}
      {!mirror ? <Alert /> : null}

      {/* Brightness, as the panel would dim. */}
      <div className="pointer-events-none absolute inset-0 z-50 bg-black" style={{ opacity: (1 - brightness) * 0.7 }} />
    </div>
  );
}
