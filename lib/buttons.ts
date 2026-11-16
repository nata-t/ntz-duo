"use client";

import { createStore } from "@/lib/store";
import { os, touchPhone } from "@/lib/os";
import { sleep, wake } from "@/lib/backlight";

// What the phone's buttons do.
//
// The side button turns the display off (locking the phone) and on again,
// on the Lock Screen. It never opens the phone: that's a swipe up.
//
// Volume moves in sixteen steps and shows iOS's volume HUD by the buttons
// (VolumeHUD). Pushed past either end, the HUD stretches toward the push
// and springs back.

export const STEPS = 16;

/** The HUD's last event: which way, whether it ran into an end, and when. */
export const volumeHUD = createStore({ at: 0, dir: 0 as -1 | 0 | 1, limit: false, held: false });

export function pressSide() {
  if (!os.get().awake) wake();
  else sleep();
}

/** One step of volume (dir 1 up, -1 down). */
export function stepVolume(dir: 1 | -1) {
  touchPhone();
  const { volume } = os.get();
  const next = Math.min(1, Math.max(0, Math.round((volume + dir / STEPS) * STEPS) / STEPS));
  if (next !== volume) os.set({ volume: next });
  volumeHUD.set({ at: performance.now(), dir, limit: next === volume, held: true });
}

/** A volume button let go. */
export function releaseVolume() {
  volumeHUD.set({ held: false });
}
