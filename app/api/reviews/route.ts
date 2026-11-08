import { NextResponse } from "next/server";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const revalidate = 3600;

type PlacesReview = {
  rating?: number;
  text?: { text?: string };
  relativePublishTimeDescription?: string;
  authorAttribution?: { displayName?: string };
};

/**
 * Live Google reviews via the Places API (New) when GOOGLE_PLACES_API_KEY and
 * GOOGLE_PLACE_ID are set. Otherwise returns the rating summary only — we never
 * invent review text.
 */
export async function GET() {
  const fallback = { rating: SITE.googleRating, count: SITE.googleReviewCount, reviews: [], source: "static", url: SITE.mapsSearchUrl };
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const place = process.env.GOOGLE_PLACE_ID;
  if (!key || !place) return NextResponse.json(fallback);

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(place)}`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Places ${res.status}`);
    const p = (await res.json()) as { rating?: number; userRatingCount?: number; googleMapsUri?: string; reviews?: PlacesReview[] };
    return NextResponse.json({
      rating: p.rating ?? fallback.rating,
      count: p.userRatingCount ?? fallback.count,
      url: p.googleMapsUri ?? fallback.url,
      source: "google",
      reviews: (p.reviews ?? [])
        .filter((r) => (r.rating ?? 0) >= 4 && r.text?.text)
        .map((r) => ({
          author: r.authorAttribution?.displayName ?? "Google user",
          rating: r.rating ?? 5,
          text: r.text!.text!,
          when: r.relativePublishTimeDescription ?? "",
        })),
    });
  } catch (e) {
    console.error("[reviews]", e);
    return NextResponse.json(fallback);
  }
}
