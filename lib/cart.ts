"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { priceLine, type LineInput, type PricedLine } from "./pricing";

export type CartLine = PricedLine & { key: string };

type CartState = {
  lines: CartLine[];
  add: (input: LineInput) => { ok: true } | { ok: false; error: string };
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const keyOf = (l: LineInput) =>
  JSON.stringify([l.itemId, l.size ?? "", [...(l.toppings ?? [])].sort(), l.options ?? {}, l.note ?? ""]);

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (input) => {
        const key = keyOf(input);
        const existing = get().lines.find((l) => l.key === key);
        const r = priceLine({ ...input, qty: (existing?.qty ?? 0) + input.qty });
        if (!r.ok) return r;
        set({
          lines: existing
            ? get().lines.map((l) => (l.key === key ? { ...r.value, key } : l))
            : [...get().lines, { ...r.value, key }],
        });
        return { ok: true };
      },
      setQty: (key, qty) => {
        if (qty < 1) return get().remove(key);
        set({
          lines: get().lines.map((l) => {
            if (l.key !== key) return l;
            const r = priceLine({ ...l, qty });
            return r.ok ? { ...r.value, key } : l;
          }),
        });
      },
      remove: (key) => set({ lines: get().lines.filter((l) => l.key !== key) }),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "buddys-cart-v1",
      storage: createJSONStorage(() => localStorage),
      // Re-price on load so stale prices from an old menu never linger.
      merge: (persisted, current) => {
        const saved = (persisted as { lines?: CartLine[] })?.lines ?? [];
        const lines = saved.flatMap((l) => {
          const r = priceLine(l);
          return r.ok ? [{ ...r.value, key: l.key }] : [];
        });
        return { ...current, lines };
      },
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((a, l) => a + l.qty, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((a, l) => a + l.lineCents, 0);
