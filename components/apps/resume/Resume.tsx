"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/site";
import type { AppProps } from "../types";
import { Glyph, Rail, RailButton, RailGroup, contentBox } from "../settings/ios";
import { DocGlyph, SectionGlyph } from "./glyphs";
import { KIND, PAGES, SIZE, type Section } from "./pages";

// Résumé, as iOS 26's Preview shows a PDF: the filename over the document
// with its kind and size under it and a ⌄ menu, the pages laid on a neutral
// canvas with soft shadows, and the toolbar on the Duo's glass rail (Close,
// the prominent Download, then the sidebar, Share, Open in New Tab and Zoom
// in one capsule). With room, a floating glass sidebar holds the page
// thumbnail and the CV's outline, following the scroll; in a half it moves
// into the title menu. The pages are the CV itself, drawn as vectors with
// its links laid over them; the PDF is one tap away for anything else.

const FILE = profile.cv.href;
const NAME = FILE.split("/").pop()!.replace(/\.pdf$/i, "");
const SECTIONS = PAGES.flatMap((p, page) => p.sections.map((s) => ({ ...s, page })));

/** Canvas margins around the pages, the room the title takes, and the
 *  edge under it where the page fades. */
const TOP = 96;
const SIDE = 28;
const FOOT = 36;
const EDGE = 124;
const PAGE_GAP = 24;

/** The floating sidebar, inset concentric with the window's corner. */
const SIDEBAR_W = 268;
const INSET = 12;

/** A page's width in points, and its height. */
const PW = 612;
const PH = 792;

const absolute = () => new URL(FILE, window.location.href).href;

