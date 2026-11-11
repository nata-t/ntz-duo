# ntz duo — Content inventory

Everything real about Natnael Tadele, pulled from three sources and quoted verbatim.
Copy that was drafted rather than sourced is flagged **[REVIEW]**.

| Key | Source | Path |
|---|---|---|
| **NTZ** | Newest portfolio (Oct 2026), canonical | `/home/natnael-tadele/Desktop/kilet/my-projects/ntz/content/site.ts`, `content/screens.ts`, `components/**`, `PRODUCT.md`, `DESIGN.md`, `docs/*.md` |
| **OLD** | Older portfolio (Aug 2025, Next 14) | `/home/natnael-tadele/Desktop/kilet/my-projects/natnael-portfolio-website/src/config/portfolio.config.ts`, `src/sections/*.tsx`, `src/components/contact-list.tsx` |
| **CV** | PDF CV (1 page, Google Docs export) | `/home/natnael-tadele/Desktop/kilet/my-projects/ntz/public/Natnael_Tadele_CV.pdf` |

The CV in ntz and `natnael-portfolio-website/public/Natnael_Tadele_Technical_CV.pdf` are the **same file**
(md5 `b2522e46b49debf61614d4e52f41b809`; PDF title "Natnael_Tadele_Technical_CV_2").

**Precedence for ntz duo:** NTZ > CV > OLD. NTZ was sourced from the other two and then
edited. Its `PRODUCT.md` has the binding decisions: voice, cut projects, what must not be shown.

---

## 1. Identity

| Field | Value | Source |
|---|---|---|
| Full name | Natnael Tadele | all |
| First / last | Natnael / Tadele | NTZ |
| Handle / site mark | `ntz` | NTZ |
| Title | Software Engineer | NTZ `person.title`, CV current role |
| Positioning (PRODUCT.md) | full-stack engineer (TypeScript and Go), frontend / creative developer, backend / systems engineer | NTZ |
| Older titles | "Full-Stack Web Developer" (OLD about), "Creative Developer 👨‍💻" (OLD hero), "TYPESCRIPT and GOLANG full-stack developer" (OLD hero) | OLD |
| Location | Addis Ababa, Ethiopia | all |
| Timezone | `Africa/Addis_Ababa`, shown as `GMT+3` | NTZ |
| Availability | "Open to full-time roles, remote or relocation" (confirmed 2026-10-19) | NTZ |
| Open decision | Clients are a primary audience, but the availability line only mentions full-time roles. Whether to state freelance availability is undecided: "do not add it without his say." | NTZ PRODUCT.md |
| Countdown date | `countdownTo: "2040-12-28"`. Contact shows this day as a barcode and counts down to its midnight, Addis time. It has no explained meaning; ask before reusing. | NTZ |

### Brand rules from PRODUCT.md (binding in ntz; worth keeping)
- Voice: "plain, specific, first person; numbers over adjectives; no hype."
- "No Ethiopian script, Ge'ez numerals or Ethiopian calendar/clock (declined: confusing for international recruiters). Location stays "Addis Ababa, Ethiopia", time shown as GMT+3."
- "Two of the six projects are internal bank systems: never show screens; show architecture and facts only."
- "Screenshots of the four public projects are of public pages only; logged-in dashboards were not captured and must not be implied."
- "The passport photo must never appear unprocessed; only the halftone / dither treatments derived from it ship."
- "Absent, and not to be fabricated: testimonials, client logos, metrics beyond those above, awards, press."
- Audiences: hiring managers and recruiters (mostly international), and founders or agencies commissioning work, weighted equally.

---

## 2. Statement and bio, every variant

### NTZ statement (`person.statement`, used as the home thesis)
> I build the software behind Ethiopian banks, shipping lines and classrooms — and the interfaces people use to reach it.

On the site, the clause "Ethiopian banks, shipping lines and classrooms" is set in stamp red.

### NTZ bio (`person.bio`, two paragraphs)
> Full-stack engineer working in TypeScript and Go. I like the whole path: designing the interface in Figma, building it, and wiring it to the APIs and servers it depends on.

> My recent work replaces counters and paper with systems: branch visit management for the Commercial Bank of Ethiopia, voice guidance on ATMs across 39 banks, and the client platforms for Ethiopian Shipping & Logistics.

### NTZ meta description (`app/layout.tsx`)
> Natnael Tadele is a full-stack software engineer in Addis Ababa building banking, logistics and education systems in TypeScript and Go.

