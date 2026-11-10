"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { spring } from "@/lib/spring";
import { createStore } from "@/lib/store";
import { os, setAppearance, useOS } from "@/lib/os";
import { reducedMotion } from "@/lib/env";

// iPhone Duo's Control Center. Tapping the status circle in the side rail
// unfolds it into the full status readout (StatusBar); the screen behind
// dissolves into a blur and the modules materialise in place, out of a
// blur and into focus, row by row. Closing runs it backwards. Pulling down on
// the circle drags it open by hand; the rail beside it carries the pages
// (Favorites, Now Playing, Connectivity). Dark Mode and brightness change
// the whole site; the rest are faithful decoration.

// UI kit: 62 pt modules, 15 pt gaps.
const CELL = 62, GAP = 15;
const span = (n: number) => n * CELL + (n - 1) * GAP;
/** How far a pull travels to open it fully. */
const PULL = 240;

/** Open progress (0 shut … 1 open), for the pull and the presence. */
export const cc = createStore<{ shown: boolean; pull: number | null }>({ shown: false, pull: null });

/** The status circle's pull, from StatusBar: a drag down past a few
 *  points takes over from the tap. Returns pointer handlers. */
export function pullHandlers() {
  let y0: number | null = null, dragging = false;
  return {
    onPointerDown(e: React.PointerEvent) {
      y0 = e.clientY;
      dragging = false;
    },
    onPointerMove(e: React.PointerEvent) {
      if (y0 === null || !e.buttons) return;
      const el = e.currentTarget as HTMLElement;
      // Screen px to points: the display is zoomed.
      const k = el.getBoundingClientRect().width / el.offsetWidth || 1;
      const dy = (e.clientY - y0) / k;
      if (!dragging && dy > 6) {
        dragging = true;
        el.setPointerCapture(e.pointerId);
        if (os.get().overlay !== "control") os.set({ overlay: "control" });
      }
      if (dragging) cc.set({ pull: Math.max(0, Math.min(1.08, dy / PULL)) });
    },
    onPointerUp() {
      y0 = null;
      if (!dragging) return;
      const p = cc.get().pull ?? 0;
      cc.set({ pull: null });
      if (p < 0.3) os.set({ overlay: null });
    },
    /** A drag isn't a tap. */
    onClickCapture(e: React.MouseEvent) {
      if (dragging) {
        dragging = false;
        e.stopPropagation();
        e.preventDefault();
      }
    },
  };
}

// --- Glyphs (SF Symbols stand-ins on a 24 pt grid) ----------------------------

