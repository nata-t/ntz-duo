"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { contact, profile, socials } from "@/content/site";
import type { AppProps } from "../types";
import {
  Compose,
  DetailPage,
  DocDown,
  Envelope,
  Eyebrow,
  Headline,
  Lockup,
  More,
  Pill,
  Section,
  Tile,
  reveal,
  scrollToEl,
  usePage,
} from "../about/kit";
import Composer from "./Composer";
import { DocIcon, GitHubIcon, LinkedInIcon, MailIcon, TelegramIcon } from "./icons";
import css from "./Contact.module.css";

// Contact: the same apple.com detail page as About. A short hero with a
// Messages exchange, a tile for every channel (with Addis Ababa's time), and
// a Mail compose sheet that hands off to the visitor's own mail app.

const social = (label: string) => socials.find((s) => s.label === label)!;

export default function Contact(props: AppProps) {
  const composer = useRef<HTMLElement>(null);
  const body = useRef<HTMLTextAreaElement>(null);

  // Scroll to the sheet, then put the caret in the message.
  const write = (page: HTMLElement | null) => {
    scrollToEl(page, composer.current);
    window.setTimeout(() => body.current?.focus({ preventScroll: true }), 450);
  };

  return (
    <DetailPage
      app={props}
      title="Contact"
      navAfter={props.width < 600 ? 420 : 360}
      cta={{ label: "Write", onClick: write }}
      primary={{ label: "New Message", icon: <Compose />, onClick: write }}
      group={[
        { label: "Email", icon: <Envelope />, href: contact.email.href },
        { label: profile.cv.label, icon: <DocDown />, href: profile.cv.href, external: true },
      ]}
    >
      <div className={props.mirror ? css.still : undefined}>
        <Hero onWrite={write} />
        <Channels live={!props.mirror} />
        <Write sref={composer} body={body} />
        <Footer />
      </div>
    </DetailPage>
  );
}

/* ---------- Hero ---------- */

function Hero({ onWrite }: { onWrite: (page: HTMLElement | null) => void }) {
  const { compact, padL, padR, scroller } = usePage();
  const copy = (
    <>
      <Eyebrow i={0}>Contact</Eyebrow>
      <h1
        {...reveal(1)}
        className={`font-display font-semibold ${
          compact ? "mt-[8px] text-[48px] leading-[1.04] tracking-[-0.028em]" : "mt-[12px] text-[76px] leading-[0.98] tracking-[-0.032em]"
        }`}
      >
        Say hello.
      </h1>
      <Lockup i={2} className={compact ? "mx-auto mt-[14px] max-w-[330px]" : "mt-[20px] max-w-[340px]"}>
        <strong>I&rsquo;ll say it back.</strong> {profile.availability}, from {profile.location.split(",")[0]} at {profile.utcOffset}.
      </Lockup>
      <div {...reveal(3)} className={`mt-[24px] flex items-center gap-[18px] ${compact ? "justify-center" : ""}`}>
        <Pill small onClick={() => onWrite(scroller.current)}>
          Write a message
        </Pill>
        <More href={contact.email.href} className="text-[15px]">
          Email
        </More>
      </div>
    </>
  );

  if (compact)
    return (
      <header className="bg-page text-center" style={{ paddingLeft: padL, paddingRight: padR, paddingTop: 78, paddingBottom: 56 }}>
        {copy}
        <Thread className="mx-auto mt-[40px] max-w-[320px]" />
      </header>
    );

  return (
    <header className="bg-page" style={{ paddingLeft: padL, paddingRight: padR }}>
      <div className="grid min-h-[570px] grid-cols-[1fr_1fr] items-center gap-[36px] pt-[56px] pb-[40px]">
        <div>{copy}</div>
        <Thread />
      </div>
    </header>
  );
}

