import { createStore } from "@/lib/store";

// What the stage tells the device's displays about the story: which face
// the outer display shows, and the device's zoom k (CSS px per point with
// the open phone filling the view, the largest its displays ever show).
export const stage = createStore<{ outer: "lock" | "standby"; zoom: number }>({ outer: "lock", zoom: 1 });
