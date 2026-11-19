import { createStore } from "@/lib/store";

// What the stage tells the device's displays about the story: which face
// the outer display shows, and the device's zoom k (CSS px per point with
// the open phone filling the view, the largest its displays ever show).
export const stage = createStore<{ outer: "lock" | "standby"; zoom: number }>({ outer: "lock", zoom: 1 });

/** Where the phone is on screen this frame: the box round its outline, in
 *  CSS px (WebGL device only; `on` is false until it's drawn). Plain and
 *  mutable, not a store: it changes every frame, and only the glass drop
 *  (Drop.tsx) reads it, on its own frames. */
export const deviceRect = { x: 0, y: 0, w: 0, h: 0, on: false };
