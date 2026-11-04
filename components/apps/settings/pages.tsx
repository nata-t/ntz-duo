"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { contact, profile, projects } from "@/content/site";
import { openApp, os, setAppearance, useOS } from "@/lib/os";
import { Toggle, useMedia, useMinute } from "./ios";
import { Avatar, Group, Row } from "./list";
import { SettingsIcon, type IconName } from "./icons";

// Every pane Settings can show. A few are real (they change the phone or
// report the browser's own preferences), the rest are honest scenery.

export type Local = {
  airplane: boolean;
  wifi: boolean;
  bluetooth: boolean;
  set: (patch: Partial<Omit<Local, "set">>) => void;
};

export type Ctx = { go: (id: string) => void; mirror: boolean; local: Local };
export const SettingsCtx = createContext<Ctx>({
  go: () => {},
  mirror: false,
  local: { airplane: false, wifi: true, bluetooth: true, set: () => {} },
});
const useCtx = () => useContext(SettingsCtx);

export type PageDef = {
  title: string;
  icon?: IconName;
  /** The page it sits under, for search results and Back. */
  parent?: string;
  keywords?: string;
  Body: () => ReactNode;
};

/** A switch that only remembers itself: scenery that still feels alive. */
function LocalToggle({ on = false, label }: { on?: boolean; label: string }) {
  const [v, setV] = useState(on);
  return <Toggle on={v} label={label} onChange={setV} />;
}

/* ------------------------------------------------------------- Profile */

function ProfilePage() {
  const { mirror } = useCtx();
  const launch = (id: string) => !mirror && openApp(id, null);
  return (
    <>
      <div className="mb-[26px] flex flex-col items-center pt-[6px] text-center">
        <Avatar size={92} />
        <p className="mt-[12px] font-display text-[26px] leading-[30px] font-bold tracking-[-0.01em]">{profile.name}</p>
        <p className="mt-[2px] text-[15px] leading-[20px] text-label-2">{contact.email.label}</p>
      </div>
      <Group>
        <Row title="Title" value={profile.title} />
        <Row title="Location" value={profile.location} />
        <Row title="Time Zone" value={`Addis Ababa, ${profile.utcOffset}`} />
      </Group>
      <Group header="Availability">
        <Row title={<span className="whitespace-normal">{profile.availability}</span>} />
      </Group>
      <Group header="Education">
        <Row title={profile.education.degree} sub={`${profile.education.school}, ${profile.education.years}`} value={profile.education.note} />
      </Group>
      <Group>
        <Row title="About Natnael" action onClick={() => launch("about")} />
        <Row title="Contact" action onClick={() => launch("contact")} />
        <Row title="Résumé" action onClick={() => launch("resume")} />
      </Group>
    </>
  );
}

/* --------------------------------------------------------- Connectivity */

function WifiPage() {
  const { local } = useCtx();
  const on = local.wifi && !local.airplane;
  return (
    <>
      <Group footer={local.airplane ? "Airplane Mode is on." : "ntz duo joins this network on its own. It only exists inside the phone."}>
        <Row icon="wifi" title="Wi-Fi" accessory={<Toggle on={on} label="Wi-Fi" onChange={(v) => local.set({ wifi: v, airplane: false })} />} />
        {on ? (
          <Row
            title={
              <span className="flex items-center gap-[10px]">
                <svg width="16" height="13" viewBox="0 0 16 13" aria-hidden="true" className="-ml-[2px] text-blue">
                  <path d="m1.5 7 4.2 4.2L14.5 1.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                ntz-home
              </span>
            }
            accessory={<WifiMeta />}
          />
        ) : null}
      </Group>
    </>
  );
}

