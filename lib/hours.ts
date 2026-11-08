/**
 * Store hours and order-time rules, always evaluated in Frankfort's time zone
 * so the server and every browser agree no matter where they run.
 */

export const TZ = "America/New_York";
export const PREP_MINUTES = 20;
export const SLOT_STEP = 15;

type Window = { open: number; close: number } | null;
const h = (hh: number, mm = 0) => hh * 60 + mm;

/** Index = day of week, 0 = Sunday. */
export const HOURS: Window[] = [
  null, // Sun
  null, // Mon
  { open: h(11), close: h(21) }, // Tue
  { open: h(11), close: h(21) }, // Wed
  { open: h(11), close: h(21) }, // Thu
  { open: h(11), close: h(21) }, // Fri
  { open: h(12), close: h(21) }, // Sat
];

/** Slices and lunch plates: Tue–Fri 11:00 AM – 2:00 PM. */
export const LUNCH = { days: [2, 3, 4, 5], start: h(11), end: h(14) };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const HOURS_TABLE = [
  { days: "Tue – Fri", hours: "11:00 AM – 9:00 PM", dows: [2, 3, 4, 5] },
  { days: "Saturday", hours: "12:00 PM – 9:00 PM", dows: [6] },
  { days: "Sun & Mon", hours: "Closed", dows: [0, 1] },
];

export type ZonedNow = { date: string; dow: number; minutes: number };

export function zonedNow(d: Date = new Date()): ZonedNow {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
  });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  const hour = Number(p.hour) % 24;
  return { date: `${p.year}-${p.month}-${p.day}`, dow: DAY_SHORT.indexOf(p.weekday), minutes: hour * 60 + Number(p.minute) };
}

export function addDays(date: string, n: number): { date: string; dow: number } {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return { date: t.toISOString().slice(0, 10), dow: t.getUTCDay() };
}

export function dowOf(date: string): number {
  return addDays(date, 0).dow;
}

export function fmtTime(min: number): string {
  const hh = Math.floor(min / 60);
  const mm = min % 60;
  const suffix = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${suffix}`;
}

export function isLunchWindow(dow: number, minutes: number): boolean {
  return LUNCH.days.includes(dow) && minutes >= LUNCH.start && minutes < LUNCH.end;
}

export type StoreStatus = { open: boolean; closingSoon: boolean; headline: string; detail: string; lunchNow: boolean };

export function storeStatus(d: Date = new Date()): StoreStatus {
  const now = zonedNow(d);
  const today = HOURS[now.dow];
  const lunchNow = isLunchWindow(now.dow, now.minutes);
  if (today && now.minutes >= today.open && now.minutes < today.close) {
    return {
      open: true,
      closingSoon: today.close - now.minutes <= 30,
      headline: "Open now",
      detail: `Closes ${fmtTime(today.close)}`,
      lunchNow,
    };
  }
  if (today && now.minutes < today.open) {
    return { open: false, closingSoon: false, headline: "Closed", detail: `Opens today ${fmtTime(today.open)}`, lunchNow };
  }
  for (let i = 1; i <= 7; i++) {
    const next = addDays(now.date, i);
    const w = HOURS[next.dow];
    if (w) {
      const when = i === 1 ? "tomorrow" : DAY_NAMES[next.dow];
      return { open: false, closingSoon: false, headline: "Closed", detail: `Opens ${when} ${fmtTime(w.open)}`, lunchNow };
    }
  }
  return { open: false, closingSoon: false, headline: "Closed", detail: "", lunchNow };
}

export type Slot = { date: string; minutes: number };
export type SlotDay = { date: string; label: string; slots: Slot[] };

const ceilTo = (n: number, step: number) => Math.ceil(n / step) * step;

/** Pickup/delivery times for the next `openDays` days the shop is open. */
export function availableSlots(d: Date = new Date(), openDays = 3): SlotDay[] {
  const now = zonedNow(d);
  const out: SlotDay[] = [];
  for (let i = 0; i < 8 && out.length < openDays; i++) {
    const day = addDays(now.date, i);
    const w = HOURS[day.dow];
    if (!w) continue;
    const earliest = i === 0 ? Math.max(w.open + PREP_MINUTES, now.minutes + PREP_MINUTES) : w.open + PREP_MINUTES;
    const slots: Slot[] = [];
    for (let m = ceilTo(earliest, SLOT_STEP); m <= w.close - SLOT_STEP; m += SLOT_STEP) {
      slots.push({ date: day.date, minutes: m });
    }
    if (!slots.length) continue;
    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${DAY_SHORT[day.dow]} ${Number(day.date.slice(5, 7))}/${Number(day.date.slice(8))}`;
    out.push({ date: day.date, label, slots });
  }
  return out;
}

/** ASAP is offered only while open and with time to cook before close. */
export function asapSlot(d: Date = new Date()): Slot | null {
  const now = zonedNow(d);
  const w = HOURS[now.dow];
  if (!w || now.minutes < w.open || now.minutes + PREP_MINUTES > w.close) return null;
  return { date: now.date, minutes: now.minutes + PREP_MINUTES };
}

/** Returns an error message, or null if the slot is a time we can fill. */
export function validateSlot(slot: Slot, d: Date = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.date) || !Number.isInteger(slot.minutes)) return "Invalid time.";
  const valid = availableSlots(d, 7).some((day) => day.slots.some((s) => s.date === slot.date && s.minutes === slot.minutes));
  return valid ? null : "That time is no longer available. Please pick another.";
}

export function describeSlot(slot: Slot, d: Date = new Date()): string {
  const now = zonedNow(d);
  const day =
    slot.date === now.date ? "Today" : slot.date === addDays(now.date, 1).date ? "Tomorrow" : DAY_NAMES[dowOf(slot.date)];
  return `${day}, ${fmtTime(slot.minutes)}`;
}
