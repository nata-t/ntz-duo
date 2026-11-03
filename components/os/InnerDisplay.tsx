"use client";

import { useEffect, useRef } from "react";
import { closeWindow, goHome, homeRegion, os, swapSides, syncAppearance, useDims, useOS } from "@/lib/os";
import Home, { homePages } from "./Home";
import Window from "./Window";
import StatusBar from "./StatusBar";
import ControlCenter from "./ControlCenter";
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
    } catch {}
    syncAppearance();
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

  // Keyboard: Escape goes home (or closes what's on top).
  useEffect(() => {
    if (mirror) return;
    const onKey = (e: KeyboardEvent) => {
      // Apps handle their own Escape first (closing a viewer, leaving an album).
      if (!os.get().live || e.key !== "Escape" || e.defaultPrevented) return;
      const s = os.get();
      if (s.alert) os.set({ alert: null });
      else if (s.overlay) os.set({ overlay: null });
      else if (s.focus) closeWindow(s.focus);
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
      className="relative overflow-hidden bg-black font-sans text-label select-none"
      style={{ width: W, height: H, letterSpacing: "-0.01em", touchAction: live && !mirror ? "none" : undefined }}
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
          className="group absolute z-[4] grid place-items-center bg-black"
          style={
            portrait
              ? { left: 0, top: H / 2 - 5.5, width: W, height: 11, animation: "duo-fade 0.3s ease-out both" }
              : { top: 0, left: W / 2 - 5.5, width: 11, height: H, animation: "duo-fade 0.3s ease-out both" }
          }
        >
          <span
            className="rounded-full bg-white/65 transition-[background-color,scale] duration-300 group-hover:scale-125 group-hover:bg-white/90"
            style={portrait ? { width: 46, height: 3 } : { width: 3, height: 46 }}
          />
        </button>
      ) : null}

      <StatusBar />

      {!mirror && overlay === "control" ? <ControlCenter /> : null}
      {!mirror && overlay === "search" ? <Search /> : null}
      {!mirror ? <Alert /> : null}

      {/* Brightness, as the panel would dim. */}
      <div className="pointer-events-none absolute inset-0 z-50 bg-black" style={{ opacity: (1 - brightness) * 0.7 }} />
    </div>
  );
}
