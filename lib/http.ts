import "server-only";
import { NextResponse } from "next/server";

const hits = new Map<string, number[]>();

/** In-memory sliding-window limiter. Per server instance only. */
export function rateLimited(req: Request, bucket: string, max: number, windowMs: number): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
export const tooMany = () => fail("Too many requests. Try again in a minute.", 429);

export function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
export const isPhone = (s: string) => s.replace(/\D/g, "").length >= 10;
