"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { nextProject, profile, projectBySlug } from "@/content/site";
import { openApp, os, useOS } from "@/lib/os";
import type { AppProps } from "../types";
import { Glyph, Rail, RailButton, RailGroup, contentBox } from "../settings/ios";
import { accentFor, contrast } from "./color";
import { Carousel, Header, Hero, Icon, InfoStrip, Section, Sym, Toast, type Gutter } from "./parts";

// A project's page, read like an iOS 27 App Store product page: hero media,
// the icon with name and a Visit button, an info strip of hard facts, the
// screenshots, then what he built, with what, and the details.

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
      { root: el, rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    el.querySelectorAll("[data-reveal]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [root, live]);
}

// apple.com's scroll reveal: rise 30 px and fade in, once, as the element
// enters the view. Only for content: nothing inside a Reveal is glass.
const REVEAL = [
  "transform-[translateY(30px)] opacity-0 transition-[opacity,transform] duration-800 ease-[cubic-bezier(0.4,0,0.6,1)] delay-(--delay)",
  "data-shown:transform-none data-shown:opacity-100",
  "in-data-still:transform-none in-data-still:opacity-100 in-data-still:transition-none",
  "motion-reduce:transform-none motion-reduce:opacity-100 motion-reduce:transition-none",
].join(" ");

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <div data-reveal className={`${REVEAL} ${className}`} style={{ "--delay": `${delay}s` } as CSSProperties}>
      {children}
    </div>
  );
}

