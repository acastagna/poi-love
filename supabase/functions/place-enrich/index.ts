/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 */
// Edge Function: place-enrich
// Arricchisce un posto (nome + coordinate) con voto medio, numero recensioni, fascia
// prezzo e stato apertura da Google Places API (New). La chiave Google e un SEGRETO
// server-side (GOOGLE_PLACES_KEY), MAI nel client ne nel repo. Degrada in silenzio se
// la chiave manca o Google non risponde: chi chiama deve gestire { found:false } / errori.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const KEY = Deno.env.get("GOOGLE_PLACES_KEY");
    if (!KEY) return json({ error: "no_key" }, 200); // degrado: il client usa i dati OSM

    const { name, lat, lng, radius, mode, language } = await req.json();

    // ── MODALITA' NEARBY: i punti di interesse di Google intorno a un punto ──
    // Usata dalla LENTE: restituisce fino a 20 posti veri (nome, posizione, voto,
    // tipo) ordinati per distanza. Stessa chiave server-side, niente nel client.
    if (mode === "nearby") {
      if (lat == null || lng == null) return json({ error: "bad_request" }, 400);
      const lc = (language === "sq" || language === "en") ? language : "it";
      const nb = {
        maxResultCount: 20,
        languageCode: lc,
        rankPreference: "POPULARITY",
        locationRestriction: {
          circle: {
            center: { latitude: Number(lat), longitude: Number(lng) },
            radius: Math.max(50, Math.min(1500, Number(radius) || 300)),
          },
        },
      };
      const r = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": KEY,
          "X-Goog-FieldMask":
            "places.displayName,places.location,places.rating,places.userRatingCount,places.primaryType,places.primaryTypeDisplayName",
        },
        body: JSON.stringify(nb),
        signal: AbortSignal.timeout(7000),
      });
      const d = await r.json();
      if (!r.ok) return json({ error: "google_error", detail: d?.error?.message || r.status }, 200);
      const places = (d?.places || []).map((p: any) => ({
        name: p.displayName?.text || "",
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        rating: p.rating ?? null,
        reviews: p.userRatingCount ?? null,
        type: p.primaryType || "",
        typeLabel: p.primaryTypeDisplayName?.text || "",
      })).filter((p: any) => p.name && p.lat != null);
      // Prima i posti che contano (piu recensioni), gli sconosciuti in coda
      places.sort((a: any, b: any) => (b.reviews || 0) - (a.reviews || 0));
      return json({ found: places.length > 0, places }, 200);
    }

    if (!name || lat == null || lng == null) return json({ error: "bad_request" }, 400);

    const body = {
      textQuery: String(name),
      maxResultCount: 1,
      languageCode: "it",
      locationBias: {
        circle: {
          center: { latitude: Number(lat), longitude: Number(lng) },
          radius: Number(radius) || 400,
        },
      },
    };

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask":
          "places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.businessStatus,places.currentOpeningHours.openNow,places.location,places.formattedAddress,places.primaryType,places.primaryTypeDisplayName,places.editorialSummary",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return json({ error: "google_error", detail: data?.error?.message || res.status }, 200);
    }

    const p = data?.places?.[0];
    if (!p) return json({ found: false }, 200);

    return json({
      found: true,
      name: p.displayName?.text || name,
      rating: p.rating ?? null,            // es. 4.6
      reviews: p.userRatingCount ?? null,  // es. 980
      priceLevel: p.priceLevel ?? null,    // PRICE_LEVEL_INEXPENSIVE | MODERATE | EXPENSIVE | VERY_EXPENSIVE
      businessStatus: p.businessStatus ?? null, // OPERATIONAL | CLOSED_TEMPORARILY | CLOSED_PERMANENTLY
      openNow: p.currentOpeningHours?.openNow ?? null,
      glat: p.location?.latitude ?? null,
      glng: p.location?.longitude ?? null,
      address: p.formattedAddress ?? null,
      primaryType: p.primaryType ?? null, // es. pizza_restaurant, restaurant, bar...
      typeLabel: p.primaryTypeDisplayName?.text ?? null, // tipo in chiaro (es. "Ristorante messicano")
      desc: p.editorialSummary?.text ?? null, // descrizione breve di Google, se presente
    }, 200);
  } catch (e) {
    return json({ error: "exception", detail: String(e) }, 200);
  }
});
