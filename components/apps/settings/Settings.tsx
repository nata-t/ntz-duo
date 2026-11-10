"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { profile } from "@/content/site";
import type { AppProps } from "../types";
import { Glyph, Rail, RailButton, Stack, Toggle, contentBox } from "./ios";
import { Avatar, Group, Row } from "./list";
import { PAGES, SIDEBAR, SettingsCtx, pathTo, type Ctx, type Local } from "./pages";

// Settings, as on iPad and the open iPhone Duo: a sidebar of panes beside
// the one you picked. In a half-width window it folds into a single
// navigation stack, the way the outer display shows it.

const SIDEBAR_W = 340;
const DEFAULT = "appearance";

export default function Settings({ width, slot, mirror, close }: AppProps) {
  const compact = width < 600;
  const [path, setPath] = useState<string[]>(compact ? [] : [DEFAULT]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ airplane: false, wifi: true, bluetooth: true });
  const box = contentBox(slot, width);

  // In the split layout something is always selected.
  const detail = path.length ? path : [DEFAULT];
  const canBack = compact ? path.length > 0 : detail.length > 1;

  const ctx = useMemo<Ctx>(() => {
    const local: Local = { ...state, set: (p) => setState((s) => ({ ...s, ...p })) };
    return { go: (id) => setPath((p) => [...(p.length || compact ? p : [DEFAULT]), id]), mirror, local };
  }, [state, compact, mirror]);

  const select = (id: string) => setPath(pathTo(id));
  const sidebar = (
    <Sidebar
      compact={compact}
      selected={compact ? null : detail[0]!}
      query={query}
      setQuery={setQuery}
      local={ctx.local}
      onSelect={select}
    />
  );

  return (
    <SettingsCtx.Provider value={ctx}>
      <div className="relative h-full bg-grouped text-label">
        <div className="absolute inset-y-0 flex" style={{ left: box.left, width: box.width }}>
          {compact ? (
            <Stack
              keys={["root", ...path]}
              mirror={mirror}
              layer="bg-grouped"
              className="w-full"
              render={(k) => (k === "root" ? sidebar : <Pane id={k} />)}
            />
          ) : (
            <>
              <aside className="h-full shrink-0 border-r-[0.5px] border-sep" style={{ width: SIDEBAR_W }}>
                {sidebar}
              </aside>
              <Stack keys={detail} mirror={mirror} layer="bg-grouped" className="min-w-0 flex-1" render={(k) => <Pane id={k} />} />
            </>
          )}
        </div>

        <Rail slot={slot}>
          {canBack ? (
            <RailButton label="Back" onClick={() => setPath((p) => p.slice(0, -1))}>
              {Glyph.back}
            </RailButton>
          ) : (
            <RailButton label="Close Settings" onClick={close}>
              {Glyph.close}
            </RailButton>
          )}
        </Rail>
      </div>
    </SettingsCtx.Provider>
  );
}

/** A detail pane: an inline title over the content, which scrolls under
 *  iOS 26's scroll-edge effect (a soft blur and fade) rather than a bar. */
function Pane({ id }: { id: string }) {
  const [under, setUnder] = useState(false);
  const page = PAGES[id];
  if (!page) return null;
  const { Body } = page;
  return (
    <div className="relative h-full">
      <div
        onScroll={(e) => {
          const u = e.currentTarget.scrollTop > 4;
          if (u !== under) setUnder(u);
        }}
        className="no-scrollbar h-full overflow-y-auto overscroll-contain px-[20px] pt-[84px] pb-[48px]"
      >
        <Body />
      </div>
      <TopEdge hidden={!under} />
      <h2 className="pointer-events-none absolute inset-x-[64px] top-[24px] grid h-[54px] place-items-center truncate text-[17px] leading-[22px] font-semibold tracking-[-0.022em]">
        {page.title}
      </h2>
    </div>
  );
}

/** The top scroll edge under an inline title: iOS 27's more defined band
 *  (the view's colour, fading out) with the soft blur-and-fade below it. */
