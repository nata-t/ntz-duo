// App-icon style glyphs for the contact tiles: each service on its own
// colour, in the iOS icon shape, so the tiles read like the Home Screen.

const shape = "grid shrink-0 place-items-center rounded-[22.5%] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.08)]";

export function MailIcon({ size = 44 }: { size?: number }) {
  return (
    <span className={`${shape} bg-[linear-gradient(180deg,#1ea1ff,#0a6cf0)]`} style={{ width: size, height: size }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="2.6" fill="#fff" />
        <path d="m3.2 6.4 7.6 6a2 2 0 0 0 2.4 0l7.6-6" fill="none" stroke="#1584f7" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function LinkedInIcon({ size = 44 }: { size?: number }) {
  return (
    <span className={`${shape} bg-[#0a66c2]`} style={{ width: size, height: size }}>
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" aria-hidden="true" fill="#fff">
        <circle cx="5.6" cy="5.4" r="2" />
        <rect x="3.9" y="8.6" width="3.4" height="11.4" rx="0.4" />
        <path d="M10 8.6h3.2v1.6c.5-.9 1.7-1.9 3.5-1.9 3.4 0 4 2.2 4 5.1V20h-3.4v-5.8c0-1.4 0-3.1-1.9-3.1s-2.1 1.5-2.1 3V20H10z" />
      </svg>
    </span>
  );
}

export function GitHubIcon({ size = 44 }: { size?: number }) {
  return (
    <span className={`${shape} bg-[#1f2328] dark:bg-[#f0f0f2]`} style={{ width: size, height: size }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 16 16" aria-hidden="true" className="fill-white dark:fill-[#1f2328]">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
      </svg>
    </span>
  );
}

export function TelegramIcon({ size = 44 }: { size?: number }) {
  return (
    <span className={`${shape} bg-[linear-gradient(180deg,#38b0e3,#1d93d2)]`} style={{ width: size, height: size }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4.4 11.6 18.3 6.3c.7-.25 1.3.17 1.07 1.2l-2.37 11.1c-.17.8-.65 1-1.32.62l-3.65-2.69-1.76 1.7c-.2.2-.36.36-.74.36l.26-3.73 6.78-6.13c.3-.26-.06-.4-.46-.15l-8.38 5.28-3.6-1.13c-.79-.25-.8-.79.17-1.17"
          fill="#fff"
        />
      </svg>
    </span>
  );
}

export function DocIcon({ size = 44 }: { size?: number }) {
  return (
    <span className={`${shape} bg-[linear-gradient(180deg,#ff9f2e,#ff7a1a)]`} style={{ width: size, height: size }}>
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 2.5h7.2l4.8 4.8v12.2a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2" fill="#fff" />
        <path d="M13.7 2.5v3.8a1 1 0 0 0 1 1h3.8" fill="#ffd2a6" />
        <path d="M8 11.5h8M8 14.5h8M8 17.5h5" stroke="#ff8a1f" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
