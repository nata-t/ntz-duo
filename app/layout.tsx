import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import MotionProvider from "@/components/motion/MotionProvider";
import { profile } from "@/content/site";
import "./globals.css";

// SF Pro is first in every stack, so Apple devices render the real system
// face. Everyone else gets Inter with its optical-size axis, the closest
// open relative.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", axes: ["opsz"], display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ntz-duo.vercel.app";
const DESCRIPTION =
  "Natnael Tadele is a software engineer in Addis Ababa. His portfolio is a foldable phone: unfold it, open the apps, look around.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${profile.name} — ${profile.title}`, template: `%s — ${profile.name}` },
  description: DESCRIPTION,
  authors: [{ name: profile.name, url: "https://github.com/nata-t" }],
  openGraph: {
    type: "website",
    siteName: "ntz duo",
    title: `${profile.name} — ${profile.title}`,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before first paint: resolve the stored appearance (or the system's)
// so the page never flashes the wrong theme.
const PREPAINT = `(function(){try{var a=localStorage.getItem('duo:appearance')||'auto';var d=a==='dark'||(a==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='light'}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      </head>
      <body>
        <MotionProvider>
          <main id="main">{children}</main>
        </MotionProvider>
      </body>
    </html>
  );
}
