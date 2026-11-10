"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import type { Project as P } from "@/content/site";
import { contrast } from "./color";
import { IconFace, iconRadius } from "@/components/os/AppIcon";

// The pieces of a project's page, after the iOS 27 App Store product page:
// hero media, the header (icon, name, subtitle, Visit), the info strip,
// the screenshot carousel, then sections of copy.

/** Left and right padding that keeps copy clear of the rail. */
export type Gutter = { paddingLeft: number; paddingRight: number };

/** SF Symbol stand-ins the shared Glyph set doesn't have. */
export const Sym = {
  share: (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 14.5V3.5M8 7.2 12 3.2l4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 10H7a2.5 2.5 0 0 0-2.5 2.5v6A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5v-6A2.5 2.5 0 0 0 17 10h-1.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  building: (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 9 12 4l8.5 5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10.5v7M10 10.5v7M14 10.5v7M18 10.5v7M3.5 20h17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
  code: (
    <svg width="28" height="26" viewBox="0 0 26 24" aria-hidden="true">
      <path d="m8 7-5 5 5 5M18 7l5 5-5 5M15 4.5l-4 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  globe: (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.8" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path d="M3.4 12h17.2M12 3.2c2.6 2.6 3.8 5.6 3.8 8.8s-1.2 6.2-3.8 8.8c-2.6-2.6-3.8-5.6-3.8-8.8s1.2-6.2 3.8-8.8Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  lock: (
    <svg width="13" height="15" viewBox="0 0 30 36" aria-hidden="true">
      <rect x="2" y="15" width="26" height="19" rx="5" fill="currentColor" />
      <path d="M8 15v-4a7 7 0 0 1 14 0v4" fill="none" stroke="currentColor" strokeWidth="3.4" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/** The app icon with the soft drop shadow the App Store gives it. */
export function Icon({ p, size }: { p: P; size: number }) {
  return (
    <span
      className="block shrink-0 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_6px_18px_rgba(0,0,0,0.18)]"
      style={{ width: size, height: size, borderRadius: iconRadius(size) }}
    >
      <IconFace id={p.slug} size={size} />
    </span>
  );
}

/** The 21:9 hero, as App Store pages now open: promo art in the brand
 *  colour, with the first real screen rising out of its lower edge, or
 *  the icon, big, for systems under NDA. */
export function Hero({ p, height, center, dark }: { p: P; height: number; center: number; dark: boolean }) {
  // A pale brand (cream, amber) under a white status bar (dark mode) needs
  // more shade on the top edge than a deep one.
  const pale = contrast(p.color, "#ffffff") < 3;
  const shade = pale && dark ? 0.34 : 0.14;
  return (
    <div
      className="relative overflow-hidden"
      style={{
        height,
        color: p.ink,
        background: `radial-gradient(80% 130% at 50% 0%, color-mix(in srgb, ${p.color} 74%, #fff) 0%, ${p.color} 48%, color-mix(in srgb, ${p.color} ${dark && !pale ? 50 : 66}%, #000) 100%)`,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1.4px)] bg-size-[22px_22px] opacity-[0.16] mask-[radial-gradient(70%_90%_at_50%_100%,#000,transparent)]"
      />
      {/* The app icon, large and tilted: the screens wait under Preview,
          after the description. */}
      <span aria-hidden="true" className="absolute top-[54%] -translate-x-1/2 -translate-y-1/2 rotate-[-8deg]" style={{ left: center }}>
        <Icon p={p} size={Math.round(height * 0.5)} />
      </span>
      {/* A soft shade on the top edge, under the status bar and the rail. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[130px]"
        style={{ background: `linear-gradient(to bottom, rgba(0,0,0,${shade}), rgba(0,0,0,${shade / 3}) 55%, transparent)` }}
      />
    </div>
  );
}

/** Icon, name, subtitle and the Visit capsule, on the page below the hero. */
export function Header({ p, wide, tint, host, style }: { p: P; wide: boolean; tint: string; host: string | null; style?: CSSProperties }) {
  const size = wide ? 118 : 88;
  return (
    <div className={`flex items-center ${wide ? "gap-[22px] pt-[22px]" : "gap-[16px] pt-[18px]"}`} style={style}>
      <Icon p={p} size={size} />
      <div className="min-w-0 flex-1">
        <h1
          className={`line-clamp-2 font-display font-bold tracking-[-0.012em] text-balance text-ink ${wide ? "text-[28px] leading-[32px]" : "text-[21px] leading-[25px]"}`}
        >
          {p.name}
        </h1>
        <p className={`mt-[2px] truncate text-ink-2 ${wide ? "text-[17px] leading-[22px]" : "text-[15px] leading-[20px]"}`}>{p.tagline}</p>
        <div className={`flex items-center gap-[10px] ${wide ? "mt-[12px]" : "mt-[9px]"}`}>
          {p.url ? (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass glass-tint inline-grid h-[32px] place-items-center rounded-full px-[22px] text-[15px] font-semibold tracking-[-0.01em] text-white transition-[scale,filter] duration-300 ease-ios hover:brightness-110 active:scale-110"
              style={{ "--tint": tint } as CSSProperties}
            >
              Visit
            </a>
          ) : (
            <span className="inline-flex h-[32px] items-center gap-[7px] rounded-full bg-page-alt px-[15px] text-[14px] font-semibold text-ink-2">
              {Sym.lock}
              Under NDA
            </span>
          )}
          <span className="truncate text-[12px] leading-[15px] text-ink-3">{host ?? `${p.category} · ${p.year}`}</span>
        </div>
      </div>
    </div>
  );
}

type Cell = { label: string; value: ReactNode; caption: string };

/** The App Store's info strip: tiny caps label, bold value, caption,
 *  cells split by short hairlines. Scrolls sideways when it runs out. */
export function InfoStrip({ p, gutter }: { p: P; gutter: Gutter }) {
  const cells: Cell[] = [
    { label: "Year", value: String(p.year), caption: p.category },
    ...p.facts.map((f) => ({ label: "Scale", value: f.value, caption: f.label })),
    { label: "Client", value: Sym.building, caption: p.client },
    { label: "Role", value: Sym.code, caption: p.role },
    {
      label: "Stack",
      value: p.stack[0] ?? "",
      caption: p.stack.length > 1 ? `+ ${p.stack.length - 1} more` : "",
    },
  ];
  return (
    <div className="no-scrollbar overflow-x-auto overscroll-x-contain" style={{ ...gutter, scrollPaddingLeft: gutter.paddingLeft }}>
      <ul className="flex w-max min-w-full border-y border-rule py-[14px]">
        {cells.map((c, i) => (
          <li
            key={`${c.label}${i}`}
            className="relative flex max-w-[220px] min-w-[104px] flex-1 flex-col items-center px-[16px] text-center before:absolute before:top-[12px] before:bottom-[12px] before:left-0 before:w-px before:bg-rule first:before:hidden"
          >
            <span className="text-[11px] leading-[14px] font-semibold tracking-[0.06em] text-ink-3 uppercase">{c.label}</span>
            <span className="mt-[5px] grid h-[26px] place-items-center font-display text-[21px] leading-[26px] font-bold tracking-[-0.01em] text-ink-2 tabular-nums">
              {c.value}
            </span>
            <span className="mt-[5px] w-full truncate text-[12px] leading-[15px] text-ink-3">{c.caption || " "}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Screenshots in a row, a peek of the next one inviting a swipe. */
export function Carousel({ p, wide, gutter, mirror, dark }: { p: P; wide: boolean; gutter: Gutter; mirror: boolean; dark: boolean }) {
  const w = wide ? 372 : 296;
  const ring = dark ? "shadow-[0_0_0_0.5px_rgba(255,255,255,0.14)]" : "shadow-[0_0_0_0.5px_rgba(0,0,0,0.1),0_2px_10px_rgba(0,0,0,0.05)]";
  return (
    <div
      className="no-scrollbar snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      style={{ ...gutter, scrollPaddingLeft: gutter.paddingLeft, scrollPaddingRight: gutter.paddingRight }}
    >
      <ul className="flex w-max gap-[12px]">
        {p.screens.map((src, i) => (
          <li key={src} className={`relative aspect-[16/10] shrink-0 snap-start overflow-hidden rounded-[16px] bg-page-alt ${ring}`} style={{ width: w }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static, pre-sized assets */}
            <img
              src={src}
              alt={p.confidential ? "" : `${p.name}: screen ${i + 1}`}
              draggable={false}
              loading={mirror || i > 2 ? "lazy" : "eager"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A section with an App Store title-2 header. */
export function Section({
  title,
  sub,
  gutter,
  children,
}: {
  title: string;
  sub?: string;
  gutter: Gutter;
  children: ReactNode;
}) {
  return (
    <section style={gutter}>
      <div className="border-t border-rule pt-[18px]">
        <h2 className="font-display text-[22px] leading-[28px] font-bold tracking-[-0.01em] text-ink">{title}</h2>
        {sub ? <p className="mt-[1px] text-[13px] leading-[18px] text-ink-3">{sub}</p> : null}
        <div className="mt-[12px]">{children}</div>
      </div>
    </section>
  );
}

/** A small glass HUD: "Link Copied". It moves on its own, so no ancestor
 *  fades it off its backdrop. */
export function Toast({ text, shown, onDone, style }: { text: string; shown: boolean; onDone: () => void; style?: CSSProperties }) {
  useEffect(() => {
    if (!shown) return;
    const t = window.setTimeout(onDone, 1600);
    return () => window.clearTimeout(t);
  }, [shown, onDone]);
  return (
    <div
      role="status"
      aria-live="polite"
      className={`glass pointer-events-none absolute z-30 flex h-[44px] items-center gap-[8px] rounded-full bg-(--glass-strong) px-[18px] text-[15px] font-semibold text-label transition-[opacity,translate,scale] duration-400 ease-ios ${
        shown ? "" : "translate-y-[12px] scale-[0.92] opacity-0"
      }`}
      style={style}
    >
      <span className="text-green">{Sym.check}</span>
      {text}
    </div>
  );
}
