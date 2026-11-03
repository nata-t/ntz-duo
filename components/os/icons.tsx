// App icon artwork, drawn on a 60 × 60 grid. Each face fills the square;
// AppIcon clips it to the icon shape and lays the glass sheen over it.
// Messages, Mail and Photos use the iPhone Duo UI kit's own artwork; the
// rest are drawn here. Brand marks (GitHub, LinkedIn, Telegram) are
// simple-icons (CC0).

import { projects } from "@/content/site";

type Face = () => React.ReactNode;

const svg = (children: React.ReactNode, bg?: string) => (
  <svg viewBox="0 0 60 60" width="100%" height="100%" aria-hidden="true" style={{ display: "block", background: bg }}>
    {children}
  </svg>
);

const grad = (id: string, a: string, b: string, angle = 90) => (
  <defs>
    <linearGradient id={id} gradientTransform={`rotate(${angle - 90} .5 .5)`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={a} />
      <stop offset="1" stopColor={b} />
    </linearGradient>
  </defs>
);

const GITHUB =
  "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";
const LINKEDIN =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z";
const TELEGRAM =
  "M16.906 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z";

/** Project glyphs: a mark per client, in the project's ink colour. */
const GLYPHS: Record<string, (ink: string) => React.ReactNode> = {
  // A ship's hull on a swell.
  "ethiopian-shipping-logistics": (ink) => (
    <g fill={ink}>
      <path d="M14 33h32l-4.5 8.5a3 3 0 0 1-2.6 1.5H21.1a3 3 0 0 1-2.6-1.5z" />
      <rect x="22" y="24" width="7" height="7" rx="1" />
      <rect x="30.5" y="24" width="7" height="7" rx="1" opacity=".75" />
      <rect x="26" y="16.5" width="7" height="6.5" rx="1" opacity=".55" />
      <path d="M10 47c3.3 0 3.3-2 6.7-2s3.3 2 6.6 2 3.4-2 6.7-2 3.3 2 6.7 2 3.3-2 6.6-2 3.4 2 6.7 2" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  ),
  // An anchor.
  "babogaya-maritime-academy": (ink) => (
    <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="30" cy="15.5" r="3.6" />
      <path d="M30 19v26M22 26h16M14.5 34c1.5 7.5 8 11.5 15.5 11.5S44 41.5 45.5 34" />
      <path d="m12 36.5 2.5-3.5 3.5 2.5M48 36.5 45.5 33 42 35.5" />
    </g>
  ),
  // A monogram cut from a square.
  "koket-investment": (ink) => (
    <g fill={ink}>
      <path d="M19 15h6v12.2L35.6 15h7.3L31.6 27.6 43.6 45h-7.2l-8.9-13.2-2.5 2.8V45h-6z" />
    </g>
  ),
  // Two rings.
  "minte-and-geni": (ink) => (
    <g fill="none" stroke={ink} strokeWidth="3.2">
      <circle cx="24.5" cy="32" r="10" />
      <circle cx="35.5" cy="32" r="10" />
      <path d="m33 15 2.5-3.5L38 15l-2.5 3.5z" fill={ink} strokeWidth="1.2" strokeLinejoin="round" />
    </g>
  ),
  // A bank front with a pulse above it.
  "cbe-smart-branch": (ink) => (
    <g fill={ink}>
      <path d="M30 12.5 47 21v3H13v-3z" />
      <rect x="16" y="26.5" width="4" height="13" rx="1" />
      <rect x="24" y="26.5" width="4" height="13" rx="1" />
      <rect x="32" y="26.5" width="4" height="13" rx="1" />
      <rect x="40" y="26.5" width="4" height="13" rx="1" />
      <rect x="13" y="42" width="34" height="4" rx="1.2" />
    </g>
  ),
  // A speaker wave over a keypad dot.
  "atm-voice-guidance": (ink) => (
    <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round">
      <path d="M13 30h3M20 22v16M26 16v28M32 23v14M38 18v24M44 26v8M48 30h0" />
    </g>
  ),
};

/** Artwork from the iPhone Duo UI kit, for the system apps it ships. */
const kit = (name: string) =>
  function KitIcon() {
    return <img src={`/icons/${name}.webp`} alt="" draggable={false} width="100%" height="100%" style={{ display: "block", width: "100%", height: "100%" }} />;
  };

export const FACES: Record<string, Face> = {
  about: () =>
    svg(
      <>
        {grad("ab", "#c9d6ff", "#e2e2e2")}
        <rect width="60" height="60" fill="url(#ab)" />
        <image href="/portrait/source.webp" x="6" y="7" width="48" height="67" preserveAspectRatio="xMidYMin slice" />
      </>,
    ),
  contact: kit("messages"),
  photos: kit("photos"),
  settings: () =>
    svg(
      <>
        {grad("st", "#d8d8dc", "#8e8e93")}
        <rect width="60" height="60" fill="url(#st)" />
        <g transform="translate(30 30)">
          {Array.from({ length: 36 }, (_, i) => (
            <rect key={i} x="-1.3" y="-21" width="2.6" height="5" rx=".6" fill="#3c3c43" transform={`rotate(${i * 10})`} />
          ))}
          <circle r="16.5" fill="none" stroke="#3c3c43" strokeWidth="2.2" />
          <circle r="11" fill="#c6c6cb" stroke="#3c3c43" strokeWidth="2" />
          {Array.from({ length: 3 }, (_, i) => (
            <rect key={i} x="-1.6" y="-10.5" width="3.2" height="21" rx="1.2" fill="#3c3c43" transform={`rotate(${i * 60 + 30})`} />
          ))}
          <circle r="4.5" fill="#c6c6cb" stroke="#3c3c43" strokeWidth="2" />
        </g>
      </>,
    ),
  mail: kit("mail"),
  notes: () =>
    svg(
      <>
        <rect width="60" height="60" fill="#fffef7" />
        {grad("nt", "#ffd84d", "#fbc02d")}
        <rect width="60" height="15" fill="url(#nt)" />
        {[24, 31, 38, 45, 52].map((y) => (
          <rect key={y} x="0" y={y} width="60" height=".9" fill="#d9d6cc" />
        ))}
      </>,
    ),
  resume: () =>
    svg(
      <>
        {grad("rs", "#ff9f43", "#f2591d")}
        <rect width="60" height="60" fill="url(#rs)" />
        <path d="M19 12h15.5L43 20.5V46a2.5 2.5 0 0 1-2.5 2.5h-21.5A2.5 2.5 0 0 1 16.5 46V14.5A2.5 2.5 0 0 1 19 12" fill="#fff" />
        <path d="M34.5 12v6.5a2 2 0 0 0 2 2H43" fill="#ffd9c2" />
        <rect x="21" y="27" width="17" height="2.2" rx="1.1" fill="#f2752a" />
        <rect x="21" y="32" width="17" height="2.2" rx="1.1" fill="#f6b48a" />
        <rect x="21" y="37" width="12" height="2.2" rx="1.1" fill="#f6b48a" />
        <circle cx="25" cy="20.5" r="3.4" fill="#f2752a" />
      </>,
    ),
  github: () =>
    svg(
      <>
        {grad("gh", "#3b3f46", "#16181c")}
        <rect width="60" height="60" fill="url(#gh)" />
        <path d={GITHUB} transform="translate(15 15) scale(1.25)" fill="#fff" />
      </>,
    ),
  linkedin: () =>
    svg(
      <>
        {grad("li", "#1a8be0", "#0a5fb4")}
        <rect width="60" height="60" fill="url(#li)" />
        <path d={LINKEDIN} transform="translate(16 15) scale(1.2)" fill="#fff" />
      </>,
    ),
  telegram: () =>
    svg(
      <>
        {grad("tg", "#41bcf2", "#1f8fd6")}
        <rect width="60" height="60" fill="url(#tg)" />
        <path d={TELEGRAM} transform="translate(14 14.5) scale(1.3)" fill="#fff" />
      </>,
    ),
  ...Object.fromEntries(
    projects.map((p) => [
      p.slug,
      () =>
        svg(
          <>
            <defs>
              <radialGradient id={`pg-${p.slug}`} cx=".3" cy=".15" r="1.1">
                <stop offset="0" stopColor={p.color} stopOpacity=".72" />
                <stop offset=".55" stopColor={p.color} />
              </radialGradient>
            </defs>
            <rect width="60" height="60" fill={p.color} />
            <rect width="60" height="60" fill={`url(#pg-${p.slug})`} style={{ mixBlendMode: "screen" }} />
            {GLYPHS[p.slug]?.(p.ink)}
          </>,
        ),
    ]),
  ),
};
