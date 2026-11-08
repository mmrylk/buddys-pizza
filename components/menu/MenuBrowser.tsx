"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Beef, ChefHat, Drumstick, Flame, Leaf, Search, X, Wheat } from "lucide-react";
import { CATEGORIES, GLUTEN_FREE_NOTE, MENU, type Category, type Tag } from "@/lib/menu";
import { useUI } from "@/lib/ui";
import { MenuCard } from "../MenuCard";

const DIETS: { id: Tag; label: string; icon: React.ReactNode }[] = [
  { id: "vegetarian", label: "Vegetarian", icon: <Leaf size={14} /> },
  { id: "meat", label: "Meat lovers", icon: <Beef size={14} /> },
  { id: "chicken", label: "Chicken", icon: <Drumstick size={14} /> },
  { id: "spicy", label: "Heat", icon: <Flame size={14} /> },
  { id: "white", label: "White base", icon: <Wheat size={14} /> },
];

const BLURB: Partial<Record<Category, string>> = {
  specialty: 'Every specialty pie comes 12" Small, 16" Large or 22" Ex Large.',
  byo: "Start with cheese, add as many toppings as you like.",
  sandwich: "Hot, oven-toasted, built big.",
  salad: "Pick a dressing. Add grilled chicken for $3.",
  lunch: "Tuesday to Friday, 11 AM – 2 PM. Choose a pickup time in that window.",
};

export function MenuBrowser() {
  const [q, setQ] = useState("");
  const [diets, setDiets] = useState<Tag[]>([]);
  const [active, setActive] = useState<Category>("specialty");
  const openItem = useUI((s) => s.openItem);
  const tabsRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return MENU.filter((m) => {
      if (diets.length && !diets.some((d) => m.tags.includes(d))) return false;
      if (!needle) return true;
      return `${m.name} ${m.description} ${m.category}`.toLowerCase().includes(needle);
    });
  }, [q, diets]);

  const sections = CATEGORIES.map((c) => ({ ...c, items: filtered.filter((m) => m.category === c.id) })).filter((s) => s.items.length);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id.replace("cat-", "") as Category);
      },
      { rootMargin: "-160px 0px -55% 0px" },
    );
    document.querySelectorAll("[data-cat]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections.length, q, diets]);

  useEffect(() => {
    const tab = tabsRef.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    tab?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  const jump = (id: Category) => {
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 150, behavior: "smooth" });
  };

  const toggleDiet = (d: Tag) => setDiets((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d]));

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search the menu</span>
            <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-smoke" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search pies, subs, toppings… try “pesto”"
              className="h-14 w-full rounded-full border border-[var(--line-strong)] bg-iron/70 pl-13 pr-12 text-cream placeholder:text-smoke focus:border-amber focus:outline-none"
              style={{ paddingLeft: "3.25rem" }}
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-4 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-cream/10" aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </label>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Dietary filters">
            {DIETS.map((d) => {
              const on = diets.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDiet(d.id)}
                  aria-pressed={on}
                  className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-all ${on ? "border-amber bg-amber text-coal" : "border-[var(--line-strong)] text-cream hover:border-amber/60"}`}
                >
                  {d.icon}
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="sticky top-[76px] z-30 mt-8 border-y border-[var(--line)] bg-night/85 backdrop-blur-xl">
        <div ref={tabsRef} className="no-scrollbar mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-4 py-2.5 sm:px-8" role="tablist" aria-label="Menu sections">
          {sections.map((s) => (
            <button
              key={s.id}
              data-tab={s.id}
              role="tab"
              aria-selected={active === s.id}
              onClick={() => jump(s.id)}
              className={`relative shrink-0 rounded-full px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.16em] transition-colors ${active === s.id ? "text-coal" : "text-cream/75 hover:text-cream"}`}
            >
              {active === s.id && <motion.span layoutId="menu-tab" className="absolute inset-0 -z-10 rounded-full bg-amber" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
              <span className="relative">{s.label}</span>
              <span className={`relative ml-1.5 ${active === s.id ? "text-coal/60" : "text-smoke"}`}>{s.items.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-8">
        <AnimatePresence mode="popLayout">
          {sections.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-28 text-center">
              <p className="display text-5xl">Nothing on the bricks.</p>
              <p className="mt-3 text-ash">No items match{q ? ` “${q}”` : ""}. Try another search or clear the filters.</p>
              <button onClick={() => { setQ(""); setDiets([]); }} className="mt-6 rounded-full border border-[var(--line-strong)] px-6 py-3 font-mono text-xs uppercase tracking-[0.16em] hover:border-amber">
                Reset
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {sections.map((s, si) => (
          <section key={s.id} id={`cat-${s.id}`} data-cat className="scroll-mt-40 pt-14">
            <div className="mb-6 flex flex-col justify-between gap-2 md:flex-row md:items-end">
              <h2 className="display text-[clamp(2.6rem,5vw,4.5rem)]">
                <span className="mr-4 font-mono text-sm tracking-[0.2em] text-smoke">{String(si + 1).padStart(2, "0")}</span>
                {s.label}
              </h2>
              {BLURB[s.id] && <p className="max-w-sm text-sm text-ash">{BLURB[s.id]}</p>}
            </div>

            {s.id === "byo" && (
              <button
                onClick={() => openItem("byo-cheese")}
                className="group relative mb-4 flex w-full flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-amber/40 bg-[linear-gradient(120deg,#3a0d06,#1a1a1a_60%)] p-7 text-left md:flex-row md:items-center"
              >
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber/20 blur-3xl" aria-hidden />
                <div className="relative flex items-center gap-5">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-amber text-coal transition-transform duration-500 group-hover:rotate-12">
                    <ChefHat size={28} />
                  </span>
                  <div>
                    <p className="display text-4xl">Open the customizer</p>
                    <p className="mt-1 text-sm text-ash">Size, meats, veggies, specialty toppings. Live price as you build.</p>
                  </div>
                </div>
                <span className="relative font-mono text-xs uppercase tracking-[0.16em] text-amber">12&Prime; $12 · 16&Prime; $15 · 22&Prime; $25 →</span>
              </button>
            )}

            <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {s.items.map((it, i) => (
                  <MenuCard key={it.id} item={it} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          </section>
        ))}

        <p className="mt-16 flex items-center gap-3 rounded-2xl border border-dashed border-[var(--line-strong)] p-5 text-sm text-ash">
          <Wheat size={18} className="shrink-0 text-amber" /> {GLUTEN_FREE_NOTE}
        </p>
      </div>
    </>
  );
}
