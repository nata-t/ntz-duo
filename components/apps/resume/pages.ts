import page1 from "./page-1.svg";

// The CV's pages as vectors, and the links the PDF carries on them.
// Regenerate both when public/Natnael_Tadele_CV.pdf changes:
//   pdftocairo -svg public/Natnael_Tadele_CV.pdf components/apps/resume/page-1.svg
// and copy each /Link annotation's /Rect (PDF points, origin bottom left)
// and /URI here.

export type PageLink = { label: string; href: string; rect: [x1: number, y1: number, x2: number, y2: number] };
export type Page = { src: string; links: PageLink[] };

const email = "mailto:nathanaeltadelez@gmail.com";
const github = "https://github.com/nata-t";

export const PAGES: Page[] = [
  {
    src: page1.src,
    links: [
      { label: "Email", href: email, rect: [200.79, 748.05, 231.93, 765.14] },
      { label: "Portfolio Website", href: "https://natnael-portfolio-website.vercel.app/", rect: [244.7, 748.05, 343.27, 765.14] },
      { label: "GitHub", href: github, rect: [356.04, 748.05, 394.82, 765.14] },
      { label: "CV (self.so)", href: "https://www.self.so/natnael-tadele", rect: [407.59, 748.05, 422.99, 765.14] },
      { label: "Ethiopian Shipping & Logistics", href: "https://esl.et", rect: [227.1, 301.34, 239.58, 315.42] },
      { label: "Babugaya Marine Academy", href: "https://bmla.esl.et", rect: [281.08, 230.54, 293.56, 244.62] },
      { label: "Koket Investment", href: "https://koketinvestment.com/", rect: [145.45, 160.91, 157.93, 173.81] },
      // The PDF links this footer address as http://; it's an email.
      { label: "Email", href: email, rect: [36, 12.11, 180.98, 26.19] },
      { label: "GitHub", href: github, rect: [456.43, 12.11, 574.36, 26.19] },
    ],
  },
];
