"use client";

import { useEffect, useState } from "react";
import { profile } from "@/content/site";
import type { AppProps } from "../types";
import { Glyph, Rail, RailButton, RailGroup, contentBox } from "../settings/ios";
import { DocGlyph } from "./glyphs";
import { PAGES } from "./pages";

// Résumé, as iOS 26's Preview shows a PDF: the filename over the document
// with a ⌄ menu, the pages laid on a neutral canvas with soft shadows, and
// the toolbar on the Duo's glass rail (Close, the prominent Download, then
// Share, Open in New Tab and Zoom in one capsule). The pages are the CV
// itself, drawn as vectors with its links laid over them; the PDF is one
// tap away for anything else.

const FILE = profile.cv.href;
const NAME = FILE.split("/").pop()!.replace(/\.pdf$/i, "");

/** Canvas margins around the pages, and the room the title takes. */
const TOP = 82;
const SIDE = 28;
const FOOT = 36;

const absolute = () => new URL(FILE, window.location.href).href;

export default function Resume({ width, height, slot, mirror, close }: AppProps) {
  const box = contentBox(slot, width);
  const [zoomed, setZoomed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [note, setNote] = useState("");
  const [scrolled, setScrolled] = useState(false);

  // The page fits the width (capped, so a full-screen page stays a page).
  // Zoom shows the whole page where there's room for it, and in a narrow
  // window, where the page already fits, magnifies it to pan around.
  const compact = width < 600;
  const wide = Math.min(box.width - SIDE * 2, 680);
  const pageW = !zoomed ? wide : compact ? wide * 1.8 : Math.min(wide, ((height - TOP - FOOT) * 612) / 792);
  const zoomLabel = compact ? (zoomed ? "Zoom Out" : "Zoom In") : zoomed ? "Fit to Width" : "Show Whole Page";
  const zoomGlyph = compact === zoomed ? DocGlyph.zoomOut : DocGlyph.zoomIn;

  useEffect(() => {
    if (!note) return;
    const t = window.setTimeout(() => setNote(""), 1600);
    return () => window.clearTimeout(t);
  }, [note]);

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
        className="absolute inset-y-0"
        style={{ left: box.left, width: box.width }}
        onKeyDown={(e) => {
          // Escape shuts the menu before it would close the window.
          if (e.key === "Escape" && menu) {
            e.stopPropagation();
            setMenu(false);
          }
        }}
      >
        <div
          className="no-scrollbar h-full overflow-auto overscroll-contain"
          onScroll={mirror ? undefined : (e) => setScrolled(e.currentTarget.scrollTop > 4)}
        >
          <div
            className="flex w-fit min-w-full flex-col items-center gap-[24px]"
            style={{ padding: `${TOP}px ${SIDE}px ${FOOT}px` }}
          >
            {PAGES.map((p, i) => (
              <div
                key={p.src}
                className="relative shrink-0 bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06),0_14px_40px_rgba(0,0,0,0.12)] transition-[width] duration-500 ease-ios"
                style={{ width: pageW, aspectRatio: "612 / 792" }}
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
                    className="absolute rounded-[3px] transition-colors hover:bg-[rgba(0,113,227,0.12)] focus-visible:bg-[rgba(0,113,227,0.16)] focus-visible:outline-none"
                    style={{
                      left: `${(l.rect[0] / 612) * 100}%`,
                      top: `${((792 - l.rect[3]) / 792) * 100}%`,
                      width: `${((l.rect[2] - l.rect[0]) / 612) * 100}%`,
                      height: `${((l.rect[3] - l.rect[1]) / 792) * 100}%`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* No bar: the canvas fades under the title. */}
        <div
          className="scroll-edge-top absolute inset-x-0 top-0 h-[92px] transition-opacity duration-300 [--edge:var(--bg-2)]"
          style={{ opacity: scrolled ? 1 : 0 }}
        />

        {/* The filename, with its menu: tap it as in Preview. */}
        <div className="absolute inset-x-0 top-[26px] flex justify-center">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
            className="flex h-[40px] max-w-[80%] items-center gap-[5px] rounded-full px-[14px] text-[17px] leading-[22px] font-semibold tracking-[-0.022em] transition-[background-color,scale] duration-300 ease-ios hover:bg-fill-3 active:scale-105 active:bg-fill-2"
          >
            <span className="truncate">{NAME}</span>
            <span className={`text-label-2 transition-transform duration-300 ease-ios ${menu ? "rotate-180" : ""}`}>{DocGlyph.caret}</span>
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
              className="glass absolute top-[72px] left-1/2 z-10 w-[250px] -translate-x-1/2 origin-top animate-bloom rounded-[30px] bg-(--glass-strong) p-[8px]"
            >
              <MenuItem href={FILE} external glyph={Glyph.open} label="Open in New Tab" onPick={() => setMenu(false)} />
              <MenuItem href={FILE} download={`${NAME}.pdf`} glyph={Glyph.download} label="Download" onPick={() => setMenu(false)} />
              <span className="mx-[14px] my-[6px] block h-px bg-label-4" />
              <MenuItem glyph={DocGlyph.link} label="Copy Link" onPick={copy} />
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

      <Rail slot={slot}>
        <RailButton label="Close Résumé" onClick={close}>
          {Glyph.close}
        </RailButton>
        <RailButton label="Download" href={FILE} download={`${NAME}.pdf`} prominent="var(--blue)">
          {Glyph.download}
        </RailButton>
        <RailGroup>
          <RailButton bare label="Share" onClick={share}>
            {DocGlyph.share}
          </RailButton>
          <RailButton bare label="Open in New Tab" href={FILE} external>
            {Glyph.open}
          </RailButton>
          <RailButton bare label={zoomLabel} onClick={() => setZoomed((z) => !z)}>
            {zoomGlyph}
          </RailButton>
        </RailGroup>
      </Rail>
    </div>
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