/** A Messages exchange, standing in for the product shot. */
function Thread({ className = "" }: { className?: string }) {
  const { compact } = usePage();
  const bubble = `relative max-w-[86%] rounded-[19px] px-[13px] py-[8px] ${compact ? "text-[14px]" : "text-[15px]"} leading-[1.35] tracking-[-0.016em]`;
  return (
    <div className={`relative ${className}`}>
      {/* The same soft light that stands behind the portrait in About. */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 aspect-square w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,#dbe5f6_0%,#edf1f8_50%,rgba(255,255,255,0)_100%)] dark:bg-[radial-gradient(closest-side,#1d2638_0%,#121722_50%,rgba(0,0,0,0)_100%)]"
      />
      <div className="relative flex flex-col gap-[6px] text-left font-sans" aria-label="An example conversation" role="img">
        <p {...reveal(1)} className="mb-[6px] text-center text-[11px] text-ink-3">
          <span className="font-semibold">iMessage</span> · Today
        </p>
        <p {...reveal(2)} className={`${bubble} self-end rounded-br-[6px] bg-[#0a84ff] text-white`}>
          Hi Natnael! Are you open to new roles?
        </p>
        <p {...reveal(3)} className="-mt-[2px] self-end pr-[4px] text-[10.5px] text-ink-3">
          Delivered
        </p>
        <p {...reveal(4)} className={`${bubble} self-start rounded-bl-[6px] bg-[#e9e9eb] text-black dark:bg-[#26252a] dark:text-white`}>
          Hello, hello. Yes: {profile.availability.replace(/^Open to /, "").toLowerCase()}.
        </p>
        <p {...reveal(5)} className={`${bubble} self-start rounded-bl-[6px] bg-[#e9e9eb] text-black dark:bg-[#26252a] dark:text-white`}>
          What are we building?
        </p>
        <div {...reveal(6)} className={`${css.typing} mt-[2px] flex h-[34px] w-[58px] items-center justify-center gap-[4px] self-start rounded-[17px] bg-[#e9e9eb] dark:bg-[#26252a]`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-[7px] rounded-full bg-[#8e8e93]" style={{ "--i": i } as React.CSSProperties} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Channels ---------- */

function Channels({ live }: { live: boolean }) {
  const { compact } = usePage();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  const name = `font-display font-semibold tracking-[-0.014em] ${compact ? "text-[19px]" : "text-[21px]"} leading-[1.15]`;
  const sub = "mt-[3px] text-[14px] text-ink-2";
  const link = `mt-auto pt-[18px] ${compact ? "text-[14px]" : "text-[15px]"}`;
  const li = social("LinkedIn"), gh = social("GitHub"), tg = social("Telegram");

  return (
    <Section tone="alt">
      <Headline>Pick a channel.</Headline>
      <div className={`mt-[30px] grid gap-[12px] ${compact ? "grid-cols-2" : "grid-cols-3"}`}>
        <Tile i={1} className="col-span-2 flex min-h-[200px] flex-col">
          <div className="flex items-start justify-between gap-[12px]">
            <MailIcon size={compact ? 44 : 52} />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(contact.email.label).then(() => setCopied(true), () => {});
              }}
              className={`h-[30px] rounded-full bg-page-alt px-[14px] text-[13px] text-ink transition-colors hover:bg-rule ${css.press}`}
              aria-live="polite"
            >
              {copied ? "Copied" : "Copy address"}
            </button>
          </div>
          <p className="mt-[18px] text-[13px] font-semibold text-ink-2">Email</p>
          <p className={`mt-[4px] font-display font-semibold tracking-[-0.018em] break-all ${compact ? "text-[21px]" : "text-[28px]"} leading-[1.15]`}>
            {contact.email.label}
          </p>
          <p className={link}>
            <More href={contact.email.href}>Write an email</More>
          </p>
        </Tile>

        <Tile i={2} className={`flex flex-col items-center text-center ${compact ? "col-span-2" : "row-span-2"}`}>
          <TimeCard live={live} />
        </Tile>

        <ChannelTile i={1} icon={<LinkedInIcon size={44} />} label={li.label} handle={li.handle} href={li.href} cta="Connect" name={name} sub={sub} link={link} />
        <ChannelTile i={2} icon={<GitHubIcon size={44} />} label={gh.label} handle={gh.handle} href={gh.href} cta="See the code" name={name} sub={sub} link={link} />
        <ChannelTile i={compact ? 1 : 3} icon={<TelegramIcon size={44} />} label={tg.label} handle={tg.handle} href={tg.href} cta="Send a message" name={name} sub={sub} link={link} />

        <Tile i={compact ? 2 : 4} className={`flex min-h-[184px] flex-col ${compact ? "" : "col-span-2"}`}>
          <DocIcon size={44} />
          <p className={`mt-[16px] ${name}`}>Résumé</p>
          <p className={sub}>A PDF to keep, or the same online.</p>
          <p className={`${link} flex flex-wrap gap-x-[22px] gap-y-[6px]`}>
            <More href={profile.cv.href} external>
              Download CV
            </More>
            <More href={contact.cvOnline.href} external>
              View online
            </More>
          </p>
        </Tile>
      </div>
    </Section>
  );
}

function ChannelTile(p: { i: number; icon: ReactNode; label: string; handle: string; href: string; cta: string; name: string; sub: string; link: string }) {
  return (
    <Tile i={p.i} className="flex min-h-[184px] flex-col">
      {p.icon}
      <p className={`mt-[16px] ${p.name}`}>{p.label}</p>
      <p className={p.sub}>{p.handle}</p>
      <p className={p.link}>
        <More href={p.href} external>
          {p.cta}
        </More>
      </p>
    </Tile>
  );
}

/* ---------- Addis Ababa time ---------- */

const ADDIS_OFFSET = 180; // minutes; Ethiopia keeps no daylight saving

function addisParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: profile.timezone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(d);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { h: n("hour") % 24, m: n("minute"), s: n("second") };
}

function relative(d: Date) {
  const diff = ADDIS_OFFSET + d.getTimezoneOffset();
  if (diff === 0) return "Same time as you.";
  const h = Math.abs(diff) / 60;
  const amount = `${Number.isInteger(h) ? h : h.toFixed(1)} ${h === 1 ? "hour" : "hours"}`;
  return `${amount} ${diff > 0 ? "ahead of" : "behind"} you.`;
}

function TimeCard({ live }: { live: boolean }) {
  const { compact } = usePage();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!live) return;
    let id = 0;
    const tick = () => {
      setNow(new Date());
      id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    return () => window.clearTimeout(id);
  }, [live]);

  const { h, m, s } = addisParts(now);
  const time = `${h % 12 || 12}:${String(m).padStart(2, "0")}`;
  const part = h < 5 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";

  const face = (
    <Dial h={h} m={m} s={s} size={compact ? 128 : 156} />
  );
  const text = (
    <div className={compact ? "text-left" : ""}>
      <p className="text-[13px] font-semibold text-ink-2">Local time</p>
      <p className="mt-[4px] font-display text-[21px] leading-[1.15] font-semibold tracking-[-0.014em]">
        {time} <span className="text-[15px] font-normal text-ink-2">{h < 12 ? "AM" : "PM"}</span>
      </p>
      <p className="mt-[3px] text-[14px] text-ink-2">
        {profile.location.split(",")[0]}, {profile.utcOffset}
      </p>
      <p className="mt-[10px] text-[13px] text-ink-3">
        It&rsquo;s {part} there. {relative(now)}
      </p>
    </div>
  );

  if (compact)
    return (
      <div className="flex w-full items-center gap-[22px]">
        {face}
        {text}
      </div>
    );
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[22px]">
      {face}
      {text}
    </div>
  );
}

