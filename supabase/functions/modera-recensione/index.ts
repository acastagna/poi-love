/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 */
// Edge Function: modera-recensione
//
// La moderazione delle recensioni. Non decide il codice: decidono le direttive
// scritte nella tabella `direttive_moderazione`, che si cambiano dal pannello
// senza toccare una riga di programma.
//
// Perche' sta qui e non nell'app: il verdetto deve arrivare da una parte di cui
// ci si possa fidare. Il telefono di chi scrive non puo' promuovere da solo la
// propria recensione: sul database un controllo impedisce a chiunque, tranne a
// questa funzione, di scrivere lo stato 'pubblicata' (migrazione 104).
//
// Richiesta:  POST { recensione_id }   con l'utente collegato
// Risposta:   { esito: 'pubblicata'|'in_coda'|'rifiutata', motivo, direttiva }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

// Dal 18/08 i dati e gli accessi stanno sulla NOSTRA macchina: qui si parla con
// quelli, non con il database vecchio. La chiave di servizio e' la stessa firma.
const REST = "https://poilove.com/db/rest/v1";
const AUTH = "https://poilove.com/db/auth/v1";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
// Il nostro server accetta solo la firma classica (eyJ...): la chiave nuova
// in formato sb_secret_ non gli dice niente e la richiesta passerebbe da visitatore.
const SERVICE_ROLE_KEY = Deno.env.get("POILOVE_SERVICE_JWT") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_KEY") ?? "";
const OPENAI_KEY = Deno.env.get("OPENAI_KEY") ?? "";
const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6";

/* Il giudizio. Sta in un posto solo, cosi' la prova a vuoto che fa
   l'amministrazione e la moderazione vera usano le stesse identiche parole. */
