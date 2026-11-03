"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { nextProject, projectBySlug, type Project as P } from "@/content/site";
import { openApp, useOS } from "@/lib/os";
import type { AppProps } from "../types";
import { Glyph, Rail, RailButton, contentBox } from "../settings/ios";
import s from "./project.module.css";

// A project's page, for now a preview of the case study to come. It reads
// like an apple.com product page: an eyebrow, a big name, one strong image,
// the hard facts, then what he built and with what.

/** Relative luminance, for picking an accent that reads on the page. */
function lum(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, "0")).join("")}`;
};
/** Near-grey colours (white, black, charcoal) carry no brand. */
const chromatic = (hex: string) => {
  const c = rgb(hex);
  return Math.max(...c) - Math.min(...c) > 24;
};

/** An accent for small text on the page: the brand colour if it reads,
 *  else its glyph colour, else the brand colour pushed lighter or darker
 *  until it reads (cream, amber and near-black brands need this). */
const accentFor = (p: P, dark: boolean) => {
  const page = dark ? "#000000" : "#ffffff";
  const ok = (c: string) => contrast(c, page) >= 4.5;
  if (ok(p.color)) return p.color;
  if (chromatic(p.ink) && ok(p.ink)) return p.ink;
  const base = chromatic(p.ink) ? p.ink : p.color;
  for (let t = 0.1; t < 1; t += 0.1) {
    const c = mix(base, dark ? "#ffffff" : "#000000", t);
    if (ok(c)) return c;
  }
  return dark ? "#ffffff" : "#000000";
};

/** Reveal [data-reveal] children as they scroll into the container. */
function useReveal(root: React.RefObject<HTMLDivElement | null>, live: boolean) {
  useEffect(() => {
    const el = root.current;
    if (!el || !live) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-shown", "");
          io.unobserve(e.target);
        }
      },
      { root: el, rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );
    el.querySelectorAll("[data-reveal]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [root, live]);
}

function Reveal({ children, delay = 0, className = "", as: Tag = "div" }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "section" | "figure" | "li" }) {
  return (
    <Tag data-reveal className={`${s.reveal} ${className}`} style={{ "--delay": `${delay}s` } as CSSProperties}>
      {children}
    </Tag>
  );
}

export default function Project({ width, slot, mirror, close, slug }: AppProps & { slug: string }) {
  const p = projectBySlug(slug);
  const dark = useOS((st) => st.dark);
  const scroller = useRef<HTMLDivElement>(null);
  useReveal(scroller, !mirror);
  if (!p) return null;

  const box = contentBox(slot, width);
  const wide = box.width > 600;
  const accent = accentFor(p, dark);
  const next = nextProject(p.slug);
  const host = p.url ? new URL(p.url).host.replace(/^www\./, "") : null;
  const goNext = () => {
    if (mirror) return;
    // Leave this window first, so the next page opens in its place.
    close();
    openApp(next.slug, null);
  };

  const pad = wide ? 64 : 28;

  return (
    <div className="relative h-full bg-page text-ink">
      <div
        ref={scroller}
        className={`no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain ${mirror ? s.still : ""}`}
        style={{ paddingLeft: box.left, paddingRight: width - box.width - box.left }}
      >
        {/* A wash of the brand colour behind the hero, as Apple tints a page. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[560px]"
          style={{
            background: `radial-gradient(70% 70% at 50% 0%, color-mix(in srgb, ${p.color} ${dark ? 34 : 16}%, transparent) 0%, transparent 100%)`,
          }}
        />

        <header className="relative text-center" style={{ padding: `${wide ? 92 : 84}px ${pad}px 0` }}>
          <Reveal>
            <p className="text-[15px] leading-[1] font-semibold tracking-[0.011em]" style={{ color: accent }}>
              {p.category} · {p.year}
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1
              className="mx-auto mt-[12px] max-w-[720px] font-display font-semibold text-balance"
              style={{ fontSize: wide ? 54 : 36, lineHeight: 1.06, letterSpacing: "-0.015em" }}
            >
              {p.name}
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-[12px] max-w-[560px] text-ink-2 text-balance" style={{ fontSize: wide ? 21 : 18, lineHeight: 1.3 }}>
              {p.tagline}
            </p>
            {p.url ? (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-[14px] inline-block text-[17px] leading-[1.3] text-link hover:underline"
              >
                Visit site ›
              </a>
            ) : null}
          </Reveal>
        </header>

        <Reveal as="figure" delay={0.24} className="relative">
          <div className="mx-auto" style={{ padding: `${wide ? 40 : 28}px ${pad}px 0`, maxWidth: 900 }}>
            {p.confidential ? <NdaTile p={p} wide={wide} /> : <Screen p={p} dark={dark} mirror={mirror} />}
          </div>
        </Reveal>

        {/* Facts, the way a product page lists its highlights. */}
        <section className="mx-auto" style={{ padding: `${wide ? 64 : 48}px ${pad}px 0`, maxWidth: 900 }}>
          <div className="grid gap-[12px]" style={{ gridTemplateColumns: `repeat(${wide ? Math.min(3, p.facts.length + 1) : 2}, minmax(0, 1fr))` }}>
            {p.facts.map((f, i) => (
              <Reveal key={f.label} delay={i * 0.12} className="rounded-[22px] bg-page-alt px-[20px] pt-[18px] pb-[18px]">
                <p className="font-display font-semibold tracking-[-0.015em]" style={{ fontSize: wide ? 44 : 36, lineHeight: 1.05 }}>
                  {f.value}
                </p>
                <p className="mt-[6px] text-[14px] leading-[1.35] text-ink-2">{f.label}</p>
              </Reveal>
            ))}
            <Reveal
              delay={p.facts.length * 0.12}
              className={`rounded-[22px] bg-page-alt px-[20px] pt-[18px] pb-[18px] ${!wide && p.facts.length % 2 === 0 ? "col-span-2" : ""}`}
            >
              <p className="text-[12px] leading-[1.33] font-semibold tracking-[0.02em] text-ink-3 uppercase">Client</p>
              <p className="mt-[6px] text-[17px] leading-[1.3] font-semibold">{p.client}</p>
              <p className="mt-[12px] text-[12px] leading-[1.33] font-semibold tracking-[0.02em] text-ink-3 uppercase">Role</p>
              <p className="mt-[4px] text-[15px] leading-[1.35] text-ink-2">{p.role}</p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto" style={{ padding: `${wide ? 72 : 52}px ${pad}px 0`, maxWidth: 900 }}>
          <div className={wide ? "grid grid-cols-[1fr_1.6fr] gap-[40px]" : ""}>
            <Reveal>
              <h2 className="font-display font-semibold" style={{ fontSize: wide ? 34 : 28, lineHeight: 1.1, letterSpacing: "-0.005em" }}>
                What I built.
              </h2>
            </Reveal>
            <ul className={wide ? "" : "mt-[18px]"}>
              {p.built.map((b, i) => (
                <Reveal as="li" key={b} delay={0.1 + i * 0.1} className="flex gap-[14px] border-t border-rule py-[14px] first:border-t-0 first:pt-[4px]">
                  <span className="mt-[2px] w-[22px] shrink-0 text-[14px] leading-[1.6] font-semibold tabular-nums" style={{ color: accent }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[17px] leading-[1.47] tracking-[-0.022em]">{b}</span>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto" style={{ padding: `${wide ? 56 : 44}px ${pad}px 0`, maxWidth: 900 }}>
          <Reveal>
            <h3 className="text-[12px] leading-[1.33] font-semibold tracking-[0.02em] text-ink-3 uppercase">Built with</h3>
            <ul className="mt-[12px] flex flex-wrap gap-[8px]">
              {p.stack.map((t) => (
                <li key={t} className="rounded-full border border-rule px-[14px] py-[6px] text-[14px] leading-[1.3] text-ink">
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section className="mx-auto" style={{ padding: `${wide ? 72 : 52}px ${pad}px 0`, maxWidth: 900 }}>
          <Reveal className="rounded-[28px] bg-page-alt text-center">
            <div style={{ padding: wide ? "48px 56px" : "36px 24px" }}>
              <p className="mx-auto max-w-[560px] text-ink-2" style={{ fontSize: wide ? 21 : 17, lineHeight: 1.38, letterSpacing: "0.011em" }}>
                <strong className="font-semibold text-ink">{p.name}.</strong> {p.summary}
              </p>
              <p className="mt-[22px] font-display font-semibold tracking-[-0.01em]" style={{ fontSize: wide ? 28 : 22, lineHeight: 1.15 }}>
                Full case study coming soon.
              </p>
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-[22px] inline-grid h-[44px] place-items-center rounded-full bg-cta px-[22px] text-[17px] text-white transition-colors hover:bg-cta-hover"
                >
                  Visit {host}
                </a>
              ) : null}
            </div>
          </Reveal>
        </section>

        <footer className="mx-auto" style={{ padding: `${wide ? 56 : 44}px ${pad}px ${wide ? 72 : 64}px`, maxWidth: 900 }}>
          <Reveal>
            <button type="button" onClick={goNext} className="group flex w-full items-center gap-[16px] border-t border-rule pt-[22px] text-left">
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] leading-[1.33] font-semibold tracking-[0.02em] text-ink-3 uppercase">Next project</span>
                <span className="mt-[4px] block truncate font-display text-[24px] leading-[1.2] font-semibold tracking-[-0.01em] group-hover:text-link">
                  {next.name}
                </span>
                <span className="block truncate text-[15px] leading-[1.4] text-ink-2">{next.tagline}</span>
              </span>
              <span className="text-[24px] text-link transition-transform duration-300 group-hover:translate-x-[3px]">›</span>
            </button>
          </Reveal>
        </footer>
      </div>

      <Rail slot={slot}>
        <RailButton label={`Close ${p.short}`} onClick={close}>
          {Glyph.close}
        </RailButton>
        {p.url ? (
          <RailButton label={`Visit ${host}`} href={p.url} external tint="var(--blue)">
            {Glyph.safari}
          </RailButton>
        ) : null}
        <RailButton label={`Next: ${next.name}`} onClick={goNext}>
          {Glyph.next}
        </RailButton>
      </Rail>
    </div>
  );
}

/** The first screen, device-less, on a soft shadow. */
function Screen({ p, dark, mirror }: { p: P; dark: boolean; mirror: boolean }) {
  return (
    <div
      className="relative overflow-hidden rounded-[16px] bg-page-alt"
      style={{
        aspectRatio: "16 / 10",
        boxShadow: dark
          ? "0 0 0 0.5px rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.6)"
          : "0 0 0 0.5px rgba(0,0,0,0.06), 0 24px 60px rgba(0,0,0,0.16), 0 6px 18px rgba(0,0,0,0.06)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static, pre-sized assets */}
      <img
        src={p.screens[0]}
        alt={`${p.name}: home page`}
        draggable={false}
        loading={mirror ? "lazy" : "eager"}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
    </div>
  );
}

/** Bank systems show no screens: a lock in the brand colour instead. */
function NdaTile({ p, wide }: { p: P; wide: boolean }) {
  return (
    <div
      className="relative grid place-items-center overflow-hidden rounded-[22px] text-center"
      style={{
        aspectRatio: "16 / 10",
        color: p.ink,
        background: `radial-gradient(90% 120% at 30% 0%, color-mix(in srgb, ${p.color} 72%, #fff) 0%, ${p.color} 46%, color-mix(in srgb, ${p.color} 70%, #000) 100%)`,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.16]"
        style={{ backgroundImage: `radial-gradient(currentColor 1px, transparent 1.4px)`, backgroundSize: "22px 22px" }}
      />
      <div className="relative flex flex-col items-center px-[24px]">
        <span
          className="grid place-items-center rounded-full"
          style={{ width: wide ? 76 : 60, height: wide ? 76 : 60, background: "color-mix(in srgb, currentColor 14%, transparent)" }}
        >
          <svg width={wide ? 30 : 24} height={wide ? 36 : 29} viewBox="0 0 30 36" aria-hidden="true">
            <rect x="2" y="15" width="26" height="19" rx="5" fill="currentColor" />
            <path d="M8 15v-4a7 7 0 0 1 14 0v4" fill="none" stroke="currentColor" strokeWidth="3.2" />
          </svg>
        </span>
        <p className="mt-[16px] font-display font-semibold tracking-[-0.01em]" style={{ fontSize: wide ? 30 : 24, lineHeight: 1.1 }}>
          Under NDA
        </p>
        <p className="mt-[8px] max-w-[380px] opacity-80" style={{ fontSize: wide ? 16 : 14, lineHeight: 1.4 }}>
          Built inside {p.client}
          {p.client.endsWith("s") ? "’" : "’s"} systems, so the screens stay private.
        </p>
      </div>
    </div>
  );
}
