import { APPS } from "@/components/apps/registry";
import { dims, openApp, os, type Rect } from "@/lib/os";

/** A rect on screen, converted into display points of the OS root it sits in. */
export function toDisplayRect(el: Element): Rect | null {
  const root = el.closest<HTMLElement>("[data-os-root]");
  if (!root) return null;
  const r = root.getBoundingClientRect();
  const e = el.getBoundingClientRect();
  const s = r.width / dims().w;
  if (!s) return null;
  return { x: (e.left - r.left) / s, y: (e.top - r.top) / s, w: e.width / s, h: e.height / s };
}

/** Tap on an icon: open its app from where the icon sits, or, for a link,
 *  ask first. */
export function launch(id: string, from: Element | null) {
  const app = APPS[id];
  if (!app || !os.get().live) return;
  if (app.kind === "link") {
    os.set({ alert: id });
    return;
  }
  openApp(id, from ? toDisplayRect(from) : null);
}