const G = {
  airplane: <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" fill="currentColor" />,
  airdrop: (
    <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <path d="M7.8 16.2a6 6 0 1 1 8.4 0" />
      <path d="M5 19a10 10 0 1 1 14 0" />
      <path d="M10.6 13.4a2 2 0 1 1 2.8 0" />
      <path d="M12 13.5V21" />
    </g>
  ),
  wifi: <path d="M12 6c3 0 5.8 1.2 7.8 3.1l1.4-1.4A13 13 0 0 0 12 4a13 13 0 0 0-9.2 3.7l1.4 1.4A11 11 0 0 1 12 6m0 4c1.9 0 3.6.7 4.9 1.9l1.4-1.4A9 9 0 0 0 12 8a9 9 0 0 0-6.3 2.5l1.4 1.4A7 7 0 0 1 12 10m0 4c.8 0 1.5.3 2 .8L12 17l-2-2.2c.5-.5 1.2-.8 2-.8" fill="currentColor" />,
  cellular: <path d="M5 19v-4M9.7 19v-7M14.3 19V9M19 19V5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />,
  bluetooth: <path d="m7 7 10 10-5 4V3l5 4L7 17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />,
  hotspot: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1" />
    </g>
  ),
  vpn: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17" />
    </g>
  ),
  airplay: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M7.5 16.5a6.4 6.4 0 1 1 9 0" />
      <path d="M9.8 13.8a3.2 3.2 0 1 1 4.4 0" />
      <path d="m8.5 21 3.5-4 3.5 4z" fill="currentColor" stroke="none" />
    </g>
  ),
  lock: (
    <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {/* A lock inside an arrow that nearly closes its circle. */}
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M18.4 2.8v3.8h-3.8" />
      <rect x="8.8" y="11.2" width="6.4" height="5" rx="1.1" fill="currentColor" stroke="none" />
      <path d="M10.2 11.2V9.8a1.8 1.8 0 0 1 3.6 0v1.4" />
    </g>
  ),
  bell: (
    <g fill="currentColor">
      <path d="M12 3a5.5 5.5 0 0 0-5.5 5.5V13L4.6 16v1h14.8v-1l-1.9-3V8.5A5.5 5.5 0 0 0 12 3" />
      <path d="M9.8 18.5a2.3 2.3 0 0 0 4.4 0z" />
    </g>
  ),
  bellSlash: (
    <g>
      <path d="M12 3a5.5 5.5 0 0 0-5.5 5.5V13L4.6 16v1h14.8v-1l-1.9-3V8.5A5.5 5.5 0 0 0 12 3M9.8 18.5a2.3 2.3 0 0 0 4.4 0z" fill="currentColor" />
      <path d="M4 3.5 20 20.5" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M4 3.5 20 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5" fill="currentColor" />,
  bed: <path d="M3 18V7M3 13h18v5M21 13a3 3 0 0 0-3-3h-7v3M7.5 12a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />,
  flashlight: (
    <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
      <path d="M8 2.5h8v3.5l-2 3.5v12h-4V9.5L8 6z" />
      <path d="M12 12.5v2" strokeLinecap="round" />
    </g>
  ),
  timer: (
    <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <path d="M12 3.5a8.5 8.5 0 1 1-6 2.5" />
      <path d="M12 3.5V7M12 12 8 8" />
    </g>
  ),
  calculator: (
    <g fill="currentColor">
      <rect x="5" y="2.5" width="14" height="19" rx="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="8" y="5.5" width="8" height="3" rx="0.8" />
      {[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={8.6 + c * 3.4} cy={12 + r * 3.2} r="1.05" />))}
    </g>
  ),
  camera: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h3l1.6-2.2h5.8L16.5 7h3A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" />
      <circle cx="12" cy="12.8" r="3.4" />
    </g>
  ),
  mirroring: (
    <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
      <rect x="3" y="4" width="13" height="10" rx="2" />
      <path d="M8 18h11a2 2 0 0 0 2-2V9" />
    </g>
  ),
  scanner: (
    <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <path d="M3.5 8V5.5a2 2 0 0 1 2-2H8M16 3.5h2.5a2 2 0 0 1 2 2V8M20.5 16v2.5a2 2 0 0 1-2 2H16M8 20.5H5.5a2 2 0 0 1-2-2V16" />
      <path d="M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM14.5 14.5h1.5v1.5" strokeWidth="1.6" />
    </g>
  ),
  appearance: (
    <g>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
    </g>
  ),
  sun: (
    <g fill="currentColor">
      <circle cx="12" cy="12" r="4.4" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="11" y="1.6" width="2" height="3.4" rx="1" transform={`rotate(${i * 45} 12 12)`} />
      ))}
    </g>
  ),
  speaker: <path d="M4 9h3.5L12.5 5v14l-5-4H4zM15.5 8.8a4.6 4.6 0 0 1 0 6.4M18.2 6.2a8.4 8.4 0 0 1 0 11.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  back: <path d="M12 7v10l-7-5zM19 7v10l-7-5z" fill="currentColor" />,
  play: <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />,
  fwd: <path d="M12 7v10l7-5zM5 7v10l7-5z" fill="currentColor" />,
  plus: <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />,
  power: (
    <g fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
      <path d="M12 3.5V11" />
      <path d="M7.2 6.3a7.5 7.5 0 1 0 9.6 0" />
    </g>
  ),
  heart: <path d="M12 20.3 4.6 13a4.7 4.7 0 0 1 6.6-6.7l.8.8.8-.8A4.7 4.7 0 0 1 19.4 13z" fill="currentColor" />,
  // Drawn on its optical centre: the heads and stems balance on x = 12.
  note: <path transform="translate(-0.6 0.6)" d="M9 17.5V5.5l10-2v12M9 17.5a2.6 2.6 0 1 1-2.6-2.6A2.6 2.6 0 0 1 9 17.5zm10-2a2.6 2.6 0 1 1-2.6-2.6 2.6 2.6 0 0 1 2.6 2.6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
  antenna: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="10" r="1.6" fill="currentColor" />
      <path d="M12 11.6V21M8.6 6.6a4.8 4.8 0 0 0 0 6.8M15.4 6.6a4.8 4.8 0 0 1 0 6.8M5.8 3.8a8.8 8.8 0 0 0 0 12.4M18.2 3.8a8.8 8.8 0 0 1 0 12.4" />
    </g>
  ),
  chevrons: <path d="m8 9.5 4-4 4 4M8 14.5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
};

