"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { MENU, type Category } from "@/lib/menu";
import { MenuCard } from "../MenuCard";

const FILTERS: { id: string; label: string; cats: Category[] }[] = [
  { id: "pizzas", label: "Pizzas", cats: ["specialty", "byo"] },
  { id: "calzones", label: "Calzones", cats: ["calzone"] },
  { id: "subs", label: "Subs", cats: ["sandwich"] },
  { id: "sides", label: "Sides & Salads", cats: ["sides", "salad"] },
];

export function MenuTeaser() {
  const [f, setF] = useState(FILTERS[0].id);
  const cats = FILTERS.find((x) => x.id === f)!.cats;
  const items = MENU.filter((m) => cats.includes(m.category)).sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).slice(0, 6);

  return (
    <div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2" role="tablist" aria-label="Menu categories">
        {FILTERS.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={f === x.id}
            onClick={() => setF(x.id)}
            className={`relative shrink-0 rounded-full px-5 py-2.5 font-mono text-[0.72rem] uppercase tracking-[0.16em] transition-colors ${f === x.id ? "text-coal" : "text-cream/80 hover:text-cream"}`}
          >
            {f === x.id && <motion.span layoutId="teaser-pill" className="absolute inset-0 -z-10 rounded-full bg-amber" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <span className="relative">{x.label}</span>
          </button>
        ))}
      </div>
      <motion.div layout className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {items.map((it, i) => (
            <MenuCard key={it.id} item={it} index={i} />
          ))}
        </AnimatePresence>
      </motion.div>
      <Link href="/menu" className="group mt-8 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-amber">
        See the full menu <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
