"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Dog, LoaderCircle, Upload, X } from "lucide-react";
import { useUI } from "@/lib/ui";

export type WallDog = { id: string; dogName: string; ownerFirst: string; story?: string; createdAt: string; photoUrl: string };

const tilt = (id: string) => ((id.charCodeAt(0) + id.charCodeAt(5)) % 7) - 3;

export function Frame({ dog, onOpen }: { dog: WallDog; onOpen: () => void }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 30, rotate: tilt(dog.id) * 2 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt(dog.id) }}
      viewport={{ once: true }}
      whileHover={{ rotate: 0, scale: 1.04, y: -6 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      onClick={onOpen}
      className="group relative mx-auto block w-full max-w-[17rem] text-left"
      aria-label={`View ${dog.dogName}`}
    >
      {/* nail + wire */}
      <span className="absolute -top-6 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-600 shadow" aria-hidden />
      <svg className="absolute -top-5 left-1/2 h-6 w-32 -translate-x-1/2" viewBox="0 0 128 24" aria-hidden>
        <path d="M4 22 L64 2 L124 22" stroke="#7a6a55" strokeWidth="1" fill="none" />
      </svg>
      <div className="rounded-[3px] bg-gradient-to-br from-[#c9932f] via-[#8a5a17] to-[#d8a845] p-2.5 shadow-[0_30px_50px_-18px_rgb(0_0_0/0.95),inset_0_0_0_1px_rgb(255_255_255/0.2)]">
        <div className="bg-cream p-3">
          <div className="relative aspect-[4/5] overflow-hidden bg-iron">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dog.photoUrl} alt={`${dog.dogName}, ${dog.ownerFirst}'s dog`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/25 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>
        </div>
      </div>
      <div className="mx-auto -mt-1 w-4/5 rounded-b-sm bg-gradient-to-b from-[#d8a845] to-[#9a6a1f] px-3 py-1.5 text-center shadow-lg">
        <p className="display truncate text-lg text-coal">{dog.dogName}</p>
        <p className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-coal/70">with {dog.ownerFirst}</p>
      </div>
    </motion.button>
  );
}

export function Gallery() {
  const [dogs, setDogs] = useState<WallDog[] | null>(null);
  const [open, setOpen] = useState<WallDog | null>(null);

  useEffect(() => {
    fetch("/api/dogs").then((r) => r.json()).then((d) => setDogs(d.dogs ?? [])).catch(() => setDogs([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);

  return (
    <>
      {dogs === null ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-16 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton mx-auto aspect-[4/5] w-full max-w-[17rem] rounded" />
          ))}
        </div>
      ) : dogs.length === 0 ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-16 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <a
              key={i}
              href="#submit"
              className="group mx-auto flex aspect-[4/5] w-full max-w-[17rem] flex-col items-center justify-center gap-3 rounded border-2 border-dashed border-cream/20 text-center transition-colors hover:border-amber"
              style={{ transform: `rotate(${(i % 3) - 1}deg)` }}
            >
              <Dog size={30} className="text-cream/30 transition-colors group-hover:text-amber" />
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-cream/40 group-hover:text-amber">Your dog here</span>
            </a>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-16 pt-6 sm:grid-cols-3 lg:grid-cols-4">
          {dogs.map((d) => (
            <Frame key={d.id} dog={d} onOpen={() => setOpen(d)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[58] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-coal/90 backdrop-blur" onClick={() => setOpen(null)} aria-label="Close" tabIndex={-1} />
            <motion.figure
              role="dialog"
              aria-modal="true"
              aria-label={open.dogName}
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg"
            >
              <button autoFocus onClick={() => setOpen(null)} className="absolute -top-14 right-0 grid h-11 w-11 place-items-center rounded-full border border-[var(--line-strong)]" aria-label="Close">
                <X size={18} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={open.photoUrl} alt={open.dogName} className="max-h-[70dvh] w-full rounded-2xl object-contain" />
              <figcaption className="mt-5 text-center">
                <p className="display text-5xl">{open.dogName}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-ash">
                  {open.ownerFirst}&rsquo;s dog · on the wall since {new Date(open.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
                {open.story && <p className="mx-auto mt-4 max-w-md font-serif text-xl italic text-cream/85">&ldquo;{open.story}&rdquo;</p>}
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const field = "w-full rounded-xl border border-[var(--line-strong)] bg-coal/60 px-4 py-3.5 text-cream placeholder:text-smoke focus:border-amber focus:outline-none";

export function SubmitDog() {
  const toast = useUI((s) => s.toast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pickFile = (f?: File) => {
    setErr(null);
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return setErr("Use a JPG, PNG or WebP photo.");
    if (f.size > 5 * 1024 * 1024) return setErr("Photo must be under 5 MB.");
    const dt = new DataTransfer();
    dt.items.add(f);
    if (fileRef.current) fileRef.current.files = dt.files;
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    if (!fileRef.current?.files?.length) return setErr("Attach a photo of your dog.");
    setBusy(true);
    try {
      const res = await fetch("/api/dogs", { method: "POST", body: new FormData(e.currentTarget) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setDone(true);
      toast({ title: "Submitted for the wall", body: "The crew will review it soon." });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass flex flex-col items-center rounded-3xl p-10 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-amber text-coal"><Check size={28} /></span>
        <p className="display mt-6 text-5xl">Good dog.</p>
        <p className="mt-3 max-w-sm text-ash">Thanks! Once the crew approves it, your pup goes up on the digital wall. Want it on the real one? Bring a framed print to 212 W Broadway.</p>
        <button onClick={() => { setDone(false); setPreview(null); }} className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-amber">Submit another dog</button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="glass grid gap-6 rounded-3xl p-6 md:grid-cols-[1fr_1.2fr] md:p-8" noValidate>
      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files[0]); }}
        className={`relative flex aspect-[4/5] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition-colors ${drag ? "border-amber bg-amber/10" : "border-[var(--line-strong)] hover:border-amber/60"}`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your dog preview" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <span className="grid h-14 w-14 place-items-center rounded-full bg-cream/5 text-amber"><Camera size={24} /></span>
            <span className="mt-4 text-sm text-cream">Drop a photo or tap to choose</span>
            <span className="mt-1 text-xs text-smoke">JPG, PNG or WebP · max 5 MB</span>
          </>
        )}
        <input ref={fileRef} name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} />
      </label>

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ash">Dog&rsquo;s name</span>
            <input name="dogName" required maxLength={40} className={field} />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ash">Your name</span>
            <input name="ownerName" required maxLength={60} autoComplete="name" className={field} />
          </label>
        </div>
        <label className="block">
          <span className="mb-2 block font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ash">Email (never shown)</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        <label className="block">
          <span className="mb-2 block font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ash">Their story (optional)</span>
          <textarea name="story" rows={3} maxLength={280} placeholder="Favorite crust thief in Franklin County…" className={`${field} resize-none`} />
        </label>
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <label className="flex items-start gap-3 text-sm text-ash">
          <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-[#E5A93C]" />
          It&rsquo;s my photo, and Buddy&rsquo;s Pizza can post it on the wall and this website.
        </label>
        {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
        <button type="submit" disabled={busy} className="mt-auto flex h-14 items-center justify-center gap-3 rounded-full bg-amber font-mono text-xs font-medium uppercase tracking-[0.16em] text-coal disabled:opacity-60">
          {busy ? <LoaderCircle size={18} className="animate-spin" /> : <Upload size={16} />} Submit for review
        </button>
      </div>
    </form>
  );
}
