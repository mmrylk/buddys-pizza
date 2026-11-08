"use client";
import { useEffect, useState } from "react";
import { Phone, ShoppingBag } from "lucide-react";
import { useCart, cartCount, cartSubtotal } from "@/lib/cart";
import { useUI } from "@/lib/ui";
import { money } from "@/lib/pricing";
import { SITE } from "@/lib/site";

/** Sticky bottom bar on phones. Its height is reserved by --mobile-bar on <body>. */
export function MobileBar() {
  const lines = useCart((s) => s.lines);
  const setCartOpen = useUI((s) => s.setCartOpen);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const n = mounted ? cartCount(lines) : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-coal/85 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
      <div className="flex h-[52px] gap-2">
        <button
          onClick={() => setCartOpen(true)}
          className="flex flex-1 items-center justify-between rounded-xl bg-amber px-4 font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-coal active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag size={17} /> View cart ({n} {n === 1 ? "item" : "items"})
          </span>
          <span className="tabular-nums">{n > 0 ? money(cartSubtotal(lines)) : ""}</span>
        </button>
        <a
          href={SITE.phoneHref}
          className="flex w-[7.5rem] items-center justify-center gap-2 rounded-xl border border-[var(--line-strong)] font-mono text-[0.72rem] uppercase tracking-[0.14em] text-cream active:scale-[0.98]"
        >
          <Phone size={16} /> Call us
        </a>
      </div>
    </div>
  );
}
