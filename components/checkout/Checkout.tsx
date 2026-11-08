"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { ArrowLeft, Bike, CalendarClock, LoaderCircle, Lock, ShoppingBag, Store, Utensils, Zap } from "lucide-react";
import { useCart, cartCount } from "@/lib/cart";
import { getItem } from "@/lib/menu";
import { money, totals, TIP_PRESETS, type Tip } from "@/lib/pricing";
import { asapSlot, availableSlots, dowOf, fmtTime, isLunchWindow, type Slot, type SlotDay } from "@/lib/hours";
import { ORDER_TYPES, SITE, type OrderType } from "@/lib/site";
import { useUI } from "@/lib/ui";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

const TYPE_ICON: Record<OrderType, React.ReactNode> = {
  pickup: <Store size={18} />,
  delivery: <Bike size={18} />,
  dinein: <Utensils size={18} />,
};

type Created = { orderId: string; code: string; clientSecret: string | null; demo: boolean; total: number };

const input =
  "h-13 w-full rounded-xl border border-[var(--line-strong)] bg-coal/60 px-4 py-3.5 text-cream placeholder:text-smoke focus:border-amber focus:outline-none";

export function Checkout() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const toast = useUI((s) => s.toast);
  const [mounted, setMounted] = useState(false);

  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [mode, setMode] = useState<"asap" | "later">("asap");
  const [days, setDays] = useState<SlotDay[]>([]);
  const [asap, setAsap] = useState<Slot | null>(null);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [c, setC] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [tip, setTip] = useState<Tip>({ mode: "percent", percent: 18 });
  const [customTip, setCustomTip] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  const hasLunch = lines.some((l) => getItem(l.itemId)?.window === "lunch");

  useEffect(() => {
    setMounted(true);
    const refresh = () => {
      setDays(availableSlots(new Date(), 4));
      setAsap(asapSlot());
    };
    refresh();
    const t = setInterval(refresh, 60_000);
    return () => clearInterval(t);
  }, []);

  // Lunch-only items limit which times are valid.
  const visibleDays = useMemo(
    () =>
      days
        .map((d) => ({ ...d, slots: hasLunch ? d.slots.filter((s) => isLunchWindow(dowOf(s.date), s.minutes)) : d.slots }))
        .filter((d) => d.slots.length),
    [days, hasLunch],
  );
  const asapOk = !!asap && (!hasLunch || isLunchWindow(dowOf(asap.date), asap.minutes));
  useEffect(() => {
    if (mounted && !asapOk) setMode("later");
  }, [mounted, asapOk]);

  // Any cart edit invalidates a payment that was already opened.
  const cartKey = lines.map((l) => `${l.key}x${l.qty}`).join("|");
  useEffect(() => setCreated(null), [cartKey]);

  const t = totals(lines, tip);
  const n = cartCount(lines);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "later" && !slot) return setError("Pick a time.");
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map(({ itemId, size, toppings, options, qty, note }) => ({ itemId, size, toppings, options, qty, note })),
          orderType,
          when: mode === "asap" ? { mode } : { mode, slot },
          customer: c,
          tip,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      if (data.clientSecret && !stripePromise) throw new Error("Payments aren't configured (missing publishable key).");
      setCreated({ orderId: data.order.id, code: data.order.code, clientSecret: data.clientSecret, demo: data.demo, total: data.order.totals.total });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const done = (orderId: string) => router.push(`/checkout/success?order=${orderId}`);

  if (!mounted) return <CheckoutSkeleton />;

  if (n === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-full border border-dashed border-[var(--line-strong)] text-smoke">
          <ShoppingBag size={32} />
        </span>
        <h1 className="display mt-8 text-6xl">Nothing to check out.</h1>
        <p className="mt-3 text-ash">Your cart is empty. The oven isn&rsquo;t.</p>
        <Link href="/menu" className="mt-8 rounded-full bg-amber px-8 py-4 font-mono text-xs uppercase tracking-[0.16em] text-coal">
          Start an order
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1440px] gap-10 px-4 pb-24 pt-28 sm:px-8 md:pt-36 lg:grid-cols-[1.35fr_1fr]">
      <div>
        <Link href="/menu" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-ash hover:text-cream">
          <ArrowLeft size={14} /> Keep shopping
        </Link>
        <h1 className="display mt-4 text-[clamp(3.5rem,9vw,7.5rem)]">
          Check<span className="text-amber">out.</span>
        </h1>

        <AnimatePresence mode="wait">
          {!created ? (
            <motion.form key="details" onSubmit={submit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="mt-10 space-y-12">
              <Step n="01" title="How are you eating?">
                <div className={`grid gap-2 ${ORDER_TYPES.length === 3 ? "grid-cols-3" : "grid-cols-2"}`} role="radiogroup">
                  {ORDER_TYPES.map((o) => (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={orderType === o.id}
                      key={o.id}
                      onClick={() => setOrderType(o.id)}
                      className={`relative flex flex-col items-center gap-2 rounded-2xl border px-3 py-5 transition-colors ${orderType === o.id ? "border-amber text-amber" : "border-[var(--line)] text-cream hover:border-[var(--line-strong)]"}`}
                    >
                      {orderType === o.id && <motion.span layoutId="type-bg" className="absolute inset-0 -z-10 rounded-2xl bg-amber/10" />}
                      {TYPE_ICON[o.id]}
                      <span className="font-mono text-xs uppercase tracking-[0.16em]">{o.label}</span>
                    </button>
                  ))}
                </div>
                {orderType === "delivery" && (
                  <p className="mt-3 text-xs text-ash">Delivery is limited to the Frankfort area. The shop will call to confirm your address and timing.</p>
                )}
                {orderType === "dinein" && <p className="mt-3 text-xs text-ash">We&rsquo;ll have it coming out of the oven when you arrive at 212 W Broadway.</p>}
              </Step>

              <Step n="02" title="When?">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!asapOk}
                    onClick={() => setMode("asap")}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors disabled:opacity-40 ${mode === "asap" ? "border-amber bg-amber/10" : "border-[var(--line)]"}`}
                  >
                    <Zap size={18} className="text-amber" />
                    <span>
                      <span className="block text-sm text-cream">ASAP</span>
                      <span className="block text-xs text-ash">{asapOk && asap ? `Ready around ${fmtTime(asap.minutes)}` : "Unavailable right now"}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("later")}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${mode === "later" ? "border-amber bg-amber/10" : "border-[var(--line)]"}`}
                  >
                    <CalendarClock size={18} className="text-amber" />
                    <span>
                      <span className="block text-sm text-cream">Schedule</span>
                      <span className="block text-xs text-ash">{slot ? `${visibleDays.find((d) => d.date === slot.date)?.label ?? ""} ${fmtTime(slot.minutes)}` : "Pick a time"}</span>
                    </span>
                  </button>
                </div>
                {hasLunch && <p className="mt-3 text-xs text-amber">Your cart has lunch-only items, so times are limited to Tue–Fri, 11 AM – 2 PM.</p>}
                <AnimatePresence>
                  {mode === "later" && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      {visibleDays.length === 0 ? (
                        <p className="mt-4 text-sm text-ash">No times available in the next few days. Call {SITE.phone}.</p>
                      ) : (
                        <>
                          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
                            {visibleDays.map((d, i) => (
                              <button
                                type="button"
                                key={d.date}
                                onClick={() => setDay(i)}
                                className={`shrink-0 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] ${day === i ? "bg-cream text-coal" : "border border-[var(--line-strong)] text-cream"}`}
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
                            {(visibleDays[day] ?? visibleDays[0]).slots.map((s) => {
                              const on = slot?.date === s.date && slot.minutes === s.minutes;
                              return (
                                <button
                                  type="button"
                                  key={`${s.date}-${s.minutes}`}
                                  onClick={() => setSlot(s)}
                                  className={`rounded-xl border py-2.5 font-mono text-xs tabular-nums transition-colors ${on ? "border-amber bg-amber text-coal" : "border-[var(--line)] text-cream hover:border-amber/50"}`}
                                >
                                  {fmtTime(s.minutes)}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Step>

              <Step n="03" title="Who's it for?">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name">
                    <input required autoComplete="name" className={input} value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
                  </Field>
                  <Field label="Phone">
                    <input required type="tel" autoComplete="tel" inputMode="tel" className={input} value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} />
                  </Field>
                  <Field label="Email (for your receipt)" wide>
                    <input required type="email" autoComplete="email" className={input} value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} />
                  </Field>
                  {orderType === "delivery" && (
                    <Field label="Delivery address" wide>
                      <input required autoComplete="street-address" className={input} value={c.address} onChange={(e) => setC({ ...c, address: e.target.value })} />
                    </Field>
                  )}
                  <Field label="Order notes (optional)" wide>
                    <textarea rows={2} maxLength={300} className={`${input} resize-none`} value={c.notes} onChange={(e) => setC({ ...c, notes: e.target.value })} />
                  </Field>
                </div>
              </Step>

              <Step n="04" title="Tip the crew">
                <div className="grid grid-cols-5 gap-2">
                  {TIP_PRESETS.map((p) => {
                    const on = tip.mode === "percent" && tip.percent === p;
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setTip({ mode: "percent", percent: p })}
                        className={`flex flex-col items-center rounded-2xl border py-3 transition-colors ${on ? "border-amber bg-amber text-coal" : "border-[var(--line)] text-cream"}`}
                      >
                        <span className="display text-2xl">{p}%</span>
                        <span className={`font-mono text-[0.65rem] tabular-nums ${on ? "text-coal/70" : "text-smoke"}`}>{money(Math.round((t.subtotal * p) / 100))}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setTip({ mode: "custom", cents: Math.round(Number(customTip || 0) * 100) })}
                    className={`rounded-2xl border py-3 font-mono text-xs uppercase tracking-[0.12em] ${tip.mode === "custom" ? "border-amber bg-amber/10 text-amber" : "border-[var(--line)] text-cream"}`}
                  >
                    Custom
                  </button>
                  <button
                    type="button"
                    onClick={() => setTip({ mode: "none" })}
                    className={`rounded-2xl border py-3 font-mono text-xs uppercase tracking-[0.12em] ${tip.mode === "none" ? "border-cream/60 text-cream" : "border-[var(--line)] text-smoke"}`}
                  >
                    None
                  </button>
                </div>
                {tip.mode === "custom" && (
                  <label className="relative mt-3 block">
                    <span className="sr-only">Custom tip in dollars</span>
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ash">$</span>
                    <input
                      autoFocus
                      inputMode="decimal"
                      className={`${input} pl-8`}
                      placeholder="0.00"
                      value={customTip}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, "").slice(0, 7);
                        setCustomTip(v);
                        setTip({ mode: "custom", cents: Math.round(Number(v || 0) * 100) });
                      }}
                    />
                  </label>
                )}
              </Step>

              {error && (
                <p role="alert" className="rounded-xl border border-brick/50 bg-brick/15 p-4 text-sm text-red-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex h-16 w-full items-center justify-between rounded-full bg-amber px-8 font-mono text-sm font-medium uppercase tracking-[0.16em] text-coal transition-transform active:scale-[0.99] disabled:opacity-60"
              >
                <span className="flex items-center gap-3">{busy && <LoaderCircle size={18} className="animate-spin" />} Continue to payment</span>
                <span className="tabular-nums">{money(t.total)}</span>
              </button>
            </motion.form>
          ) : (
            <motion.div key="pay" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-10">
              <Step n="05" title="Payment">
                <p className="mb-5 font-mono text-xs uppercase tracking-[0.16em] text-ash">
                  Order {created.code} · {money(created.total)}
                </p>
                {created.clientSecret && stripePromise ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: created.clientSecret,
                      appearance: {
                        theme: "night",
                        variables: { colorPrimary: "#E5A93C", colorBackground: "#121212", colorText: "#FDFBF7", colorDanger: "#ff6b5e", borderRadius: "14px", fontFamily: "Inter Tight, system-ui, sans-serif" },
                      },
                    }}
                  >
                    <StripePay orderId={created.orderId} total={created.total} onPaid={done} />
                  </Elements>
                ) : (
                  <DemoPay orderId={created.orderId} total={created.total} onPaid={done} onError={(m) => toast({ title: m, tone: "error" })} />
                )}
                <button onClick={() => setCreated(null)} className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-ash hover:text-cream">
                  ← Edit details
                </button>
              </Step>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="glass rounded-3xl p-6 md:p-8">
          <p className="eyebrow">Order summary</p>
          <ul className="mt-5 divide-y divide-[var(--line)]">
            {lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-cream">
                    <span className="font-mono text-amber">{l.qty}×</span> {l.name}
                  </p>
                  {l.summary.length > 0 && <p className="mt-0.5 text-xs text-ash">{l.summary.join(" · ")}</p>}
                </div>
                <span className="font-mono text-sm tabular-nums">{money(l.lineCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-[var(--line)] pt-4 text-sm">
            <Row k="Subtotal" v={money(t.subtotal)} />
            <Row k="Tax (KY 6%)" v={money(t.tax)} />
            <Row k={`Tip${tip.mode === "percent" ? ` (${tip.percent}%)` : ""}`} v={money(t.tip)} />
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-[var(--line)] pt-4">
            <span className="eyebrow text-ash">Total</span>
            <span className="display text-5xl tabular-nums">{money(t.total)}</span>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-smoke">
            <Lock size={12} /> Prices are re-checked by our server before you pay.
          </p>
        </div>
      </aside>
    </div>
  );
}

function StripePay({ orderId, total, onPaid }: { orderId: string; total: number; onPaid: (id: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setErr(null);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/checkout/success?order=${orderId}` },
      redirect: "if_required",
    });
    if (error) {
      setErr(error.message ?? "Payment failed.");
      setBusy(false);
      return;
    }
    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") onPaid(orderId);
    else setBusy(false);
  };

  return (
    <div>
      <div className="rounded-2xl border border-[var(--line)] bg-coal/50 p-4">
        <PaymentElement options={{ layout: "tabs", wallets: { applePay: "auto", googlePay: "auto" } }} />
      </div>
      {err && <p role="alert" className="mt-4 text-sm text-red-300">{err}</p>}
      <button
        onClick={pay}
        disabled={!stripe || busy}
        className="mt-5 flex h-16 w-full items-center justify-between rounded-full bg-amber px-8 font-mono text-sm font-medium uppercase tracking-[0.16em] text-coal disabled:opacity-60"
      >
        <span className="flex items-center gap-3">{busy ? <LoaderCircle size={18} className="animate-spin" /> : <Lock size={16} />} Pay now</span>
        <span className="tabular-nums">{money(total)}</span>
      </button>
    </div>
  );
}

function DemoPay({ orderId, total, onPaid, onError }: { orderId: string; total: number; onPaid: (id: string) => void; onError: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const pay = async () => {
    setBusy(true);
    const res = await fetch(`/api/orders/${orderId}/demo-pay`, { method: "POST" });
    if (res.ok) onPaid(orderId);
    else {
      onError("Demo payment is disabled.");
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="rounded-2xl border border-dashed border-amber/50 bg-amber/5 p-5 text-sm text-ash">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber">Demo mode</p>
        <p className="mt-2">
          Stripe keys aren&rsquo;t set, so no card is charged. Add <code className="text-cream">STRIPE_SECRET_KEY</code> and{" "}
          <code className="text-cream">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to switch on cards, Apple Pay and Google Pay.
        </p>
      </div>
      <button onClick={pay} disabled={busy} className="mt-5 flex h-16 w-full items-center justify-between rounded-full bg-amber px-8 font-mono text-sm font-medium uppercase tracking-[0.16em] text-coal disabled:opacity-60">
        <span className="flex items-center gap-3">{busy && <LoaderCircle size={18} className="animate-spin" />} Place demo order</span>
        <span className="tabular-nums">{money(total)}</span>
      </button>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-5 flex items-baseline gap-4 border-t border-[var(--line)] pt-5">
        <span className="font-mono text-xs text-amber">{n}</span>
        <span className="display text-3xl md:text-4xl">{title}</span>
      </h2>
      {children}
    </section>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-2 block font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ash">{label}</span>
      {children}
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ash">{k}</dt>
      <dd className="font-mono tabular-nums">{v}</dd>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1440px] gap-10 px-4 pb-24 pt-28 sm:px-8 md:pt-36 lg:grid-cols-[1.35fr_1fr]" aria-busy="true">
      <div className="space-y-6">
        <div className="skeleton h-24 w-2/3 rounded-2xl" />
        <div className="skeleton h-28 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-56 rounded-2xl" />
      </div>
      <div className="skeleton h-96 rounded-3xl" />
    </div>
  );
}
