"use client";
import { create } from "zustand";

export type Toast = { id: number; title: string; body?: string; tone?: "ok" | "error" };

type UIState = {
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  editing: string | null; // menu item id open in the customizer
  openItem: (id: string | null) => void;
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
  sound: boolean;
  setSound: (v: boolean) => void;
};

let seq = 0;
export const useUI = create<UIState>()((set, get) => ({
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  editing: null,
  openItem: (editing) => set({ editing }),
  toasts: [],
  toast: (t) => {
    const id = ++seq;
    set({ toasts: [...get().toasts, { ...t, id }].slice(-3) });
    setTimeout(() => get().dismiss(id), 3200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((x) => x.id !== id) }),
  sound: false,
  setSound: (sound) => {
    set({ sound });
    try { localStorage.setItem("buddys-sound", sound ? "1" : "0"); } catch {}
  },
}));

let ctx: AudioContext | null = null;
/** Short synthesized "pop" — no audio files to download. */
export function playPop() {
  if (!useUI.getState().sound) return;
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(520, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.2);
  } catch {}
}
