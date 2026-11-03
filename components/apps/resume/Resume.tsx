"use client";

import { useSyncExternalStore } from "react";
import { profile } from "@/content/site";
import type { AppProps } from "../types";
import { Glyph, Rail, RailButton, contentBox } from "../settings/ios";

// Résumé: Quick Look for the CV. The PDF renders in the browser's own
// viewer; the side rail carries Close, Open in a new tab and Download, the
// way a document viewer keeps its actions within reach.

const FILE = profile.cv.href;
const NAME = FILE.split("/").pop()!.replace(/\.pdf$/i, "");

const still = () => () => {};
/** False where the browser can't show a PDF inline (most phones, some
 *  privacy setups); those get a card with the same actions instead. */
const usePdfViewer = () =>
  useSyncExternalStore(
    still,
    () => navigator.pdfViewerEnabled !== false,
    () => true,
  );

export default function Resume({ width, slot, mirror, close }: AppProps) {
  const box = contentBox(slot, width);
  const viewer = usePdfViewer();
  const compact = width < 600;

  return (
    <div className="relative h-full bg-bg-2 text-label">
      <div className="absolute inset-y-0 flex flex-col" style={{ left: box.left, width: box.width }}>
        {/* Title, centred over the document as Quick Look sets it. */}
        <header className="flex h-[78px] shrink-0 flex-col items-center justify-end pb-[6px] text-center">
          <h1 className="max-w-[80%] truncate text-[17px] leading-[22px] font-semibold">{NAME}</h1>
          <p className="text-[12px] leading-[16px] text-label-2">PDF Document</p>
        </header>

        <div className="min-h-0 flex-1 px-[20px] pt-[8px] pb-[30px]">
          {mirror ? (
            <Paper compact={compact} />
          ) : viewer ? (
            <div className="relative h-full overflow-hidden rounded-[14px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.10)]">
              {/* Shown under the viewer while it loads, and if it never does. */}
              <div className="absolute inset-0">
                <Paper compact={compact} bare />
              </div>
              <iframe
                src={`${FILE}#toolbar=0&navpanes=0&view=FitH`}
                title={`${profile.name}, CV (PDF)`}
                className="relative block h-full w-full border-0"
              />
            </div>
          ) : (
            <Fallback />
          )}
        </div>
      </div>

      <Rail slot={slot}>
        <RailButton label="Close Résumé" onClick={close}>
          {Glyph.close}
        </RailButton>
        <RailButton label="Open in New Tab" href={FILE} external tint="var(--blue)">
          {Glyph.open}
        </RailButton>
        <RailButton label="Download" href={FILE} download={`${NAME}.pdf`} tint="var(--blue)">
          {Glyph.download}
        </RailButton>
      </Rail>
    </div>
  );
}

/** A still of the first page: the CV's header and its shape, drawn rather
 *  than rendered, for the folding mirrors and while the viewer loads. */
function Paper({ compact, bare }: { compact: boolean; bare?: boolean }) {
  const bar = (w: string, key: number) => <span key={key} className="block h-[6px] rounded-full bg-black/[0.08]" style={{ width: w }} />;
  const lines = ["100%", "96%", "88%", "92%", "60%"];
  return (
    <div
      className={`mx-auto h-full overflow-hidden bg-white text-[#1d1d1f] ${bare ? "" : "rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.10)]"}`}
      aria-hidden="true"
    >
      <div className={compact ? "px-[26px] pt-[28px]" : "px-[56px] pt-[44px]"}>
        <p className={`text-center font-display font-bold tracking-[-0.01em] ${compact ? "text-[22px]" : "text-[28px]"}`}>{profile.name}</p>
        <p className="mt-[2px] text-center text-[11px] text-black/50">{profile.location}</p>
        {["Education", "Work Experience", "Featured Projects", "Skills"].map((h, s) => (
          <div key={h} className="mt-[18px]">
            <p className="border-b border-black/10 pb-[4px] text-[10px] font-semibold tracking-[0.08em] text-black/55 uppercase">{h}</p>
            <div className="mt-[9px] flex flex-col gap-[7px]">{lines.slice(0, s === 0 ? 2 : 5).map((w, i) => bar(w, i))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Fallback() {
  return (
    <div className="grid h-full place-items-center">
      <div className="flex w-[300px] flex-col items-center rounded-[26px] bg-bg px-[24px] pt-[28px] pb-[24px] text-center shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <span className="relative grid h-[84px] w-[66px] place-items-end rounded-[8px] bg-white pb-[10px] shadow-[0_2px_10px_rgba(0,0,0,0.14)]">
          <span className="absolute top-0 right-0 size-[18px] rounded-bl-[6px] bg-[#e9e9ee]" />
          <span className="mx-auto rounded-[4px] bg-[#ff3b30] px-[6px] py-[2px] text-[11px] font-bold tracking-[0.02em] text-white">PDF</span>
        </span>
        <p className="mt-[16px] text-[17px] leading-[22px] font-semibold">{NAME}</p>
        <p className="mt-[2px] text-[13px] leading-[18px] text-label-2">This browser can’t show PDFs inline.</p>
        <div className="mt-[18px] flex w-full flex-col gap-[10px]">
          <a href={FILE} target="_blank" rel="noopener noreferrer" className="grid h-[44px] place-items-center rounded-full bg-blue text-[17px] font-semibold text-white">
            Open
          </a>
          <a href={FILE} download={`${NAME}.pdf`} className="grid h-[44px] place-items-center rounded-full bg-fill-3 text-[17px] font-semibold text-blue">
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
