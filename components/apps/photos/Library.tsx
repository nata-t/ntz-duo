"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { library, sections, years, type Photo, type Section } from "./data";
import Grid from "./Grid";
import { AspectIcon, SortIcon, ZoomIcon } from "./icons";
import { GlassButton, LargeTitle, Menu, MenuItem, MenuSep, Segmented, headerH, plural, type Frame } from "./ui";

/** iOS 26's Years | Months | All. The library only knows years and
 *  projects, so a project stands in for a month. */
export type View = "years" | "projects" | "all";
const VIEWS: { id: View; label: string }[] = [
  { id: "years", label: "Years" },
  { id: "projects", label: "Projects" },
  { id: "all", label: "All" },
];

type Props = {
  width: number;
  frame: Frame;
  mirror: boolean;
  hiddenId: string | null;
  onOpen: (list: Photo[], photo: Photo, el: HTMLElement) => void;
  view: View;
  onView: (v: View) => void;
  /** Reports when the grid has scrolled back from the newest photos. */
  onAway: (away: boolean) => void;
  /** Show the Years | Projects | All control (the rail always has room). */
  showSegments: boolean;
  /** Bumped to scroll back down to the newest. */
  jump: number;
};

const range = (ys: number[]) => {
  if (!ys.length) return "";
  const a = Math.min(...ys), b = Math.max(...ys);
  return a === b ? String(a) : `${a} – ${b}`;
};
const ALL_YEARS = range(sections.flatMap((s) => (s.year ? [s.year] : [])));

