import { Hero } from "@/components/hero/Hero";
import { Features } from "@/components/home/Features";
import { MenuTeaser } from "@/components/home/MenuTeaser";
import { Reviews } from "@/components/Reviews";
import { LocationBlock } from "@/components/Location";
import { Reveal, SectionHead, Ticker } from "@/components/Section";
import { MENU } from "@/lib/menu";

const specialtyCount = MENU.filter((m) => m.category === "specialty").length;

export default function Home() {
  return (
    <>
      <Hero />
      <Ticker items={["Brick oven", "Est. 2006", "212 W Broadway", "NY-style", "22-inch pies", "Draft beer", "Dogs welcome on the wall"]} />

      <section className="mx-auto max-w-[1440px] px-4 py-24 sm:px-8 md:py-32">
        <SectionHead
          index="01"
          eyebrow="House legends"
          title={<>Big pies.<br />Bigger <span className="text-amber">legacy.</span></>}
          aside={<p className="text-ash">Three things Frankfort comes back for: the biggest pie in the oven, the lunchtime slice, and a wall covered in good dogs.</p>}
        />
        <div className="mt-12">
          <Features />
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-[var(--line)] bg-iron">
        <div className="pointer-events-none absolute -left-40 top-1/2 h-[40rem] w-[40rem] -translate-y-1/2 rounded-full bg-brick/15 blur-[140px]" aria-hidden />
        <div className="relative mx-auto grid max-w-[1440px] gap-14 px-4 py-24 sm:px-8 md:grid-cols-[1.4fr_1fr] md:py-32">
          <Reveal>
            <p className="eyebrow">02 · Since 2006</p>
            <p className="mt-6 font-serif text-[clamp(1.9rem,3.6vw,3.4rem)] leading-[1.12] text-cream">
              Buddy&rsquo;s was founded in 2006 by <em className="text-amber">Mike Hedden</em>, a Frankfort chef who learned his craft in California&rsquo;s Sonoma County. He named it for Buddy, one of the greatest dogs that ever walked the earth.
            </p>
            <p className="mt-6 max-w-xl text-ash">
              Twenty years later the crew still hand-tosses every crust and fires it on the bricks, carrying Mike&rsquo;s legacy forward on West Broadway.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)]">
              {[
                ["2006", "Year the oven was lit"],
                ['22"', "Our biggest pie"],
                [String(specialtyCount), "Specialty pies"],
                ["Draft", "& bottled beer"],
              ].map(([v, l]) => (
                <div key={l} className="bg-iron p-6">
                  <dt className="sr-only">{l}</dt>
                  <dd>
                    <span className="display block text-6xl text-cream">{v}</span>
                    <span className="mt-2 block font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ash">{l}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-[1440px] scroll-mt-24 px-4 py-24 sm:px-8 md:py-32">
        <SectionHead index="03" eyebrow="On the bricks" title={<>Pick your <span className="text-amber">fire.</span></>} />
        <div className="mt-10">
          <MenuTeaser />
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-8 md:pb-32">
        <SectionHead index="04" eyebrow="Word on Broadway" title={<>Frankfort <span className="text-amber">says.</span></>} />
        <div className="mt-10">
          <Reviews />
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-8 md:pb-32">
        <SectionHead
          index="05"
          eyebrow="Find the oven"
          title={<>Downtown, <span className="text-amber">by the tracks.</span></>}
          aside={<p className="text-ash">Right in Frankfort&rsquo;s historic downtown. A short walk from the Old State Capitol. Park on Broadway or a block over.</p>}
        />
        <div className="mt-10">
          <LocationBlock />
        </div>
      </section>
    </>
  );
}
