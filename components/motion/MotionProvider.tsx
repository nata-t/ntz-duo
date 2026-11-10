"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { lenisRef } from "@/lib/lenis";
import { observeGlass } from "@/lib/glass";

// Site-wide scroll runtime: Lenis driven by GSAP's ticker so smooth scroll
// and every ScrollTrigger advance on the same frame (artcraft's wiring).
// Reduced-motion visitors keep native scroll and get no Lenis at all.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  // Liquid Glass refracts wherever the browser can bend a backdrop.
  useEffect(() => observeGlass(document.body), []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9 });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Web fonts change line boxes; re-measure every trigger once they land.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
