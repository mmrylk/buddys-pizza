"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Car, CircleParking, LoaderCircle, MapPin, Navigation, Phone, X, Footprints } from "lucide-react";
import { SITE } from "@/lib/site";
import { HOURS_TABLE, zonedNow } from "@/lib/hours";

function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

export function MapFrame({ className = "" }: { className?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-[var(--line)] bg-iron ${className}`}>
      {!loaded && <div className="skeleton absolute inset-0" aria-hidden />}
      <iframe
        title={`Map of ${SITE.address}`}
        src={SITE.mapEmbedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setLoaded(true)}
        className={`map-dark absolute inset-0 h-full w-full transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full" aria-hidden>
        <span className="relative flex h-5 w-5">
          <span className="absolute inset-0 animate-ping rounded-full bg-amber/60" />
          <span className="relative h-5 w-5 rounded-full border-2 border-coal bg-amber" />
        </span>
      </div>
    </div>
  );
}

type Route = { state: "idle" } | { state: "locating" } | { state: "done"; miles: number } | { state: "error"; msg: string };

export function RouteFinder() {
  const [r, setR] = useState<Route>({ state: "idle" });
  const locate = () => {
    if (!("geolocation" in navigator)) return setR({ state: "error", msg: "Location isn't available in this browser." });
    setR({ state: "locating" });
    navigator.geolocation.getCurrentPosition(
      (p) => setR({ state: "done", miles: haversineMiles({ lat: p.coords.latitude, lng: p.coords.longitude }, SITE) }),
      () => setR({ state: "error", msg: "Couldn't get your location. Use Directions instead." }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  };
  // Road distance is roughly 1.3× straight-line in a grid town; 25 mph average downtown.
  const road = r.state === "done" ? r.miles * 1.3 : 0;
  return (
    <div className="rounded-2xl border border-[var(--line)] p-4">
      {r.state === "done" ? (
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Distance" value={`${road < 10 ? road.toFixed(1) : Math.round(road)} mi`} />
          <Stat icon={<Car size={13} />} label="Drive" value={`~${Math.max(2, Math.round((road / 25) * 60))} min`} />
          <Stat icon={<Footprints size={13} />} label="Walk" value={road > 3 ? "—" : `~${Math.max(1, Math.round((road / 3) * 60))} min`} />
        </div>
      ) : (
        <button onClick={locate} className="flex w-full items-center justify-between gap-3 text-left" disabled={r.state === "locating"}>
          <span>
            <span className="block text-sm text-cream">How far am I?</span>
            <span className="block text-xs text-ash">{r.state === "error" ? r.msg : "Uses your location once. Never stored or sent."}</span>
          </span>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream/5 text-amber">
            {r.state === "locating" ? <LoaderCircle size={18} className="animate-spin" /> : <Navigation size={18} />}
          </span>
        </button>
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center justify-center gap-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-smoke">{icon}{label}</p>
      <p className="display mt-1 text-2xl text-cream">{value}</p>
    </div>
  );
}

export function ParkingButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);
  return (
    <>
      <button onClick={() => setOpen(true)} className={`inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line-strong)] px-5 py-3 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-cream transition-colors hover:border-amber hover:text-amber ${className}`}>
        <CircleParking size={16} /> Find parking
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[58] flex items-end justify-center p-0 md:items-center md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-coal/75 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close" tabIndex={-1} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="parking-title"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="relative w-full max-w-lg rounded-t-[2rem] border border-[var(--line-strong)] bg-iron p-7 pb-[calc(1.75rem+env(safe-area-inset-bottom))] md:rounded-[2rem]"
            >
              <button autoFocus onClick={() => setOpen(false)} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-[var(--line-strong)]" aria-label="Close">
                <X size={18} />
              </button>
              <p className="eyebrow">Downtown Frankfort</p>
              <h3 id="parking-title" className="display mt-2 text-5xl">Parking</h3>
              <ul className="mt-6 space-y-4 text-sm leading-relaxed text-cream/90">
                <li className="flex gap-3"><span className="font-mono text-amber">01</span> Street parking runs along W Broadway and the blocks around the shop.</li>
                <li className="flex gap-3"><span className="font-mono text-amber">02</span> Downtown public lots and garages are a short walk away. Tap below to see what&rsquo;s closest right now.</li>
                <li className="flex gap-3"><span className="font-mono text-amber">03</span> Weekday lunch is the busiest stretch. Give yourself a few extra minutes.</li>
                <li className="flex gap-3"><span className="font-mono text-amber">04</span> Running behind for a pickup? Call <a className="text-amber underline-offset-4 hover:underline" href={SITE.phoneHref}>{SITE.phone}</a>.</li>
              </ul>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("parking near 212 W Broadway St, Frankfort, KY 40601")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 flex h-12 items-center justify-center gap-2 rounded-full bg-amber font-mono text-[0.72rem] font-medium uppercase tracking-[0.16em] text-coal"
              >
                Show parking near us <ArrowUpRight size={16} />
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function HoursList() {
  const [dow, setDow] = useState<number | null>(null);
  useEffect(() => setDow(zonedNow().dow), []);
  return (
    <dl className="divide-y divide-[var(--line)]">
      {HOURS_TABLE.map((r) => {
        const today = dow != null && r.dows.includes(dow);
        return (
          <div key={r.days} className={`flex items-baseline justify-between gap-4 py-3 ${today ? "text-amber" : ""}`}>
            <dt className="font-mono text-xs uppercase tracking-[0.16em]">
              {r.days} {today && <span className="ml-2 rounded-full bg-amber/15 px-2 py-0.5 text-[0.6rem]">Today</span>}
            </dt>
            <dd className={`text-sm ${today ? "" : "text-cream/90"}`}>{r.hours}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function LocationBlock() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <MapFrame className="aspect-[4/3] lg:aspect-auto lg:min-h-[520px]" />
      <div className="glass flex flex-col gap-6 rounded-3xl p-7">
        <div>
          <p className="eyebrow flex items-center gap-2"><MapPin size={13} /> Downtown Historic District</p>
          <address className="display mt-3 text-4xl not-italic leading-[0.95]">
            {SITE.street}
            <br />
            <span className="text-ash">{SITE.city}, {SITE.region} {SITE.zip}</span>
          </address>
        </div>
        <HoursList />
        <RouteFinder />
        <div className="mt-auto flex flex-wrap gap-2">
          <a href={SITE.directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-amber px-5 py-3 font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-coal">
            <Navigation size={15} /> Directions
          </a>
          <ParkingButton className="flex-1" />
          <a href={SITE.phoneHref} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line-strong)] px-5 py-3 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-cream hover:border-amber hover:text-amber">
            <Phone size={15} /> {SITE.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
