"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { search, suggestions, type Photo } from "./data";
import Grid from "./Grid";
import { ChevronRight, SearchIcon, XIcon } from "./icons";
import { HEADER, LargeTitle, SectionHeader, plural } from "./ui";
import css from "./photos.module.css";

type Props = {
  width: number;
  left: number;
  mirror: boolean;
  active: boolean;
  hiddenId: string | null;
  onOpen: (list: Photo[], photo: Photo, el: HTMLElement) => void;
  onAlbum: (id: string) => void;
};

// Search across what each screen belongs to: project, client, category,
// year and stack.
export default function Search({ width, left, mirror, active, hiddenId, onOpen, onAlbum }: Props) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const res = useMemo(() => search(q), [q]);
  const cols = width < 600 ? 3 : 6;
  const open = useCallback((ph: Photo, el: HTMLElement) => onOpen(res.photos, ph, el), [onOpen, res.photos]);

  // Focus the field when the tab opens, without scrolling the page under the phone.
  useEffect(() => {
    if (active && !mirror) input.current?.focus({ preventScroll: true });
  }, [active, mirror]);

  return (
    <div className="absolute inset-y-0" style={{ left, width }}>
      <div data-scroll className="h-full overflow-y-auto overscroll-contain no-scrollbar">
        <div className="pb-[48px]" style={{ paddingTop: HEADER + 52 }}>
          {!q.trim() ? (
            <>
              <SectionHeader title="Suggestions" />
              <div className="flex flex-wrap gap-[8px] px-[18px]">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQ(s)}
                    className="h-[34px] rounded-full bg-fill-3 px-[14px] text-[15px] tracking-[-0.01em] text-label transition-colors hover:bg-fill-2"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          ) : res.photos.length === 0 && res.albums.length === 0 ? (
            <div className="px-[24px] pt-[80px] text-center">
              <p className="text-[22px] leading-[28px] font-bold text-label">No Results</p>
              <p className="mt-[4px] text-[15px] text-label-2">Nothing matches “{q.trim()}”. Try a project, a client or a technology.</p>
            </div>
          ) : (
            <div key={q} className={css.fade}>
              {res.albums.length ? (
                <>
                  <SectionHeader title="Albums" />
                  <div className="mx-[18px] mb-[24px] overflow-hidden rounded-[22px] bg-fill-3">
                    {res.albums.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onAlbum(a.id)}
                        className="group flex w-full items-center gap-[12px] pl-[10px] text-left transition-colors hover:bg-fill-3"
                      >
                        <span className="relative my-[8px] size-[48px] shrink-0 overflow-hidden rounded-[10px] bg-fill-2" style={{ background: a.photos[0]!.backdrop }}>
                          <img src={a.photos[0]!.thumb} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
                        </span>
                        <span className="flex min-h-[64px] flex-1 items-center gap-[8px] border-b border-sep pr-[14px] group-last:border-b-0">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[17px] leading-[22px] tracking-[-0.02em] text-label">{a.title}</span>
                            <span className="block truncate text-[13px] leading-[17px] text-label-2">{a.sub}</span>
                          </span>
                          <span className="text-[15px] text-label-2">{a.photos.length}</span>
                          <ChevronRight size={14} className="text-label-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
              {res.photos.length ? (
                <>
                  <SectionHeader title={plural(res.photos.length, "Photo")} />
                  <Grid photos={res.photos} cols={cols} hiddenId={hiddenId} onOpen={open} />
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <LargeTitle title="Search" width={width} />
      <div className="absolute top-[80px] right-[18px] left-[18px] z-10">
        <label className="glass flex h-[40px] items-center gap-[8px] rounded-full px-[13px] text-label-2">
          <SearchIcon size={17} />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Projects, clients, stack"
            aria-label="Search photos"
            className="h-full min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 focus-visible:outline-none text-[17px] tracking-[-0.02em] text-label outline-none placeholder:text-label-2"
          />
          {q ? (
            <button type="button" aria-label="Clear" onClick={() => setQ("")} className="grid size-[20px] place-items-center rounded-full bg-label-3 text-bg">
              <XIcon size={13} />
            </button>
          ) : null}
        </label>
      </div>
    </div>
  );
}
