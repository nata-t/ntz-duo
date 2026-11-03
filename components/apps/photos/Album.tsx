"use client";

import { useCallback, useMemo, useState } from "react";
import { findAlbum, HIDDEN_ID, hiddenAlbums, type Photo } from "./data";
import Grid from "./Grid";
import { FaceIdIcon, LockIcon } from "./icons";
import { HEADER, LargeTitle, plural } from "./ui";
import css from "./photos.module.css";

type Props = {
  id: string;
  width: number;
  left: number;
  mirror: boolean;
  hiddenId: string | null;
  onOpen: (list: Photo[], photo: Photo, el: HTMLElement) => void;
};

// One album, pushed over Collections. Hidden starts locked, as on iOS.
export default function Album({ id, width, left, mirror, hiddenId, onOpen }: Props) {
  const album = useMemo(() => findAlbum(id), [id]);
  const [unlocked, setUnlocked] = useState(false);
  const [scanning, setScanning] = useState(false);
  const cols = width < 600 ? 3 : 6;
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
    <div className="absolute inset-y-0 bg-bg" style={{ left, width }}>
      {hidden && !unlocked ? (
        <div className="grid h-full place-items-center px-[32px] text-center">
          <div className="flex max-w-[320px] flex-col items-center">
            <span className={`grid size-[64px] place-items-center text-label-2 ${scanning ? css.scan : ""}`}>
              {scanning ? <FaceIdIcon size={58} className="text-blue" /> : <LockIcon size={50} />}
            </span>
            <h2 className="mt-[14px] text-[22px] leading-[28px] font-bold tracking-[-0.01em] text-label">Hidden Album Locked</h2>
            <p className="mt-[6px] text-[15px] leading-[20px] text-label-2">
              {hiddenAlbums.map((a) => a.title).join(" and ")} run inside bank networks, so their screens stay private.
            </p>
            <button
              type="button"
              onClick={unlock}
              className="mt-[18px] h-[44px] rounded-full bg-blue px-[22px] text-[17px] font-semibold tracking-[-0.02em] text-white transition-transform active:scale-95"
            >
              View Album
            </button>
          </div>
        </div>
      ) : (
        <div data-scroll className="h-full overflow-y-auto overscroll-contain no-scrollbar">
          <div className={css.fade} style={{ paddingTop: HEADER + 4 }}>
            {hidden ? (
              hiddenAlbums.map((a) => (
                <section key={a.id} className="mb-[8px]">
                  <header className="px-[18px] pt-[14px] pb-[10px]">
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
            <footer className="mx-auto max-w-[520px] px-[24px] pt-[22px] pb-[44px] text-center">
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

      <LargeTitle title={album.title} sub={sub} width={width} />
    </div>
  );
}