### NTZ section headlines and microcopy
- About headline: "From the interface to the server it talks to."
- Work headline: "Six things that used to be paper."; lede: "Each project starts as the paper it replaced. Open a file to see what it became."
- Contact headline: "Have a system that still runs on paper?"; closing marquee: "Let's build it —"
- Hero marquee: "Natnael Tadele — Software Engineer —"
- Hero facts line: "39 banks · 1,000s of ATMs · 6 branches + HQ"; status: "● Available for work"
- Statement facts (`components/home/Statement.tsx`):
  - `39`: "banks on the ATM voice-guidance rollout"
  - `6+1`: "CBE smart branches live, plus head office"
  - `3 yrs`: "shipping production software"
- Education note (About): "Graduated with a cumulative GPA of 3.85." (Dropped 2026-11-11: the CGPA stays on the downloadable CV only.)
- 404: "No file under that name." / "← Back to the drawer"

### OLD hero (`src/sections/hero.tsx`)
> Hi, I'm Natnael Tadele!
>
> Creative Developer 👨‍💻
>
> Welcome to my digital playground.
>
> A passionate ✨ TYPESCRIPT and GOLANG full-stack developer focused on immersive experiences and interactive web design.

### OLD about (`src/sections/about.tsx`, heading "About Me")
> Hello, I'm Natnael Tadele, a passionate **Full-Stack Web Developer** based in Addis Ababa, Ethiopia. I graduated with a degree in Computer Science in July 2024.

> With about three years of professional web development experience, I have worked extensively with various libraries, frameworks, and tools. I am particularly passionate about UI/UX design using Figma and full-stack development. I love creating elegant solutions and learning new technologies to enhance my development skills.

> My journey in development has been driven by my love for creating impactful applications. I enjoy the entire development process, from designing intuitive user interfaces to implementing robust backend solutions. I am constantly seeking opportunities to grow and contribute to meaningful projects that can make a difference in people's lives.

### OLD contact (`src/sections/contact.tsx`)
> If you are interested in working together, please don't hesitate to get in touch with me.

### OLD metadata
Title "Natnael Tadele | Personal"; description "Natnael Tadele's personal portfolio website"; OG image `/photo-dwight.jpg`. ntz's research notes call the old OG image a cartoon.

---

## 3. Experience

| Company | Title | Start | End | Location |
|---|---|---|---|---|
| Moti Engineering | Software Engineer | 2026-06 (Jun 2026) | present | Addis Ababa, Ethiopia |
| Koket Investment | Senior Full-stack Developer (CV: "Senior Full-stack web developer") | 2025-06 | 2026-03 | Addis Ababa, Ethiopia |
| Alpha ICT Tech | Full-stack Developer (CV: "Full-stack web developer") | 2023-11 | 2025-06 | Addis Ababa, Ethiopia |

### NTZ summaries (`experience[]`)
- **Moti Engineering**: "Customer visit management for CBE smart branches and ATM voice guidance across 39 banks — vendor integration, API design and infrastructure."
- **Koket Investment**: "Delivered the platforms for Ethiopian Shipping & Logistics, Babogaya Maritime & Logistics Academy and Koket Investment's own site."
- **Alpha ICT Tech**: "Web, mobile, server and desktop projects, including the Boss Burger ERP: staff roles, orders, expenses and mobile-payment validation."

### CV bullets (verbatim, typos included)
- **Moti Engineering**: "Working on a customer visit management platform deployed across 6 Commercial Bank of Ethiopia smart branches and head office, and a voice guidance system enabling ATM accessibility for visually impaired users on thousands of ATMs across 39 banks. Involved in vendor software integration, API design, and infrastructure setup for both systems."
- **Koket Investment**: "Delivered full-stack web applications for major clients including Ethiopian Shipping & Logistics, Babugaya Marine Academy, and Koket Investment's corporate site." The CV spells it "Babugaya Marine Academy"; the correct name is **Babogaya Maritime & Logistics Academy**.
- **Alpha ICT Tech**: "Worked on various mobile, web, server, and desktop projects, utilizing multiple technologies for both in-house platforms and client solutions including Boss Burger ERP system that to manage staff roles, handle orders and expenses and validate mobile payments via transaction scraping"

Experience totals about 3 years of production work (PRODUCT.md: "~3 years").

## 4. Education

| School | Degree | Years | Note |
|---|---|---|---|
| Bahir Dar University (Bahir Dar, Ethiopia) | B.Sc. Computer Science (CV: "Bachelor of science (B.Sc.) in computer science") | 2019–2024 (CV: Oct 2019 – July 2024) | CGPA 3.85 |

---

## 5. Skills / stack

