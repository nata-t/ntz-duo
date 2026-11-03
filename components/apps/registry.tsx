import { contact, projects, socials } from "@/content/site";
import type { AppProps } from "./types";
import About from "./about/About";
import Contact from "./contact/Contact";
import Photos from "./photos/Photos";
import Settings from "./settings/Settings";
import Notes from "./notes/Notes";
import Resume from "./resume/Resume";
import Project from "./project/Project";

export type AppDef = {
  id: string;
  name: string;
  /** Opens in a window, or hands off to the outside world after asking. */
  kind: "app" | "link";
  href?: string;
  /** For link apps: where the alert says it is going. */
  destination?: string;
  /** Launch screen colour while the window grows from the icon. */
  splash?: string;
  render?: (p: AppProps) => React.ReactNode;
};

const social = (label: string) => socials.find((s) => s.label === label)!;

const list: AppDef[] = [
  { id: "about", name: "About", kind: "app", render: (p) => <About {...p} /> },
  { id: "contact", name: "Contact", kind: "app", render: (p) => <Contact {...p} /> },
  { id: "photos", name: "Photos", kind: "app", render: (p) => <Photos {...p} /> },
  { id: "settings", name: "Settings", kind: "app", render: (p) => <Settings {...p} /> },
  { id: "notes", name: "Notes", kind: "app", render: (p) => <Notes {...p} /> },
  { id: "resume", name: "Résumé", kind: "app", render: (p) => <Resume {...p} /> },
  { id: "mail", name: "Mail", kind: "link", href: contact.email.href, destination: "Mail" },
  { id: "github", name: "GitHub", kind: "link", href: social("GitHub").href, destination: "GitHub" },
  { id: "linkedin", name: "LinkedIn", kind: "link", href: social("LinkedIn").href, destination: "LinkedIn" },
  { id: "telegram", name: "Telegram", kind: "link", href: social("Telegram").href, destination: "Telegram" },
  ...projects.map<AppDef>((p) => ({
    id: p.slug,
    name: p.short,
    kind: "app",
    splash: p.color,
    render: (props) => <Project {...props} slug={p.slug} />,
  })),
];

export const APPS: Record<string, AppDef> = Object.fromEntries(list.map((a) => [a.id, a]));
