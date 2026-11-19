"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { GL_TASKS, TASKS, boot, complete, loaded, report } from "@/lib/boot";
import { reducedMotion, webglAvailable } from "@/lib/env";
import { profile } from "@/content/site";

// The first load, after the hello screen an iPhone opens on: greetings in
// one language after another while everything the opening needs comes in
// (lib/boot.ts sums it, each step reporting what it's really doing). A
// drop of Liquid Glass drifts over the word and follows the pointer, a
// click says hello in the next language, and once everything is in, the
// page opens down the middle like the phone, and the device rises into it.
//
// The markup is in the server's HTML, shown by the prepaint script
// (html[data-boot]), so it covers the page from the first paint; without
// script it never shows.

const HELLOS = [
  { text: "Hello", lang: "en", name: "English" },
  { text: "ሰላም", lang: "am", name: "Amharic" },
  { text: "Bonjour", lang: "fr", name: "French" },
  { text: "Hola", lang: "es", name: "Spanish" },
  { text: "こんにちは", lang: "ja", name: "Japanese" },
  { text: "Ciao", lang: "it", name: "Italian" },
  { text: "Hallo", lang: "de", name: "German" },
  { text: "Olá", lang: "pt", name: "Portuguese" },
  { text: "안녕하세요", lang: "ko", name: "Korean" },
  { text: "Merhaba", lang: "tr", name: "Turkish" },
  { text: "Привет", lang: "ru", name: "Russian" },
  { text: "你好", lang: "zh", name: "Chinese" },
  { text: "Jambo", lang: "sw", name: "Swahili" },
  { text: "नमस्ते", lang: "hi", name: "Hindi" },
  { text: "مرحبا", lang: "ar", name: "Arabic" },
  { text: "Hej", lang: "sv", name: "Swedish" },
];

/** How long each greeting holds, in ms. */
const BEAT = 1150;
/** The loader shows at least this long (s): long enough to read as a
 *  moment, not a flash. Shorter once it's been seen this session. */
const MIN_FIRST = 2.4;
const MIN_AGAIN = 1.1;
/** Past this (s), whatever hasn't come opens without it. */
const MAX = 30;
const SEEN = "duo:booted";

/** A half of the page; once it starts to open, its edge shows. */
const PANEL = "absolute inset-y-0 bg-page in-data-open:shadow-[0_0_90px_rgba(0,0,0,0.18),0_0_0_1px_var(--rule)]";

