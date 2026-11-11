"use client";

import { useRef, type ReactNode } from "react";
import { contact as reach, experience, profile, projects, skills, socials } from "@/content/site";
import { openApp } from "@/lib/os";
import type { AppProps } from "../types";
import {
  ArrowUp,
  DetailPage,
  DocDown,
  Envelope,
  Eyebrow,
  Headline,
  Lockup,
  More,
  Pill,
  Section,
  SWELL,
  Tile,
  heroType,
  lift,
  reducedMotion,
  reveal,
  usePage,
  useScroll,
} from "./kit";

// About: an apple.com product page where the product is Natnael. Hero with
// the portrait as the product shot, the highlights bento, the story, a
// timeline, tech specs, education and a closing call to action.

const contact = () => openApp("contact", null);

const education = profile.education;

export default function About(props: AppProps) {
  return (
    <DetailPage
      app={props}
      title={profile.name}
      cta={{ label: "Get in touch", onClick: contact }}
      primary={{ label: "Get in touch", icon: <Envelope />, onClick: contact }}
      group={[
        { label: profile.cv.label, icon: <DocDown />, href: profile.cv.href, external: true },
        {
          label: "Back to top",
          icon: <ArrowUp />,
          onClick: (page) => page?.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" }),
        },
      ]}
    >
      <div data-still={props.mirror || undefined}>
        <Hero height={props.height} />
        <Highlights />
        <Story />
        <Experience />
        <Specs />
        <Education />
        <Closing />
        <Footer />
      </div>
    </DetailPage>
  );
}

/* ---------- Hero ---------- */

function Hero({ height }: { height: number }) {
  const { compact, bars, padL, padR } = usePage();
  const shot = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);

  // The portrait sinks slower than the page and settles back a touch,
  // while the copy drifts and fades: Apple's product-hero parallax.
  useScroll((y) => {
    const p = Math.min(1, y / height);
    if (shot.current) shot.current.style.transform = `translate3d(0, ${y * 0.28}px, 0) scale(${1 - p * 0.06})`;
    if (copy.current) {
      copy.current.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
      copy.current.style.opacity = String(Math.max(0, 1 - p * 1.7));
    }
  }, !reducedMotion());

  const portrait = (
    <div ref={shot} className="absolute inset-0 origin-bottom will-change-transform">
      <div {...reveal(compact ? 2 : 1)} className="absolute inset-0">
        {/* A soft studio light behind the subject. */}
        <div
          className="absolute left-1/2 aspect-square -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,#d6dff0_0%,#e8edf6_45%,rgba(245,247,251,0)_100%)] top-[-8%] w-[125%] dark:bg-[radial-gradient(closest-side,#232c3f_0%,#141925_50%,rgba(0,0,0,0)_100%)]"
        />
        {/* The studio portrait, cut out of its white: the shoulders run off
            the frame, so those edges dissolve and he stands in the light
            rather than on a card. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size cut-out, already webp */}
        <img
          src={profile.portrait.cutout}
          alt={`Portrait of ${profile.name}`}
          draggable={false}
          className="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 mask-[linear-gradient(90deg,transparent_0%,#000_14%,#000_86%,transparent_100%),linear-gradient(180deg,#000_64%,transparent_98%)] mask-intersect select-none"
        />
      </div>
    </div>
  );

  if (compact)
    return (
      <header className="relative overflow-hidden bg-page" style={{ height }}>
        <div ref={copy} className="absolute inset-x-0 top-[68px] text-center" style={{ paddingLeft: padL, paddingRight: padR }}>
          <Eyebrow i={0}>{profile.name}</Eyebrow>
          <h1 {...reveal(1)} className={`mt-[8px] ${heroType(true)}`}>
            Front to back.
          </h1>
        </div>
        <div className="absolute bottom-0" style={{ left: padL - 10, right: padR - 10, top: 196 }}>
          {portrait}
        </div>
        <div className="absolute mx-auto max-w-[480px]" style={{ left: padL - 12, right: padR - 12, bottom: bars ? 92 : 26 }}>
          <Platter compact />
        </div>
      </header>
    );

  // Full width: copy on the left, the portrait standing on the right.
  const shotW = (height - 64) * (1136 / 1385);
  return (
    <header className="relative overflow-hidden bg-page" style={{ height }}>
      <div className="absolute bottom-0" style={{ right: padR - 36, width: shotW, top: 64 }}>
        {portrait}
      </div>
      <div className="absolute top-1/2 -translate-y-1/2" style={{ left: padL }}>
        <div ref={copy} className="max-w-[380px]">
          <Eyebrow i={0}>{profile.name}</Eyebrow>
          <h1 {...reveal(1)} className="mt-[12px] font-display text-[76px] leading-[0.98] font-semibold tracking-[-0.032em]">
            Front to
            <br />
            back.
          </h1>
          <Lockup i={2} className="mt-[22px] max-w-[330px]">
            <strong>{profile.title}</strong> in {profile.location.split(",")[0]}, working in TypeScript and Go — from the
            interface in Figma to the <strong>APIs and servers</strong> behind it.
          </Lockup>
          <div {...reveal(3)} className="mt-[26px] flex items-center gap-[18px]">
            <Pill small onClick={contact}>
              Get in touch
            </Pill>
            <More href={profile.cv.href} external className="text-[15px]">
              Download CV
            </More>
          </div>
        </div>
      </div>
    </header>
  );
}

