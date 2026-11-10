// Notes' own SF Symbol stand-ins, on the same 24 pt grid as the shared
// `Glyph` set in settings/ios.tsx.

const line = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const NoteGlyph = {
  /** checkmark: the prominent Done. */
  done: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12.5 4.6 4.6L19 7.5" {...line} strokeWidth="2.5" />
    </svg>
  ),
  /** square.and.arrow.up */
  share: (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 14.5V3.5M8 7.2l4-3.9 4 3.9" {...line} strokeWidth="1.9" />
      <path d="M8.5 10H7a2.5 2.5 0 0 0-2.5 2.5v6A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5v-6A2.5 2.5 0 0 0 17 10h-1.5" {...line} strokeWidth="1.9" />
    </svg>
  ),
  /** textformat (Aa) */
  format: (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m2.5 18.5 5-13h1l5 13M4.6 13.6h6.8" {...line} strokeWidth="1.8" />
      <path d="M21.5 12.6v5.9M21.4 15.3c0-1.7-1.2-2.8-2.9-2.8s-2.9 1.3-2.9 3.1 1.2 3.1 2.9 3.1 2.9-1.1 2.9-2.9" {...line} strokeWidth="1.7" />
    </svg>
  ),
  /** checklist */
  checklist: (
    <svg width="23" height="23" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5.5" cy="7" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4.3 7 .9.9 1.6-1.8" {...line} strokeWidth="1.4" />
      <circle cx="5.5" cy="17" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 7h10M11 17h10" {...line} strokeWidth="1.8" />
    </svg>
  ),
  /** tablecells */
  table: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9.2 4.5v15M14.8 4.5v15" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  /** paperclip */
  attach: (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m19.5 11.3-7.6 7.6a4.6 4.6 0 0 1-6.5-6.5l8-8a3.1 3.1 0 0 1 4.4 4.4l-7.9 7.9a1.5 1.5 0 0 1-2.2-2.2l7.3-7.3" {...line} strokeWidth="1.8" />
    </svg>
  ),
  /** pencil.tip.crop.circle: Markup. */
  markup: (
    <svg width="23" height="23" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 16.5 12 6.5l3 10" {...line} strokeWidth="1.6" />
      <path d="M10.8 10.5h2.4" {...line} strokeWidth="1.4" />
    </svg>
  ),
  /** chevron.down, small, for collapsible section headers. */
  chevronDown: (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 8.5 7 7 7-7" {...line} strokeWidth="3" />
    </svg>
  ),
};
