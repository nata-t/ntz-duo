"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { contact, profile, projects, socials } from "@/content/site";
import { openApp } from "@/lib/os";
import { scrollToStory } from "./HeroCopy";
import { MARKS, span } from "./story";

export type FooterHandle = { apply: (t: number) => void };

/** Scroll back into the live phone and open an app there. */
function launch(app: string) {
  scrollToStory(MARKS.liveIn + 0.15);
  window.setTimeout(() => openApp(app, null), 900);
}

// The page's footer, set under the phone while it stands in StandBy. It
// follows apple.com's: a quiet sign-off, a directory in small type, then
// the legal line.
const Footer = forwardRef<FooterHandle>(function Footer(_, ref) {
  const root = useRef<HTMLElement>(null);

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
  }));

  const col = "flex flex-col gap-[0.55em]";
  const head = "mb-[0.4em] font-semibold text-ink";
  const link = "text-ink-2 transition-colors hover:text-ink hover:underline";

  return (
    <footer
      ref={root}
      className="invisible absolute inset-x-0 bottom-0 z-20 opacity-0"
      aria-label="Footer"
    >
      <div className="mx-auto w-[min(980px,calc(100vw-44px))] pb-[clamp(16px,3vh,28px)]">
        <div className="mb-[clamp(18px,3vh,30px)] text-center">
          <p className="font-display text-[clamp(28px,3vw,40px)] leading-[1.1] font-semibold tracking-[0]">Thanks for stopping by.</p>
          <p className="mt-2 text-[clamp(17px,1.4vw,19px)] text-ink-2">
            Write to{" "}
            <a className="text-link hover:underline" href={contact.email.href}>
              {contact.email.label}
            </a>
            , or keep scrolling to start again.
          </p>
        </div>

        <div className="border-t border-rule pt-4 text-[12px] leading-[1.34] tracking-[-0.01em]">
          <nav aria-label="Directory" className="grid grid-cols-2 gap-x-5 gap-y-5 max-phone:grid-cols-2 sm:grid-cols-4">
            <div className={col}>
              <h3 className={head}>Work</h3>
              {projects.map((p) => (
                <button key={p.slug} type="button" className={`${link} text-left`} onClick={() => launch(p.slug)}>
                  {p.short}
                </button>
              ))}
            </div>
            <div className={col}>
              <h3 className={head}>About</h3>
              <button type="button" className={`${link} text-left`} onClick={() => launch("about")}>
                About Natnael
              </button>
              <button type="button" className={`${link} text-left`} onClick={() => launch("photos")}>
                Photos
              </button>
              <a className={link} href={profile.cv.href} target="_blank" rel="noreferrer">
                Curriculum vitae (PDF)
              </a>
            </div>
            <div className={col}>
              <h3 className={head}>Contact</h3>
              <a className={link} href={contact.email.href}>
                Email
              </a>
              <button type="button" className={`${link} text-left`} onClick={() => launch("contact")}>
                Send a message
              </button>
              <span className="text-ink-2">{profile.location}</span>
            </div>
            <div className={col}>
              <h3 className={head}>Elsewhere</h3>
              {socials.map((s) => (
                <a key={s.href} className={link} href={s.href} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              ))}
            </div>
          </nav>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3 text-ink-3">
            <p>Copyright © {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
            <p>Made in Addis Ababa. Not affiliated with Apple.</p>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
