import { createStore } from "@/lib/store";
import { refitGlass } from "@/lib/glass";

// The phone's state. Every copy of the inner display (the live one and the
// two mirrored halves shown while the device folds) renders from this, so
// they always agree on what is open.

/** Where a window sits on the inner display. */
export type Slot = "full" | "left" | "right";
/** A rect in display points (the inner display is 951 × 669 pt). */
export type Rect = { x: number; y: number; w: number; h: number };
export type Appearance = "light" | "dark" | "auto";

export type Win = {
  id: string;
  app: string;
  slot: Slot;
  /** The icon the window grew from, so it can shrink back into it. */
  origin: Rect | null;
  closing?: boolean;
};

export type Overlay = null | "control" | "search" | "switcher";

type OS = {
  windows: Win[];
  focus: string | null;
  page: number;
  overlay: Overlay;
  appearance: Appearance;
  /** Resolved from appearance and the system preference. */
  dark: boolean;
  brightness: number;
  wallpaper: string;
  /** Left pane's share of the display in split view. */
  split: number;
  /** True while the device is open, zoomed in and taking input. */
  live: boolean;
  sounds: boolean;
  /** A link app asking before it leaves the site. */
  alert: string | null;
  /** Phones hold the open device upright: the inner display runs portrait. */
  portrait: boolean;
  /** A window showing dark media (a photo viewer) asks for a white status bar. */
  statusLight: string | null;
  /** Full screen: the display has left the device and fills the window,
   *  laid out at the window's size in points (shown at zoom z). */
  screen: Screen | null;
  /** iOS 27's Liquid Glass slider: 0 clear … 1 tinted, 0.5 by default. */
  glass: number;
};

export type Screen = { w: number; h: number; z: number };

export const os = createStore<OS>({
  windows: [],
  focus: null,
  page: 0,
  overlay: null,
  appearance: "auto",
  dark: false,
  brightness: 1,
  wallpaper: "dunes",
  split: 0.5,
  live: false,
  sounds: false,
  alert: null,
  portrait: false,
  statusLight: null,
  screen: null,
  glass: 0.5,
});

export const useOS = os.use;

/** The inner display in points: 951 × 669 landscape, turned for portrait,
 *  or the window's own size in full screen. */
export function dims(portrait = os.get().portrait, screen = os.get().screen) {
  if (screen) return { w: screen.w, h: screen.h };
  return portrait ? { w: 669, h: 951 } : { w: 951, h: 669 };
}
export function useDims() {
  const portrait = useOS((s) => s.portrait);
  const screen = useOS((s) => s.screen);
  return dims(portrait, screen);
}

/** The OS laid out across a whole window. Upright, phone widths stay at
 *  1:1 (never narrower than 400 pt); on its side, the kit's 669 pt height
 *  fills the window, a little larger, with the extra width to spare. */
export function screenFor(vw: number, vh: number): Screen {
  const z =
    vh > vw
      ? Math.max(Math.min(1, vw / 400), Math.min(vw / 669, vh / 951))
      : Math.min(vw / 951, vh / 669, 1.4);
  return { w: vw / z, h: vh / z, z };
}

let seq = 0;

/** Which part of the display the home screen shows through, if any. */
export function homeRegion(windows: Win[]): Slot | null {
  const open = windows.filter((w) => !w.closing);
  if (open.length === 0) return "full";
  if (open.some((w) => w.slot === "full")) return null;
  const left = open.some((w) => w.slot === "left");
  const right = open.some((w) => w.slot === "right");
  if (left && right) return null;
  return left ? "right" : "left";
}

export function openApp(app: string, origin: Rect | null) {
  const { windows } = os.get();
  const existing = windows.find((w) => w.app === app && !w.closing);
  if (existing) {
    os.set({ focus: existing.id, overlay: null });
    return;
  }
  const region = homeRegion(windows);
  const id = `w${++seq}`;
  if (region === null) {
    // Nothing visible to open into (a full app, or two apps in split view):
    // replace whichever window isn't focused.
    const { focus } = os.get();
    const target = windows.find((w) => !w.closing && w.id !== focus) ?? windows.find((w) => !w.closing);
    const slot = target?.slot ?? "full";
    os.set({
      windows: [...windows.map((w) => (w === target ? { ...w, closing: true } : w)), { id, app, slot, origin }],
      focus: id,
      overlay: null,
    });
    return;
  }
  os.set({ windows: [...windows, { id, app, slot: region, origin }], focus: id, overlay: null });
}

