"use client";

import { useState } from "react";
import { useOS } from "@/lib/os";
import type { AppProps } from "../types";
import { Glyph, Rail, RailButton, RailGroup, Stack, contentBox, useMinute } from "../settings/ios";
import { NOTES, plain } from "./content";
import { NoteView } from "./Editor";
import { NoteGlyph } from "./glyphs";
import { NoteList } from "./List";
import { type Draft, accent, draftTitle, highlight } from "./shared";

// Notes, iOS 26/27 on iPhone Duo: the note list in a sidebar beside the
// open note on the inner display, a single stack in a half-width window.
// The toolbar is the Duo's glass rail on the outer edge: Close (or Back),
// the gold Compose (Done while typing), then the sidebar and Share in one
// capsule. The notes are his real ones (from the site's content); new ones
// live until the window closes.

const SIDEBAR_W = 340;

export default function Notes({ width, slot, mirror, close }: AppProps) {
  const dark = useOS((s) => s.dark);
  const compact = width < 600;
  const [selected, setSelected] = useState(compact ? "" : NOTES[0]!.id);
  const [hidden, setHidden] = useState(false);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const minute = useMinute(!mirror);
  const box = contentBox(slot, width);
  const tint = accent(dark);
  const gold = highlight(dark);

  const open = selected || (compact ? "" : NOTES[0]!.id);
  const pick = (id: string) => {
    setSelected(id);
    setEditing(false);
  };
  const compose = () => {
    const id = `draft-${Date.now()}`;
    setDrafts((d) => [{ id, title: "", body: "" }, ...d]);
    setSelected(id);
    setQuery("");
  };
  const done = () => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    setEditing(false);
  };
  const share = () => {
    const n = NOTES.find((x) => x.id === open);
    const d = drafts.find((x) => x.id === open);
    const title = n?.title ?? (d ? draftTitle(d) : "");
    const text = n ? plain(n) : (d?.body ?? "");
    if (!title) return;
    if (navigator.share) navigator.share({ title, text }).catch(() => {});
    else navigator.clipboard?.writeText(`${title}\n\n${text}`).catch(() => {});
  };

  const list = (
    <NoteList
      selected={compact ? null : open}
      drafts={drafts}
      query={query}
      setQuery={setQuery}
      onSelect={pick}
      minute={minute}
      tint={tint}
      fill={gold}
      mirror={mirror}
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
      onEdit={() => setEditing(true)}
    />
  );

  const inNote = compact ? !!selected : !!open;

  return (
    <div className="relative h-full bg-bg text-label">
      <div className="absolute inset-y-0 flex" style={{ left: box.left, width: box.width }}>
        {compact ? (
          <Stack
            keys={open ? ["list", open] : ["list"]}
            mirror={mirror}
            layer="bg-bg"
            className="w-full"
            render={(k) => (k === "list" ? list : view(k))}
          />
        ) : (
          <>
            <aside
              className="h-full shrink-0 overflow-hidden border-r-[0.5px] border-sep transition-[width] duration-500 ease-ios"
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
          <RailButton label="Back to Notes" onClick={() => pick("")}>
            {Glyph.back}
          </RailButton>
        ) : (
          <RailButton label="Close Notes" onClick={close}>
            {Glyph.close}
          </RailButton>
        )}
        {editing ? (
          <RailButton key="done" label="Done" prominent={gold} onClick={done}>
            {NoteGlyph.done}
          </RailButton>
        ) : (
          <RailButton key="compose" label="New Note" prominent={gold} onClick={compose}>
            {Glyph.compose}
          </RailButton>
        )}
        {compact ? (
          inNote ? (
            <RailButton label="Share" onClick={share}>
              {NoteGlyph.share}
            </RailButton>
          ) : null
        ) : (
          <RailGroup>
            <RailButton bare label={hidden ? "Show Sidebar" : "Hide Sidebar"} onClick={() => setHidden((h) => !h)}>
              {Glyph.sidebar}
            </RailButton>
            <RailButton bare label="Share" onClick={share}>
              {NoteGlyph.share}
            </RailButton>
          </RailGroup>
        )}
      </Rail>
    </div>
  );
}
