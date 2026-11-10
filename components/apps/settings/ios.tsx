"use client";

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Slot } from "@/lib/os";

// Shared iOS 27 pieces for Settings, Notes, Résumé and the project pages:
// the iPhone Duo side rail, its glass buttons, the switch and the
// navigation stack. Kept here so the four apps feel like one system.

/** Width of the vertical toolbar on the window's outer edge (Figma kit). */
export const RAIL = 84;

/** The rail's first control sits under the status bar on the trailing
 *  side, and at the top corner on the leading side (no status bar there). */
export const railTop = (slot: Slot) => (slot === "left" ? 24 : 122);

/** Where content goes once the rail has taken its edge. */
export function contentBox(slot: Slot, width: number) {
  const w = width - RAIL;
  return { left: slot === "left" ? RAIL : 0, width: w };
}

/** The vertical toolbar. Controls are 48 pt glass circles on a 60 pt
 *  pitch, 24 pt from the screen edge and 12 pt from the content. */
export function Rail({ slot, children, bottom }: { slot: Slot; children: ReactNode; bottom?: ReactNode }) {
  const left = slot === "left";
  return (
    <div
      // The strip itself lets clicks through to content running under it;
      // only its buttons take them.
      className="pointer-events-none absolute top-0 bottom-0 z-20 flex flex-col *:pointer-events-auto"
      style={{
        width: RAIL,
        [left ? "left" : "right"]: 0,
        paddingTop: railTop(slot),
        paddingBottom: 24,
        paddingLeft: left ? 24 : 12,
        paddingRight: left ? 12 : 24,
      }}
    >
      <div className="flex flex-col gap-[12px]">{children}</div>
      {bottom ? <div className="mt-auto flex flex-col gap-[12px]">{bottom}</div> : null}
    </div>
  );
}

type RailButtonProps = {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  download?: string | boolean;
  external?: boolean;
  /** Glyph colour on plain glass. */
  tint?: string;
  /** Prominent glass: the one primary action, filled with this colour. */
  prominent?: string | true;
  active?: boolean;
  /** Inside a RailGroup: no glass of its own. */
  bare?: boolean;
};

/** A Liquid Glass control on the rail: a 48 pt circle. Pressed, it swells
 *  a little and glows from within, as iOS 26 glass does under a finger. */
export function RailButton({ label, children, onClick, href, download, external, tint, prominent, active, bare }: RailButtonProps) {
  const cls = bare
    ? "grid size-[44px] shrink-0 place-items-center rounded-full text-label transition-[background-color,scale] duration-300 ease-ios hover:bg-fill-3 active:scale-110 active:bg-fill-2"
    : `grid size-[48px] shrink-0 place-items-center rounded-full transition-[scale,filter] duration-300 ease-ios active:scale-110 ${
        prominent ? "glass glass-tint hover:brightness-110" : "glass text-label hover:brightness-[1.03]"
      }`;
  const style = {
    color: prominent ? undefined : tint,
    background: active ? "var(--fill)" : undefined,
    "--tint": prominent && prominent !== true ? prominent : undefined,
  } as React.CSSProperties;
  if (href)
    return (
      <a
        href={href}
        aria-label={label}
        title={label}
        className={cls}
        style={style}
        download={download === true ? "" : download || undefined}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={cls} style={style}>
      {children}
    </button>
  );
}

/** Related rail actions share one vertical capsule of glass, their
 *  buttons bare inside it (Apple groups toolbar items this way). */
export function RailGroup({ children }: { children: ReactNode }) {
  return <div className="glass flex w-[48px] flex-col items-center gap-[2px] rounded-full py-[2px]">{children}</div>;
}

