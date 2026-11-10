import { profile } from "@/content/site";

/** A note written in this session; it lives until the window closes. */
export type Draft = { id: string; title: string; body: string };

export const draftTitle = (d: Draft) => d.title.trim() || "New Note";

/** Notes' gold: system yellow, deepened a touch on light for legibility. */
export const accent = (dark: boolean) => (dark ? "#ffd60a" : "#e5b000");
/** The selected row's fill and the prominent buttons: dark enough for white. */
export const highlight = (dark: boolean) => (dark ? "#c79c00" : "#e0a800");

export const hhmm = (t: number) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: profile.timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(t));
export const longDate = (t: number) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: profile.timezone, day: "numeric", month: "long", year: "numeric" }).format(new Date(t));
