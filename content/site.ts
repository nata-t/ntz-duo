// ntz duo — site content (draft).
//
// Sourced from ../../../ntz/content/site.ts (canonical), the PDF CV and the
// older natnael-portfolio-website. See CONTENT.md beside this file for the
// verbatim originals and every variant.
//
// REVIEW marks copy that was drafted rather than sourced (inherited from ntz's
// docs/review.md, plus the new fields this site adds: `category`, `tagline`,
// `color`). Natnael reviews these before launch.
//
// Paths in `screens` are public paths under /public/projects/<slug>/.

export type Link = { label: string; href: string };

export type Profile = {
  name: string;
  first: string;
  last: string;
  handle: string;
  title: string;
  location: string;
  timezone: string;
  utcOffset: string;
  statement: string;
  bio: string[];
  availability: string;
  education: { school: string; degree: string; years: string; note: string };
  portrait: { halftone: string; dither: string; source: string; studio: string; cutout: string };
  cv: Link;
};

export type Role = {
  company: string;
  title: string;
  start: string; // YYYY-MM
  end: string | null; // null = present
  summary: string;
};

export type Category = "Banking" | "Accessibility" | "Logistics" | "Education" | "Corporate" | "Personal";

export type Project = {
  slug: string;
  name: string;
  /** Short name for an app-icon label or tight spaces. */
  short: string;
  client: string;
  year: number;
  category: Category;
  role: string;
  /** A few words for under the icon or in a list. */
  tagline: string;
  /** One sentence for cards and meta descriptions. */
  summary: string;
  built: string[];
  /** Hard numbers only. Never invented. */
  facts: { value: string; label: string }[];
  stack: string[];
  url: string | null;
  /** Internal bank systems: never show screens, show architecture and facts. */
  confidential: boolean;
  /** Brand-ish accent for the iOS-style app icon. */
  color: string;
  /** Foreground for the icon glyph on `color`. */
  ink: string;
  /** Public paths, in display order. 16:10 (2400×1500 webp, or 1600×1000 svg placeholders). */
  screens: string[];
};

export const profile: Profile = {
  name: "Natnael Tadele",
  first: "Natnael",
  last: "Tadele",
  handle: "ntz",
  title: "Software Engineer",
  location: "Addis Ababa, Ethiopia",
  timezone: "Africa/Addis_Ababa",
  utcOffset: "GMT+3",
  statement:
    "I build the software behind Ethiopian banks, shipping lines and classrooms — and the interfaces people use to reach it.",
  bio: [
    "Full-stack engineer working in TypeScript and Go. I like the whole path: designing the interface in Figma, building it, and wiring it to the APIs and servers it depends on.",
    "My recent work replaces counters and paper with systems: branch visit management for the Commercial Bank of Ethiopia, voice guidance on ATMs across 39 banks, and the client platforms for Ethiopian Shipping & Logistics.",
  ],
  // Confirmed 2026-10-19. Freelance availability is an open decision; don't add it without his say.
  availability: "Open to full-time roles, remote or relocation",
  education: {
    school: "Bahir Dar University",
    degree: "B.Sc. Computer Science",
    years: "2019–2024",
    note: "CGPA 3.85",
  },
  // Only processed portraits ship; the original passport photo never does.
  portrait: {
    halftone: "/portrait/halftone.png",
    dither: "/portrait/dither.png",
    source: "/portrait/source.webp",
    // Black and white on white, hand to the chin: the Home Screen's big
    // widget, and cut out of its white (alpha) for About's hero.
    studio: "/portrait/turtleneck.webp",
    cutout: "/portrait/turtleneck-cutout.webp",
  },
  cv: { label: "Download CV", href: "/Natnael_Tadele_CV.pdf" },
};

export const contact = {
  email: { label: "nathanaeltadelez@gmail.com", href: "mailto:nathanaeltadelez@gmail.com" },
  // CV only; ntz doesn't publish it. REVIEW before showing.
  phone: { label: "+251 909 58 5833", href: "tel:+251909585833" },
  cv: profile.cv,
  /** Hosted CV linked from the PDF header. */
  cvOnline: { label: "CV (self.so)", href: "https://www.self.so/natnael-tadele" },
} as const;

export const socials: (Link & { handle: string })[] = [
  { label: "LinkedIn", handle: "in/natnael-tadele7", href: "https://www.linkedin.com/in/natnael-tadele7/" },
  { label: "GitHub", handle: "nata-t", href: "https://github.com/nata-t" },
  { label: "Telegram", handle: "@NATHENAEAL7", href: "https://t.me/NATHENAEAL7" },
];

