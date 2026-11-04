"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { useOS } from "@/lib/os";
import type { AppProps } from "../types";

// The apple.com "detail page" kit shared by About and Contact: a scroll view
// with Apple's staggered reveals, a floating glass local nav, the iPhone Duo
// side rail on the window's outer edge, and the type scale shrunk to fit a
// 951 or 470 pt window.

/** The side rail (Figma kit §3.6): status bar on top, controls below. */
export const RAIL = 84;
const BTN = 48;
const RAIL_INSET = 24; // button to screen edge
const PITCH = 60;

// apple.com's "StaggeredFadeIn": [data-reveal] blocks rise 30 and fade,
// staggered by --i. Only armed in the live window, so the folding mirrors
// draw the finished page.
const ARMED = [
  "**:data-reveal:transform-[translate3d(0,30px,0)] **:data-reveal:opacity-0",
  "**:data-reveal:transition-[transform,opacity] **:data-reveal:duration-[0.7s,0.9s] **:data-reveal:ease-[cubic-bezier(0.4,0,0.6,1)] **:data-reveal:delay-[calc(var(--i,0)*0.15s)]",
  "**:data-reveal:data-in:transform-none **:data-reveal:data-in:opacity-100",
  "motion-reduce:**:data-reveal:transform-none motion-reduce:**:data-reveal:opacity-100 motion-reduce:**:data-reveal:transition-none",
].join(" ");

/** The local nav slides away while [data-hidden]. */
const NAV = [
  "transition-[opacity,transform] duration-400 ease-[ease-out,cubic-bezier(0.4,0,0.6,1)]",
  "data-hidden:pointer-events-none data-hidden:transform-[translate3d(0,-10px,0)] data-hidden:opacity-0",
  "motion-reduce:transition-opacity motion-reduce:duration-200 motion-reduce:ease-linear motion-reduce:data-hidden:transform-none",
].join(" ");

/** Rail and pill buttons: a springy press and a quick colour change. */
const PRESS = "transition-[scale,background-color] duration-[0.25s,0.2s] ease-[cubic-bezier(0.3,2,0.5,1),linear] active:scale-[0.92]";

type Page = {
  compact: boolean;
  mirror: boolean;
  /** Inner display upright: bars run along the top and bottom, no rail. */
  bars: boolean;
  /** Padding that keeps content inside the area the rail leaves. */
  padL: number;
  padR: number;
  scroller: RefObject<HTMLDivElement | null>;
};

const PageCtx = createContext<Page | null>(null);

export function usePage() {
  const p = useContext(PageCtx);
  if (!p) throw new Error("usePage outside DetailPage");
  return p;
}

/** Props that put an element into the staggered reveal. */
export function reveal(i = 0, style?: CSSProperties) {
  return { "data-reveal": "", style: { "--i": i, ...style } as CSSProperties };
}

export function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scroll the page to an element, minding the local nav. */
export function scrollToEl(scroller: HTMLElement | null, el: HTMLElement | null) {
  if (!scroller || !el) return;
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  // getBoundingClientRect is in screen px; the OS is zoomed, so rescale.
  const k = scroller.offsetHeight / scroller.getBoundingClientRect().height || 1;
  scroller.scrollTo({ top: scroller.scrollTop + top * k - 88, behavior: reducedMotion() ? "auto" : "smooth" });
}