/** The Clock widget's face, set to Addis Ababa. */
function Dial({ h, m, s, size }: { h: number; m: number; s: number; size: number }) {
  const hr = ((h % 12) + m / 60) * 30;
  const mn = (m + s / 60) * 6;
  const sc = s * 6;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="shrink-0">
      <circle cx="50" cy="50" r="49" className="fill-page-alt" />
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i}
          x1="50"
          y1={i % 5 ? 4.5 : 4}
          x2="50"
          y2={i % 5 ? 6.5 : 8}
          transform={`rotate(${i * 6} 50 50)`}
          className={i % 5 ? "stroke-ink-3" : "stroke-ink"}
          strokeWidth={i % 5 ? 0.5 : 1.1}
          strokeLinecap="round"
        />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) * 30 * Math.PI) / 180;
        return (
          <text
            key={i}
            x={50 + Math.sin(a) * 34}
            y={50 - Math.cos(a) * 34}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-ink font-display"
            style={{ fontSize: 9.5, fontWeight: 500 }}
          >
            {i + 1}
          </text>
        );
      })}
      <g className="stroke-ink" strokeLinecap="round">
        <line x1="50" y1="50" x2="50" y2="27" strokeWidth="3.4" transform={`rotate(${hr} 50 50)`} />
        <line x1="50" y1="50" x2="50" y2="13" strokeWidth="2.4" transform={`rotate(${mn} 50 50)`} />
      </g>
      <g transform={`rotate(${sc} 50 50)`}>
        <line x1="50" y1="58" x2="50" y2="9" stroke="#ff9500" strokeWidth="0.9" strokeLinecap="round" />
      </g>
      <circle cx="50" cy="50" r="2.4" className="fill-ink" />
      <circle cx="50" cy="50" r="1.4" fill="#ff9500" />
    </svg>
  );
}

