"use client";

import { useEffect, useRef, useState } from "react";
import { experience, profile, projects, skills } from "@/content/site";
import { launch } from "./launch";

// Home Screen widgets. Each is a self-contained card on the wallpaper;
// tapping one opens the app it belongs to, as on iOS.

const card = "relative overflow-hidden rounded-[30px] text-left";
const shadow = { boxShadow: "0 6px 22px rgba(0,0,0,0.12)" };

/** Ticks once a second (or minute), aligned to the clock. */
export function useNow(step: "s" | "m" = "m") {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const ms = step === "s" ? 1000 : 60000;
    let id = 0;
    const loop = () => {
      setNow(new Date());
      id = window.setTimeout(loop, ms - (Date.now() % ms) + 5);
    };
    // First tick right away (the server render shows a fixed time).
    id = window.setTimeout(loop, 0);
    return () => window.clearTimeout(id);
  }, [step]);
  return now;
}

const addis = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Addis_Ababa", ...opts }).format(d);

/** The big card: like Photos' "On This Day", with him in it. Opens About. */
export function PortraitWidget({ w, h }: { w: number; h: number }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => launch("about", ref.current)}
      className={`${card} group`}
      style={{ width: w, height: h, ...shadow }}
      aria-label="About Natnael"
    >
      <span
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 30% 10%, #f0c9a6 0%, #c97b5b 38%, #5b3a4a 78%, #2d2233 100%)" }}
      />
      <span
        className="absolute inset-0 opacity-50 mix-blend-soft-light"
        style={{ background: "repeating-linear-gradient(115deg, rgba(255,255,255,0.25) 0 2px, rgba(255,255,255,0) 2px 9px)" }}
      />
      <img
        src="/portrait/source.webp"
        alt=""
        draggable={false}
        className="absolute bottom-0 left-1/2 w-[112%] max-w-none -translate-x-1/2 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        style={{ transformOrigin: "50% 100%" }}
      />
      <span className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
      <span className="absolute bottom-[22px] left-[22px] right-[70px] text-white">
        <span className="block text-[21px] leading-[1.1] font-bold tracking-[-0.01em]">{profile.name}</span>
        <span className="mt-[3px] block text-[11px] font-semibold tracking-[0.04em] uppercase opacity-80">
          {profile.title} · Addis Ababa
        </span>
      </span>
      <span className="glass-clear absolute right-[18px] bottom-[20px] grid size-[36px] place-items-center rounded-full">
        <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
          <path d="M1.5 1.6v10.8a.8.8 0 0 0 1.2.7l8.6-5.4a.8.8 0 0 0 0-1.4L2.7.9a.8.8 0 0 0-1.2.7" fill="#fff" />
        </svg>
      </span>
    </button>
  );
}

const WMO: Record<number, [string, string]> = {
  0: ["Clear", "sun"],
  1: ["Mostly Clear", "sun"],
  2: ["Partly Cloudy", "partly"],
  3: ["Cloudy", "cloud"],
  45: ["Fog", "cloud"],
  48: ["Fog", "cloud"],
  51: ["Drizzle", "rain"],
  53: ["Drizzle", "rain"],
  55: ["Drizzle", "rain"],
  61: ["Rain", "rain"],
  63: ["Rain", "rain"],
  65: ["Heavy Rain", "rain"],
  80: ["Showers", "rain"],
  81: ["Showers", "rain"],
  82: ["Showers", "rain"],
  95: ["Thunderstorms", "rain"],
};

type Weather = { temp: number; code: number; hi: number; lo: number };
let weatherCache: Promise<Weather | null> | null = null;
function fetchWeather() {
  // Open-Meteo needs no key and receives nothing but the city's coordinates.
  weatherCache ??= fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=9.03&longitude=38.74&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Africa%2FAddis_Ababa&forecast_days=1",
  )
    .then((r) => (r.ok ? r.json() : null))
    .then((j) =>
      j
        ? {
            temp: Math.round(j.current.temperature_2m),
            code: j.current.weather_code,
            hi: Math.round(j.daily.temperature_2m_max[0]),
            lo: Math.round(j.daily.temperature_2m_min[0]),
          }
        : null,
    )
    .catch(() => null);
  return weatherCache;
}

function WeatherGlyph({ kind }: { kind: string }) {
  if (kind === "sun")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="5" fill="#ffd60a" />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="11" y="1.5" width="2" height="4" rx="1" fill="#ffd60a" transform={`rotate(${i * 45} 12 12)`} />
        ))}
      </svg>
    );
  if (kind === "rain")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 15a5 5 0 1 1 1.6-9.7A6 6 0 0 1 19.5 9 3.5 3.5 0 0 1 18 15.7H7" fill="#fff" />
        <path d="m9 18-1 3m5-3-1 3m5-3-1 3" stroke="#5ac8fa" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      {kind === "partly" ? <circle cx="8.5" cy="8" r="4.5" fill="#ffd60a" /> : null}
      <path d="M8 19a5 5 0 1 1 1.6-9.7A6 6 0 0 1 20.5 13 3.5 3.5 0 0 1 19 19.7H8" fill="#fff" />
    </svg>
  );
}

