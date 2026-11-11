// Preview's own SF Symbol stand-ins, on the shared 24 pt grid.

const line = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const DocGlyph = {
  /** chevron.down beside the filename. */
  caret: (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 8.5 7 7 7-7" {...line} strokeWidth="3.2" />
    </svg>
  ),
  /** square.and.arrow.up */
  share: (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 14.5V3.5M8 7.2l4-3.9 4 3.9" {...line} strokeWidth="1.9" />
      <path d="M8.5 10H7a2.5 2.5 0 0 0-2.5 2.5v6A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5v-6A2.5 2.5 0 0 0 17 10h-1.5" {...line} strokeWidth="1.9" />
    </svg>
  ),
  /** link */
  link: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 14a4.2 4.2 0 0 0 6 0l3.2-3.2a4.2 4.2 0 0 0-6-6L11.6 6.4" {...line} strokeWidth="1.9" />
      <path d="M14 10a4.2 4.2 0 0 0-6 0l-3.2 3.2a4.2 4.2 0 0 0 6 6l1.6-1.6" {...line} strokeWidth="1.9" />
    </svg>
  ),
  /** minus.magnifyingglass: show the whole page. */
  zoomOut: (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.8" {...line} strokeWidth="1.9" />
      <path d="m15.6 15.6 4.9 4.9M7.6 10.5h5.8" {...line} strokeWidth="1.9" />
    </svg>
  ),
  /** plus.magnifyingglass: fit to width. */
  zoomIn: (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.8" {...line} strokeWidth="1.9" />
      <path d="m15.6 15.6 4.9 4.9M7.6 10.5h5.8M10.5 7.6v5.8" {...line} strokeWidth="1.9" />
    </svg>
  ),
};

/** The outline's section symbols, drawn smaller, as a sidebar row's. */
export const SectionGlyph = {
  /** graduationcap */
  education: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5 2.5 9.5 12 14l9.5-4.5z" {...line} strokeWidth="1.8" />
      <path d="M6.5 11.6v4.2c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8v-4.2M21.5 9.5v5" {...line} strokeWidth="1.8" />
    </svg>
  ),
  /** briefcase */
  work: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="7" width="18" height="12.5" rx="2.6" {...line} strokeWidth="1.8" />
      <path d="M8.8 7V5.8A1.8 1.8 0 0 1 10.6 4h2.8a1.8 1.8 0 0 1 1.8 1.8V7M3 12.5h18" {...line} strokeWidth="1.8" />
    </svg>
  ),
  /** square.stack */
  projects: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="8" width="16" height="12" rx="2.6" {...line} strokeWidth="1.8" />
      <path d="M6.5 5h11M9 2.5h6" {...line} strokeWidth="1.8" />
    </svg>
  ),
  /** hammer */
  skills: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m13.5 9.5-9 9a1.6 1.6 0 0 0 2.3 2.3l9-9" {...line} strokeWidth="1.8" />
      <path d="m11.5 7.5 3-3c1.6-1.6 4.2-1.6 5.6 0l-2.2.6 1.6 1.6 1.5-.4.5 1.9-3.4 3.4-1.9-.5-.4-1.5-1.6-1.6-.6 2.2z" {...line} strokeWidth="1.8" />
    </svg>
  ),
};
