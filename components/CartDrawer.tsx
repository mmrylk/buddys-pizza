"use client";
import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart, cartCount, cartSubtotal } from "@/lib/cart";
import { useUI } from "@/lib/ui";
import { getItem } from "@/lib/menu";
import { money } from "@/lib/pricing";
import { ItemGlyph } from "./ItemGlyph";

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useUI();
  const { lines, setQty, remove } = useCart();
  const n = cartCount(lines);
  const hasLunch = lines.some((l) => getItem(l.itemId)?.window === "lunch");

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cartOpen, setCartOpen]);

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-[56]">
          <motion.button
            className="absolute inset-0 bg-coal/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
            tabIndex={-1}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Your order"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 34 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[var(--line-strong)] bg-iron"
          >
            <header className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5">
              <div>
                <p className="eyebrow">Your order</p>
                <h2 className="display mt-1 text-4xl">{n} {n === 1 ? "item" : "items"}</h2>
              </div>
              <button autoFocus onClick={() => setCartOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line-strong)]" aria-label="Close cart">
                <X size={18} />
              </button>
            </header>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <div className="grid h-20 w-20 place-items-center rounded-full border border-dashed border-[var(--line-strong)] text-smoke">
                  <ShoppingBag size={28} />
                </div>
                <p className="display mt-6 text-3xl">The oven&rsquo;s hot.</p>
                <p className="mt-2 text-sm text-ash">Your cart is empty. Pick a pie and we&rsquo;ll fire it.</p>
                <Link href="/menu" onClick={() => setCartOpen(false)} className="mt-6 rounded-full bg-amber px-6 py-3 font-mono text-xs uppercase tracking-[0.16em] text-coal">
                  Browse the menu
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-[var(--line)] overflow-y-auto overscroll-contain px-6">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => {
                      const item = getItem(l.itemId);
                      return (
                        <motion.li key={l.key} layout exit={{ opacity: 0, x: 60 }} className="flex gap-4 py-5">
                          {item && <ItemGlyph item={item} className="h-14 w-14 shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between gap-3">
                              <p className="font-medium text-cream">{l.name}</p>
                              <p className="font-mono text-sm tabular-nums text-cream">{money(l.lineCents)}</p>
                            </div>
                            {l.summary.length > 0 && <p className="mt-1 text-xs leading-relaxed text-ash">{l.summary.join(" · ")}</p>}
                            <div className="mt-3 flex items-center gap-2">
                              <div className="flex items-center rounded-full border border-[var(--line-strong)]">
                                <button onClick={() => setQty(l.key, l.qty - 1)} className="grid h-8 w-8 place-items-center" aria-label={`Fewer ${l.name}`}>
                                  <Minus size={13} />
                                </button>
                                <span className="w-5 text-center font-mono text-xs tabular-nums">{l.qty}</span>
                                <button onClick={() => setQty(l.key, l.qty + 1)} className="grid h-8 w-8 place-items-center" aria-label={`More ${l.name}`}>
                                  <Plus size={13} />
                                </button>
                              </div>
                              <button onClick={() => remove(l.key)} className="grid h-8 w-8 place-items-center rounded-full text-smoke hover:text-brick" aria-label={`Remove ${l.name}`}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
                <footer className="border-t border-[var(--line)] px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5">
                  {hasLunch && (
                    <p className="mb-4 flex items-start gap-2 rounded-xl bg-amber/10 p-3 text-xs text-amber">
                      <Clock size={14} className="mt-0.5 shrink-0" /> Lunch items need a pickup time Tue–Fri, 11 AM – 2 PM.
                    </p>
                  )}
                  <div className="flex items-baseline justify-between">
                    <span className="eyebrow text-ash">Subtotal</span>
                    <span className="display text-4xl tabular-nums">{money(cartSubtotal(lines))}</span>
                  </div>
                  <p className="mt-1 text-xs text-smoke">Tax and tip at checkout.</p>
                  <Link
                    href="/checkout"
                    onClick={() => setCartOpen(false)}
                    className="group mt-5 flex h-14 items-center justify-between rounded-full bg-amber px-6 font-mono text-[0.78rem] font-medium uppercase tracking-[0.16em] text-coal"
                  >
                    Checkout <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
