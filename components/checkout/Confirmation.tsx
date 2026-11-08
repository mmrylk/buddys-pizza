"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Clock, LoaderCircle, Phone } from "lucide-react";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import type { Totals } from "@/lib/pricing";

type PublicOrder = {
  id: string;
  code: string;
  status: "pending_payment" | "paid" | "failed";
  orderType: "pickup" | "delivery" | "dinein";
  when: string;
  firstName: string;
  lines: { name: string; qty: number; summary: string[]; lineCents: number }[];
  totals: Totals;
  demo: boolean;
};

const TYPE_COPY = { pickup: "Pickup at 212 W Broadway", delivery: "Delivery — we'll call to confirm", dinein: "Dine-in at 212 W Broadway" };

export function Confirmation() {
  const id = useSearchParams().get("order");
  const clear = useCart((s) => s.clear);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return setErr("No order found.");
    let tries = 0;
    let stop = false;
    const load = async () => {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!res.ok) return setErr("We couldn't find that order.");
      const { order } = (await res.json()) as { order: PublicOrder };
      if (stop) return;
      setOrder(order);
      if (order.status === "paid") clear();
      else if (order.status === "pending_payment" && tries++ < 8) setTimeout(load, 1500);
    };
    load().catch(() => setErr("Network error."));
    return () => {
      stop = true;
    };
  }, [id, clear]);

  if (err) {
    return (
      <div className="mx-auto max-w-xl px-4 py-40 text-center">
        <h1 className="display text-6xl">Hmm.</h1>
        <p className="mt-3 text-ash">{err} Call us at <a className="text-amber" href={SITE.phoneHref}>{SITE.phone}</a>.</p>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-40" aria-busy="true">
        <div className="skeleton mx-auto h-20 w-20 rounded-full" />
        <div className="skeleton mx-auto mt-8 h-16 w-3/4 rounded-xl" />
        <div className="skeleton mx-auto mt-6 h-80 rounded-3xl" />
      </div>
    );
  }

  const paid = order.status === "paid";
  return (
    <div className="relative mx-auto max-w-xl px-4 pb-24 pt-32 text-center">
      <div className="pointer-events-none absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-amber/20 blur-[100px]" aria-hidden />
      <motion.span
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 12 }}
        className={`relative mx-auto grid h-20 w-20 place-items-center rounded-full ${paid ? "bg-amber text-coal" : order.status === "failed" ? "bg-brick" : "bg-cream/10 text-amber"}`}
      >
        {paid ? <Check size={36} /> : order.status === "failed" ? "!" : <LoaderCircle size={32} className="animate-spin" />}
      </motion.span>
      <h1 className="display relative mt-8 text-[clamp(3.5rem,11vw,6rem)]">
        {paid ? <>It&rsquo;s in the <span className="text-amber">oven.</span></> : order.status === "failed" ? "Payment failed." : "Confirming…"}
      </h1>
      <p className="relative mt-3 text-ash">
        {paid ? `Thanks, ${order.firstName}. ${order.demo ? "Demo order: no card was charged." : "Your receipt is on its way to your inbox."}` : order.status === "failed" ? "Your card wasn't charged. Try again from checkout or call us." : "Waiting on your bank. This takes a few seconds."}
      </p>

      <motion.div
        initial={{ y: -40, opacity: 0, clipPath: "inset(0 0 100% 0)" }}
        animate={{ y: 0, opacity: 1, clipPath: "inset(0 0 0% 0)" }}
        transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-10 rounded-3xl bg-cream p-7 text-left text-coal shadow-[0_40px_80px_-30px_rgb(229_169_60/0.4)]"
      >
        <div className="flex items-start justify-between border-b border-dashed border-coal/25 pb-5">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-coal/60">Order</p>
            <p className="display mt-1 text-5xl">{order.code}</p>
          </div>
          {order.demo && <span className="rounded-full bg-coal px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-amber">Demo</span>}
        </div>
        <div className="space-y-1 border-b border-dashed border-coal/25 py-5 text-sm">
          <p className="flex items-center gap-2"><Clock size={14} /> {order.when}</p>
          <p className="text-coal/70">{TYPE_COPY[order.orderType]}</p>
        </div>
        <ul className="space-y-2 border-b border-dashed border-coal/25 py-5 text-sm">
          {order.lines.map((l, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span>
                {l.qty}× {l.name}
                {l.summary.length > 0 && <span className="block text-xs text-coal/60">{l.summary.join(" · ")}</span>}
              </span>
              <span className="font-mono tabular-nums">{money(l.lineCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 pt-5 font-mono text-sm">
          <div className="flex justify-between"><dt className="text-coal/60">Subtotal</dt><dd>{money(order.totals.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-coal/60">Tax</dt><dd>{money(order.totals.tax)}</dd></div>
          <div className="flex justify-between"><dt className="text-coal/60">Tip</dt><dd>{money(order.totals.tip)}</dd></div>
          <div className="flex justify-between pt-2 text-lg font-medium"><dt>Total</dt><dd>{money(order.totals.total)}</dd></div>
        </dl>
      </motion.div>

      <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <a href={SITE.phoneHref} className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line-strong)] px-6 py-3 font-mono text-xs uppercase tracking-[0.16em]">
          <Phone size={14} /> {SITE.phone}
        </a>
        <Link href="/" className="rounded-full bg-amber px-6 py-3 font-mono text-xs uppercase tracking-[0.16em] text-coal">
          Back home
        </Link>
      </div>
    </div>
  );
}
