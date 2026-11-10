"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { reducedMotion } from "@/lib/env";
import { spring } from "@/lib/spring";
import { profile } from "@/content/site";
import { openApp, type Slot } from "@/lib/os";
import type { Photo } from "./data";
import { byline } from "./data";
import { ChevronLeft, ChevronRight, CompassIcon, EllipsisIcon, HeartIcon, InfoIcon, LinkIcon, OpenAppIcon, SaveIcon, ShareIcon } from "./icons";
import { GlassButton, Menu, MenuItem, RAIL } from "./ui";

type Rect = { x: number; y: number; w: number; h: number };

type Props = {
  list: Photo[];
  start: number;
  /** The thumbnail it grows out of. */
  origin: HTMLElement;
  width: number;
  height: number;
  slot: Slot;
  /** Chrome on the side rail (wide landscape) or in top and bottom rows. */
  rail: boolean;
  /** The portrait status bar's strip, when it's over this window. */
  top: number;
  /** The landscape status bar's column is at this window's top right. */
  statusSide: boolean;
  focused: boolean;
  favs: Set<string>;
  onFav: (id: string) => void;
  /** Finds the cell a photo lives in now, to shrink back into. */
  thumbFor: (id: string) => HTMLElement | null;
  onIndex: (id: string) => void;
  onClosed: () => void;
};

const GAP = 24;
/** Clear glass over the photo, with a dim behind it so white glyphs hold
 *  up over bright screenshots. Each piece fades on its own (an ancestor's
 *  opacity would cut the glass off from what it bends). */
const DIM = "[--glass-clear-dim:rgba(0,0,0,0.34)]";
const FADE = "transition-opacity duration-300 group-data-[hidden=true]/ui:pointer-events-none group-data-[hidden=true]/ui:opacity-0";
const ZOOM = () => spring(0.44, 0.86);
const PAGE = () => spring(0.36, 0.92);

