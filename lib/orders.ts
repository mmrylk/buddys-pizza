import "server-only";
import Stripe from "stripe";
import { table } from "./db";
import { getItem } from "./menu";
import { priceLine, totals, type LineInput, type PricedLine, type Tip, type Totals } from "./pricing";
import { asapSlot, describeSlot, dowOf, isLunchWindow, validateSlot, type Slot } from "./hours";
import { ORDER_TYPES, type OrderType } from "./site";
import { clean, isEmail, isPhone } from "./http";

export const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export type OrderStatus = "pending_payment" | "paid" | "failed";

export type Order = {
  id: string;
  code: string;
  createdAt: string;
  status: OrderStatus;
  orderType: OrderType;
  asap: boolean;
  slot: Slot;
  customer: { name: string; phone: string; email: string; address?: string; notes?: string };
  lines: PricedLine[];
  tip: Tip;
  totals: Totals;
  paymentIntentId?: string;
  demo: boolean;
};

export const orders = table<Order>("orders");

export type OrderRequest = {
  lines: LineInput[];
  orderType: OrderType;
  when: { mode: "asap" } | { mode: "later"; slot: Slot };
  customer: { name?: string; phone?: string; email?: string; address?: string; notes?: string };
  tip: Tip;
};

type Built = { ok: true; order: Order } | { ok: false; error: string };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function code() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return "BP-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

function parseTip(t: unknown): Tip {
  const tip = t as Tip | undefined;
  if (tip?.mode === "percent") return { mode: "percent", percent: Number(tip.percent) };
  if (tip?.mode === "custom") return { mode: "custom", cents: Number(tip.cents) };
  return { mode: "none" };
}

/** Validates and re-prices everything the browser sent. Never trusts client totals. */
export function buildOrder(body: OrderRequest, now = new Date()): Built {
  if (!body || !Array.isArray(body.lines) || body.lines.length === 0) return { ok: false, error: "Your cart is empty." };
  if (body.lines.length > 50) return { ok: false, error: "That's a big order — please call the shop." };

  const lines: PricedLine[] = [];
  for (const l of body.lines) {
    const r = priceLine(l);
    if (!r.ok) return r;
    lines.push(r.value);
  }

  if (!ORDER_TYPES.some((t) => t.id === body.orderType)) return { ok: false, error: "Choose pickup, delivery or dine-in." };

  let slot: Slot | null;
  if (body.when?.mode === "asap") {
    slot = asapSlot(now);
    if (!slot) return { ok: false, error: "We're not taking ASAP orders right now. Schedule a time instead." };
  } else if (body.when?.mode === "later" && body.when.slot) {
    slot = { date: String(body.when.slot.date), minutes: Number(body.when.slot.minutes) };
    const err = validateSlot(slot, now);
    if (err) return { ok: false, error: err };
  } else {
    return { ok: false, error: "Choose when you want your order." };
  }

  const lunchItems = lines.filter((l) => getItem(l.itemId)?.window === "lunch");
  if (lunchItems.length && !isLunchWindow(dowOf(slot.date), slot.minutes)) {
    return { ok: false, error: `${lunchItems[0].name} is lunch-only (Tue–Fri, 11 AM – 2 PM). Pick a time in that window or remove it.` };
  }

  const c = body.customer ?? {};
  const customer = {
    name: clean(c.name, 80),
    phone: clean(c.phone, 30),
    email: clean(c.email, 120).toLowerCase(),
    address: body.orderType === "delivery" ? clean(c.address, 200) : undefined,
    notes: clean(c.notes, 300) || undefined,
  };
  if (customer.name.length < 2) return { ok: false, error: "Enter your name." };
  if (!isPhone(customer.phone)) return { ok: false, error: "Enter a phone number we can call." };
  if (!isEmail(customer.email)) return { ok: false, error: "Enter a valid email for your receipt." };
  if (body.orderType === "delivery" && (customer.address?.length ?? 0) < 6) return { ok: false, error: "Enter a delivery address." };

  const tip = parseTip(body.tip);
  const t = totals(lines, tip);
  if (t.total < 50) return { ok: false, error: "Order total is too small." };

  return {
    ok: true,
    order: {
      id: crypto.randomUUID(),
      code: code(),
      createdAt: now.toISOString(),
      status: "pending_payment",
      orderType: body.orderType,
      asap: body.when.mode === "asap",
      slot,
      customer,
      lines,
      tip,
      totals: t,
      demo: !stripe,
    },
  };
}

/** What the confirmation page may see. No phone, email or address. */
export function publicOrder(o: Order) {
  return {
    id: o.id,
    code: o.code,
    status: o.status,
    orderType: o.orderType,
    when: o.asap ? `ASAP · about ${describeSlot(o.slot, new Date(o.createdAt))}` : describeSlot(o.slot, new Date(o.createdAt)),
    firstName: o.customer.name.split(" ")[0],
    lines: o.lines.map((l) => ({ name: l.name, qty: l.qty, summary: l.summary, lineCents: l.lineCents })),
    totals: o.totals,
    demo: o.demo,
  };
}

/** Pull the latest PaymentIntent status in case the webhook hasn't landed yet. */
export async function syncPayment(o: Order): Promise<Order> {
  if (!stripe || !o.paymentIntentId || o.status === "paid") return o;
  const pi = await stripe.paymentIntents.retrieve(o.paymentIntentId);
  const status: OrderStatus = pi.status === "succeeded" ? "paid" : pi.status === "canceled" ? "failed" : o.status;
  if (status !== o.status) return (await orders.update(o.id, { status })) ?? o;
  return o;
}
