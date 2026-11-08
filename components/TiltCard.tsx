"use client";
import { useRef, type ReactNode } from "react";

/** Pointer-tracked 3D tilt with a moving glare. CSS transforms only (GPU). */
export function TiltCard({ children, className = "", max = 8 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--rx", `${(0.5 - py) * max}deg`);
      el.style.setProperty("--ry", `${(px - 0.5) * max}deg`);
      el.style.setProperty("--gx", `${px * 100}%`);
      el.style.setProperty("--gy", `${py * 100}%`);
      el.style.setProperty("--glare", "1");
    });
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glare", "0");
  };

  return (
    <div style={{ perspective: "1000px" }} className="h-full">
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className={`relative h-full transition-transform duration-300 ease-out [transform:rotateX(var(--rx,0))_rotateY(var(--ry,0))] [transform-style:preserve-3d] ${className}`}
      >
        {children}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[var(--glare,0)] transition-opacity duration-300"
          style={{ background: "radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgb(229 169 60 / .16), transparent 55%)" }}
        />
      </div>
    </div>
  );
}
