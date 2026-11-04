"use client";

import { memo } from "react";
import type { Photo } from "./data";
import { CheckIcon } from "./icons";

export type GridProps = {
  photos: Photo[];
  cols: number;
  /** Aspect Ratio Grid: whole photos letterboxed in their squares. */
  fit?: boolean;
  /** The photo open in the viewer: its cell is empty while it's "out". */
  hiddenId?: string | null;
  selecting?: boolean;
  selected?: Set<string>;
  onOpen: (photo: Photo, el: HTMLElement) => void;
  onToggle?: (photo: Photo) => void;
};

// Photos' grid: edge to edge, square cells, a hairline of background between.
function Grid({ photos, cols, fit, hiddenId, selecting, selected, onOpen, onToggle }: GridProps) {
  return (
    <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {photos.map((ph) => {
        const on = selecting && selected?.has(ph.id);
        return (
          <button
            key={ph.id}
            type="button"
            data-thumb={ph.id}
            aria-label={ph.alt}
            aria-pressed={selecting ? !!on : undefined}
            onClick={(e) => (selecting ? onToggle?.(ph) : onOpen(ph, e.currentTarget))}
            className="relative aspect-square overflow-hidden bg-fill-3 outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-inset"
            style={{ visibility: hiddenId === ph.id ? "hidden" : undefined, background: fit ? "var(--bg)" : ph.backdrop }}
          >
            <img
              src={ph.thumb}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className={`absolute inset-0 size-full ${fit ? "object-contain" : "object-cover"}`}
              style={ph.backdrop && fit ? { background: ph.backdrop } : undefined}
            />
            {selecting ? (
              <>
                {/* Only chosen photos are marked, as in Photos. */}
                {on ? (
                  <>
                    <span className="absolute inset-0 bg-white/25" />
                    <span
                      className="absolute right-[5px] bottom-[5px] grid size-[22px] place-items-center rounded-full bg-blue text-white shadow-[0_0_0_1.5px_#fff,0_1px_3px_rgba(0,0,0,0.3)]"
                    >
                      <CheckIcon size={15} />
                    </span>
                  </>
                ) : null}
              </>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default memo(Grid);
