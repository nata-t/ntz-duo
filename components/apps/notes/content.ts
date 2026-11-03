import { experience, profile, skills } from "@/content/site";

// The notes, written only from content/site.ts. Each is a list of blocks
// the way Notes stores a body: headings, paragraphs and checklist items.

export type Block =
  | { t: "h"; text: string }
  | { t: "p"; text: string; strong?: boolean }
  | { t: "check"; id: string; text: string; done: boolean }
  | { t: "meta"; text: string };

export type Note = { id: string; title: string; pinned?: boolean; blocks: Block[] };

const month = (ym: string) =>
  new Date(`${ym}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
const short = (ym: string) =>
  new Date(`${ym}-01T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });

const now = experience[0]!;
const education = profile.education;

export const NOTES: Note[] = [
  {
    id: "now",
    title: "Now",
    pinned: true,
    blocks: [
      { t: "h", text: now.company },
      { t: "meta", text: `${now.title}, since ${month(now.start)}` },
      { t: "p", text: now.summary },
      { t: "h", text: "Looking for" },
      { t: "p", text: profile.availability, strong: true },
      { t: "h", text: "Based in" },
      { t: "p", text: `${profile.location} · ${profile.utcOffset}` },
    ],
  },
  {
    id: "stack",
    title: "Stack",
    blocks: skills.flatMap((g) => [
      { t: "h", text: g.group } as Block,
      ...g.items.map<Block>((s) => ({ t: "check", id: `${g.group}:${s}`, text: s, done: true })),
    ]),
  },
  {
    id: "experience",
    title: "Experience",
    blocks: experience.flatMap<Block>((r) => [
      { t: "h", text: r.company },
      { t: "meta", text: `${r.title} · ${short(r.start)} – ${r.end ? short(r.end) : "Now"}` },
      { t: "p", text: r.summary },
    ]),
  },
  {
    id: "how",
    title: "How I work",
    blocks: [{ t: "p", text: profile.statement, strong: true }, ...profile.bio.map<Block>((b) => ({ t: "p", text: b }))],
  },
  {
    id: "education",
    title: "Education",
    blocks: [
      { t: "h", text: education.school },
      { t: "p", text: education.degree },
      { t: "meta", text: `${education.years} · ${education.note}` },
    ],
  },
];

/** Plain text of a note, for previews and search. */
export function plain(n: Note) {
  return n.blocks.map((b) => b.text).join(" ");
}
