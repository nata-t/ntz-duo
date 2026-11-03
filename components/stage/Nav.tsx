"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { openApp, setAppearance, useOS } from "@/lib/os";
import { scrollToStory } from "./HeroCopy";
import { MARKS, span } from "./story";

export type NavHandle = { apply: (t: number) => void };

/** Scroll into the live phone, then open an app once it's there. */
function go(app?: string) {
  scrollToStory(MARKS.liveIn + 0.15);
  if (app) window.setTimeout(() => openApp(app, null), 1000);
}

// apple.com's 2026 local nav: a floating glass capsule with the product
// name, a few links and one blue pill. It steps aside while the phone is
// live, so the display gets the whole viewport.
const Nav = forwardRef<NavHandle>(function Nav(_, ref) {
  const root = useRef<HTMLElement>(null);
  const dark = useOS((s) => s.dark);

  useImperativeHandle(ref, () => ({
    apply(t) {
      const el = root.current;
      if (!el) return;
      const hide = span(t, MARKS.liveIn - 0.6, MARKS.liveIn - 0.2) * (1 - span(t, MARKS.liveOut + 0.1, MARKS.liveOut + 0.5));
      el.style.opacity = String(1 - hide);
      el.style.transform = `translate3d(-50%, ${-hide * 24}px, 0)`;
      el.style.pointerEvents = hide > 0.5 ? "none" : "auto";
    },
  }));

  const link = "rounded-full px-[10px] py-[6px] text-[12px] tracking-[-0.01em] text-ink/80 transition-colors hover:text-ink";

  return (
    <nav
      ref={root}
      aria-label="Site"
      className="fixed top-[10px] left-1/2 z-50 flex h-[52px] w-[min(1024px,calc(100vw-20px))] items-center justify-between rounded-[18px] pr-[10px] pl-[20px] backdrop-blur-[20px] backdrop-saturate-[1.8]"
      style={{
        transform: "translate3d(-50%,0,0)",
        background: "color-mix(in srgb, var(--page) 80%, transparent)",
        boxShadow: "0 0 0 1px color-mix(in srgb, var(--rule) 55%, transparent)",
        animation: "duo-nav 1s 0.9s var(--ease-out) backwards",
      }}
    >
      <button type="button" onClick={() => scrollToStory(0)} className="font-display text-[19px] leading-none font-semibold tracking-[0.012em]">
        ntz duo
      </button>
      <div className="flex items-center gap-[2px]">
        <button type="button" className={`${link} max-phone:hidden`} onClick={() => go()}>
          Work
        </button>
        <button type="button" className={`${link} max-phone:hidden`} onClick={() => go("about")}>
          About
        </button>
        <button type="button" className={`${link} max-phone:hidden`} onClick={() => go("contact")}>
          Contact
        </button>
        <button
          type="button"
          aria-label={dark ? "Switch to light appearance" : "Switch to dark appearance"}
          onClick={() => setAppearance(dark ? "light" : "dark")}
          className="mr-[6px] ml-[4px] grid size-[28px] place-items-center rounded-full text-ink/80 transition-colors hover:bg-page-alt hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => go()}
          className="rounded-full bg-cta px-[12px] py-[5px] text-[12px] leading-[18px] text-white transition-colors hover:bg-cta-hover"
        >
          Unfold
        </button>
      </div>
    </nav>
  );
});

export default Nav;