### NTZ (`skills`, grouped; canonical)
| Group | Items |
|---|---|
| Languages | TypeScript, JavaScript, Go |
| Interface | React, Next.js, Vue, Nuxt, TanStack, Tailwind CSS, shadcn/ui, GSAP, Framer Motion, Figma |
| Server | Gin, NestJS, Express, Node.js, tRPC, Prisma, Better Auth, Supabase, Firebase |
| Data | PostgreSQL, SQL Server, MySQL, MongoDB, Redis, SSRS |
| Infrastructure | Docker, Linux, Windows Server, GitHub Actions, Jenkins, Turborepo |

The ntz comment lists what was cut on purpose: "editors and apps (VS Code, Arc, Warp, Postman, Insomnia, Lightroom, DaVinci), package managers and bundlers (pnpm, Vite), HTML5, and languages the CV doesn't claim (Java, Python, C#)."

### CV skills (verbatim)
- Programming Language - JavaScript, TypeScript, Go
- Frontend Development - React.js, Next.js, Vue.js, Tailwind CSS, shadcn/ui, Redux, Figma, Tanstack
- Backend Development -Gin, Nest.js, Express.js, Prisma, BetterAuth, TRPC, Microservice, Turborepo

### OLD "My Toolkit" (`src/sections/skills.tsx`)
- Web Development: React.js, Next.js, Vue.js, Nuxt.js, Type Script, Java Script, HTML5, Tailwind CSS, shadcn/ui, PNPM, Vite, Turborepo, Framer Motion, TanStack
- Backend Development: Golang, Nest.js, Express.js, Node.js, Gin, Prisma ORM, PostgreSQL, MySQL, MongoDB, Firebase, Better Auth, TRPC, Redis
- DevOps: Git, GitHub, GitHub Actions, Monorepo, Docker, Linux, Jenkins

Icon PNG/SVG files for most of these are in `natnael-portfolio-website/src/assets/icons/`, but ntz rejected skill-icon grids as filler.

---

## 6. Services
There is no services section. ntz cut it on purpose: "services (he's an engineer, not an agency)" (`docs/design-direction.md` §4). The closest wording is:
- "I like the whole path: designing the interface in Figma, building it, and wiring it to the APIs and servers it depends on."
- The roles from PRODUCT.md: full-stack (TS + Go), frontend / creative developer, backend / systems engineer.
- The project roles: integration, API design, infrastructure; full-stack development; design and full-stack development.

## 7. Testimonials
**None exist.** PRODUCT.md says they are absent and must not be fabricated, and design-direction.md cuts them.

---

## 8. Contact and socials

| Channel | Label / handle | URL | Sources |
|---|---|---|---|
| Email | nathanaeltadelez@gmail.com | `mailto:nathanaeltadelez@gmail.com` | NTZ, OLD, CV |
| Phone | (+251) 909-58-5833 → `+251909585833` | `tel:+251909585833` | **CV only.** ntz doesn't show it; ask before publishing |
| LinkedIn | in/natnael-tadele7 | https://www.linkedin.com/in/natnael-tadele7/ | NTZ, OLD |
| GitHub | nata-t | https://github.com/nata-t | NTZ, OLD, CV |
| Telegram | @NATHENAEAL7 | https://t.me/NATHENAEAL7 | NTZ, OLD |
| CV (PDF) | "Download CV" | `/Natnael_Tadele_CV.pdf` (source: `ntz/public/Natnael_Tadele_CV.pdf`) | NTZ |
| CV (online, self.so) | "CV" link in the PDF header | https://www.self.so/natnael-tadele | CV link annotation |
| Old portfolio | "Portfolio Website" link in the PDF header | https://natnael-portfolio-website.vercel.app/ | CV link annotation |
| ntz site (default origin) | | `https://ntz.vercel.app` (fallback for `NEXT_PUBLIC_SITE_URL`) | NTZ layout.tsx |

The PDF also contains a malformed link annotation, `http://nathanaeltadelez@gmail.com`, on the "Email" word. Use `mailto:` instead.

Contact rows in ntz: Email (click to copy → "COPIED" stamp, plus "Write ↗"), LinkedIn, GitHub, Telegram, CV "Download PDF".
OLD contact list: Email, Telegram, Linkedin, Github, shown as icon buttons with tooltips.

## 9. Footer content
- NTZ footer: `© 2026 Natnael Tadele` · `Addis Ababa {HH:MM} GMT+3` · `Next.js · GSAP · three.js` · `Back to top ↑`
- NTZ nav: "ntz" mark + "Natnael Tadele" · Work / About / Contact · "Addis Ababa {time}"
- OLD nav: "Natnael Tadele" in GoldenSignature script · About / Skills / Projects / Contact · theme switch. Back-to-top button labelled "Return".

---

## 10. Projects