export function WeatherWidget({ size }: { size: number }) {
  const [w, setW] = useState<Weather | null>(null);
  useEffect(() => {
    let on = true;
    fetchWeather().then((v) => on && setW(v));
    return () => {
      on = false;
    };
  }, []);
  const v = w ?? { temp: 21, code: 2, hi: 24, lo: 11 };
  const [label, kind] = WMO[v.code] ?? ["Partly Cloudy", "partly"];
  return (
    <div
      className={`${card} p-[15px] text-white`}
      style={{ width: size, height: size, background: "linear-gradient(180deg, #3a7bd5 0%, #6aa8e8 100%)", ...shadow }}
    >
      <p className="text-[14px] leading-[1.2] font-semibold">Addis Ababa</p>
      <p className="mt-[1px] text-[44px] leading-[1] font-light tracking-[-0.02em]">{v.temp}°</p>
      <div className="absolute bottom-[14px] left-[15px]">
        <WeatherGlyph kind={kind} />
        <p className="mt-[3px] text-[12px] leading-[1.2] font-semibold">{label}</p>
        <p className="text-[12px] leading-[1.2] font-semibold">
          H:{v.hi}° L:{v.lo}°
        </p>
      </div>
    </div>
  );
}

/** Find My style: where he is, on a quiet map. */
export function MapWidget({ size }: { size: number }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => launch("contact", ref.current)}
      className={card}
      style={{ width: size, height: size, ...shadow }}
      aria-label="Location: Addis Ababa. Opens Contact"
    >
      <svg className="absolute inset-0" width={size} height={size} viewBox="0 0 160 160" aria-hidden="true">
        <rect width="160" height="160" fill="#eaf2e3" />
        <path d="M-10 40 C40 30 60 60 110 50 S170 30 180 40 V-10 H-10z" fill="#cfe6c0" />
        <path d="M100 160 C110 120 140 110 170 112 V170 H100z" fill="#a9d4f0" />
        <path d="M-5 112 L170 70" stroke="#fff" strokeWidth="7" />
        <path d="M-5 112 L170 70" stroke="#f7d774" strokeWidth="3.4" />
        <path d="M55 -5 L80 170" stroke="#fff" strokeWidth="5" />
        <path d="M-5 70 C30 80 60 95 90 128 S130 160 140 170" stroke="#fff" strokeWidth="4" fill="none" />
        <path d="M120 -5 L105 80" stroke="#fff" strokeWidth="3.4" />
        <text x="12" y="150" fontSize="8.5" fontWeight="700" fill="#2d6a4f" letterSpacing=".04em" opacity=".85">
          BOLE
        </text>
        <text x="96" y="30" fontSize="7.5" fontWeight="700" fill="#557" opacity=".7" letterSpacing=".04em">
          PIASSA
        </text>
      </svg>
      <span className="absolute top-[42px] left-1/2 -translate-x-1/2">
        <span className="block size-[46px] overflow-hidden rounded-full border-[3px] border-white bg-[#c9d6ff] shadow-[0_3px_10px_rgba(0,0,0,0.25)]">
          <img src="/portrait/source.webp" alt="" className="mt-[3px] w-full" draggable={false} />
        </span>
        <span className="absolute -bottom-[5px] left-1/2 size-[8px] -translate-x-1/2 rotate-45 bg-white" />
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-white/80 px-[13px] pt-[7px] pb-[10px] text-left backdrop-blur-md">
        <span className="block text-[10px] font-semibold tracking-[0.02em] text-black/50 uppercase">Now</span>
        <span className="block text-[13px] leading-[1.15] font-semibold text-black">Addis Ababa</span>
        <span className="block text-[11px] leading-[1.2] text-black/55">{profile.utcOffset} · Ethiopia</span>
      </span>
    </button>
  );
}

