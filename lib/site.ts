export const SITE = {
  name: "Buddy's Pizza",
  tagline: "Frankfort's brick-oven pizzeria",
  established: 2006,
  street: "212 W Broadway St",
  city: "Frankfort",
  region: "KY",
  zip: "40601",
  address: "212 W Broadway St, Frankfort, KY 40601",
  phone: "(502) 352-2920",
  phoneHref: "tel:+15023522920",
  lat: 38.20067,
  lng: -84.87501,
  googleRating: 4.6,
  googleReviewCount: 700,
  mapsSearchUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Buddy's Pizza, 212 W Broadway St, Frankfort, KY 40601"),
  directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent("212 W Broadway St, Frankfort, KY 40601"),
  mapEmbedUrl: "https://maps.google.com/maps?q=" + encodeURIComponent("Buddy's Pizza, 212 W Broadway St, Frankfort, KY 40601") + "&z=17&output=embed",
} as const;

/** Order types offered at checkout. Set NEXT_PUBLIC_DELIVERY=off to hide delivery. */
export type OrderType = "pickup" | "delivery" | "dinein";
export const ORDER_TYPES: { id: OrderType; label: string }[] = [
  { id: "pickup", label: "Pickup" },
  ...(process.env.NEXT_PUBLIC_DELIVERY === "off" ? [] : [{ id: "delivery" as const, label: "Delivery" }]),
  { id: "dinein", label: "Dine-in" },
];
