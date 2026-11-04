"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { library, sections, type Photo } from "./data";
import Grid from "./Grid";
import { CheckIcon, EllipsisIcon } from "./icons";
import { GlassButton, HEADER, LargeTitle, plural } from "./ui";

type Props = {
  width: number;
  left: number;
  mirror: boolean;
  hiddenId: string | null;
  onOpen: (list: Photo[], photo: Photo, el: HTMLElement) => void;
};

// Library: everything, oldest at the top, opening at the newest (the bottom)
// the way Photos does. A header per project stands in for Photos' day
// headers, since a year is all the content knows about a screen's date.
export default function Library({ width, left, mirror, hiddenId, onOpen }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const heads = useRef<(HTMLElement | null)[]>([]);
  const [sub, setSub] = useState(sections.at(-1)!.sub);
  const [zoom, setZoom] = useState(0);
  const [fit, setFit] = useState(false);
  const [menu, setMenu] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  // Even columns, so the grid splits cleanly at the fold (Duo HIG).
  const levels = width < 600 ? [2, 3, 4, 6] : [3, 4, 6, 8, 12];
  const base = width < 600 ? 1 : 2;
  const level = Math.max(0, Math.min(levels.length - 1, base + zoom));
  const cols = levels[level]!;

  // Which project is under the title, for the subtitle.
  const track = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const y = el.scrollTop + HEADER + 8;
    let i = 0;
    heads.current.forEach((h, k) => {
      if (h && h.offsetTop <= y) i = k;
    });
    setSub(sections[i]!.sub);
  }, []);

  // Open at the newest, as Photos does, mirrors included (no listener there).
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    track();
    // Re-anchor only when the grid's shape changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  useEffect(() => {
    const el = scroller.current;
    if (!el || mirror) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(track);
    };
    el.addEventListener("scroll", on, { passive: true });
    return () => {
      el.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, [mirror, track]);

  // Keep the photo in the middle of the view steady while zooming.
  const zoomBy = (d: number) => {
    const el = scroller.current;
    const ratio = el ? (el.scrollTop + el.clientHeight / 2) / el.scrollHeight : 1;
    setZoom((z) => Math.max(-base, Math.min(levels.length - 1 - base, z + d)));
    requestAnimationFrame(() => {
      if (el) el.scrollTop = ratio * el.scrollHeight - el.clientHeight / 2;
      track();
    });
  };

  const toggle = useCallback((ph: Photo) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(ph.id)) n.delete(ph.id);
      else n.add(ph.id);
      return n;
    });
  }, []);

  const open = useCallback((ph: Photo, el: HTMLElement) => onOpen(library, ph, el), [onOpen]);

  return (
    <div className="absolute inset-y-0" style={{ left, width }}>
      <div ref={scroller} data-scroll className="h-full overflow-y-auto overscroll-contain no-scrollbar">
        <div style={{ paddingTop: HEADER + 4 }}>
          {sections.map((s, i) => (
            <section key={s.id}>
              <header
                ref={(el) => {
                  heads.current[i] = el;
                }}
                className="px-[18px] pt-[18px] pb-[9px]"
              >
                <h2 className="text-[17px] leading-[22px] font-semibold tracking-[-0.02em] text-label">{s.title}</h2>
                <p className="text-[13px] leading-[18px] text-label-2">{s.sub}</p>
              </header>
              <Grid
                photos={s.photos}
                cols={cols}
                fit={fit}
                hiddenId={hiddenId}
                selecting={selecting}
                selected={selected}
                onOpen={open}
                onToggle={toggle}
              />
            </section>
          ))}
          <footer className="px-[18px] pt-[22px] pb-[44px] text-center">
            <p className="text-[15px] leading-[20px] font-semibold tracking-[-0.01em] text-label">{plural(library.length, "Photo")}</p>
            <p className="mt-[2px] text-[13px] leading-[18px] text-label-2">From {plural(sections.length - 1, "project")}</p>
          </footer>
        </div>
      </div>

      <LargeTitle
        title="Library"
        sub={selecting ? (selected.size ? `${plural(selected.size, "Photo")} Selected` : "Select Items") : sub}
        width={width}
        right={
          <>
            <GlassButton
              wide
              aria-pressed={selecting}
              onClick={() => {
                setSelecting((v) => !v);
                setSelected(new Set());
                setMenu(false);
              }}
              className={selecting ? "!bg-blue !text-white" : ""}
            >
              {selecting ? "Cancel" : "Select"}
            </GlassButton>
            {selecting ? null : (
              <GlassButton aria-label="More" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
                <EllipsisIcon size={22} />
              </GlassButton>
            )}
          </>
        }
      />

      {menu && !mirror ? (
        <>
          <button type="button" aria-label="Close menu" className="absolute inset-0 z-20 cursor-default" onClick={() => setMenu(false)} />
          <div
            role="menu"
            className={`glass absolute top-[70px] right-[16px] z-30 w-[236px] overflow-hidden rounded-[24px] py-[6px] text-label origin-[calc(100%-20px)_0] animate-bloom bg-(--glass-strong) motion-reduce:animate-none`}
          >
            <MenuItem label="Zoom In" disabled={level === 0} onClick={() => {
                zoomBy(-1);
                setMenu(false);
              }} glyph="+" />
            <MenuItem label="Zoom Out" disabled={level === levels.length - 1} onClick={() => {
                zoomBy(1);
                setMenu(false);
              }} glyph="−" />
            <div className="mx-[16px] my-[5px] h-px bg-sep" />
            <MenuItem
              label="Aspect Ratio Grid"
              checked={fit}
              onClick={() => {
                setFit((v) => !v);
                setMenu(false);
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function MenuItem({
  label,
  glyph,
  checked,
  disabled,
  onClick,
}: {
  label: string;
  glyph?: string;
  checked?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role={checked === undefined ? "menuitem" : "menuitemcheckbox"}
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className="flex h-[42px] w-full items-center gap-[10px] px-[16px] text-left text-[16px] tracking-[-0.02em] transition-colors hover:bg-fill-3 disabled:opacity-35"
    >
      <span className="grid w-[18px] place-items-center text-[19px] leading-none font-medium">
        {checked ? <CheckIcon size={18} /> : glyph}
      </span>
      <span className="flex-1">{label}</span>
    </button>
  );
}