function WifiMeta() {
  return (
    <span className="flex items-center gap-[8px] text-label">
      <svg width="11" height="14" viewBox="0 0 11 14" aria-hidden="true">
        <rect x=".8" y="6" width="9.4" height="7.2" rx="1.6" fill="currentColor" />
        <path d="M2.8 6V4.2a2.7 2.7 0 0 1 5.4 0V6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
        <path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.1-1.1A10 10 0 0 0 8 .8 10 10 0 0 0 .9 3.7L2 4.8a8.4 8.4 0 0 1 6-2.4" fill="currentColor" />
        <path d="M8 5.6c1.4 0 2.7.5 3.7 1.4l1.1-1.1A7 7 0 0 0 8 4a7 7 0 0 0-4.8 1.9L4.3 7c1-.9 2.3-1.4 3.7-1.4" fill="currentColor" />
        <path d="M8 8.8c.6 0 1.1.2 1.5.6L8 11 6.5 9.4c.4-.4.9-.6 1.5-.6" fill="currentColor" />
      </svg>
      <span className="grid size-[22px] place-items-center rounded-full border-[1.5px] border-blue text-[13px] leading-none font-semibold text-blue">i</span>
    </span>
  );
}

function BluetoothPage() {
  const { local } = useCtx();
  const on = local.bluetooth && !local.airplane;
  return (
    <Group footer={on ? "Now discoverable as “ntz duo”." : "Turn on Bluetooth to connect accessories."}>
      <Row icon="bluetooth" title="Bluetooth" accessory={<Toggle on={on} label="Bluetooth" onChange={(v) => local.set({ bluetooth: v, airplane: false })} />} />
    </Group>
  );
}

function BatteryPage() {
  return (
    <>
      <Group footer="ntz duo draws on whatever your own device has to spare.">
        <Row title="Battery Percentage" accessory={<LocalToggle label="Battery Percentage" />} />
        <Row title="Low Power Mode" accessory={<LocalToggle label="Low Power Mode" />} />
      </Group>
    </>
  );
}

/* ------------------------------------------------------------- General */

function GeneralPage() {
  const { go } = useCtx();
  return (
    <>
      <Hero icon="general" title="General" text="Manage your overall setup and preferences for iPhone Duo, such as software updates, date and time, and more." />
      <Group>
        <Row title="About" chevron onClick={() => go("about")} />
        <Row title="Software Update" chevron onClick={() => go("update")} />
      </Group>
      <Group>
        <Row title="Date & Time" chevron onClick={() => go("datetime")} />
        <Row title="Language & Region" value="English" />
      </Group>
    </>
  );
}

function AboutPage() {
  const { mirror } = useCtx();
  const nda = projects.filter((p) => p.confidential).length;
  return (
    <>
      <Group>
        <Row title="Name" value="ntz duo" />
        <Row title="iOS Version" value="27.1" />
        <Row title="Model" value="iPhone Duo (simulated)" />
      </Group>
      <Group>
        <Row title="Owner" value={profile.name} />
        <Row title="Designed in" value="Addis Ababa" />
        <Row title="Projects" value={projects.length} />
        <Row title="Under NDA" value={nda} />
      </Group>
      <Group header="Built with">
        <Row title="Framework" value="Next.js 16" />
        <Row title="Interface" value="React 19" />
        <Row title="Styling" value="Tailwind CSS 4" />
        <Row title="Animation" value="GSAP" />
        <Row title="Smooth Scrolling" value="Lenis" />
      </Group>
      <Group footer="ntz duo is a portfolio told through a phone. Nothing here is a real device.">
        <Row title="Résumé" value="PDF" chevron onClick={() => !mirror && openApp("resume", null)} />
      </Group>
    </>
  );
}

function UpdatePage() {
  return (
    <div className="flex flex-col items-center pt-[60px] text-center">
      <SettingsIcon name="general" size={64} />
      <p className="mt-[16px] text-[20px] leading-[25px] font-semibold">iOS 27.1</p>
      <p className="mt-[4px] text-[15px] leading-[20px] text-label-2">iOS is up to date</p>
    </div>
  );
}

function DateTimePage() {
  const { mirror } = useCtx();
  const t = useMinute(!mirror);
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    t === null ? "—" : new Intl.DateTimeFormat("en-GB", { timeZone: profile.timezone, ...o }).format(new Date(t));
  return (
    <>
      <Group>
        <Row title="24-Hour Time" accessory={<LocalToggle on label="24-Hour Time" />} />
      </Group>
      <Group footer="ntz duo keeps Addis Ababa time, wherever you are.">
        <Row title="Set Automatically" accessory={<LocalToggle on label="Set Automatically" />} />
        <Row title="Time Zone" value="Addis Ababa" />
        <Row title="Now" value={`${fmt({ weekday: "short", day: "numeric", month: "short" })}, ${fmt({ hour: "2-digit", minute: "2-digit", hour12: false })}`} />
      </Group>
    </>
  );
}

