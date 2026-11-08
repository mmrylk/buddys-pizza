import { NextResponse } from "next/server";
import { buildOrder, orders, publicOrder, stripe, type OrderRequest } from "@/lib/orders";
import { fail, rateLimited, tooMany } from "@/lib/http";

export const runtime = "nodejs";

/** Create an order: validate, re-price on the server, then open a Stripe PaymentIntent. */
export async function POST(req: Request) {
  if (rateLimited(req, "orders", 8, 60_000)) return tooMany();
  let body: OrderRequest;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.");
  }

  const built = buildOrder(body);
  if (!built.ok) return fail(built.error, 422);
  const order = built.order;

  let clientSecret: string | null = null;
  if (stripe) {
    try {
      const pi = await stripe.paymentIntents.create(
        {
          amount: order.totals.total,
          currency: "usd",
          automatic_payment_methods: { enabled: true }, // cards, Apple Pay, Google Pay, Link
          receipt_email: order.customer.email,
          description: `Buddy's Pizza order ${order.code}`,
          metadata: { orderId: order.id, code: order.code, orderType: order.orderType },
        },
        { idempotencyKey: order.id },
      );
      order.paymentIntentId = pi.id;
      clientSecret = pi.client_secret;
    } catch (e) {
      console.error("[orders] stripe error", e);
      return fail("Payment service is unavailable. Please call the shop to order.", 502);
    }
  }

  await orders.insert(order);
  return NextResponse.json({ order: publicOrder(order), clientSecret, demo: !stripe }, { status: 201 });
}
