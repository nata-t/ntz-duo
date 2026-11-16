"use client";

import { useSyncExternalStore } from "react";
import { gsap } from "@/lib/gsap";
import { createStore } from "@/lib/store";
import { lock, os, touchPhone } from "@/lib/os";

// The panels' light. One value for every surface that shows the screen:
// the live DOM displays, their folding copies, and the GPU's Lock Screens,
// so nothing jumps in brightness as the picture passes between them.
//
// Brightness (Control Center) dims the panel as iOS does, never to black;
// the side button turns the backlight off and on.

/** The share of light a panel gives at brightness b (sRGB). */
export const dim = (b: number) => 1 - 0.7 * (1 - b);

/** The backlight, 0 off … 1 on, animated. */
export const backlight = createStore({ on: 1 });
const anim = { on: 1 };

const tween = (to: number, duration: number) =>
  gsap.to(anim, { on: to, duration, ease: "power2.out", overwrite: true, onUpdate: () => backlight.set({ on: anim.on }) });

/** The side button, display on: the screen goes dark and the phone locks. */
export function sleep() {
  if (!os.get().awake) return;
  os.set({ awake: false });
  lock();
  tween(0, 0.3);
}

/** The side button, display off: the backlight comes up on the Lock Screen. */
export function wake() {
  if (os.get().awake) return;
  touchPhone();
  os.set({ awake: true });
  tween(1, 0.45);
}

/** What a black veil over a DOM display must hide (its opacity). */
export function veil(b: number, on: number) {
  return 1 - dim(b) * on;
}

/** The same light for a GPU display, in linear light (it multiplies
 *  emission, where the DOM veil darkens sRGB). */
export function linearLevel(b = os.get().brightness, on = backlight.get().on) {
  return Math.pow(dim(b) * on, 2.2);
}

/** A DOM display's veil opacity, live. */
export function useVeil() {
  const b = os.use((s) => s.brightness);
  const on = useSyncExternalStore(backlight.subscribe, () => backlight.get().on, () => 1);
  return veil(b, on);
}
