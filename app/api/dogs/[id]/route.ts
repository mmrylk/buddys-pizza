import { NextResponse } from "next/server";
import { dogs, isAdmin, publicDog } from "@/lib/dogs";
import { fail } from "@/lib/http";

export const runtime = "nodejs";

/** Moderate a submission: { "status": "approved" | "rejected" }. Requires x-admin-token. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return fail("Unauthorized.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body?.status;
  if (status !== "approved" && status !== "rejected" && status !== "pending") return fail("Invalid status.");
  const updated = await dogs.update(id, { status });
  if (!updated) return fail("Not found.", 404);
  return NextResponse.json({ dog: { ...publicDog(updated), status: updated.status } });
}