/* ------------------------------------------------------- Accessibility */

function AccessibilityPage() {
  const { go } = useCtx();
  return (
    <>
      <Hero icon="accessibility" title="Accessibility" text="Personalize iPhone Duo in ways that work best for you." />
      <Group header="Vision">
        <Row title="VoiceOver" value="Off" />
        <Row title="Zoom" value="Off" />
        <Row title="Display & Text Size" chevron onClick={() => go("textsize")} />
        <Row title="Motion" chevron onClick={() => go("motion")} />
      </Group>
    </>
  );
}

function MotionPage() {
  const reduce = useMedia("(prefers-reduced-motion: reduce)");
  return (
    <Group footer="ntz duo follows your device’s Reduce Motion setting, so this switch only shows it. To change it, use your device’s own accessibility settings.">
      <Row title="Reduce Motion" accessory={<Toggle on={reduce} label="Reduce Motion (follows your device)" disabled />} />
    </Group>
  );
}

function TextSizePage() {
  const reduce = useMedia("(prefers-reduced-transparency: reduce)");
  return (
    <Group footer="Follows your device’s setting. With Reduce Transparency on, Liquid Glass turns solid.">
      <Row title="Reduce Transparency" accessory={<Toggle on={reduce} label="Reduce Transparency (follows your device)" disabled />} />
    </Group>
  );
}

/* --------------------------------------------------- Display & Brightness */

function PhoneThumb({ dark }: { dark: boolean }) {
  return (
    <span className="relative block h-[118px] w-[58px] overflow-hidden rounded-[11px] bg-black p-[2.5px] shadow-[0_1px_4px_rgba(0,0,0,0.18)]">
      <span className="relative block h-full w-full overflow-hidden rounded-[9px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- static, pre-sized assets */}
        <img
          src={`/wallpapers/dunes-${dark ? "dark" : "light"}-portrait.webp`}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span className="absolute inset-x-0 top-[13px] text-center text-[15px] leading-none font-semibold tracking-[-0.02em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
          9:41
        </span>
      </span>
    </span>
  );
}

function Radio({ on }: { on: boolean }) {
  return on ? (
    <span className="grid size-[22px] place-items-center rounded-full bg-blue">
      <svg width="11" height="9" viewBox="0 0 11 9" aria-hidden="true">
        <path d="m1.2 4.6 2.9 2.9L9.8 1.5" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  ) : (
    <span className="block size-[22px] rounded-full border-[1.5px] border-label-3" />
  );
}

function Slider({ value, min, onChange, label, disabled }: { value: number; min: number; onChange: (v: number) => void; label: string; disabled?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
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
        at(e.clientX);
      }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && at(e.clientX)}
      onKeyDown={(e) => {
        const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 0.05 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -0.05 : 0;
        if (!d) return;
        e.preventDefault();
        onChange(Math.min(1, Math.max(min, value + d)));
      }}
    >
      <span className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 overflow-hidden rounded-full bg-fill">
        <span className="block h-full bg-blue" style={{ width: `${k * 100}%` }} />
      </span>
      <span
        className="absolute top-1/2 h-[24px] w-[38px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_7px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.06)]"
        style={{ left: `calc(19px + ${k} * (100% - 38px))` }}
      />
    </div>
  );
}

const Sun = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 text-label-2">
    <circle cx="12" cy="12" r="4.2" fill="currentColor" />
    {Array.from({ length: 8 }, (_, i) => (
      <rect key={i} x="11.1" y="1.8" width="1.8" height="3.4" rx=".9" fill="currentColor" transform={`rotate(${i * 45} 12 12)`} />
    ))}
  </svg>
);

