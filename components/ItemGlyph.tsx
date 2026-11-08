import type { MenuItem } from "@/lib/menu";

/**
 * Procedural top-down illustration drawn from the item's real ingredient list.
 * No stock photos: every pie gets its own deterministic topping layout.
 */

type Spec = { color: string; shape: "disc" | "blob" | "ring" | "strip" | "square" | "leaf"; size: number };

const INGREDIENTS: [RegExp, Spec][] = [
  [/pepperoni/i, { color: "#A3191B", shape: "disc", size: 5.2 }],
  [/sausage|beef/i, { color: "#6B3A22", shape: "blob", size: 3.4 }],
  [/bacon/i, { color: "#B5463A", shape: "strip", size: 6 }],
  [/ham|capicola/i, { color: "#E39A8C", shape: "square", size: 4.2 }],
  [/salami/i, { color: "#8E2430", shape: "disc", size: 4.4 }],
  [/chicken/i, { color: "#E9CFA0", shape: "blob", size: 4 }],
  [/meatball/i, { color: "#5A2E1C", shape: "disc", size: 5.4 }],
  [/mushroom/i, { color: "#C9B08A", shape: "blob", size: 3.6 }],
  [/green pepper|bell pepper|sweet pepper|sauteed pepper|sautéed pepper/i, { color: "#3F8A3A", shape: "strip", size: 5 }],
  [/green olive/i, { color: "#7C9A2E", shape: "ring", size: 2.6 }],
  [/black olive/i, { color: "#1B1B1B", shape: "ring", size: 2.6 }],
  [/onion/i, { color: "#EFE3F0", shape: "ring", size: 3.4 }],
  [/tomato/i, { color: "#E2492F", shape: "disc", size: 4.6 }],
  [/pineapple/i, { color: "#F2C94C", shape: "square", size: 3.6 }],
  [/spinach|basil|cilantro|lettuce|romaine/i, { color: "#2E6B2B", shape: "leaf", size: 4.6 }],
  [/feta|ricotta|parmesan|parmesean/i, { color: "#FFFDF4", shape: "square", size: 2.8 }],
  [/jalap/i, { color: "#4E9A3A", shape: "ring", size: 3 }],
  [/banana pepper/i, { color: "#E8D35A", shape: "ring", size: 3 }],
  [/artichoke/i, { color: "#9DAA63", shape: "leaf", size: 4 }],
  [/carrot/i, { color: "#E8822C", shape: "strip", size: 4 }],
  [/cucumber/i, { color: "#A8CF7A", shape: "ring", size: 3.6 }],
  [/crouton/i, { color: "#C8913F", shape: "square", size: 3.6 }],
];

function sauceOf(desc: string): [string, string] {
  if (/pesto base/i.test(desc)) return ["#4E7A2A", "#86A845"];
  if (/bbq/i.test(desc)) return ["#6B2A15", "#9A4A22"];
  if (/buffalo/i.test(desc)) return ["#C2461A", "#E5703A"];
  if (/jerk/i.test(desc)) return ["#7A2A12", "#B5451E"];
  if (/garlic & olive oil|alfredo/i.test(desc)) return ["#E9D9A6", "#F6EBC8"];
  return ["#A8241E", "#C7392C"];
}

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function Topping({ s, x, y, r }: { s: Spec; x: number; y: number; r: number }) {
  const k = s.size;
  switch (s.shape) {
    case "disc":
      return <circle cx={x} cy={y} r={k} fill={s.color} stroke="rgb(0 0 0 / .18)" strokeWidth=".6" />;
    case "blob":
      return <ellipse cx={x} cy={y} rx={k} ry={k * 0.72} transform={`rotate(${r} ${x} ${y})`} fill={s.color} />;
    case "ring":
      return <circle cx={x} cy={y} r={k} fill="none" stroke={s.color} strokeWidth={k * 0.55} />;
    case "strip":
      return <rect x={x - k} y={y - 1.1} width={k * 2} height={2.2} rx={1.1} transform={`rotate(${r} ${x} ${y})`} fill={s.color} />;
    case "square":
      return <rect x={x - k / 2} y={y - k / 2} width={k} height={k} rx={0.8} transform={`rotate(${r} ${x} ${y})`} fill={s.color} />;
    case "leaf":
      return <path d={`M${x - k} ${y} Q${x} ${y - k} ${x + k} ${y} Q${x} ${y + k} ${x - k} ${y}Z`} transform={`rotate(${r} ${x} ${y})`} fill={s.color} />;
  }
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function scatter(item: MenuItem, count: number, radius: number, cx = 50, cy = 50) {
  const rand = rng(item.id);
  const specs = INGREDIENTS.filter(([re]) => re.test(item.description)).map(([, s]) => s);
  const out: { s: Spec; x: number; y: number; r: number }[] = [];
  if (!specs.length) return out;
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * radius;
    // Rounded so server and browser render identical markup (Math.cos can differ in the last digit).
    out.push({ s: specs[i % specs.length], x: r2(cx + Math.cos(a) * d), y: r2(cy + Math.sin(a) * d), r: r2(rand() * 180) });
  }
  return out;
}

