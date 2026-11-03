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
const DEFAULT = "display";

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

/** A detail pane: an inline title over the content, which scrolls under a
 *  soft edge rather than a hard bar. */
function Pane({ id }: { id: string }) {
  const page = PAGES[id];
  if (!page) return null;
  const { Body } = page;
  return (
    <div className="relative h-full">
      <div className="no-scrollbar h-full overflow-y-auto overscroll-contain px-[20px] pt-[84px] pb-[48px]">
        <Body />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[92px]"
        style={{ background: "linear-gradient(var(--grouped) 52%, transparent)" }}
      />
      <h2 className="pointer-events-none absolute inset-x-[64px] top-[24px] grid h-[54px] place-items-center truncate text-[17px] leading-[22px] font-semibold">
        {page.title}
      </h2>
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

  // Open with the selected pane's row in view, as iPad Settings does.
  useEffect(() => {
    const el = scroller.current;
    const row = el?.querySelector<HTMLElement>("[aria-current]");
    if (!el || !row) return;
    // Layout offsets, not screen rects: the window is mid-launch and scaled.
    el.scrollTop = Math.max(0, row.offsetTop - el.clientHeight / 2);
    // Only on first show; after that the list stays where it's put.
  }, []);

  const value = (id: string) =>
    id === "wifi" ? (off || !local.wifi ? "Off" : "ntz-home") : id === "bluetooth" ? (off || !local.bluetooth ? "Off" : "On") : undefined;

  return (
    <div ref={scroller} className="no-scrollbar relative h-full overflow-y-auto overscroll-contain px-[16px] pb-[48px]">
      <h1 className="px-[4px] pt-[34px] pb-[10px] font-display text-[34px] leading-[41px] font-bold tracking-[0.01em]">Settings</h1>

      <label className="mb-[18px] flex h-[38px] items-center gap-[7px] rounded-full bg-fill-3 px-[12px] text-label-2">
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
          className="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-[17px] text-label outline-none placeholder:text-label-2 [&::-webkit-search-cancel-button]:hidden"
        />
        {Glyph.mic}
      </label>

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
              aria-current={selected === "profile" || undefined}
              className={`flex w-full items-center gap-[14px] py-[12px] pr-[16px] pl-[12px] text-left transition-colors ${
                selected === "profile" ? "bg-blue text-white" : "hover:bg-fill-3 active:bg-fill-2"
              }`}
            >
              <Avatar size={58} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[20px] leading-[25px] font-semibold tracking-[-0.01em]">{profile.name}</span>
                <span className={`block truncate text-[13px] leading-[18px] ${selected === "profile" ? "text-white/80" : "text-label-2"}`}>
                  Software Engineer · Addis Ababa
                </span>
              </span>
              {compact ? <span className="text-label-3">{Glyph.chevron}</span> : null}
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
  );
}
