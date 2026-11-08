import { NextResponse } from "next/server";
import { orders, publicOrder, syncPayment } from "@/lib/orders";
import { fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return fail("Not found.", 404);
  const found = await orders.get(id);
  if (!found) return fail("Not found.", 404);
  const order = await syncPayment(found).catch(() => found);
  return NextResponse.json({ order: publicOrder(order) });
}
