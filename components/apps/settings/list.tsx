"use client";

import type { ReactNode } from "react";
import { Glyph } from "./ios";
import { SettingsIcon, type IconName } from "./icons";

// Inset grouped lists, iOS 26/27 style: rounded cards on the grouped
// background, hairlines inset to the text, uppercase footnote headers.

export function Group({ children, header, footer }: { children: ReactNode; header?: ReactNode; footer?: ReactNode }) {
  return (
    <section className="mb-[26px]">
      {header ? (
        <h3 className="mb-[7px] px-[16px] text-[13px] leading-[18px] tracking-[-0.005em] text-label-2 uppercase">{header}</h3>
      ) : null}
      <div className="overflow-hidden rounded-[24px] bg-grouped-2">{children}</div>
      {footer ? <p className="mt-[7px] px-[16px] text-[13px] leading-[18px] tracking-[-0.005em] text-label-2">{footer}</p> : null}
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
  selected?: boolean;
  /** Blue text, for rows that act rather than navigate. */
  action?: boolean;
};

export function Row({ icon, title, sub, value, chevron, accessory, onClick, selected, action }: RowProps) {
  const inset = icon ? 58 : 16;
  const body = (
    <>
      <span data-sep className="absolute top-0 right-0 h-[0.5px] bg-sep" style={{ left: inset }} />
      {icon ? <SettingsIcon name={icon} /> : null}
      <span className="min-w-0 flex-1 py-[12px]">
        <span className={`block truncate text-[17px] leading-[22px] ${action ? "text-blue" : ""}`}>{title}</span>
        {sub ? (
          <span className={`mt-[1px] block text-[13px] leading-[17px] ${selected ? "text-white/80" : "text-label-2"}`}>{sub}</span>
        ) : null}
      </span>
      {value !== undefined ? (
        <span className={`max-w-[60%] shrink-0 truncate text-right text-[17px] leading-[22px] ${selected ? "text-white/85" : "text-label-2"}`}>
          {value}
        </span>
      ) : null}
      {accessory}
      {chevron ? <span className={`shrink-0 ${selected ? "text-white/80" : "text-label-3"}`}>{Glyph.chevron}</span> : null}
    </>
  );
  const cls = `relative flex min-h-[48px] w-full items-center gap-[12px] pr-[16px] text-left first:[&>[data-sep]]:hidden ${
    selected ? "bg-blue text-white [&+*>[data-sep]]:hidden [&>[data-sep]]:hidden" : ""
  }`;
  const style = { paddingLeft: icon ? 14 : 16 };
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
      className="relative block shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, background: "linear-gradient(180deg,#dfe3ec 0%,#aab3c5 100%)" }}
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
