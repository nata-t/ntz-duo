// SF Symbols-style glyphs for Photos, drawn on a 24 pt grid in currentColor.

type P = { size?: number; className?: string };

const svg = (size: number, className: string | undefined, children: React.ReactNode, fill = "none") => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden="true" className={className}>
    {children}
  </svg>
);

/** photo.on.rectangle: the Library tab. */
export const LibraryIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M6.5 4.5h11a3 3 0 0 1 3 3v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="3.4" y="7.8" width="13.9" height="11.6" rx="2.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="m4.4 18.4 4-4.3 2.7 2.7 1.9-1.8 3.4 3.4z" fill="currentColor" />
      <circle cx="13.4" cy="11.4" r="1.4" fill="currentColor" />
    </>,
  );

/** rectangle.stack: the Collections tab. */
export const CollectionsIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M7 3.6h10M5 6.3h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="2.8" y="8.8" width="18.4" height="11.6" rx="2.8" fill="currentColor" />
    </>,
  );

export const SearchIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <>
      <circle cx="10.5" cy="10.5" r="6.3" stroke="currentColor" strokeWidth="2.1" />
      <path d="m15.3 15.3 5 5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </>,
  );

export const EllipsisIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <>
      <circle cx="5.5" cy="12" r="1.9" fill="currentColor" />
      <circle cx="12" cy="12" r="1.9" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.9" fill="currentColor" />
    </>,
  );

export const ChevronLeft = ({ size = 24, className }: P) =>
  svg(size, className, <path d="M15 4.5 7.5 12l7.5 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />);

export const ChevronRight = ({ size = 24, className }: P) =>
  svg(size, className, <path d="M9 4.5 16.5 12 9 19.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />);

export const InfoIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10.8v5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="7.6" r="1.25" fill="currentColor" />
    </>,
  );

/** safari: opens the live site. */
export const CompassIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1z" fill="currentColor" />
    </>,
  );

export const LockIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" stroke="currentColor" strokeWidth="2" />
      <rect x="5" y="10.2" width="14" height="10.6" rx="2.4" fill="currentColor" />
    </>,
  );

export const CheckIcon = ({ size = 24, className }: P) =>
  svg(size, className, <path d="m6.5 12.5 3.6 3.6 7.4-8.2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />);

export const XIcon = ({ size = 24, className }: P) =>
  svg(size, className, <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />);

/** faceid, for unlocking Hidden. */
export const FaceIdIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M3.5 8V6a2.5 2.5 0 0 1 2.5-2.5h2M16 3.5h2A2.5 2.5 0 0 1 20.5 6v2M20.5 16v2a2.5 2.5 0 0 1-2.5 2.5h-2M8 20.5H6A2.5 2.5 0 0 1 3.5 18v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.5 9v1.4M15.5 9v1.4M12 9v3.6h-1M9 15.6c1.7 1.4 4.3 1.4 6 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </>,
  );

export const PersonIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <>
      <circle cx="12" cy="8.5" r="4" fill="currentColor" />
      <path d="M4.5 20c.8-3.8 3.9-5.8 7.5-5.8s6.7 2 7.5 5.8z" fill="currentColor" />
    </>,
  );

export const ScreenshotIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <path d="M4 9V6.5A2.5 2.5 0 0 1 6.5 4H9M15 4h2.5A2.5 2.5 0 0 1 20 6.5V9M20 15v2.5a2.5 2.5 0 0 1-2.5 2.5H15M9 20H6.5A2.5 2.5 0 0 1 4 17.5V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  );

/** heart / heart.fill: Favorite. */
export const HeartIcon = ({ size = 24, className, filled }: P & { filled?: boolean }) =>
  svg(
    size,
    className,
    <path
      d="M12 20.2c-.3 0-.6-.1-.8-.3C7.4 16.8 3.2 13.3 3.2 9.1 3.2 6.4 5.3 4.3 7.9 4.3c1.7 0 3.2.9 4.1 2.3.9-1.4 2.4-2.3 4.1-2.3 2.6 0 4.7 2.1 4.7 4.8 0 4.2-4.2 7.7-8 10.8-.2.2-.5.3-.8.3Z"
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinejoin="round"
      fill={filled ? "currentColor" : "none"}
    />,
  );

/** square.and.arrow.up: Share. */
export const ShareIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M12 14.5V3.6M8.2 7.2 12 3.4l3.8 3.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.6 10H7.2a2.2 2.2 0 0 0-2.2 2.2v6.6a2.2 2.2 0 0 0 2.2 2.2h9.6a2.2 2.2 0 0 0 2.2-2.2v-6.6a2.2 2.2 0 0 0-2.2-2.2h-1.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </>,
  );

/** arrow.up.arrow.down: sort and view options. */
export const SortIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <path d="M8 19.5V4.8M4.2 8.6 8 4.8l3.8 3.8M16 4.5v14.7m-3.8-3.8 3.8 3.8 3.8-3.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />,
  );

/** arrow.up.forward.app: open the project's own app. */
export const OpenAppIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M11 4.2H8a3.8 3.8 0 0 0-3.8 3.8v8A3.8 3.8 0 0 0 8 19.8h8a3.8 3.8 0 0 0 3.8-3.8v-3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M14.2 4.2h5.6v5.6M19.6 4.4l-8 8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );

export const LinkIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <path d="m10.4 13.6 3.2-3.2M9 9.4 7.3 11a3.8 3.8 0 0 0 5.4 5.4l1.6-1.6m-4.6-6.1 1.6-1.6a3.8 3.8 0 0 1 5.4 5.4L15 14.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />,
  );

/** arrow.down.to.line: save the image. */
export const SaveIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <path d="M12 4v11m-4.2-4.2L12 15l4.2-4.2M5 19.6h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />,
  );

/** plus.magnifyingglass / minus.magnifyingglass. */
export const ZoomIcon = ({ size = 24, className, out }: P & { out?: boolean }) =>
  svg(
    size,
    className,
    <>
      <circle cx="10.5" cy="10.5" r="6.3" stroke="currentColor" strokeWidth="1.8" />
      <path d={out ? "M7.8 10.5h5.4" : "M7.8 10.5h5.4M10.5 7.8v5.4"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m15.3 15.3 4.6 4.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>,
  );

/** rectangle.arrowtriangle: the aspect ratio grid. */
export const AspectIcon = ({ size = 24, className }: P) =>
  svg(
    size,
    className,
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="2.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 9.4v5.2M17 9.4v5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  );
