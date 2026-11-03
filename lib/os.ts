import { createStore } from "@/lib/store";

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
};

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
});

export const useOS = os.use;

/** The inner display in points: 951 × 669 landscape, turned for portrait. */
export function dims(portrait = os.get().portrait) {
  return portrait ? { w: 669, h: 951 } : { w: 951, h: 669 };
}
export function useDims() {
  return dims(useOS((s) => s.portrait));
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

/** Resolve "auto" against the system and mirror the result onto <html>. */
export function syncAppearance() {
  if (typeof window === "undefined") return;
  const { appearance } = os.get();
  const dark =
    appearance === "dark" || (appearance === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  if (os.get().dark !== dark) os.set({ dark });
}

/** The rect a slot occupies on the inner display. In portrait the two
 *  "halves" stack, top (left) over bottom (right). */
export function slotRect(slot: Slot, split: number, W: number, H: number): Rect {
  // An 11 pt black divider straddles the hinge (UI kit: 470 | 11 | 470).
  const gap = 11;
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
