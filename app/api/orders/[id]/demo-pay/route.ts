import { NextResponse } from "next/server";
import { orders, publicOrder, stripe } from "@/lib/orders";
import { fail } from "@/lib/http";

export const runtime = "nodejs";

/**
 * Demo-mode payment: only exists while STRIPE_SECRET_KEY is unset,
 * so the full flow can be tested locally without a Stripe account.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (stripe || process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_PAYMENTS !== "true") {
    return fail("Not available.", 404);
  }
  const { id } = await params;
  const o = await orders.get(id);
  if (!o || !o.demo) return fail("Not found.", 404);
  const updated = await orders.update(id, { status: "paid" });
  return NextResponse.json({ order: publicOrder(updated ?? o) });
}