/* ---------- Write ---------- */

function Write({ sref, body }: { sref: RefObject<HTMLElement | null>; body: RefObject<HTMLTextAreaElement | null> }) {
  const { compact } = usePage();
  const intro = (
    <div>
      <Eyebrow>Message</Eyebrow>
      <Headline i={1} className="mt-[10px]">
        Or write it
        <br />
        right here.
      </Headline>
      <Lockup i={2} className="mt-[16px] max-w-[300px]">
        Send hands it to <strong>your own mail app</strong>, addressed and ready. This page doesn&rsquo;t store or send a thing.
      </Lockup>
    </div>
  );
  return (
    <Section sref={sref}>
      <div className={compact ? "" : "grid grid-cols-[0.8fr_1.2fr] items-center gap-[44px]"}>
        {intro}
        <div {...reveal(compact ? 3 : 2)} className={`relative ${compact ? "mt-[30px]" : ""}`}>
          {/* Colour for the glass to sit on. */}
          <div
            aria-hidden="true"
            className="absolute -inset-x-[56px] -inset-y-[64px] opacity-80 dark:opacity-60"
            style={{
              background:
                "radial-gradient(28% 34% at 30% 32%, rgba(10,132,255,0.3), transparent), radial-gradient(28% 34% at 72% 36%, rgba(191,90,242,0.24), transparent), radial-gradient(30% 30% at 54% 72%, rgba(255,55,95,0.18), transparent)",
            }}
          />
          <div className="relative">
            <Composer bodyRef={body} />
          </div>
        </div>
      </div>
    </Section>
  );
}

function Footer() {
  const { padL, padR, compact } = usePage();
  return (
    <footer className="bg-page-alt" style={{ paddingLeft: padL, paddingRight: padR }}>
      <div className={`flex py-[18px] pb-[40px] text-[11px] leading-[1.33] tracking-[-0.01em] text-ink-2 ${compact ? "flex-col gap-[4px]" : "justify-between"}`}>
        <span>Messages are written here and sent from your own mail app.</span>
        <span>
          {profile.location} · {profile.utcOffset}
        </span>
      </div>
    </footer>
  );
}
