import { NextResponse } from "next/server";
import { CATEGORIES, MENU, SIZES, TOPPINGS, TOPPING_PRICES, CALZONE_TOPPING_PRICE } from "@/lib/menu";
import { availableSlots, asapSlot, storeStatus } from "@/lib/hours";

export const dynamic = "force-dynamic";

/** Public menu + live store status, for integrations (kiosk, POS sync, etc.). */
export async function GET() {
  return NextResponse.json({
    status: storeStatus(),
    asap: asapSlot(),
    slots: availableSlots(),
    categories: CATEGORIES,
    sizes: SIZES,
    toppings: TOPPINGS,
    toppingPrices: { pizza: TOPPING_PRICES, calzone: CALZONE_TOPPING_PRICE },
    items: MENU,
  });
}
