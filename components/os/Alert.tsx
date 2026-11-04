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
      <div className="absolute inset-0 animate-[duo-fade_0.2s_ease-out_backwards] bg-black/25" />
      <div
        role="alertdialog"
        aria-labelledby="duo-alert-title"
        className="glass relative w-[300px] rounded-[34px] p-[22px] pb-[16px] animate-[duo-alert_0.34s_var(--ease-ios)_backwards] bg-(--glass-strong) text-center text-label"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="duo-alert-title" className="text-[17px] leading-[1.3] font-semibold">
          Open “{app.destination}”?
        </p>
        <p className="mt-[4px] text-[13px] leading-[1.35] text-label-2">
          {app.href.startsWith("mailto:") ? `Write to ${host} in your mail app.` : `This opens ${host} in a new tab.`}
        </p>
        <div className="mt-[18px] flex gap-[10px]">
          <button type="button" onClick={dismiss} className="h-[46px] flex-1 rounded-full bg-fill-2 text-[17px] font-medium transition-colors hover:bg-fill">
            Cancel
          </button>
          <a
            href={app.href}
            target={app.href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noreferrer"
            onClick={dismiss}
            className="grid h-[46px] flex-1 place-items-center rounded-full bg-blue text-[17px] font-semibold text-white transition-[filter] hover:brightness-110"
          >
            Open
          </a>
        </div>
      </div>
    </div>
  );
}