export const experience: Role[] = [
  {
    company: "Moti Engineering",
    title: "Software Engineer",
    start: "2026-06",
    end: null,
    summary:
      "Customer visit management for CBE smart branches and ATM voice guidance across 39 banks — vendor integration, API design and infrastructure.",
  },
  {
    company: "Koket Investment",
    title: "Senior Full-stack Developer",
    start: "2025-06",
    end: "2026-03",
    summary:
      "Delivered the platforms for Ethiopian Shipping & Logistics, Babogaya Maritime & Logistics Academy and Koket Investment's own site.",
  },
  {
    company: "Alpha ICT Tech",
    title: "Full-stack Developer",
    start: "2023-11",
    end: "2025-06",
    summary:
      "Web, mobile, server and desktop projects, including the Boss Burger ERP: staff roles, orders, expenses and mobile-payment validation.",
  },
];

export const skills: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["TypeScript", "JavaScript", "Go"] },
  {
    group: "Interface",
    items: ["React", "Next.js", "Vue", "Nuxt", "TanStack", "Tailwind CSS", "shadcn/ui", "GSAP", "Framer Motion", "Figma"],
  },
  {
    group: "Server",
    items: ["Gin", "NestJS", "Express", "Node.js", "tRPC", "Prisma", "Better Auth", "Supabase", "Firebase"],
  },
  { group: "Data", items: ["PostgreSQL", "SQL Server", "MySQL", "MongoDB", "Redis", "SSRS"] },
  { group: "Infrastructure", items: ["Docker", "Linux", "Windows Server", "GitHub Actions", "Jenkins", "Turborepo"] },
];

const shots = (slug: string, files: string[]) => files.map((f) => `/projects/${slug}/${f}`);
const placeholders = (slug: string) => [1, 2, 3, 4, 5, 6].map((i) => `/projects/${slug}/placeholder-${i}.svg`);

