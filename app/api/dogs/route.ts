import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/db";
import { MAX_PHOTO_BYTES, dogs, isAdmin, publicDog, sniffImage, type Dog } from "@/lib/dogs";
import { clean, fail, isEmail, rateLimited, tooMany } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Approved dogs for the public wall. Admins can pass ?status=pending. */
export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get("status") ?? "approved";
  if (status !== "approved" && !isAdmin(req)) return fail("Unauthorized.", 401);
  const all = (await dogs.all()).filter((d) => d.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({
    dogs: status === "approved" ? all.map(publicDog) : all.map((d) => ({ ...publicDog(d), ownerName: d.ownerName, email: d.email, status: d.status })),
  });
}

/** Public submission. Lands as "pending" until the crew approves it. */
export async function POST(req: Request) {
  if (rateLimited(req, "dogs", 4, 10 * 60_000)) return tooMany();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Invalid upload.");
  }
  if (clean(form.get("website"), 100)) return NextResponse.json({ ok: true }, { status: 201 }); // honeypot

  const dogName = clean(form.get("dogName"), 40);
  const ownerName = clean(form.get("ownerName"), 60);
  const email = clean(form.get("email"), 120).toLowerCase();
  const story = clean(form.get("story"), 280) || undefined;
  const consent = form.get("consent") === "on";
  const photo = form.get("photo");

  if (!dogName) return fail("What's your dog's name?", 422);
  if (ownerName.length < 2) return fail("Add your name.", 422);
  if (!isEmail(email)) return fail("Add an email so we can reach you.", 422);
  if (!consent) return fail("Please confirm you're OK with us posting the photo.", 422);
  if (!(photo instanceof File) || photo.size === 0) return fail("Attach a photo.", 422);
  if (photo.size > MAX_PHOTO_BYTES) return fail("Photo must be under 5 MB.", 413);

  const bytes = new Uint8Array(await photo.arrayBuffer());
  const ext = sniffImage(bytes);
  if (!ext) return fail("Photo must be a JPG, PNG or WebP.", 415);

  const dog: Dog = { id: crypto.randomUUID(), dogName, ownerName, email, story, ext, createdAt: new Date().toISOString(), status: "pending" };
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, `${dog.id}.${ext}`), bytes);
  await dogs.insert(dog);
  return NextResponse.json({ ok: true }, { status: 201 });
}