export default function Resume({ width, height, slot, mirror, close }: AppProps) {
  const box = contentBox(slot, width);
  // The sidebar is on offer beside a full window, and open by default only
  // where the page keeps a readable width beside it.
  const roomy = box.width >= 800;
  const [sidebar, setSidebar] = useState(() => box.width >= 920);
  const showSidebar = roomy && sidebar;
  const [zoomed, setZoomed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [note, setNote] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [current, setCurrent] = useState<Section["id"]>(SECTIONS[0]!.id);
  const scroller = useRef<HTMLDivElement>(null);
  const firstPage = useRef<HTMLDivElement>(null);
  const settle = useRef(0);
  /** The section a jump is heading to: the outline holds it until the
   *  scroll comes to rest, whatever passes under the title on the way. */
  const heading = useRef<Section["id"] | null>(null);

  // The page fits the document's width (capped, so a full-screen page stays
  // a page). Zoom shows the whole page where there's room for it, and in a
  // narrow window, where the page already fits, magnifies it to pan around.
  const docW = box.width - (showSidebar ? SIDEBAR_W + INSET : 0);
  const compact = width < 600;
  const wide = Math.min(docW - SIDE * 2, 680);
  const pageW = !zoomed ? wide : compact ? wide * 1.8 : Math.min(wide, ((height - TOP - FOOT) * PW) / PH);
  const zoomLabel = compact ? (zoomed ? "Zoom Out" : "Zoom In") : zoomed ? "Fit to Width" : "Show Whole Page";
  const zoomGlyph = compact === zoomed ? DocGlyph.zoomOut : DocGlyph.zoomIn;

  useEffect(() => {
    if (!note) return;
    const t = window.setTimeout(() => setNote(""), 1600);
    return () => window.clearTimeout(t);
  }, [note]);

  useEffect(() => () => cancelAnimationFrame(settle.current), []);

  /** Where a point of the document sits: the page under it and the point
   *  on that page, as fractions, so a zoom can keep it in place. */
  const pin = (clientX: number, clientY: number) => {
    const sc = scroller.current, pg = firstPage.current;
    if (!sc || !pg) return null;
    const r = sc.getBoundingClientRect(), s = r.width / sc.offsetWidth || 1;
    const x = (clientX - r.left) / s, y = (clientY - r.top) / s;
    const h = pg.offsetHeight + PAGE_GAP;
    return { x, y, fx: (sc.scrollLeft + x - pg.offsetLeft) / pg.offsetWidth, fy: (sc.scrollTop + y - TOP) / h };
  };

  /** Zoom about a point (the middle of the view, or where it was double
   *  clicked), holding it under the pointer while the page resizes. */
  const zoom = (at?: { clientX: number; clientY: number }) => {
    const sc = scroller.current;
    const r = sc?.getBoundingClientRect();
    const p = r && pin(at?.clientX ?? r.left + r.width / 2, at?.clientY ?? r.top + r.height / 2);
    setZoomed((z) => !z);
    if (!p) return;
    cancelAnimationFrame(settle.current);
    const until = performance.now() + 560;
    const follow = () => {
      const sc = scroller.current, pg = firstPage.current;
      if (!sc || !pg) return;
      sc.scrollLeft = pg.offsetLeft + p.fx * pg.offsetWidth - p.x;
      sc.scrollTop = TOP + p.fy * (pg.offsetHeight + PAGE_GAP) - p.y;
      if (performance.now() < until) settle.current = requestAnimationFrame(follow);
    };
    settle.current = requestAnimationFrame(follow);
  };

  /** Bring a section's heading up under the title. */
  const jump = (s: (typeof SECTIONS)[number]) => {
    setMenu(false);
    const sc = scroller.current, pg = firstPage.current;
    if (!sc || !pg) return;
    const h = pg.offsetHeight;
    heading.current = s.id;
    setCurrent(s.id);
    const top = Math.min(sc.scrollHeight - sc.clientHeight, TOP + s.page * (h + PAGE_GAP) + (s.top / PH) * h - EDGE + 8);
    if (Math.abs(top - sc.scrollTop) < 1) heading.current = null;
    else sc.scrollTo({ top, behavior: "smooth" });
  };

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const sc = e.currentTarget, pg = firstPage.current;
    setScrolled(sc.scrollTop > 4);
    if (!pg || heading.current) return;
    // The section whose heading last passed under the title; at the end of
    // the document, the last one, however short.
    const h = pg.offsetHeight;
    const line = sc.scrollTop + EDGE + 24;
    let at = SECTIONS[0]!.id;
    for (const s of SECTIONS) if (TOP + s.page * (h + PAGE_GAP) + (s.top / PH) * h <= line) at = s.id;
    if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2) at = SECTIONS[SECTIONS.length - 1]!.id;
    setCurrent(at);
  };

  const copy = () => {
    setMenu(false);
    navigator.clipboard?.writeText(absolute()).then(
      () => setNote("Link Copied"),
      () => {},
    );
  };
  const share = () => {
    if (navigator.share) navigator.share({ title: `${profile.name}, CV`, url: absolute() }).catch(() => {});
    else copy();
  };

  return (
    <div className="relative h-full bg-bg-2 text-label">
      <div
        className="absolute inset-y-0 flex"
        style={{ left: box.left, width: box.width }}
        onKeyDown={(e) => {
          // Escape shuts the menu before it would close the window.
          if (e.key === "Escape" && menu) {
            e.stopPropagation();
            setMenu(false);
          }
        }}
      >
        {/* The sidebar's column closes to nothing; the panel keeps its width
            and slides out with it, so nothing inside reflows. */}
        {roomy ? (
          <div
            className="relative h-full shrink-0 overflow-hidden transition-[width] duration-500 ease-ios"
            style={{ width: showSidebar ? SIDEBAR_W + INSET : 0 }}
          >
            <aside
              aria-label="Contents"
              className="glass absolute flex flex-col overflow-hidden rounded-[28px] transition-transform duration-500 ease-ios"
              style={{
                top: INSET,
                bottom: INSET,
                left: INSET,
                width: SIDEBAR_W,
                transform: showSidebar ? undefined : `translateX(${-SIDEBAR_W - INSET * 2}px)`,
              }}
            >
              <div className="no-scrollbar flex-1 overflow-auto px-[12px] pt-[22px] pb-[16px]">
                <h2 className="px-[10px] text-[28px] leading-[34px] font-bold tracking-[0.01em]">Contents</h2>

                <div className="mt-[18px] flex flex-col items-center gap-[8px]">
                  {PAGES.map((p, i) => (
                    <button
                      key={p.src}
                      type="button"
                      aria-label={`Page ${i + 1}`}
                      onClick={() => scroller.current?.scrollTo({ top: 0, behavior: "smooth" })}
                      className="group flex flex-col items-center gap-[6px]"
                    >
                      <span className="block w-[104px] rounded-[6px] p-[3px] ring-[2.5px] ring-blue transition-[scale] duration-300 ease-ios group-active:scale-95">
                        {/* eslint-disable-next-line @next/next/no-img-element -- the page itself, as a thumbnail */}
                        <img src={p.src} alt="" draggable={false} className="block w-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.16)]" style={{ aspectRatio: `${PW} / ${PH}` }} />
                      </span>
                      <span className="rounded-full bg-blue px-[8px] text-[13px] leading-[18px] font-semibold text-white tabular-nums">{i + 1}</span>
                    </button>
                  ))}
                </div>

                <h3 className="mt-[22px] mb-[4px] px-[10px] text-[15px] leading-[20px] font-semibold text-label-2">Outline</h3>
                <ul>
                  {SECTIONS.map((s) => (
                    <li key={s.id}>
                      <SectionRow section={s} active={s.id === current} onPick={() => jump(s)} />
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        ) : null}

        <div className="relative h-full min-w-0 flex-1">
          <div
            ref={scroller}
            className="no-scrollbar h-full overflow-auto overscroll-contain"
            onScroll={mirror ? undefined : onScroll}
            onScrollEnd={() => (heading.current = null)}
            // A wheel or a drag takes the outline back from a jump.
            onWheel={() => (heading.current = null)}
            onPointerDown={() => (heading.current = null)}
          >
            <div
              className="flex w-fit min-w-full flex-col items-center"
              style={{ padding: `${TOP}px ${SIDE}px ${FOOT}px`, gap: PAGE_GAP }}
            >
              {PAGES.map((p, i) => (
                <div
                  key={p.src}
                  ref={i === 0 ? firstPage : undefined}
                  // Double click zooms about the point, as in Preview.
                  onDoubleClick={(e) => {
                    if ((e.target as HTMLElement).closest("a")) return;
                    zoom(e);
                  }}
                  className="relative shrink-0 bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06),0_14px_40px_rgba(0,0,0,0.12)] transition-[width] duration-500 ease-ios"
                  style={{ width: pageW, aspectRatio: `${PW} / ${PH}`, cursor: zoomed ? "zoom-out" : "zoom-in" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- a vector page, drawn at any zoom */}
                  <img
                    src={p.src}
                    alt={`${profile.name}, CV, page ${i + 1} of ${PAGES.length}`}
                    draggable={false}
                    decoding="async"
                    className="block size-full select-none"
                  />
                  {p.links.map((l, j) => (
                    <a
                      key={j}
                      href={l.href}
                      target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      aria-label={l.label}
                      title={l.label}
                      className="absolute cursor-pointer rounded-[3px] transition-colors hover:bg-[rgba(0,113,227,0.12)] focus-visible:bg-[rgba(0,113,227,0.16)] focus-visible:outline-none"
                      style={{
                        left: `${(l.rect[0] / PW) * 100}%`,
                        top: `${((PH - l.rect[3]) / PH) * 100}%`,
                        width: `${((l.rect[2] - l.rect[0]) / PW) * 100}%`,
                        height: `${((l.rect[3] - l.rect[1]) / PH) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* No bar: the canvas fades under the title, solid behind its two
              lines so the page never reads through them. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 bg-[linear-gradient(to_bottom,var(--bg-2)_60%,color-mix(in_srgb,var(--bg-2)_70%,transparent)_78%,transparent)] backdrop-blur-[3px] transition-opacity duration-300 [mask-image:linear-gradient(to_bottom,#000_70%,transparent)]"
            style={{ height: EDGE, opacity: scrolled ? 1 : 0 }}
          />

          {/* The filename, its kind and size under it, with its menu: tap it as in Preview. */}
          <div className="absolute inset-x-0 top-[24px] flex justify-center">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menu}
              onClick={() => setMenu((m) => !m)}
              className="flex max-w-[80%] flex-col items-center rounded-[22px] px-[16px] py-[5px] transition-[background-color,scale] duration-300 ease-ios hover:bg-fill-3 active:scale-105 active:bg-fill-2"
            >
              <span className="flex max-w-full items-center gap-[5px] text-[17px] leading-[22px] font-semibold tracking-[-0.022em]">
                <span className="truncate">{NAME}</span>
                <span className={`text-label-2 transition-transform duration-300 ease-ios ${menu ? "rotate-180" : ""}`}>{DocGlyph.caret}</span>
              </span>
              <span className="text-[12px] leading-[16px] text-label-2">
                {KIND} · {SIZE}
              </span>
            </button>
          </div>

          {menu && !mirror ? (
            <>
              <button
                type="button"
                aria-label="Close Menu"
                className="absolute inset-0 cursor-default"
                tabIndex={-1}
                onClick={() => setMenu(false)}
              />
              <div
                role="menu"
                aria-label={NAME}
                className="glass absolute top-[80px] left-1/2 z-10 w-[268px] -translate-x-1/2 origin-top animate-bloom rounded-[30px] bg-(--glass-strong) p-[8px]"
              >
                {/* The document, as Preview heads its menu. */}
                <div className="flex items-center gap-[12px] px-[12px] pt-[6px] pb-[10px]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- the page, as the file's icon */}
                  <img src={PAGES[0]!.src} alt="" draggable={false} className="w-[30px] shrink-0 bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.14)]" style={{ aspectRatio: `${PW} / ${PH}` }} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] leading-[20px] font-semibold">{NAME}.pdf</span>
                    <span className="block text-[13px] leading-[18px] text-label-2">
                      {KIND} · {SIZE}
                    </span>
                  </span>
                </div>
                <Rule />
                <MenuItem href={FILE} external glyph={Glyph.open} label="Open in New Tab" onPick={() => setMenu(false)} />
                <MenuItem href={FILE} download={`${NAME}.pdf`} glyph={Glyph.download} label="Download" onPick={() => setMenu(false)} />
                <MenuItem glyph={DocGlyph.link} label="Copy Link" onPick={copy} />
                {/* No sidebar here: the outline lives in the menu. */}
                {showSidebar ? null : (
                  <>
                    <Rule />
                    <p className="px-[14px] pt-[4px] pb-[2px] text-[13px] leading-[18px] font-semibold text-label-2">Jump To</p>
                    {SECTIONS.map((s) => (
                      <SectionRow key={s.id} section={s} active={s.id === current} onPick={() => jump(s)} menu />
                    ))}
                  </>
                )}
              </div>
            </>
          ) : null}

          {note ? (
            <p
              role="status"
              className="glass absolute bottom-[40px] left-1/2 -translate-x-1/2 animate-bloom rounded-full px-[18px] py-[10px] text-[15px] leading-[20px] font-semibold whitespace-nowrap"
            >
              {note}
            </p>
          ) : null}
        </div>
      </div>

      <Rail slot={slot}>
        <RailButton label="Close Résumé" onClick={close}>
          {Glyph.close}
        </RailButton>
        <RailButton label="Download" href={FILE} download={`${NAME}.pdf`} prominent="var(--blue)">
          {Glyph.download}
        </RailButton>
        <RailGroup>
          {roomy ? (
            <RailButton bare label={sidebar ? "Hide Sidebar" : "Show Sidebar"} onClick={() => setSidebar((v) => !v)}>
              {Glyph.sidebar}
            </RailButton>
          ) : null}
          <RailButton bare label="Share" onClick={share}>
            {DocGlyph.share}
          </RailButton>
          <RailButton bare label="Open in New Tab" href={FILE} external>
            {Glyph.open}
          </RailButton>
          <RailButton bare label={zoomLabel} onClick={() => zoom()}>
            {zoomGlyph}
          </RailButton>
        </RailGroup>
      </Rail>
    </div>
  );
}

const Rule = () => <span className="mx-[14px] my-[6px] block h-px bg-label-4" />;

/** An outline row: the section's symbol, its name and its page. The one
 *  being read is filled, its symbol in the accent. */
function SectionRow({
  section,
  active,
  onPick,
  menu,
}: {
  section: (typeof SECTIONS)[number];
  active: boolean;
  onPick: () => void;
  menu?: boolean;
}) {
  return (
    <button
      type="button"
      role={menu ? "menuitem" : undefined}
      aria-current={active ? "location" : undefined}
      onClick={onPick}
      className={`flex h-[44px] w-full items-center gap-[12px] rounded-[22px] px-[14px] text-left text-[17px] leading-[22px] tracking-[-0.022em] transition-colors active:bg-fill-2 ${
        active ? "bg-fill-3 font-semibold" : "hover:bg-fill-3"
      }`}
    >
      <span className={`grid w-[22px] place-items-center transition-colors ${active ? "text-blue" : "text-label-2"}`}>{SectionGlyph[section.id]}</span>
      <span className="flex-1 truncate">{section.label}</span>
      <span className="text-[15px] font-normal text-label-2 tabular-nums">{section.page + 1}</span>
    </button>
  );
}

function MenuItem({
  glyph,
  label,
  href,
  external,
  download,
  onPick,
}: {
  glyph: React.ReactNode;
  label: string;
  href?: string;
  external?: boolean;
  download?: string;
  onPick: () => void;
}) {
  const cls =
    "flex h-[44px] w-full items-center gap-[12px] rounded-[22px] px-[14px] text-left text-[17px] leading-[22px] tracking-[-0.022em] text-label transition-colors hover:bg-fill-3 active:bg-fill-2";
  const inner = (
    <>
      <span className="grid w-[22px] place-items-center">{glyph}</span>
      {label}
    </>
  );
  return href ? (
    <a
      role="menuitem"
      href={href}
      download={download}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={onPick}
      className={cls}
    >
      {inner}
    </a>
  ) : (
    <button type="button" role="menuitem" onClick={onPick} className={cls}>
      {inner}
    </button>
  );
}
