/**
 * Pricing shared by the browser (for display) and the API (for charging).
 * The server never trusts client prices: it re-runs priceLine() on every line.
 * All money math is done in integer cents.
 */
import {
  CALZONE_TOPPING_MAX, CALZONE_TOPPING_PRICE, PIZZA_TOPPING_MAX, TOPPING_PRICES,
  getItem, getTopping, type Size, SIZES,
} from "./menu";

export const TAX_RATE = 0.06; // Kentucky sales tax on prepared food
export const MAX_QTY = 20;
export const MAX_TIP_CENTS = 50_000;
export const TIP_PRESETS = [15, 18, 20] as const;

export type LineInput = {
  itemId: string;
  size?: Size;
  toppings?: string[];
  options?: Record<string, string[]>;
  qty: number;
  note?: string;
};

export type PricedLine = LineInput & {
  name: string;
  unitCents: number;
  lineCents: number;
  summary: string[];
};

export type Tip = { mode: "percent"; percent: number } | { mode: "custom"; cents: number } | { mode: "none" };

export const cents = (dollars: number) => Math.round(dollars * 100);
export const money = (c: number) => `$${(c / 100).toFixed(2)}`;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function toppingCents(itemId: string, toppingId: string, size?: Size): number {
  const item = getItem(itemId);
  const t = getTopping(toppingId);
  if (!item || !t) return 0;
  if (item.toppings === "calzone") return cents(CALZONE_TOPPING_PRICE);
  if (item.toppings === "pizza" && size) return cents(TOPPING_PRICES[t.tier][size]);
  return 0;
}

export function priceLine(input: LineInput): Result<PricedLine> {
  const item = getItem(input?.itemId);
  if (!item) return { ok: false, error: "Unknown menu item." };
  const qty = Number(input.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return { ok: false, error: `Quantity must be 1–${MAX_QTY}.` };

  const summary: string[] = [];
  let unit = 0;

  // Size
  if (item.sizes) {
    const size = input.size;
    const base = size ? item.sizes[size] : undefined;
    if (!size || base == null) return { ok: false, error: `Pick a size for ${item.name}.` };
    unit += cents(base);
    summary.push(`${SIZES.find((s) => s.id === size)!.label} ${SIZES.find((s) => s.id === size)!.nickname}`);
  } else {
    if (input.size) return { ok: false, error: `${item.name} has no sizes.` };
    unit += cents(item.price ?? 0);
  }

  // Toppings
  const toppings = [...new Set(input.toppings ?? [])];
  if (toppings.length) {
    if (!item.toppings) return { ok: false, error: `${item.name} can't take extra toppings.` };
    const max = item.toppings === "calzone" ? CALZONE_TOPPING_MAX : PIZZA_TOPPING_MAX;
    if (toppings.length > max) return { ok: false, error: `Up to ${max} toppings on ${item.name}.` };
    for (const id of toppings) {
      const t = getTopping(id);
      if (!t) return { ok: false, error: "Unknown topping." };
      unit += toppingCents(item.id, id, input.size);
    }
    summary.push(`+ ${toppings.map((id) => getTopping(id)!.label).join(", ")}`);
  }

  // Option groups
  const chosen = input.options ?? {};
  for (const key of Object.keys(chosen)) {
    if (!item.options?.some((g) => g.id === key)) return { ok: false, error: "Unknown option." };
  }
  for (const group of item.options ?? []) {
    const picks = [...new Set(chosen[group.id] ?? [])];
    if (group.required && picks.length !== 1) return { ok: false, error: `Choose a ${group.label.toLowerCase()} for ${item.name}.` };
    if (!group.multi && picks.length > 1) return { ok: false, error: `Only one ${group.label.toLowerCase()}.` };
    for (const id of picks) {
      const c = group.choices.find((x) => x.id === id);
      if (!c) return { ok: false, error: `Invalid ${group.label.toLowerCase()}.` };
      unit += cents(c.price ?? 0);
      summary.push(c.label);
    }
  }

  const note = typeof input.note === "string" ? input.note.trim().slice(0, 140) : undefined;
  if (note) summary.push(`“${note}”`);

  return {
    ok: true,
    value: {
      itemId: item.id, size: input.size, toppings, options: chosen, qty, note,
      name: item.name, unitCents: unit, lineCents: unit * qty, summary,
    },
  };
}

export function tipCents(subtotal: number, tip: Tip): number {
  if (tip.mode === "percent") {
    const p = Number(tip.percent);
    if (!Number.isFinite(p) || p < 0 || p > 100) return 0;
    return Math.round((subtotal * p) / 100);
  }
  if (tip.mode === "custom") {
    const c = Math.round(Number(tip.cents));
    return Number.isFinite(c) ? Math.min(Math.max(c, 0), MAX_TIP_CENTS) : 0;
  }
  return 0;
}

export type Totals = { subtotal: number; tax: number; tip: number; total: number };

export function totals(lines: { lineCents: number }[], tip: Tip): Totals {
  const subtotal = lines.reduce((a, l) => a + l.lineCents, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const t = tipCents(subtotal, tip);
  return { subtotal, tax, tip: t, total: subtotal + tax + t };
}
