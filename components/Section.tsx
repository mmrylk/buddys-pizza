"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHead({ index, eyebrow, title, aside }: { index: string; eyebrow: string; title: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 border-t border-[var(--line)] pt-6 md:flex-row md:items-end md:justify-between">
      <Reveal>
        <p className="eyebrow flex items-center gap-3">
          <span className="text-smoke">{index}</span>
          <span className="h-px w-8 bg-amber/60" />
          {eyebrow}
        </p>
        <h2 className="display mt-4 text-[clamp(3rem,7.5vw,6.5rem)] text-cream">{title}</h2>
      </Reveal>
      {aside && <Reveal delay={0.1} className="max-w-sm">{aside}</Reveal>}
    </div>
  );
}

export function Ticker({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-[var(--line)] bg-brick py-4 text-cream" aria-hidden>
      <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="display flex items-center gap-10 text-3xl md:text-4xl">
            {t}
            <svg width="18" height="18" viewBox="0 0 20 20">
              <path d="M10 1 L19 18 Q10 21 1 18 Z" fill="#E5A93C" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
