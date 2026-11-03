import type { Slot } from "@/lib/os";

/** What every app receives from its window. */
export type AppProps = {
  /** The window's id, for anything an app wants to key on. */
  id: string;
  /** Size of the app's area in display points. Changes with split view. */
  width: number;
  height: number;
  /** Where the window sits: apps put their side bar on the outer edge. */
  slot: Slot;
  /** True for the static copies drawn while the device folds: no effects,
   *  no listeners, no autoplay. */
  mirror: boolean;
  /** Close this window (back to the Home Screen). */
  close: () => void;
};
