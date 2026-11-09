"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { profile } from "@/content/site";
import { visit } from "./navigate";
import { span } from "./story";

export type HeroCopyHandle = { apply: (t: number) => void };

/** The two captions beside the turning device; on phones, centred under it. */
const CAPTION =
  "pointer-events-none absolute top-1/2 z-10 max-w-[min(30vw,420px)] -translate-y-1/2 opacity-0 max-phone:top-auto max-phone:right-5 max-phone:bottom-[max(6vh,24px)] max-phone:left-5 max-phone:max-w-none max-phone:translate-y-0 max-phone:text-center";

// The opening words, laid out like the iPhone Duo page: product name,
// a two-word headline, and a price bar that here carries who he is.
const HeroCopy = forwardRef<HeroCopyHandle>(function HeroCopy(_, ref) {
  const title = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const capA = useRef<HTMLDivElement>(null);
  const capB = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    apply(t) {
      // Out as the device turns away, back in as it returns at the end.
      const out = span(t, 0.04, 0.55), back = span(t, 9.0, 9.55);
      const v = Math.max(1 - out, back);
      if (title.current) {
        const lift = out * (1 - back);
        title.current.style.opacity = String(v);
        title.current.style.transform = `translate3d(0, ${-lift * 6}vh, 0) scale(${1 - lift * 0.04})`;
        title.current.style.filter = lift > 0.01 ? `blur(${lift * 10}px)` : "";
      }
      if (bar.current) {
        const b = Math.max(1 - span(t, 0.02, 0.3), span(t, 9.2, 9.6));
        bar.current.style.opacity = String(b);
        bar.current.style.transform = `translate3d(-50%, ${(1 - b) * 24}px, 0)`;
        bar.current.style.pointerEvents = b > 0.5 ? "auto" : "none";
      }
      const cap = (el: HTMLDivElement | null, a: number, b: number, c: number, d: number, dx: number) => {
        if (!el) return;
        const inn = span(t, a, b), outt = span(t, c, d);
        const o = inn * (1 - outt);
        el.style.opacity = String(o);
        el.style.transform = `translate3d(${(1 - inn) * dx + outt * -dx * 0.5}px, ${(1 - inn) * 30 - outt * 30}px, 0)`;
      };
      cap(capA.current, 0.75, 1.2, 1.55, 1.9, -30);
      cap(capB.current, 1.75, 2.15, 2.55, 2.9, 30);
    },
  }));

  return (
    <>
      <div
        ref={title}
        className="pointer-events-none absolute inset-x-0 top-[clamp(64px,10vh,120px)] z-10 text-center will-change-transform"
      >
        <p className="animate-intro font-display text-[clamp(19px,1.9vw,24px)] leading-[1.17] font-semibold tracking-[0.009em] [animation-delay:0.15s] motion-reduce:animate-none">
          ntz duo
        </p>
        <h1 className="mt-[0.15em] animate-intro font-display text-[clamp(56px,8.4vw,128px)] leading-[1.05] font-semibold tracking-[-0.015em] [animation-delay:0.3s] motion-reduce:animate-none">
          Hello, hello.
        </h1>
      </div>

      <div
        ref={capA}
        className={`${CAPTION} left-[clamp(24px,8vw,140px)]`}
      >
        <p className="text-[clamp(17px,1.4vw,21px)] font-semibold text-ink-2 max-phone:text-[15px]">Designed and built in Addis Ababa.</p>
        <p className="mt-2 font-display text-[clamp(32px,3.6vw,56px)] leading-[1.07] font-semibold tracking-[-0.005em] max-phone:mt-1 max-phone:text-[28px]">
          One engineer.
          <br />
          Two screens of work.
        </p>
      </div>

      <div
        ref={capB}
        className={`${CAPTION} right-[clamp(24px,8vw,140px)] text-right`}
      >
        <p className="font-display text-[clamp(32px,3.6vw,56px)] leading-[1.07] font-semibold tracking-[-0.005em] max-phone:text-[28px]">Unfold it.</p>
        <p className="mt-3 text-[clamp(17px,1.4vw,21px)] leading-[1.38] font-semibold text-ink-2 max-phone:mt-1 max-phone:text-[15px]">
          Six projects, a life story and a way to say hello. All inside, all yours to open.
        </p>
      </div>

      <div
        ref={bar}
        className="absolute bottom-[max(clamp(20px,5vh,56px),env(safe-area-inset-bottom))] left-1/2 z-20 flex w-[min(640px,calc(100vw-32px))] items-center justify-between gap-4 rounded-full bg-[color-mix(in_srgb,var(--page-alt)_82%,transparent)] py-3 pr-3 pl-7 backdrop-blur-xl backdrop-saturate-150 transform-[translate3d(-50%,0,0)] max-phone:pl-5"
      >
        <div className="min-w-0 animate-intro text-[14px] leading-[1.43] tracking-[-0.016em] text-ink [animation-delay:1.1s] motion-reduce:animate-none">
          <p className="truncate">
            {profile.name}
            <span className="max-phone:hidden">, {profile.title.toLowerCase()} in Addis Ababa.</span>
          </p>
          <p className="truncate text-ink-2">
            <span className="max-phone:hidden">{profile.availability}.</span>
            <span className="hidden max-phone:inline">{profile.title}, Addis Ababa</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => visit()}
          className="shrink-0 rounded-full bg-cta px-[22px] py-[11px] text-[17px] leading-none font-normal tracking-[-0.022em] text-white transition-colors hover:bg-cta-hover"
        >
          Unfold
        </button>
      </div>
    </>
  );
});

export default HeroCopy;
