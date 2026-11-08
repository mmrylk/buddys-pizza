import type { Metadata, Viewport } from "next";
import { Anton, DM_Mono, Instrument_Serif, Inter_Tight } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { MobileBar } from "@/components/MobileBar";
import { CartDrawer } from "@/components/CartDrawer";
import { ItemModal } from "@/components/ItemModal";
import { Toaster } from "@/components/Toaster";
import { PizzaCursor } from "@/components/PizzaCursor";
import { SITE } from "@/lib/site";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const instrument = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-instrument", display: "swap" });
const mono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-dm-mono", display: "swap" });
const inter = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Buddy's Pizza — Brick-Oven NY Pizza in Downtown Frankfort, KY", template: "%s · Buddy's Pizza" },
  description:
    "Hand-tossed New York-style brick-oven pizza at 212 W Broadway St, downtown Frankfort, Kentucky. Since 2006. Order online for pickup, delivery or dine-in.",
  openGraph: { type: "website", siteName: SITE.name },
};

export const viewport: Viewport = { themeColor: "#121212", width: "device-width", initialScale: 1, viewportFit: "cover" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: SITE.name,
  servesCuisine: ["Pizza", "Italian"],
  telephone: "+1-502-352-2920",
  foundingDate: "2006",
  address: { "@type": "PostalAddress", streetAddress: SITE.street, addressLocality: SITE.city, addressRegion: SITE.region, postalCode: SITE.zip, addressCountry: "US" },
  geo: { "@type": "GeoCoordinates", latitude: SITE.lat, longitude: SITE.lng },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday"], opens: "11:00", closes: "21:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "12:00", closes: "21:00" },
  ],
  menu: "/menu",
  acceptsReservations: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${instrument.variable} ${mono.variable} ${inter.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-amber focus:px-4 focus:py-2 focus:text-coal">
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <MobileBar />
        <CartDrawer />
        <ItemModal />
        <Toaster />
        <PizzaCursor />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