ntz features **six** projects in this order: cbe-smart-branch, atm-voice-guidance, ethiopian-shipping-logistics,
babogaya-maritime-academy, koket-investment, minte-and-geni. Four further projects exist only in OLD and were
**cut on purpose** by ntz: "Jewelry Shop dashboard, Finot Hulentenawi Lemat, the Remedial Tutorial bot and Boss Burger ERP" ("Cut projects — stay cut", design-direction §6).

Screenshot rules: every public screen is a desktop capture at 1440×900, exported as WebP at 2400×1500 (16:10), `device: "desktop"`. Confidential projects only have 1600×1000 SVG **placeholders** (`device: "photo"`, caption "Placeholder") until real photos from the banks' posts are sourced. Raw PNG captures are in `ntz/assets-src/screens/<slug>/*.png`, which is git-ignored.

Base path for screens: `/home/natnael-tadele/Desktop/kilet/my-projects/ntz/public/work/<slug>/`

---

### 10.1 `cbe-smart-branch` — Smart Branch · CONFIDENTIAL
| Field | Value |
|---|---|
| Title / short | Smart Branch / Smart Branch |
| OLD title | Customer Visit Management (CVM) – Smart Branch System |
| CV title | "Customer Visit Management (CVM)- Smart brunch management system" (typo "brunch" is in the CV) |
| Client | Commercial Bank of Ethiopia |
| Year | 2026 |
| Sector | Banking |
| Role | Integration, API design, infrastructure |
| URL | none (internal; "Runs inside bank networks") |
| Public | **No.** Confidential. Show architecture and facts only |
| Employer | Moti Engineering |

- **Summary (NTZ):** "Customer visit management that runs the floor of CBE's smart branches — live in six branches and the head office."
- **Long (OLD and CV):** "Implemented a customer visit management platform for Commercial Bank of Ethiopia, digitizing branch operations through vendor software integration, custom API design, and infrastructure setup, currently live across 6 smart branches and the head office."
- **Before [REVIEW]:** "Every visit queued and logged at the counter, one branch at a time."
- **Built:** "Integrated the vendor's visit-management software with the bank's systems" · "Designed the custom APIs between them in Go and Gin" · "Set up the Windows Server and SQL Server infrastructure, with SSRS reporting"
- **Facts:** `6` smart branches live · `+1` head office
- **Stack:** Go, Gin, SQL Server, SSRS, SSMS, Windows Server. OLD also lists "SQL Reporting Services" and "API Design".
- **Stage [REVIEW]:** "On the branch floor," / "it runs the queue"
- **Diagram [REVIEW]:** Branch floor (6 smart branches + head office) → visits → Visit management (Vendor software) → events → **Integration API (Go · Gin)** → lookups → Bank systems; API → writes → **SQL Server (Windows Server)** → queries → **Reporting (SSRS)**. Bold marks Natnael's part. Caption: "Simplified architecture. The system is internal to the bank, so the software itself isn't shown."
- **Screens [REVIEW]: placeholders** (1600×1000 SVG). The `alt` text says what each photo should show:
  1. `placeholder-1.svg`: "A smart branch from the street". Note: "Six branches and the head office, / running on one system."
  2. `placeholder-2.svg`: "Ticket kiosk on a smart-branch floor". Note: "Every visit starts at the kiosk; / the floor knows who's next."
  3. `placeholder-3.svg`: "A customer holding a queue ticket". Note: "One ticket per visit, / logged from the moment it prints."
  4. `placeholder-4.svg`: "Queue display calling a ticket to a counter". Note: "The display calls each ticket / to the counter that's free."
  5. `placeholder-5.svg`: "A teller serving a customer at a counter". Note: "Each counter sees the visit / before the customer sits down."
  6. `placeholder-6.svg`: "Visit report from the head office". Note: "Head office sees every branch / in the same SSRS reports."
- **Files:** `/home/natnael-tadele/Desktop/kilet/my-projects/ntz/public/work/cbe-smart-branch/placeholder-{1..6}.svg`

### 10.2 `atm-voice-guidance` — Voice Guidance · CONFIDENTIAL
| Field | Value |
|---|---|
| Title / short | Voice Guidance / Voice Guidance |
| OLD title | Voice Guidance – ATM Accessibility System |
| Client | 39 Ethiopian banks |
| Year | 2026 |
| Sector | Banking · Accessibility |
| Role | Integration, API design, infrastructure |
| URL | none |
| Public | **No.** Confidential |
| Employer | Moti Engineering |

