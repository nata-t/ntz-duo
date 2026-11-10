"use client";

import { NOTES, type Note } from "./content";
import { NoteGlyph } from "./glyphs";
import { type Draft, hhmm, longDate } from "./shared";

/**
 * One note, iOS 26: the date stamp, a bold title and the body, scrolling
 * under a soft edge instead of a bar, with the floating glass formatting
 * toolbar (Aa, checklist, table, attachment, Markup) over its foot.
 */
export function NoteView({
  id,
  drafts,
  setDraft,
  checks,
  toggle,
  minute,
  tint,
  mirror,
  onEdit,
}: {
  id: string;
  drafts: Draft[];
  setDraft: (patch: Partial<Draft>) => void;
  checks: Record<string, boolean>;
  toggle: (k: string, v: boolean) => void;
  minute: number | null;
  tint: string;
  mirror: boolean;
  /** A draft's field took focus: the rail swaps Compose for Done. */
  onEdit: () => void;
}) {
  const note: Note | undefined = NOTES.find((n) => n.id === id);
  const draft = drafts.find((d) => d.id === id);
  const stamp = minute === null ? "" : `${longDate(minute)} at ${hhmm(minute)}`;

  return (
    <div className="relative h-full bg-bg">
      <div className="no-scrollbar h-full overflow-y-auto overscroll-contain">
        <article className="mx-auto max-w-[620px] px-[28px] pt-[58px] pb-[132px]">
          <p className="mb-[16px] text-center text-[13px] leading-[18px] text-label-2">{stamp || " "}</p>
          {draft ? (
            <>
              {/* Notes makes the first line the title; here it's its own field. */}
              <input
                value={draft.title}
                onChange={(e) => setDraft({ title: e.target.value })}
                onFocus={onEdit}
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
                onFocus={onEdit}
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

      <div className="scroll-edge-top absolute inset-x-0 top-0 h-[64px] [--edge:var(--bg)]" />
      <div className="scroll-edge-bottom absolute inset-x-0 bottom-0 h-[112px] [--edge:var(--bg)]" />
      {note || draft ? <FormatBar /> : null}
    </div>
  );
}

const TOOLS = [
  { label: "Text Style", glyph: NoteGlyph.format },
  { label: "Checklist", glyph: NoteGlyph.checklist },
  { label: "Table", glyph: NoteGlyph.table },
  { label: "Attach", glyph: NoteGlyph.attach },
  { label: "Markup", glyph: NoteGlyph.markup },
];

/** iOS 26's formatting toolbar: one floating capsule of glass, its
 *  symbols bare inside it. Shown for the look; the notes are his. */
function FormatBar() {
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="glass absolute bottom-[28px] left-1/2 flex h-[52px] -translate-x-1/2 items-center gap-[2px] rounded-full px-[4px] text-label"
    >
      {TOOLS.map((t) => (
        <button
          key={t.label}
          type="button"
          aria-label={t.label}
          title={t.label}
          className="grid size-[44px] place-items-center rounded-full transition-[background-color,scale] duration-300 ease-ios hover:bg-fill-3 active:scale-110 active:bg-fill-2"
        >
          {t.glyph}
        </button>
      ))}
    </div>
  );
}