/** apple.com's glass price platter, carrying the one-line pitch. */
function Platter({ compact }: { compact?: boolean }) {
  return (
    <div {...reveal(3)} className="glass flex items-center justify-between gap-[12px] rounded-full py-[8px] pr-[8px] pl-[20px]">
      <p className={`min-w-0 leading-[1.3] ${compact ? "text-[12px]" : "text-[13px]"}`}>
        <span className="block truncate font-semibold">
          {profile.title} · {profile.location.split(",")[0]}
        </span>
        {/* Narrow platters keep the clause before the comma. */}
        <span className="block truncate text-ink-2">{compact ? profile.availability.split(",")[0] : profile.availability}</span>
      </p>
      <Pill small onClick={contact}>
        Get in touch
      </Pill>
    </div>
  );
}

/* ---------- Highlights bento ---------- */

const voice = projects.find((p) => p.slug === "atm-voice-guidance")!;
const branch = projects.find((p) => p.slug === "cbe-smart-branch")!;
const now = experience[0]!;

function Highlights() {
  const { compact } = usePage();
  const label = "text-[13px] font-semibold text-ink-2";
  const cap = compact ? "text-[13px] leading-[1.38]" : "text-[14px] leading-[1.4]";
  const stat = "font-display font-semibold tracking-[-0.02em]";

  return (
    <Section tone="alt">
      <div className="flex items-end justify-between gap-[16px]">
        <Headline>Get the highlights.</Headline>
        {compact ? null : (
          <div {...reveal(1)} className="pb-[6px] text-[15px]">
            <More href={profile.cv.href} external>
              Download CV
            </More>
          </div>
        )}
      </div>

      <div className={`mt-[30px] grid gap-[12px] ${compact ? "grid-cols-2" : "grid-cols-4"}`}>
        {/* 39 banks: the voice tile, with a waveform that breathes. */}
        <Tile i={1} className={`col-span-2 flex flex-col ${compact ? "min-h-[300px]" : "row-span-2"}`}>
          <p className={label}>{voice.name}</p>
          <p className={`${stat} mt-[10px] flex items-baseline gap-[10px]`}>
            <Gradient className={compact ? "text-[84px] leading-[0.9]" : "text-[112px] leading-[0.88]"}>
              {voice.facts[0]!.value}
            </Gradient>
            <span className={compact ? "text-[26px]" : "text-[32px]"}>banks.</span>
          </p>
          <p className={`mt-[14px] max-w-[300px] text-ink-2 ${cap}`}>
            <span className="text-ink">ATMs that speak.</span> A voice layer that lets visually impaired customers use an ATM on their own.
          </p>
          <Wave className="mt-auto" />
        </Tile>

        <Tile i={2} className="min-h-[184px]">
          <p className={label}>Smart Branch</p>
          <p className={`${stat} mt-[8px] ${compact ? "text-[40px]" : "text-[48px]"} leading-none`}>
            {branch.facts[0]!.value}
            <span className="px-[6px] text-ink-3">+</span>
            {branch.facts[1]!.value.replace("+", "")}
          </p>
          <p className={`mt-[12px] text-ink-2 ${cap}`}>
            CBE smart branches, plus the head office, on one visit system.
          </p>
        </Tile>

        <Tile i={3} className="min-h-[184px]">
          <p className={label}>Languages</p>
          <p className={`${stat} mt-[10px] ${compact ? "text-[24px]" : "text-[26px]"} leading-[1.08]`}>
            TypeScript
            <br />
            <span className="text-ink-3">&amp;</span> Go
          </p>
          <p className={`mt-[10px] text-ink-2 ${cap}`}>From the interface to the API.</p>
        </Tile>

        <Tile i={2} className="min-h-[184px]">
          <p className={label}>Now</p>
          <p className={`${stat} mt-[10px] ${compact ? "text-[23px]" : "text-[26px]"} leading-[1.1]`}>{now.company}</p>
          <p className={`mt-[10px] text-ink-2 ${cap}`}>
            {now.title} since {month(now.start)}.
          </p>
        </Tile>

        <Tile i={3} className="min-h-[184px]">
          <p className={label}>Based in</p>
          <p className={`${stat} mt-[10px] ${compact ? "text-[23px]" : "text-[26px]"} leading-[1.1]`}>Addis Ababa</p>
          <p className={`mt-[10px] text-ink-2 ${cap}`}>
            Ethiopia · {profile.utcOffset}
          </p>
        </Tile>

        <Tile i={1} className={`col-span-2 ${compact ? "" : "col-span-4"} flex ${compact ? "flex-col gap-[14px]" : "items-center justify-between"}`}>
          <div className="flex items-start gap-[14px]">
            <span className="relative mt-[9px] size-[10px] shrink-0 rounded-full bg-green shadow-[0_0_0_4px_color-mix(in_srgb,var(--green)_22%,transparent)]" />
            <div>
              <p className={`${stat} ${compact ? "text-[22px]" : "text-[26px]"} leading-[1.15]`}>Open to full-time roles.</p>
              <p className={`mt-[4px] text-ink-2 ${compact ? "text-[15px]" : "text-[17px]"}`}>Remote or relocation.</p>
            </div>
          </div>
          <div className={`flex gap-[22px] text-[15px] ${compact ? "pl-[24px]" : ""}`}>
            <More onClick={contact}>Get in touch</More>
          </div>
        </Tile>
      </div>
    </Section>
  );
}

