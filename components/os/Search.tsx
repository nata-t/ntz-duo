"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { openApp, os } from "@/lib/os";
import { APPS } from "@/components/apps/registry";
import { projects } from "@/content/site";
import { IconFace } from "./AppIcon";
import { launch } from "./launch";

// Spotlight: a Liquid Glass field at the bottom of the trailing side, results
// rising above it. Matches app names, and projects by client and stack.
export default function Search() {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus({ preventScroll: true }), []);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const all = Object.values(APPS);
    if (!s) return all.filter((a) => ["about", "contact", "photos", projects[2]!.slug].includes(a.id));
    return all.filter((a) => {
      const p = projects.find((x) => x.slug === a.id);
      const hay = [a.name, p?.name, p?.client, p?.category, ...(p?.stack ?? [])].join(" ").toLowerCase();
      return hay.includes(s);
    });
  }, [q]);

  const close = () => os.set({ overlay: null });

  return (
    <div className="absolute inset-0 z-[44]" onClick={close}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[30px] backdrop-saturate-150" style={{ animation: "duo-fade 0.25s ease-out backwards" }} />
      <div
        className="absolute right-[96px] bottom-[22px] left-[96px] mx-auto flex max-w-[620px] flex-col gap-[14px]"
        style={{ animation: "duo-rise 0.42s var(--ease-ios) backwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass rounded-[30px] p-[10px] text-label">
          <p className="px-[12px] pt-[4px] pb-[8px] text-[13px] font-semibold text-label-2">{q ? "Top Hits" : "Siri Suggestions"}</p>
          {results.length ? (
            <ul className="grid grid-cols-4 gap-y-[6px]">
              {results.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={(e) => launch(a.id, (e.currentTarget as HTMLElement).querySelector("[data-face]"))}
                    className="flex w-full flex-col items-center gap-[6px] rounded-[18px] py-[8px] transition-colors hover:bg-fill-3"
                  >
                    <span data-face>
                      <IconFace id={a.id} size={52} />
                    </span>
                    <span className="max-w-[110px] truncate text-[12px]">{a.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-[12px] pb-[12px] text-[15px] text-label-2">No results for “{q}”.</p>
          )}
        </div>
        <form
          className="glass flex h-[50px] items-center gap-[8px] rounded-full px-[18px] text-label"
          onSubmit={(e) => {
            e.preventDefault();
            const first = results[0];
            if (first) {
              if (first.kind === "link") os.set({ overlay: null, alert: first.id });
              else openApp(first.id, null);
            }
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" className="shrink-0 text-label-2">
            <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <path d="m13 13 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects, stack, apps"
            aria-label="Search"
            className="h-full min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-label-2"
          />
          <button type="button" onClick={close} className="text-[15px] font-medium text-blue">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
