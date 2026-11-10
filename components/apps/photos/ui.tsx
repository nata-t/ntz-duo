"use client";

import { forwardRef } from "react";
import { CheckIcon } from "./icons";

// Small shared pieces of Photos chrome.

/** The side rail is 84 pt on the window's outer edge (Duo UI kit). */
export const RAIL = 84;
/** Height the large-title header takes over the top of a scroll view. */
export const HEADER = 92;

/** Where the chrome sits, so each pane can run its content under it.
 *  Panes are full width; these insets keep text and controls clear. */
export type Frame = {
  /** Landscape and wide: chrome on a vertical rail. Otherwise top and bottom bars. */
  rail: boolean;
  /** Left and right insets for text (the rail's width on its side). */
  l: number;
  r: number;
  /** Top inset (the portrait status bar). */
  t: number;
  /** Bottom inset (the floating tab bar in compact layouts). */
  b: number;
  /** Right inset of the title row's controls (clear of the status bar). */
  tr: number;
};

/** Top of the scroll content under a large title (and an optional nav row). */
export const headerH = (f: Frame, nav = false) => f.t + HEADER + (nav ? 46 : 0);

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: number; wide?: boolean; clear?: boolean };

/** A Liquid Glass control: a circle for a symbol, a capsule for a word.
 *  Pressed, it swells a little rather than shrinking. */
export const GlassButton = forwardRef<HTMLButtonElement, BtnProps>(function GlassButton(
  { size = 40, wide, clear, className = "", style, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={`${clear ? "glass-clear text-white" : "glass text-label"} grid shrink-0 place-items-center rounded-full transition-[scale,opacity] duration-300 ease-ios active:scale-110 disabled:opacity-40 ${wide ? "px-[16px] text-[15px] font-semibold tracking-[-0.01em]" : ""} ${className}`}
      style={{ height: size, minWidth: size, ...style }}
    >
      {children}
    </button>
  );
});

/** iOS 26 large title floating over the top of the content, on the soft
 *  scroll edge: the content blurs and fades into the background under it. */
export function LargeTitle({
  title,
  sub,
  right,
  nav,
  frame,
  width,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
  /** A row above the title (the back button in compact layouts). */
  nav?: React.ReactNode;
  frame: Frame;
  width: number;
}) {
  const top = headerH(frame, !!nav);
  const room = width - frame.l - frame.tr - 18;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10" style={{ height: top + 30 }}>
      {/* The scroll edge: content softly blurs and fades into the
          background under the title, a defined band where the text sits. */}
      <div className="absolute inset-0 scroll-edge-top" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--bg)_95%,transparent)_0%,color-mix(in_srgb,var(--bg)_88%,transparent)_66%,transparent_100%)]" />
      {nav ? (
        <div className="pointer-events-auto absolute flex items-center gap-[8px]" style={{ left: frame.l + 16, top: frame.t + 14 }}>
          {nav}
        </div>
      ) : null}
      <div
        className="absolute flex items-start justify-between gap-[12px]"
        style={{ left: frame.l + 18, right: frame.tr, top: frame.t + (nav ? 66 : 22) }}
      >
        <div className="min-w-0">
          <h1
            className={`truncate font-display leading-[40px] font-bold tracking-[0.005em] text-label ${room < 420 && title.length > 12 ? "text-[28px]" : "text-[34px]"}`}
          >
            {title}
          </h1>
          {sub ? (
            <p className="mt-[-1px] truncate text-[15px] leading-[20px] font-semibold tracking-[-0.01em] text-label-2">{sub}</p>
          ) : null}
        </div>
        {right ? <div className="pointer-events-auto mt-[2px] flex shrink-0 items-center gap-[8px]">{right}</div> : null}
      </div>
    </div>
  );
}

