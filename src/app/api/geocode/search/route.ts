import { NextRequest, NextResponse } from "next/server";

let lastRequestTime = 0;

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 3) {
    return NextResponse.json([]);
  }

  // Rate limit: 1 req/sec per Nominatim usage policy
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
  }
  lastRequestTime = Date.now();

  try {
    const params = new URLSearchParams({
      q,
      format: "json",
      limit: "5",
      countrycodes: "us",
      addressdetails: "0",
    });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "SocialSecretaryNetwork/1.0",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding service error" },
        { status: 502 }
      );
    }

    const data: NominatimResult[] = await res.json();

    const results = data.map((item) => ({
      placeId: item.place_id,
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: "Geocoding request failed" },
      { status: 500 }
    );
  }
}
