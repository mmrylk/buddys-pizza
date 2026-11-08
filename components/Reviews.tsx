"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronRight, Star } from "lucide-react";
import { SITE } from "@/lib/site";

type Review = { author: string; rating: number; text: string; when: string };
type Payload = { rating: number; count: number; reviews: Review[]; source: "google" | "static"; url: string };

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-cream/20" fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-amber" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function Reviews() {
  const [data, setData] = useState<Payload | null>(null);
  const [i, setI] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then(setData)
      .catch(() =>
        setData({ rating: SITE.googleRating, count: SITE.googleReviewCount, reviews: [], source: "static", url: SITE.mapsSearchUrl }),
      );
  }, []);

  const n = data?.reviews.length ?? 0;
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => !paused.current && setI((x) => (x + 1) % n), 6500);
    return () => clearInterval(t);
  }, [n]);

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.6fr]">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-brick p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber/30 blur-3xl" aria-hidden />
        <p className="eyebrow relative text-cream/80">Google rating</p>
        {data ? (
          <>
            <p className="display relative mt-4 text-[9rem] leading-[0.8] text-cream">{data.rating.toFixed(1)}</p>
            <div className="relative mt-4"><Stars value={data.rating} size={22} /></div>
            <p className="relative mt-3 font-mono text-sm text-cream/85">
              {data.source === "google" ? data.count.toLocaleString() : `${data.count}+`} reviews
            </p>
          </>
        ) : (
          <div className="relative mt-4 space-y-3">
            <div className="skeleton h-28 w-40 rounded-xl" />
            <div className="skeleton h-5 w-32 rounded" />
          </div>
        )}
        <a href={data?.url ?? SITE.mapsSearchUrl} target="_blank" rel="noopener noreferrer" className="relative mt-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-cream underline-offset-4 hover:underline">
          Read them on Google <ArrowUpRight size={14} />
        </a>
      </div>

      <div
        className="glass relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-3xl p-8"
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => (paused.current = false)}
      >
        {!data ? (
          <div className="space-y-3">
            <div className="skeleton h-6 w-full rounded" />
            <div className="skeleton h-6 w-5/6 rounded" />
            <div className="skeleton h-6 w-2/3 rounded" />
          </div>
        ) : n > 0 ? (
          <>
            <AnimatePresence mode="wait">
              <motion.figure
                key={i}
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <Stars value={data.reviews[i].rating} />
                <blockquote className="mt-5 line-clamp-6 font-serif text-[clamp(1.4rem,2.6vw,2.2rem)] italic leading-snug text-cream">
                  &ldquo;{data.reviews[i].text}&rdquo;
                </blockquote>
                <figcaption className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-ash">
                  {data.reviews[i].author} · {data.reviews[i].when}
                </figcaption>
              </motion.figure>
            </AnimatePresence>
            <div className="mt-8 flex items-center justify-between">
              <div className="flex gap-1.5">
                {data.reviews.map((_, k) => (
                  <button key={k} onClick={() => setI(k)} className={`h-1.5 rounded-full transition-all ${k === i ? "w-8 bg-amber" : "w-3 bg-cream/20"}`} aria-label={`Review ${k + 1}`} />
                ))}
              </div>
              <button onClick={() => setI((x) => (x + 1) % n)} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line-strong)] hover:border-amber" aria-label="Next review">
                <ChevronRight size={18} />
              </button>
            </div>
            <p className="mt-4 text-[0.65rem] text-smoke">Reviews from Google</p>
          </>
        ) : (
          <div className="flex h-full flex-col justify-between">
            <p className="font-serif text-[clamp(1.6rem,3vw,2.6rem)] italic leading-tight text-cream">
              Hundreds of Frankfort regulars have had their say. Pull up a stool and read what they think of the pies.
            </p>
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--line-strong)] px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] hover:border-amber hover:text-amber">
              See all reviews <ArrowUpRight size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
