import type { Metadata } from "next";
import { Dog } from "lucide-react";
import { Gallery, SubmitDog } from "@/components/wall/DogWall";
import { Reveal, SectionHead } from "@/components/Section";

export const metadata: Metadata = {
  title: "The Dog Wall",
  description: "Buddy's Pizza is named for Buddy, one of the greatest dogs ever. Bring a framed photo of your dog and we'll hang it on the wall — or submit it to the digital Wall of Fame.",
};

const STEPS = [
  ["Frame it", "Print your favorite photo of your dog and put it in a frame. Any size, any style."],
  ["Bring it in", "Drop it off at 212 W Broadway during open hours. Grab a slice while you're here."],
  ["We hang it", "Your pup joins Buddy and the rest of the pack on the wall."],
];

export default function WallPage() {
  return (
    <>
      <section className="brick-wall relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_40%,rgb(229_169_60/0.28),transparent_70%),linear-gradient(to_bottom,rgb(18_18_18/0.55),#121212)]" aria-hidden />
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-14 px-4 pb-24 pt-36 sm:px-8 md:grid-cols-[1.2fr_1fr] md:pt-44">
          <Reveal>
            <p className="eyebrow">The Wall of Fame</p>
            <h1 className="display mt-5 text-[clamp(4.5rem,14vw,12rem)]">
              Good <span className="text-amber">dogs</span> only.
            </h1>
            <p className="mt-6 max-w-xl font-serif text-2xl italic leading-snug text-cream/85">
              Buddy&rsquo;s is named for Buddy, one of the greatest dogs that ever walked the earth. So the walls belong to dogs. Bring us a framed photo of yours and we&rsquo;ll hang it up.
            </p>
            <a href="#submit" className="mt-8 inline-flex h-14 items-center rounded-full bg-amber px-8 font-mono text-xs font-medium uppercase tracking-[0.16em] text-coal">
              Put my dog on the wall
            </a>
          </Reveal>

          <Reveal delay={0.15}>
            <figure className="relative mx-auto w-full max-w-sm rotate-[-2deg]">
              <div className="absolute -inset-10 rounded-full bg-amber/25 blur-3xl" aria-hidden />
              <div className="relative rounded-sm bg-gradient-to-br from-[#e0b04a] via-[#8a5a17] to-[#e8bf5a] p-4 shadow-[0_50px_80px_-30px_rgb(0_0_0)]">
                <div className="bg-[#1d1714] p-6">
                  <div className="relative grid aspect-[4/5] place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#3a2a20,#120d0a)]">
                    <Dog size={150} strokeWidth={0.9} className="text-amber drop-shadow-[0_0_30px_rgb(229_169_60/0.5)]" aria-hidden />
                    <span className="absolute bottom-4 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-amber/70">Our namesake · Since 2006</span>
                  </div>
                </div>
              </div>
              <figcaption className="mx-auto -mt-1 w-3/4 bg-gradient-to-b from-[#e0b04a] to-[#9a6a1f] py-2 text-center shadow-xl">
                <span className="display text-3xl text-coal">Buddy</span>
                <span className="block font-mono text-[0.55rem] uppercase tracking-[0.2em] text-coal/70">The one who started it all</span>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.08} className="bg-night p-8">
              <span className="font-mono text-sm text-amber">0{i + 1}</span>
              <h2 className="display mt-4 text-4xl">{t}</h2>
              <p className="mt-2 text-ash">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="brick-wall relative border-y border-[var(--line)]">
        <div className="absolute inset-0 bg-night/70" aria-hidden />
        <div className="relative mx-auto max-w-[1440px] px-4 py-24 sm:px-8">
          <SectionHead index="01" eyebrow="The digital wall" title={<>The <span className="text-amber">pack.</span></>} aside={<p className="text-ash">Community dogs, approved by the crew. Tap a frame to meet them.</p>} />
          <div className="mt-16">
            <Gallery />
          </div>
        </div>
      </section>

      <section id="submit" className="mx-auto max-w-[1100px] scroll-mt-24 px-4 py-24 sm:px-8">
        <SectionHead index="02" eyebrow="Submit your dog" title={<>Hang <span className="text-amber">yours.</span></>} />
        <div className="mt-10">
          <SubmitDog />
        </div>
      </section>
    </>
  );
}
