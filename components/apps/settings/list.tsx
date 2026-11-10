"use client";

import type { ReactNode } from "react";
import { Glyph } from "./ios";
import { SettingsIcon, type IconName } from "./icons";

// Inset grouped lists, iOS 26/27 style: 26 pt continuous-radius cards on
// the grouped background, 52 pt rows, hairlines inset to the text that stop
// 16 pt short of the trailing edge, and sentence-case section headers.

export function Group({ children, header, footer }: { children: ReactNode; header?: ReactNode; footer?: ReactNode }) {
  return (
    <section className="mb-[24px]">
      {header ? (
        <h3 className="mb-[8px] px-[16px] text-[15px] leading-[20px] font-semibold tracking-[-0.01em] text-label-2">{header}</h3>
      ) : null}
      <div className="overflow-hidden rounded-[26px] bg-grouped-2">{children}</div>
      {footer ? <p className="mt-[8px] px-[16px] text-[13px] leading-[18px] tracking-[-0.005em] text-label-2">{footer}</p> : null}
    </section>
  );
}

type RowProps = {
  icon?: IconName;
  title: ReactNode;
  sub?: ReactNode;
  value?: ReactNode;
  chevron?: boolean;
  accessory?: ReactNode;
  onClick?: () => void;
  /** The sidebar's current pane: a rounded pill, as in the iOS 27 sidebar. */
  selected?: boolean;
  /** Blue text, for rows that act rather than navigate. */
  action?: boolean;
};

/** Leading padding, icon tile and the gap after it: where the text starts. */
const PAD = 16;
const TILE = 30;
const GAP = 14;

export function Row({ icon, title, sub, value, chevron, accessory, onClick, selected, action }: RowProps) {
  const inset = icon ? PAD + TILE + GAP : PAD;
  const body = (
    <>
      <span data-sep className="absolute top-0 right-[16px] h-[0.5px] bg-sep" style={{ left: inset }} />
      {selected ? <span aria-hidden className="absolute inset-x-[6px] inset-y-[4px] rounded-full bg-blue" /> : null}
      {icon ? (
        <span className={`relative rounded-[8px] ${selected ? "shadow-[0_0_0_1px_rgba(255,255,255,0.55)]" : ""}`}>
          <SettingsIcon name={icon} size={TILE} />
        </span>
      ) : null}
      <span className="relative min-w-0 flex-1 py-[14px]">
        <span className={`block truncate text-[17px] leading-[22px] tracking-[-0.022em] ${action ? "text-blue" : ""}`}>{title}</span>
        {sub ? (
          <span className={`mt-[1px] block text-[13px] leading-[17px] ${selected ? "text-white/80" : "text-label-2"}`}>{sub}</span>
        ) : null}
      </span>
      {value !== undefined ? (
        <span
          className={`relative max-w-[60%] shrink-0 truncate text-right text-[17px] leading-[22px] tracking-[-0.022em] ${
            selected ? "text-white/85" : "text-label-2"
          }`}
        >
          {value}
        </span>
      ) : null}
      {accessory}
      {chevron ? <span className={`relative shrink-0 ${selected ? "text-white/80" : "text-label-3"}`}>{Glyph.chevron}</span> : null}
    </>
  );
  // The hairline above a row hides on the first row, on the selected row
  // and on the row after it, so the pill floats clear of lines.
  const cls = `relative flex min-h-[52px] w-full items-center pr-[16px] text-left first:[&>[data-sep]]:hidden ${
    selected ? "text-white [&+*>[data-sep]]:hidden [&>[data-sep]]:hidden" : ""
  }`;
  const style = { paddingLeft: PAD, gap: icon ? GAP : 12 };
  if (!onClick)
    return (
      <div className={cls} style={style}>
        {body}
      </div>
    );
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected || undefined}
      className={`${cls} transition-colors duration-150 ${selected ? "" : "hover:bg-fill-3 active:bg-fill-2"}`}
      style={style}
    >
      {body}
    </button>
  );
}

/** The portrait in a circle, the way an Apple Account shows its photo. */
export function Avatar({ size }: { size: number }) {
  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full bg-[linear-gradient(180deg,#dfe3ec_0%,#aab3c5_100%)]"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static, pre-sized assets */}
      <img
        src="/portrait/source.webp"
        alt=""
        draggable={false}
        className="absolute left-1/2 max-w-none -translate-x-1/2"
        style={{ width: size * 1.12, top: size * 0.06 }}
      />
    </span>
  );
}
