"use client";
import { Plus, Leaf, Flame, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { type MenuItem, SIZES, startingPrice } from "@/lib/menu";
import { money, cents } from "@/lib/pricing";
import { useUI } from "@/lib/ui";
import { ItemGlyph } from "./ItemGlyph";
import { TiltCard } from "./TiltCard";

export function MenuCard({ item, index = 0 }: { item: MenuItem; index?: number }) {
  const openItem = useUI((s) => s.openItem);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard className="rounded-3xl">
        <button
          onClick={() => openItem(item.id)}
          className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-iron/70 p-5 text-left transition-colors hover:border-amber/40"
          aria-label={`Customize and add ${item.name}`}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brick/20 blur-3xl transition-opacity duration-500 group-hover:opacity-100 md:opacity-0" aria-hidden />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {item.tags.includes("vegetarian") && <Badge icon={<Leaf size={11} />} label="Veg" />}
                {item.tags.includes("spicy") && <Badge icon={<Flame size={11} />} label="Heat" />}
                {item.window === "lunch" && <Badge icon={<Clock size={11} />} label="Tue–Fri 11–2" />}
              </div>
              <h3 className="display mt-3 text-[2rem] text-cream">{item.name}</h3>
            </div>
            <ItemGlyph item={item} className="h-24 w-24 shrink-0 transition-transform duration-700 ease-[var(--ease-liquid)] group-hover:rotate-[24deg] group-hover:scale-110" />
          </div>
          <p className="relative mt-2 line-clamp-3 text-sm leading-relaxed text-ash">{item.description}</p>
          <div className="relative mt-auto flex items-end justify-between gap-3 pt-6">
            {item.sizes ? (
              <dl className="flex gap-4 font-mono text-xs">
                {SIZES.filter((s) => item.sizes?.[s.id] != null).map((s) => (
                  <div key={s.id}>
                    <dt className="text-smoke">{s.label}</dt>
                    <dd className="mt-0.5 text-cream tabular-nums">{money(cents(item.sizes![s.id]!))}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <span className="font-mono text-lg text-cream tabular-nums">{money(cents(startingPrice(item)))}</span>
            )}
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber text-coal transition-transform duration-300 group-hover:rotate-90 group-active:scale-90">
              <Plus size={20} />
            </span>
          </div>
        </button>
      </TiltCard>
    </motion.div>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line-strong)] px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ash">
      {icon}
      {label}
    </span>
  );
}

export function MenuCardSkeleton() {
  return (
    <div className="h-[260px] rounded-3xl border border-[var(--line)] p-5">
      <div className="skeleton h-4 w-16 rounded" />
      <div className="skeleton mt-4 h-8 w-2/3 rounded" />
      <div className="skeleton mt-4 h-3 w-full rounded" />
      <div className="skeleton mt-2 h-3 w-4/5 rounded" />
    </div>
  );
}
