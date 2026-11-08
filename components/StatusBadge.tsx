"use client";
import { useEffect, useState } from "react";
import { storeStatus, type StoreStatus } from "@/lib/hours";

export function useStoreStatus() {
  const [s, setS] = useState<StoreStatus | null>(null);
  useEffect(() => {
    const tick = () => setS(storeStatus());
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);
  return s;
}

/** Fixed-size pill so hydration never shifts the layout. */
export function StatusBadge({ className = "" }: { className?: string }) {
  const s = useStoreStatus();
  const tone = !s ? "bg-cream/10" : s.open ? (s.closingSoon ? "bg-amber" : "bg-emerald-400") : "bg-brick";
  return (
    <span
      className={`inline-flex h-8 min-w-[15.5rem] items-center gap-2.5 rounded-full border border-[var(--line-strong)] bg-coal/60 px-3.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-cream backdrop-blur ${className}`}
      aria-live="polite"
    >
      <span className={`relative inline-block h-2 w-2 shrink-0 rounded-full ${tone} ${s?.open ? "ember-pulse" : ""}`} aria-hidden />
      {s ? (
        <span className="whitespace-nowrap">
          <b className="font-medium">{s.headline}</b>
          <span className="text-ash"> • {s.detail}</span>
        </span>
      ) : (
        <span className="skeleton h-3 w-44 rounded" aria-label="Checking hours" />
      )}
    </span>
  );
}
