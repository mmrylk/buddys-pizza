import { NextResponse } from "next/server";
import { table } from "@/lib/db";
import { clean, fail, isEmail, rateLimited, tooMany } from "@/lib/http";

export const runtime = "nodejs";

const TOPICS = ["general", "catering", "large-order", "dog-wall", "feedback"] as const;
type Message = { id: string; createdAt: string; name: string; email: string; phone?: string; topic: string; date?: string; guests?: number; message: string };
const messages = table<Message>("messages");

/** Contact & catering form. Stored for the crew; forward to email by setting CONTACT_WEBHOOK_URL. */
export async function POST(req: Request) {
  if (rateLimited(req, "contact", 5, 10 * 60_000)) return tooMany();
  const b = await req.json().catch(() => null);
  if (!b) return fail("Invalid request.");
  if (clean(b.website, 100)) return NextResponse.json({ ok: true }); // honeypot

  const msg: Message = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: clean(b.name, 80),
    email: clean(b.email, 120).toLowerCase(),
    phone: clean(b.phone, 30) || undefined,
    topic: TOPICS.includes(b.topic) ? b.topic : "general",
    date: /^\d{4}-\d{2}-\d{2}$/.test(b.date ?? "") ? b.date : undefined,
    guests: Number.isInteger(Number(b.guests)) && Number(b.guests) > 0 ? Math.min(Number(b.guests), 2000) : undefined,
    message: clean(b.message, 2000),
  };
  if (msg.name.length < 2) return fail("Add your name.", 422);
  if (!isEmail(msg.email)) return fail("Add a valid email.", 422);
  if (msg.message.length < 10) return fail("Tell us a little more (10+ characters).", 422);

  await messages.insert(msg);

  const hook = process.env.CONTACT_WEBHOOK_URL;
  if (hook) {
    fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(msg) }).catch((e) =>
      console.error("[contact] webhook failed", e),
    );
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