/** SF Symbol stand-ins, drawn on a 24 pt grid with round caps. */
export const Glyph = {
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6.5 6.5 11 11m0-11-11 11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  back: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 4.5 7.5 12l7.5 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  compose: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V13" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M18.4 3.6a1.9 1.9 0 0 1 2.7 2.7L12.6 14.8 9 15.6l.8-3.6z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  ),
  sidebar: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="15" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.5 4.5v15" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.6 8.2h1.6M5.6 10.8h1.6M5.6 13.4h1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  more: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="18" cy="12" r="1.8" fill="currentColor" />
    </svg>
  ),
  open: (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 4h7v7M20 4l-9 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 14v3.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 4 17.5v-9A2.5 2.5 0 0 1 6.5 6H10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  download: (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 16v1.5A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5V16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  safari: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15.6 8.4-2.2 5-5 2.2 2.2-5z" fill="currentColor" />
    </svg>
  ),
  next: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6.5 18.5 12 13 17.5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),
  mic: (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  chevron: (
    <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
      <path d="m1.5 1.5 5 5.5-5 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/** The iOS 26/27 switch: a wider track and a capsule knob. Held, the
 *  knob swells into a clear glass lens the track shows through; it can be
 *  dragged across and settles back to solid white when let go. */
export function Toggle({
  on,
  onChange,
  label,
  disabled,
}: {
  on: boolean;
  onChange?: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  const [held, setHeld] = useState(false);
  const [drag, setDrag] = useState<boolean | null>(null);
  const start = useRef<{ x: number; moved: boolean } | null>(null);
  const shown = drag ?? on;
  const end = (commit: boolean) => {
    const s = start.current;
    start.current = null;
    setHeld(false);
    setDrag(null);
    if (!commit || !s || disabled) return;
    const next = s.moved && drag !== null ? drag : !on;
    if (next !== on) onChange?.(next);
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={(e) => {
        e.stopPropagation();
        // Pointer presses commit on release; this is the keyboard's path.
        if (e.detail === 0 && !disabled) onChange?.(!on);
      }}
      onPointerDown={(e) => {
        if (disabled) return;
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, moved: false };
        setHeld(true);
      }}
      onPointerMove={(e) => {
        const s = start.current;
        if (!s) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (Math.abs(e.clientX - s.x) > 4) s.moved = true;
        if (s.moved) setDrag(e.clientX > r.left + r.width / 2);
      }}
      onPointerUp={() => end(true)}
      onPointerCancel={() => end(false)}
      className={`relative h-[28px] w-[64px] shrink-0 touch-none rounded-full transition-colors duration-300 ${shown ? "bg-green" : "bg-fill"} ${disabled ? "cursor-default" : ""}`}
    >
      <span
        className={`absolute top-[2px] left-[2px] h-[24px] w-[38px] rounded-full transition-[translate,scale,background-color,box-shadow] duration-300 ease-ios ${
          held ? "glass-lens scale-x-[1.42] scale-y-[1.5]" : "bg-white shadow-[0_2px_6px_rgba(0,0,0,0.16),0_0_0_0.5px_rgba(0,0,0,0.04)]"
        } ${shown ? "translate-x-[22px]" : ""}`}
      />
    </button>
  );
}

/** The iOS 26 slider: a slim track filled to the value, a capsule thumb
 *  that turns to a glass lens while it's dragged. Horizontal. */
export function Slider({
  value,
  min = 0,
  onChange,
  label,
  disabled,
  tint = "var(--blue)",
}: {
  value: number;
  min?: number;
  onChange: (v: number) => void;
  label: string;
  disabled?: boolean;
  tint?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [held, setHeld] = useState(false);
  const k = (value - min) / (1 - min);
  const at = (x: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r) return;
    const f = Math.min(1, Math.max(0, (x - r.left) / r.width));
    onChange(min + f * (1 - min));
  };
  return (
    <div
      ref={track}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={Math.round(min * 100)}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="relative h-[28px] flex-1 cursor-pointer touch-none"
      onPointerDown={(e) => {
        if (disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setHeld(true);
        at(e.clientX);
      }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && at(e.clientX)}
      onPointerUp={() => setHeld(false)}
      onPointerCancel={() => setHeld(false)}
      onKeyDown={(e) => {
        const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 0.05 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -0.05 : 0;
        if (!d) return;
        e.preventDefault();
        onChange(Math.min(1, Math.max(min, value + d)));
      }}
    >
      <span className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 overflow-hidden rounded-full bg-fill">
        <span className="block h-full" style={{ width: `${k * 100}%`, background: tint }} />
      </span>
      <span
        className={`absolute top-1/2 h-[24px] w-[38px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-[scale,background-color,box-shadow] duration-300 ease-ios ${
          held ? "glass-lens scale-x-[1.45] scale-y-[1.55]" : "bg-white shadow-[0_2px_7px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.06)]"
        }`}
        style={{ left: `calc(19px + ${k} * (100% - 38px))` }}
      />
    </div>
  );
}

// One subscribe function per query, so React doesn't resubscribe each render.
const mqSubs = new Map<string, (cb: () => void) => () => void>();
const subscribeMQ = (q: string) => {
  let sub = mqSubs.get(q);
  if (!sub) {
    sub = (cb) => {
      const m = window.matchMedia(q);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    };
    mqSubs.set(q, sub);
  }
  return sub;
};

/** A media query as live state (false on the server). */
export function useMedia(query: string) {
  return useSyncExternalStore(
    subscribeMQ(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");

const subscribeMinute = (cb: () => void) => {
  const wait = () => 60000 - (Date.now() % 60000) + 5;
  let id = window.setTimeout(function tick() {
    cb();
    id = window.setTimeout(tick, wait());
  }, wait());
  return () => window.clearTimeout(id);
};
const still = () => () => {};

/** The current minute, as a timestamp; null while rendering on the server.
 *  Mirrors read it once and don't keep a timer running. */
export function useMinute(live: boolean) {
  return useSyncExternalStore(
    live ? subscribeMinute : still,
    () => Math.floor(Date.now() / 60000) * 60000,
    () => null,
  );
}

type Change = { from: string[]; to: string[] };

// The iOS push: the incoming page slides in from the trailing edge over the
// one below, which drifts a third of the way back and dims, as
// UINavigationController does.
const LAYER = "absolute inset-0 transition-[transform,filter] duration-500 ease-ios motion-reduce:animate-none motion-reduce:transition-none";
const UNDER = "transform-[translateX(-30%)] brightness-[0.92]";
const PUSH_IN = "animate-push-in shadow-[-10px_0_30px_rgba(0,0,0,0.08)]";
const POP_OUT = "pointer-events-none animate-pop-out shadow-[-10px_0_30px_rgba(0,0,0,0.08)]";

/**
 * A navigation stack. `keys` is the path from the root page to the one on
 * top; every level stays mounted (so a list keeps its scroll position when
 * you come back to it) and only the top two are ever in view.
 */
export function Stack({
  keys,
  render,
  mirror,
  className = "",
  layer = "bg-bg",
}: {
  keys: string[];
  render: (key: string, depth: number) => ReactNode;
  mirror: boolean;
  className?: string;
  /** Each page's background: pages are opaque so the one below hides. */
  layer?: string;
}) {
  const reduced = useReducedMotion();
  const [change, setChange] = useState<Change>({ from: keys, to: keys });
  const [leaving, setLeaving] = useState<{ key: string; depth: number; id: string } | null>(null);
  const [pushed, setPushed] = useState<string | null>(null);
  const id = (k: string[], i: number) => k.slice(0, i + 1).join("/");

  // Work out what kind of move this is while rendering, so the first frame
  // of the new page is already the right one.
  if (keys.join("/") !== change.to.join("/")) {
    const prev = change.to;
    const isPrefix = (a: string[], b: string[]) => a.every((k, i) => b[i] === k);
    const animate = !mirror && !reduced;
    if (animate && keys.length < prev.length && isPrefix(keys, prev)) {
      const d = keys.length;
      setLeaving({ key: prev[d]!, depth: d, id: id(prev, d) });
      setPushed(null);
    } else if (animate && keys.length === prev.length + 1 && isPrefix(prev, keys)) {
      setPushed(id(keys, keys.length - 1));
      setLeaving(null);
    } else {
      setPushed(null);
      setLeaving(null);
    }
    setChange({ from: prev, to: keys });
  }

  const top = keys.length - 1;
  return (
    <div className={`relative h-full overflow-hidden ${className}`}>
      {keys.map((k, i) => {
        const lid = id(keys, i);
        return (
          <div
            key={lid}
            className={`${LAYER} ${i < top ? UNDER : ""} ${i < top - 1 ? "invisible" : ""} ${lid === pushed ? PUSH_IN : ""} ${layer}`}
            inert={i < top || undefined}
            aria-hidden={i < top || undefined}
            onAnimationEnd={(e) => e.target === e.currentTarget && lid === pushed && setPushed(null)}
          >
            {render(k, i)}
          </div>
        );
      })}
      {leaving ? (
        <div
          key={`leaving:${leaving.id}`}
          className={`${LAYER} ${POP_OUT} ${layer}`}
          onAnimationEnd={(e) => e.target === e.currentTarget && setLeaving(null)}
        >
          {render(leaving.key, leaving.depth)}
        </div>
      ) : null}
    </div>
  );
}
