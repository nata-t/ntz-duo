"use client";

import { useId, useState, type RefObject } from "react";
import { contact, profile } from "@/content/site";
import { usePage } from "../about/kit";

// A Mail compose sheet in Liquid Glass. Send hands everything to the
// visitor's own mail app through a mailto: link; nothing leaves the page.

type Form = { name: string; email: string; subject: string; message: string };
const EMPTY: Form = { name: "", email: "", subject: "", message: "" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** A springy press for Contact's buttons. */
export const PRESS = "transition-[scale] duration-[0.25s] ease-[cubic-bezier(0.3,2,0.5,1)] active:scale-90";

export function mailto(f: Form) {
  const name = f.name.trim();
  const email = f.email.trim();
  const subject = f.subject.trim() || `Hello from ${name || "your portfolio"}`;
  const sign = [name, email].filter(Boolean).join(" · ");
  const body = f.message.trim() + (sign ? `\n\n— ${sign}` : "");
  return `${contact.email.href}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function Composer({ bodyRef }: { bodyRef: RefObject<HTMLTextAreaElement | null> }) {
  const { compact } = usePage();
  const id = useId();
  const [f, setF] = useState<Form>(EMPTY);
  const [err, setErr] = useState<{ email?: string; message?: string }>({});
  const [sent, setSent] = useState(false);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    if (k === "email" || k === "message") setErr((p) => ({ ...p, [k]: undefined }));
  };

  const send = () => {
    const next: typeof err = {};
    if (!f.message.trim()) next.message = "Write a message before sending.";
    if (f.email.trim() && !EMAIL.test(f.email.trim())) next.email = "That email address doesn’t look right.";
    setErr(next);
    if (next.message) return bodyRef.current?.focus();
    if (next.email) return document.getElementById(`${id}-email`)?.focus();
    window.location.href = mailto(f);
    setSent(true);
  };

  const dirty = Object.values(f).some((v) => v.trim());
  const row = "flex min-h-[44px] items-center gap-[8px] border-b-[0.5px] border-sep px-[18px]";
  const label = "w-[62px] shrink-0 text-[15px] text-label-2";
  const input =
    "min-w-0 flex-1 appearance-none rounded-none border-0 bg-transparent px-0 py-[11px] text-[15px] tracking-[-0.016em] text-label caret-blue outline-none placeholder:text-label-3 focus-visible:outline-none";

  return (
    <div
      className="relative overflow-hidden rounded-[26px] bg-(--glass-strong) text-label shadow-[inset_0_0.5px_0_0.5px_var(--glass-edge),0_24px_60px_-12px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.05)]"
    >
      {/* Sheet header: Clear · New Message · Send */}
      <div className="grid h-[52px] grid-cols-[1fr_auto_1fr] items-center px-[14px]">
        <button
          type="button"
          onClick={() => {
            setF(EMPTY);
            setErr({});
          }}
          disabled={!dirty}
          className="justify-self-start px-[4px] text-[15px] text-blue transition-opacity disabled:opacity-35"
        >
          Clear
        </button>
        <p className="font-display text-[16px] font-semibold tracking-[-0.01em]">New Message</p>
        <button
          type="button"
          onClick={send}
          aria-label="Send"
          title="Send"
          className={`grid size-[32px] place-items-center justify-self-end rounded-full bg-blue text-white shadow-[0_4px_14px_rgba(0,120,255,0.35)] ${PRESS}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5m-6.5 6.5L12 5l6.5 6.5" />
          </svg>
        </button>
      </div>

      <div className="border-t-[0.5px] border-sep">
        <div className={row}>
          <span className={label}>To:</span>
          <span className="inline-flex h-[26px] items-center rounded-full bg-[color-mix(in_srgb,var(--blue)_14%,transparent)] px-[10px] text-[14px] text-blue">
            {profile.name}
          </span>
        </div>
        <label className={row}>
          <span className={label}>From:</span>
          <input className={input} value={f.name} onChange={set("name")} placeholder="Your name" autoComplete="name" />
        </label>
        <label className={row}>
          <span className={label}>Email:</span>
          <input
            id={`${id}-email`}
            className={input}
            value={f.email}
            onChange={set("email")}
            placeholder="you@example.com"
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-invalid={!!err.email}
            aria-describedby={err.email ? `${id}-email-hint` : undefined}
          />
        </label>
        {err.email ? <Hint id={`${id}-email-hint`}>{err.email}</Hint> : null}
        <label className={row}>
          <span className={label}>Subject:</span>
          <input className={input} value={f.subject} onChange={set("subject")} placeholder={`Hello from ${f.name.trim() || "…"}`} />
        </label>
      </div>

      <textarea
        ref={bodyRef}
        value={f.message}
        onChange={set("message")}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
        }}
        placeholder="Write your message…"
        aria-label="Message"
        aria-invalid={!!err.message}
        aria-describedby={err.message ? `${id}-msg-hint` : undefined}
        className={`block w-full resize-none appearance-none rounded-none border-0 bg-transparent px-[18px] pt-[14px] pb-[10px] text-[15px] leading-[1.47] tracking-[-0.016em] text-label caret-blue outline-none placeholder:text-label-3 focus-visible:outline-none ${
          compact ? "h-[150px]" : "h-[178px]"
        }`}
      />
      {err.message ? <Hint id={`${id}-msg-hint`}>{err.message}</Hint> : null}

      <p className="border-t-[0.5px] border-sep px-[18px] py-[11px] text-[11.5px] leading-[1.35] text-label-2">
        Opens in your mail app, addressed to {contact.email.label}.
      </p>

      {/* After Send: the sheet hands over to Mail. */}
      {sent ? (
        <div
          role="status"
          className="absolute inset-0 flex animate-[duo-fade_0.35s_ease-out_both] flex-col items-center justify-center bg-(--glass-strong) px-[32px] text-center"
        >
          <span className="grid size-[52px] animate-[duo-rise_0.5s_var(--ease-ios)_both] place-items-center rounded-full bg-green text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </span>
          <p className="mt-[16px] font-display text-[22px] font-semibold tracking-[-0.016em]">Over to Mail.</p>
          <p className="mt-[6px] max-w-[300px] text-[14px] leading-[1.45] text-label-2">
            Your message is waiting in your mail app, addressed and ready. Press Send there and it&rsquo;s on its way.
          </p>
          <div className="mt-[18px] flex gap-[22px] text-[15px]">
            <a href={mailto(f)} className="text-blue hover:underline">
              Open again
            </a>
            <button
              type="button"
              className="text-blue hover:underline"
              onClick={() => {
                setSent(false);
                setF(EMPTY);
              }}
            >
              Write another
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Hint({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-center gap-[6px] px-[18px] pt-[6px] pb-[4px] text-[12.5px] text-red">
      <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path d="M12 7v6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="12" cy="16.8" r="1.4" fill="#fff" />
      </svg>
      {children}
    </p>
  );
}
