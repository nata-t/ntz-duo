// The Lock Screen's art, shared by the WebGL displays (folding) and the
// live inner display (flat), so the two are the same picture.
//
// The wallpaper is three sheets of one photograph (sky, ridge, dunes) cut
// from the UI kit's desert, light and dark. The clock sits inside that
// stack: date and time fall behind the ridge, and the chrome (status
// circle, flashlight and camera, home indicator) stays in front of all of
// it. The chrome is the kit's own plate; the time is painted live, laid
// out where the kit draws it.

export type Theme = "light" | "dark";
export type Panel = "inner" | "outer";

const LOCK = "/device/duo/lock/";
const UI = "/device/duo/ui/";

/** The kit's plates: where the time box ends (fractions of the plate). */
const TIME_BOX = { w: 0.73, h: 0.54 };

/** Where the kit draws the date and the time, as fractions of the panel. */
export const CLOCK = {
  inner: { dateBase: 0.089, timeTop: 0.114, timeBottom: 0.387, centre: 0.5, width: 0.234, align: "centre" as const },
  outer: { dateBase: 0.0864, timeTop: 0.113, timeBottom: 0.381, left: 0.171, width: 0.5, align: "left" as const },
};

export const wallpaper = (theme: Theme, sheet: "base" | "sky" | "ridge" | "dune" | "front") => `${LOCK}${theme}-${sheet}.webp`;

// The sheets' depths and the panels' frames, in the model's units (y up):
// shut, each sheet is pushed in by its own share of CLOSED_ZOOM, about the
// inner display's centre, and the outer display shows a window onto them.
export const MODEL_DROP = 5.8974;
export const INNER_FRAME = { x: -7.89935, y: 0.34562 - MODEL_DROP, w: 15.7987, h: 11.1035 };
const OUTER_SCALE = (40 - 0.24948) / (40 - 0.825538);
export const OUTER_FRAME = { x: 0.23396 * OUTER_SCALE, y: (0.27173 - MODEL_DROP) * OUTER_SCALE, w: 7.73936 * OUTER_SCALE, h: 11.2513 * OUTER_SCALE };
export const CLOSED_ZOOM = 1.47;
export const DEPTH = { sky: 0.47, ridge: 1, dune: 0.7 } as const;

/** A sheet's frame at an openness (0 shut, 1 open). */
export function layerFrame(openness: number, depth: number) {
  const shut = 1 + (CLOSED_ZOOM - 1) * depth;
  const t = Math.min(1, Math.max(0, (openness - 0.3) / 0.7));
  const zoom = shut + (1 - shut) * t * t * (3 - 2 * t);
  const w = INNER_FRAME.w * zoom, h = INNER_FRAME.h * zoom;
  return { x: -w / 2, y: INNER_FRAME.y + INNER_FRAME.h / 2 - h / 2, w, h };
}

/** Where a sheet lies over the shut outer display, as CSS percentages of
 *  the display (the GPU draws the same window). */
export function outerSheet(depth: number) {
  const l = layerFrame(0, depth), p = OUTER_FRAME;
  const left = ((l.x - p.x) / p.w) * 100, width = (l.w / p.w) * 100;
  const height = (l.h / p.h) * 100, bottom = ((l.y - p.y) / p.h) * 100;
  return { left: `${left}%`, width: `${width}%`, height: `${height}%`, top: `${100 - bottom - height}%` };
}

export type Sheets = { base: HTMLImageElement; sky: HTMLImageElement; ridge: HTMLImageElement };

const cache = new Map<string, Promise<HTMLImageElement>>();
export function image(src: string): Promise<HTMLImageElement> {
  let p = cache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const i = new Image();
      i.decoding = "async";
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
    cache.set(src, p);
  }
  return p;
}

export async function loadSheets(theme: Theme): Promise<Sheets> {
  const [base, sky, ridge] = await Promise.all([image(wallpaper(theme, "base")), image(wallpaper(theme, "sky")), image(wallpaper(theme, "ridge"))]);
  return { base, sky, ridge };
}

/** Canvas pixels per point for a Lock Screen whose display is shown at
 *  most `zoom` CSS px per point: every screen pixel gets its own, with a
 *  touch over for the 4% settle as it wakes. In tenths, so a window being
 *  resized doesn't repaint it every frame. */
export function paintScale(zoom: number) {
  return Math.min(3, Math.ceil((window.devicePixelRatio || 1) * zoom * 1.05 * 10) / 10);
}

export function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const x = c.getContext("2d")!;
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = "high";
  return [c, x] as const;
}

/** A CSS custom property, resolved (custom properties compute with their
 *  var() references substituted), for a canvas font string. */
