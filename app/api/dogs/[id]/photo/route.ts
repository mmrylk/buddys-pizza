import { promises as fs } from "node:fs";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/db";
import { MIME, dogs, isAdmin } from "@/lib/dogs";
import { fail } from "@/lib/http";

export const runtime = "nodejs";

/** Serves approved photos publicly; pending ones only to admins. Files live outside /public. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dog = await dogs.get(id);
  if (!dog) return fail("Not found.", 404);
  const admin = isAdmin(req);
  if (dog.status !== "approved" && !admin) return fail("Not found.", 404);
  try {
    const buf = await fs.readFile(path.join(UPLOAD_DIR, `${dog.id}.${dog.ext}`));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[dog.ext],
        "Cache-Control": admin ? "private, no-store" : "public, max-age=86400",
        "Content-Security-Policy": "default-src 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return fail("Not found.", 404);
  }
}