/** Calls `fn(scrollTop)` once per frame while the page scrolls. */
export function useScroll(fn: (y: number) => void, enabled = true) {
  const { scroller, mirror } = usePage();
  const cb = useRef(fn);
  useEffect(() => {
    cb.current = fn;
  });
  useEffect(() => {
    const el = scroller.current;
    if (!el || mirror || !enabled) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      cb.current(el.scrollTop);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [scroller, mirror, enabled]);
}

export type RailItem = {
  label: string;
  icon: ReactNode;
  /** Receives the page's scroll view. */
  onClick?: (page: HTMLDivElement | null) => void;
  href?: string;
  /** Opens in a new tab. */
  external?: boolean;
};

type Props = {
  app: AppProps;
  /** Product name in the local nav. */
  title: string;
  /** The local nav's blue pill. */
  cta: { label: string; onClick: (page: HTMLDivElement | null) => void };
  /** Prominent action under Close, tinted. */
  primary: RailItem;
  /** The rail's bottom capsule (two items). */
  group: [RailItem, RailItem];
  /** Scroll distance after which the local nav appears. */
  navAfter?: number;
  children: ReactNode;
};

export function DetailPage({ app, title, cta, primary, group, navAfter, children }: Props) {
  const { width, height, slot, mirror, close } = app;
  // Upright inner display (phone viewports): horizontal bars, no rail.
  const bars = useOS((s) => s.portrait);
  const compact = width < 600 || bars;
  const railLeft = !bars && slot === "left";
  const pad = width < 600 ? 26 : bars ? 40 : 56;
  const padL = (bars || !railLeft ? 0 : RAIL) + pad;
  const padR = (bars || railLeft ? 0 : RAIL) + pad;
  // The status bar owns the top of the rail (or, upright, the top 54 pt of
  // the upper window); the left rail has none and starts at 24 (§3.6).
  const top = bars ? (slot === "right" ? 24 : 62) : railLeft ? 24 : 122;

  const scroller = useRef<HTMLDivElement>(null);
  const [nav, setNav] = useState(false);
  const threshold = navAfter ?? height * 0.62;

  // Reveal blocks as they enter the scroll view (Apple fires at 85vh).
  // Re-armed when the layout switches, since that mounts new blocks.
  useEffect(() => {
    const root = scroller.current;
    if (!root || mirror) return;
    const els = root.querySelectorAll<HTMLElement>("[data-reveal]:not([data-in])");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-in", "");
          io.unobserve(e.target);
        }
      },
      { root, rootMargin: "0px 0px -15% 0px" },
    );
    // Whatever is already on screen (the hero) plays straight away; Apple's
    // 85% line would otherwise hold back anything near the bottom edge.
    const bottom = root.getBoundingClientRect().bottom;
    els.forEach((el) => (el.getBoundingClientRect().top < bottom ? el.setAttribute("data-in", "") : io.observe(el)));
    return () => io.disconnect();
  }, [mirror, compact]);

  useEffect(() => {
    const el = scroller.current;
    if (!el || mirror) return;
    const onScroll = () => setNav(el.scrollTop > threshold);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [mirror, threshold]);

  const ctx: Page = { compact, mirror, bars, padL, padR, scroller };
  const edge = railLeft ? { left: RAIL_INSET } : { right: RAIL_INSET };
  const closeItem: RailItem = { label: "Close", icon: <XMark />, onClick: close };
  const navInset = compact ? 10 : 16;

  return (
    <PageCtx.Provider value={ctx}>
      <div className={`relative h-full bg-page font-sans text-ink ${mirror ? "" : ARMED}`} style={{ width }}>
        <div ref={scroller} className="no-scrollbar h-full overflow-y-auto overscroll-contain">
          {children}
        </div>

        {/* Upright, the status bar lies over the page: a scroll-edge fade
            keeps it legible, as iOS does under its bars. */}
        {bars && slot !== "right" ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[64px] bg-gradient-to-b from-page via-page/80 to-transparent" />
        ) : null}

        {/* Local nav: Apple's floating capsule, over the content area only. */}
        <div
          className={`glass absolute z-20 flex h-[44px] items-center justify-between rounded-[16px] bg-(--glass-strong) pr-[7px] pl-[18px] ${NAV}`}
          style={{
            top: bars ? top + 2 : 38,
            left: bars ? 16 + BTN + 10 : padL - navInset,
            right: bars ? 16 : padR - navInset,
          }}
          data-hidden={nav ? undefined : ""}
          aria-hidden={!nav}
        >
          <span className="truncate font-display text-[16px] font-semibold tracking-[0.005em]">{title}</span>
          <button
            type="button"
            tabIndex={nav ? 0 : -1}
            onClick={() => cta.onClick(scroller.current)}
            className={`h-[28px] shrink-0 rounded-full bg-cta px-[13px] text-[12px] leading-none text-white hover:bg-cta-hover ${PRESS}`}
          >
            {cta.label}
          </button>
        </div>

        {bars ? (
          // Upright: Close leads the top bar; the actions sit in the bottom
          // bar's trailing corner, clear of the home indicator.
          <nav aria-label={`${title} toolbar`} className="pointer-events-none absolute inset-0 z-30">
            <RailButton item={closeItem} page={scroller} style={{ top, left: 16 }} />
            <div className="absolute right-[16px] bottom-[24px] flex items-center gap-[10px]">
              <div className="glass pointer-events-auto flex items-center justify-between rounded-full px-[4px]" style={{ width: 100, height: BTN }}>
                {group.map((it) => (
                  <RailButton key={it.label} item={it} page={scroller} bare />
                ))}
              </div>
              <RailButton item={primary} page={scroller} tint flow />
            </div>
          </nav>
        ) : (
          // The rail: Close on top, the prominent action, a group at the bottom.
          <nav aria-label={`${title} toolbar`} className="pointer-events-none absolute inset-y-0 z-30" style={{ width: RAIL, ...(railLeft ? { left: 0 } : { right: 0 }) }}>
            <RailButton item={closeItem} page={scroller} style={{ top, ...edge }} />
            <RailButton item={primary} page={scroller} tint style={{ top: top + PITCH, ...edge }} />
            <div
              className="glass pointer-events-auto absolute flex flex-col items-center justify-between rounded-full py-[4px]"
              style={{ width: BTN, height: 100, bottom: 24, ...edge }}
            >
              {group.map((it) => (
                <RailButton key={it.label} item={it} page={scroller} bare />
              ))}
            </div>
          </nav>
        )}
      </div>
    </PageCtx.Provider>
  );
}