function Gradient({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`bg-[linear-gradient(105deg,#0071e3_10%,#6e5bff_60%,#b44bd8_100%)] bg-clip-text text-transparent dark:bg-[linear-gradient(105deg,#2997ff_10%,#8f7dff_60%,#d06cf0_100%)] ${className}`}
    >
      {children}
    </span>
  );
}

// Bar heights for a speech-like envelope.
const WAVE = [0.35, 0.6, 0.45, 0.8, 1, 0.7, 0.9, 0.55, 0.75, 0.4, 0.65, 0.95, 0.6, 0.8, 0.45, 0.7, 0.5, 0.85, 0.6, 0.4, 0.7, 0.5, 0.3, 0.45];

function Wave({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex h-[64px] w-full items-center justify-between ${className}`}>
      {WAVE.map((h, i) => (
        <span
          key={i}
          className="w-[5px] origin-center animate-wave rounded-full bg-[linear-gradient(180deg,#0071e3,#6e5bff)] [animation-delay:calc(var(--i)*-0.13s)] in-data-still:animate-none motion-reduce:animate-none dark:bg-[linear-gradient(180deg,#2997ff,#8f7dff)]"
          style={{ height: `${h * 100}%`, "--i": i } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ---------- Story ---------- */

function Story() {
  const { compact } = usePage();
  return (
    <Section>
      <Eyebrow>Introduction</Eyebrow>
      <p
        {...reveal(1)}
        className={`mt-[14px] font-display font-semibold ${
          compact ? "text-[27px] leading-[1.14] tracking-[-0.012em]" : "text-[40px] leading-[1.1] tracking-[-0.02em]"
        }`}
      >
        {profile.statement}
      </p>
      <div className={`mt-[30px] grid ${compact ? "gap-[16px]" : "grid-cols-2 gap-[40px]"}`}>
        <Lockup i={2}>
          {emphasize(profile.bio[0]!, ["TypeScript and Go", "designing the interface in Figma, building it, and wiring it"])}
        </Lockup>
        <Lockup i={compact ? 2 : 3}>
          {emphasize(profile.bio[1]!, ["Commercial Bank of Ethiopia", "voice guidance on ATMs across 39 banks", "Ethiopian Shipping & Logistics"])}
        </Lockup>
      </div>
    </Section>
  );
}

/** Wraps the phrases that occur in `text` in <strong>. */
function emphasize(text: string, phrases: string[]) {
  const out: ReactNode[] = [];
  let rest = text;
  for (;;) {
    let at = -1;
    let hit = "";
    for (const p of phrases) {
      const i = rest.indexOf(p);
      if (i >= 0 && (at < 0 || i < at)) [at, hit] = [i, p];
    }
    if (at < 0) break;
    out.push(rest.slice(0, at), <strong key={out.length}>{hit}</strong>);
    rest = rest.slice(at + hit.length);
  }
  out.push(rest);
  return out;
}

/* ---------- Experience ---------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const month = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
};

function Experience() {
  const { compact } = usePage();
  const first = experience[experience.length - 1]!;
  const head = (
    <div className={compact ? "" : "sticky top-[112px] self-start"}>
      <Eyebrow>Experience</Eyebrow>
      <Headline i={1} className="mt-[10px]">
        The road
        <br />
        so far.
      </Headline>
      <Lockup i={2} className="mt-[16px] max-w-[300px]">
        From a burger chain&rsquo;s ERP to <strong>systems inside Ethiopia&rsquo;s banks</strong>, since {first.start.slice(0, 4)}.
      </Lockup>
    </div>
  );
  return (
    <Section tone="alt">
      <div className={compact ? "" : "grid grid-cols-[0.85fr_1.15fr] gap-[48px]"}>
        {head}
        <ol className={compact ? "mt-[34px]" : "pt-[6px]"}>
          {experience.map((r, i) => {
            const current = r.end === null;
            const last = i === experience.length - 1;
            return (
              <li key={r.company} {...reveal(i + 1)} className={`relative pl-[30px] ${last ? "" : "pb-[34px]"}`}>
                {last ? null : <span className="absolute top-[18px] bottom-[-2px] left-[5px] w-px bg-rule" />}
                <span
                  className={`absolute top-[5px] left-0 size-[11px] rounded-full ${current ? "bg-blue after:absolute after:-inset-[5px] after:animate-beacon after:rounded-[999px] after:border-[1.5px] after:border-blue in-data-still:after:animate-none motion-reduce:after:animate-none" : "border-[1.5px] border-ink-3 bg-page-alt"}`}
                />
                <p className="text-[12px] leading-[1.33] text-ink-2">
                  {month(r.start)} – {r.end ? month(r.end) : "Present"}
                </p>
                <h3 className={`mt-[4px] font-display font-semibold tracking-[-0.012em] ${compact ? "text-[20px]" : "text-[22px]"}`}>
                  {r.company}
                </h3>
                <p className="mt-[1px] text-[14px] text-ink-2">{r.title}</p>
                <p className={`mt-[10px] text-ink ${compact ? "text-[14px] leading-[1.45]" : "text-[15px] leading-[1.47]"}`}>{r.summary}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}

/* ---------- Tech specs ---------- */

function Specs() {
  const { compact } = usePage();
  return (
    <Section>
      <Eyebrow>Skills</Eyebrow>
      <Headline i={1} className="mt-[10px]">
        Tech specs.
      </Headline>
      <dl className="mt-[30px] border-b border-rule">
        {skills.map((g, i) => (
          <div
            key={g.group}
            {...reveal(Math.min(i, 3))}
            className={`border-t border-rule ${compact ? "py-[18px]" : "grid grid-cols-[180px_1fr] gap-[24px] py-[22px]"}`}
          >
            <dt className="font-display text-[17px] font-semibold tracking-[-0.005em]">
              {g.group}
              <span className="ml-[8px] text-[13px] font-normal text-ink-3 tabular-nums">{g.items.length}</span>
            </dt>
            <dd className={`flex flex-wrap gap-[8px] ${compact ? "mt-[12px]" : ""}`}>
              {g.items.map((s) => (
                <span key={s} className="rounded-full bg-page-alt px-[12px] py-[6px] text-[13px] leading-none tracking-[-0.01em]">
                  {s}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/* ---------- Education ---------- */

function Education() {
  const { compact } = usePage();
  return (
    <Section tone="alt">
      <Eyebrow>Education</Eyebrow>
      <Headline i={1} className="mt-[10px]">
        Schooled in the fundamentals.
      </Headline>
      <Tile i={2} className={`mt-[30px] ${compact ? "" : "p-[36px]"}`}>
        <p className="text-[13px] font-semibold text-ink-2">{education.years}</p>
        <p className={`mt-[8px] font-display font-semibold tracking-[-0.016em] ${compact ? "text-[24px]" : "text-[30px]"} leading-[1.1]`}>
          {education.school}
        </p>
        <p className={`mt-[6px] text-ink-2 ${compact ? "text-[15px]" : "text-[17px]"}`}>{education.degree}</p>
      </Tile>
    </Section>
  );
}

/* ---------- Closing ---------- */

function Closing() {
  const { compact } = usePage();
  return (
    <Section innerClassName="text-center">
      <h2 {...reveal(0)} className={heroType(compact)}>
        Let&rsquo;s build
        <br />
        what&rsquo;s next.
      </h2>
      <Lockup i={1} className="mx-auto mt-[18px] max-w-[440px]">
        <strong>{profile.availability}.</strong> Based in {profile.location}.
      </Lockup>
      <ContactCard />
    </Section>
  );
}

/* ---------- Contact card ---------- */

const linkedin = socials.find((s) => s.label === "LinkedIn")!;
const telegram = socials.find((s) => s.label === "Telegram")!;

/** iOS 26's Contacts card: a contact poster (the cut-out in front of his
 *  name), and under it four equal glass tiles for the ways to reach him. */
function ContactCard() {
  const { compact } = usePage();
  const actions: { label: string; title: string; href: string; external?: boolean; icon: ReactNode }[] = [
    { label: "message", title: `Message on Telegram (${telegram.handle})`, href: telegram.href, external: true, icon: <Bubble /> },
    { label: "mail", title: `Email ${reach.email.label}`, href: reach.email.href, icon: <Envelope size={21} /> },
    { label: "connect", title: `LinkedIn (${linkedin.handle})`, href: linkedin.href, external: true, icon: <LinkedIn /> },
    { label: "résumé", title: profile.cv.label, href: profile.cv.href, external: true, icon: <DocDown size={21} /> },
  ];
  return (
    <div {...lift(2)} className={`mx-auto mt-[34px] text-left ${compact ? "max-w-[360px]" : "max-w-[400px]"}`}>
      <div
        className={`relative isolate overflow-hidden rounded-[34px] bg-[linear-gradient(170deg,#9fb6d8_0%,#6f86b4_48%,#3a4a72_100%)] dark:bg-[linear-gradient(170deg,#3b4c6e_0%,#253352_50%,#121a2c_100%)] ${
          compact ? "h-[420px]" : "h-[460px]"
        }`}
      >
        {/* The poster's name sits behind the subject, as iOS sets it. */}
        <p
          aria-hidden="true"
          className={`absolute inset-x-0 text-center font-display leading-[0.92] font-bold tracking-[-0.03em] text-white/95 ${
            compact ? "top-[30px] text-[52px]" : "top-[32px] text-[58px]"
          }`}
        >
          {profile.name.split(" ")[0]}
          <br />
          <span className="text-white/80">{profile.name.split(" ").slice(1).join(" ")}</span>
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- the same cut-out as the hero */}
        <img
          src={profile.portrait.source}
          alt=""
          draggable={false}
          className="absolute bottom-0 left-1/2 h-[77%] w-auto max-w-none -translate-x-1/2 mask-[linear-gradient(90deg,transparent_2%,#000_22%,#000_78%,transparent_98%)] select-none"
        />
        {/* Media under clear glass gets a dim, so white glyphs hold up. */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[46%] bg-[linear-gradient(to_top,rgba(0,0,0,0.5),rgba(0,0,0,0.18)_55%,transparent)]" />

        <div className="absolute inset-x-[16px] bottom-[16px]">
          <p className="text-center text-[13px] font-medium text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">
            {profile.title} · {profile.location.split(",")[0]}
          </p>
          <div className="mt-[12px] grid grid-cols-4 gap-[8px]">
            {actions.map((a) => (
              <a
                key={a.label}
                href={a.href}
                target={a.external ? "_blank" : undefined}
                rel={a.external ? "noopener noreferrer" : undefined}
                title={a.title}
                aria-label={a.title}
                className={`glass-clear flex h-[60px] flex-col items-center justify-center gap-[4px] rounded-[20px] text-white ${SWELL}`}
              >
                <span className="grid h-[22px] place-items-center">{a.icon}</span>
                <span className="text-[11.5px] leading-none font-medium tracking-[0.005em]">{a.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 3.5c-5 0-9 3.4-9 7.7 0 2.4 1.3 4.6 3.4 6-.2 1.2-.8 2.4-1.8 3.3 1.9 0 3.6-.7 4.8-1.8.8.2 1.7.3 2.6.3 5 0 9-3.4 9-7.8s-4-7.7-9-7.7" />
    </svg>
  );
}

function LinkedIn() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <circle cx="5.6" cy="5.4" r="2" />
      <rect x="3.9" y="8.6" width="3.4" height="11.4" rx="0.4" />
      <path d="M10 8.6h3.2v1.6c.5-.9 1.7-1.9 3.5-1.9 3.4 0 4 2.2 4 5.1V20h-3.4v-5.8c0-1.4 0-3.1-1.9-3.1s-2.1 1.5-2.1 3V20H10z" />
    </svg>
  );
}

function Footer() {
  const { padL, padR, compact } = usePage();
  return (
    <footer className="bg-page-alt" style={{ paddingLeft: padL, paddingRight: padR }}>
      <div className={`flex border-rule py-[18px] pb-[40px] text-[11px] leading-[1.33] tracking-[-0.01em] text-ink-2 ${compact ? "flex-col gap-[4px]" : "justify-between"}`}>
        <span>
          {profile.name} · {profile.title}
        </span>
        <span>
          {profile.location} · {profile.utcOffset}
        </span>
      </div>
    </footer>
  );
}
