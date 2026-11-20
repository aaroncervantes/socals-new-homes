import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { AnalyticsScripts } from "@/components/AnalyticsScripts";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const site = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
const title = "SoCal’s New Homes | New Construction Homes in Southern California";
const description =
  "Discover new construction homes, communities, builder incentives and quick move-in opportunities throughout Southern California.";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: title, template: "%s · SoCal’s New Homes" },
  description,
  applicationName: "SoCal’s New Homes",
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "SoCal’s New Homes",
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3efe7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className="bg-paper font-sans text-ink antialiased">
        <AnalyticsScripts />
        {children}
      </body>
    </html>
  );
}