/** Title 3 section header with a chevron, as in Collections. */
export function SectionHeader({ title, onClick, inset = 0 }: { title: string; onClick?: () => void; inset?: number }) {
  const inner = (
    <>
      <span>{title}</span>
      {onClick ? (
        <svg width="9" height="15" viewBox="0 0 9 15" aria-hidden="true" className="mt-[1px] text-label-2">
          <path d="m1.5 1.5 6 6-6 6" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </>
  );
  const cls = "flex items-center gap-[7px] pr-[18px] pb-[10px] text-[21px] leading-[26px] font-bold tracking-[-0.01em] text-label";
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} text-left transition-opacity hover:opacity-70`} style={{ paddingLeft: inset + 18 }}>
      {inner}
    </button>
  ) : (
    <h2 className={cls} style={{ paddingLeft: inset + 18 }}>
      {inner}
    </h2>
  );
}

/** A menu that blooms out of the button that opened it (radius 32,
 *  leading symbols). `origin` is the corner it grows from. */
export function Menu({
  children,
  onClose,
  className = "",
  style,
  dark,
}: {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
  /** Over the viewer's black stage. */
  dark?: boolean;
}) {
  return (
    <>
      <button type="button" aria-label="Close menu" className="pointer-events-auto absolute inset-0 z-30 cursor-default" onClick={onClose} />
      <div
        role="menu"
        className={`pointer-events-auto absolute z-40 w-[244px] overflow-hidden rounded-[32px] p-[6px] animate-bloom motion-reduce:animate-none ${
          dark ? "glass-clear text-white [--glass-clear-dim:rgba(30,30,32,0.72)]" : "glass bg-(--glass-strong) text-label"
        } ${className}`}
        style={style}
      >
        {children}
      </div>
    </>
  );
}

export function MenuItem({
  label,
  icon,
  checked,
  disabled,
  onClick,
  href,
  download,
}: {
  label: string;
  icon?: React.ReactNode;
  checked?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  download?: boolean;
}) {
  const cls =
    "flex h-[44px] w-full items-center gap-[12px] rounded-full px-[14px] text-left text-[17px] tracking-[-0.02em] transition-colors hover:bg-[color-mix(in_srgb,currentColor_10%,transparent)] disabled:pointer-events-none disabled:opacity-35";
  const inner = (
    <>
      <span className="grid w-[22px] shrink-0 place-items-center">{checked ? <CheckIcon size={20} /> : icon}</span>
      <span className="flex-1 truncate">{label}</span>
    </>
  );
  if (href)
    return (
      <a role="menuitem" href={href} target={download ? undefined : "_blank"} rel="noreferrer" download={download ? "" : undefined} onClick={onClick} className={cls}>
        {inner}
      </a>
    );
  return (
    <button
      type="button"
      role={checked === undefined ? "menuitem" : "menuitemcheckbox"}
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={cls}
    >
      {inner}
    </button>
  );
}

export const MenuSep = () => <div className="mx-[14px] my-[4px] h-px bg-[color-mix(in_srgb,currentColor_14%,transparent)]" />;

/** iOS 26 segmented control: a glass capsule, no separators, the selected
 *  segment on a pill inset 2 pt that springs between segments. */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
  className = "",
  style,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const i = Math.max(0, items.findIndex((it) => it.id === value));
  const seg = 82;
  return (
    <div role="tablist" aria-label={label} className={`glass flex h-[40px] rounded-full p-[3px] ${className || "relative"}`} style={style}>
      <span
        aria-hidden="true"
        className="absolute top-[3px] bottom-[3px] left-[3px] rounded-full bg-fill shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-[translate] duration-500 ease-[cubic-bezier(0.3,1.45,0.45,1)] motion-reduce:transition-none"
        style={{ width: seg, translate: `${i * (seg + 2)}px 0` }}
      />
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={it.id === value}
          onClick={() => onChange(it.id)}
          className={`relative grid h-full place-items-center rounded-full text-[15px] tracking-[-0.01em] transition-colors not-last:mr-[2px] ${it.id === value ? "font-semibold text-label" : "font-medium text-label-2 hover:text-label"}`}
          style={{ width: seg }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
