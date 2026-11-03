import { type Pose, worldNormal } from "./pose";

// Mirror-polished titanium, the way product photography lights it. A
// polished edge has no colour of its own: it shows the studio around it.
// Each wall strip is one facet of the band; across its width the band's
// profile rolls from facing front, through facing out, to facing back. For
// a handful of points along that roll we turn the normal into the world,
// reflect the camera's view off it and look the result up in a simple
// studio: a big softbox overhead, the bright page behind the camera, a dark
// floor, and two black flags that cut the hard dark bands real chrome shows.

export type Finish = "star" | "night";
type V = [number, number, number];

/** Points across the band (0 = front lip, 1 = back lip). */
const PROFILE = [0, 0.05, 0.13, 0.26, 0.5, 0.74, 0.87, 0.95, 1];

/** How far the surface rolls at each point: steep at the rounded lips, a
 *  flat polished face between them. */
function tilts(lip: number) {
  return PROFILE.map((u) => {
    const c = 2 * u - 1;
    return Math.sign(c) * Math.pow(Math.abs(c), 2.4) * lip;
  });
}
const RIM_TILT = tilts(82);
const SOFT_TILT = tilts(60);

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const bump = (x: number, at: number, w: number) => Math.exp(-((x - at) * (x - at)) / (w * w));

/** The studio, seen along a reflected ray. CSS y points down. */
function studio(r: V): number {
  const up = -r[1];
  let v = 0.5 + 0.2 * up;
  v += 0.45 * smooth(0.25, 0.85, up); // softbox overhead
  v += 0.38 * smooth(-0.3, 0.9, r[2]); // the bright page behind the camera
  v -= 0.48 * bump(r[0], -0.56, 0.1); // flag, left
  v -= 0.36 * bump(r[0], 0.64, 0.09); // flag, right
  v -= 0.28 * bump(up, -0.16, 0.07); // horizon
  return Math.min(1, Math.max(0.03, v));
}

/** The glass layers that sandwich the band: the display's black cover
 *  glass at the front lip, the back glass at the rear lip. */
const LAYERS: Record<Finish, { front: string; back: string }> = {
  star: { front: "rgb(16,16,18)", back: "rgb(228,221,208)" },
  night: { front: "rgb(10,11,15)", back: "rgb(38,46,66)" },
};

const TONES: Record<Finish, { dark: V; light: V; gamma: number }> = {
  // A warm silver: the champagne cast of Star White titanium.
  star: { dark: [58, 55, 51], light: [253, 251, 246], gamma: 1.1 },
  // Deep blue that still flares near-white at the highlights.
  night: { dark: [9, 12, 21], light: [176, 188, 214], gamma: 1.45 },
};

function rgb(v: number, f: Finish) {
  const t = TONES[f];
  const g = Math.pow(v, t.gamma);
  return `rgb(${Math.round(t.dark[0] + (t.light[0] - t.dark[0]) * g)},${Math.round(t.dark[1] + (t.light[1] - t.dark[1]) * g)},${Math.round(t.dark[2] + (t.light[2] - t.dark[2]) * g)})`;
}

const rad = (d: number) => (d * Math.PI) / 180;

export type Facet = {
  el: HTMLElement;
  half: "L" | "R";
  /** Outward normal angle in the slab's plane (degrees). */
  phi: number;
  /** Softer, rounder profile (the camera plateau, buttons). */
  soft?: boolean;
  last?: string;
};

/** Repaint one facet for the current pose. Returns false when it faces
 *  away (the browser culls it anyway, so it's left alone). */
export function paintFacet(f: Facet, p: Pose, finish: Finish) {
  const c = Math.cos(rad(f.phi)), s = Math.sin(rad(f.phi));
  const out = worldNormal(p, [c, s, 0], f.half);
  if (out[2] < -0.2) return false;
  const tilt = f.soft ? SOFT_TILT : RIM_TILT;
  const stops: string[] = [];
  for (let i = 0; i < PROFILE.length; i++) {
    const a = rad(tilt[i]!);
    // Rolled normal: outward, leaning to the front at u = 0 and to the back at u = 1.
    const n = worldNormal(p, [Math.cos(a) * c, Math.cos(a) * s, -Math.sin(a)], f.half);
    const r: V = [2 * n[2] * n[0], 2 * n[2] * n[1], 2 * n[2] * n[2] - 1];
    // Inside the glass layers on walls: the metal runs 4%–96%.
    const at = f.soft ? PROFILE[i]! * 100 : 4 + PROFILE[i]! * 92;
    stops.push(`${rgb(studio(r), finish)} ${at.toFixed(1)}%`);
  }
  // Walls carry the glass edges; the plateau and buttons are solid metal.
  const layers = f.soft ? "" : `${LAYERS[finish].front} 0%, ${LAYERS[finish].front} 3.2%, `;
  const tail = f.soft ? "" : `, ${LAYERS[finish].back} 97%, ${LAYERS[finish].back} 100%`;
  const bg = `linear-gradient(90deg, ${layers}${stops.join(", ")}${tail})`;
  if (bg !== f.last) {
    f.el.style.background = bg;
    f.last = bg;
  }
  return true;
}
