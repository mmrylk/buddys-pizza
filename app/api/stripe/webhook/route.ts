import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { orders, stripe } from "@/lib/orders";
import { fail } from "@/lib/http";

export const runtime = "nodejs";

/** Stripe → us. Point a webhook at /api/stripe/webhook for payment_intent.* events. */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return fail("Webhooks not configured.", 501);

  const sig = req.headers.get("stripe-signature");
  if (!sig) return fail("Missing signature.", 400);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return fail("Bad signature.", 400);
  }

  if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const orderId = pi.metadata?.orderId;
    if (orderId) {
      const o = await orders.get(orderId);
      if (o && o.paymentIntentId === pi.id && o.status !== "paid") {
        await orders.update(orderId, { status: event.type === "payment_intent.succeeded" ? "paid" : "failed" });
      }
    }
  }
  return NextResponse.json({ received: true });
}