function cssFont(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
const clockFamily = () => cssFont("--font-clock", "'Arial Narrow', sans-serif");
const textFamily = () => cssFont("--font-display", "system-ui, sans-serif");

let fontsReady: Promise<unknown> | null = null;
/** The clock's face and the date's, loaded before anything paints with them. */
export function loadFonts() {
  fontsReady ??= Promise.all([
    document.fonts.load(`650 100px ${clockFamily()}`),
    document.fonts.load(`600 24px ${textFamily()}`),
  ]).catch(() => {});
  return fontsReady;
}

export function clockText(d: Date) {
  return {
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?[AP]M$/, ""),
    date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).replace(",", ""),
  };
}

/**
 * The date and the time, painted onto a panel-sized context (w × h px).
 * The numerals are iOS 26's tall Lock Screen clock: a condensed face drawn
 * to the kit's height, filled with a faint wash of the sky above and the
 * sand below, the way the glass numerals pick up the wallpaper.
 */
export function paintTime(x: CanvasRenderingContext2D, w: number, h: number, panel: Panel, theme: Theme, now: Date) {
  const box = CLOCK[panel];
  const { time, date } = clockText(now);
  x.save();
  x.clearRect(0, 0, w, h);

  // The time: sized so "9:41" spans the kit's width, then stood to its height.
  const top = box.timeTop * h, height = (box.timeBottom - box.timeTop) * h;
  const probe = 100;
  x.font = `650 ${probe}px ${clockFamily()}`;
  const ref = x.measureText("9:41");
  const size = (probe * box.width * w) / Math.max(1, ref.width);
  x.font = `650 ${size}px ${clockFamily()}`;
  const m = x.measureText(time);
  const ascent = m.actualBoundingBoxAscent || size * 0.72;
  const stretch = height / ascent;
  const tw = m.width;
  const left = box.align === "centre" ? box.centre * w - tw / 2 : box.left * w;
  // Drawn in the stretched space, so the gradient runs the glyphs' height.
  x.setTransform(1, 0, 0, stretch, left, top);
  x.textBaseline = "alphabetic";
  const g = x.createLinearGradient(0, 0, 0, ascent);
  if (theme === "light") {
    g.addColorStop(0, "rgba(234,244,255,0.97)");
    g.addColorStop(0.55, "rgba(255,252,242,0.97)");
    g.addColorStop(1, "rgba(238,224,198,0.95)");
  } else {
    g.addColorStop(0, "rgba(226,232,255,0.95)");
    g.addColorStop(0.6, "rgba(240,236,246,0.93)");
    g.addColorStop(1, "rgba(214,196,214,0.9)");
  }
  x.fillStyle = g;
  x.fillText(time, 0, ascent);
  x.restore();

  // The date, centred over the time.
  x.save();
  const ds = h * (panel === "inner" ? 0.0372 : 0.0368);
  x.font = `600 ${ds}px ${textFamily()}`;
  x.fillStyle = "rgba(255,255,255,0.94)";
  x.textAlign = "center";
  x.textBaseline = "alphabetic";
  x.fillText(date, left + tw / 2, box.dateBase * h);
  x.restore();
}

const plates: Partial<Record<Panel, Promise<HTMLImageElement>>> = {};
const plate = (panel: Panel) => (plates[panel] ??= image(`${UI}clock-${panel}.avif`));

/** One notification on the outer Lock Screen: the invitation. */
async function paintNotice(x: CanvasRenderingContext2D, w: number, h: number) {
  // In the outer panel's points (466 × 678), scaled to the canvas.
  const s = w / 466;
  const n = OUTER_GLASS.notice;
  const L = n.left * s, R = w - n.right * s, B = h - n.bottom * s, H = n.h * s, T = B - H, r = n.r * s;
  glassShape(x, () => {
    x.beginPath();
    x.roundRect(L, T, R - L, H, r);
  }, s, T, B);
  x.save();
  // Avatar.
  const a = 38 * s, ax = L + 14 * s, ay = T + 14 * s;
  x.save();
  x.beginPath();
  x.roundRect(ax, ay, a, a, 9 * s);
  x.clip();
  x.fillStyle = "#c9d6ff";
  x.fillRect(ax, ay, a, a);
  try {
    const p = await image("/portrait/source.webp");
    const pw = a, ph = (p.naturalHeight / p.naturalWidth) * pw;
    x.drawImage(p, ax, ay + 6 * s, pw, ph);
  } catch {}
  x.restore();
  const tx = ax + a + 11 * s, right = R - 14 * s;
  const font = textFamily();
  x.textBaseline = "alphabetic";
  x.fillStyle = "#fff";
  x.font = `600 ${14 * s}px ${font}`;
  x.fillText("Natnael Tadele", tx, ay + 13 * s);
  x.textAlign = "right";
  x.fillStyle = "rgba(255,255,255,0.7)";
  x.font = `400 ${14 * s}px ${font}`;
  x.fillText("now", right, ay + 13 * s);
  x.textAlign = "left";
  x.fillStyle = "rgba(255,255,255,0.9)";
  const words = "Hello, hello. Open me up: the work is on the inside.".split(" ");
  let line = "", y = ay + 31 * s;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (x.measureText(next).width > right - tx && line) {
      x.fillText(line, tx, y);
      line = word;
      y += 18 * s;
    } else line = next;
  }
  x.fillText(line, tx, y);
  x.restore();
}