- **Summary (NTZ):** "A voice layer that lets visually impaired customers use an ATM on their own, deployed on thousands of machines across 39 banks."
- **Long (OLD):** "Built a voice guidance system enabling ATM accessibility for visually impaired users, deployed across thousands of ATMs spanning 39 banks. Led vendor software integration, API design, and infrastructure setup to bring the system live at scale."
- **Before:** "An ATM screen a blind customer couldn't read without asking a stranger."
- **Built:** "Integrated the vendor's voice-guidance software with the ATM network" · "Designed the APIs that drive it in Go and Gin" · "Set up the infrastructure that brought it live at national scale"
- **Facts:** `39` banks · `1,000s` of ATMs
- **Stack:** Go, Gin, API design
- **Stage [REVIEW]:** "On thousands of ATMs," / "it speaks"
- **Diagram:** Customer (Visually impaired) → audio → ATM (Thousands, 39 banks) → screen state → Voice guidance (Vendor software) → requests → **Guidance API (Go · Gin)** → runs on → **Infrastructure (Deployment & hosting)**. Caption: "Simplified architecture. The system runs inside bank networks, so the software itself isn't shown."
- **Extra in ntz:** a "Read this page aloud" control that uses browser speech synthesis (`components/case/ReadAloud.tsx`).
- **Screens [REVIEW]: placeholders:**
  1. "A row of ATMs from different banks". Note: "Live on thousands of machines / across 39 banks."
  2. "Headphone jack on an ATM fascia". Note: "Plug in headphones / and the machine starts talking."
  3. "A customer using an ATM with headphones". Note: "Every step read aloud, / so no one has to ask a stranger."
  4. "Close-up of the ATM keypad's raised marks". Note: "The keypad guides the fingers; / the voice guides the rest."
  5. "A customer taking cash from the ATM". Note: "From card in to cash out, / unassisted."
  6. "The voice guidance launch event". Note: "Launched with the banks / for visually impaired customers."
- **Files:** `/home/natnael-tadele/Desktop/kilet/my-projects/ntz/public/work/atm-voice-guidance/placeholder-{1..6}.svg`

### 10.3 `ethiopian-shipping-logistics` — Ethiopian Shipping & Logistics · PUBLIC
| Field | Value |
|---|---|
| Title / short | Ethiopian Shipping & Logistics / ESL |
| Client | Ethiopian Shipping & Logistics |
| Year | 2025 **[REVIEW]**: built during the Koket role (Jun 2025 – Mar 2026); the exact year is unknown |
| Sector | Logistics |
| Role | Full-stack development |
| URL | https://esl.et |
| Public | Yes. Screens are public pages only; the dashboards are behind a login |
| Employer | Koket Investment |