async function chiediAllAI(elenco: string, luogo: string, voto: number, testo: string) {
  const sistema =
`Sei la moderazione di POI•LOVE, una mappa dei luoghi amati.
Giudichi UNA recensione scritta da una persona su un luogo, seguendo SOLO le direttive qui sotto.
Non aggiungi regole tue, non giudichi il gusto, non pretendi che la recensione sia gentile:
una critica dura ma pulita si pubblica.

DIRETTIVE ATTIVE:
${elenco}

Rispondi SOLO con un oggetto JSON, senza altro testo:
{"esito":"pubblicata"|"rifiutata"|"in_coda","motivo":"una frase breve in italiano","direttiva":"il numero della direttiva violata, oppure null"}
- "pubblicata": non viola nessuna direttiva.
- "rifiutata": viola una direttiva in modo evidente.
- "in_coda": caso dubbio, lo guarda una persona.`;

  const domanda =
`Luogo: ${luogo}\nVoto: ${voto} su 5\nRecensione: """${testo}"""`;

  // ── Il giudizio ───────────────────────────────────────────────────────────
  let grezzo = "";
  try {
    if (ANTHROPIC_KEY) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 300, system: sistema,
          messages: [{ role: "user", content: domanda }] }),
      });
      const j = await r.json();
      grezzo = j?.content?.[0]?.text ?? "";
    } else if (OPENAI_KEY) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 300, messages: [
          { role: "system", content: sistema }, { role: "user", content: domanda }] }),
      });
      const j = await r.json();
      grezzo = j?.choices?.[0]?.message?.content ?? "";
    }
  } catch (e) {
    console.error("modera-recensione: AI non raggiungibile", e);
  }

  // Se l'AI non risponde, la recensione NON si pubblica da sola: resta in coda.
  let esito = "in_coda", motivo = "in attesa di controllo", direttiva: string | null = null;
  const m = grezzo.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const v = JSON.parse(m[0]);
      if (["pubblicata", "rifiutata", "in_coda"].includes(v.esito)) esito = v.esito;
      if (typeof v.motivo === "string" && v.motivo.trim()) motivo = v.motivo.trim().slice(0, 300);
      if (v.direttiva != null) direttiva = String(v.direttiva).slice(0, 40);
    } catch { /* resta in coda */ }
  }

  return { esito, motivo, direttiva };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Solo POST" }, 405);

  // ── Chi chiede ────────────────────────────────────────────────────────────
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Serve il collegamento" }, 401);
  const chi = await fetch(`${AUTH}/user`, { headers: { Authorization: auth, apikey: ANON_KEY } });
  if (!chi.ok) return json({ error: "Serve il collegamento" }, 401);
  const user = await chi.json();
  if (!user?.id) return json({ error: "Serve il collegamento" }, 401);

  let body: any = {};
  try { body = await req.json(); } catch { /* niente */ }
  const testa0 = { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" };
  const leggi0 = async (q: string) => { const r = await fetch(`${REST}/${q}`, { headers: testa0 }); return r.ok ? await r.json() : []; };

  // ── La prova a vuoto ──────────────────────────────────────────────────────
  // Chi scrive le direttive puo' provarle su un testo qualsiasi e vedere cosa
  // deciderebbe la moderazione, senza toccare nessuna recensione vera.
  if (body?.prova === true) {
    const io = await leggi0(`profiles?select=is_admin&id=eq.${user.id}`);
    if (!io[0]?.is_admin) return json({ error: "La prova e' riservata all'amministrazione" }, 403);
    const t = String(body?.testo ?? "").slice(0, 1000);
    if (!t.trim()) return json({ error: "Scrivi un testo da provare" }, 400);
    const dir0 = await leggi0("direttive_moderazione?ambito=eq.recensioni&attiva=eq.true&order=ordine&select=id,regola,esempio");
    const elenco0 = (dir0 ?? []).map((d: any, i: number) =>
      `${i + 1}. ${d.regola}${d.esempio ? `  (esempio da fermare: "${d.esempio}")` : ""}`).join("\n");
    const verdetto = await chiediAllAI(elenco0, String(body?.luogo ?? "(prova)"), Number(body?.voto ?? 3), t);
    return json({ ...verdetto, prova: true });
  }

  const id = String(body?.recensione_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "recensione_id non valido" }, 400);

  const testa = { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" };
  const leggi = async (q: string) => { const r = await fetch(`${REST}/${q}`, { headers: testa }); return r.ok ? await r.json() : []; };
  const scrivi = (id: string, campi: Record<string, unknown>) =>
    fetch(`${REST}/recensioni?id=eq.${id}`, { method: "PATCH", headers: testa, body: JSON.stringify(campi) });

  // ── La recensione: deve essere sua e ancora in coda ────────────────────────
  const rec = (await leggi(`recensioni?id=eq.${id}&select=id,autore_id,voto,testo,stato,poi_id`))[0];
  if (!rec) return json({ error: "Recensione non trovata" }, 404);
  if (rec.autore_id !== user.id) return json({ error: "Non e' tua" }, 403);
  if (rec.stato !== "in_coda") return json({ esito: rec.stato, motivo: "gia' esaminata" });

  const testo = (rec.testo ?? "").trim();

  // Un voto senza parole non ha niente da moderare: passa.
  if (!testo) {
    await scrivi(id, { stato: "pubblicata", motivo: "voto senza testo" });
    return json({ esito: "pubblicata", motivo: "voto senza testo" });
  }

  // ── Le direttive, come sono scritte adesso nel pannello ───────────────────
  const dir = await leggi("direttive_moderazione?ambito=eq.recensioni&attiva=eq.true&order=ordine&select=id,regola,esempio");
  const elenco = (dir ?? []).map((d: any, i: number) =>
    `${i + 1}. ${d.regola}${d.esempio ? `  (esempio da fermare: "${d.esempio}")` : ""}`).join("\n");

  const poi = (await leggi(`pois?id=eq.${rec.poi_id}&select=title,category`))[0];
  const { esito, motivo, direttiva } = await chiediAllAI(
    elenco,
    (poi?.title ?? "(sconosciuto)") + (poi?.category ? ` (${poi.category})` : ""),
    Number(rec.voto), testo.slice(0, 1000));


  await scrivi(id, { stato: esito, motivo, direttiva });
  return json({ esito, motivo, direttiva });
});
