"use client";
import Link from "next/link";
import { ArrowUpRight, Dog } from "lucide-react";
import { TiltCard } from "../TiltCard";
import { Reveal } from "../Section";
import { useStoreStatus } from "../StatusBadge";
import { useUI } from "@/lib/ui";

const area = (d: number) => Math.round(Math.PI * (d / 2) ** 2);

export function Features() {
  const status = useStoreStatus();
  const openItem = useUI((s) => s.openItem);

  return (
    <div className="grid gap-4 md:grid-cols-6">
      {/* Great Dane */}
      <Reveal className="md:col-span-4 md:row-span-2">
        <TiltCard className="rounded-[2rem]" max={5}>
          <article className="relative flex h-full min-h-[520px] flex-col justify-between overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[radial-gradient(120%_120%_at_100%_0%,#3a0d06_0%,#1a1a1a_55%)] p-8 md:p-10">
            <div className="relative z-10 max-w-md">
              <p className="eyebrow">01 · The Great Dane</p>
              <h3 className="display mt-4 text-[clamp(3.5rem,8vw,7rem)] text-cream">
                Twenty-two
                <br />
                <span className="text-amber">inches.</span>
              </h3>
              <p className="mt-5 max-w-sm text-ash">
                Our Ex Large pie is {area(22)} square inches of brick-oven crust. That&rsquo;s more than three 12&Prime; pies. Bring the whole crew and see who taps out first.
              </p>
            </div>
            <svg viewBox="0 0 240 240" className="absolute -bottom-24 -right-24 w-[22rem] opacity-80 lg:-bottom-20 lg:-right-10 lg:w-[30rem]" aria-hidden>
              {[
                { d: 22, c: "#E5A93C", o: 0.9 },
                { d: 16, c: "#FDFBF7", o: 0.55 },
                { d: 12, c: "#B22222", o: 0.9 },
              ].map(({ d, c, o }) => (
                <g key={d}>
                  <circle cx="120" cy="120" r={d * 5} fill="none" stroke={c} strokeOpacity={o} strokeWidth="1.5" strokeDasharray={d === 22 ? "0" : "3 4"} />
                  <text x={120} y={120 - d * 5 + 14} textAnchor="middle" fill={c} fillOpacity={o} fontFamily="var(--font-dm-mono)" fontSize="9" letterSpacing="2">
                    {d}&quot; · {area(d)} SQ IN
                  </text>
                </g>
              ))}
            </svg>
            <div className="relative z-10 mt-10 flex flex-wrap gap-3">
              <button onClick={() => openItem("byo-cheese")} className="rounded-full bg-amber px-6 py-3 font-mono text-[0.72rem] font-medium uppercase tracking-[0.16em] text-coal">
                Build a 22&Prime; from $25
              </button>
              <Link href="/menu" className="rounded-full border border-[var(--line-strong)] px-6 py-3 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-cream hover:border-amber">
                All specialty pies
              </Link>
            </div>
          </article>
        </TiltCard>
      </Reveal>

      {/* Slices */}
      <Reveal className="md:col-span-2" delay={0.08}>
        <TiltCard className="rounded-[2rem]">
          <button onClick={() => openItem("ny-slice")} className="relative flex h-full min-h-[250px] w-full flex-col justify-between overflow-hidden rounded-[2rem] bg-amber p-7 text-left text-coal">
            <svg viewBox="0 0 100 100" className="absolute -right-6 -top-4 h-40 w-40 rotate-12" aria-hidden>
              <path d="M50 4 L94 88 Q50 104 6 88 Z" fill="#B97F1F" />
              <path d="M50 14 L86 84 Q50 96 14 84 Z" fill="#F6E3A6" />
              {[[44, 46], [58, 62], [40, 72], [62, 80]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6" fill="#B22222" />)}
            </svg>
            <p className="eyebrow relative text-coal/70">02 · Giant NY slices</p>
            <div className="relative">
              <h3 className="display text-6xl">Fold it.</h3>
              <p className="mt-2 text-sm text-coal/80">Plate-hanging New York slices, Tue–Fri 11 AM – 2 PM.</p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-coal px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-cream">
                <span className={`h-1.5 w-1.5 rounded-full ${status?.lunchNow ? "bg-emerald-400" : "bg-cream/30"}`} />
                {status == null ? "Checking…" : status.lunchNow ? "Slices on now" : "Back at 11 AM Tue–Fri"}
              </p>
            </div>
          </button>
        </TiltCard>
      </Reveal>

      {/* Dog wall */}
      <Reveal className="md:col-span-2" delay={0.14}>
        <TiltCard className="rounded-[2rem]">
          <Link href="/wall-of-fame" className="brick-wall group relative flex h-full min-h-[250px] flex-col justify-between overflow-hidden rounded-[2rem] p-7">
            <div className="absolute inset-0 bg-gradient-to-t from-coal via-coal/50 to-transparent" aria-hidden />
            <div className="relative flex items-center justify-between">
              <p className="eyebrow">03 · The Dog Wall</p>
              <ArrowUpRight size={18} className="text-amber transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
            </div>
            <div className="relative">
              <div className="mb-4 flex -space-x-3">
                {[-6, 4, -2].map((r, i) => (
                  <span key={i} className="grid h-14 w-12 place-items-center rounded-sm border-[3px] border-amber-deep bg-cream/90 text-coal shadow-lg" style={{ transform: `rotate(${r}deg)` }}>
                    <Dog size={20} />
                  </span>
                ))}
              </div>
              <h3 className="display text-5xl text-cream">Hang your dog.</h3>
              <p className="mt-2 text-sm text-ash">Bring a framed photo of your pup and we&rsquo;ll put it on the wall, Buddy&rsquo;s way.</p>
            </div>
          </Link>
        </TiltCard>
      </Reveal>
    </div>
  );
}
