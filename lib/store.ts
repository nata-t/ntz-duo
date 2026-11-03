import { useSyncExternalStore } from "react";

// A minimal external store: one object, shallow-merged updates, and a hook
// that subscribes a component to a selected slice. Enough for the phone's
// state, which every copy of the screen (live and mirrored) reads.
export function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();

  const get = () => state;
  const set = (patch: Partial<T> | ((s: T) => Partial<T>)) => {
    const next = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };

  function use<S>(select: (s: T) => S): S {
    return useSyncExternalStore(
      subscribe,
      () => select(state),
      () => select(initial),
    );
  }

  return { get, set, subscribe, use };
}
