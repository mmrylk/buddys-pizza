import type { Metadata } from "next";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata: Metadata = {
  title: "Menu & Online Ordering",
  description: "Specialty brick-oven pies in 12, 16 and 22 inch, build-your-own, calzones, hot sandwiches and salads. Order online from Buddy's Pizza in Frankfort, KY.",
};

export default function MenuPage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(70%_60%_at_80%_0%,rgb(178_34_34/0.35),transparent_70%)]" aria-hidden />
      <header className="relative mx-auto max-w-[1440px] px-4 pb-10 pt-32 sm:px-8 md:pt-40">
        <StatusBadge />
        <h1 className="display mt-6 text-[clamp(4.5rem,15vw,13rem)] text-cream">
          The <span className="text-amber">menu.</span>
        </h1>
        <p className="mt-4 max-w-lg font-serif text-2xl italic text-cream/80">
          Hand-tossed, brick-fired, built to order. Tap anything to customize it.
        </p>
      </header>
      <MenuBrowser />
    </div>
  );
}
