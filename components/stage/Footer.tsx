"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { contact, profile, projects, socials } from "@/content/site";
import { visit } from "./navigate";
import { MARKS, span } from "./story";

export type FooterHandle = {
  apply: (t: number) => void;
  /** Where the footer's content starts, in px from the top of the window. */
  top: () => number;
};

// The page's footer, set under the phone while it stands in StandBy. It
// follows apple.com's: a quiet sign-off, a directory in small type, then
// the legal line. On phones the directory folds into one line per section,
// and the stage stands the phone in whatever room is left above it.
const Footer = forwardRef<FooterHandle>(function Footer(_, ref) {
  const root = useRef<HTMLElement>(null);
  const height = useRef(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => (height.current = el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    apply(t) {
      const el = root.current;
      if (!el) return;
      const v = span(t, MARKS.standbyIn - 0.45, MARKS.standbyIn + 0.1) * (1 - span(t, MARKS.standbyOut + 0.05, MARKS.standbyOut + 0.6));
      el.style.opacity = String(v);
      el.style.transform = `translate3d(0, ${(1 - v) * 40}px, 0)`;
      el.style.visibility = v < 0.01 ? "hidden" : "visible";
      el.style.pointerEvents = v > 0.6 ? "auto" : "none";
    },
    top: () => (root.current?.parentElement?.clientHeight ?? window.innerHeight) - height.current,
  }));

  // A section: heading over its links; on phones, heading beside them.
  const col = "flex flex-col gap-[0.55em] max-phone:flex-row max-phone:gap-3";
  const head = "mb-[0.4em] font-semibold text-ink max-phone:mb-0 max-phone:w-[68px] max-phone:shrink-0";
  const links = "flex flex-col gap-[0.55em] max-phone:min-w-0 max-phone:flex-row max-phone:flex-wrap max-phone:gap-x-[14px] max-phone:gap-y-[6px]";
  const link = "text-ink-2 transition-colors hover:text-ink hover:underline";

  return (
    <footer
      ref={root}
      className="invisible absolute inset-x-0 bottom-0 z-20 opacity-0"
      aria-label="Footer"
    >
      <div className="mx-auto w-[min(980px,calc(100vw-44px))] pb-[max(clamp(16px,3vh,28px),env(safe-area-inset-bottom))] max-phone:w-[calc(100vw-40px)]">
        <div className="mb-[clamp(18px,3vh,30px)] text-center max-phone:mb-4">
          <p className="font-display text-[clamp(28px,3vw,40px)] leading-[1.1] font-semibold tracking-[0] max-phone:text-[26px]">Thanks for stopping by.</p>
          <p className="mt-2 text-[clamp(17px,1.4vw,19px)] text-ink-2 max-phone:mt-1 max-phone:text-[15px] max-phone:leading-[1.4]">
            Write to{" "}
            <a className="text-link hover:underline" href={contact.email.href}>
              {contact.email.label}
            </a>
            , or keep scrolling to start again.
          </p>
        </div>

        <div className="border-t border-rule pt-4 text-[12px] leading-[1.34] tracking-[-0.01em] max-phone:pt-3 max-phone:text-[13px]">
          <nav aria-label="Directory" className="grid grid-cols-2 gap-x-5 gap-y-5 max-phone:grid-cols-1 max-phone:gap-y-[10px] sm:grid-cols-4">
            <div className={col}>
              <h3 className={head}>Work</h3>
              <div className={links}>
                {projects.map((p) => (
                  <button key={p.slug} type="button" className={`${link} text-left`} onClick={() => visit(p.slug)}>
                    {p.short}
                  </button>
                ))}
              </div>
            </div>
            <div className={col}>
              <h3 className={head}>About</h3>
              <div className={links}>
                <button type="button" className={`${link} text-left`} onClick={() => visit("about")}>
                  About Natnael
                </button>
                <button type="button" className={`${link} text-left`} onClick={() => visit("photos")}>
                  Photos
                </button>
                <a className={link} href={profile.cv.href} target="_blank" rel="noreferrer">
                  Curriculum vitae (PDF)
                </a>
              </div>
            </div>
            <div className={col}>
              <h3 className={head}>Contact</h3>
              <div className={links}>
                <a className={link} href={contact.email.href}>
                  Email
                </a>
                <button type="button" className={`${link} text-left`} onClick={() => visit("contact")}>
                  Send a message
                </button>
                <span className="text-ink-2">{profile.location}</span>
              </div>
            </div>
            <div className={col}>
              <h3 className={head}>Elsewhere</h3>
              <div className={links}>
                {socials.map((s) => (
                  <a key={s.href} className={link} href={s.href} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </nav>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3 text-ink-3 max-phone:mt-3 max-phone:gap-1 max-phone:text-[12px]">
            <p>Copyright © {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
            <p>Made in Addis Ababa. Not affiliated with Apple.</p>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