export function ClockWidget({ size }: { size: number }) {
  const now = useNow("s");
  const d = now ?? new Date(2026, 0, 1, 10, 9, 30);
  const [h, m, s] = addis(d, { hour: "numeric", minute: "numeric", second: "numeric", hour12: false })
    .split(":")
    .map(Number) as [number, number, number];
  const hourA = ((h % 12) + m / 60) * 30, minA = (m + s / 60) * 6, secA = s * 6;
  return (
    <div className={`${card} bg-white`} style={{ width: size, height: size, borderRadius: size / 2, ...shadow }} aria-label="Clock, Addis Ababa">
      <svg viewBox="-50 -50 100 100" width={size} height={size} aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <text key={i} x={Math.sin((i * Math.PI) / 6) * 36} y={-Math.cos((i * Math.PI) / 6) * 36 + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000">
            {i === 0 ? 12 : i}
          </text>
        ))}
        <text x="0" y="-15" textAnchor="middle" fontSize="7" fontWeight="600" fill="#8e8e93">ADD</text>
        <line x1="0" y1="0" x2="0" y2="-22" stroke="#000" strokeWidth="3.2" strokeLinecap="round" transform={`rotate(${hourA})`} />
        <line x1="0" y1="0" x2="0" y2="-34" stroke="#000" strokeWidth="2.2" strokeLinecap="round" transform={`rotate(${minA})`} />
        <g transform={`rotate(${secA})`}>
          <line x1="0" y1="8" x2="0" y2="-38" stroke="#ff9500" strokeWidth="1" />
        </g>
        <circle r="2.6" fill="#ff9500" />
        <circle r="1" fill="#fff" />
      </svg>
    </div>
  );
}

export function CalendarWidget({ size }: { size: number }) {
  const now = useNow("m");
  const d = now ?? new Date(2026, 10, 3);
  return (
    <div className={`${card} bg-white p-[15px] text-black`} style={{ width: size, height: size, ...shadow }}>
      <p className="text-[12px] font-semibold tracking-[0.02em] text-[#ff3b30] uppercase">
        {d.toLocaleDateString("en-US", { weekday: "long" })}
      </p>
      <p className="text-[46px] leading-[1] font-light tracking-[-0.02em]">{d.getDate()}</p>
      <div className="mt-[10px] rounded-[8px] border-l-[3px] border-[#34c759] bg-[#34c759]/12 px-[7px] py-[4px]">
        <p className="text-[11.5px] leading-[1.2] font-semibold">Open to work</p>
        <p className="text-[10.5px] leading-[1.2] text-black/55">Full-time · remote</p>
      </div>
    </div>
  );
}

const month = (ym: string) =>
  new Date(`${ym}-01T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });

/** Like Calendar's Up Next, but for a career. */
export function ExperienceWidget({ w, h }: { w: number; h: number }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => launch("about", ref.current)}
      className={`${card} bg-white p-[20px] text-black`}
      style={{ width: w, height: h, ...shadow }}
      aria-label="Experience. Opens About"
    >
      <p className="text-[12px] font-semibold tracking-[0.02em] text-[#ff3b30] uppercase">Experience</p>
      <p className="mt-[2px] text-[24px] leading-[1.1] font-bold tracking-[-0.01em]">Where I&apos;ve worked</p>
      <ol className="mt-[16px] flex flex-col gap-[14px]">
        {experience.map((r) => (
          <li key={r.company} className="flex gap-[10px]">
            <span className="mt-[2px] w-[4px] shrink-0 rounded-full" style={{ background: r.end ? "#c7c7cc" : "#34c759" }} />
            <span className="min-w-0">
              <span className="block text-[14px] leading-[1.2] font-semibold">{r.company}</span>
              <span className="block text-[12px] leading-[1.3] text-black/55">
                {r.title} · {month(r.start)} – {r.end ? month(r.end) : "Now"}
              </span>
              <span className="mt-[3px] line-clamp-2 block text-[12px] leading-[1.3] text-black/75">{r.summary}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="absolute bottom-[18px] left-[20px] text-[12px] text-black/45">
        {profile.education.degree}, {profile.education.school}
      </p>
    </button>
  );
}

export function StackWidget({ w, h }: { w: number; h: number }) {
  const items = skills.flatMap((g) => g.items).slice(0, 18);
  return (
    <div className={`${card} p-[16px] text-white`} style={{ width: w, height: h, background: "linear-gradient(160deg, #2c2c2e, #111113)", ...shadow }}>
      <p className="text-[12px] font-semibold tracking-[0.02em] text-[#ff9f0a] uppercase">Stack</p>
      <div className="mt-[10px] flex flex-wrap gap-[6px]">
        {items.map((s) => (
          <span key={s} className="rounded-full bg-white/12 px-[9px] py-[4px] text-[11.5px] leading-none font-medium">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/** A quiet count of the work on this phone. */
export function WorkWidget({ w, h }: { w: number; h: number }) {
  const shown = projects.filter((p) => !p.confidential).length;
  return (
    <div className={`${card} p-[16px] text-black`} style={{ width: w, height: h, background: "#fff", ...shadow }}>
      <p className="text-[12px] font-semibold tracking-[0.02em] text-[#0a84ff] uppercase">Work</p>
      <p className="mt-[2px] text-[36px] leading-[1] font-light">{projects.length}</p>
      <p className="mt-[4px] text-[12px] leading-[1.3] text-black/55">
        projects · {shown} with screens, {projects.length - shown} under NDA
      </p>
    </div>
  );
}

export { addis };