function DisplayPage() {
  const appearance = useOS((s) => s.appearance);
  const dark = useOS((s) => s.dark);
  const brightness = useOS((s) => s.brightness);
  const auto = appearance === "auto";
  return (
    <>
      <Group header="Appearance" footer={auto ? "Automatic follows the appearance of the device you’re reading this on." : undefined}>
        <div className="flex justify-center gap-[72px] pt-[20px] pb-[16px]">
          {(["light", "dark"] as const).map((m) => {
            const on = (m === "dark") === dark;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setAppearance(m)}
                className="flex flex-col items-center gap-[9px]"
              >
                <PhoneThumb dark={m === "dark"} />
                <span className="text-[15px] leading-[20px] capitalize">{m}</span>
                <Radio on={on} />
              </button>
            );
          })}
        </div>
        <Row
          title="Automatic"
          accessory={<Toggle on={auto} label="Automatic" onChange={(v) => setAppearance(v ? "auto" : dark ? "dark" : "light")} />}
        />
      </Group>
      <Group header="Brightness">
        <div className="flex items-center gap-[14px] px-[16px] py-[12px]">
          <Sun size={15} />
          <Slider value={brightness} min={0.15} label="Brightness" onChange={(v) => os.set({ brightness: v })} />
          <Sun size={22} />
        </div>
        <Row title="True Tone" accessory={<LocalToggle on label="True Tone" />} />
      </Group>
      <Group>
        <Row title="Auto-Lock" value="Never" />
        <Row title="Display Zoom" value="Default" />
      </Group>
    </>
  );
}

/* ------------------------------------------------------------ Wallpaper */

