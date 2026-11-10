import type { Project } from "@/content/site";

// Colour helpers for a project's page: its brand colour is often too pale
// (cream), too dark (charcoal) or too loud (amber) to use as is.

/** Relative luminance, for picking an accent that reads on the page. */
function lum(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}

export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};

export const mix = (a: string, b: string, t: number) => {
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, "0")).join("")}`;
};

/** Near-grey colours (white, black, charcoal) carry no brand. */
export const chromatic = (hex: string) => {
  const c = rgb(hex);
  return Math.max(...c) - Math.min(...c) > 24;
};

const page = (dark: boolean) => (dark ? "#000000" : "#ffffff");

/** An accent for small text on the page: the brand colour if it reads,
 *  else its glyph colour, else the brand colour pushed lighter or darker
 *  until it reads (cream, amber and near-black brands need this). */
export const accentFor = (p: Project, dark: boolean) => {
  const ok = (c: string) => contrast(c, page(dark)) >= 4.5;
  if (ok(p.color)) return p.color;
  if (chromatic(p.ink) && ok(p.ink)) return p.ink;
  const base = chromatic(p.ink) ? p.ink : p.color;
  for (let t = 0.1; t < 1; t += 0.1) {
    const c = mix(base, dark ? "#ffffff" : "#000000", t);
    if (ok(c)) return c;
  }
  return dark ? "#ffffff" : "#000000";
};
