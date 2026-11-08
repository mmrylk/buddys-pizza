"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { SITE } from "@/lib/site";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

/**
 * Background footage is opt-in: put a loop at /public/media/hero-oven.mp4 and set
 * NEXT_PUBLIC_HERO_VIDEO=/media/hero-oven.mp4. Until then the WebGL fire runs alone.
 */
const VIDEO_SRC = process.env.NEXT_PUBLIC_HERO_VIDEO;
const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const [video, setVideo] = useState(false);
  const words = ["Fired", "in brick.", "Folded", "in Frankfort."];

  return (
    <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-coal">
      {/* Layer 0 — static gradient, painted before JS so nothing shifts */}
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(120%_70%_at_50%_110%,#8b0000_0%,#3a0d06_35%,#0b0a09_70%)]" aria-hidden />
      {/* Layer 1 — background video loop */}
      {VIDEO_SRC && (
        <video
          className={`absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-1000 ${video ? "opacity-60" : "opacity-0"}`}
          src={VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          onPlaying={() => setVideo(true)}
          onError={() => setVideo(false)}
        />
      )}
      {/* Layer 2 — WebGL fire / grain overlay + 3D slice */}
      <div className="absolute inset-0 -z-10">
        <HeroScene video={video} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-coal via-coal/60 to-transparent" aria-hidden />

      <div className="pointer-events-none relative mx-auto w-full max-w-[1440px] px-4 pb-12 pt-32 sm:px-8 md:pb-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="pointer-events-auto">
          <StatusBadge />
        </motion.div>

        <h1 className="display mt-6 max-w-[11ch] text-[clamp(4rem,13vw,12.5rem)] text-cream">
          {words.map((w, i) => (
            <span key={w} className="block overflow-hidden pb-[0.04em]">
              <motion.span
                className={`block ${i % 2 === 1 ? "text-amber" : ""}`}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1, delay: 0.15 + i * 0.09, ease }}
              >
                {w}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease }}
          className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
        >
          <p className="max-w-md font-serif text-[1.45rem] italic leading-snug text-cream/85">
            Frankfort&rsquo;s brick-oven pizzeria. Hand-tossed New York pies, giant slices and oversized calzones on {SITE.street} since 2006.
          </p>
          <div className="pointer-events-auto flex flex-col gap-3 sm:flex-row">
            <Link
              href="/menu"
              className="group inline-flex h-14 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-amber px-8 font-mono text-[0.8rem] font-medium uppercase tracking-[0.18em] text-coal shadow-[0_0_60px_-10px_rgb(229_169_60/0.7)] transition-transform hover:-translate-y-0.5"
            >
              Start online order <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#menu"
              className="inline-flex h-14 items-center justify-center gap-3 whitespace-nowrap rounded-full border border-cream/25 bg-cream/5 px-8 font-mono text-[0.8rem] uppercase tracking-[0.18em] text-cream backdrop-blur-md transition-colors hover:border-amber hover:text-amber"
            >
              Explore menu <ArrowDown size={16} />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
