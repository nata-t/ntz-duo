"use client";

import { CollectionsIcon, LibraryIcon, SearchIcon } from "./icons";
import { GlassButton } from "./ui";

export type Tab = "library" | "collections" | "search";

const TABS: { id: Exclude<Tab, "search">; label: string; Icon: typeof LibraryIcon }[] = [
  { id: "library", label: "Library", Icon: LibraryIcon },
  { id: "collections", label: "Collections", Icon: CollectionsIcon },
];

/** The pill's spring: a quick move with a little overshoot, like iOS 26's
 *  selection lens settling on its tab. */
const SPRING = "transition-[translate,opacity,scale] duration-[550ms] ease-[cubic-bezier(0.28,1.5,0.45,1)] motion-reduce:transition-none";

/** Library | Collections on one glass capsule, the selected tab on a grey
 *  pill. Vertical on the Duo's side rail, a floating bar otherwise. */
export function TabBar({ tab, onTab, vertical }: { tab: Tab; onTab: (t: Tab) => void; vertical?: boolean }) {
  const i = TABS.findIndex((t) => t.id === tab);
  const on = i >= 0;
  // Rail: 40 × 50 cells in a 48 pt capsule. Bar: 92 × 54 cells, 62 pt tall.
  const cw = vertical ? 40 : 92, ch = vertical ? 50 : 54;
  return (
    <div
      role="tablist"
      aria-label="Photos"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      className={`glass relative flex shrink-0 gap-[2px] rounded-full p-[4px] ${vertical ? "flex-col" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-[4px] left-[4px] rounded-full bg-fill-2 ${SPRING} ${on ? "" : "scale-75 opacity-0"}`}
        style={{ width: cw, height: ch, translate: vertical ? `0 ${Math.max(0, i) * (ch + 2)}px` : `${Math.max(0, i) * (cw + 2)}px 0` }}
      />
      {TABS.map(({ id, label, Icon }) => {
        const sel = tab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={sel}
            aria-label={label}
            title={label}
            onClick={() => onTab(id)}
            className={`relative flex flex-col items-center justify-center gap-[1px] rounded-full transition-[color,scale] duration-300 ease-ios active:scale-110 ${sel ? "text-blue" : "text-label"}`}
            style={{ width: cw, height: ch }}
          >
            <Icon size={vertical ? 25 : 26} />
            {vertical ? null : <span className="text-[10px] leading-[12px] font-semibold tracking-[0.01em]">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** The separate search circle at the end of the tab bar. */
export function SearchButton({ on, onClick, size }: { on: boolean; onClick: () => void; size: number }) {
  return (
    <GlassButton size={size} aria-label="Search" title="Search" aria-pressed={on} onClick={onClick} className={on ? "!text-blue" : ""}>
      <SearchIcon size={size > 52 ? 24 : 21} />
    </GlassButton>
  );
}

/** The tab bar minimized to one circle while Library scrolls back in time. */
export function TabCircle({ tab, onClick }: { tab: Tab; onClick: () => void }) {
  const t = TABS.find((x) => x.id === tab) ?? TABS[0]!;
  return (
    <GlassButton size={62} aria-label={`${t.label}: show tabs`} title={t.label} onClick={onClick} className="!text-blue animate-bloom origin-left motion-reduce:animate-none">
      <t.Icon size={26} />
    </GlassButton>
  );
}