// Library: everything, oldest at the top, opening at the newest (the bottom)
// the way Photos does, full bleed under the chrome. The large title is the
// span of years on screen; a header per project stands in for Photos' day
// headers, since a year is all the content knows about a screen's date.
export default function Library({ width, frame, mirror, hiddenId, onOpen, view, onView, onAway, showSegments, jump }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const secs = useRef<(HTMLElement | null)[]>([]);
  const [shown, setShown] = useState<{ title: string; sub: string }>({ title: ALL_YEARS, sub: sections.at(-1)!.title });
  const [zoom, setZoom] = useState(0);
  const [fit, setFit] = useState(false);
  const [menu, setMenu] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const away = useRef(false);
  /** A section to land on once the grid is back. */
  const target = useRef<string | null>(null);

  const top = headerH(frame);
  const compact = width - frame.l - frame.r < 600;
  // Even columns, so the grid splits cleanly at the fold (Duo HIG).
  const levels = compact ? [2, 3, 4, 6] : [4, 6, 8, 10, 12];
  const base = 1;
  const level = Math.max(0, Math.min(levels.length - 1, base + zoom));
  const cols = levels[level]!;

  // The years on screen make the title; the project under it the subtitle.
  const track = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const y0 = el.scrollTop + top, y1 = el.scrollTop + el.clientHeight - frame.b;
    const ys: number[] = [];
    let first: Section | null = null;
    secs.current.forEach((s, k) => {
      if (!s) return;
      if (s.offsetTop < y1 && s.offsetTop + s.offsetHeight > y0) {
        const sec = sections[k]!;
        first ??= sec;
        if (sec.year) ys.push(sec.year);
      }
    });
    if (first) setShown({ title: range(ys) || (first as Section).title, sub: (first as Section).title });
    const a = el.scrollHeight - el.scrollTop - el.clientHeight > 240;
    if (a !== away.current) {
      away.current = a;
      onAway(a);
    }
  }, [top, frame.b, onAway]);

  // Open at the newest, as Photos does, mirrors included (no listener there).
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (view === "all" && target.current) {
      const i = sections.findIndex((s) => s.id === target.current);
      target.current = null;
      const s = secs.current[i];
      el.scrollTop = s ? s.offsetTop - top + 6 : el.scrollHeight;
    } else el.scrollTop = el.scrollHeight;
    if (view === "all") track();
    // Re-anchor only when the grid's shape or the view changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, view]);

  // Leaving Library's grid lets the tab bar come back.
  useEffect(() => {
    if (view !== "all" && away.current) {
      away.current = false;
      onAway(false);
    }
  }, [view, onAway]);

  useEffect(() => {
    const el = scroller.current;
    if (!el || mirror || view !== "all") return;
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
  }, [mirror, track, view]);

  // The minimized tab bar's circle: back down to the newest.
  useEffect(() => {
    const el = scroller.current;
    if (!jump || !el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [jump]);

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

  const goTo = (sectionId: string) => {
    target.current = sectionId;
    onView("all");
  };

  const pad = { paddingLeft: frame.l, paddingRight: frame.r };
  const textPad = { paddingLeft: frame.l + 18, paddingRight: frame.r + 18 };
  // The segmented control rides above the bottom edge: centred on the
  // content beside the rail, or between the floating bar's two ends.
  const segW = 3 * 82 + 4 + 6;
  const segLeft = frame.rail ? frame.l + (width - frame.l - frame.r - segW) / 2 : (width - segW) / 2;
  const segBottom = frame.rail ? 24 : 24 + 11;
  const foot = frame.rail ? 96 : frame.b + 8;
  const cardCols = compact ? 1 : 2;

  return (
    <div className="absolute inset-0">
      <div ref={scroller} data-scroll className="h-full overflow-y-auto overscroll-contain no-scrollbar">
        {view === "all" ? (
          <div key="all" className="animate-fade-in motion-reduce:animate-none" style={{ paddingTop: top + 4 }}>
            {sections.map((s, i) => (
              <section
                key={s.id}
                ref={(el) => {
                  secs.current[i] = el;
                }}
              >
                <header className="pt-[18px] pb-[9px]" style={textPad}>
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
            <footer className="pt-[22px] text-center" style={{ ...textPad, paddingBottom: foot }}>
              <p className="text-[15px] leading-[20px] font-semibold tracking-[-0.01em] text-label">{plural(library.length, "Photo")}</p>
              <p className="mt-[2px] text-[13px] leading-[18px] text-label-2">From {plural(sections.length - 1, "project")}</p>
            </footer>
          </div>
        ) : (
          <div key={view} className="animate-fade-in motion-reduce:animate-none" style={{ ...pad, paddingTop: top + 10, paddingBottom: foot }}>
            <div className="grid gap-[14px] px-[14px]" style={{ gridTemplateColumns: `repeat(${cardCols}, minmax(0, 1fr))` }}>
              {view === "years"
                ? [...years].reverse().map((y) => (
                    <Cover
                      key={y.id}
                      photo={y.photos[0]!}
                      title={y.title}
                      sub={`${y.sub} · ${plural(y.photos.length, "Photo")}`}
                      big
                      onClick={() => goTo(sections.find((s) => String(s.year) === y.title)!.id)}
                    />
                  ))
                : sections.map((s) => (
                    <Cover key={s.id} photo={s.photos[0]!} title={s.title} sub={s.sub} onClick={() => goTo(s.id)} />
                  ))}
            </div>
          </div>
        )}
      </div>

      <LargeTitle
        title={view === "all" ? shown.title : view === "years" ? "Years" : "Projects"}
        sub={
          view !== "all"
            ? view === "years"
              ? ALL_YEARS
              : `${plural(sections.length - 1, "project")} and a portrait`
            : selecting
              ? selected.size
                ? `${plural(selected.size, "Photo")} Selected`
                : "Select Items"
              : shown.sub
        }
        frame={frame}
        width={width}
        right={
          view === "all" ? (
            <>
              <GlassButton
                wide
                aria-pressed={selecting}
                onClick={() => {
                  setSelecting((v) => !v);
                  setSelected(new Set());
                  setMenu(false);
                }}
                className={selecting ? "glass-tint !text-white" : ""}
              >
                {selecting ? "Done" : "Select"}
              </GlassButton>
              {selecting ? null : (
                <GlassButton aria-label="Sort and view options" title="View Options" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
                  <SortIcon size={19} />
                </GlassButton>
              )}
            </>
          ) : null
        }
      />

      {menu && !mirror ? (
        <Menu onClose={() => setMenu(false)} className="origin-[calc(100%-20px)_20px]" style={{ top: frame.t + 22, right: frame.tr }}>
          <MenuItem
            label="Zoom In"
            icon={<ZoomIcon size={20} />}
            disabled={level === 0}
            onClick={() => {
              zoomBy(-1);
              setMenu(false);
            }}
          />
          <MenuItem
            label="Zoom Out"
            icon={<ZoomIcon out size={20} />}
            disabled={level === levels.length - 1}
            onClick={() => {
              zoomBy(1);
              setMenu(false);
            }}
          />
          <MenuSep />
          <MenuItem
            label="Aspect Ratio Grid"
            icon={<AspectIcon size={20} />}
            checked={fit}
            onClick={() => {
              setFit((v) => !v);
              setMenu(false);
            }}
          />
        </Menu>
      ) : null}

      {showSegments ? (
        <Segmented
          key={frame.rail ? "rail" : "bar"}
          label="Library view"
          items={VIEWS}
          value={view}
          onChange={onView}
          className={`absolute z-20 ${frame.rail ? "" : "animate-bloom motion-reduce:animate-none"}`}
          style={{ left: segLeft, bottom: segBottom }}
        />
      ) : null}
    </div>
  );
}

/** A Years or Projects card: the cover full bleed, its label on the photo. */
function Cover({ photo, title, sub, big, onClick }: { photo: Photo; title: string; sub: string; big?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-[22px] bg-fill-3 text-left transition-transform duration-300 ease-ios active:scale-[0.98]"
      style={{ aspectRatio: big ? "4 / 3" : "16 / 10", background: photo.backdrop }}
    >
      <img src={photo.thumb} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-ios group-hover:scale-[1.03]" />
      <span className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-black/55 via-black/20 to-transparent" />
      <span className="absolute top-[14px] right-[16px] left-[16px] text-white">
        <span className={`block font-display font-bold tracking-[0.005em] ${big ? "text-[34px] leading-[40px]" : "text-[22px] leading-[27px]"}`}>{title}</span>
        <span className="block truncate text-[13px] leading-[17px] font-semibold opacity-90">{sub}</span>
      </span>
    </button>
  );
}
