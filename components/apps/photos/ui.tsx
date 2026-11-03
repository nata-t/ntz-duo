"use client";

import { forwardRef } from "react";

// Small shared pieces of Photos chrome.

/** The side rail is 84 pt on the window's outer edge (Duo UI kit). */
export const RAIL = 84;
/** Height the large-title header takes over the top of a scroll view. */
export const HEADER = 92;

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: number; wide?: boolean };

/** A Liquid Glass control: a circle for a symbol, a capsule for a word. */
export const GlassButton = forwardRef<HTMLButtonElement, BtnProps>(function GlassButton(
  { size = 40, wide, className = "", style, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={`glass grid shrink-0 place-items-center rounded-full text-label transition-transform duration-200 active:scale-[0.92] ${wide ? "px-[16px] text-[15px] font-semibold tracking-[-0.01em]" : ""} ${className}`}
      style={{ height: size, minWidth: size, ...style }}
    >
      {children}
    </button>
  );
});

/** iOS 26 large title floating over the top of the content, on a soft scrim. */
export function LargeTitle({
  title,
  sub,
  right,
  left = 0,
  width,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
  left?: number;
  width: number;
}) {
  return (
    <div className="pointer-events-none absolute top-0 z-10" style={{ left, width, height: HEADER + 28 }}>
      {/* A scroll-edge effect rather than a bar: the background fades in
          behind the title so the grid can pass under it. */}
      <div
        className="absolute inset-0"
        style={{
          WebkitBackdropFilter: "blur(14px)",
          backdropFilter: "blur(14px)",
          maskImage: "linear-gradient(to bottom, #000 60%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 60%, transparent)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--bg) 96%, transparent) 0%, color-mix(in srgb, var(--bg) 92%, transparent) 58%, color-mix(in srgb, var(--bg) 45%, transparent) 84%, transparent 100%)",
        }}
      />
      <div className="relative flex items-start justify-between gap-[12px] px-[18px] pt-[24px]">
        <div className="min-w-0">
          <h1
            className="truncate font-display leading-[40px] font-bold tracking-[0.01em] text-label"
            style={{ fontSize: width < 600 && title.length > 14 ? 28 : 34 }}
          >
            {title}
          </h1>
          {sub ? (
            <p className="mt-[1px] truncate text-[15px] leading-[20px] font-semibold tracking-[-0.01em] text-label-2">{sub}</p>
          ) : null}
        </div>
        {right ? <div className="pointer-events-auto mt-[2px] flex shrink-0 items-center gap-[8px]">{right}</div> : null}
      </div>
    </div>
  );
}

/** Title 3 section header with a chevron, as in Collections. */
export function SectionHeader({ title, onClick }: { title: string; onClick?: () => void }) {
  const inner = (
    <>
      <span>{title}</span>
      {onClick ? (
        <svg width="9" height="15" viewBox="0 0 9 15" aria-hidden="true" className="mt-[1px] text-label-3">
          <path d="m1.5 1.5 6 6-6 6" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </>
  );
  const cls = "flex items-center gap-[6px] px-[18px] pb-[10px] text-[21px] leading-[26px] font-bold tracking-[-0.01em] text-label";
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} text-left`}>
      {inner}
    </button>
  ) : (
    <h2 className={cls}>{inner}</h2>
  );
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
