"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { reducedMotion } from "@/lib/env";
import { LAUNCH, SNAP } from "@/lib/spring";
import { os, useOS } from "@/lib/os";
import type { AppProps } from "../types";
import type { Photo } from "./data";
import Library, { type View } from "./Library";
import Collections from "./Collections";
import Search from "./Search";
import Album from "./Album";
import Viewer from "./Viewer";
import { Favs } from "./Grid";
import { ChevronLeft } from "./icons";
import { SearchButton, TabBar, TabCircle, type Tab } from "./Bars";
import { GlassButton, RAIL, RAIL_INSET, type Frame } from "./ui";

type Open = { list: Photo[]; start: number; origin: HTMLElement };

// Photos, iOS 26/27. Library and Collections on a glass tab bar with a
// separate Search circle. On the Duo's wide landscape window the bar stands
// up as a vertical capsule at the foot of a side rail on the outer edge,
// with Back at the rail's top (HIG: Designing for iPhone Duo); in a half or
// upright window it floats at the bottom as on iPhone. Content runs full
// bleed under all of it. Albums push over their tab; photos open in a
// viewer that zooms out of their cell.
export default function Photos({ id, width, height, slot, mirror }: AppProps) {
  const focused = useOS((s) => s.focus === id);
  const portrait = useOS((s) => s.portrait);
  const [tab, setTab] = useState<Tab>("library");
  const [seen, setSeen] = useState<Set<Tab>>(() => new Set(["library"]));
  const [album, setAlbum] = useState<{ id: string; tab: Tab } | null>(null);
  const [viewer, setViewer] = useState<Open | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [favs, setFavs] = useState<Set<string>>(() => new Set());
  // Library's Years | Projects | All, lifted so Collections can link into it.
  const [view, setView] = useState<View>("all");
  // Library has scrolled back in time: the floating bar gives way to the segmented control.
  const [away, setAway] = useState(false);
  const [jump, setJump] = useState(0);

  // The viewer is black: ask the system for a white status bar meanwhile.
  useEffect(() => {
    if (mirror || !viewer) return;
    os.set({ statusLight: id });
    return () => {
      if (os.get().statusLight === id) os.set({ statusLight: null });
    };
  }, [mirror, viewer, id]);

  const root = useRef<HTMLDivElement>(null);
  const albumEl = useRef<HTMLDivElement>(null);

  // Chrome placement. The rail only in a wide landscape window; the status
  // bar is a top strip when upright and a column at the right otherwise.
  const rail = width >= 600 && width > height;
  const leftRail = slot === "left";
  const statusTop = portrait && slot !== "right" ? 54 : 0;
  const statusSide = !portrait && slot !== "left";
  const frame: Frame = rail
    ? { rail, l: leftRail ? RAIL : 0, r: leftRail ? 0 : RAIL, t: 0, b: 0, tr: leftRail ? 16 : RAIL + 12 }
    : { rail, l: 0, r: 0, t: statusTop, b: 96, tr: statusSide ? 92 : 16 };

  const shownAlbum = album && album.tab === tab ? album.id : null;

  const show = (t: Tab) => {
    // Tapping the tab you're on pops back to its root, as on iOS.
    if (t === tab && album?.tab === t) back();
    setTab(t);
    setSeen((s) => (s.has(t) ? s : new Set(s).add(t)));
  };

  const openAlbum = useCallback((aid: string) => setAlbum({ id: aid, tab }), [tab]);

  const toLibrary = useCallback((v: View) => {
    setView(v);
    setTab("library");
  }, []);

  // Push: the album slides in over its tab.
  useLayoutEffect(() => {
    const el = albumEl.current;
    if (!el || mirror || reducedMotion()) return;
    const sp = LAUNCH();
    gsap.fromTo(el, { xPercent: 100 }, { xPercent: 0, duration: sp.duration, ease: sp.ease });
  }, [shownAlbum, mirror]);

  const back = useCallback(() => {
    const el = albumEl.current;
    if (!el || reducedMotion()) return setAlbum(null);
    const sp = SNAP();
    gsap.to(el, { xPercent: 100, duration: sp.duration * 0.8, ease: sp.ease, onComplete: () => setAlbum(null) });
  }, []);

  const openPhoto = useCallback(
    (list: Photo[], ph: Photo, el: HTMLElement) => {
      if (mirror) return;
      setCurrent(ph.id);
      setViewer({ list, start: Math.max(0, list.indexOf(ph)), origin: el });
    },
    [mirror],
  );

  // The visible cell for a photo: the topmost surface wins (an album over its tab).
  const thumbFor = useCallback((pid: string) => {
    const all = root.current?.querySelectorAll<HTMLElement>(`[data-thumb="${CSS.escape(pid)}"]`) ?? [];
    let hit: HTMLElement | null = null;
    all.forEach((el) => {
      if (el.getClientRects().length) hit = el;
    });
    return hit;
  }, []);

  const closed = useCallback(() => {
    setViewer(null);
    setCurrent(null);
  }, []);

  const toggleFav = useCallback((pid: string) => {
    setFavs((s) => {
      const n = new Set(s);
      if (n.has(pid)) n.delete(pid);
      else n.add(pid);
      return n;
    });
  }, []);

  // Escape walks back out of an album when no photo is open.
  useEffect(() => {
    if (mirror || !focused || viewer || !shownAlbum) return;
    const on = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      back();
    };
    window.addEventListener("keydown", on, true);
    return () => window.removeEventListener("keydown", on, true);
  }, [mirror, focused, viewer, shownAlbum, back]);

  // Panes stay mounted (each keeps its scroll); the hidden ones are display: none.
  const pane = (t: Tab) => (tab === t ? "" : "hidden");
  // The floating bar shrinks to a circle while Library is back in time.
  const mini = !rail && tab === "library" && (away || view !== "all");
  const backBtn = shownAlbum ? (
    <GlassButton size={rail ? 48 : 44} aria-label="Back" title="Back" onClick={back}>
      <ChevronLeft size={22} />
    </GlassButton>
  ) : null;

  return (
    <Favs.Provider value={favs}>
      <div ref={root} className="relative overflow-hidden bg-bg font-sans text-label select-none" style={{ width, height }}>
        <div className={pane("library")}>
          <Library
            width={width}
            frame={frame}
            mirror={mirror}
            hiddenId={current}
            onOpen={openPhoto}
            view={view}
            onView={setView}
            onAway={setAway}
            showSegments={rail || mini}
            jump={jump}
          />
        </div>
        {seen.has("collections") ? (
          <div className={pane("collections")}>
            <Collections width={width} frame={frame} onAlbum={openAlbum} onLibrary={toLibrary} />
          </div>
        ) : null}
        {seen.has("search") ? (
          <div className={pane("search")}>
            <Search
              width={width}
              frame={frame}
              mirror={mirror}
              active={tab === "search" && !shownAlbum}
              hiddenId={current}
              onOpen={openPhoto}
              onAlbum={openAlbum}
            />
          </div>
        ) : null}

        {shownAlbum ? (
          <div key={shownAlbum} ref={albumEl} className="absolute inset-0 z-[15] bg-bg shadow-[-12px_0_32px_rgba(0,0,0,0.12)]">
            <Album id={shownAlbum} width={width} frame={frame} mirror={mirror} hiddenId={current} onOpen={openPhoto} nav={rail ? null : backBtn} />
          </div>
        ) : null}

        {rail ? (
          // The side rail on the outer edge: Back at the top, the tab bar
          // and Search bottom-aligned. Glass floating over the content.
          <nav aria-label="Photos" className="pointer-events-none absolute inset-y-0 z-20 *:pointer-events-auto" style={{ [leftRail ? "left" : "right"]: 0, width: RAIL }}>
            {backBtn ? (
              <div className="absolute" style={{ [leftRail ? "left" : "right"]: RAIL_INSET, top: leftRail ? 24 : 122 }}>
                {backBtn}
              </div>
            ) : null}
            <div className="absolute flex w-[48px] flex-col items-center gap-[12px]" style={{ [leftRail ? "left" : "right"]: RAIL_INSET, bottom: 24 }}>
              <TabBar vertical tab={tab} onTab={show} />
              <SearchButton size={48} on={tab === "search"} onClick={() => show("search")} />
            </div>
          </nav>
        ) : (
          // iOS 26's floating tab bar: the capsule leading, Search trailing.
          <nav aria-label="Photos" className="pointer-events-none absolute inset-x-[16px] bottom-[24px] z-20 flex items-end justify-between *:pointer-events-auto">
            {mini ? (
              <TabCircle
                tab={tab}
                onClick={() => {
                  setView("all");
                  setJump((j) => j + 1);
                }}
              />
            ) : (
              <TabBar tab={tab} onTab={show} />
            )}
            <SearchButton size={62} on={tab === "search"} onClick={() => show("search")} />
          </nav>
        )}

        {viewer ? (
          <Viewer
            list={viewer.list}
            start={viewer.start}
            origin={viewer.origin}
            width={width}
            height={height}
            slot={slot}
            rail={rail}
            top={statusTop}
            statusSide={statusSide}
            focused={focused}
            favs={favs}
            onFav={toggleFav}
            thumbFor={thumbFor}
            onIndex={setCurrent}
            onClosed={closed}
          />
        ) : null}
      </div>
    </Favs.Provider>
  );
}
