import { scrollToTarget } from "@/lib/lenis";
import { enterFull, prefersFull, whenLive } from "@/lib/full";
import { openApp } from "@/lib/os";
import { openLock } from "@/components/os/LockScreen";
import { LENGTH, MARKS } from "./story";

/** The stage's scroll track: its height is the story's length. */
export const storyTrack = () => document.querySelector<HTMLElement>("[aria-label='ntz duo']");

/** Scroll to a moment of the story. */
export function scrollToStory(t: number, opts: { immediate?: boolean } = {}) {
  const track = storyTrack();
  if (!track) return;
  scrollToTarget(track.offsetTop + (t / LENGTH) * (track.offsetHeight - window.innerHeight), opts);
}

/** Go to the open phone and, once it's live, open an app there. On touch
 *  screens the display goes full screen first: in place it's too small to use. */
export function visit(app?: string) {
  scrollToStory(MARKS.liveIn + 0.15);
  whenLive(() => {
    if (prefersFull()) enterFull();
    // Asked for something on the phone: it opens itself, as a swipe would.
    if (app) {
      openLock();
      openApp(app, null);
    }
  });
}
