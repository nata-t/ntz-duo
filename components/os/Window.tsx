"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { LAUNCH, spring } from "@/lib/spring";
import { closeWindow, dims, homeRegion, moveWindow, os, removeWindow, slotRect, useDims, useOS, type Rect, type Win } from "@/lib/os";
import { APPS } from "@/components/apps/registry";
import { IconFace, iconRadius } from "./AppIcon";

/** The display's own corner, so a full window's corners vanish into it. */
const CORNER = 40;
const SPLIT_CORNER = 28;

type Frame = Rect & { r: number };

// An app window. Its frame (position, size, corners) is animated; the app
// inside is laid out at the window's final size and scaled to cover the
// frame, so it never reflows mid-flight, the way iOS scales an app's
// snapshot while it launches.
export default function Window({ win, mirror }: { win: Win; mirror: boolean }) {
  const split = useOS((s) => s.split);
  const { w: W, h: H } = useDims();
  const focus = useOS((s) => s.focus === win.id);
  const app = APPS[win.app];
  const target = slotRect(win.slot, split, W, H);
  const targetR = win.slot === "full" ? CORNER : SPLIT_CORNER;

  const frameEl = useRef<HTMLDivElement>(null);
  const contentEl = useRef<HTMLDivElement>(null);
  const splashEl = useRef<HTMLDivElement>(null);
  const chromeEl = useRef<HTMLDivElement>(null);
  const frame = useRef<Frame>({ ...target, r: targetR });
  const tween = useRef<gsap.core.Tween | null>(null);
  const [menu, setMenu] = useState(false);

  const paint = () => {
    const f = frame.current, el = frameEl.current, c = contentEl.current;
    if (!el || !c) return;
    el.style.left = `${f.x}px`;
    el.style.top = `${f.y}px`;
    el.style.width = `${f.w}px`;
    el.style.height = `${f.h}px`;
    el.style.borderRadius = `${f.r}px`;
    const d = dims();
    const t = slotRect(win.slot, os.get().split, d.w, d.h);
    const s = Math.max(f.w / t.w, f.h / t.h);
    c.style.transform = `translate(${(f.w - t.w * s) / 2}px, ${(f.h - t.h * s) / 2}px) scale(${s})`;
  };

  /** The multitasking control and the home indicator are system UI: they
   *  wait out the launch and leave at once on close, never riding the
   *  window's frame into or out of its icon. */
  const showChrome = (v: boolean) => {
    const el = chromeEl.current;
    if (!el) return;
    el.style.transition = v ? "opacity 0.25s ease-out" : "none";
    el.style.opacity = v ? "1" : "0";
  };

  const animateTo = (to: Frame, opts: { duration?: number; ease?: (p: number) => number; onComplete?: () => void; onUpdate?: (p: number) => void } = {}) => {
    tween.current?.kill();
    const sp = LAUNCH();
    const from = { ...frame.current };
    const p = { v: 0 };
    tween.current = gsap.to(p, {
      v: 1,
      duration: opts.duration ?? sp.duration,
      ease: opts.ease ?? sp.ease,
      onUpdate: () => {
        const k = p.v;
        frame.current = {
          x: from.x + (to.x - from.x) * k,
          y: from.y + (to.y - from.y) * k,
          w: Math.max(1, from.w + (to.w - from.w) * k),
          h: Math.max(1, from.h + (to.h - from.h) * k),
          r: from.r + (to.r - from.r) * Math.min(1, k),
        };
        paint();
        opts.onUpdate?.(k);
      },
      onComplete: opts.onComplete,
    });
  };

  // Launch: grow out of the icon.
  useLayoutEffect(() => {
    if (mirror) {
      paint();
      return;
    }
    const o = win.origin;
    if (o) {
      frame.current = { ...o, r: iconRadius(o.w) };
      paint();
      const splash = splashEl.current;
      if (splash) splash.style.opacity = "1";
      animateTo({ ...target, r: targetR }, {
        onUpdate: (k) => {
          if (splash) splash.style.opacity = String(Math.max(0, 1 - Math.max(0, k - 0.12) / 0.38));
        },
        onComplete: () => showChrome(true),
      });
    } else {
      // Opened from somewhere without an icon (search, footer): rise in.
      frame.current = { x: target.x + target.w * 0.06, y: target.y + target.h * 0.06, w: target.w * 0.88, h: target.h * 0.88, r: targetR };
      paint();
      if (frameEl.current) gsap.fromTo(frameEl.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      animateTo({ ...target, r: targetR }, { onComplete: () => showChrome(true) });
    }
    return () => void tween.current?.kill();
    // Launch runs once per window.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Moves between slots (Split View on iPhone Duo is a fixed half and half).
  // A new display size (full screen in or out) takes the new frame at once:
  // the transition there is the screen's, not the window's.
  const placed = useRef({ slot: win.slot, split, W, H });
  useEffect(() => {
    const was = placed.current;
    const moved = was.slot !== win.slot || was.split !== split;
    if (win.closing || (!moved && was.W === W && was.H === H && !mirror)) return;
    placed.current = { slot: win.slot, split, W, H };
    const to = { ...target, r: targetR };
    if (mirror || !moved) {
      tween.current?.kill();
      frame.current = to;
      paint();
      showChrome(true);
      return;
    }
    const f = frame.current;
    if (Math.abs(f.x - to.x) + Math.abs(f.w - to.w) + Math.abs(f.h - to.h) < 0.5) return;
    animateTo(to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win.slot, split, W, H, mirror, win.closing]);

  // Close: shrink back into the icon when it is on screen, else sink away.
  useEffect(() => {
    if (!win.closing || mirror) return;
    showChrome(false);
    const icon = document.querySelector<HTMLElement>(`[data-os-root="live"] [data-home] [data-app="${win.app}"] [data-face]`);
    const root = document.querySelector<HTMLElement>(`[data-os-root="live"]`);
    let to: Frame | null = null;
    if (icon && root && homeRegion(os.get().windows) !== null) {
      const r = root.getBoundingClientRect(), e = icon.getBoundingClientRect(), s = r.width / dims().w;
      to = { x: (e.left - r.left) / s, y: (e.top - r.top) / s, w: e.width / s, h: e.height / s, r: iconRadius(e.width / s) };
    }
    const splash = splashEl.current;
    if (to) {
      const sp = spring(0.46, 0.92);
      animateTo(to, {
        duration: sp.duration,
        ease: sp.ease,
        onUpdate: (k) => {
          if (splash) splash.style.opacity = String(Math.min(1, Math.max(0, (k - 0.25) / 0.4)));
        },
        onComplete: () => removeWindow(win.id),
      });
    } else {
      const f = frame.current;
      animateTo({ x: f.x + f.w * 0.2, y: f.y + f.h * 0.2, w: f.w * 0.6, h: f.h * 0.6, r: 40 }, { duration: 0.32, ease: (p) => 1 - Math.pow(1 - p, 3), onComplete: () => removeWindow(win.id) });
      if (frameEl.current) gsap.to(frameEl.current, { opacity: 0, duration: 0.28 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win.closing]);

  if (!app?.render) return null;
  if (mirror && win.closing) return null;

  const touchesRight = win.slot !== "left";
  const content = app.render({
    id: win.id,
    width: target.w,
    height: target.h,
    slot: win.slot,
    mirror,
    close: () => closeWindow(win.id),
  });

  return (
    <div
      ref={frameEl}
      data-window={win.app}
      className="absolute overflow-hidden bg-bg text-label"
      style={{
        left: target.x,
        top: target.y,
        width: target.w,
        height: target.h,
        borderRadius: targetR,
        zIndex: focus ? 3 : 2,
        boxShadow: win.slot === "full" ? undefined : "0 0 0 0.5px rgba(0,0,0,0.12)",
        pointerEvents: win.closing ? "none" : undefined,
      }}
      onPointerDownCapture={() => !mirror && !focus && os.set({ focus: win.id })}
    >
      <div
        ref={contentEl}
        className="absolute top-0 left-0 origin-top-left"
        style={
          {
            width: target.w,
            height: target.h,
            "--safe-right": touchesRight ? "84px" : "0px",
            "--safe-left": "0px",
          } as React.CSSProperties
        }
      >
        {content}
      </div>

      {/* Launch screen: the icon on its colour, over the app until it's ready. */}
      <div
        ref={splashEl}
        className="pointer-events-none absolute inset-0 grid place-items-center opacity-0"
        style={{ background: app.splash ?? "var(--bg)" }}
      >
        <span className="opacity-90">
          <IconFace id={win.app} size={64} />
        </span>
      </div>

      {mirror ? null : (
        <div ref={chromeEl} className="pointer-events-none absolute inset-0 z-10 opacity-0 *:pointer-events-auto">
          <WindowControls
            open={menu && !win.closing}
            setOpen={setMenu}
            slot={win.slot}
            onMove={(slot) => {
              setMenu(false);
              moveWindow(win.id, slot);
            }}
            onClose={() => closeWindow(win.id)}
          />
          <HomeIndicator onClose={() => closeWindow(win.id)} />
        </div>
      )}
    </div>
  );
}

/** The multitasking control at the top of every window. */
function WindowControls({
  open,
  setOpen,
  slot,
  onMove,
  onClose,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  slot: Win["slot"];
  onMove: (s: Win["slot"]) => void;
  onClose: () => void;
}) {
  const drag = useRef<{ x: number; y: number } | null>(null);
  const portrait = useOS((s) => s.portrait);
  const items: { id: Win["slot"] | "close"; label: string; icon: React.ReactNode }[] = [
    { id: "full", label: "Full Screen", icon: <rect x="3" y="5" width="18" height="14" rx="2.5" fill="currentColor" /> },
    {
      id: "left",
      label: portrait ? "Top Half" : "Left Half",
      icon: (
        <>
          <rect x="3" y="5" width="8" height="14" rx="2" fill="currentColor" />
          <rect x="13" y="5" width="8" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </>
      ),
    },
    {
      id: "right",
      label: portrait ? "Bottom Half" : "Right Half",
      icon: (
        <>
          <rect x="3" y="5" width="8" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13" y="5" width="8" height="14" rx="2" fill="currentColor" />
        </>
      ),
    },
    { id: "close", label: "Close", icon: <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> },
  ];
  return (
    <div className="absolute top-[7px] left-1/2 z-10 -translate-x-1/2">
      <button
        type="button"
        aria-label="Window options"
        aria-expanded={open}
        // A tap opens the menu; a drag sideways sends the app to that half
        // (or up/down in portrait), the way iPad windows snap.
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d) return;
          const dx = e.clientX - d.x, dy = e.clientY - d.y;
          const portrait = os.get().portrait;
          const along = portrait ? dy : dx;
          if (Math.abs(along) > 40) onMove(along < 0 ? "left" : "right");
          else if (Math.hypot(dx, dy) < 6) setOpen(!open);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className="flex h-[22px] w-[44px] cursor-grab touch-none items-center justify-center gap-[3.5px] rounded-full transition-colors hover:bg-fill-3 active:cursor-grabbing"
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-[5px] rounded-full bg-label-2" />
        ))}
      </button>
      {open ? (
        <div
          role="menu"
          className="glass absolute top-[30px] left-1/2 w-[220px] -translate-x-1/2 animate-[duo-pop_0.36s_cubic-bezier(0.2,1.3,0.4,1)_backwards] overflow-hidden rounded-[32px] bg-(--glass-strong) p-[8px] text-label origin-top"
        >
          <div className="flex justify-between px-[4px] pb-[6px]">
            {items.slice(0, 3).map((it) => (
              <button
                key={it.id}
                type="button"
                role="menuitem"
                aria-label={it.label}
                onClick={() => onMove(it.id as Win["slot"])}
                className={`grid h-[44px] w-[62px] place-items-center rounded-full transition-colors hover:bg-fill-3 ${slot === it.id ? "bg-fill-3 text-blue" : ""}`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className={portrait ? "rotate-90" : undefined}>
                  {it.icon}
                </svg>
              </button>
            ))}
          </div>
          <div className="mx-[8px] h-px bg-sep" />
          <button
            type="button"
            role="menuitem"
            onClick={onClose}
            className="mt-[6px] flex w-full items-center justify-between rounded-full px-[14px] py-[10px] text-[17px] transition-colors hover:bg-fill-3"
          >
            Close
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              {items[3]!.icon}
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Click, or drag up, to go home. */
function HomeIndicator({ onClose }: { onClose: () => void }) {
  const start = useRef<number | null>(null);
  return (
    <button
      type="button"
      aria-label="Close app"
      className="group absolute bottom-0 left-1/2 z-10 grid h-[22px] w-[200px] -translate-x-1/2 cursor-pointer place-items-center touch-none"
      onPointerDown={(e) => {
        start.current = e.clientY;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerUp={(e) => {
        const s = start.current;
        start.current = null;
        if (s === null || s - e.clientY > 12 || Math.abs(s - e.clientY) < 4) onClose();
      }}
    >
      <span className="h-[5px] w-[140px] rounded-full bg-label opacity-80 transition-[width,opacity] duration-300 group-hover:w-[150px] group-hover:opacity-100" />
    </button>
  );
}
