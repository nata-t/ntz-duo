"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { reducedMotion } from "@/lib/env";
import { LAUNCH, SNAP } from "@/lib/spring";
import { os, useOS } from "@/lib/os";
import type { AppProps } from "../types";
import type { Photo } from "./data";
import Library from "./Library";
import Collections from "./Collections";
import Search from "./Search";
import Album from "./Album";
import Viewer from "./Viewer";
import { ChevronLeft, CollectionsIcon, LibraryIcon, SearchIcon } from "./icons";
import { GlassButton, RAIL } from "./ui";

type Tab = "library" | "collections" | "search";
type Open = { list: Photo[]; start: number; origin: HTMLElement };

const TABS: { id: Exclude<Tab, "search">; label: string; Icon: typeof LibraryIcon }[] = [
  { id: "library", label: "Library", Icon: LibraryIcon },
  { id: "collections", label: "Collections", Icon: CollectionsIcon },
];

// Photos, iOS 26/27: Library and Collections tabs plus a separate Search
// button, on a vertical Liquid Glass bar at the window's outer edge (iPhone
// Duo puts tab bars on the side in landscape). Albums push over their tab;
// photos open in a viewer that zooms out of their cell.
export default function Photos({ id, width, height, slot, mirror }: AppProps) {
  const focused = useOS((s) => s.focus === id);
  const [tab, setTab] = useState<Tab>("library");
  const [seen, setSeen] = useState<Set<Tab>>(() => new Set(["library"]));
  const [album, setAlbum] = useState<{ id: string; tab: Tab } | null>(null);
  const [viewer, setViewer] = useState<Open | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

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

  const leftRail = slot === "left";
  const cw = width - RAIL;
  const cx = leftRail ? RAIL : 0;
  const shownAlbum = album && album.tab === tab ? album.id : null;

  const show = (t: Tab) => {
    // Tapping the tab you're on pops back to its root, as on iOS.
    if (t === tab && album?.tab === t) back();
    setTab(t);
    setSeen((s) => (s.has(t) ? s : new Set(s).add(t)));
  };

  const openAlbum = useCallback((aid: string) => setAlbum({ id: aid, tab }), [tab]);

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

  // Panes stay mounted (each keeps its scroll); the shown one fades in.
  const pane = (t: Tab) => (tab === t ? "animate-fade-in motion-reduce:animate-none" : "hidden");
  // The control column sits 24 pt from the screen edge (Duo UI kit).
  const col = leftRail ? 24 : 12;

  return (
    <div ref={root} className="relative overflow-hidden bg-bg font-sans text-label select-none" style={{ width, height }}>
      <div className={pane("library")}>
        <Library width={cw} left={cx} mirror={mirror} hiddenId={current} onOpen={openPhoto} />
      </div>
      {seen.has("collections") ? (
        <div className={pane("collections")}>
          <Collections width={cw} left={cx} onAlbum={openAlbum} />
        </div>
      ) : null}
      {seen.has("search") ? (
        <div className={pane("search")}>
          <Search width={cw} left={cx} mirror={mirror} active={tab === "search" && !shownAlbum} hiddenId={current} onOpen={openPhoto} onAlbum={openAlbum} />
        </div>
      ) : null}

      {shownAlbum ? (
        <div key={shownAlbum} ref={albumEl} className="absolute inset-0 z-[15] shadow-[-12px_0_32px_rgba(0,0,0,0.12)]">
          <Album id={shownAlbum} width={cw} left={cx} mirror={mirror} hiddenId={current} onOpen={openPhoto} />
        </div>
      ) : null}

      {/* The side bar on the outer edge: Back at the top, tabs and Search at the bottom. */}
      <nav aria-label="Photos" className="absolute inset-y-0 z-20 bg-bg" style={{ [leftRail ? "left" : "right"]: 0, width: RAIL }}>
        {shownAlbum ? (
          <GlassButton
            size={48}
            aria-label="Back"
            title="Back"
            onClick={back}
            className="absolute"
            style={{ left: col, top: leftRail ? 24 : 122 }}
          >
            <ChevronLeft size={22} />
          </GlassButton>
        ) : null}

        <div className="absolute flex flex-col items-center gap-[12px]" style={{ left: col, bottom: 24, width: 48 }}>
          <div role="tablist" aria-orientation="vertical" className="glass flex flex-col gap-[2px] rounded-full p-[4px]">
            {TABS.map(({ id: t, label, Icon }) => {
              const on = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-label={label}
                  title={label}
                  onClick={() => show(t)}
                  className={`grid h-[48px] w-[40px] place-items-center rounded-full transition-colors duration-200 ${on ? "bg-fill-2 text-blue" : "text-label hover:bg-fill-3"}`}
                >
                  <Icon size={24} />
                </button>
              );
            })}
          </div>
          <GlassButton
            size={48}
            aria-label="Search"
            title="Search"
            aria-pressed={tab === "search"}
            onClick={() => show("search")}
            className={tab === "search" ? "!text-blue" : ""}
          >
            <SearchIcon size={21} />
          </GlassButton>
        </div>
      </nav>

      {viewer ? (
        <Viewer
          list={viewer.list}
          start={viewer.start}
          origin={viewer.origin}
          width={width}
          height={height}
          slot={slot}
          focused={focused}
          thumbFor={thumbFor}
          onIndex={setCurrent}
          onClosed={closed}
        />
      ) : null}
    </div>
  );
}
