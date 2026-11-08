import Link from "next/link";
import { Logo } from "./Logo";
import { SITE } from "@/lib/site";
import { HOURS_TABLE } from "@/lib/hours";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--line)] bg-coal">
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-brick/20 blur-[120px]" aria-hidden />
      <div className="relative mx-auto grid max-w-[1440px] gap-12 px-4 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs font-serif text-xl italic leading-snug text-ash">
            Brick-oven New York pies in the heart of downtown Frankfort, named for the best dog there ever was.
          </p>
        </div>
        <div>
          <p className="eyebrow">Find us</p>
          <address className="mt-4 not-italic text-sm leading-relaxed text-cream/90">
            {SITE.street}
            <br />
            {SITE.city}, {SITE.region} {SITE.zip}
          </address>
          <a href={SITE.phoneHref} className="mt-3 inline-block font-mono text-sm text-amber">{SITE.phone}</a>
        </div>
        <div>
          <p className="eyebrow">Hours</p>
          <dl className="mt-4 space-y-2 text-sm">
            {HOURS_TABLE.map((r) => (
              <div key={r.days} className="flex justify-between gap-4">
                <dt className="text-ash">{r.days}</dt>
                <dd className="text-cream/90">{r.hours}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-smoke">Slices &amp; lunch Tue–Fri, 11 AM – 2 PM</p>
        </div>
        <div>
          <p className="eyebrow">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ["/menu", "Order online"],
              ["/wall-of-fame", "The Dog Wall"],
              ["/contact", "Catering & contact"],
              ["/checkout", "Checkout"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-cream/90 transition-colors hover:text-amber">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="relative overflow-hidden border-t border-[var(--line)]">
        <p className="display select-none whitespace-nowrap py-4 text-center text-[18vw] leading-[0.8] text-cream/[0.04]" aria-hidden>
          Buddy&rsquo;s Pizza
        </p>
      </div>
      <div className="relative mx-auto flex max-w-[1440px] flex-col justify-between gap-2 px-4 pb-8 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-smoke sm:flex-row sm:px-8">
        <span>© {new Date().getFullYear()} Buddy&rsquo;s Pizza · Est. 2006</span>
        <span>Frankfort, Kentucky</span>
      </div>
    </footer>
  );
}
