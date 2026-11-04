// Settings' row icons: a white symbol on a coloured rounded square, the
// colours Settings has used for each pane since iOS 7.

const W = "#fff";

const glyphs = {
  airplane: <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" fill={W} />,
  wifi: (
    <path
      d="M12 6c3 0 5.8 1.2 7.8 3.1l1.4-1.4A13 13 0 0 0 12 4a13 13 0 0 0-9.2 3.7l1.4 1.4A11 11 0 0 1 12 6m0 4c1.9 0 3.6.7 4.9 1.9l1.4-1.4A9 9 0 0 0 12 8a9 9 0 0 0-6.3 2.5l1.4 1.4A7 7 0 0 1 12 10m0 4c.8 0 1.5.3 2 .8L12 17l-2-2.2c.5-.5 1.2-.8 2-.8"
      fill={W}
      transform="translate(0 1.5)"
    />
  ),
  bluetooth: <path d="m7 7.5 10 9-5 4V3.5l5 4-10 9" fill="none" stroke={W} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />,
  battery: (
    <>
      <rect x="3" y="8" width="15.5" height="8.5" rx="2.4" fill="none" stroke={W} strokeWidth="1.7" />
      <rect x="5" y="10" width="9" height="4.5" rx="1" fill={W} />
      <path d="M20.3 10.6v3.3c.9-.3 1.4-1 1.4-1.65s-.5-1.35-1.4-1.65" fill={W} />
    </>
  ),
  general: (
    <>
      <circle cx="12" cy="12" r="6.6" fill="none" stroke={W} strokeWidth="3.2" strokeDasharray="2.1 1.36" />
      <circle cx="12" cy="12" r="5.2" fill="none" stroke={W} strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2" fill={W} />
    </>
  ),
  accessibility: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke={W} strokeWidth="1.6" />
      <circle cx="12" cy="7.4" r="1.5" fill={W} />
      <path d="M7.4 9.8 12 11l4.6-1.2M12 11v3.2l-2 3.8m2-3.8 2 3.8" fill="none" stroke={W} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.4-2h5.8l1.4 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" fill={W} />
      <circle cx="12" cy="12.6" r="3.4" fill="#8e8e93" />
      <circle cx="12" cy="12.6" r="2.1" fill={W} />
    </>
  ),
  control: (
    <>
      <rect x="4" y="5" width="16" height="6" rx="3" fill="none" stroke={W} strokeWidth="1.7" />
      <circle cx="7" cy="8" r="1.8" fill={W} />
      <rect x="4" y="13" width="16" height="6" rx="3" fill={W} />
      <circle cx="17" cy="16" r="1.8" fill="#8e8e93" />
    </>
  ),
  display: (
    <>
      <circle cx="12" cy="12" r="4" fill={W} />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="11.1" y="2.3" width="1.8" height="3" rx=".9" fill={W} transform={`rotate(${i * 45} 12 12)`} />
      ))}
    </>
  ),
  home: (
    <>
      <rect x="4.5" y="4.5" width="6.4" height="6.4" rx="1.8" fill={W} />
      <rect x="13.1" y="4.5" width="6.4" height="6.4" rx="1.8" fill={W} />
      <rect x="4.5" y="13.1" width="6.4" height="6.4" rx="1.8" fill={W} />
      <rect x="13.1" y="13.1" width="6.4" height="6.4" rx="1.8" fill={W} />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="5.6" fill="none" stroke={W} strokeWidth="2.2" />
      <path d="m14.7 14.7 4.6 4.6" stroke={W} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  wallpaper: (
    <>
      {[0, 60, 120, 180, 240, 300].map((r) => (
        <ellipse key={r} cx="12" cy="7.4" rx="2.4" ry="4" fill={W} fillOpacity=".92" transform={`rotate(${r} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="2.2" fill="#32ade6" />
    </>
  ),
  notifications: (
    <>
      <rect x="4.5" y="6" width="13.5" height="13.5" rx="3.5" fill="none" stroke={W} strokeWidth="1.8" />
      <circle cx="17.6" cy="6.4" r="3.2" fill={W} />
    </>
  ),
  sounds: (
    <>
      <path d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z" fill={W} />
      <path d="M14.5 9.2a4 4 0 0 1 0 5.6M17 7a7.2 7.2 0 0 1 0 10" fill="none" stroke={W} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  focus: <path d="M15.6 16.8A7.2 7.2 0 0 1 9.4 4.6a7.6 7.6 0 1 0 9.9 9.9 7.2 7.2 0 0 1-3.7 2.3" fill={W} />,
  screentime: (
    <>
      <path d="M7 4h10M7 20h10" stroke={W} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 4.5c0 4 4 4.8 4 7.5s-4 3.5-4 7.5h8c0-4-4-4.8-4-7.5s4-3.5 4-7.5z" fill="none" stroke={W} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.5 18.6c.6-1.6 2.5-2.2 2.5-3.6 0 1.4 1.9 2 2.5 3.6z" fill={W} />
    </>
  ),
  faceid: (
    <>
      <path d="M4.5 9V7A2.5 2.5 0 0 1 7 4.5h2M15 4.5h2A2.5 2.5 0 0 1 19.5 7v2M19.5 15v2a2.5 2.5 0 0 1-2.5 2.5h-2M9 19.5H7A2.5 2.5 0 0 1 4.5 17v-2" fill="none" stroke={W} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 9.5v1.2M15 9.5v1.2M12 9.5v3.2h-.8M9.4 15.2a4 4 0 0 0 5.2 0" fill="none" stroke={W} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  sos: (
    <text x="12" y="15.4" textAnchor="middle" fontSize="8.6" fontWeight="800" fill={W} fontFamily="-apple-system, Inter, sans-serif" letterSpacing="-.2">
      SOS
    </text>
  ),
  privacy: (
    <path
      d="M8.2 12.6V6.4a1.2 1.2 0 0 1 2.4 0v4.4-6a1.2 1.2 0 0 1 2.4 0v6-5a1.2 1.2 0 0 1 2.4 0v5.4-3.4a1.2 1.2 0 0 1 2.4 0v6.6c0 3.4-2.4 6.1-5.6 6.1-2.3 0-3.6-1-4.8-2.9l-2.3-3.7a1.25 1.25 0 0 1 2.1-1.4z"
      fill={W}
    />
  ),
  apps: (
    <>
      <rect x="4.5" y="4.5" width="6.4" height="6.4" rx="1.8" fill="#ff9f0a" />
      <rect x="13.1" y="4.5" width="6.4" height="6.4" rx="1.8" fill="#30d158" />
      <rect x="4.5" y="13.1" width="6.4" height="6.4" rx="1.8" fill="#0a84ff" />
      <rect x="13.1" y="13.1" width="6.4" height="6.4" rx="1.8" fill="#ff375f" />
    </>
  ),
} as const;

export type IconName = keyof typeof glyphs;

export const ICON_COLORS: Record<IconName, string> = {
  airplane: "#ff9500",
  wifi: "#007aff",
  bluetooth: "#007aff",
  battery: "#34c759",
  general: "#8e8e93",
  accessibility: "#007aff",
  camera: "#8e8e93",
  control: "#8e8e93",
  display: "#007aff",
  home: "#5856d6",
  search: "#8e8e93",
  wallpaper: "#32ade6",
  notifications: "#ff3b30",
  sounds: "#ff2d55",
  focus: "#5856d6",
  screentime: "#5856d6",
  faceid: "#34c759",
  sos: "#ff3b30",
  privacy: "#007aff",
  apps: "#f2f2f7",
};

export function SettingsIcon({ name, size = 30 }: { name: IconName; size?: number }) {
  const bg = ICON_COLORS[name];
  return (
    <span
      className={`grid shrink-0 place-items-center ${name === "apps" ? "bg-[linear-gradient(180deg,#fff,#e9e9ee)] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]" : ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.27,
        background: name === "apps" ? undefined : bg,
      }}
    >
      <svg width={size * 0.74} height={size * 0.74} viewBox="0 0 24 24" aria-hidden="true">
        {glyphs[name]}
      </svg>
    </span>
  );
}
