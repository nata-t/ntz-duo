"use client";

import { useState } from "react";
import { profile } from "@/content/site";
import { useOS } from "@/lib/os";
import type { AppProps } from "../types";
import { Glyph, Rail, RailButton, Stack, contentBox, useMinute } from "../settings/ios";
import { NOTES, plain, type Note } from "./content";

// Notes, iPhone Duo style: the note list in a sidebar beside the open note
// on the inner display, a single stack in a half-width window. The notes
// are his real ones (from the site's content); new ones live until the
// window closes.

const SIDEBAR_W = 340;

type Draft = { id: string; title: string; body: string };

/** Notes' yellow: system yellow, deepened a touch on light for legibility. */
const accent = (dark: boolean) => (dark ? "#ffd60a" : "#e5b000");
/** The selected row's fill, dark enough for its white text on both. */
const highlight = (dark: boolean) => (dark ? "#c79c00" : "#e5b000");

const draftTitle = (d: Draft) => d.title.trim() || "New Note";

export default function Notes({ width, slot, mirror, close }: AppProps) {
  const dark = useOS((s) => s.dark);
  const compact = width < 600;
  const [selected, setSelected] = useState(compact ? "" : NOTES[0]!.id);
  const [hidden, setHidden] = useState(false);
  const [query, setQuery] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const minute = useMinute(!mirror);
  const box = contentBox(slot, width);
  const tint = accent(dark);

  const open = selected || (compact ? "" : NOTES[0]!.id);
  const compose = () => {
    const id = `draft-${Date.now()}`;
    setDrafts((d) => [{ id, title: "", body: "" }, ...d]);
    setSelected(id);
    setQuery("");
  };

  const list = (
    <NoteList
      selected={compact ? null : open}
      drafts={drafts}
      query={query}
      setQuery={setQuery}
      onSelect={setSelected}
      onHide={compact ? undefined : () => setHidden(true)}
      minute={minute}
      tint={tint}
      fill={highlight(dark)}
    />
  );
  const view = (id: string) => (
    <NoteView
      id={id}
      drafts={drafts}
      setDraft={(patch) => setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)))}
      checks={checks}
      toggle={(k, v) => setChecks((c) => ({ ...c, [k]: v }))}
      minute={minute}
      tint={tint}
      mirror={mirror}
      onShowList={!compact && hidden ? () => setHidden(false) : undefined}
    />
  );

  return (
    <div className="relative h-full bg-bg text-label">
      <div className="absolute inset-y-0 flex" style={{ left: box.left, width: box.width }}>
        {compact ? (
          <Stack
            keys={open ? ["list", open] : ["list"]}
            mirror={mirror}
            layer="bg-bg"
            className="w-full"
            render={(k) => (k === "list" ? <div className="h-full bg-grouped">{list}</div> : view(k))}
          />
        ) : (
          <>
            <aside
              className="h-full shrink-0 overflow-hidden border-r-[0.5px] border-sep bg-grouped transition-[width] duration-500 ease-ios"
              style={{ width: hidden ? 0 : SIDEBAR_W }}
              inert={hidden || undefined}
            >
              <div className="h-full" style={{ width: SIDEBAR_W }}>
                {list}
              </div>
            </aside>
            <div className="h-full min-w-0 flex-1">{view(open)}</div>
          </>
        )}
      </div>

      <Rail slot={slot}>
        {compact && selected ? (
          <RailButton label="Back to Notes" tint={tint} onClick={() => setSelected("")}>
            {Glyph.back}
          </RailButton>
        ) : (
          <RailButton label="Close Notes" onClick={close}>
            {Glyph.close}
          </RailButton>
        )}
        <RailButton label="New Note" tint={tint} onClick={compose}>
          {Glyph.compose}
        </RailButton>
      </Rail>
    </div>
  );
}

/* ------------------------------------------------------------------ List */