const Icon = ({ g, size = 24 }: { g: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    {g}
  </svg>
);

// --- Controls --------------------------------------------------------------------

/** A round control. Off, it's neutral clear glass with a white glyph (the
 *  colour seen through it is the Home Screen behind). On, connectivity
 *  fills with its colour; the rest turn white with a coloured glyph. */
function Round({
  on,
  onClick,
  label,
  g,
  tint = "var(--blue)",
  size = CELL,
  glyph = 24,
  fill,
  className = "",
}: {
  on?: boolean;
  onClick?: () => void;
  label: string;
  g: React.ReactNode;
  tint?: string;
  size?: number;
  glyph?: number;
  /** Connectivity style: filled with the tint when on. */
  fill?: boolean;
  className?: string;
}) {
  const style = on ? (fill ? "glass glass-tint text-white" : "glass bg-white!") : "glass-clear text-white";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      onClick={onClick}
      className={`grid shrink-0 place-items-center rounded-full transition-[background-color,color,scale] duration-300 ease-ios active:scale-110 ${style} ${className}`}
      style={{ width: size, height: size, "--tint": tint, color: on && !fill ? tint : undefined } as React.CSSProperties}
    >
      <Icon g={g} size={glyph} />
    </button>
  );
}

/** A tall slider: a white fill rising in a clear glass capsule, its
 *  symbol coloured at the foot. Held, it swells a little. */
function Tall({ value, onChange, label, g, hue, min = 0 }: { value: number; onChange: (v: number) => void; label: string; g: React.ReactNode; hue: string; min?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const set = (clientY: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    onChange(Math.min(1, Math.max(min, 1 - (clientY - r.top) / r.height)));
  };
  return (
    <div
      ref={ref}
      role="slider"
      aria-label={label}
      aria-valuemin={Math.round(min * 100)}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") onChange(Math.min(1, value + 0.1));
        if (e.key === "ArrowDown") onChange(Math.max(min, value - 0.1));
      }}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        set(e.clientY);
      }}
      onPointerMove={(e) => e.buttons && set(e.clientY)}
      className="glass-clear cc-in relative cursor-ns-resize touch-none overflow-hidden rounded-[31px] transition-[scale] duration-300 ease-ios active:scale-x-[1.08] active:scale-y-[1.03]"
      style={{ width: CELL, height: span(2) }}
    >
      <div className="absolute inset-x-0 bottom-0 bg-white/95 transition-[height] duration-75" style={{ height: `${value * 100}%` }} />
      <div className="absolute inset-x-0 bottom-[20px] grid place-items-center" style={{ color: hue }}>
        <Icon g={g} size={26} />
      </div>
    </div>
  );
}

/** A module's place in the opening stagger: row by row from the top,
 *  the right-hand column (nearest the status circle) a beat first. */
const d = (fromRight: number, row: number) => ({ "--d": Math.min(0.36, 0.055 * row + 0.012 * fromRight) }) as React.CSSProperties;

const Module = ({ className = "", style, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) => (
  <div data-cc-module className={`glass-clear cc-in rounded-[34px] ${className}`} style={style} onClick={(e) => e.stopPropagation()}>
    {children}
  </div>
);

/** A small toggle inside the connectivity cluster. */
const Mini = ({ on, onClick, label, g, tint }: { on: boolean; onClick: () => void; label: string; g: React.ReactNode; tint: string }) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={on}
    onClick={onClick}
    className="grid size-[26px] place-items-center rounded-full text-white transition-[background-color,scale] duration-300 ease-ios active:scale-110"
    style={{ background: on ? tint : "rgba(255,255,255,0.16)" }}
  >
    <Icon g={g} size={15} />
  </button>
);

type Page = "favorites" | "music" | "connectivity";

