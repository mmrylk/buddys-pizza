"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, LoaderCircle, X } from "lucide-react";

type Pending = { id: string; dogName: string; ownerName: string; email: string; story?: string; createdAt: string; photoUrl: string };

/** Crew-only moderation queue. Token stays in this tab's sessionStorage. */
export default function WallAdmin() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [list, setList] = useState<(Pending & { blob?: string })[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (t: string) => {
    setErr(null);
    const res = await fetch("/api/dogs?status=pending", { headers: { "x-admin-token": t }, cache: "no-store" });
    if (!res.ok) {
      setAuthed(false);
      return setErr("Wrong token.");
    }
    setAuthed(true);
    try { sessionStorage.setItem("buddys-admin", t); } catch {}
    const { dogs } = (await res.json()) as { dogs: Pending[] };
    const withImgs = await Promise.all(
      dogs.map(async (d) => {
        const r = await fetch(d.photoUrl, { headers: { "x-admin-token": t } });
        return { ...d, blob: r.ok ? URL.createObjectURL(await r.blob()) : undefined };
      }),
    );
    setList(withImgs);
  }, []);

  useEffect(() => {
    try {
      const t = sessionStorage.getItem("buddys-admin");
      if (t) { setToken(t); load(t); }
    } catch {}
  }, [load]);

  const moderate = async (id: string, status: "approved" | "rejected") => {
    const res = await fetch(`/api/dogs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-token": token }, body: JSON.stringify({ status }) });
    if (res.ok) setList((l) => l?.filter((d) => d.id !== id) ?? null);
    else setErr("Update failed.");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-32 sm:px-8">
      <p className="eyebrow">Crew only</p>
      <h1 className="display mt-3 text-6xl">Dog wall queue</h1>
      {!authed ? (
        <form onSubmit={(e) => { e.preventDefault(); load(token); }} className="mt-8 flex max-w-md gap-2">
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token" className="h-12 flex-1 rounded-full border border-[var(--line-strong)] bg-coal px-5 text-cream focus:border-amber focus:outline-none" />
          <button className="rounded-full bg-amber px-6 font-mono text-xs uppercase tracking-[0.16em] text-coal">Unlock</button>
        </form>
      ) : list === null ? (
        <LoaderCircle className="mt-10 animate-spin text-amber" />
      ) : list.length === 0 ? (
        <p className="mt-8 text-ash">No pending dogs. Nice work.</p>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => (
            <li key={d.id} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-iron">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {d.blob ? <img src={d.blob} alt={d.dogName} className="aspect-[4/5] w-full object-cover" /> : <div className="aspect-[4/5] bg-coal" />}
              <div className="p-4">
                <p className="display text-3xl">{d.dogName}</p>
                <p className="text-xs text-ash">{d.ownerName} · {d.email}</p>
                {d.story && <p className="mt-2 text-sm text-cream/80">{d.story}</p>}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => moderate(d.id, "approved")} className="flex flex-1 items-center justify-center gap-1 rounded-full bg-amber py-2 font-mono text-xs uppercase text-coal"><Check size={14} /> Approve</button>
                  <button onClick={() => moderate(d.id, "rejected")} className="flex flex-1 items-center justify-center gap-1 rounded-full border border-[var(--line-strong)] py-2 font-mono text-xs uppercase"><X size={14} /> Reject</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {err && <p role="alert" className="mt-4 text-sm text-red-300">{err}</p>}
    </div>
  );
}
