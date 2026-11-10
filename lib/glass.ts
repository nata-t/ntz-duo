// Liquid Glass refraction, after kube.io's "Liquid Glass in the Browser".
//
// Every glass shape gets a displacement map worked out from optics: a
// squircle-profiled bezel of glass (n = 1.5) bends each vertical ray by
// Snell's law, and the map stores, per pixel, where that ray lands on the
// backdrop. An SVG filter blurs the backdrop a little, displaces it through
// the map, lifts its saturation and lays a specular rim on top. The filter
// is the element's backdrop-filter, which only Chromium accepts as a url();
// everywhere else `.glass` keeps its frosted CSS fallback.
//
// Shapes are keyed by size, corner and bezel, so equal buttons share one
// filter. The map is generated a quadrant at a time (a rounded rect is
// symmetric four ways) at twice the CSS size, then mirrored.

const NS = "http://www.w3.org/2000/svg";
const N = 1.5; // glass
const RES = 2; // map pixels per CSS px

export type GlassKind = "regular" | "clear" | "lens";

type Shape = {
  w: number;
  h: number;
  r: number;
  /** Width of the curved rim, CSS px. */
  bezel: number;
  /** Glass thickness: how far the rim bends the backdrop. */
  depth: number;
  /** Backdrop blur, CSS px. */
  blur: number;
  /** Saturation lift. */
  sat: number;
  /** Specular rim strength, 0–1. */
  spec: number;
  /** Dispersion: how much further blue bends than red, as a share. */
  disp: number;
};

let supported: boolean | null = null;

/** Chromium takes SVG filters as backdrop-filter; nothing else does. */
export function refracts(): boolean {
  if (supported !== null) return supported;
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const chromium = /Chrome\/|Chromium\/|Edg\//.test(ua) && !/Firefox\//.test(ua);
  supported =
    chromium &&
    CSS.supports("backdrop-filter", "url(#a)") &&
    !matchMedia("(prefers-reduced-transparency: reduce)").matches;
  return supported;
}

// --- Optics ---------------------------------------------------------------

/** Glass height across the bezel, 0 at the edge → 1 where it goes flat:
 *  Apple's squircle profile, soft into the flat so nothing creases. */
const height = (t: number) => Math.pow(1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 4), 0.25);

/** Lateral shift of a vertical ray through the bezel at t (0 edge → 1
 *  flat), in units of glass thickness. Positive = toward the inside. */
function shift(t: number) {
  const d = 0.001;
  const slope = (height(t + d) - height(t - d)) / (2 * d);
  const a1 = Math.atan(slope); // incidence, from the surface normal
  const a2 = Math.asin(Math.sin(a1) / N); // refraction
  return height(t) * Math.tan(a1 - a2);
}

/** 128 samples across the bezel, normalised to the largest shift. */
const profile = (() => {
  const out = new Float32Array(128);
  let max = 0;
  for (let i = 0; i < 128; i++) {
    out[i] = shift((i + 0.5) / 128);
    max = Math.max(max, out[i]!);
  }
  for (let i = 0; i < 128; i++) out[i]! /= max;
  return out;
})();

// --- Maps ------------------------------------------------------------------