export default function ControlCenter() {
  const dark = useOS((s) => s.dark);
  const portrait = useOS((s) => s.portrait);
  const brightness = useOS((s) => s.brightness);
  const open = useOS((s) => s.overlay === "control");
  const pull = cc.use((s) => s.pull);
  const [page, setPage] = useState<Page>("favorites");
  const [t, setT] = useState({ air: false, airdrop: false, wifi: true, cell: true, bt: true, hotspot: false, vpn: false, lock: false, silent: false, focus: false, torch: false, mirror: false });
  const [volume, setVolume] = useState(0.6);
  const flip = (k: keyof typeof t) => setT((s) => ({ ...s, [k]: !s[k] }));
  const root = useRef<HTMLDivElement>(null);
  const prog = useRef({ p: 0 });
  const tween = useRef<gsap.core.Tween | null>(null);

  const paint = () => root.current?.style.setProperty("--p", String(prog.current.p));

  // Presence: mounted while open or on its way out.
  useLayoutEffect(() => {
    cc.set({ shown: true });
    paint();
  }, []);

  // Open, close and the hand-held pull all drive one number.
  useEffect(() => {
    tween.current?.kill();
    if (pull !== null) {
      prog.current.p = pull;
      paint();
      return;
    }
    const to = open ? 1 : 0;
    if (reducedMotion()) {
      prog.current.p = to;
      paint();
      if (!open) cc.set({ shown: false });
      return;
    }
    const sp = open ? spring(0.42, 1) : spring(0.32, 1);
    tween.current = gsap.to(prog.current, {
      p: to,
      duration: sp.duration,
      ease: sp.ease,
      onUpdate: paint,
      onComplete: () => {
        if (!open) cc.set({ shown: false });
      },
    });
    return () => void tween.current?.kill();
  }, [open, pull]);

  const close = () => os.set({ overlay: null });

  const grid = (
    <div
      className="grid"
      style={{ gap: GAP, gridTemplateColumns: `repeat(4, ${CELL}px)`, gridAutoRows: `${CELL}px` }}
    >
      {/* Connectivity, 2 × 2: three big toggles and a cluster of four. */}
      <Module className="col-span-2 row-span-2 grid grid-cols-2 place-items-center p-[8px]" style={d(2, 0)}>
        <Round on={t.air} onClick={() => flip("air")} label="Airplane Mode" g={G.airplane} tint="var(--orange)" size={52} fill />
        <Round on={t.airdrop} onClick={() => flip("airdrop")} label="AirDrop" g={G.airdrop} size={52} fill />
        <Round on={t.wifi} onClick={() => flip("wifi")} label="Wi-Fi" g={G.wifi} size={52} fill />
        <span className="grid grid-cols-2 gap-[4px]">
          <Mini on={t.cell} onClick={() => flip("cell")} label="Cellular Data" g={G.cellular} tint="var(--green)" />
          <Mini on={t.bt} onClick={() => flip("bt")} label="Bluetooth" g={G.bluetooth} tint="var(--blue)" />
          <Mini on={t.hotspot} onClick={() => flip("hotspot")} label="Personal Hotspot" g={G.hotspot} tint="var(--green)" />
          <Mini on={t.vpn} onClick={() => flip("vpn")} label="VPN" g={G.vpn} tint="var(--blue)" />
        </span>
      </Module>

      {/* Now Playing, 2 × 2. */}
      <Module className="col-span-2 row-span-2 flex flex-col justify-between p-[14px]" style={d(0, 0)}>
        <div className="flex items-start justify-between">
          <span className="size-[46px] rounded-[11px] bg-white/14" />
          <span className="text-white/80">
            <Icon g={G.airplay} size={22} />
          </span>
        </div>
        <div>
          <p className="truncate text-center text-[14px] leading-[18px] font-semibold text-white">Not Playing</p>
          <div className="mt-[6px] flex items-center justify-around text-white">
            <span className="opacity-40">
              <Icon g={G.back} size={22} />
            </span>
            <Icon g={G.play} size={26} />
            <span className="opacity-40">
              <Icon g={G.fwd} size={22} />
            </span>
          </div>
        </div>
      </Module>

      {/* Orientation Lock and Silent. */}
      <div className="row-3 col-1" style={d(3, 2)} onClick={(e) => e.stopPropagation()}>
        <Round on={t.lock} onClick={() => flip("lock")} label="Orientation Lock" g={G.lock} tint="var(--red)" className="cc-in" />
      </div>
      <div className="row-3 col-2" style={d(2, 2)} onClick={(e) => e.stopPropagation()}>
        <Round on={t.silent} onClick={() => flip("silent")} label="Silent Mode" g={t.silent ? G.bellSlash : G.bell} tint="var(--red)" className="cc-in" />
      </div>

      {/* Brightness and volume: tall sliders. */}
      <div className="col-3 row-[3/span_2]" style={d(1, 2)} onClick={(e) => e.stopPropagation()}>
        <Tall value={brightness} min={0.15} onChange={(v) => os.set({ brightness: v })} label="Brightness" g={G.sun} hue="#f5b400" />
      </div>
      <div className="col-4 row-[3/span_2]" style={d(0, 2)} onClick={(e) => e.stopPropagation()}>
        <Tall value={volume} onChange={setVolume} label="Volume" g={G.speaker} hue="var(--blue)" />
      </div>

      {/* Focus, 2 × 1. */}
      <button
        type="button"
        aria-pressed={t.focus}
        onClick={(e) => {
          e.stopPropagation();
          flip("focus");
        }}
        className={`cc-in col-span-2 row-4 flex items-center gap-[7px] rounded-full pr-[14px] pl-[12px] text-left text-white transition-[scale] duration-300 ease-ios active:scale-[1.04] ${t.focus ? "glass glass-tint" : "glass-clear"}`}
        style={{ "--tint": "var(--indigo)", ...d(2, 3) } as React.CSSProperties}
      >
        {/* Focus's little cluster: the moon, with a bed and a briefcase
            tucked beside it for the other modes. */}
        <span className="relative h-[30px] w-[34px] shrink-0">
          <span className="absolute top-0 left-0">
            <Icon g={G.moon} size={20} />
          </span>
          <span className="absolute right-0 bottom-0 grid size-[15px] place-items-center rounded-full bg-white/22">
            <Icon g={G.bed} size={10} />
          </span>
        </span>
        <span className="min-w-0 flex-1 truncate text-[15px] leading-[19px] font-semibold">{t.focus ? "Do Not Disturb" : "Focus"}</span>
        <span className="shrink-0 opacity-70">
          <Icon g={G.chevrons} size={14} />
        </span>
      </button>

      {/* The small round row: flashlight, timer, calculator, camera. */}
      {(
        [
          { label: "Flashlight", g: G.flashlight, on: t.torch, onClick: () => flip("torch") },
          { label: "Timer", g: G.timer },
          { label: "Calculator", g: G.calculator },
          { label: "Camera", g: G.camera },
        ] as const
      ).map((c, i) => (
        <div key={c.label} style={{ gridColumn: i + 1, gridRow: 5, ...d(3 - i, 4) }} onClick={(e) => e.stopPropagation()}>
          <Round label={c.label} g={c.g} on={"on" in c ? c.on : false} onClick={"onClick" in c ? c.onClick : undefined} className="cc-in" />
        </div>
      ))}

      {/* Screen Mirroring, Code Scanner, and the one that changes the
          site: Dark Mode. */}
      <div style={{ gridColumn: 1, gridRow: 6, ...d(3, 5) }} onClick={(e) => e.stopPropagation()}>
        <Round on={t.mirror} onClick={() => flip("mirror")} label="Screen Mirroring" g={G.mirroring} className="cc-in" />
      </div>
      <div style={{ gridColumn: 2, gridRow: 6, ...d(2, 5) }} onClick={(e) => e.stopPropagation()}>
        <Round label="Code Scanner" g={G.scanner} className="cc-in" />
      </div>
      <div style={{ gridColumn: 3, gridRow: 6, ...d(1, 5) }} onClick={(e) => e.stopPropagation()}>
        <Round on={dark} onClick={() => setAppearance(dark ? "light" : "dark")} label="Dark Mode" g={G.appearance} tint="#1c1c1e" className="cc-in" />
      </div>
    </div>
  );

  const music = (
    <Module className="flex flex-col p-[22px]" style={{ width: span(4), height: span(4) }}>
      <div className="flex items-center gap-[14px]">
        <span className="size-[72px] shrink-0 rounded-[16px] bg-white/14" />
        <span className="min-w-0 flex-1 text-white">
          <span className="block truncate text-[17px] leading-[22px] font-semibold">Not Playing</span>
          <span className="block truncate text-[14px] leading-[19px] text-white/60">ntz duo</span>
        </span>
        <span className="text-white/80">
          <Icon g={G.airplay} size={24} />
        </span>
      </div>
      <div className="mt-auto">
        <div className="h-[6px] rounded-full bg-white/20" />
        <div className="mt-[6px] flex justify-between text-[11px] font-semibold text-white/50 tabular-nums">
          <span>0:00</span>
          <span>-0:00</span>
        </div>
        <div className="mt-[18px] flex items-center justify-around text-white">
          <span className="opacity-40">
            <Icon g={G.back} size={30} />
          </span>
          <Icon g={G.play} size={36} />
          <span className="opacity-40">
            <Icon g={G.fwd} size={30} />
          </span>
        </div>
        <div className="mt-[22px] flex items-center gap-[10px] text-white/70">
          <Icon g={G.speaker} size={16} />
          <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-white" style={{ width: `${volume * 100}%` }} />
          </div>
        </div>
      </div>
    </Module>
  );

  const connectivity = (
    // Sized by its content: three rows of labelled toggles.
    <Module className="grid grid-cols-2 place-items-center gap-y-[16px] px-[18px] py-[22px]" style={{ width: span(4) }}>
      {(
        [
          ["air", "Airplane Mode", G.airplane, "var(--orange)"],
          ["airdrop", "AirDrop", G.airdrop, "var(--blue)"],
          ["wifi", "Wi-Fi", G.wifi, "var(--blue)"],
          ["cell", "Cellular", G.cellular, "var(--green)"],
          ["bt", "Bluetooth", G.bluetooth, "var(--blue)"],
          ["hotspot", "Hotspot", G.hotspot, "var(--green)"],
        ] as const
      ).map(([k, label, g, tint]) => (
        <span key={k} className="flex flex-col items-center gap-[6px]">
          <Round on={t[k]} onClick={() => flip(k)} label={label} g={g} tint={tint} fill />
          <span className="max-w-[120px] truncate text-[12px] leading-[15px] font-semibold text-white">{label}</span>
          <span className="-mt-[5px] text-[11px] leading-[14px] text-white/55">{t[k] ? (k === "wifi" ? "ntz-home" : "On") : "Off"}</span>
        </span>
      ))}
    </Module>
  );

  const pages: { id: Page; label: string; g: React.ReactNode }[] = [
    { id: "favorites", label: "Favorites", g: G.heart },
    { id: "music", label: "Now Playing", g: G.note },
    { id: "connectivity", label: "Connectivity", g: G.antenna },
  ];

  return (
    <div
      ref={root}
      className="absolute inset-0 z-[44] text-white"
      onClick={close}
      style={{ pointerEvents: open ? undefined : "none" }}
    >
      {/* The screen behind blurs and dims as it opens. The layer fades on
          its own; nothing glass sits inside it. */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[26px] backdrop-saturate-[1.5] backdrop-brightness-[0.82]" style={{ opacity: "clamp(0, calc(var(--p) * 1.7), 1)" }} />

      {/* Edit and power, over the grid's top corners. */}
      <div
        className={`absolute flex justify-between ${portrait ? "top-[64px] left-1/2 -translate-x-1/2" : "top-[22px] right-[108px]"}`}
        style={{ width: span(4) }}
        onClick={(e) => e.stopPropagation()}
      >
        <Round label="Edit Controls" g={G.plus} size={30} glyph={16} className="cc-in [--d:0.3]" />
        <Round label="Power" g={G.power} size={30} glyph={16} className="cc-in [--d:0.1]" />
      </div>

      {/* The modules materialise one after another (.cc-in, from --p and
          each one's --d): each fades and focuses on its own, so no glass
          sits under a fading parent. */}
      <div className={`absolute ${portrait ? "top-[110px] left-1/2 -translate-x-1/2" : "top-[70px] right-[108px]"}`}>
        <div key={page} className="animate-[cc-page_0.42s_var(--ease-ios)_backwards]">
          {page === "favorites" ? grid : page === "music" ? music : connectivity}
        </div>
      </div>

      {/* The pages, bottom-aligned in the rail like a tab bar: the
          current one on a glass circle, then an empty group to add. */}
      {portrait ? null : (
        <nav
          aria-label="Control Center pages"
          className="absolute right-0 bottom-[24px] flex w-[84px] flex-col items-center gap-[8px]"
          onClick={(e) => e.stopPropagation()}
        >
          {pages.map((pg, i) => (
            <button
              key={pg.id}
              type="button"
              aria-label={pg.label}
              aria-current={page === pg.id || undefined}
              onClick={() => setPage(pg.id)}
              // 48 pt, like the status circle above: same line, same edges.
              className={`cc-in grid size-[48px] place-items-center rounded-full text-white transition-[color,scale] duration-300 ease-ios active:scale-110 ${page === pg.id ? "glass-clear" : "text-white/60 hover:text-white"}`}
              style={{ "--d": 0.12 + i * 0.06 } as React.CSSProperties}
            >
              <Icon g={pg.g} size={20} />
            </button>
          ))}
          <span aria-hidden="true" className="cc-in grid size-[48px] place-items-center [--d:0.32]">
            <span className="size-[9px] rounded-full border-[1.5px] border-white/60" />
          </span>
        </nav>
      )}
    </div>
  );
}
