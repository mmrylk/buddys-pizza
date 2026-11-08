"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Plus, X } from "lucide-react";
import {
  CALZONE_TOPPING_MAX, GLUTEN_FREE_NOTE, PIZZA_TOPPING_MAX, SIZES, TOPPINGS, getItem, type Size,
} from "@/lib/menu";
import { money, priceLine, toppingCents } from "@/lib/pricing";
import { useCart } from "@/lib/cart";
import { playPop, useUI } from "@/lib/ui";
import { ItemGlyph } from "./ItemGlyph";

export function ItemModal() {
  const { editing, openItem } = useUI();
  const item = editing ? getItem(editing) : undefined;

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && openItem(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, openItem]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div className="fixed inset-0 z-[55] flex items-end justify-center md:items-center md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="absolute inset-0 bg-coal/70 backdrop-blur-sm" onClick={() => openItem(null)} aria-label="Close" tabIndex={-1} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="item-title"
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-[var(--line-strong)] bg-iron md:rounded-[2rem]"
          >
            <Customizer key={item.id} itemId={item.id} onDone={() => openItem(null)} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Customizer({ itemId, onDone }: { itemId: string; onDone: () => void }) {
  const item = getItem(itemId)!;
  const add = useCart((s) => s.add);
  const toast = useUI((s) => s.toast);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [size, setSize] = useState<Size | undefined>(item.sizes ? (item.sizes["16"] != null ? "16" : (Object.keys(item.sizes)[0] as Size)) : undefined);
  const [toppings, setToppings] = useState<string[]>([]);
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => closeRef.current?.focus(), []);

  const max = item.toppings === "calzone" ? CALZONE_TOPPING_MAX : PIZZA_TOPPING_MAX;
  const priced = useMemo(() => priceLine({ itemId, size, toppings, options, qty, note }), [itemId, size, toppings, options, qty, note]);

  const toggleTopping = (id: string) => {
    setError(null);
    setToppings((t) => (t.includes(id) ? t.filter((x) => x !== id) : t.length >= max ? t : [...t, id]));
  };
  const pick = (group: string, id: string, multi?: boolean) => {
    setError(null);
    setOptions((o) => {
      const cur = o[group] ?? [];
      if (multi) return { ...o, [group]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
      return { ...o, [group]: [id] };
    });
  };

  const submit = () => {
    const r = add({ itemId, size, toppings, options, qty, note: note || undefined });
    if (!r.ok) return setError(r.error);
    playPop();
    toast({ title: `${qty} × ${item.name} added`, body: priced.ok ? priced.value.summary.join(" · ") : undefined });
    onDone();
  };

  const groups = (["Meats", "Veggies", "Specialty"] as const).map((g) => ({ g, list: TOPPINGS.filter((t) => t.group === g) }));

  return (
    <>
      <div className="relative shrink-0 overflow-hidden border-b border-[var(--line)] px-6 pb-5 pt-6">
        <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-brick/25 blur-3xl" aria-hidden />
        <div className="relative flex items-start gap-5">
          <motion.div initial={{ rotate: -40, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 120, damping: 14 }}>
            <ItemGlyph item={item} className="h-20 w-20 md:h-24 md:w-24" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Customize</p>
            <h2 id="item-title" className="display mt-1 text-[2.4rem] text-cream md:text-5xl">{item.name}</h2>
            <p className="mt-1 text-sm text-ash">{item.description}</p>
          </div>
          <button ref={closeRef} onClick={onDone} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--line-strong)] text-cream hover:border-amber" aria-label="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto overscroll-contain px-6 py-6">
        {item.sizes && (
          <fieldset>
            <legend className="eyebrow mb-3">Size</legend>
            <div className="grid grid-cols-3 gap-2">
              {SIZES.filter((s) => item.sizes?.[s.id] != null).map((s) => {
                const on = size === s.id;
                const scale = Number(s.id) / 22;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSize(s.id)}
                    aria-pressed={on}
                    className={`relative flex flex-col items-center rounded-2xl border px-2 pb-3 pt-4 transition-all ${on ? "border-amber bg-amber/10" : "border-[var(--line)] hover:border-[var(--line-strong)]"}`}
                  >
                    <span className="grid h-14 w-14 place-items-center">
                      <span className={`block rounded-full border-2 transition-colors ${on ? "border-amber bg-amber/20" : "border-ash/40"}`} style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }} />
                    </span>
                    <span className="mt-2 font-mono text-sm text-cream">{s.label}</span>
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-smoke">{s.nickname}</span>
                    <span className="mt-1 font-mono text-xs text-amber tabular-nums">{money(Math.round(item.sizes![s.id]! * 100))}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-smoke">{GLUTEN_FREE_NOTE}</p>
          </fieldset>
        )}

        {item.toppings && (
          <fieldset>
            <legend className="eyebrow mb-1 flex w-full justify-between">
              <span>{item.category === "byo" ? "Build it" : "Extra toppings"}</span>
              <span className="text-smoke">{toppings.length}/{max}</span>
            </legend>
            {groups.map(({ g, list }) => (
              <div key={g} className="mt-3">
                <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-smoke">
                  {g} <span className="text-ash">· +{money(toppingCents(itemId, list[0].id, size))} each</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {list.map((t) => {
                    const on = toppings.includes(t.id);
                    const full = !on && toppings.length >= max;
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleTopping(t.id)}
                        disabled={full}
                        aria-pressed={on}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-all active:scale-95 disabled:opacity-35 ${on ? "border-amber bg-amber text-coal" : "border-[var(--line-strong)] text-cream hover:border-amber/60"}`}
                      >
                        {on && <Check size={13} />}
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </fieldset>
        )}

        {item.options?.map((g) => (
          <fieldset key={g.id}>
            <legend className="eyebrow mb-3">
              {g.label} {g.required && <span className="text-smoke">· required</span>}
            </legend>
            <div className="flex flex-wrap gap-2">
              {g.choices.map((c) => {
                const on = (options[g.id] ?? []).includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => pick(g.id, c.id, g.multi)}
                    aria-pressed={on}
                    className={`rounded-full border px-3.5 py-2 text-sm transition-all active:scale-95 ${on ? "border-amber bg-amber text-coal" : "border-[var(--line-strong)] text-cream hover:border-amber/60"}`}
                  >
                    {c.label}
                    {c.price ? ` +${money(Math.round(c.price * 100))}` : ""}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <label className="block">
          <span className="eyebrow">Kitchen note</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 140))}
            placeholder="Well done, light sauce, cut in squares…"
            className="mt-3 w-full rounded-xl border border-[var(--line-strong)] bg-coal/60 px-4 py-3 text-sm text-cream placeholder:text-smoke focus:border-amber focus:outline-none"
          />
        </label>
      </div>

      <div className="shrink-0 border-t border-[var(--line)] bg-coal/60 px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
        {error && <p className="mb-3 text-sm text-red-400" role="alert">{error}</p>}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-[var(--line-strong)]">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-12 w-11 place-items-center text-cream" aria-label="Fewer">
              <Minus size={16} />
            </button>
            <span className="w-6 text-center font-mono tabular-nums" aria-live="polite">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="grid h-12 w-11 place-items-center text-cream" aria-label="More">
              <Plus size={16} />
            </button>
          </div>
          <button
            onClick={submit}
            disabled={!priced.ok && !item.options?.some((g) => g.required)}
            className="flex h-12 flex-1 items-center justify-between rounded-full bg-amber px-6 font-mono text-[0.78rem] font-medium uppercase tracking-[0.14em] text-coal transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            <span>Add to order</span>
            <span className="tabular-nums">{priced.ok ? money(priced.value.lineCents) : "—"}</span>
          </button>
        </div>
      </div>
    </>
  );
}
