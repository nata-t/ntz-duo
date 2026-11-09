import { scrollToTarget } from "@/lib/lenis";
import { enterFull, prefersFull, whenLive } from "@/lib/full";
import { openApp } from "@/lib/os";
import { LENGTH, MARKS } from "./story";

/** Scroll to a moment of the story. */
export function scrollToStory(t: number) {
  const track = document.querySelector<HTMLElement>("[aria-label='ntz duo']");
  if (!track) return;
  scrollToTarget(track.offsetTop + (t / LENGTH) * (track.offsetHeight - window.innerHeight));
}

/** Go to the open phone and, once it's live, open an app there. On touch
 *  screens the display goes full screen first: in place it's too small to use. */
export function visit(app?: string) {
  scrollToStory(MARKS.liveIn + 0.15);
  whenLive(() => {
    if (prefersFull()) enterFull();
    if (app) openApp(app, null);
  });
}
