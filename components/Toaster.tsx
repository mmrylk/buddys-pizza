"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useUI } from "@/lib/ui";

export function Toaster() {
  const { toasts, dismiss } = useUI();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--mobile-bar)+1rem)] z-[70] flex flex-col items-center gap-2 px-4 md:bottom-auto md:left-auto md:right-6 md:top-24 md:items-end"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.94, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 40, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-[var(--line-strong)] bg-iron/90 p-4 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl"
          >
            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${t.tone === "error" ? "bg-brick" : "bg-amber text-coal"}`}>
              {t.tone === "error" ? <X size={14} /> : <Check size={14} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-cream">{t.title}</p>
              {t.body && <p className="mt-0.5 truncate text-xs text-ash">{t.body}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-smoke hover:text-cream" aria-label="Dismiss">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
