"use client";

import { os, useOS } from "@/lib/os";
import { APPS } from "@/components/apps/registry";

// A link app asks before it takes the visitor off the site, in the shape of
// an iOS alert: title, one line of why, Cancel and the action.
export default function Alert() {
  const id = useOS((s) => s.alert);
  const app = id ? APPS[id] : null;
  if (!app?.href) return null;
  const host = app.href.startsWith("mailto:") ? app.href.slice(7) : new URL(app.href).host.replace(/^www\./, "");
  const dismiss = () => os.set({ alert: null });

  return (
    <div className="absolute inset-0 z-[45] grid place-items-center" onClick={dismiss}>
      <div className="absolute inset-0 animate-[duo-fade_0.2s_ease-out_backwards] bg-black/20" />
      {/* iOS 26: a rounder, wider glass card, its text leading-aligned,
          the actions as capsules side by side. */}
      <div
        role="alertdialog"
        aria-labelledby="duo-alert-title"
        className="glass relative w-[320px] animate-[duo-alert_0.4s_var(--ease-ios)_backwards] rounded-[36px] bg-(--glass-strong) p-[22px] pt-[20px] pb-[16px] text-left text-label"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="duo-alert-title" className="text-[17px] leading-[22px] font-semibold tracking-[-0.02em]">
          Open “{app.destination}”?
        </p>
        <p className="mt-[5px] text-[15px] leading-[20px] tracking-[-0.01em] text-label-2">
          {app.href.startsWith("mailto:") ? `Write to ${host} in your mail app.` : `This opens ${host} in a new tab.`}
        </p>
        <div className="mt-[20px] flex gap-[10px]">
          <button type="button" onClick={dismiss} className="h-[48px] flex-1 rounded-full bg-fill-2 text-[17px] font-medium transition-[background-color,scale] duration-200 hover:bg-fill active:scale-[1.04]">
            Cancel
          </button>
          <a
            href={app.href}
            target={app.href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noreferrer"
            onClick={dismiss}
            className="grid h-[48px] flex-1 place-items-center rounded-full bg-blue text-[17px] font-semibold text-white transition-[filter,scale] duration-200 hover:brightness-110 active:scale-[1.04]"
          >
            Open
          </a>
        </div>
      </div>
    </div>
  );
}