// The one-up viewer. It grows out of the tapped thumbnail (a shared element:
// a single box tweened from the cell's rect to the fitted photo, its image
// object-cover so the square crop opens out into the whole frame), pages
// sideways by arrow, key or drag, and shrinks back into whichever cell the
// current photo lives in. Pull down to dismiss, tap to hide the chrome.
export default function Viewer({ list, start, origin, width, height, slot, rail, top, statusSide, focused, favs, onFav, thumbFor, onIndex, onClosed }: Props) {
  const [index, setIndex] = useState(start);
  const [chrome, setChrome] = useState(true);
  const [info, setInfo] = useState(false);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const root = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const fly = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const ui = useRef<HTMLDivElement>(null);
  const boxes = useRef(new Map<number, HTMLDivElement>());
  const pos = useRef({ x: 0 });
  /** Closing locks everything; opening can be cut short by the next gesture. */
  const busy = useRef(false);
  const opening = useRef<gsap.core.Tween | null>(null);
  const live = useRef({ index: start, chrome: true });
  useLayoutEffect(() => {
    live.current.index = index;
    live.current.chrome = chrome;
  }, [index, chrome]);

  /** The chrome's pieces, each faded by itself. */
  const fades = () => Array.from(ui.current?.querySelectorAll<HTMLElement>("[data-fade]") ?? []);

  const leftRail = slot === "left";
  const x0 = rail && leftRail ? RAIL : 0;
  const sw = rail ? width - RAIL : width;
  const pitch = sw + GAP;
  const photo = list[index]!;
  // Clear of the title (rail) or the top and bottom rows, so the bars sit
  // over black when the photo allows, as in Photos.
  const vpad = rail ? 56 : Math.max(top + 36 + 44, 24 + 48) + 12;

  /** The photo fitted to the stage, in the app's coordinates. */
  const fit = useCallback(
    (ph: Photo): Rect => {
      const w = Math.min(sw, (height - 2 * vpad) * ph.ratio);
      const h = w / ph.ratio;
      return { x: x0 + (sw - w) / 2, y: (height - h) / 2, w, h };
    },
    [sw, height, x0, vpad],
  );

  /** A screen rect in the app's own (unzoomed) points. */
  const local = (el: Element): Rect => {
    const r = root.current!.getBoundingClientRect();
    const e = el.getBoundingClientRect();
    const s = r.width / width;
    return { x: (e.left - r.left) / s, y: (e.top - r.top) / s, w: e.width / s, h: e.height / s };
  };

  const place = (r: Rect) => {
    const f = fly.current!;
    Object.assign(f.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px`, opacity: "1", transform: "none" });
  };

  const paintTrack = () => {
    if (track.current) track.current.style.transform = `translate3d(${pos.current.x}px,0,0)`;
  };

  // Grow out of the thumbnail.
  useLayoutEffect(() => {
    const f = fly.current!, t = track.current!;
    const to = fit(list[start]!);
    pos.current.x = -start * pitch;
    paintTrack();
    t.style.visibility = "hidden";
    const done = () => {
      f.style.visibility = "hidden";
      t.style.visibility = "visible";
      opening.current = null;
    };
    if (reducedMotion()) {
      done();
      gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      return;
    }
    place(local(origin));
    f.style.visibility = "visible";
    const sp = ZOOM();
    opening.current = gsap.to(f, { left: to.x, top: to.y, width: to.w, height: to.h, duration: sp.duration, ease: sp.ease, onComplete: done });
    gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" });
    gsap.fromTo(fades(), { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.12, clearProps: "opacity" });
    // Mount only: the origin is fixed for this viewer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Land the zoom-in now, so a quick key or swipe acts at once. */
  const settle = () => {
    if (!opening.current) return;
    opening.current.progress(1);
    gsap.set(backdrop.current, { opacity: 1 });
    gsap.killTweensOf(fades());
    gsap.set(fades(), { clearProps: "opacity" });
  };

  // Keep the strip aligned when the window changes size (split view).
  useLayoutEffect(() => {
    pos.current.x = -live.current.index * pitch;
    paintTrack();
  }, [pitch]);

  useEffect(() => onIndex(photo.id), [photo.id, onIndex]);

  const go = useCallback(
    (d: number) => {
      const next = live.current.index + d;
      if (busy.current || next < 0 || next >= list.length) return;
      settle();
      live.current.index = next;
      setIndex(next);
      const sp = PAGE();
      gsap.to(pos.current, { x: -next * pitch, duration: sp.duration, ease: sp.ease, onUpdate: paintTrack, overwrite: true });
    },
    [list.length, pitch],
  );

  const snapBack = () => {
    const sp = PAGE();
    gsap.to(pos.current, { x: -live.current.index * pitch, duration: sp.duration, ease: sp.ease, onUpdate: paintTrack, overwrite: true });
  };

  /** Shrink back into the photo's cell (scrolled into view first), or fade if it has none. */
  const close = useCallback(
    (from?: Rect) => {
      if (busy.current) return;
      settle();
      busy.current = true;
      const i = live.current.index;
      const ph = list[i]!;
      const f = fly.current!, t = track.current!;
      const start = from ?? fit(ph);

      let cell = thumbFor(ph.id);
      const scroller = cell?.closest<HTMLElement>("[data-scroll]");
      if (cell && scroller) {
        const c = cell.getBoundingClientRect(), s = scroller.getBoundingClientRect();
        if (c.top < s.top + c.height * 0.6 || c.bottom > s.bottom - 8) {
          scroller.scrollTop += c.top + c.height / 2 - (s.top + s.height / 2);
        }
      } else cell = null;

      place(start);
      f.style.visibility = "visible";
      t.style.visibility = "hidden";
      const sp = ZOOM();
      if (cell && !reducedMotion()) {
        const to = local(cell);
        gsap.to(f, { left: to.x, top: to.y, width: to.w, height: to.h, duration: sp.duration * 0.85, ease: sp.ease, onComplete: onClosed });
      } else {
        gsap.to(f, { opacity: 0, scale: 0.92, duration: 0.25, ease: "power2.out", onComplete: onClosed });
      }
      gsap.to(backdrop.current, { opacity: 0, duration: 0.28, ease: "power1.out" });
      setMenu(false);
      gsap.to(fades(), { opacity: 0, duration: 0.14 });
    },
    // local/place read refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list, fit, thumbFor, onClosed],
  );

  // Keys for the focused window only.
  useEffect(() => {
    if (!focused) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "Escape") close();
      else return;
      // Captured and stopped, so the system's Escape (close the window) waits.
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener("keydown", on, true);
    return () => window.removeEventListener("keydown", on, true);
  }, [focused, go, close]);

  // Drag: sideways pages, down dismisses, a still tap toggles the chrome.
  const drag = useRef<{ x: number; y: number; t: number; axis: "x" | "y" | null; id: number } | null>(null);
  const curBox = () => boxes.current.get(live.current.index);

  const onDown = (e: React.PointerEvent) => {
    if (busy.current || e.button !== 0) return;
    settle();
    drag.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, axis: null, id: e.pointerId };
  };

  const scaleOf = () => root.current!.getBoundingClientRect().width / width;

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const s = scaleOf();
    const dx = (e.clientX - d.x) / s, dy = (e.clientY - d.y) / s;
    if (!d.axis) {
      if (Math.hypot(dx, dy) < 8) return;
      d.axis = Math.abs(dx) > Math.abs(dy) || dy < 0 ? "x" : "y";
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      gsap.killTweensOf(pos.current);
    }
    if (d.axis === "x") {
      const i = live.current.index;
      const edge = (dx > 0 && i === 0) || (dx < 0 && i === list.length - 1);
      pos.current.x = -i * pitch + (edge ? dx * 0.3 : dx);
      paintTrack();
    } else {
      const k = Math.max(0, dy);
      const box = curBox();
      if (box) box.style.transform = `translate(${dx}px, ${k}px) scale(${Math.max(0.62, 1 - k / (height * 1.4))})`;
      if (backdrop.current) backdrop.current.style.opacity = String(Math.max(0, 1 - k / (height * 0.6)));
      if (live.current.chrome) for (const el of fades()) el.style.opacity = String(Math.max(0, 1 - k / 60));
    }
  };

  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    const s = scaleOf();
    const dx = (e.clientX - d.x) / s, dy = (e.clientY - d.y) / s;
    const v = (d.axis === "x" ? dx : dy) / Math.max(1, e.timeStamp - d.t);
    if (!d.axis) {
      if ((e.target as HTMLElement).closest("button, a")) return;
      setMenu(false);
      setChrome((c) => !c);
      return;
    }
    if (d.axis === "x") {
      const i = live.current.index;
      if ((dx < -sw * 0.18 || v < -0.45) && i < list.length - 1) go(1);
      else if ((dx > sw * 0.18 || v > 0.45) && i > 0) go(-1);
      else snapBack();
      return;
    }
    const box = curBox();
    if (dy > 90 || v > 0.5) {
      const r = fit(list[live.current.index]!);
      const k = Math.max(0.62, 1 - Math.max(0, dy) / (height * 1.4));
      const from = { x: r.x + dx + (r.w * (1 - k)) / 2, y: r.y + Math.max(0, dy) + (r.h * (1 - k)) / 2, w: r.w * k, h: r.h * k };
      if (box) box.style.transform = "";
      close(from);
    } else {
      const sp = PAGE();
      if (box) gsap.to(box, { x: 0, y: 0, scale: 1, duration: sp.duration, ease: sp.ease, clearProps: "transform" });
      gsap.to(backdrop.current, { opacity: 1, duration: 0.25 });
      if (live.current.chrome) gsap.to(fades(), { opacity: 1, duration: 0.25, clearProps: "opacity" });
    }
  };

  const p = photo.project;
  const title = p ? p.name : profile.name;
  const line = p ? `${byline(p)} · ${p.year}` : `${profile.title} · ${profile.location}`;
  const fav = favs.has(photo.id);
  // The portfolio's equivalents of Photos' actions: share the work, open
  // the project's own app (where Photos has Delete), visit the live site.
  const app = p ? { id: p.slug, label: `Open ${p.short}` } : { id: "about", label: "Open About" };
  const link = () => p?.url ?? new URL(photo.src, window.location.href).href;

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 1600);
  };
  const copy = async () => {
    setMenu(false);
    try {
      await navigator.clipboard.writeText(link());
      flash("Link Copied");
    } catch {
      flash("Couldn’t Copy Link");
    }
  };
  const share = async () => {
    const data = { title: `${title}: ${photo.label}`, url: link() };
    if (typeof navigator.share === "function" && navigator.canShare?.(data) !== false) {
      try {
        await navigator.share(data);
      } catch {
        /* dismissed */
      }
      return;
    }
    copy();
  };
  const openProject = () => {
    close();
    openApp(app.id, null);
  };

  // Placement. Rail: Back and "…" at the top of the outer edge, the actions
  // bottom-aligned, the title over the stage's top left. Otherwise a top
  // row (Back, title, "…") and a bottom row (Share, the capsule, Open).
  const railX = leftRail ? 24 : width - 24 - 48;
  const railTop = leftRail ? 24 : 122;
  const rowTop = top + 36;
  const rowRight = statusSide ? 92 : 16;
  const circle = `pointer-events-auto ${DIM} ${FADE}`;

  const capsule = (
    <div data-fade className={`glass-clear flex items-center gap-[2px] rounded-full p-[2px] ${rail ? "w-[48px] flex-col" : "h-[48px]"} ${circle}`}>
      <button
        type="button"
        aria-label={fav ? "Unfavorite" : "Favorite"}
        aria-pressed={fav}
        title="Favorite"
        onClick={() => onFav(photo.id)}
        className="grid size-[44px] place-items-center rounded-full text-white transition-[scale,background-color] duration-300 ease-ios hover:bg-white/10 active:scale-110"
      >
        <HeartIcon size={22} filled={fav} />
      </button>
      <button
        type="button"
        aria-label="Info"
        aria-pressed={info}
        title="Info"
        onClick={() => setInfo((v) => !v)}
        className={`grid size-[44px] place-items-center rounded-full text-white transition-[scale,background-color] duration-300 ease-ios active:scale-110 ${info ? "bg-white/22" : "hover:bg-white/10"}`}
      >
        <InfoIcon size={22} />
      </button>
      {p?.url ? (
        <a
          href={p.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Visit ${p.short}’s site`}
          title="Visit site"
          className="grid size-[44px] place-items-center rounded-full text-white transition-[scale,background-color] duration-300 ease-ios hover:bg-white/10 active:scale-110"
        >
          <CompassIcon size={22} />
        </a>
      ) : (
        <span aria-hidden="true" title="No public site" className="grid size-[44px] place-items-center rounded-full text-white/35">
          <CompassIcon size={22} />
        </span>
      )}
    </div>
  );

  const shareBtn = (
    <GlassButton data-fade clear size={48} aria-label="Share" title="Share" onClick={share} className={circle}>
      <ShareIcon size={22} />
    </GlassButton>
  );
  const appBtn = (
    <GlassButton data-fade clear size={48} aria-label={app.label} title={app.label} onClick={openProject} className={circle}>
      <OpenAppIcon size={22} />
    </GlassButton>
  );
  const backBtn = (
    <GlassButton data-fade clear size={rail ? 48 : 44} aria-label="Back" title="Back" onClick={() => close()} className={circle}>
      <ChevronLeft size={22} />
    </GlassButton>
  );
  const moreBtn = (
    <GlassButton data-fade clear size={rail ? 48 : 44} aria-label="More" title="More" aria-expanded={menu} onClick={() => setMenu((v) => !v)} className={circle}>
      <EllipsisIcon size={22} />
    </GlassButton>
  );

  return (
    <div ref={root} className="absolute inset-0 z-40 overflow-hidden text-white" role="dialog" aria-label={`${title}: ${photo.label}`}>
      <div ref={backdrop} className="absolute inset-0 bg-black" />

      {/* The strip of photos. Only the neighbours are in the DOM. */}
      <div
        className="absolute inset-y-0 cursor-grab touch-none overflow-hidden select-none"
        style={{ left: x0, width: sw }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div ref={track} className="absolute inset-0 will-change-transform">
          {[index - 1, index, index + 1].map((i) => {
            const ph = list[i];
            if (!ph) return null;
            const r = fit(ph);
            return (
              <div key={ph.id} className="absolute inset-y-0" style={{ left: i * pitch, width: sw }}>
                <div
                  ref={(el) => {
                    if (el) boxes.current.set(i, el);
                    else boxes.current.delete(i);
                  }}
                  className="absolute"
                  style={{ left: r.x - x0, top: r.y, width: r.w, height: r.h, background: ph.backdrop }}
                >
                  <img src={ph.src} alt={ph.alt} draggable={false} decoding="async" className="size-full object-contain" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* The flying copy for the zoom in and out. */}
      <div ref={fly} className="pointer-events-none absolute overflow-hidden" style={{ visibility: "hidden", background: photo.backdrop }}>
        <img src={photo.src} alt="" draggable={false} className="size-full object-cover" />
      </div>

      {/* The chrome. No opacity up here: each piece fades by itself. */}
      <div ref={ui} data-hidden={!chrome} className="group/ui pointer-events-none absolute inset-0">
        {/* The title: what and whose, as Photos shows the date and time. */}
        <div
          data-fade
          className={`absolute ${FADE} ${rail ? "" : "text-center"}`}
          style={
            rail
              ? { left: x0 + 20, top: 16, maxWidth: sw / 2 - 40 }
              : { left: 16 + 44 + 10, right: rowRight + 44 + 10, top: rowTop + 1 }
          }
        >
          <p className="truncate text-[17px] leading-[22px] font-semibold tracking-[-0.02em] text-white">{photo.label}</p>
          <p className="truncate text-[12px] leading-[16px] font-medium text-white/65">
            {title} · {index + 1} of {list.length}
          </p>
        </div>

        {rail ? (
          <>
            <div className="absolute flex flex-col gap-[12px]" style={{ left: railX, top: railTop }}>
              {backBtn}
              {moreBtn}
            </div>
            <div className="absolute flex w-[48px] flex-col items-center gap-[12px]" style={{ left: railX, bottom: 24 }}>
              {shareBtn}
              {capsule}
              {appBtn}
            </div>
          </>
        ) : (
          <>
            <div className="absolute" style={{ left: 16, top: rowTop }}>
              {backBtn}
            </div>
            <div className="absolute" style={{ right: rowRight, top: rowTop }}>
              {moreBtn}
            </div>
            <div className="absolute inset-x-[16px] bottom-[24px] flex items-center justify-between">
              {shareBtn}
              {capsule}
              {appBtn}
            </div>
          </>
        )}

        {/* Previous and next, for a pointer. */}
        {index > 0 ? (
          <GlassButton data-fade clear aria-label="Previous photo" onClick={() => go(-1)} className={`absolute top-1/2 -mt-[22px] ${circle}`} size={44} style={{ left: x0 + 14 }}>
            <ChevronLeft size={20} />
          </GlassButton>
        ) : null}
        {index < list.length - 1 ? (
          <GlassButton data-fade clear aria-label="Next photo" onClick={() => go(1)} className={`absolute top-1/2 -mt-[22px] ${circle}`} size={44} style={{ left: x0 + sw - 58 }}>
            <ChevronRight size={20} />
          </GlassButton>
        ) : null}

        {/* Info: what this screen belongs to. */}
        {info ? (
          <div
            data-fade
            className={`glass-clear pointer-events-auto absolute rounded-[28px] px-[18px] pt-[13px] pb-[14px] [--glass-clear-dim:rgba(20,20,22,0.8)] animate-bloom origin-bottom motion-reduce:animate-none ${FADE}`}
            style={rail ? { left: x0 + 16, bottom: 24, width: Math.min(sw - 32, 440) } : { left: 16, right: 16, bottom: 24 + 48 + 12 }}
          >
            <div className="flex items-baseline justify-between gap-[12px]">
              <p className="min-w-0 truncate text-[17px] leading-[22px] font-semibold tracking-[-0.02em] text-white">{title}</p>
              {p?.url ? (
                <a href={p.url} target="_blank" rel="noreferrer" className="shrink-0 text-[15px] leading-[22px] text-[#2997ff] hover:underline">
                  Visit site ›
                </a>
              ) : null}
            </div>
            <p className="truncate text-[13px] leading-[18px] text-white/65">{line}</p>
            {p ? (
              <div className="mt-[9px] flex max-h-[54px] flex-wrap gap-[5px] overflow-hidden">
                {p.stack.map((s) => (
                  <span key={s} className="rounded-full bg-white/14 px-[9px] py-[3px] text-[12px] leading-[15px] text-white/90">
                    {s}
                  </span>
                ))}
              </div>
            ) : null}
            {p?.confidential ? <p className="mt-[8px] text-[12px] leading-[16px] text-white/60">Confidential: a placeholder until photos can be shared.</p> : null}
          </div>
        ) : null}

        {menu ? (
          <Menu
            dark
            onClose={() => setMenu(false)}
            className={rail ? "origin-[calc(100%+30px)_30px]" : "origin-[calc(100%-22px)_0]"}
            style={rail ? { top: railTop + 48 + 12, [leftRail ? "left" : "right"]: RAIL } : { top: rowTop + 52, right: rowRight }}
          >
            <MenuItem label="Copy Link" icon={<LinkIcon size={20} />} onClick={copy} />
            <MenuItem label="Save Image" icon={<SaveIcon size={20} />} href={photo.src} download onClick={() => setMenu(false)} />
            <MenuItem label={app.label} icon={<OpenAppIcon size={20} />} onClick={openProject} />
          </Menu>
        ) : null}

        {toast ? (
          <div
            role="status"
            className={`glass-clear absolute grid h-[40px] -translate-x-1/2 place-items-center rounded-full px-[18px] text-[15px] font-semibold tracking-[-0.01em] text-white animate-bloom motion-reduce:animate-none ${DIM}`}
            style={{ top: rail ? 40 : rowTop + 56, left: x0 + sw / 2 }}
          >
            {toast}
          </div>
        ) : null}
      </div>
    </div>
  );
}
