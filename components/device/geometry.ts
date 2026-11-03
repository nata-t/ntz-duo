// iPhone Duo geometry, in display points (1 pt = 1 CSS px before the
// device's zoom factor k is applied). Display sizes come from Apple's
// iPhone Duo UI kit: inner 951 × 669 pt, outer 466 × 678 pt.

export const INNER = { w: 951, h: 669 } as const;
export const OUTER = { w: 466, h: 678 } as const;

/** Black glass around the inner display, then the titanium band seen from
 *  the front. Measured from the UI kit's bezel exports: the display sits
 *  20.7 pt inside the body edge. */
export const BEZEL = 16.7;
export const RIM = 4;
/** Thickness of one half: 5.2 mm on a 164.6 mm wide body. */
export const T = 30;
/** Corner radii of the body: away from the hinge, and at the hinge. */
export const R_OUT = 64;
export const R_HINGE = 6;

export const BODY = { w: INNER.w + 2 * (BEZEL + RIM), h: INNER.h + 2 * (BEZEL + RIM) };
/** One half of the body; the screen runs across the hinge without a bezel. */
export const HALF = { w: BODY.w / 2, h: BODY.h };

/** Camera plateau on the back of the right half (seen top-left from behind). */
export const PLATEAU = { w: 332, h: 142, depth: 7, inset: 22 };

/** The UI kit's bezel textures and where the body sits inside them. */
export const TEX = {
  inner: { w: 1031, h: 749, x: 19.3, y: 19.3 },
  /** Folded front: the front slab starts after the back slab's sliver. */
  outer: { w: 524.67, h: 731.33, x: 16, y: 10.3 },
  /** The outer display inside its slab: 13.3 pt from the hinge side. */
  outerScreen: { x: 13.3, y: 16.4 },
};

/** Buttons on the right slab, in its front-view coordinates. */
export const BUTTONS = [
  { edge: "top" as const, at: 261, len: 62 },
  { edge: "top" as const, at: 347, len: 66 },
  { edge: "side" as const, at: 248, len: 116 },
];

export type Seg = { x: number; y: number; len: number; phi: number };

/**
 * Walk the outline of a rounded rect and cut it into flat strips, each with
 * its midpoint, length and outward normal angle (degrees, 0 = +x, 90 = +y).
 * Stood on edge, the strips become the device's side wall.
 */
export function outline(w: number, h: number, r: [number, number, number, number], step = 7): Seg[] {
  const [tl, tr, br, bl] = r;
  const segs: Seg[] = [];
  const line = (x1: number, y1: number, x2: number, y2: number, phi: number) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len > 0.5) segs.push({ x: (x1 + x2) / 2, y: (y1 + y2) / 2, len: len + 0.6, phi });
  };
  const arc = (cx: number, cy: number, rad: number, a0: number, a1: number) => {
    if (rad < 1) return;
    const n = Math.max(2, Math.ceil(((a1 - a0) * Math.PI * rad) / 180 / step));
    const da = (a1 - a0) / n;
    for (let i = 0; i < n; i++) {
      const a = a0 + da * (i + 0.5);
      const t = (a * Math.PI) / 180;
      // Chord length, a hair longer so neighbours overlap instead of gapping.
      const len = 2 * rad * Math.sin(((da / 2) * Math.PI) / 180) + 0.8;
      segs.push({ x: cx + rad * Math.cos(t) * Math.cos(((da / 2) * Math.PI) / 180), y: cy + rad * Math.sin(t) * Math.cos(((da / 2) * Math.PI) / 180), len, phi: a });
    }
  };
  line(tl, 0, w - tr, 0, -90);
  arc(w - tr, tr, tr, -90, 0);
  line(w, tr, w, h - br, 0);
  arc(w - br, h - br, br, 0, 90);
  line(w - br, h, bl, h, 90);
  arc(bl, h - bl, bl, 90, 180);
  line(0, h - bl, 0, tl, 180);
  arc(tl, tl, tl, 180, 270);
  return segs;
}
