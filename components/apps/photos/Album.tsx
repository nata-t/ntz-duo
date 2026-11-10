"use client";

import { useCallback, useMemo, useState } from "react";
import { findAlbum, HIDDEN_ID, hiddenAlbums, type Photo } from "./data";
import Grid from "./Grid";
import { FaceIdIcon, LockIcon } from "./icons";
import { LargeTitle, headerH, plural, type Frame } from "./ui";

type Props = {
  id: string;
  width: number;
  frame: Frame;
  mirror: boolean;
  hiddenId: string | null;
  onOpen: (list: Photo[], photo: Photo, el: HTMLElement) => void;
  /** The back button, when it sits over the title rather than on the rail. */
  nav: React.ReactNode;
};

// One album, pushed over Collections. Hidden starts locked, as on iOS.
export default function Album({ id, width, frame, mirror, hiddenId, onOpen, nav }: Props) {
  const album = useMemo(() => findAlbum(id), [id]);
  const [unlocked, setUnlocked] = useState(false);
  const [scanning, setScanning] = useState(false);
  const cols = width - frame.l - frame.r < 600 ? 3 : 6;
  const top = headerH(frame, !!nav);
  const textPad = { paddingLeft: frame.l + 18, paddingRight: frame.r + 18 };
  const open = useCallback((ph: Photo, el: HTMLElement) => onOpen(album?.photos ?? [], ph, el), [onOpen, album]);
  if (!album) return null;

  const hidden = id === HIDDEN_ID;
  const p = album.project;
  const sub = hidden ? (unlocked ? plural(hiddenAlbums.length, "project") : "") : `${plural(album.photos.length, "Photo")} · ${album.sub}`;

  const unlock = () => {
    if (mirror) return;
    setScanning(true);
    // A beat for the Face ID glyph, then in.
    window.setTimeout(() => setUnlocked(true), 650);
  };

  return (
    <div className="absolute inset-0 bg-bg">
      {hidden && !unlocked ? (
        <div className="grid h-full place-items-center text-center" style={{ paddingLeft: frame.l + 32, paddingRight: frame.r + 32 }}>
          <div className="flex max-w-[320px] flex-col items-center">
            <span className={`grid size-[64px] place-items-center text-label-2 ${scanning ? "animate-scan motion-reduce:animate-none" : ""}`}>
              {scanning ? <FaceIdIcon size={58} className="text-blue" /> : <LockIcon size={50} />}
            </span>
            <h2 className="mt-[14px] text-[22px] leading-[28px] font-bold tracking-[-0.01em] text-label">Hidden Album Locked</h2>
            <p className="mt-[6px] text-[15px] leading-[20px] text-label-2">
              {hiddenAlbums.map((a) => a.title).join(" and ")} run inside bank networks, so their screens stay private.
            </p>
            <button
              type="button"
              onClick={unlock}
              className="glass glass-tint mt-[18px] h-[48px] rounded-full px-[24px] text-[17px] font-semibold tracking-[-0.02em] text-white transition-transform duration-300 ease-ios active:scale-110"
            >
              View Album
            </button>
          </div>
        </div>
      ) : (
        <div data-scroll className="h-full overflow-y-auto overscroll-contain no-scrollbar">
          <div className="animate-fade-in motion-reduce:animate-none" style={{ paddingTop: top + 4, paddingBottom: frame.b }}>
            {hidden ? (
              hiddenAlbums.map((a) => (
                <section key={a.id} className="mb-[8px]">
                  <header className="pt-[14px] pb-[10px]" style={textPad}>
                    <h2 className="text-[17px] leading-[22px] font-semibold tracking-[-0.02em] text-label">{a.title}</h2>
                    <p className="text-[13px] leading-[18px] text-label-2">{a.sub}</p>
                    <p className="mt-[4px] max-w-[560px] text-[13px] leading-[18px] text-label-2">{a.project!.summary}</p>
                  </header>
                  <Grid photos={a.photos} cols={cols} hiddenId={hiddenId} onOpen={open} />
                </section>
              ))
            ) : (
              <Grid photos={album.photos} cols={cols} hiddenId={hiddenId} onOpen={open} />
            )}
            <footer className="mx-auto max-w-[580px] pt-[22px] pb-[44px] text-center" style={textPad}>
              <p className="text-[15px] leading-[20px] font-semibold tracking-[-0.01em] text-label">{plural(album.photos.length, "Photo")}</p>
              {hidden ? <p className="mt-[2px] text-[13px] leading-[18px] text-label-2">Placeholders until photos can be shared.</p> : null}
              {p ? (
                <>
                  <p className="mt-[6px] text-[13px] leading-[18px] text-label-2">{p.summary}</p>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noreferrer" className="mt-[8px] inline-block text-[15px] text-blue">
                      Visit site ›
                    </a>
                  ) : null}
                </>
              ) : null}
            </footer>
          </div>
        </div>
      )}

      <LargeTitle title={album.title} sub={sub} frame={frame} width={width} nav={nav} />
    </div>
  );
}