function NoteList({
  selected,
  drafts,
  query,
  setQuery,
  onSelect,
  onHide,
  minute,
  tint,
  fill,
}: {
  selected: string | null;
  drafts: Draft[];
  query: string;
  setQuery: (q: string) => void;
  onSelect: (id: string) => void;
  onHide?: () => void;
  minute: number | null;
  tint: string;
  fill: string;
}) {
  const q = query.trim().toLowerCase();
  const match = (text: string) => !q || text.toLowerCase().includes(q);
  const time = minute === null ? "" : hhmm(minute);

  type Item = { id: string; title: string; preview: string };
  const items: Item[] = [
    ...drafts.map((d) => ({ id: d.id, title: draftTitle(d), preview: d.body.replace(/\s+/g, " ").trim() || "No additional text" })),
    ...NOTES.filter((n) => !n.pinned).map((n) => ({ id: n.id, title: n.title, preview: plain(n) })),
  ].filter((i) => match(`${i.title} ${i.preview}`));
  const pinned = NOTES.filter((n) => n.pinned)
    .map((n) => ({ id: n.id, title: n.title, preview: plain(n) }))
    .filter((i) => match(`${i.title} ${i.preview}`));
  const total = NOTES.length + drafts.length;

  const section = (title: string, rows: Item[]) =>
    rows.length ? (
      <section className="mb-[18px]">
        <h3 className="px-[12px] pb-[6px] font-display text-[22px] leading-[28px] font-bold tracking-[-0.01em]">{title}</h3>
        <ul>
          {rows.map((r, i) => {
            const on = r.id === selected;
            // Hairlines between rows, but never touching the highlight.
            const sep = i > 0 && !on && rows[i - 1]!.id !== selected;
            return (
              <li key={r.id} className="relative">
                {sep ? <span className="absolute top-0 right-[12px] left-[12px] h-[0.5px] bg-sep" /> : null}
                <button
                  type="button"
                  onClick={() => onSelect(r.id)}
                  aria-current={on || undefined}
                  className={`relative z-[1] block w-full rounded-[12px] px-[12px] py-[10px] text-left transition-colors ${
                    on ? "text-white" : "hover:bg-fill-3 active:bg-fill-2"
                  }`}
                  style={{ background: on ? fill : undefined }}
                >
                  <span className="block truncate text-[17px] leading-[22px] font-semibold">{r.title}</span>
                  <span className={`mt-[1px] block truncate text-[15px] leading-[20px] ${on ? "text-white/85" : "text-label-2"}`}>
                    <span className={on ? "" : "text-label"}>{time}</span>
                    {time ? "  " : ""}
                    {r.preview}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    ) : null;

  return (
    <div className="relative flex h-full flex-col">
      {/* Top toolbar: sidebar toggle, then the folder's name. */}
      <div className="relative mt-[24px] flex h-[54px] shrink-0 items-center px-[16px]">
        {onHide ? (
          <button
            type="button"
            aria-label="Hide Sidebar"
            onClick={onHide}
            className="glass relative z-[1] grid size-[48px] place-items-center rounded-full"
            style={{ color: tint }}
          >
            {Glyph.sidebar}
          </button>
        ) : null}
        <h2 className="pointer-events-none absolute inset-x-0 text-center text-[17px] leading-[22px] font-semibold">Notes</h2>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-[8px] pt-[10px] pb-[96px]">
        {section("Pinned", pinned)}
        {section("Today", items)}
        {q && !pinned.length && !items.length ? (
          <p className="pt-[40px] text-center text-[17px] text-label-2">No Results for “{query.trim()}”</p>
        ) : null}
        {!q ? <p className="pt-[4px] text-center text-[13px] text-label-2">{total} Notes</p> : null}
      </div>

      {/* Bottom toolbar: search, floating over the list's end. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[96px] bg-gradient-to-t from-grouped via-grouped/80 to-transparent" />
      <label
        className="glass absolute right-[20px] bottom-[26px] left-[20px] flex h-[40px] items-center gap-[7px] rounded-full px-[13px] text-label-2"
      >
        {Glyph.search}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && query) {
              e.stopPropagation();
              setQuery("");
            }
          }}
          placeholder="Search"
          aria-label="Search Notes"
          className="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-[17px] text-label outline-none placeholder:text-label-2 [&::-webkit-search-cancel-button]:hidden"
        />
        {Glyph.mic}
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ Note */

const hhmm = (t: number) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: profile.timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(t));
const longDate = (t: number) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: profile.timezone, day: "numeric", month: "long", year: "numeric" }).format(new Date(t));

function NoteView({
  id,
  drafts,
  setDraft,
  checks,
  toggle,
  minute,
  tint,
  mirror,
  onShowList,
}: {
  id: string;
  drafts: Draft[];
  setDraft: (patch: Partial<Draft>) => void;
  checks: Record<string, boolean>;
  toggle: (k: string, v: boolean) => void;
  minute: number | null;
  tint: string;
  mirror: boolean;
  onShowList?: () => void;
}) {
  const note: Note | undefined = NOTES.find((n) => n.id === id);
  const draft = drafts.find((d) => d.id === id);
  const stamp = minute === null ? "" : `${longDate(minute)} at ${hhmm(minute)}`;

  return (
    <div className="relative h-full bg-bg">
      <div className="no-scrollbar h-full overflow-y-auto overscroll-contain">
        <article className="mx-auto max-w-[620px] px-[28px] pt-[86px] pb-[64px]">
          <p className="mb-[18px] text-center text-[13px] leading-[18px] text-label-2">{stamp || " "}</p>
          {draft ? (
            <>
              {/* Notes makes the first line the title; here it's its own field. */}
              <input
                value={draft.title}
                onChange={(e) => setDraft({ title: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  e.currentTarget.parentElement?.querySelector("textarea")?.focus();
                }}
                autoFocus={!mirror}
                placeholder="Title"
                aria-label="Title"
                className="mb-[14px] block w-full appearance-none border-0 bg-transparent p-0 font-display text-[28px] leading-[34px] font-bold tracking-[0.005em] text-label outline-none select-text placeholder:text-label-3"
                style={{ caretColor: tint }}
              />
              <textarea
                value={draft.body}
                onChange={(e) => setDraft({ body: e.target.value })}
                placeholder="Note"
                aria-label="Note"
                rows={14}
                className="block w-full resize-none appearance-none border-0 bg-transparent p-0 text-[17px] leading-[25px] tracking-[-0.022em] text-label outline-none select-text placeholder:text-label-3"
                style={{ caretColor: tint }}
              />
            </>
          ) : note ? (
            <>
              <h1 className="mb-[14px] font-display text-[28px] leading-[34px] font-bold tracking-[0.005em]">{note.title}</h1>
              <div className="text-[17px] leading-[25px] tracking-[-0.022em] select-text">
                {note.blocks.map((b, i) => {
                  if (b.t === "h")
                    return (
                      <h2 key={i} className="mt-[22px] mb-[4px] font-display text-[22px] leading-[28px] font-bold tracking-[-0.01em] first:mt-0">
                        {b.text}
                      </h2>
                    );
                  if (b.t === "meta")
                    return (
                      <p key={i} className="text-[15px] leading-[22px] text-label-2">
                        {b.text}
                      </p>
                    );
                  if (b.t === "check") {
                    const done = checks[b.id] ?? b.done;
                    return (
                      <button
                        key={i}
                        type="button"
                        role="checkbox"
                        aria-checked={done}
                        onClick={() => toggle(b.id, !done)}
                        className="flex w-full items-center gap-[12px] py-[5px] text-left"
                      >
                        <span
                          className="grid size-[22px] shrink-0 place-items-center rounded-full transition-colors duration-200"
                          style={done ? { background: tint } : { boxShadow: "inset 0 0 0 1.5px var(--label-3)" }}
                        >
                          {done ? (
                            <svg width="11" height="9" viewBox="0 0 11 9" aria-hidden="true">
                              <path d="m1.2 4.6 2.9 2.9L9.8 1.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : null}
                        </span>
                        <span className={done ? "text-label-2" : ""}>{b.text}</span>
                      </button>
                    );
                  }
                  return (
                    <p key={i} className={`mt-[8px] first:mt-0 ${b.strong ? "font-semibold" : ""}`}>
                      {b.text}
                    </p>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="pt-[120px] text-center text-[17px] text-label-2">No Note Selected</p>
          )}
        </article>
      </div>

      {/* Soft edge under the top of the window, where the toolbar would be. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70px] bg-gradient-to-b from-bg via-bg/85 to-transparent" />
      {onShowList ? (
        <button
          type="button"
          aria-label="Show Sidebar"
          onClick={onShowList}
          className="glass absolute top-[24px] left-[16px] grid size-[48px] place-items-center rounded-full"
          style={{ color: tint }}
        >
          {Glyph.sidebar}
        </button>
      ) : null}
    </div>
  );
}
