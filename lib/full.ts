import { createStore } from "@/lib/store";
import { coarsePointer } from "@/lib/env";
import { lenisRef } from "@/lib/lenis";
import { copyLive } from "@/lib/mirror";
import { os, screenFor } from "@/lib/os";

// Full screen: the inner display leaves the device and fills the window,
// laid out at the window's own size, so the portfolio reads like an app
// rather than a picture of one. The page stops scrolling underneath; the
// phone's state is the same store, so nothing open is lost either way.

export type Box = { x: number; y: number; w: number; h: number };

type Full = {
  /** enter and exit are the transitions; on is settled. */
  phase: "off" | "enter" | "on" | "exit";
  /** A still of the display the transition starts from or ends on. */
  ghost: { node: HTMLElement; settle: () => void } | null;
  /** The device's display on the page, in px, at the moment of the switch. */
  from: Box;
  /** The device's zoom, and the zoom the still was taken at. */
  k: number;
  zoom: number;
};

export const full = createStore<Full>({ phase: "off", ghost: null, from: { x: 0, y: 0, w: 0, h: 0 }, k: 1, zoom: 1 });

/** What the stage tells full screen about the device. */
const device = {
  display: (): Box => ({ x: 0, y: 0, w: window.innerWidth, h: window.innerHeight }),
  portrait: () => false,
  k: 1,
};
export function describeDevice(d: Partial<typeof device>) {
  Object.assign(device, d);
}

function lock(on: boolean) {
  const lenis = lenisRef.current;
  if (lenis) {
    if (on) lenis.stop();
    else lenis.start();
  }
  document.documentElement.classList.toggle("overflow-hidden", on);
}

function fit() {
  if (!os.get().screen) return;
  os.set({ screen: screenFor(window.innerWidth, window.innerHeight), portrait: window.innerHeight > window.innerWidth });
}

function onPop() {
  if (os.get().screen) exitFull(true);
}

/** Lift the display out of the device. Only while the phone is live. */
export function enterFull() {
  const s = os.get();
  if (s.screen || !s.live) return;
  // The still is taken at the device's size, before the layout changes.
  full.set({ phase: "enter", ghost: copyLive(), from: device.display(), k: device.k, zoom: device.k });
  os.set({ screen: screenFor(window.innerWidth, window.innerHeight), portrait: window.innerHeight > window.innerWidth, overlay: null });
  lock(true);
  window.addEventListener("resize", fit);
  // Back (or the system back gesture) returns to the device.
  history.pushState({ duoFull: true }, "");
  window.addEventListener("popstate", onPop);
}

/** Put the display back into the device. */
export function exitFull(fromHistory = false) {
  if (!os.get().screen) return;
  window.removeEventListener("resize", fit);
  window.removeEventListener("popstate", onPop);
  if (!fromHistory && history.state?.duoFull) history.back();
  // The still is taken full size, before the layout returns to the device's.
  full.set({ phase: "exit", ghost: copyLive(), from: device.display(), k: device.k, zoom: os.get().screen!.z });
  os.set({ screen: null, portrait: device.portrait(), overlay: null });
  lock(false);
}

export function toggleFull() {
  if (os.get().screen) exitFull();
  else enterFull();
}

/** Touch screens get full screen on their own: the device's display is too
 *  small there to use in place. */
export function prefersFull() {
  return coarsePointer();
}

/** Run `fn` once the phone is live (the scroll to it may still be running). */
export function whenLive(fn: () => void, timeout = 3000) {
  if (os.get().live) {
    fn();
    return;
  }
  const stop = os.subscribe(() => {
    if (!os.get().live) return;
    stop();
    window.clearTimeout(t);
    // Let the device settle flat before anything opens on it.
    window.setTimeout(fn, 250);
  });
  const t = window.setTimeout(stop, timeout);
}