function RailButton({
  item,
  page,
  style,
  tint,
  bare,
  flow,
}: {
  item: RailItem;
  page: RefObject<HTMLDivElement | null>;
  style?: CSSProperties;
  tint?: boolean;
  /** Inside a capsule: no glass of its own. */
  bare?: boolean;
  /** Laid out by its parent rather than placed. */
  flow?: boolean;
}) {
  const cls = `pointer-events-auto grid place-items-center rounded-full ${PRESS} ${
    bare ? "size-[40px] text-label hover:bg-fill-3" : `size-[48px] ${tint ? "bg-blue text-white shadow-[0_6px_20px_rgba(0,110,255,0.32)]" : "glass text-label"}`
  } ${bare || flow ? "" : "absolute"}`;
  if (item.href)
    return (
      <a
        href={item.href}
        target={item.external ? "_blank" : undefined}
        rel={item.external ? "noopener noreferrer" : undefined}
        aria-label={item.label}
        title={item.label}
        className={cls}
        style={style}
      >
        {item.icon}
      </a>
    );
  return (
    <button type="button" aria-label={item.label} title={item.label} onClick={() => item.onClick?.(page.current)} className={cls} style={style}>
      {item.icon}
    </button>
  );
}

/* ---------- Layout ---------- */

/** A full-bleed band in one of apple.com's two page colours. */
export function Section({
  tone = "page",
  className = "",
  innerClassName = "",
  id,
  children,
  sref,
}: {
  tone?: "page" | "alt";
  className?: string;
  innerClassName?: string;
  id?: string;
  children: ReactNode;
  sref?: RefObject<HTMLElement | null>;
}) {
  const { padL, padR, compact } = usePage();
  return (
    <section ref={sref} id={id} className={`${tone === "alt" ? "bg-page-alt" : "bg-page"} ${className}`}>
      <div className={innerClassName} style={{ paddingLeft: padL, paddingRight: padR, paddingTop: compact ? 60 : 84, paddingBottom: compact ? 60 : 84 }}>
        {children}
      </div>
    </section>
  );
}

/* ---------- Type (apple.com's scale at ~65%) ---------- */

export function Eyebrow({ children, className = "", i = 0 }: { children: ReactNode; className?: string; i?: number }) {
  const { compact } = usePage();
  return (
    <p {...reveal(i)} className={`font-display font-semibold tracking-[0.009em] ${compact ? "text-[15px]" : "text-[17px]"} ${className}`}>
      {children}
    </p>
  );
}

