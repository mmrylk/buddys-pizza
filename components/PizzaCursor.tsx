"use client";
import { useEffect, useRef } from "react";

/** A trailing pizza-slice cursor for mouse users. Off for touch and reduced motion. */
export function PizzaCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (!fine || calm || !el) return;
    document.documentElement.classList.add("pizza-cursor");
    let x = -100, y = -100, cx = x, cy = y, raf = 0, hot = false, down = false;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const t = e.target as HTMLElement | null;
      hot = !!t?.closest("a,button,[role=button],label,summary");
      el.style.opacity = t?.closest("input,textarea,select,iframe") ? "0" : "1";
    };
    const press = () => (down = true);
    const release = () => (down = false);
    const leave = () => (el.style.opacity = "0");
    const loop = () => {
      cx += (x - cx) * 0.28;
      cy += (y - cy) * 0.28;
      const tilt = Math.max(-25, Math.min(25, (x - cx) * 1.2));
      const s = down ? 0.82 : hot ? 1.35 : 1;
      el.style.transform = `translate3d(${cx - 4}px, ${cy - 4}px, 0) rotate(${-20 + tilt}deg) scale(${s})`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    document.documentElement.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("pizza-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] opacity-0 transition-opacity duration-200"
      style={{ transformOrigin: "4px 4px", willChange: "transform" }}
    >
      <svg width="30" height="30" viewBox="0 0 30 30" className="drop-shadow-[0_4px_10px_rgb(229_169_60/0.45)]">
        <path d="M2 2 L28 9 Q25 20 9 28 Z" fill="#E5A93C" />
        <path d="M4.5 4.5 L25.5 10.2 Q22.6 19 10 25.5 Z" fill="#F7D98D" />
        <circle cx="11" cy="11" r="2.3" fill="#B22222" />
        <circle cx="17.5" cy="13.5" r="2" fill="#B22222" />
        <circle cx="12" cy="19" r="1.8" fill="#B22222" />
      </svg>
    </div>
  );
}
