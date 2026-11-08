import "server-only";
import { timingSafeEqual } from "node:crypto";
import { table } from "./db";

export type DogStatus = "pending" | "approved" | "rejected";
export type Dog = {
  id: string;
  dogName: string;
  ownerName: string;
  email: string;
  story?: string;
  ext: "jpg" | "png" | "webp";
  createdAt: string;
  status: DogStatus;
};

export const dogs = table<Dog>("dogs");

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const MIME: Record<Dog["ext"], string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Identify the image by its magic bytes, not by the client-supplied type. */
export function sniffImage(b: Uint8Array): Dog["ext"] | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  return null;
}

export function publicDog(d: Dog) {
  return {
    id: d.id,
    dogName: d.dogName,
    ownerFirst: d.ownerName.split(" ")[0],
    story: d.story,
    createdAt: d.createdAt,
    photoUrl: `/api/dogs/${d.id}/photo`,
  };
}

/** Moderation: requests must carry `x-admin-token` matching ADMIN_TOKEN. */
export function isAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  const got = req.headers.get("x-admin-token");
  if (!expected || expected.length < 12 || !got) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}