/** Section header ("Get the highlights."). */
export function Headline({ children, className = "", i = 0, as: Tag = "h2" }: { children: ReactNode; className?: string; i?: number; as?: "h1" | "h2" | "h3" }) {
  const { compact } = usePage();
  return (
    <Tag
      {...reveal(i)}
      className={`font-display font-semibold text-ink ${
        compact ? "text-[29px] leading-[1.1] tracking-[-0.012em]" : "text-[38px] leading-[1.08] tracking-[-0.018em]"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Hero / XXL lockup headline. */
export const heroType = (compact: boolean) =>
  compact
    ? "font-display text-[44px] leading-[1.05] font-semibold tracking-[-0.026em]"
    : "font-display text-[58px] leading-[1.04] font-semibold tracking-[-0.026em]";

/** Lockup copy: grey with the important words in ink. */
export function Lockup({ children, className = "", i = 0 }: { children: ReactNode; className?: string; i?: number }) {
  const { compact } = usePage();
  return (
    <p
      {...reveal(i)}
      className={`text-ink-2 [&_strong]:font-normal [&_strong]:text-ink ${
        compact ? "text-[15px] leading-[1.42] tracking-[-0.012em]" : "text-[17px] leading-[1.42] tracking-[-0.016em]"
      } ${className}`}
    >
      {children}
    </p>
  );
}

/** Apple's "Learn more ›" link. */
export function More({
  children,
  href,
  onClick,
  external,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  external?: boolean;
  className?: string;
}) {
  const body = (
    <>
      {children}
      <Chevron />
    </>
  );
  const cls = `group inline-flex items-center text-link hover:underline underline-offset-[3px] ${className}`;
  if (href)
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={cls}>
        {body}
      </a>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

function Chevron() {
  return (
    <svg width="7" height="12" viewBox="0 0 7 12" aria-hidden="true" className="ml-[5px] shrink-0 translate-y-[0.5px] transition-transform duration-300 group-hover:translate-x-[2px]">
      <path d="m1 1 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** apple.com's blue pill. `ghost` is the ringed secondary. */
export function Pill({
  children,
  onClick,
  href,
  external,
  ghost,
  small,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  ghost?: boolean;
  small?: boolean;
}) {
  const cls = `inline-flex items-center justify-center rounded-full whitespace-nowrap ${PRESS} ${
    small ? "h-[32px] px-[16px] text-[14px]" : "h-[38px] px-[20px] text-[15px]"
  } ${ghost ? "text-link shadow-[inset_0_0_0_1px_currentColor] hover:bg-link hover:text-page" : "bg-cta text-white hover:bg-cta-hover"}`;
  if (href)
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={cls}>
        {children}
      </a>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/** A bento tile: 28 pt corners, apple.com's alternate surface. */
export function Tile({ children, className = "", i = 0, on = "alt", style }: { children: ReactNode; className?: string; i?: number; on?: "alt" | "page"; style?: CSSProperties }) {
  const { compact } = usePage();
  return (
    <div
      {...reveal(i, style)}
      className={`relative overflow-hidden rounded-[28px] ${on === "alt" ? "bg-page" : "bg-page-alt"} ${compact ? "p-[22px]" : "p-[28px]"} ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------- SF Symbols, drawn ---------- */

export function XMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Envelope({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <rect x="2.8" y="5" width="18.4" height="14" rx="3" />
      <path d="m3.6 6.6 7.2 5.6a2 2 0 0 0 2.4 0l7.2-5.6" strokeLinecap="round" />
    </svg>
  );
}

export function DocDown({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 2.8H7.3a2.5 2.5 0 0 0-2.5 2.5v13.4a2.5 2.5 0 0 0 2.5 2.5h9.4a2.5 2.5 0 0 0 2.5-2.5V8.5z" />
      <path d="M13.5 2.8v3.7a2 2 0 0 0 2 2h3.7M12 11v6m-2.6-2.6L12 17l2.6-2.6" />
    </svg>
  );
}

export function ArrowUp({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5m-6 6 6-6 6 6" />
    </svg>
  );
}

export function Compose({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4.5H7a3 3 0 0 0-3 3V17a3 3 0 0 0 3 3h9.5a3 3 0 0 0 3-3v-4" />
      <path d="M17.6 3.4a1.9 1.9 0 0 1 2.7 2.7L12.6 13.8 9 14.8l1-3.6z" />
    </svg>
  );
}