/** Displacement (R, G) and specular (white, alpha) maps for a shape. */
function maps(s: Shape) {
  const W = Math.max(2, Math.round(s.w * RES)), H = Math.max(2, Math.round(s.h * RES));
  const r = Math.min(s.r, s.w / 2, s.h / 2) * RES;
  const b = Math.max(1, Math.min(s.bezel * RES, Math.min(W, H) / 2));
  const disp = new ImageData(W, H), spec = new ImageData(W, H);
  const dd = disp.data, sd = spec.data;
  const hw = Math.ceil(W / 2), hh = Math.ceil(H / 2);
  // Light from the top left, a second dimmer bounce from the bottom right.
  const lx = -0.6, ly = -0.8;
  const rim = 1.35 * RES;

  for (let y = 0; y < hh; y++) {
    for (let x = 0; x < hw; x++) {
      // Top-left quadrant: distance in from the rounded edge, and the
      // outward normal there.
      const px = x + 0.5, py = y + 0.5;
      let dist: number, nx: number, ny: number;
      if (px < r && py < r) {
        const cx = r - px, cy = r - py, len = Math.hypot(cx, cy) || 1;
        dist = r - len;
        nx = -cx / len;
        ny = -cy / len;
      } else if (px < py) {
        dist = px;
        nx = -1;
        ny = 0;
      } else {
        dist = py;
        nx = 0;
        ny = -1;
      }
      let dx = 0, dy = 0;
      if (dist >= 0 && dist < b) {
        const m = profile[Math.min(127, Math.floor((dist / b) * 128))]!;
        // Convex glass pulls the backdrop in from further inside.
        dx = -nx * m;
        dy = -ny * m;
      }
      const k = dist >= 0 && dist < rim ? 1 - dist / rim : 0;
      // Write the pixel into all four quadrants, flipping the axis each
      // mirror crosses (and the light, which doesn't mirror).
      const xs = [x, W - 1 - x], ys = [y, H - 1 - y];
      for (let qy = 0; qy < 2; qy++) {
        for (let qx = 0; qx < 2; qx++) {
          const X = xs[qx]!, Y = ys[qy]!;
          if ((qx && X === x && W % 2) || (qy && Y === y && H % 2)) continue;
          const i = (Y * W + X) * 4;
          const sx = qx ? -dx : dx, sy = qy ? -dy : dy;
          dd[i] = 128 + sx * 127;
          dd[i + 1] = 128 + sy * 127;
          dd[i + 2] = 128;
          dd[i + 3] = 255;
          // The rim is lit where this quadrant's normal faces the light.
          const f = (qx ? -nx : nx) * lx + (qy ? -ny : ny) * ly;
          const lit = (Math.max(0, f) + Math.max(0, -f) * 0.55) * k;
          sd[i] = sd[i + 1] = sd[i + 2] = 255;
          sd[i + 3] = Math.round(255 * Math.min(1, lit) * s.spec);
        }
      }
    }
  }
  return { disp: toURL(disp), spec: toURL(spec) };
}

function toURL(img: ImageData) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  c.getContext("2d")!.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

// --- Filters ---------------------------------------------------------------

let defs: SVGDefsElement | null = null;
const filters = new Map<string, string>();
let seq = 0;

function host() {
  if (defs?.isConnected) return defs;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  defs = document.createElementNS(NS, "defs");
  svg.append(defs);
  document.body.append(svg);
  filters.clear();
  return defs;
}

const el = (tag: string, attrs: Record<string, string | number>) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  return n;
};

/** The filter for a shape, built on first use. */
export function filterFor(s: Shape): string {
  const key = [s.w, s.h, s.r, s.bezel, s.depth, s.blur, s.sat, s.spec, s.disp].map((v) => Math.round(v * 10) / 10).join("_");
  const known = filters.get(key);
  if (known && defs?.isConnected) return known;
  const d = host();
  const id = `lg-${++seq}`;
  const { disp, spec } = maps(s);
  const f = el("filter", {
    id,
    x: 0,
    y: 0,
    width: s.w,
    height: s.h,
    filterUnits: "userSpaceOnUse",
    primitiveUnits: "userSpaceOnUse",
    "color-interpolation-filters": "sRGB",
  });
  const scale = s.depth * 2;
  const bend = (k: number, result: string) =>
    el("feDisplacementMap", { in: "blur", in2: "map", scale: scale * k, xChannelSelector: "R", yChannelSelector: "G", result });
  // One channel of `src`, the other two zeroed, alpha kept.
  const only = (src: string, ch: 0 | 1 | 2, result: string) => {
    const row = (r: number) => [0, 1, 2, 3, 4].map((i) => (r === ch && i === r ? 1 : 0)).join(" ");
    return el("feColorMatrix", { in: src, type: "matrix", values: `${row(0)} ${row(1)} ${row(2)} 0 0 0 1 0`, result });
  };
  f.append(
    el("feGaussianBlur", { in: "SourceGraphic", stdDeviation: s.blur, edgeMode: "duplicate", result: "blur" }),
    el("feImage", { href: disp, x: 0, y: 0, width: s.w, height: s.h, preserveAspectRatio: "none", result: "map" }),
  );
  if (s.disp > 0) {
    // Dispersion: red, green and blue bend by slightly different amounts,
    // so the rim carries a faint prism fringe.
    f.append(
      bend(1 - s.disp, "br"),
      bend(1, "bg"),
      bend(1 + s.disp, "bb"),
      only("br", 0, "r"),
      only("bg", 1, "g"),
      only("bb", 2, "b"),
      el("feBlend", { in: "r", in2: "g", mode: "screen", result: "rg" }),
      el("feBlend", { in: "rg", in2: "b", mode: "screen", result: "bent" }),
    );
  } else f.append(bend(1, "bent"));
  f.append(
    el("feColorMatrix", { in: "bent", type: "saturate", values: s.sat, result: "lit" }),
    el("feImage", { href: spec, x: 0, y: 0, width: s.w, height: s.h, preserveAspectRatio: "none", result: "spec" }),
    el("feComposite", { in: "spec", in2: "lit", operator: "over" }),
  );
  d.append(f);
  filters.set(key, id);
  return id;
}