const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const crease = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLDivElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  // The greeting on screen, the one leaving, and a count that restarts the
  // entrance even when a greeting comes round again.
  const [hello, setHello] = useState({ i: 0, prev: -1, n: 0 });
  const [gone, setGone] = useState(false);
  const next = useRef(() => {});

  useEffect(() => {
    const html = document.documentElement;
    const main = document.getElementById("main");
    const reduced = reducedMotion();
    const start = performance.now();
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN) === "1";
    } catch {}
    const min = (seen ? MIN_AGAIN : MIN_FIRST) * 1000;
    main?.setAttribute("inert", "");

    // --- What's coming in -------------------------------------------------
    complete("page");
    if (!webglAvailable()) complete(...GL_TASKS);
    if (document.fonts) document.fonts.ready.then(() => complete("fonts"), () => complete("fonts"));
    else complete("fonts");

    // The first screen's images, decoded, once the stage has put them on
    // the page. Another look afterwards catches any that arrived meanwhile.
    let alive = true;
    const settled = new WeakSet<HTMLImageElement>();
    const images = async () => {
      for (let pass = 0; pass < 3 && alive; pass++) {
        const all = [...document.images].filter((i) => i.loading !== "lazy" && !settled.has(i));
        if (!all.length) break;
        let n = 0;
        const arrive = (i: HTMLImageElement) =>
          i.complete
            ? Promise.resolve()
            : new Promise<void>((r) => {
                i.addEventListener("load", () => r(), { once: true });
                i.addEventListener("error", () => r(), { once: true });
              });
        await Promise.all(
          all.map((i) =>
            arrive(i)
              .then(() => i.decode())
              .catch(() => {})
              .finally(() => {
                settled.add(i);
                report("images", (++n / all.length) * (pass === 0 ? 0.9 : 1), `${n} of ${all.length}`);
              }),
          ),
        );
        await new Promise((r) => setTimeout(r, 200));
      }
      complete("images");
    };
    const imagesAt = window.setTimeout(() => void images(), 450);
    const hardStop = window.setTimeout(() => {
      if (!loaded()) console.warn("Loader: opening without", TASKS.filter(({ task }) => boot.get().done[task] < 1).map((t) => t.task));
      complete(...TASKS.map((t) => t.task));
    }, MAX * 1000);

    // --- The page holds still underneath -----------------------------------
    const block = (e: Event) => e.cancelable && e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => SCROLL_KEYS.has(e.key) && (e.target as Element | null)?.closest?.("button") === null && e.preventDefault();
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", blockKeys);
    const release = () => {
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", blockKeys);
    };

    // --- Greetings ----------------------------------------------------------
    let cycle = 0;
    let leaving = false;
    let shownHello = { i: 0, n: 0 };
    let lastChange = start;
    const advance = (to = (shownHello.i + 1) % HELLOS.length) => {
      const prev = shownHello.i;
      shownHello = { i: to, n: shownHello.n + 1 };
      setHello({ ...shownHello, prev });
      lastChange = performance.now();
      // The drop drifts across whichever word is up.
      requestAnimationFrame(measure);
    };
    const beat = () => {
      window.clearTimeout(cycle);
      cycle = window.setTimeout(() => {
        if (leaving) return;
        advance();
        beat();
      }, reduced ? BEAT * 1.5 : BEAT);
    };
    beat();
    next.current = () => {
      if (leaving) return;
      advance();
      beat();
    };

    // --- The glass drop -----------------------------------------------------
    // It drifts over the word on its own; a mouse takes it for as long as
    // it moves (and a moment after), a finger while it's down.
    const drop = { x: innerWidth / 2, y: innerHeight / 2, vx: 0, vy: 0, stretch: 1, angle: 0, scale: 0 };
    const aim = { x: 0, y: 0, until: 0 };
    let home = { x: innerWidth / 2, y: innerHeight / 2, w: 300, h: 120 };
    const measure = () => {
      const r = word.current?.getBoundingClientRect();
      if (r) home = { x: r.left + r.width / 2, y: r.top + r.height / 2, w: Math.max(r.width, 200), h: r.height };
    };
    measure();
    drop.x = home.x - home.w * 0.4;
    drop.y = home.y;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || e.buttons) {
        aim.x = e.clientX;
        aim.y = e.clientY;
        aim.until = performance.now() + (e.pointerType === "mouse" ? 2600 : 1600);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("resize", measure);
    const entrance = reduced ? null : gsap.to(drop, { scale: 1, duration: 1.1, delay: 0.5, ease: "back.out(1.7)" });

    // --- Progress -----------------------------------------------------------
    // Steps with no progress of their own creep toward done while they run,
    // so the bar never sits dead still; real progress overtakes the creep.
    const began: Partial<Record<string, number>> = {};
    // Picked up from wherever the bar's own creep had got to.
    let shown = 0;
    if (fill.current) {
      const t = getComputedStyle(fill.current).transform;
      shown = t && t !== "none" ? Math.min(0.05, new DOMMatrix(t).a) : 0;
      fill.current.style.animation = "none";
      fill.current.style.transform = `scaleX(${shown})`;
    }
    let lastPct = -1;
    let lastLabel = "";
    let last = start;
    let exiting = false;
    const target = (now: number) => {
      const { done } = boot.get();
      let sum = 0, current = true;
      for (const { task, weight } of TASKS) {
        let f = done[task];
        if (f < 1 && current) {
          current = false;
          began[task] ??= now;
          if (task !== "model") f = Math.max(f, 0.92 * (1 - Math.exp(-(now - began[task]!) / 1600)));
        }
        sum += weight * f;
      }
      return sum;
    };
    const label = () => {
      const { done, detail } = boot.get();
      const t = TASKS.find(({ task }) => done[task] < 1);
      if (!t) return "Ready";
      const d = detail[t.task];
      return d ? `${t.label} · ${d}` : t.label;
    };

    const frame = () => {
      const now = performance.now();
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;

      // The bar: eases toward the work done, never back.
      const all = loaded();
      const goal = all ? 1 : Math.min(0.99, target(now));
      // Once everything's in it runs home at a steady clip, rather than
      // easing the last stretch out for seconds.
      const ease = (goal - shown) * (1 - Math.exp(-dt * 3.2));
      shown = Math.min(goal, shown + Math.max(ease, all ? dt * 1.4 : 0));
      if (all && shown > 0.998) shown = 1;
      if (fill.current) fill.current.style.transform = `scaleX(${shown})`;
      const pct = Math.floor(shown * 100);
      if (pct !== lastPct) {
        lastPct = pct;
        if (percent.current) percent.current.textContent = String(pct);
        meter.current?.setAttribute("aria-valuenow", String(pct));
      }
      const l = label();
      if (l !== lastLabel && status.current) status.current.textContent = lastLabel = l;

      // The drop.
      const el = lens.current;
      if (el && !reduced) {
        const s = now / 1000;
        const mine = aim.until > now;
        const tx = mine ? aim.x : home.x + Math.sin(s * 0.62) * home.w * 0.42;
        const ty = mine ? aim.y : home.y + Math.sin(s * 0.97 + 0.8) * home.h * 0.22;
        const k = 1 - Math.exp(-dt * (mine ? 11 : 2.6));
        const nx = drop.x + (tx - drop.x) * k, ny = drop.y + (ty - drop.y) * k;
        drop.vx = (nx - drop.x) / Math.max(dt, 1e-3);
        drop.vy = (ny - drop.y) / Math.max(dt, 1e-3);
        drop.x = nx;
        drop.y = ny;
        // Moving fast, it pulls long along its path, the way a drop would.
        const speed = Math.hypot(drop.vx, drop.vy);
        const want = 1 + Math.min(0.26, speed / 3800);
        drop.stretch += (want - drop.stretch) * (1 - Math.exp(-dt * 10));
        if (speed > 30) drop.angle = Math.atan2(drop.vy, drop.vx);
        const a = (drop.angle * 180) / Math.PI;
        const sx = drop.stretch * drop.scale, sy = (drop.scale / drop.stretch) * (0.96 + 0.04 * drop.stretch);
        el.style.transform = `translate3d(${drop.x}px, ${drop.y}px, 0) translate(-50%, -50%) rotate(${a}deg) scale(${sx}, ${sy}) rotate(${-a}deg)`;
      }

      // Everything's in: the greetings come home to English, as the page
      // greets, while the bar runs out.
      if (all && !leaving) {
        leaving = true;
        window.clearTimeout(cycle);
        if (shownHello.i !== 0) advance(0);
      }
      if (all && shown === 1 && now - start >= min && now - lastChange >= 560 && !exiting) {
        exiting = true;
        void lift();
      }
    };
    gsap.ticker.add(frame);

    // --- Opening ------------------------------------------------------------
    let tl: gsap.core.Timeline | null = null;
    const lift = async () => {
      // Let the main thread go quiet first: the first frames of the
      // opening should have the machine to themselves.
      await new Promise((r) => ("requestIdleCallback" in window ? requestIdleCallback(r, { timeout: 250 }) : setTimeout(r, 60)));
      if (!alive) return;

      const reveal = () => {
        try {
          sessionStorage.setItem(SEEN, "1");
        } catch {}
        main?.removeAttribute("inert");
        html.dataset.boot = "reveal";
        release();
        boot.set({ phase: "revealing" });
      };
      const done = () => {
        delete html.dataset.boot;
        boot.set({ phase: "done" });
        setGone(true);
      };

      if (reduced) {
        reveal();
        tl = gsap.timeline({ onComplete: done }).to(root.current, { opacity: 0, duration: 0.5, ease: "power1.out" });
        return;
      }

      tl = gsap
        .timeline({ onComplete: done })
        .to(drop, { scale: 0, duration: 0.45, ease: "back.in(1.6)" }, 0)
        .to(content.current, { opacity: 0, y: -14, scale: 0.985, filter: "blur(12px)", duration: 0.6, ease: "power2.in" }, 0.05)
        // A line of light where the fold is, then the page opens along it.
        .fromTo(crease.current, { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.5, ease: "expo.out" }, 0.3)
        // The halves' inner edges catch the light as they part.
        .call(() => root.current?.setAttribute("data-open", ""), undefined, 0.6)
        .call(reveal, undefined, 0.62)
        .to(crease.current, { opacity: 0, duration: 0.3, ease: "power1.out" }, 0.62)
        .to(left.current, { xPercent: -100, rotationY: 14, duration: 1.3, ease: "expo.inOut" }, 0.6)
        .to(right.current, { xPercent: 100, rotationY: -14, duration: 1.3, ease: "expo.inOut" }, 0.6);
    };

    return () => {
      alive = false;
      gsap.ticker.remove(frame);
      entrance?.kill();
      tl?.kill();
      release();
      window.clearTimeout(cycle);
      window.clearTimeout(imagesAt);
      window.clearTimeout(hardStop);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("resize", measure);
    };
  }, []);

  if (gone) return null;

  const now = HELLOS[hello.i]!;
  const prev = hello.prev >= 0 ? HELLOS[hello.prev]! : null;
  const greeting = "col-start-1 row-start-1 flex flex-col items-center";

  return (
    <div
      ref={root}
      aria-busy="true"
      className="fixed inset-0 z-[1000] hidden overflow-hidden perspective-[1800px] select-none in-data-boot:block"
      onClick={() => next.current()}
    >
      {/* The page, in two halves that open at the fold. They overlap a
          pixel so no seam shows while they're shut. */}
      <div ref={left} className={`left-0 w-[calc(50%+1px)] origin-left ${PANEL}`} />
      <div ref={right} className={`right-0 w-1/2 origin-right ${PANEL}`} />
      <div
        ref={crease}
        aria-hidden="true"
        className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[linear-gradient(transparent,var(--ink-3)_25%,var(--ink-3)_75%,transparent)] opacity-0"
      />

      <div ref={content} className="absolute inset-0 text-ink">
        {/* Where the nav's name will be. */}
        <p
          className="absolute top-[10px] flex h-[52px] items-center font-display text-[19px] leading-none font-semibold tracking-[0.012em]"
          style={{ left: "calc((100vw - min(1024px, 100vw - 20px)) / 2 + 20px)" }}
        >
          ntz duo
        </p>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pb-[4vh]">
          <div ref={word} className="grid place-items-center">
            {prev ? (
              <div key={`out-${hello.n}`} lang={prev.lang} aria-hidden="true" className={`${greeting} animate-hello-out motion-reduce:hidden`}>
                <Word text={prev.text} />
                <Language name={prev.name} />
              </div>
            ) : null}
            <div
              key={`in-${hello.n}`}
              lang={now.lang}
              className={`${greeting} animate-hello-in motion-reduce:animate-none ${prev ? "[animation-delay:0.2s]" : ""}`}
            >
              <Word text={now.text} />
              <Language name={now.name} />
            </div>
          </div>

          {/* Progress, as an iPhone draws it while it starts up. */}
          <div
            ref={meter}
            role="progressbar"
            aria-label="Loading the phone"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            className="mt-[clamp(28px,5vh,52px)] h-[5px] w-[clamp(150px,16vw,220px)] overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--ink)_14%,transparent)]"
          >
            <div ref={fill} className="h-full origin-left animate-boot-creep rounded-full bg-ink" />
          </div>
          <p ref={status} aria-live="polite" className="mt-[14px] h-[16px] text-[12px] leading-[16px] tracking-[-0.01em] whitespace-nowrap text-ink-3 tabular-nums">
            Waking up
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 px-[clamp(20px,3vw,40px)] pb-[max(clamp(18px,3.4vh,36px),env(safe-area-inset-bottom))] max-phone:items-center">
          <p className="min-w-0 text-[12px] leading-[16px] tracking-[-0.01em] text-ink-2 max-phone:hidden">
            {profile.name}
            <br />
            <span className="text-ink-3">
              {profile.title}, {profile.location}
            </span>
          </p>
          <p className="absolute bottom-[max(clamp(18px,3.4vh,36px),env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 text-[12px] leading-[16px] tracking-[-0.01em] whitespace-nowrap text-ink-3 max-phone:static max-phone:translate-x-0">
            <span className="pointer-coarse:hidden">Click</span>
            <span className="hidden pointer-coarse:inline">Tap</span> to say hello in another language.
          </p>
          <p aria-hidden="true" className="shrink-0 font-display text-[clamp(30px,3.2vw,46px)] leading-[0.9] font-semibold tracking-[-0.02em] tabular-nums">
            <span ref={percent}>0</span>
            <span className="ml-[2px] text-[0.5em] text-ink-3">%</span>
          </p>
        </div>
      </div>

      {/* A drop of Liquid Glass (lib/glass.ts bends what's under it). A
          sibling of the copy, never inside it: the copy fades, and opacity
          on a glass element's ancestor blanks its backdrop. */}
      <div
        ref={lens}
        aria-hidden="true"
        className="glass-lens pointer-events-none absolute top-0 left-0 size-[clamp(96px,10.5vw,148px)] rounded-full [--lg-bezel:34] [--lg-depth:30] [--lg-blur:0.2] motion-reduce:hidden"
        style={{ transform: "scale(0)" }}
      />
    </div>
  );
}

function Word({ text }: { text: string }) {
  return (
    <span className="block font-display text-[clamp(60px,10.5vw,156px)] leading-[1.15] font-semibold tracking-[-0.03em] whitespace-nowrap">
      {text}
    </span>
  );
}

function Language({ name }: { name: string }) {
  return <span className="mt-[2px] block text-[13px] leading-[18px] tracking-[-0.01em] text-ink-3">{name}</span>;
}
