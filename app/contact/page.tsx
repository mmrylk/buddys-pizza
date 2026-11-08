import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { HoursList, MapFrame, ParkingButton, RouteFinder } from "@/components/Location";
import { Reveal, SectionHead } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Visit, Hours & Catering",
  description: "Buddy's Pizza, 212 W Broadway St, Frankfort, KY. Open Tue–Fri 11–9, Sat 12–9. Call (502) 352-2920 or send a catering request.",
};

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 top-0 h-[40rem] w-[40rem] rounded-full bg-brick/25 blur-[140px]" aria-hidden />
        <div className="relative mx-auto max-w-[1440px] px-4 pb-16 pt-32 sm:px-8 md:pt-40">
          <StatusBadge />
          <h1 className="display mt-6 text-[clamp(4.5rem,14vw,12rem)]">
            Come <span className="text-amber">by.</span>
          </h1>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Reveal className="md:col-span-2">
              <a
                href={SITE.phoneHref}
                className="group flex h-full flex-col justify-between gap-10 rounded-3xl bg-amber p-8 text-coal transition-transform hover:-translate-y-1"
              >
                <span className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em]">
                  Tap to call <Phone size={20} className="transition-transform group-hover:rotate-12" />
                </span>
                <span className="display text-[clamp(3rem,8vw,7rem)] leading-[0.85]">{SITE.phone}</span>
              </a>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="glass h-full rounded-3xl p-7">
                <p className="eyebrow">Hours</p>
                <div className="mt-3"><HoursList /></div>
                <p className="mt-4 text-xs text-ash">Slices &amp; lunch plates Tue–Fri, 11 AM – 2 PM.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-8">
        <SectionHead index="01" eyebrow="Location" title={<>212 W <span className="text-amber">Broadway.</span></>} />
        <div className="mt-10 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <MapFrame className="aspect-[4/3] lg:aspect-auto lg:min-h-[480px]" />
          <div className="flex flex-col gap-4">
            <div className="glass rounded-3xl p-7">
              <address className="not-italic">
                <span className="display block text-4xl">{SITE.street}</span>
                <span className="mt-1 block text-ash">{SITE.city}, {SITE.region} {SITE.zip} · Downtown Historic District</span>
              </address>
              <div className="mt-6 flex flex-wrap gap-2">
                <a href={SITE.directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center rounded-full bg-amber px-5 py-3 font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-coal">
                  Directions
                </a>
                <ParkingButton className="flex-1" />
              </div>
            </div>
            <RouteFinder />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-28 sm:px-8">
        <SectionHead
          index="02"
          eyebrow="Catering & contact"
          title={<>Feeding a <span className="text-amber">crowd?</span></>}
          aside={<p className="text-ash">Office lunches, team parties, game days. Tell us the headcount and date, and the crew will put together a plan. A few 22&Prime; pies go a long way.</p>}
        />
        <div className="mt-10 max-w-3xl">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
