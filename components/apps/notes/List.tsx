"use client";

import { useState } from "react";
import { Glyph } from "../settings/ios";
import { NOTES, plain } from "./content";
import { NoteGlyph } from "./glyphs";
import { hhmm, type Draft, draftTitle } from "./shared";

type Item = { id: string; title: string; preview: string };

/**
 * The note list, iOS 26: the folder's name as a large title that folds into
 * an inline one as you scroll, notes in inset-grouped cards by date, and a
 * floating glass search capsule at the bottom. The open note's row (in the
 * sidebar) is a gold pill inside its card.
 */
export function NoteList({
  selected,
  drafts,
  query,
  setQuery,
  onSelect,
  minute,
  tint,
  fill,
  mirror,
}: {
  selected: string | null;
  drafts: Draft[];
  query: string;
  setQuery: (q: string) => void;
  onSelect: (id: string) => void;
  minute: number | null;
  tint: string;
  fill: string;
  mirror: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [folded, setFolded] = useState<Record<string, boolean>>({});
  const q = query.trim().toLowerCase();
  const match = (i: Item) => !q || `${i.title} ${i.preview}`.toLowerCase().includes(q);
  const time = minute === null ? "" : hhmm(minute);

  const today: Item[] = [
    ...drafts.map((d) => ({ id: d.id, title: draftTitle(d), preview: d.body.replace(/\s+/g, " ").trim() || "No additional text" })),
    ...NOTES.filter((n) => !n.pinned).map((n) => ({ id: n.id, title: n.title, preview: plain(n) })),
  ].filter(match);
  const pinned = NOTES.filter((n) => n.pinned)
    .map((n) => ({ id: n.id, title: n.title, preview: plain(n) }))
    .filter(match);
  const total = NOTES.length + drafts.length;

  const section = (title: string, rows: Item[]) => {
    if (!rows.length) return null;
    // Searching shows every match, folded or not.
    const shut = !q && folded[title];
    return (
      <section className="mb-[22px]">
        <h3>
          <button
            type="button"
            aria-expanded={!shut}
            onClick={() => setFolded((f) => ({ ...f, [title]: !f[title] }))}
            className="flex items-center gap-[7px] px-[4px] pb-[8px] font-display text-[20px] leading-[25px] font-bold tracking-[-0.012em]"
          >
            {title}
            <span
              className="transition-transform duration-300 ease-ios"
              style={{ color: tint, transform: shut ? "rotate(-90deg)" : undefined }}
            >
              {NoteGlyph.chevronDown}
            </span>
          </button>
        </h3>
        {shut ? null : (
          <ul className="rounded-[26px] bg-grouped-2 py-[6px]">
            {rows.map((r, i) => {
              const on = r.id === selected;
              // Hairlines between rows, inset to the text, never touching the pill.
              const sep = i > 0 && !on && rows[i - 1]!.id !== selected;
              return (
                <li key={r.id} className="relative px-[6px]">
                  {sep ? <span className="absolute top-0 right-[18px] left-[18px] h-[0.5px] bg-sep" /> : null}
                  <button
                    type="button"
                    onClick={() => onSelect(r.id)}
                    aria-current={on || undefined}
                    className={`relative z-[1] block w-full rounded-[20px] px-[12px] py-[10px] text-left transition-colors duration-200 ${
                      on ? "text-white" : "hover:bg-fill-3 active:bg-fill-2"
                    }`}
                    style={{ background: on ? fill : undefined }}
                  >
                    <span className="block truncate text-[17px] leading-[22px] font-semibold tracking-[-0.022em]">{r.title}</span>
                    <span
                      className={`mt-[2px] block truncate text-[15px] leading-[20px] tracking-[-0.01em] ${on ? "text-white/85" : "text-label-2"}`}
                    >
                      {time ? <span className="mr-[8px]">{time}</span> : null}
                      {r.preview}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  };

  return (
    <div className="relative h-full bg-grouped">
      <div
        className="no-scrollbar h-full overflow-y-auto overscroll-contain px-[16px] pt-[58px] pb-[104px]"
        onScroll={mirror ? undefined : (e) => setScrolled(e.currentTarget.scrollTop > 34)}
      >
        <h1 className="px-[4px] pb-[14px] font-display text-[34px] leading-[41px] font-bold tracking-[0.01em]">Notes</h1>
        {section("Pinned", pinned)}
        {section("Today", today)}
        {q && !pinned.length && !today.length ? (
          <p className="pt-[40px] text-center text-[17px] text-label-2">No Results for “{query.trim()}”</p>
        ) : null}
        {!q ? <p className="pt-[2px] text-center text-[13px] leading-[18px] text-label-2">{total} Notes</p> : null}
      </div>

      {/* No bars: the list fades out under the edges, and the large title
          comes back as an inline one once it has scrolled away. */}
      <div className="scroll-edge-top absolute inset-x-0 top-0 h-[84px] [--edge:var(--grouped)]" />
      <h2
        className="pointer-events-none absolute inset-x-[16px] top-[30px] truncate text-center text-[17px] leading-[22px] font-semibold tracking-[-0.022em] transition-[opacity,translate] duration-300 ease-ios"
        style={{ opacity: scrolled ? 1 : 0, translate: scrolled ? "0 0" : "0 6px" }}
        aria-hidden={!scrolled}
      >
        Notes
      </h2>
      <div className="scroll-edge-bottom absolute inset-x-0 bottom-0 h-[110px] [--edge:var(--grouped)]" />

      <label className="glass absolute right-[16px] bottom-[28px] left-[16px] flex h-[48px] items-center gap-[8px] rounded-full px-[16px] text-label-2 transition-[scale] duration-300 ease-ios focus-within:scale-[1.02]">
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
          className="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-[17px] tracking-[-0.022em] text-label outline-none placeholder:text-label-2 [&::-webkit-search-cancel-button]:hidden"
        />
        {Glyph.mic}
      </label>
    </div>
  );
}