// --- Elements ----------------------------------------------------------------

/** Per-kind optics. Regular glass frosts more; clear glass barely blurs and
 *  bends harder, so what's behind stays legible through it; a lens (a
 *  switch knob or slider thumb being dragged) is nearly all refraction. */
const KINDS: Record<GlassKind, { blur: number; sat: number; spec: number; bezel: number; depth: number; disp: number }> = {
  regular: { blur: 6, sat: 1.7, spec: 0.75, bezel: 0.32, depth: 0.42, disp: 0.12 },
  clear: { blur: 1.6, sat: 1.5, spec: 0.85, bezel: 0.36, depth: 0.5, disp: 0.18 },
  lens: { blur: 0.4, sat: 1.25, spec: 0.9, bezel: 0.5, depth: 0.7, disp: 0.2 },
};

/** Every element being fitted, for a refit when the setting changes. */
const fitted = new Set<HTMLElement>();

const num = (cs: CSSStyleDeclaration, p: string) => {
  const v = parseFloat(cs.getPropertyValue(p));
  return Number.isFinite(v) ? v : null;
};

/** Fit a glass element with the filter for its current size. */
function fit(e: HTMLElement) {
  const w = e.offsetWidth, h = e.offsetHeight;
  if (w < 4 || h < 4) return;
  const cs = getComputedStyle(e);
  const kind: GlassKind = e.classList.contains("glass-lens") ? "lens" : e.classList.contains("glass-clear") ? "clear" : "regular";
  const k = KINDS[kind];
  const rr = cs.borderTopLeftRadius;
  const r = Math.min(w / 2, h / 2, rr.endsWith("%") ? (parseFloat(rr) / 100) * Math.min(w, h) : parseFloat(rr) || 0);
  const short = Math.min(w, h);
  // The rim is a share of the short side, capped so big panels keep a
  // slim bezel, the way Apple's sheets do.
  const bezel = num(cs, "--lg-bezel") ?? Math.min(short * k.bezel, 26);
  const depth = num(cs, "--lg-depth") ?? Math.min(bezel * k.depth * 1.6, 22);
  // Settings › Appearance › Liquid Glass: clear (0) barely frosts, tinted
  // (1) frosts nearly twice the default.
  const frost = num(cs, "--frost") ?? 0.5;
  const blur = num(cs, "--lg-blur") ?? k.blur * (0.25 + 1.5 * frost);
  // Big panels skip dispersion: three bends of a large backdrop cost more
  // than a fringe nobody sees at that size.
  const disp = w * h > 90000 ? 0 : (num(cs, "--lg-disp") ?? k.disp);
  const id = filterFor({ w, h, r, bezel, depth, blur, sat: num(cs, "--lg-sat") ?? k.sat, spec: num(cs, "--lg-spec") ?? k.spec, disp });
  const v = `url(#${id})`;
  if (e.style.getPropertyValue("--lg") !== v) e.style.setProperty("--lg", v);
}

const SELECTOR = ".glass, .glass-clear, .glass-lens";

/** Keep every glass element under `root` refracting, as they come, go and
 *  change size. Returns a disposer. A no-op where refraction isn't
 *  supported: the CSS fallback is already on screen. */
export function observeGlass(root: HTMLElement): () => void {
  if (!refracts()) return () => {};
  document.documentElement.dataset.refract = "";
  const seen = new WeakSet<HTMLElement>();
  const ro = new ResizeObserver((entries) => entries.forEach((en) => fit(en.target as HTMLElement)));
  const add = (n: HTMLElement) => {
    // Still copies of the display carry the filter they were copied with.
    if (seen.has(n) || n.closest('[data-os-root="mirror"]')) return;
    seen.add(n);
    fitted.add(n);
    ro.observe(n);
  };
  const scan = (n: Node) => {
    if (!(n instanceof HTMLElement)) return;
    if (n.matches(SELECTOR)) add(n);
    n.querySelectorAll<HTMLElement>(SELECTOR).forEach(add);
  };
  scan(root);
  const mo = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === "attributes") {
        const t = m.target as HTMLElement;
        if (t.matches(SELECTOR)) {
          add(t);
          fit(t);
        }
      } else m.addedNodes.forEach(scan);
    }
  });
  mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  return () => {
    mo.disconnect();
    ro.disconnect();
    fitted.clear();
  };
}

/** Refit every glass element (after the Liquid Glass setting changes). */
export function refitGlass() {
  if (!supported) return;
  for (const e of fitted) {
    if (e.isConnected) fit(e);
    else fitted.delete(e);
  }
}
