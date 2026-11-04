"use client";

import { stage } from "@/components/stage/stage-state";
import { useOS } from "@/lib/os";
import { OUTER } from "@/components/device/geometry";
import { useNow } from "@/components/os/widgets";

/** The outer camera's centre (from the UI kit): the rail's controls line up under it. */
const CAM_X = 418.2;

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
    </div>
  );
}

function LockScreen() {
  const now = useNow("m");
  const dark = useOS((s) => s.dark);
  const d = now ?? new Date(2026, 10, 3, 9, 41);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?[AP]M$/, "");
  const date = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="absolute inset-0">
      <img src={`/wallpapers/outer-${dark ? "dark" : "light"}.webp`} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-black/10 to-transparent" />

      {/* Rail: status on the trailing edge, centred under the camera. */}
      <div className="absolute top-[76px] flex -translate-x-1/2 flex-col items-center gap-[7px]" style={{ left: CAM_X }}>
        <svg width="17" height="13" viewBox="0 0 16 12" aria-hidden="true">
          <path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.1-1.1A10 10 0 0 0 8 .8 10 10 0 0 0 .9 3.7L2 4.8a8.4 8.4 0 0 1 6-2.4M8 5.6c1.4 0 2.7.5 3.7 1.4l1.1-1.1A7 7 0 0 0 8 4a7 7 0 0 0-4.8 1.9L4.3 7c1-.9 2.3-1.4 3.7-1.4M8 8.8c.6 0 1.1.2 1.5.6L8 11 6.5 9.4c.4-.4.9-.6 1.5-.6" fill="#fff" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden="true">
          <rect x=".5" y=".5" width="21" height="11" rx="3.4" fill="none" stroke="#fff" strokeOpacity=".5" />
          <rect x="2" y="2" width="15" height="8" rx="2" fill="#fff" />
        </svg>
      </div>

      <div className="absolute top-[64px] left-[30px] right-[90px]">
        <p className="text-[20px] leading-[1.2] font-semibold tracking-[-0.01em] opacity-90">{date}</p>
        <p
          className="font-display text-[132px] leading-[0.9] font-bold tracking-[-0.03em] text-[rgba(255,255,255,0.86)] mix-blend-plus-lighter text-shadow-[0_1px_0_rgba(255,255,255,0.5),0_10px_30px_rgba(0,0,0,0.12)]"
        >
          {time}
        </p>
      </div>

      {/* One notification: the invitation. */}
      <div className="glass-clear absolute right-[96px] bottom-[34px] left-[18px] rounded-[26px] p-[14px]">
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
      <div className="absolute bottom-[28px] flex -translate-x-1/2 flex-col items-center gap-[14px]" style={{ left: CAM_X }}>
        {["M9 2h6v4l-2 4v12h-2V10L9 6z", "M4 8h3l2-3h6l2 3h3v11H4zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7"].map((d) => (
          <span key={d} className="glass-clear grid size-[50px] place-items-center rounded-full">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d={d} fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}

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
                  className={`grid size-[26px] place-items-center rounded-full ${n === today ? "bg-[#ff453a]" : ""} ${
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