/** The kit's chrome over a panel-sized context: the plate with its time box
 *  cleared (the time is painted live), and on the outer panel, the
 *  notification. */
export async function paintChrome(
  x: CanvasRenderingContext2D,
  w: number,
  h: number,
  panel: Panel,
  { notice = false, glass = false }: { notice?: boolean; glass?: boolean } = {},
) {
  const p = await plate(panel);
  x.clearRect(0, 0, w, h);
  x.drawImage(p, 0, 0, w, h);
  x.clearRect(0, 0, TIME_BOX.w * w, TIME_BOX.h * h);
  // The Lock Screens' flashlight and camera (and the outer's notification)
  // are Liquid Glass in the DOM; the GPU, which can't refract, paints their
  // likeness (glass: true), and the DOM's own chrome leaves them out to lay
  // real glass there. The kit's plate buttons always go.
  const clear = panel === "inner" ? [0.9, 0.74, 0.1, 0.24] : [0.8, 0.74, 0.2, 0.24];
  x.clearRect(clear[0]! * w, clear[1]! * h, clear[2]! * w, clear[3]! * h);
  if (glass) paintGlassButtons(x, w, h, panel);
  if (notice) await paintNotice(x, w, h);
}

/** Where the outer Lock Screen's glass sits, in outer display points. */
export const OUTER_GLASS = {
  /** The outer camera's centre: the rail's controls line up under it. */
  camX: 418.2,
  buttons: { size: 50, gap: 14, bottom: 28 },
  notice: { left: 18, right: 96, bottom: 28, h: 74, r: 26 },
};

/** Flashlight and camera, per layout, in that panel's points: their
 *  column's centre from the right edge, where the kit's plate puts them. */
export const GLASS_BUTTONS = {
  inner: { panel: { w: 951, h: 669 }, right: 49, bottom: 33, gap: 19, size: 50 },
  outer: { panel: { w: 466, h: 678 }, right: 466 - OUTER_GLASS.camX, bottom: 28, gap: 14, size: 50 },
};
export const BUTTON_ICONS = ["M9 2h6v4l-2 4v12h-2V10L9 6z", "M4 8h3l2-3h6l2 3h3v11H4zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7"];

/** Clear Liquid Glass, as paint: a faint lift of the light behind it, a
 *  bright rim strongest on the upper left, and a soft shade below. */
function glassShape(x: CanvasRenderingContext2D, path: () => void, s: number, top: number, bottom: number) {
  x.save();
  x.shadowColor = "rgba(0,0,0,0.14)";
  x.shadowBlur = 10 * s;
  x.shadowOffsetY = 2 * s;
  path();
  x.fillStyle = "rgba(255,255,255,0.26)";
  x.fill();
  x.restore();
  x.save();
  path();
  const rim = x.createLinearGradient(0, top, 0, bottom);
  rim.addColorStop(0, "rgba(255,255,255,0.62)");
  rim.addColorStop(0.45, "rgba(255,255,255,0.16)");
  rim.addColorStop(1, "rgba(255,255,255,0.34)");
  x.lineWidth = 1.1 * s;
  x.strokeStyle = rim;
  x.stroke();
  x.restore();
}

function paintGlassButtons(x: CanvasRenderingContext2D, w: number, h: number, panel: Panel) {
  const b = GLASS_BUTTONS[panel], s = w / b.panel.w;
  const r = (b.size / 2) * s, cx = w - b.right * s;
  const centres = [h - (b.bottom + b.size / 2 + b.size + b.gap) * s, h - (b.bottom + b.size / 2) * s];
  centres.forEach((cy, i) => {
    glassShape(x, () => {
      x.beginPath();
      x.arc(cx, cy, r, 0, Math.PI * 2);
    }, s, cy - r, cy + r);
    x.save();
    x.translate(cx - 11 * s, cy - 11 * s);
    x.scale((22 / 24) * s, (22 / 24) * s);
    x.lineWidth = 1.8;
    x.lineJoin = "round";
    x.strokeStyle = "#fff";
    x.stroke(new Path2D(BUTTON_ICONS[i]));
    x.restore();
  });
}