export default function Project({ id, width, slot, mirror, close, slug }: AppProps & { slug: string }) {
  const p = projectBySlug(slug);
  const dark = useOS((st) => st.dark);
  const scroller = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState(false);
  const [overHero, setOverHero] = useState(true);
  const [toast, setToast] = useState(false);
  const hideToast = () => setToast(false);
  useReveal(scroller, !mirror);

  const box = contentBox(slot, width);
  const wide = box.width > 600;
  const heroH = Math.round((box.width * 9) / 21);

  // Past the header, an inline title capsule and the scroll-edge band take
  // over the top, as the App Store's nav bar does.
  useEffect(() => {
    const el = scroller.current;
    if (!el || mirror) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const y = el.scrollTop;
      const s = strip.current;
      setBar(s ? y > s.offsetTop - 64 : y > heroH);
      setOverHero(y < heroH - 104);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mirror, heroH]);

  // Over a dark brand hero, ask for a white status bar (it only sits over
  // a window on the trailing side).
  const lightBar = !mirror && slot !== "left" && overHero && !!p && contrast(p.color, "#ffffff") >= 3;
  useEffect(() => {
    if (!lightBar) return;
    os.set({ statusLight: id });
    return () => {
      if (os.get().statusLight === id) os.set({ statusLight: null });
    };
  }, [lightBar, id]);

  if (!p) return null;

  const accent = accentFor(p, dark);
  // Actions are system blue, as the App Store's Get: the brand colour is
  // already the hero, and a brand-tinted button would sink into it.
  const tint = "var(--blue)";
  const next = nextProject(p.slug);
  const host = p.url ? new URL(p.url).host.replace(/^www\./, "") : null;
  const pad = wide ? 32 : 20;
  const gutter: Gutter = { paddingLeft: box.left + pad, paddingRight: width - box.width - box.left + pad };

  const goNext = () => {
    if (mirror) return;
    // Leave this window first, so the next page opens in its place.
    close();
    openApp(next.slug, null);
  };
  const share = async () => {
    if (mirror || !p.url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: p.name, text: p.tagline, url: p.url });
        return;
      }
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(p.url);
      setToast(true);
    } catch {
      // No clipboard (insecure context): nothing to confirm.
    }
  };

  const info: { label: string; value: ReactNode }[] = [
    { label: "Developer", value: profile.name },
    { label: "Client", value: p.client },
    { label: "Category", value: p.category },
    { label: "Year", value: String(p.year) },
    { label: "Role", value: p.role },
    p.url
      ? {
          label: "Website",
          value: (
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
              {host} ›
            </a>
          ),
        }
      : { label: "Screens", value: "Under NDA" },
  ];

  return (
    <div className="relative h-full overflow-hidden bg-page text-ink">
      <div ref={scroller} data-still={mirror || undefined} data-project-scroll className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain">
        <Hero p={p} height={heroH} center={box.left + box.width / 2} mirror={mirror} dark={dark} />
        <Header p={p} wide={wide} tint={tint} host={host} style={gutter} />

        <div ref={strip} className="pt-[18px]">
          <InfoStrip p={p} gutter={gutter} />
        </div>

        <Reveal className="pt-[4px]">
          <Carousel p={p} wide={wide} gutter={gutter} mirror={mirror} dark={dark} />
          <p className="mt-[10px] flex items-center gap-[6px] text-[13px] leading-[18px] text-ink-3" style={gutter}>
            {p.confidential ? (
              <>
                {Sym.lock}
                <span className="truncate">
                  Under NDA: built inside {p.client}
                  {p.client.endsWith("s") ? "’" : "’s"} systems, so the screens stay private.
                </span>
              </>
            ) : (
              <>
                {Sym.globe}
                <span>Website</span>
              </>
            )}
          </p>
        </Reveal>

        <div className={`flex flex-col ${wide ? "gap-[34px] pt-[30px]" : "gap-[28px] pt-[26px]"}`}>
          <Reveal>
            <div style={gutter}>
              <p className={`max-w-[640px] leading-[1.47] tracking-[-0.022em] text-ink ${wide ? "text-[17px]" : "text-[16px]"}`}>{p.summary}</p>
              <p className="mt-[10px] text-[15px] leading-[20px]">
                <span className="text-link">{profile.name}</span>
                <span className="text-ink-3"> · Developer</span>
              </p>
            </div>
          </Reveal>

          <Reveal>
            <Section title="What I built" sub={`${p.role} · ${p.year}`} gutter={gutter}>
              <ol className={wide && p.built.length >= 4 && p.built.length % 2 === 0 ? "grid grid-cols-2 gap-x-[28px]" : ""}>
                {p.built.map((b, i) => (
                  <li key={b} className="flex gap-[12px] border-b border-rule py-[12px] last:border-b-0">
                    <span className="mt-[1px] w-[22px] shrink-0 text-[14px] leading-[22px] font-semibold tabular-nums" style={{ color: accent }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[16px] leading-[22px] tracking-[-0.02em]">{b}</span>
                  </li>
                ))}
              </ol>
            </Section>
          </Reveal>

          <Reveal>
            <Section title="Built with" gutter={gutter}>
              <ul className="flex flex-wrap gap-[8px]">
                {p.stack.map((t) => (
                  <li key={t} className="rounded-full bg-page-alt px-[14px] py-[7px] text-[14px] leading-[18px] font-medium text-ink">
                    {t}
                  </li>
                ))}
              </ul>
            </Section>
          </Reveal>

          <Reveal>
            <Section title="Information" gutter={gutter}>
              <dl className={wide ? "grid grid-cols-3 gap-x-[28px]" : ""}>
                {info.map((r) => (
                  <div
                    key={r.label}
                    className={wide ? "border-b border-rule py-[11px]" : "flex items-baseline justify-between gap-[16px] border-b border-rule py-[12px] last:border-b-0"}
                  >
                    <dt className="shrink-0 text-[14px] leading-[18px] text-ink-3">{r.label}</dt>
                    <dd className={`min-w-0 text-[15px] leading-[20px] text-ink ${wide ? "mt-[3px] truncate" : "truncate text-right"}`}>{r.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-[14px] text-[13px] leading-[18px] text-ink-3">Full case study coming soon.</p>
            </Section>
          </Reveal>

          <Reveal className={wide ? "pb-[64px]" : "pb-[56px]"}>
            <Section title="Next project" gutter={gutter}>
              <button type="button" onClick={goNext} className="group flex w-full items-center gap-[14px] text-left">
                <Icon p={next} size={64} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] leading-[22px] font-semibold tracking-[-0.01em] text-ink">{next.name}</span>
                  <span className="block truncate text-[14px] leading-[19px] text-ink-2">{next.tagline}</span>
                  <span className="block truncate text-[12px] leading-[16px] text-ink-3">{next.category}</span>
                </span>
                <span className="grid h-[30px] shrink-0 place-items-center rounded-full bg-page-alt px-[18px] text-[15px] font-semibold text-link transition-[scale,background-color] duration-300 ease-ios group-hover:bg-[color-mix(in_srgb,var(--page-alt)_80%,var(--ink)_6%)] group-active:scale-105">
                  View
                </span>
              </button>
            </Section>
          </Reveal>
        </div>
      </div>

      {/* The scroll-edge effect under the title capsule, once the hero has
          gone; it fades itself (no glass inside it). */}
      <div
        aria-hidden="true"
        className={`scroll-edge-top absolute inset-x-0 top-0 z-10 h-[116px] transition-opacity duration-300 [--edge:var(--page)] ${bar ? "" : "opacity-0"}`}
      />

      {/* Inline title: the App Store's nav shows the icon and Get once the
          header has scrolled off. Glass, so it moves itself. */}
      <div
        aria-hidden={!bar}
        inert={!bar || undefined}
        className={`glass absolute top-[40px] z-20 flex h-[48px] max-w-[min(420px,calc(100%-40px))] -translate-x-1/2 items-center gap-[10px] rounded-full py-[6px] pr-[6px] pl-[6px] transition-[opacity,translate,scale] duration-400 ease-ios ${
          bar ? "" : "pointer-events-none -translate-y-[10px] scale-[0.9] opacity-0"
        }`}
        style={{ left: box.left + box.width / 2 }}
      >
        <Icon p={p} size={36} />
        <span className="min-w-0 truncate pr-[2px] text-[15px] leading-[20px] font-semibold tracking-[-0.01em] text-label">{p.short}</span>
        {p.url ? (
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={bar ? 0 : -1}
            className="grid h-[32px] shrink-0 place-items-center rounded-full px-[16px] text-[14px] font-semibold text-white transition-[scale,filter] duration-300 ease-ios hover:brightness-110 active:scale-110"
            style={{ background: tint }}
          >
            Visit
          </a>
        ) : (
          <span className="mr-[8px] text-ink-3">{Sym.lock}</span>
        )}
      </div>

      <Toast
        text="Link Copied"
        shown={toast}
        onDone={hideToast}
        style={{ left: box.left + box.width / 2, bottom: 44, transform: "translateX(-50%)" }}
      />

      <Rail slot={slot}>
        <RailButton label={`Close ${p.short}`} onClick={close}>
          {Glyph.close}
        </RailButton>
        {p.url ? (
          <RailButton label={`Visit ${host}`} href={p.url} external prominent={tint}>
            {Glyph.safari}
          </RailButton>
        ) : null}
        {p.url ? (
          <RailGroup>
            <RailButton label={`Share ${host}`} onClick={share} bare>
              {Sym.share}
            </RailButton>
            <RailButton label={`Next: ${next.name}`} onClick={goNext} bare>
              {Glyph.next}
            </RailButton>
          </RailGroup>
        ) : (
          <RailButton label={`Next: ${next.name}`} onClick={goNext}>
            {Glyph.next}
          </RailButton>
        )}
      </Rail>
    </div>
  );
}