export function closeWindow(id: string) {
  os.set((s) => ({
    windows: s.windows.map((w) => (w.id === id ? { ...w, closing: true } : w)),
    focus: s.focus === id ? (s.windows.find((w) => w.id !== id && !w.closing)?.id ?? null) : s.focus,
  }));
}

/** Called by a window once its closing animation has finished. */
export function removeWindow(id: string) {
  os.set((s) => ({ windows: s.windows.filter((w) => w.id !== id), statusLight: s.statusLight === id ? null : s.statusLight }));
}

export function goHome() {
  os.set((s) => ({ windows: s.windows.map((w) => ({ ...w, closing: true })), focus: null, overlay: null }));
}

/** Move a window to a slot. Taking the full display closes its neighbour;
 *  taking a half pushes a neighbour already there to the other half. */
export function moveWindow(id: string, slot: Slot) {
  os.set((s) => {
    const me = s.windows.find((w) => w.id === id);
    if (!me || me.slot === slot) return {};
    const windows = s.windows.map((w) => {
      if (w.id === id) return { ...w, slot, origin: null };
      if (w.closing) return w;
      if (slot === "full") return { ...w, closing: true };
      if (w.slot === slot) return { ...w, slot: me.slot === "full" ? (slot === "left" ? "right" : "left") : me.slot };
      return w;
    }) as Win[];
    return { windows, focus: id };
  });
}

export function swapSides() {
  os.set((s) => ({
    windows: s.windows.map((w) =>
      w.slot === "left" ? { ...w, slot: "right" } : w.slot === "right" ? { ...w, slot: "left" } : w,
    ),
  }));
}

export function setAppearance(appearance: Appearance) {
  os.set({ appearance });
  try {
    localStorage.setItem("duo:appearance", appearance);
  } catch {}
  syncAppearance();
}

/** Settings › Appearance › Liquid Glass: from clear to tinted. */
export function setGlass(glass: number) {
  os.set({ glass });
  try {
    localStorage.setItem("duo:glass", String(Math.round(glass * 100) / 100));
  } catch {}
  applyGlass();
}

/** Mirror the Liquid Glass setting onto <html> (CSS reads --frost) and
 *  rebuild the refraction filters, whose blur depends on it. */
export function applyGlass() {
  if (typeof window === "undefined") return;
  document.documentElement.style.setProperty("--frost", String(os.get().glass));
  refitGlass();
}

/** Resolve "auto" against the system and mirror the result onto <html>. */
export function syncAppearance() {
  if (typeof window === "undefined") return;
  const { appearance } = os.get();
  const dark =
    appearance === "dark" || (appearance === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  if (os.get().dark !== dark) os.set({ dark });
}

/** The inner display's corner, in points. On the device the hardware
 *  rounds it; full screen, the display rounds itself so it still reads as
 *  a screen, and full windows share the curve. */
export const DISPLAY_CORNER = 40;

/** Split View's black divider, straddling the hinge. The UI kit draws it
 *  at 11 pt; on the Duo's crease that read as a gutter, so it's slimmer. */
export const DIVIDER = 6;

/** The rect a slot occupies on the inner display. In portrait the two
 *  "halves" stack, top (left) over bottom (right). */
export function slotRect(slot: Slot, split: number, W: number, H: number): Rect {
  const gap = DIVIDER;
  if (slot === "full") return { x: 0, y: 0, w: W, h: H };
  if (H > W) {
    const mid = H * split;
    if (slot === "left") return { x: 0, y: 0, w: W, h: mid - gap / 2 };
    return { x: 0, y: mid + gap / 2, w: W, h: H - mid - gap / 2 };
  }
  const mid = W * split;
  if (slot === "left") return { x: 0, y: 0, w: mid - gap / 2, h: H };
  return { x: mid + gap / 2, y: 0, w: W - mid - gap / 2, h: H };
}
