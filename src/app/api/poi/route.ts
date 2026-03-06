import { NextRequest, NextResponse } from "next/server";

const PRICE_LEVEL: Record<string, string> = {
  PRICE_LEVEL_FREE:           "Gratis",
  PRICE_LEVEL_INEXPENSIVE:    "$",
  PRICE_LEVEL_MODERATE:       "$$",
  PRICE_LEVEL_EXPENSIVE:      "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.rating",
        "places.userRatingCount",
        "places.priceLevel",
        "places.editorialSummary",
        "places.photos",
        "places.location",
        "places.types",
      ].join(","),
    },
    body: JSON.stringify({
      includedTypes: ["tourist_attraction"],
      locationRestriction: {
        circle: {
          center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
          radius: 10000,
        },
      },
      maxResultCount: 15,
      languageCode: "es",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "Google Places error", detail: err }, { status: 502 });
  }

  const data = await res.json();

  const places = (data.places ?? []).map((p: any) => {
    const photoName = p.photos?.[0]?.name;
    
    const photoUrl = photoName
      ? `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=600&key=${apiKey}`
      : null;

    return {
      id: p.id,
      name: p.displayName?.text ?? "Sin nombre",
      address: p.formattedAddress ?? "",
      rating: p.rating ?? null,
      ratingCount: p.userRatingCount ?? null,
      priceLevel: PRICE_LEVEL[p.priceLevel] ?? null,
      description: p.editorialSummary?.text ?? null,
      photoUrl,
      lat: p.location?.latitude ?? 0,
      lng: p.location?.longitude ?? 0,
    };
  });

  return NextResponse.json({ places });
}
