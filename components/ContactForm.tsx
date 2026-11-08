"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, LoaderCircle, Send } from "lucide-react";

const TOPICS = [
  { id: "general", label: "General" },
  { id: "catering", label: "Catering" },
  { id: "large-order", label: "Large order" },
  { id: "dog-wall", label: "Dog wall" },
  { id: "feedback", label: "Feedback" },
];

const field = "w-full rounded-xl border border-[var(--line-strong)] bg-coal/60 px-4 py-3.5 text-cream placeholder:text-smoke focus:border-amber focus:outline-none";

export function ContactForm() {
  const [topic, setTopic] = useState("general");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const event = topic === "catering" || topic === "large-order";

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, topic }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't send. Try calling us.");
      setDone(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass flex min-h-[420px] flex-col items-center justify-center rounded-3xl p-10 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-amber text-coal"><Check size={28} /></span>
        <p className="display mt-6 text-5xl">Message sent.</p>
        <p className="mt-3 max-w-sm text-ash">The crew will get back to you. Need an answer today? Call the shop.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="glass space-y-5 rounded-3xl p-6 md:p-8">
      <fieldset>
        <legend className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ash">What&rsquo;s it about?</legend>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              type="button"
              key={t.id}
              aria-pressed={topic === t.id}
              onClick={() => setTopic(t.id)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${topic === t.id ? "border-amber bg-amber text-coal" : "border-[var(--line-strong)] text-cream hover:border-amber/60"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <L label="Name"><input name="name" required autoComplete="name" className={field} /></L>
        <L label="Phone (optional)"><input name="phone" type="tel" autoComplete="tel" className={field} /></L>
        <L label="Email" wide><input name="email" type="email" required autoComplete="email" className={field} /></L>
        {event && (
          <>
            <L label="Event date"><input name="date" type="date" className={`${field} [color-scheme:dark]`} /></L>
            <L label="Headcount"><input name="guests" type="number" min={1} max={2000} inputMode="numeric" className={field} /></L>
          </>
        )}
        <L label="Message" wide>
          <textarea
            name="message"
            required
            minLength={10}
            rows={5}
            maxLength={2000}
            placeholder={event ? "Office lunch, team party, how many pies you're thinking…" : "How can we help?"}
            className={`${field} resize-none`}
          />
        </L>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
      <button type="submit" disabled={busy} className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-amber font-mono text-xs font-medium uppercase tracking-[0.16em] text-coal disabled:opacity-60">
        {busy ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={16} />} Send message
      </button>
    </form>
  );
}

function L({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-2 block font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ash">{label}</span>
      {children}
    </label>
  );
}