export function ItemGlyph({ item, className = "" }: { item: MenuItem; className?: string }) {
  const id = `g-${item.id}`;
  const kind = item.category === "specialty" || item.category === "byo" || item.id === "ny-slice" ? "pie" : item.category;

  if (kind === "pie") {
    const [sauce, sauceHi] = sauceOf(item.description);
    const dots = scatter(item, item.id === "byo-cheese" || item.id === "ny-slice" ? 0 : 26, 30);
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        <defs>
          <radialGradient id={`${id}-crust`} cx="45%" cy="40%">
            <stop offset="70%" stopColor="#E5A93C" />
            <stop offset="92%" stopColor="#B97F1F" />
            <stop offset="100%" stopColor="#4A2A0C" />
          </radialGradient>
          <radialGradient id={`${id}-sauce`} cx="40%" cy="38%">
            <stop offset="0%" stopColor={sauceHi} />
            <stop offset="100%" stopColor={sauce} />
          </radialGradient>
          <filter id={`${id}-char`}>
            <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed={item.id.length} />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.15" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
        <circle cx="50" cy="50" r="47" fill={`url(#${id}-crust)`} />
        <circle cx="50" cy="50" r="47" fill="#000" opacity=".5" filter={`url(#${id}-char)`} />
        <circle cx="50" cy="50" r="39" fill={`url(#${id}-sauce)`} />
        <circle cx="50" cy="50" r="37" fill="#F6E3A6" opacity=".82" />
        <circle cx="44" cy="44" r="18" fill="#FFF3C9" opacity=".35" />
        {dots.map((d, i) => (
          <Topping key={i} {...d} />
        ))}
        {[0, 60, 120].map((a) => (
          <line key={a} x1="50" y1="50" x2={r2(50 + Math.cos((a * Math.PI) / 180) * 47)} y2={r2(50 + Math.sin((a * Math.PI) / 180) * 47)} stroke="rgb(60 30 5 / .22)" strokeWidth=".7" />
        ))}
        {[0, 60, 120].map((a) => (
          <line key={`b${a}`} x1="50" y1="50" x2={r2(50 - Math.cos((a * Math.PI) / 180) * 47)} y2={r2(50 - Math.sin((a * Math.PI) / 180) * 47)} stroke="rgb(60 30 5 / .22)" strokeWidth=".7" />
        ))}
      </svg>
    );
  }

  if (kind === "calzone") {
    const dots = scatter(item, 10, 14, 50, 58);
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        <path d="M10 66 Q50 4 90 66 Q50 80 10 66Z" fill="#E5A93C" />
        <path d="M10 66 Q50 80 90 66" fill="none" stroke="#8A5715" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 7" />
        <path d="M26 46 Q50 22 74 46" fill="none" stroke="#FFF3C9" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" />
        {item.id === "stromboli" && dots.map((d, i) => <Topping key={i} {...d} s={{ ...d.s, size: d.s.size * 0.6 }} />)}
        {[34, 50, 66].map((x) => (
          <path key={x} d={`M${x - 3} ${44} l6 -6`} stroke="#6B3E0E" strokeWidth="2" strokeLinecap="round" />
        ))}
      </svg>
    );
  }

  if (kind === "sandwich") {
    const dots = scatter(item, 12, 10, 50, 50).map((d) => ({ ...d, y: r2(46 + (d.y - 50) * 0.35), x: r2(20 + ((d.x - 40) / 20) * 60) }));
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        <rect x="8" y="50" width="84" height="20" rx="10" fill="#C8862E" />
        {dots.map((d, i) => (
          <Topping key={i} {...d} s={{ ...d.s, size: d.s.size * 0.8 }} />
        ))}
        <path d="M8 46 Q8 26 30 26 L70 26 Q92 26 92 46 Z" fill="#E5A93C" />
        {[28, 44, 60, 76].map((x) => (
          <path key={x} d={`M${x} 32 q4 -3 8 0`} stroke="#FFF3C9" strokeOpacity=".6" strokeWidth="2" fill="none" strokeLinecap="round" />
        ))}
      </svg>
    );
  }

  if (kind === "salad") {
    const dots = scatter(item, 30, 30);
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        <circle cx="50" cy="50" r="47" fill="#FDFBF7" opacity=".92" />
        <circle cx="50" cy="50" r="40" fill="#2B4F25" />
        {dots.map((d, i) => (
          <Topping key={i} {...d} />
        ))}
      </svg>
    );
  }

  // Sides & plates
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <ellipse cx="50" cy="56" rx="44" ry="36" fill="#2A2522" />
      {item.id === "breadsticks" &&
        [0, 1, 2, 3].map((i) => <rect key={i} x="18" y={30 + i * 11} width="64" height="8" rx="4" fill="#E5A93C" transform={`rotate(${-8 + i * 4} 50 ${34 + i * 11})`} />)}
      {item.id === "cheesebread" && (
        <>
          <rect x="16" y="30" width="68" height="46" rx="8" fill="#E5A93C" />
          <rect x="21" y="35" width="58" height="36" rx="5" fill="#F6E3A6" />
          {[38, 56].map((x) => <line key={x} x1={x} y1="30" x2={x} y2="76" stroke="#B97F1F" strokeWidth="1.5" />)}
        </>
      )}
      {(item.id === "meatballs" || item.id.startsWith("lasagna")) && (
        <>
          <ellipse cx="50" cy="56" rx="34" ry="26" fill="#A8241E" />
          {(item.id === "meatballs" ? [[38, 52], [60, 50], [50, 66]] : [[34, 56], [50, 54], [66, 56]]).map(([x, y], i) =>
            item.id === "meatballs" ? (
              <circle key={i} cx={x} cy={y} r="10" fill="#5A2E1C" />
            ) : (
              <g key={i}>
                <circle cx={x} cy={y} r="9" fill="#F0D9A0" />
                <path d={`M${x} ${y} m-5 0 a5 5 0 1 1 5 5`} fill="none" stroke="#A8241E" strokeWidth="2" />
              </g>
            ),
          )}
          <circle cx="44" cy="48" r="4" fill="#FFF3C9" opacity=".7" />
        </>
      )}
    </svg>
  );
}
