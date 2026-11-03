import type Lenis from "lenis";

// The live Lenis instance, published by MotionProvider. null before mount
// and for reduced-motion visitors — callers fall back to native scrolling.
export const lenisRef: { current: Lenis | null } = { current: null };

export function scrollToTarget(
  target: number | string | HTMLElement,
  opts: { immediate?: boolean; offset?: number } = {},
) {
  const lenis = lenisRef.current;
  if (lenis) {
    lenis.scrollTo(target, { immediate: opts.immediate, offset: opts.offset ?? 0, force: true });
    return;
  }
  let top = 0;
  if (typeof target === "number") top = target;
  else {
    const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    if (!el) return;
    top = el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0);
  }
  window.scrollTo({ top, behavior: opts.immediate ? "auto" : "smooth" });
}
