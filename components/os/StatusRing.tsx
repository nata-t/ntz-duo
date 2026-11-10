"use client";

import { useEffect, useState } from "react";

// iPhone Duo's status indicator. Battery, Wi-Fi and cellular share one
// circle under the time: the ring is the battery gauge, a horseshoe open
// at the bottom; Wi-Fi sits inside it; the signal is four dots on the
// ring's own circle, in its gap (Apple: "dots on iPhone Duo"). Opened
// (Control Center), it unfolds into a column: the gauge with the level,
// Wi-Fi with the network, bars with "5G".

/** The gauge's sweep: 240°, its gap centred on six o'clock. */
const SWEEP = 240;
/** The signal dots, in degrees from six o'clock along the ring. */
const DOTS = [-32, -10, 10, 32];

function arc(r: number, from: number, to: number) {
  // Angles in degrees, clockwise from 12 o'clock.
  const p = (a: number) => {
    const t = ((a - 90) * Math.PI) / 180;
    return [Math.cos(t) * r, Math.sin(t) * r] as const;
  };
  const [x0, y0] = p(from), [x1, y1] = p(to);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/** The device's battery where the browser says (Chromium), else full. */
export function useBattery() {
  const [level, setLevel] = useState(1);
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; addEventListener: (t: string, f: () => void) => void; removeEventListener: (t: string, f: () => void) => void }> };
    if (!nav.getBattery) return;
    let off = () => {};
    let gone = false;
    nav.getBattery().then((b) => {
      if (gone) return;
      const read = () => setLevel(b.level);
      read();
      b.addEventListener("levelchange", read);
      off = () => b.removeEventListener("levelchange", read);
    }, () => {});
    return () => {
      gone = true;
      off();
    };
  }, []);
  return level;
}

export const WifiGlyph = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={(size * 12) / 16} viewBox="0 0 16 12" aria-hidden="true">
    <path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.1-1.1A10 10 0 0 0 8 .8 10 10 0 0 0 .9 3.7L2 4.8a8.4 8.4 0 0 1 6-2.4" fill="currentColor" />
    <path d="M8 5.6c1.4 0 2.7.5 3.7 1.4l1.1-1.1A7 7 0 0 0 8 4a7 7 0 0 0-4.8 1.9L4.3 7c1-.9 2.3-1.4 3.7-1.4" fill="currentColor" />
    <path d="M8 8.8c.6 0 1.1.2 1.5.6L8 11 6.5 9.4c.4-.4.9-.6 1.5-.6" fill="currentColor" />
  </svg>
);

export const BarsGlyph = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={(size * 12) / 18} viewBox="0 0 18 12" aria-hidden="true">
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={i * 4.8} y={9 - i * 2.8} width="3.2" height={3 + i * 2.8} rx=".9" fill="currentColor" />
    ))}
  </svg>
);

/** The ring: the gauge, Wi-Fi inside, the signal as dots in the gap. */
export function StatusRing({ size = 48, level, bars = 4 }: { size?: number; level: number; bars?: number }) {
  const r = 13.6;
  const start = 180 + (360 - SWEEP) / 2;
  // A ~3 pt stroke at any size (the drawing is in a 32-unit box).
  const sw = (3 * 32) / size;
  return (
    <span className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0" width={size} height={size} viewBox="-16 -16 32 32" aria-hidden="true">
        <path d={arc(r, start, start + SWEEP)} fill="none" stroke="currentColor" strokeOpacity=".32" strokeWidth={sw} strokeLinecap="round" />
        <path d={arc(r, start, start + SWEEP * Math.max(0.02, level))} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
        {DOTS.map((a, i) => {
          // On the ring's circle, measured from six o'clock (left to right).
          const t = ((90 - a) * Math.PI) / 180;
          return <circle key={a} cx={Math.cos(t) * r} cy={Math.sin(t) * r} r={sw * 0.68} fill="currentColor" fillOpacity={i < bars ? 1 : 0.32} />;
        })}
      </svg>
      <span className="-mt-[1px]">
        <WifiGlyph size={Math.round(size * 0.48)} />
      </span>
    </span>
  );
}

/** The opened column's battery gauge: a bigger ring around the battery
 *  glyph, the percentage under it. */
export function BatteryGauge({ level, size = 48 }: { level: number; size?: number }) {
  const r = 17;
  const start = 180 + (360 - SWEEP) / 2;
  const sw = (3 * 40) / size;
  return (
    <span className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0" width={size} height={size} viewBox="-20 -20 40 40" aria-hidden="true">
        <path d={arc(r, start, start + SWEEP)} fill="none" stroke="currentColor" strokeOpacity=".3" strokeWidth={sw} strokeLinecap="round" />
        <path d={arc(r, start, start + SWEEP * Math.max(0.02, level))} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
      </svg>
      <svg className="-mt-[5px]" width="22" height="12" viewBox="0 0 17 9" aria-hidden="true">
        <rect x=".6" y=".6" width="13.8" height="7.8" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <rect x="2" y="2" width={Math.max(1, 11 * level)} height="5" rx="1.2" fill="currentColor" />
        <path d="M15.6 3v3c.6-.2 1-.8 1-1.5s-.4-1.3-1-1.5" fill="currentColor" />
      </svg>
      {/* The level sits in the gauge's gap, without a percent sign. */}
      <span className="absolute -bottom-[2px] text-[12px] leading-[14px] font-semibold tabular-nums">{Math.round(level * 100)}</span>
    </span>
  );
}
