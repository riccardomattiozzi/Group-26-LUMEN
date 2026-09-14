import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// IBM Plex Sans: a sober, report-grade sans with true tabular numerals —
// built for tables, figures and dense labels, which is most of this page.
// Self-hosted by next/font (no external request at runtime), exposed as a
// CSS variable that app/globals.css layers in front of the system stack, so
// a failed font load still renders legibly on the platform's own typeface.
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lumen",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LUMEN — Germany Launch Simulator",
  description:
    "An interactive pricing and go-to-market simulator for LUMEN's German market entry: price, channel mix and launch timing for Year 1.",
};

// Lets Safari and mobile browsers tint their own chrome to match the page.
// These two mirror --material in app/globals.css: a <meta> tag can't read
// a CSS variable, so they are the one place a color is repeated.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#161a20" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full antialiased ${plex.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
