/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 */
// Edge Function: image-search
// Ricerca immagini MULTI-SORGENTE lato server, così le chiavi API NON stanno nel client (il frontend è pubblico).
// Sorgenti: Openverse (StockSnap/Flickr/Wikimedia/…, senza chiave) + Wikimedia Commons diretto + Unsplash/Pexels/Pixabay
// (attive solo se il rispettivo segreto è impostato: UNSPLASH_KEY, PEXELS_KEY, PIXABAY_KEY). Risultati mescolati e dedup.
// Corpo: { q } → { ok, results:[{url,thumb,source}] }. Chiamabile con anon key (image search, bassa sensibilità).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(o: unknown, s = 200): Response {
  return new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
}
// Ogni foto porta con se' da dove viene e chi l'ha fatta. Senza autore e
// licenza una foto presa da fuori non si puo' usare: il database la rifiuta,
// e l'app non la fa nemmeno scegliere.
type Img = { url: string; thumb: string; source: string; autore?: string; licenza?: string; pagina?: string };
async function safe(p: Promise<Img[]>): Promise<Img[]> { try { return await p; } catch (_) { return []; } }

async function openverse(q: string): Promise<Img[]> {
  const r = await fetch("https://api.openverse.org/v1/images/?q=" + encodeURIComponent(q) + "&page_size=20&license_type=commercial");
  const d = await r.json();
  return (d.results || []).map((it: any) => ({
    url: it.url, thumb: it.thumbnail || it.url, source: it.source || "openverse",
    autore: it.creator || "", licenza: [it.license, it.license_version].filter(Boolean).join(" ").toUpperCase(),
    pagina: it.foreign_landing_url || it.url,
  }));
}
async function wikimedia(q: string): Promise<Img[]> {
  // extmetadata porta autore e licenza: senza quelli la foto non serve a niente.
  const r = await fetch("https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" + encodeURIComponent(q) +
    "&gsrnamespace=6&gsrlimit=15&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=500&format=json&origin=*");
  const d = await r.json();
  const pg = (d.query && d.query.pages) || {};
  const pulisci = (x: string) => String(x || "").replace(/<[^>]+>/g, "").trim();
  return Object.values(pg).map((p: any) => {
    const ii = p.imageinfo && p.imageinfo[0]; if (!ii) return null;
    const u = ii.url || ""; if (!/\.(jpe?g|png|webp)$/i.test(u)) return null;
    const em = ii.extmetadata || {};
    return {
      url: u, thumb: ii.thumburl || u, source: "wikimedia",
      autore: pulisci(em.Artist && em.Artist.value) || pulisci(em.Credit && em.Credit.value),
      licenza: pulisci(em.LicenseShortName && em.LicenseShortName.value),
      pagina: ii.descriptionurl || u,
    };
  }).filter(Boolean) as Img[];
}
async function unsplash(q: string): Promise<Img[]> {
  const k = Deno.env.get("UNSPLASH_KEY"); if (!k) return [];
  const r = await fetch("https://api.unsplash.com/search/photos?per_page=15&query=" + encodeURIComponent(q) + "&client_id=" + k);
  const d = await r.json();
  return (d.results || []).map((p: any) => ({
    url: p.urls.regular, thumb: p.urls.small, source: "unsplash",
    autore: (p.user && p.user.name) || "", licenza: "Unsplash License",
    pagina: (p.links && p.links.html) || "",
  }));
}
async function pexels(q: string): Promise<Img[]> {
  const k = Deno.env.get("PEXELS_KEY"); if (!k) return [];
  const r = await fetch("https://api.pexels.com/v1/search?per_page=15&query=" + encodeURIComponent(q), { headers: { Authorization: k } });
  const d = await r.json();
  return (d.photos || []).map((p: any) => ({
    url: p.src.large || p.src.original, thumb: p.src.medium || p.src.small, source: "pexels",
    autore: p.photographer || "", licenza: "Pexels License", pagina: p.url || "",
  }));
}
async function pixabay(q: string): Promise<Img[]> {
  const k = Deno.env.get("PIXABAY_KEY"); if (!k) return [];
  const r = await fetch("https://pixabay.com/api/?key=" + encodeURIComponent(k) + "&per_page=15&image_type=photo&q=" + encodeURIComponent(q));
  const d = await r.json();
  return (d.hits || []).map((p: any) => ({
    url: p.largeImageURL || p.webformatURL, thumb: p.webformatURL || p.previewURL, source: "pixabay",
    autore: p.user || "", licenza: "Pixabay Content License", pagina: p.pageURL || "",
  }));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  let q = "";
  try { const b = await req.json(); q = String(b.q || b.query || "").trim().slice(0, 120); } catch (_) { /* ignore */ }
  if (!q) return json({ ok: true, results: [] });
  const lists = await Promise.all([safe(openverse(q)), safe(wikimedia(q)), safe(unsplash(q)), safe(pexels(q)), safe(pixabay(q))]);
  const mixed: Img[] = []; let max = 0; for (const l of lists) if (l.length > max) max = l.length;
  for (let i = 0; i < max; i++) for (const l of lists) if (l[i]) mixed.push(l[i]);
  const seen = new Set<string>(); const out: Img[] = [];
  for (const it of mixed) { if (it && it.url && !seen.has(it.url)) { seen.add(it.url); out.push(it); } }
  return json({ ok: true, results: out.slice(0, 60) });
});
