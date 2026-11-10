import { profile, projects, type Project } from "@/content/site";

// The photo library is the portfolio itself: every public project's
// screenshots, plus the portrait. Confidential projects only have
// placeholders, so they live behind the Hidden album instead of in Library.

export type Photo = {
  id: string;
  src: string;
  /** A 560 px copy for grids; the full image is kept for the viewer. */
  thumb: string;
  /** What the screen shows, from its file name ("self-services" → "Self Services"). */
  label: string;
  alt: string;
  /** Width / height. */
  ratio: number;
  project: Project | null;
  /** Painted behind images with transparency (the keyed-out portrait). */
  backdrop?: string;
};

export type Album = {
  id: string;
  title: string;
  /** One line under the title in the album view. */
  sub: string;
  photos: Photo[];
  project: Project | null;
};

const SCREEN = 16 / 10;

const label = (src: string) =>
  src
    .split("/")
    .pop()!
    .replace(/\.\w+$/, "")
    .split("-")
    .map((w) => (/^\d+$/.test(w) ? w : w[0]!.toUpperCase() + w.slice(1)))
    .join(" ");

const photosOf = (p: Project): Photo[] =>
  p.screens.map((src, i) => ({
    id: `${p.slug}/${i}`,
    src,
    thumb: src.endsWith(".webp") ? src.replace(/\/([^/]+)$/, "/thumb/$1") : src,
    label: p.confidential ? `Placeholder ${i + 1}` : label(src),
    alt: p.confidential ? `${p.name}: placeholder` : `${p.name}: ${label(src)} page`,
    ratio: SCREEN,
    project: p,
  }));

export const portrait: Photo = {
  id: "portrait",
  src: profile.portrait.source,
  thumb: profile.portrait.source,
  label: "Portrait",
  alt: `Portrait of ${profile.name}`,
  ratio: 787 / 1100,
  project: null,
  // The same warm light the Home Screen widget puts behind him.
  backdrop: "radial-gradient(120% 90% at 30% 10%, #f0c9a6 0%, #c97b5b 38%, #5b3a4a 78%, #2d2233 100%)",
};

const visible = projects.filter((p) => !p.confidential);
const hidden = projects.filter((p) => p.confidential);

/** A project's own line: its client when that says something new, else its category. */
export const byline = (p: Project) => (p.client === p.name ? p.category : p.client);

export type Section = { id: string; title: string; sub: string; year: number | null; photos: Photo[] };

// Oldest first, so the newest sits at the bottom where Library opens, as on
// iOS. Only years are known, so projects within a year keep the site's order.
export const sections: Section[] = [
  ...[...visible]
    .sort((a, b) => a.year - b.year)
    .map((p) => ({ id: p.slug, title: p.name, sub: `${p.year} · ${byline(p)}`, year: p.year, photos: photosOf(p) })),
  { id: "portrait", title: profile.name, sub: profile.location, year: null, photos: [portrait] },
];

export const library: Photo[] = sections.flatMap((s) => s.photos);

export const albums: Album[] = visible.map((p) => ({
  id: p.slug,
  title: p.name,
  sub: `${p.year} · ${byline(p)}`,
  photos: photosOf(p),
  project: p,
}));

export const hiddenAlbums: Album[] = hidden.map((p) => ({
  id: p.slug,
  title: p.name,
  sub: `${p.year} · ${p.client}`,
  photos: photosOf(p),
  project: p,
}));

export const people: Album = {
  id: "people",
  title: profile.name,
  sub: `${profile.title} · ${profile.location}`,
  photos: [portrait],
  project: null,
};

export const screenshots: Album = {
  id: "screenshots",
  title: "Screenshots",
  sub: `${visible.length} projects`,
  photos: albums.flatMap((a) => a.photos),
  project: null,
};

/** One album per year, newest first, the way Photos groups days. */
export const years: Album[] = [...new Set(visible.map((p) => p.year))]
  .sort((a, b) => b - a)
  .map((y) => {
    const list = albums.filter((a) => a.project!.year === y);
    return {
      id: `year-${y}`,
      title: String(y),
      sub: list.map((a) => a.project!.short).join(", "),
      photos: list.flatMap((a) => a.photos),
      project: null,
    };
  });

export const HIDDEN_ID = "hidden";

export function findAlbum(id: string): Album | null {
  if (id === HIDDEN_ID) {
    return { id, title: "Hidden", sub: "", photos: hiddenAlbums.flatMap((a) => a.photos), project: null };
  }
  return [...albums, ...years, people, screenshots].find((a) => a.id === id) ?? null;
}

const words = (ph: Photo) =>
  [ph.label, ...(ph.project ? [ph.project.name, ph.project.short, ph.project.client, ph.project.category, String(ph.project.year), ...ph.project.stack] : [profile.name, "portrait", "people", profile.location])]
    .join(" ")
    .toLowerCase();

/** Every word of the query has to match somewhere on the photo. */
export function search(q: string): { photos: Photo[]; albums: Album[] } {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return { photos: [], albums: [] };
  const hit = (s: string) => terms.every((t) => s.includes(t));
  return {
    photos: library.filter((ph) => hit(words(ph))),
    albums: [...albums, people].filter((a) => hit(a.photos.map(words).join(" ") + " " + a.title.toLowerCase())),
  };
}

export const suggestions: string[] = [
  ...new Set([...visible.map((p) => p.category), ...visible.map((p) => String(p.year)), "React", "GSAP", "Supabase", "Turborepo"]),
];
