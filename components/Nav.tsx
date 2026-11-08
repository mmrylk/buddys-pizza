"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu as MenuIcon, ShoppingBag, Volume2, VolumeX, X, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { StatusBadge } from "./StatusBadge";
import { useCart, cartCount } from "@/lib/cart";
import { useUI } from "@/lib/ui";
import { SITE } from "@/lib/site";

const LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/wall-of-fame", label: "Dog Wall" },
  { href: "/contact", label: "Visit & Catering" },
];

export function Nav() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const count = cartCount(useCart((s) => s.lines));
  const { setCartOpen, sound, setSound } = useUI();

  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem("buddys-sound") === "1") useUI.setState({ sound: true });
    } catch {}
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div
        className={`mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 transition-all duration-500 ease-[var(--ease-liquid)] sm:px-8 ${
          scrolled ? "mt-2 h-[64px] w-[calc(100%-1rem)] rounded-2xl glass shadow-[0_20px_60px_-20px_rgb(0_0_0/0.8)] sm:w-[calc(100%-2rem)]" : "h-[72px]"
        }`}
      >
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => {
            const active = path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative whitespace-nowrap rounded-full px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] transition-colors ${active ? "text-amber" : "text-cream/80 hover:text-cream"}`}
              >
                {active && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-cream/[0.06]" />}
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden 2xl:block"><StatusBadge /></span>
          <button
            onClick={() => setSound(!sound)}
            className="hidden h-10 w-10 place-items-center rounded-full text-ash transition-colors hover:text-cream md:grid"
            aria-label={sound ? "Turn order sounds off" : "Turn order sounds on"}
            aria-pressed={sound}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            onClick={() => setCartOpen(true)}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-[var(--line-strong)] text-cream transition-colors hover:border-amber hover:text-amber"
            aria-label={`Open cart, ${mounted ? count : 0} items`}
          >
            <ShoppingBag size={18} />
            {mounted && count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brick px-1 font-mono text-[0.6rem] text-cream"
              >
                {count}
              </motion.span>
            )}
          </button>
          <Link
            href="/menu"
            className="hidden h-10 items-center rounded-full bg-amber px-5 font-mono text-[0.72rem] font-medium uppercase tracking-[0.16em] text-coal transition-transform hover:-translate-y-0.5 md:inline-flex"
          >
            Order Online
          </Link>
          <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full text-cream md:hidden" aria-label="Open menu" aria-expanded={open}>
            <MenuIcon size={22} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "circle(0% at 92% 4%)" }}
            animate={{ clipPath: "circle(150% at 92% 4%)" }}
            exit={{ clipPath: "circle(0% at 92% 4%)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col bg-coal px-6 pb-10 pt-5"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line-strong)]" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <nav className="mt-14 flex flex-col gap-2" aria-label="Mobile">
              {[{ href: "/", label: "Home" }, ...LINKS].map((l, i) => (
                <motion.div key={l.href} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.06 }}>
                  <Link href={l.href} className="display block text-[3.4rem] text-cream active:text-amber">
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="mt-auto space-y-4">
              <StatusBadge />
              <a href={SITE.phoneHref} className="flex items-center gap-3 font-mono text-sm tracking-widest text-amber">
                <Phone size={16} /> {SITE.phone}
              </a>
              <p className="text-sm text-ash">{SITE.address}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
