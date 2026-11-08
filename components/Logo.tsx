import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="Buddy's Pizza home">
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0 transition-transform duration-500 ease-[var(--ease-liquid)] group-hover:-rotate-12" aria-hidden>
        <circle cx="20" cy="20" r="19" fill="#121212" stroke="#E5A93C" strokeWidth="1.5" />
        <path d="M20 6 L33 30 Q20 36 7 30 Z" fill="#E5A93C" />
        <path d="M20 10 L30.4 29 Q20 33.6 9.6 29 Z" fill="#F4D58A" />
        <circle cx="18" cy="20" r="2.4" fill="#B22222" />
        <circle cx="23.5" cy="26" r="2.2" fill="#B22222" />
        <circle cx="15" cy="27" r="1.9" fill="#B22222" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="display text-[1.55rem] tracking-wide text-cream">Buddy&rsquo;s</span>
        {!compact && <span className="mt-1 font-mono text-[0.55rem] uppercase tracking-[0.3em] text-ash">Brick Oven · Est. 2006</span>}
      </span>
    </Link>
  );
}