function WallpaperPage() {
  const dark = useOS((s) => s.dark);
  return (
    <>
      <Group header="Current" footer="Dunes follows Appearance: daytime sand in Light, a night sky in Dark.">
        <div className="flex justify-center gap-[22px] px-[16px] pt-[20px] pb-[18px]">
          {[false, true].map((d) => (
            <div key={String(d)} className="flex flex-col items-center gap-[10px]">
              <span
                className={`relative block h-[200px] w-[98px] overflow-hidden rounded-[16px] transition-shadow duration-300 ${
                  d === dark ? "shadow-[0_0_0_2.5px_var(--blue),0_4px_14px_rgba(0,0,0,0.16)]" : "shadow-[0_2px_8px_rgba(0,0,0,0.14)]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static, pre-sized assets */}
                <img
                  src={`/wallpapers/dunes-${d ? "dark" : "light"}-portrait.webp`}
                  alt={`Dunes, ${d ? "dark" : "light"}`}
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-x-0 top-[16px] text-center text-[30px] leading-none font-semibold tracking-[-0.03em] text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
                  9:41
                </span>
              </span>
              <span className="text-[13px] leading-[18px] text-label-2">{d ? "Dark" : "Light"}</span>
            </div>
          ))}
        </div>
        <Row title="Wallpaper" value="Dunes" />
      </Group>
    </>
  );
}

/* ----------------------------------------------------- Sounds & Privacy */

function SoundsPage() {
  const sounds = useOS((s) => s.sounds);
  return (
    <>
      <Group footer="ntz duo is a quiet phone. It has no sounds to play yet, so Silent Mode keeps things as they are.">
        <Row icon="sounds" title="Silent Mode" accessory={<Toggle on={!sounds} label="Silent Mode" onChange={(v) => os.set({ sounds: !v })} />} />
      </Group>
    </>
  );
}

function PrivacyPage() {
  return (
    <>
      <Hero
        icon="privacy"
        title="Privacy & Security"
        text="ntz duo sets no cookies and runs no analytics. Nothing you do here is tracked."
      />
      <Group>
        <Row title="Cookies" value="None" />
        <Row title="Analytics" value="None" />
        <Row title="Tracking" value="None" />
        <Row title="Location Services" value="Not Used" />
      </Group>
      <Group
        header="Network"
        footer="The Weather widget asks Open-Meteo for the forecast using only Addis Ababa’s coordinates. Nothing about you is included."
      >
        <Row title="Weather" value="Open-Meteo" />
      </Group>
      <Group header="On This Device" footer="Your Light, Dark or Automatic choice is kept in this browser’s local storage so the phone remembers it. It never leaves your device.">
        <Row title="Appearance" value="Local storage" />
      </Group>
    </>
  );
}

/* --------------------------------------------------------------- Scenery */

function Hero({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <div className="mb-[22px] flex flex-col items-center rounded-[24px] bg-grouped-2 px-[22px] pt-[22px] pb-[20px] text-center">
      <SettingsIcon name={icon} size={56} />
      <p className="mt-[12px] font-display text-[22px] leading-[28px] font-bold tracking-[-0.01em]">{title}</p>
      <p className="mt-[4px] text-[15px] leading-[20px] text-label-2">{text}</p>
    </div>
  );
}

function scenery(icon: IconName, title: string) {
  return function Scenery() {
    return (
      <div className="flex flex-col items-center pt-[56px] text-center">
        <SettingsIcon name={icon} size={64} />
        <p className="mt-[14px] font-display text-[22px] leading-[28px] font-bold tracking-[-0.01em]">{title}</p>
        <p className="mt-[6px] max-w-[300px] text-[15px] leading-[20px] text-label-2">There’s nothing to change here on ntz duo.</p>
      </div>
    );
  };
}

export const PAGES: Record<string, PageDef> = {
  profile: { title: profile.name, keywords: "account apple name email availability education", Body: ProfilePage },
  wifi: { title: "Wi-Fi", icon: "wifi", keywords: "network internet", Body: WifiPage },
  bluetooth: { title: "Bluetooth", icon: "bluetooth", Body: BluetoothPage },
  battery: { title: "Battery", icon: "battery", keywords: "power", Body: BatteryPage },
  general: { title: "General", icon: "general", Body: GeneralPage },
  about: { title: "About", parent: "general", keywords: "version model built next react tailwind gsap lenis owner projects", Body: AboutPage },
  update: { title: "Software Update", parent: "general", keywords: "ios 27", Body: UpdatePage },
  datetime: { title: "Date & Time", parent: "general", keywords: "clock time zone addis", Body: DateTimePage },
  accessibility: { title: "Accessibility", icon: "accessibility", Body: AccessibilityPage },
  textsize: { title: "Display & Text Size", parent: "accessibility", keywords: "transparency", Body: TextSizePage },
  motion: { title: "Motion", parent: "accessibility", keywords: "reduce motion animation", Body: MotionPage },
  camera: { title: "Camera", icon: "camera", Body: scenery("camera", "Camera") },
  control: { title: "Control Center", icon: "control", Body: scenery("control", "Control Center") },
  display: { title: "Display & Brightness", icon: "display", keywords: "appearance dark light mode theme brightness", Body: DisplayPage },
  home: { title: "Home Screen & App Library", icon: "home", Body: scenery("home", "Home Screen & App Library") },
  search: { title: "Search", icon: "search", Body: scenery("search", "Search") },
  wallpaper: { title: "Wallpaper", icon: "wallpaper", keywords: "dunes background", Body: WallpaperPage },
  notifications: { title: "Notifications", icon: "notifications", Body: scenery("notifications", "Notifications") },
  sounds: { title: "Sounds & Haptics", icon: "sounds", keywords: "silent audio", Body: SoundsPage },
  focus: { title: "Focus", icon: "focus", keywords: "do not disturb", Body: scenery("focus", "Focus") },
  screentime: { title: "Screen Time", icon: "screentime", Body: scenery("screentime", "Screen Time") },
  faceid: { title: "Face ID & Passcode", icon: "faceid", Body: scenery("faceid", "Face ID & Passcode") },
  sos: { title: "Emergency SOS", icon: "sos", Body: scenery("sos", "Emergency SOS") },
  privacy: { title: "Privacy & Security", icon: "privacy", keywords: "cookies analytics tracking weather open-meteo", Body: PrivacyPage },
  apps: { title: "Apps", icon: "apps", Body: scenery("apps", "Apps") },
};

/** The sidebar, in iOS 27's order. */
export const SIDEBAR: string[][] = [
  ["airplane", "wifi", "bluetooth", "battery"],
  ["general", "accessibility", "camera", "control", "display", "home", "search", "wallpaper"],
  ["notifications", "sounds", "focus", "screentime"],
  ["faceid", "sos", "privacy"],
  ["apps"],
];

/** Path from the sidebar to a page, e.g. about → [general, about]. */
export function pathTo(id: string): string[] {
  const p = PAGES[id]?.parent;
  return p ? [...pathTo(p), id] : [id];
}
