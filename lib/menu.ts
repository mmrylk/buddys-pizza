/**
 * Buddy's Pizza — menu source of truth.
 *
 * Transcribed from the store's printed menu "Buddys-Menu_10-12-26.pdf"
 * (dated Oct 12, 2026, linked from the links2thebluegrass.com listing).
 * Server routes re-price every order from this file, so editing a price here
 * changes what customers are charged.
 *
 * Items flagged `verify: true` are not on the Oct 2026 printed menu, or the
 * PDF layout was ambiguous. Confirm them with the store before launch.
 */

export type Size = "12" | "16" | "22";
export const SIZES: { id: Size; label: string; nickname: string }[] = [
  { id: "12", label: '12"', nickname: "Small" },
  { id: "16", label: '16"', nickname: "Large" },
  { id: "22", label: '22"', nickname: "Great Dane" },
];

export type Category =
  | "specialty"
  | "byo"
  | "calzone"
  | "sandwich"
  | "salad"
  | "sides"
  | "lunch";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "specialty", label: "Specialty Pies" },
  { id: "byo", label: "Build Your Own" },
  { id: "calzone", label: "Calzone & Stromboli" },
  { id: "sandwich", label: "Hot Sandwiches" },
  { id: "salad", label: "Salads" },
  { id: "sides", label: "Sides & Plates" },
  { id: "lunch", label: "Lunch Window" },
];

export type Tag = "vegetarian" | "meat" | "chicken" | "spicy" | "white";

export type ToppingTier = "regular" | "specialty";
export type Topping = { id: string; label: string; group: "Meats" | "Veggies" | "Specialty"; tier: ToppingTier };

export const TOPPINGS: Topping[] = [
  ...["Pepperoni", "Sausage", "Ham", "Bacon", "Beef", "Salami"].map((l) => ({
    id: slug(l), label: l, group: "Meats" as const, tier: "regular" as const,
  })),
  ...["Onions", "Green Peppers", "Tomato", "Mushrooms", "Green Olives", "Black Olives", "Pineapple", "Spinach", "Banana Peppers", "Jalapeños"].map((l) => ({
    id: slug(l), label: l, group: "Veggies" as const, tier: "regular" as const,
  })),
  ...["Meatballs", "Grilled Chicken", "Artichoke Hearts", "Feta Cheese", "Vegan Cheese"].map((l) => ({
    id: slug(l), label: l, group: "Specialty" as const, tier: "specialty" as const,
  })),
];

/**
 * Per-topping price by pie size.
 * verify: the PDF lists $2 / $2.50 / $3 / $3.50 / $4 / $5 without a clear grid.
 * Read here as regular $2/$3/$4 and specialty $2.50/$3.50/$5.
 */
export const TOPPING_PRICES: Record<ToppingTier, Record<Size, number>> = {
  regular: { "12": 2, "16": 3, "22": 4 },
  specialty: { "12": 2.5, "16": 3.5, "22": 5 },
};

/** Calzone: "additional toppings up to 5 — $1.50 each". */
export const CALZONE_TOPPING_PRICE = 1.5;
export const CALZONE_TOPPING_MAX = 5;
export const PIZZA_TOPPING_MAX = 10;

export type Choice = { id: string; label: string; price?: number };
export type OptionGroup = { id: string; label: string; required: boolean; multi?: boolean; choices: Choice[] };

export type MenuItem = {
  id: string;
  name: string;
  category: Category;
  description: string;
  tags: Tag[];
  /** Flat price, or per-size prices for pies. */
  price?: number;
  sizes?: Partial<Record<Size, number>>;
  toppings?: "pizza" | "calzone";
  options?: OptionGroup[];
  /** Only orderable for times inside the Tue–Fri 11–2 lunch window. */
  window?: "lunch";
  featured?: boolean;
  verify?: boolean;
};

const DRESSINGS: Choice[] = [
  "Ranch", "Caesar", "French", "Italian", "Blue Cheese", "Balsamic Vinaigrette",
  "1000 Island", "Honey Mustard", "Red Wine Vinaigrette",
].map((l) => ({ id: slug(l), label: l }));