function TopEdge({ hidden }: { hidden?: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 top-0 h-[112px] transition-opacity duration-200 ${hidden ? "opacity-0" : ""}`}>
      <div className="absolute inset-x-0 top-0 h-[80px] bg-[linear-gradient(var(--grouped)_45%,transparent)]" />
      <div className="scroll-edge-top absolute inset-0 [--edge:var(--grouped)]" />
    </div>
  );
}

function Sidebar({
  compact,
  selected,
  query,
  setQuery,
  local,
  onSelect,
}: {
  compact: boolean;
  selected: string | null;
  query: string;
  setQuery: (q: string) => void;
  local: Local;
  onSelect: (id: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const results = q
    ? Object.entries(PAGES).filter(([, p]) => `${p.title} ${p.keywords ?? ""}`.toLowerCase().includes(q))
    : [];
  const off = local.airplane;
  const scroller = useRef<HTMLDivElement>(null);

  // Open at the top, as iPad Settings does, unless that leaves the selected
  // pane's row hidden under the search capsule: then scroll just enough.
  useEffect(() => {
    const el = scroller.current;
    const row = el?.querySelector<HTMLElement>("[aria-current]");
    if (!el || !row) return;
    // Layout offsets, not screen rects: the window is mid-launch and scaled.
    // (The scroller is positioned, so it's the row's offsetParent.)
    const bottom = row.offsetTop + row.offsetHeight;
    el.scrollTop = Math.max(0, bottom - (el.clientHeight - 128));
    // Only on first show; after that the list stays where it's put.
  }, []);

  const value = (id: string) =>
    id === "wifi" ? (off || !local.wifi ? "Off" : "ntz-home") : id === "bluetooth" ? (off || !local.bluetooth ? "Off" : "On") : undefined;

  // The large title scrolls away and an inline one takes its place, over
  // the scroll-edge effect, once the list has moved under the top edge.
  const [scroll, setScroll] = useState({ under: false, inline: false });
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const y = e.currentTarget.scrollTop;
    const next = { under: y > 4, inline: y > 52 };
    if (next.under !== scroll.under || next.inline !== scroll.inline) setScroll(next);
  };
  const account = selected === "profile";

  return (
    <div className="relative h-full">
      <div ref={scroller} onScroll={onScroll} className="no-scrollbar relative h-full overflow-y-auto overscroll-contain px-[16px] pb-[112px]">
        <h1 className="px-[4px] pt-[34px] pb-[12px] font-display text-[34px] leading-[41px] font-bold tracking-[0.011em]">Settings</h1>

        {q ? (
          results.length ? (
            <Group>
              {results.map(([id, p]) => {
                const parent = p.parent ? PAGES[p.parent] : undefined;
                return (
                  <Row
                    key={id}
                    icon={p.icon ?? parent?.icon}
                    title={p.title}
                    sub={parent?.title}
                    chevron={compact}
                    selected={!compact && selected === pathTo(id)[0] && pathTo(id).length === 1}
                    onClick={() => onSelect(id)}
                  />
                );
              })}
            </Group>
          ) : (
            <p className="pt-[40px] text-center text-[17px] text-label-2">No Results for “{query.trim()}”</p>
          )
        ) : (
          <>
            <Group>
              <button
                type="button"
                onClick={() => onSelect("profile")}
                aria-current={account || undefined}
                className={`relative flex w-full items-center gap-[14px] py-[13px] pr-[16px] pl-[14px] text-left transition-colors ${
                  account ? "text-white" : "hover:bg-fill-3 active:bg-fill-2"
                }`}
              >
                {account ? <span aria-hidden className="absolute inset-[6px] rounded-[20px] bg-blue" /> : null}
                <span className="relative">
                  <Avatar size={60} />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block truncate text-[20px] leading-[25px] font-semibold tracking-[-0.02em]">{profile.name}</span>
                  <span className={`mt-[1px] block truncate text-[13px] leading-[18px] ${account ? "text-white/80" : "text-label-2"}`}>
                    Apple Account, iCloud, and more
                  </span>
                </span>
                {compact ? <span className="relative text-label-3">{Glyph.chevron}</span> : null}
              </button>
            </Group>

            {SIDEBAR.map((group, i) => (
              <Group key={i}>
                {group.map((id) =>
                  id === "airplane" ? (
                    <Row
                      key={id}
                      icon="airplane"
                      title="Airplane Mode"
                      accessory={<Toggle on={local.airplane} label="Airplane Mode" onChange={(v) => local.set({ airplane: v })} />}
                    />
                  ) : (
                    <Row
                      key={id}
                      icon={PAGES[id]!.icon}
                      title={PAGES[id]!.title}
                      value={value(id)}
                      chevron={compact}
                      selected={selected === id}
                      onClick={() => onSelect(id)}
                    />
                  ),
                )}
              </Group>
            ))}
          </>
        )}
      </div>

      <TopEdge hidden={!scroll.under} />
      <p
        aria-hidden
        className={`pointer-events-none absolute inset-x-[48px] top-[24px] grid h-[54px] place-items-center truncate text-[17px] leading-[22px] font-semibold tracking-[-0.022em] transition-[opacity,translate] duration-200 ease-ios ${
          scroll.inline ? "" : "translate-y-[4px] opacity-0"
        }`}
      >
        Settings
      </p>

      {/* Search floats at the bottom in a glass capsule, over the list's
          bottom scroll edge, as in iOS 26 Settings. */}
      <div className="scroll-edge-bottom absolute inset-x-0 bottom-0 h-[104px] [--edge:var(--grouped)]" />
      <label className="glass absolute inset-x-[16px] bottom-[28px] z-10 flex h-[48px] items-center gap-[8px] rounded-full px-[16px] text-label-2">
        {Glyph.search}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Escape clears the field instead of closing the window.
            if (e.key === "Escape" && query) {
              e.stopPropagation();
              setQuery("");
            }
          }}
          placeholder="Search"
          aria-label="Search Settings"
          className="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-[17px] tracking-[-0.022em] text-label outline-none placeholder:text-label-2 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear Search"
            onClick={() => setQuery("")}
            className="grid size-[20px] place-items-center rounded-full bg-label-3 text-grouped-2"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
              <path d="m1 1 6 6m0-6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        ) : (
          Glyph.mic
        )}
      </label>
    </div>
  );
}
