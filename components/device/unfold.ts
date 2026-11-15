import type { Pose } from "./pose";

// The unfold, as Apple's film plays it. The display is already on as the
// halves part. The right half shows the Home Screen at once, stretched
// across the hinge from its far edge: it lets go as the device opens, so
// wallpaper, widgets and icons slide right into place and the picture
// seems to pull back. The left half wakes last: dark from its outer edge
// and out of focus, it lights from the hinge outward and sharpens just
// behind the light. Everything is a function of the pose, so scrolling
// back plays it in reverse, and it ends exactly on the live display.

export type Unfold = {
  /** Stretch of both halves' picture, anchored at the right half's far edge. */
  sx: number;
  sy: number;
  /** How far the left half's dark reaches from its outer edge: 1 to the
   *  hinge, 0 gone past the outer edge. */
  edge: number;
  /** Strength of that dark. */
  dark: number;
  /** The left half's focus, 1 fully soft. */
  soft: number;
};

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const ss = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Strongest stretch across the hinge, and the matching zoom. */
const STRETCH = { x: 0.11, y: 0.03 };
/** The left half's blur at its softest, in points. */
export const SOFT = 20;

export function unfold(p: Pose): Unfold {
  const o = clamp(p.open);
  const release = Math.pow(1 - o, 1.3);
  return {
    sx: 1 + STRETCH.x * release,
    sy: 1 + STRETCH.y * release,
    // Dark to the hinge as the halves part, a slow drift while the device
    // opens, then the sweep out past the outer edge.
    edge: 1 - 0.08 * ss(0, 0.55, o) - 0.97 * ss(0.58, 0.93, o),
    dark: 1 - ss(0.82, 0.97, o),
    soft: 1 - ss(0.64, 0.97, o),
  };
}

/** Each half's blur in px at zoom k: the sleeping display's focus pull on
 *  both, and the left half's own as it wakes. Stepped in half pixels:
 *  fewer distinct filters, fewer re-rasters. None while nothing shows. */
export function blurs(p: Pose, f: Unfold, k: number): [number, number] {
  if (p.wake <= 0.02 || p.fold >= 179.5) return [0, 0];
  const pull = p.wake < 0.985 ? (1 - p.wake) * 16 : 0;
  const q = (v: number) => Math.round(v * 2) / 2;
  return [q(Math.max(pull, f.soft * SOFT * k)), q(pull)];
}

/** The picture's stretch as a transform, or none at rest. */
export function stretch(f: Unfold): string {
  return f.sx < 1.0005 ? "" : `scale(${f.sx.toFixed(4)}, ${f.sy.toFixed(4)})`;
}

/** The left half's dark: a gradient twice the half's width, black at its
 *  left end and clear from its middle, slid so the clear point sits at
 *  `edge`. Its long falloff runs most of a half: near black at the outer
 *  edge, a dim middle, the hinge side nearly clear. */
export const SWEEP =
  "pointer-events-none absolute inset-y-0 left-0 w-[200%] bg-[linear-gradient(to_right,rgba(0,0,0,0.97)_0%,rgba(0,0,0,0.95)_10%,rgba(0,0,0,0.82)_20%,rgba(0,0,0,0.6)_29%,rgba(0,0,0,0.36)_37%,rgba(0,0,0,0.15)_44%,rgba(0,0,0,0.04)_48%,rgba(0,0,0,0)_50%)]";

export function sweep(f: Unfold): string {
  return `translateX(${((f.edge - 1) * 50).toFixed(2)}%)`;
}