// Order follows ntz: impact first.
export const projects: Project[] = [
  {
    slug: "cbe-smart-branch",
    name: "Smart Branch",
    short: "Smart Branch",
    client: "Commercial Bank of Ethiopia",
    year: 2026,
    category: "Banking",
    role: "Integration, API design, infrastructure",
    tagline: "Runs the floor of CBE's smart branches", // REVIEW
    summary:
      "Customer visit management that runs the floor of CBE's smart branches — live in six branches and the head office.",
    built: [
      "Integrated the vendor's visit-management software with the bank's systems",
      "Designed the custom APIs between them in Go and Gin",
      "Set up the Windows Server and SQL Server infrastructure, with SSRS reporting",
    ],
    facts: [
      { value: "6", label: "smart branches live" },
      { value: "+1", label: "head office" },
    ],
    stack: ["Go", "Gin", "SQL Server", "SSRS", "SSMS", "Windows Server"],
    url: null,
    confidential: true,
    color: "#5B2A86", // REVIEW: CBE purple (assumed, not sampled)
    ink: "#FFFFFF",
    // REVIEW: placeholders until real photos from the bank's posts are in.
    screens: placeholders("cbe-smart-branch"),
  },
  {
    slug: "atm-voice-guidance",
    name: "Voice Guidance",
    short: "Voice",
    client: "39 Ethiopian banks",
    year: 2026,
    category: "Accessibility",
    role: "Integration, API design, infrastructure",
    tagline: "ATMs that talk, across 39 banks", // REVIEW
    summary:
      "A voice layer that lets visually impaired customers use an ATM on their own, deployed on thousands of machines across 39 banks.",
    built: [
      "Integrated the vendor's voice-guidance software with the ATM network",
      "Designed the APIs that drive it in Go and Gin",
      "Set up the infrastructure that brought it live at national scale",
    ],
    facts: [
      { value: "39", label: "banks" },
      { value: "1,000s", label: "of ATMs" },
    ],
    stack: ["Go", "Gin", "API design"],
    url: null,
    confidential: true,
    color: "#F2A900", // REVIEW: no client brand; amber (echoes ntz's canary sheet)
    ink: "#171614",
    screens: placeholders("atm-voice-guidance"),
  },
  {
    slug: "ethiopian-shipping-logistics",
    name: "Ethiopian Shipping & Logistics",
    short: "ESL",
    client: "Ethiopian Shipping & Logistics",
    year: 2025, // REVIEW: built during the Koket role (Jun 2025 – Mar 2026)
    category: "Logistics",
    role: "Full-stack development",
    tagline: "One front door for the national shipping line", // REVIEW
    summary:
      "One platform for the clients, staff and admins of Ethiopia's national shipping line: service requests, shipment tracking and internal workflow.",
    built: [
      "Client dashboard for online service requests and shipment tracking",
      "Staff dashboard for workflow management",
      "Admin dashboard over both",
    ],
    facts: [{ value: "3", label: "dashboards: client, staff, admin" }],
    stack: ["React", "TanStack", "shadcn/ui", "Tailwind CSS", "Zod", "Framer Motion"],
    url: "https://esl.et",
    confidential: false,
    color: "#006A31", // sampled from esl.et (accent yellow #F9CA0F)
    ink: "#F9CA0F",
    screens: shots("ethiopian-shipping-logistics", [
      "home.webp",
      "self-services.webp",
      "about.webp",
      "news.webp",
      "contact.webp",
      "vessels.webp",
    ]),
  },
  {
    slug: "babogaya-maritime-academy",
    name: "Babogaya Maritime & Logistics Academy",
    short: "BMLA",
    client: "Babogaya Maritime & Logistics Academy",
    year: 2025, // REVIEW
    category: "Education",
    role: "Full-stack development",
    tagline: "A maritime campus, online", // REVIEW
    summary:
      "Student, instructor and admin dashboards for a maritime academy: course delivery, assessments, announcements and performance tracking.",
    built: [
      "Student dashboard: courses, assessments and results",
      "Instructor dashboard: delivery, grading and announcements",
      "Admin dashboard for academic management",
    ],
    facts: [{ value: "3", label: "roles: student, instructor, admin" }],
    stack: ["React", "TanStack", "shadcn/ui", "Tailwind CSS", "Zod", "Framer Motion"],
    url: "https://bmla.esl.et/",
    confidential: false,
    color: "#0B3D5C", // REVIEW: sea navy to tell it apart from ESL; the site's own green is #056333
    ink: "#FFFFFF",
    screens: shots("babogaya-maritime-academy", [
      "home.webp",
      "about.webp",
      "programs.webp",
      "admission.webp",
      "student-life.webp",
      "explore.webp",
    ]),
  },
  {
    slug: "koket-investment",
    name: "Koket Investment",
    short: "Koket",
    client: "Koket Investment",
    year: 2025, // REVIEW
    category: "Corporate",
    role: "Senior full-stack developer",
    tagline: "Three business lines, one site", // REVIEW
    summary:
      "The corporate site for a group spanning design-and-build, digital solutions and trading, built in a Turborepo monorepo.",
    built: [
      "Corporate website presenting the group's three business lines",
      "Turborepo monorepo shared across the team's projects",
    ],
    facts: [{ value: "3", label: "business lines" }],
    stack: ["React", "TanStack", "shadcn/ui", "Tailwind CSS", "Zod", "Framer Motion", "Turborepo"],
    url: "https://koketinvestment.com/",
    confidential: false,
    color: "#181B18", // sampled nav near-black from koketinvestment.com
    ink: "#C9A227", // REVIEW: ochre accent (sampled ~#907800, lifted for contrast)
    screens: shots("koket-investment", [
      "home.webp",
      "specializations.webp",
      "about.webp",
      "software.webp",
      "contact.webp",
      "projects.webp",
    ]),
  },
  {
    slug: "minte-and-geni",
    name: "Minte & Geni",
    short: "Minte & Geni",
    client: "My sister's wedding",
    year: 2026, // REVIEW: the site shows the wedding on 1 Feb 2026
    category: "Personal",
    role: "Design and full-stack development",
    tagline: "A wedding site for guests", // REVIEW
    summary:
      "A wedding site I built for my sister: downloadable thank-you cards, guest photo uploads, a wish board and a gallery, with a Telegram bot on the back end.",
    built: [
      "Thank-you card generator and download, drawn with Konva",
      "Guest photo sharing on Supabase storage",
      "A virtual wish board and gallery",
      "Telegram bot integration on the back end",
    ],
    facts: [{ value: "4", label: "things guests can do" }],
    stack: ["React", "TypeScript", "Tailwind CSS", "shadcn/ui", "React Query", "GSAP", "Konva", "Express", "Supabase", "Telegram Bot API"],
    url: "https://minte-and-geni.vercel.app/",
    confidential: false,
    color: "#F6EEE3", // REVIEW: the site's cream; glyph in rose-gold
    ink: "#B9806A",
    screens: shots("minte-and-geni", [
      "home.webp",
      "dates.webp",
      "sign-board.webp",
      "locations.webp",
      "thank-you.webp",
      "pictures.webp",
    ]),
  },
];

export function projectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function nextProject(slug: string): Project {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length]!;
}