- **Summary (NTZ):** "One platform for the clients, staff and admins of Ethiopia's national shipping line: service requests, shipment tracking and internal workflow."
- **Long (OLD):** "The ESL Website Development Project digitizes customer and internal operations with unified client, staff, and admin dashboards, enabling online service requests, shipment tracking, workflow management, and improved efficiency across Ethiopia's logistics system."
- **Long (CV):** "Developed a platform for Ethiopian Shipping and Logistics, digitizing customer and internal operations through unified client, staff, and admin dashboards, enabling online service requests, shipment tracking, and improved efficiency across Ethiopia's logistics system."
- **Before [REVIEW]:** "Service requests, tracking and hand-offs spread across offices, forms and phone calls."
- **Built:** "Client dashboard for online service requests and shipment tracking" · "Staff dashboard for workflow management" · "Admin dashboard over both"
- **Facts:** `3` dashboards: client, staff, admin
- **Stack:** React, TanStack, shadcn/ui, Tailwind CSS, Zod, Framer Motion
- **Stage [REVIEW]:** "For a national shipping line," / "one front door"
- **Diagram [REVIEW]:** Client / Staff / Admin dashboards (all Natnael's) → ESL services (Back end)
- **Screens** (2400×1500 WebP, shown in this order; alt text from `content/screens.ts`; notes are [REVIEW]):
  | File | Page captured | Alt | Note |
  |---|---|---|---|
  | `home.webp` | https://esl.et/ | The ESL home page, with shipment tracking in the hero | Tracking up front on the home page: / one number, the shipment's route. |
  | `self-services.webp` | /en/self-services | ESL's self-services: quotation, booking, container deposit and container release | Quotes, bookings, deposits and releases, / each one a request away. |
  | `about.webp` | /en/about-us | The history of ESL on the About page, told in four periods from 1956 | Seventy years of the line, / told in four periods. |
  | `news.webp` | /en/news-and-media/news | ESL news, led by a public notice to importers | Notices and news for importers / and everyone who ships with ESL. |
  | `contact.webp` | /en/contact-us | The ESL contact page with a map and an enquiry form | Where to find ESL, / and a form to reach it. |
  | `vessels.webp` | /en/vessel | The ESL fleet page: each vessel with its type, build year and tonnage | The fleet, ship by ship: / type, build year and tonnage. |
- **Files:** `/home/natnael-tadele/Desktop/kilet/my-projects/ntz/public/work/ethiopian-shipping-logistics/{home,self-services,about,news,contact,vessels}.webp`
- Brand colours sampled from the screenshots: green `#006A31`, yellow `#F9CA0F`.

### 10.4 `babogaya-maritime-academy` — Babogaya Maritime & Logistics Academy · PUBLIC
| Field | Value |
|---|---|
| Title / short | Babogaya Maritime & Logistics Academy / BMLA |
| Client | Babogaya Maritime & Logistics Academy |
| Year | 2025 **[REVIEW]** |
| Sector | Education |
| Role | Full-stack development |
| URL | https://bmla.esl.et/ |
| Public | Yes (public pages only) |
| Employer | Koket Investment |

- **Summary (NTZ):** "Student, instructor and admin dashboards for a maritime academy: course delivery, assessments, announcements and performance tracking."
- **Long (OLD, title spelled "Babogaya maritime and Logisics Academy"):** "The Babogaya Maritime and Logistics Academy website digitizes maritime education with student, instructor, and admin dashboards, supporting course delivery, assessments, announcements, and performance tracking for improved learning and streamlined academic management."
- **Long (CV):** "Developed a platform for Babogaya Maritime and Logistics Academy, digitizing maritime education through student, instructor, and admin dashboards, supporting course delivery, assessments, and performance tracking for improved learning and academic management."
- **Before [REVIEW]:** "Courses, grades and announcements kept on paper and noticeboards."
- **Built:** "Student dashboard: courses, assessments and results" · "Instructor dashboard: delivery, grading and announcements" · "Admin dashboard for academic management"
- **Facts:** `3` roles: student, instructor, admin
- **Stack:** React, TanStack, shadcn/ui, Tailwind CSS, Zod, Framer Motion
- **Stage [REVIEW]:** "For a maritime academy," / "a campus online"
- **Screens:**
  | File | Page | Alt | Note [REVIEW] |
  |---|---|---|---|
  | `home.webp` | / | The BMLA home page announcing unlimited deck and engine officer courses | The home page opens on / the academy's latest news. |
  | `about.webp` | / (#About Babogaya) | About the academy, beside its accreditations and figures | Founded in 2009 on a crater lake, / 6,000+ seafarers trained since. |
  | `programs.webp` | /academics/program-structure | The program structure: STCW courses from Chief Mate to Basic Safety Training | Every programme in one structure, / from Chief Mate to Basic Safety Training. |
  | `admission.webp` | /admission | Admission, course by course, with code, start date, price and pass mark | Admission course by course: / start date, price and pass mark. |
  | `student-life.webp` | /student-life | Student life: workshop photos and the digital library | Workshops and the digital library: / what studying there looks like. |
  | `explore.webp` | / (#Explore the Babogaya) | Four ways into the academy: life at sea, the curriculum, applying online and the campus | Life at sea, the curriculum, applying / and the campus, one click each. |
- **Files:** `/home/natnael-tadele/Desktop/kilet/my-projects/ntz/public/work/babogaya-maritime-academy/{home,about,programs,admission,student-life,explore}.webp`
- Brand colours sampled: green `#056333`, plus yellow sign-up button.

### 10.5 `koket-investment` — Koket Investment · PUBLIC
| Field | Value |
|---|---|
| Title / short | Koket Investment / Koket |
| Client | Koket Investment |
| Year | 2025 **[REVIEW]** |
| Sector | Corporate |
| Role | Senior full-stack developer |
| URL | https://koketinvestment.com/ |
| Public | Yes |
| Employer | Koket Investment (his own employer) |

- **Summary (NTZ):** "The corporate site for a group spanning design-and-build, digital solutions and trading, built in a Turborepo monorepo."
- **Long (OLD and CV):** "Developed a modern, user-friendly website for Koket Investment, showcasing their design and build, digital solutions, and trading services while reflecting their innovation, excellence, and commitment to empowering clients and communities."
- **Before [REVIEW]:** "A company introduced through a printed profile, folded in three."
- **Built:** "Corporate website presenting the group's three business lines" · "Turborepo monorepo shared across the team's projects"
- **Facts:** `3` business lines
- **Stack:** React, TanStack, shadcn/ui, Tailwind CSS, Zod, Framer Motion, Turborepo. OLD also lists "Monorepo".
- **Stage [REVIEW]:** "Folded in three," / "now unfolded"
- **Screens:**
  | File | Page | Alt | Note [REVIEW] |
  |---|---|---|---|
  | `home.webp` | / | The Koket Investment home page with an aerial render of a head office design | The construction line up front, / an aerial render in the hero. |
  | `specializations.webp` | / (#Our Specialization Areas) | The group's specialization areas, one picture each | Three business lines, / one picture each. |
  | `about.webp` | /about | What Koket is all about, with counts of projects and clients | What the group does, / with the numbers behind it. |
  | `software.webp` | /software | The software line, showing the ESL website on a laptop | The software line's showcase: / the ESL site, built by the same team. |
  | `contact.webp` | /contact | The contact page with a map and an enquiry form by service | A contact form that asks / which line you need. |
  | `projects.webp` | /projects | Client projects, each with its gallery of renders | Client projects in detail, / renders and all. |
- **Files:** `/home/natnael-tadele/Desktop/kilet/my-projects/ntz/public/work/koket-investment/{home,specializations,about,software,contact,projects}.webp`
- Brand colours sampled: near-black nav `#181B18`, dark slate `#183048`, ochre `#907800`.

### 10.6 `minte-and-geni` — Minte & Geni · PUBLIC (personal)
| Field | Value |
|---|---|
| Title / short | Minte & Geni / Minte & Geni |
| OLD title | Minte & Geni – Wedding Website |
| Client | "My sister's wedding" |
| Year | 2026 **[REVIEW]**: "the site shows the wedding on 1 Feb 2026" (also printed on the card artifact as "01 · 02 · 2026") |
| Sector | Personal |
| Role | Design and full-stack development |
| URL | https://minte-and-geni.vercel.app/ |
| Public | Yes |

- **Summary (NTZ):** "A wedding site I built for my sister: downloadable thank-you cards, guest photo uploads, a wish board and a gallery, with a Telegram bot on the back end."
- **Long (OLD):** "This is a simple full-stack wedding website I built for my sister's wedding with a thank-you card download, guest photo sharing (uploads), a virtual sign/wish board, a gallery, Supabase storage, and Telegram bot integration."
- **Before:** "A guestbook, a box of printed photos and thank-you cards written by hand."
- **Built:** "Thank-you card generator and download, drawn with Konva" · "Guest photo sharing on Supabase storage" · "A virtual wish board and gallery" · "Telegram bot integration on the back end"
- **Facts:** `4` things guests can do
- **Stack:** React, TypeScript, Tailwind CSS, shadcn/ui, React Query, GSAP, Konva, Express, Supabase, Telegram Bot API
- **Stage [REVIEW]:** "For my sister's wedding," / "a site for guests"
- **Screens:**
  | File | Section | Alt | Note [REVIEW] |
  |---|---|---|---|
  | `home.webp` | / | The wedding site's home page: the couple, the date and the thank-you card | The couple and the date: / the first thing a guest sees. |
  | `dates.webp` | SAVE THE DATES | Save the dates: the invitation beside a calendar with the day circled | The invitation, / with the day circled on the calendar. |
  | `sign-board.webp` | Digital Sign Board | The digital sign board, where guests leave wishes on a photo | A sign board for wishes: / write, draw or just sign. |
  | `locations.webp` | Locations | Locations: the groom's house, the bride's house and the church, with times | Where to be and when, / from the groom's house to the church. |
  | `thank-you.webp` | THANK YOU CARD | The thank-you card download, with sample cards | A thank-you card for every guest, / drawn and ready to download. |
  | `pictures.webp` | GUEST PICTURES | Guest pictures fanned out, with buttons to share by upload or Telegram | Guests share their pictures / by upload or through the Telegram bot. |
- **Files:** `/home/natnael-tadele/Desktop/kilet/my-projects/ntz/public/work/minte-and-geni/{home,dates,sign-board,locations,thank-you,pictures}.webp`
- The home page shows Amharic copy and the headline "LOVE NEVER FAILS". Palette: cream `#FBF8F0` with rose-gold / terracotta type.

### 10.7 Cut projects (OLD only; ntz decided "stay cut")
| Title | Description (verbatim) | Stack | Link | Source |
|---|---|---|---|---|
| The remedial tutorial – Telegram Bot | "A full-stack Telegram bot with a WebView (Telegram Web App) and long polling. Includes a registration form, admin approve/reject flow, and gated premium channels where users can join only after approval." | React, Shadcn UI, TanStack React Form, Express, Supabase, Telegram Bot | https://t.me/the_remedial_tutorial_bot | (none) |
| Jewelry Shop – Management Dashboard | "A dual-purpose platform with a landing page for customers and a dashboard for store management. Focused on UI/UX and frontend design." | Vue, GSAP, Vuex, PrimeVue, Figma | http://164.160.187.146:5161/ | https://github.com/nata-t/jewelry-shop.git |
| Finot Hulentenawi Lemat | "Developed a professional website for Finot Hulentenawi Lemat (FHL), a nonprofit organization dedicated to inclusive, sustainable development and supporting marginalized groups—especially women, girls, and children—through community-focused programs and interventions." | React, Shadcn UI, Figma, Zod, Tailwind CSS | (disabled) | https://github.com/nata-t/finot-lulentenawi-lemat.git |
| Boss Burger ERP (Alpha ICT Tech) | Appears only in the experience text: "staff roles, orders, expenses and mobile-payment validation" (CV: "validate mobile payments via transaction scraping") | — | — | — |

There are no screenshots for any cut project.

---

## 11. Other assets

| Asset | Path | Notes |
|---|---|---|
| CV PDF | `/home/natnael-tadele/Desktop/kilet/my-projects/ntz/public/Natnael_Tadele_CV.pdf` | 98 KB, 1 page, US Letter |
| Portrait: shader source | `/home/natnael-tadele/Desktop/kilet/my-projects/ntz/public/portrait/source.webp` | 787×1100, luminance + cutout alpha |
| Portrait: halftone | `/home/natnael-tadele/Desktop/kilet/my-projects/ntz/public/portrait/halftone.png` | 787×1100, 45° ink halftone on transparent |
| Portrait: dither | `/home/natnael-tadele/Desktop/kilet/my-projects/ntz/public/portrait/dither.png` | 786×1098, 8×8 Bayer 1-bit, paper colour |
| Portrait: original | `ntz/assets-src/portrait-original.webp` | **Must never ship unprocessed** (PRODUCT.md) |
| OG image | `ntz/public/og.png` | 1200×630, rendered from `ntz/scripts/og/og.html` |
| Icon | `ntz/public/icon.svg` | the ntz mark |
| Grain tile | `ntz/public/grain.png` | paper texture (unused now: `--grain: none`) |
| Brand concepts | `ntz/brand/concepts/*.svg` | 15 ntz mark explorations (git-ignored) |
| OLD media | `natnael-portfolio-website/public/{memoji.mp4, photo-dwight.jpg, 3d_hero.glb, spaceman.glb}` | old-site leftovers; probably not for reuse |

---

## 12. Everything flagged [REVIEW] (from `ntz/docs/review.md` + inline `// REVIEW`)

| Where | Current copy | Why |
|---|---|---|
| Smart Branch · `before` | Every visit queued and logged at the counter, one branch at a time. | Inferred from "digitizing branch operations" |
| Smart Branch · `stage` | "On the branch floor," / "it runs the queue" | Written for the screens section |
| Smart Branch · `screens` | 6 placeholders | Need photos from the bank's posts |
| Voice Guidance · `stage` | "On thousands of ATMs," / "it speaks" | Written for the site |
| Voice Guidance · `screens` | 6 placeholders | Need photos of the machines |
| ESL · `year` | 2025 | Exact year unknown (Koket role, Jun 2025 – Mar 2026) |
| ESL · `before` | Service requests, tracking and hand-offs spread across offices, forms and phone calls. | Inferred |
| ESL · `stage`, notes, diagram | "For a national shipping line," / "one front door" | Written for the site |
| BMLA · `year` | 2025 | Same as ESL |
| BMLA · `before` | Courses, grades and announcements kept on paper and noticeboards. | Inferred |
| BMLA · `stage`, notes, diagram | "For a maritime academy," / "a campus online" | Written for the site |
| Koket · `year` | 2025 | Same as ESL |
| Koket · `before` | A company introduced through a printed profile, folded in three. | Written for the artifact |
| Koket · `stage`, notes, diagram | "Folded in three," / "now unfolded" | Written for the site |
| Minte & Geni · `year` | 2026 | The live site shows the wedding on 1 Feb 2026 |
| Minte & Geni · `stage`, notes, diagram | "For my sister's wedding," / "a site for guests" | Written for the site |
| Both bank diagrams | Node names and edge labels | Check nothing reads as confidential |
| Screenshot alt text | `scripts/optimize-screens.py` → `COPY` | Public pages only |

### Inconsistencies spotted
- The CV says "Babugaya Marine Academy" and "Smart brunch"; OLD says "Babogaya maritime and Logisics Academy". Use **Babogaya Maritime & Logistics Academy** and **Smart Branch**.
- Phone number appears only in the CV.
- `ntz/DESIGN.md` documents paper `#f1ebdf` and paper-ink `#ece6d9`, but the shipped `app/globals.css` now sets `--color-paper: #ffffff` and `--color-sys-ink: #ffffff`, with canary and pink aliased to paper and `--grain: none`. The ntz palette was flattened after DESIGN.md was written.
