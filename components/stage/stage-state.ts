import { createStore } from "@/lib/store";

// What the stage tells the device's displays about the story.
export const stage = createStore<{ outer: "lock" | "standby" }>({ outer: "lock" });
