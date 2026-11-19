import { createStore } from "./store";

// The first load. Everything the opening needs reports here: the page
// itself, its type, the device's model and textures, its Lock Screen, the
// GPU's programs and uploads, and the first screen's images. The loader
// (components/stage/Loader.tsx) shows the sum and lifts once all of it is
// in, so the opening never waits on the network or stalls on a first draw.

export type Task = "page" | "fonts" | "model" | "finish" | "lock" | "gpu" | "images";

/** In the order they finish, each with its rough share of the wait. */
export const TASKS: { task: Task; weight: number; label: string }[] = [
  { task: "page", weight: 0.06, label: "Waking up" },
  { task: "fonts", weight: 0.05, label: "Setting the type" },
  { task: "model", weight: 0.5, label: "Fetching the phone" },
  { task: "finish", weight: 0.12, label: "Polishing the titanium" },
  { task: "lock", weight: 0.08, label: "Painting the Lock Screen" },
  { task: "gpu", weight: 0.1, label: "Warming up the GPU" },
  { task: "images", weight: 0.09, label: "Developing the photos" },
];

/** The tasks only the WebGL device has. */
export const GL_TASKS: Task[] = ["model", "finish", "lock", "gpu"];

export type Phase = "loading" | "revealing" | "done";

type Boot = {
  /** Each task's fraction done, 0–1. */
  done: Record<Task, number>;
  /** A word on the task in hand ("1.2 of 3.6 MB"). */
  detail: Partial<Record<Task, string>>;
  phase: Phase;
};

export const boot = createStore<Boot>({
  done: { page: 0, fonts: 0, model: 0, finish: 0, lock: 0, gpu: 0, images: 0 },
  detail: {},
  phase: "loading",
});

/** A task got further. Fractions only ever grow. */
export function report(task: Task, fraction: number, detail?: string) {
  const { done, detail: details } = boot.get();
  const v = Math.max(done[task], Math.min(1, fraction));
  if (v === done[task] && detail === details[task]) return;
  boot.set({ done: { ...done, [task]: v }, detail: detail === undefined ? details : { ...details, [task]: detail } });
}

export function complete(...tasks: Task[]) {
  for (const t of tasks) report(t, 1);
}

/** Everything in. */
export const loaded = () => TASKS.every(({ task }) => boot.get().done[task] >= 1);

/** Run `fn` once the loader starts to lift (now, if it has). */
export function whenRevealed(fn: () => void): () => void {
  if (boot.get().phase !== "loading") {
    fn();
    return () => {};
  }
  const off = boot.subscribe(() => {
    if (boot.get().phase === "loading") return;
    off();
    fn();
  });
  return off;
}
