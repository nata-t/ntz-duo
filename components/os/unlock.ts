import { gsap } from "@/lib/gsap";
import { dims, os } from "@/lib/os";

// iOS 27's unlock. As the Lock Screen leaves, the Home Screen arrives as if
// the camera were pulling back from it: every icon and widget starts where
// a view zoomed ZOOM times about the display's centre would put it, large
// and out of focus, and settles into place. The middle lands first and the
// edges follow, each a beat later the further out it sits, with a little
// spring. The dock's apps rise one after another, and Search with them.

const ZOOM = 2.6;
const BLUR = 14;
/** Seconds: each element's flight, and the spread of starts centre to edge. */
const FLIGHT = 0.78;
const SPREAD = 0.2;

/** An element's centre in the display's own points: offsets up to the
 *  display (transforms aside), plus the Home Screen strip's slide. */
function centreOf(el: HTMLElement, root: HTMLElement) {
  let x = el.offsetWidth / 2, y = el.offsetHeight / 2;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    if (n.dataset.homeStrip !== undefined) x += Number(gsap.getProperty(n, "x")) || 0;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

export function playUnlock(root: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { w: W, h: H } = dims();
  const cx = W / 2, cy = H / 2;
  const reach = Math.hypot(cx, cy);

  const springs = [...root.querySelectorAll<HTMLElement>("[data-home] [data-spring]")];
  for (const el of springs) {
    const c = centreOf(el, root);
    // Off the visible page: nothing to see.
    if (c.x < -40 || c.x > W + 40) continue;
    const dx = c.x - cx, dy = c.y - cy;
    const delay = (Math.hypot(dx, dy) / reach) * SPREAD;
    // Widgets may hold Liquid Glass, which mustn't sit under a filter or a
    // fade (it would lose what it refracts): they fly in sharp.
    const glassy = el.dataset.spring === "glass";
    gsap.fromTo(
      el,
      { x: dx * (ZOOM - 1), y: dy * (ZOOM - 1), scale: ZOOM, ...(glassy ? {} : { filter: `blur(${BLUR}px)`, opacity: 0 }) },
      {
        x: 0,
        y: 0,
        scale: 1,
        duration: FLIGHT,
        delay,
        ease: glassy ? "back.out(0.6)" : "back.out(1.05)",
        overwrite: true,
        clearProps: "transform,filter,opacity",
      },
    );
    if (!glassy) {
      gsap.to(el, { opacity: 1, duration: 0.22, delay, ease: "power1.out", overwrite: false });
      gsap.to(el, { filter: "blur(0px)", duration: FLIGHT * 0.7, delay, ease: "power2.out", overwrite: false });
    }
  }

  // The dock: its glass grows into place, its apps rise in turn.
  const vertical = !os.get().portrait;
  const dock = [...root.querySelectorAll<HTMLElement>("[data-home] [data-dock]")];
  dock.forEach((el, i) => {
    const panel = el.dataset.dock === "panel";
    gsap.fromTo(
      el,
      panel ? { scale: 0.7 } : { [vertical ? "x" : "y"]: 46, scale: 0.35, opacity: 0 },
      {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        duration: panel ? 0.7 : 0.62,
        delay: panel ? 0.05 : 0.12 + i * 0.055,
        ease: panel ? "expo.out" : "back.out(1.7)",
        overwrite: true,
        clearProps: "transform,opacity",
      },
    );
  });
}