const SALAD_OPTIONS: OptionGroup[] = [
  { id: "dressing", label: "Dressing", required: true, choices: DRESSINGS },
  { id: "addons", label: "Add-ons", required: false, multi: true, choices: [{ id: "chicken", label: "Add Chicken", price: 3 }] },
];

const pie = (
  id: string, name: string, description: string, tags: Tag[], s12: number, s16: number, s22: number, featured = false,
): MenuItem => ({
  id, name, category: "specialty", description, tags, sizes: { "12": s12, "16": s16, "22": s22 }, toppings: "pizza", featured,
});

export const MENU: MenuItem[] = [
  // ── Specialty pies (12" / 16" / 22") ─────────────────────────────
  pie("pesto", "Pesto", "Pesto base, spinach, mushrooms, tomato", ["vegetarian"], 16, 22, 37),
  pie("veggie", "Veggie", "Mushrooms, tomato, onion, spinach, green peppers, green olives, black olives", ["vegetarian"], 18, 25, 40),
  pie("meathead", "Meathead", "Pepperoni, sausage, ham, bacon, beef", ["meat"], 18, 25, 40, true),
  pie("hawaiian", "Hawaiian", "Ham, pineapple, onion", ["meat"], 16, 21, 37),
  pie("bbq-chicken", "BBQ Chicken", "BBQ base, grilled chicken, pineapple, onion, cilantro", ["chicken"], 18, 24, 40, true),
  pie("little-bill", "Little Bill", "Bacon, sausage, pepperoni, garlic, oregano", ["meat"], 18, 23, 36),
  pie("big-bear", "Big Bear", "Roasted garlic & olive oil base, bacon, sausage, tomato", ["meat", "white"], 18, 22, 36),
  pie("la-blanca", "La Blanca", "Roasted garlic & olive oil base, tomato, feta, fresh basil", ["vegetarian", "white"], 18, 22, 40, true),
  pie("supreme", "Supreme", "Pepperoni, sausage, onion, green pepper, black olives, mushrooms", ["meat"], 18, 24, 40),
  pie("jerk-chicken", "Jerk Chicken", "Jerk sauce, chicken, onion, sweet peppers", ["chicken", "spicy"], 18, 24, 40),
  pie("buffalo-chicken", "Buffalo Chicken", "Buffalo sauce, chicken, onion, sweet peppers", ["chicken", "spicy"], 18, 24, 40),

  // ── Build your own ───────────────────────────────────────────────
  {
    id: "byo-cheese", name: "Build Your Own", category: "byo",
    description: "Hand-tossed NY crust, red sauce, mozzarella. Stack it however you like.",
    tags: ["vegetarian"], sizes: { "12": 12, "16": 15, "22": 25 }, toppings: "pizza", featured: true,
  },

  // ── Calzone & stromboli ──────────────────────────────────────────
  {
    id: "calzone", name: "Calzone", category: "calzone",
    description: "Folded in the brick oven with mozzarella and ricotta. Up to 5 extra toppings.",
    tags: ["vegetarian"], price: 10, toppings: "calzone", featured: true,
  },
  {
    id: "stromboli", name: "Stromboli", category: "calzone",
    description: "Pepperoni, sausage, sautéed peppers, onion, pizza sauce, mozzarella",
    tags: ["meat"], price: 11, featured: true,
  },

  // ── Hot sandwiches ───────────────────────────────────────────────
  { id: "italian", name: "Italian", category: "sandwich", price: 11, tags: ["meat"], featured: true,
    description: "Ham, sausage, salami, onion, sautéed peppers, lettuce, tomato, red wine vinaigrette, mozzarella" },
  { id: "ham-cheese", name: "Ham & Cheese", category: "sandwich", price: 10, tags: ["meat"],
    description: "Ham, mushrooms, mozzarella" },
  { id: "veggie-sub", name: "Veggie", category: "sandwich", price: 11, tags: ["vegetarian"],
    description: "Tomato, onion, sautéed peppers, spinach, artichoke, black olives, pesto, mozzarella" },
  { id: "pizza-sub", name: "Pizza Sub", category: "sandwich", price: 10, tags: ["meat"],
    description: "Pepperoni, sausage, mozzarella, pizza sauce" },
  { id: "meatball-sub", name: "Meatball", category: "sandwich", price: 12, tags: ["meat"], featured: true,
    description: "Meatballs, mozzarella, marinara" },
  { id: "chicken-pesto", name: "Chicken Pesto", category: "sandwich", price: 11, tags: ["chicken"],
    description: "Chicken, artichoke, tomato, pesto, mozzarella" },
  { id: "turkey-club", name: "Turkey Club", category: "sandwich", price: 11, tags: ["meat"],
    description: "Turkey, bacon, mozzarella, lettuce, tomato, mayonnaise" },
  { id: "downtowner", name: "Downtowner", category: "sandwich", price: 12, tags: ["meat"],
    description: "Capicola, salami, ham, pepperoni, provolone, lettuce, tomato, mayo, red wine vinegar" },
  { id: "chicken-parm", name: "Grilled Chicken Parmesan", category: "sandwich", price: 11, tags: ["chicken"],
    description: "Chicken, mushrooms, marinara, parmesan" },

  // ── Salads ───────────────────────────────────────────────────────
  { id: "chef-salad", name: "Chef", category: "salad", price: 12.5, tags: ["meat"], options: SALAD_OPTIONS,
    description: "Romaine, spinach, onion, carrots, cucumbers, tomato, bell peppers, ham, mozzarella" },
  { id: "greek-salad", name: "Greek", category: "salad", price: 12.5, tags: ["vegetarian"], options: SALAD_OPTIONS, featured: true,
    description: "Romaine, spinach, tomato, onion, carrots, cucumber, banana peppers, black olives, bell peppers, feta" },
  { id: "caesar-salad", name: "Caesar", category: "salad", price: 10, tags: [], options: SALAD_OPTIONS,
    description: "Romaine, spinach, croutons, parmesan" },
  { id: "tossed-salad", name: "Tossed", category: "salad", price: 9, tags: ["vegetarian"], options: SALAD_OPTIONS,
    description: "Romaine, spinach, bell peppers, tomato, cucumber, carrots, onion" },

  // ── Sides & plates ───────────────────────────────────────────────
  { id: "breadsticks", name: "Breadsticks (4)", category: "sides", price: 5, tags: ["vegetarian"], featured: true,
    description: "Four oven-baked sticks, straight from the bricks" },
  { id: "cheesebread", name: "Cheesebread", category: "sides", price: 11, tags: ["vegetarian"], featured: true,
    description: "Blistered mozzarella over brick-oven dough" },
  { id: "meatballs", name: "Meatballs", category: "sides", price: 9, tags: ["meat"],
    description: "3 meatballs, marinara, mozzarella cheese" },
  {
    id: "lasagna-rolls", name: "Lasagna Rolls (Dinner)", category: "sides", price: 16, tags: [],
    description: "Rolled lasagna with your choice of sauce",
    options: [{ id: "sauce", label: "Sauce", required: true, choices: ["Meat Sauce", "Alfredo", "Marinara"].map((l) => ({ id: slug(l), label: l })) }],
  },

  // ── Lunch window (Tue–Fri 11–2) ──────────────────────────────────
  {
    id: "lasagna-rolls-lunch", name: "Lasagna Rolls (Lunch)", category: "lunch", price: 14, tags: [], window: "lunch",
    description: "Lunch-portion lasagna rolls with your choice of sauce",
    options: [{ id: "sauce", label: "Sauce", required: true, choices: ["Meat Sauce", "Alfredo", "Marinara"].map((l) => ({ id: slug(l), label: l })) }],
  },
  {
    id: "ny-slice", name: "Giant NY Slice", category: "lunch", price: 2.5, tags: ["vegetarian"], window: "lunch", featured: true, verify: true,
    description: "A foldable, plate-hanging cheese slice. Lunch hours only.",
  },
];

export const GLUTEN_FREE_NOTE = 'All pizzas available on a gluten-free 10" cauliflower crust. Call the shop to order one.';

export function getItem(id: string): MenuItem | undefined {
  return MENU.find((m) => m.id === id);
}

export function getTopping(id: string): Topping | undefined {
  return TOPPINGS.find((t) => t.id === id);
}

export function startingPrice(item: MenuItem): number {
  if (item.price != null) return item.price;
  return Math.min(...Object.values(item.sizes ?? {}).filter((n): n is number => typeof n === "number"));
}

function slug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
