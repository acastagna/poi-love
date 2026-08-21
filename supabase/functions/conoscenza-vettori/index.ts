/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Il numero che descrive il significato di un pezzo di testo.
 *
 * Il PDF lo spezza il server delle immagini, che non ha nessuna chiave. Qui,
 * dove la chiave c e, a ogni pezzo si mette accanto una fila di numeri che ne
 * descrive il senso. Da quel momento, a domanda fatta, si trovano i pezzi che
 * parlano di quella cosa anche se usano parole diverse.
 *
 * Due cose sole:
 *   POST {azione:"lavora"}            -> prende i pezzi in attesa e li sistema
 *   POST {azione:"cerca", domanda:""} -> trova i pezzi che rispondono
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REST = "https://poilove.com/db/rest/v1";
const AUTH = "https://poilove.com/db/auth/v1";
const SERVIZIO = Deno.env.get("POILOVE_SERVICE_JWT") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OPENAI_KEY = Deno.env.get("OPENAI_KEY") ?? "";
const MODELLO = "text-embedding-3-small";      // 1536 numeri, il piu economico che regge

function risposta(corpo: unknown, stato = 200) {
  return new Response(JSON.stringify(corpo), {
    status: stato, headers: { ...CORS, "Content-Type": "application/json" },
  });
}
function testa(): Record<string, string> {
  return { apikey: SERVIZIO, Authorization: `Bearer ${SERVIZIO}`, "Content-Type": "application/json" };
}
async function rpc(nome: string, corpo: unknown): Promise<any> {
  const r = await fetch(`${REST}/rpc/${nome}`, {
    method: "POST", headers: testa(), body: JSON.stringify(corpo), signal: AbortSignal.timeout(20000),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${nome}: ${r.status} ${t.slice(0, 180)}`);
  return t.trim() ? JSON.parse(t) : null;
}

/** Chi chiede deve essere un amministratore: si controlla col suo biglietto. */
async function eAdmin(req: Request): Promise<boolean> {
  const h = req.headers.get("Authorization") ?? "";
  if (!/^Bearer eyJ/.test(h)) return false;
  const u = await fetch(`${AUTH}/user`, { headers: { Authorization: h, apikey: SERVIZIO } });
  if (!u.ok) return false;
  const me = await u.json();
  if (!me?.id) return false;
  const p = await fetch(`${REST}/profiles?id=eq.${me.id}&select=is_admin`, { headers: testa() });
  const rows = p.ok ? await p.json() : [];
  return !!(rows[0]?.is_admin);
}

/** I numeri del significato, presi in blocco: una chiamata sola per molti pezzi. */
async function numeri(testi: string[]): Promise<number[][]> {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODELLO, input: testi }),
    signal: AbortSignal.timeout(60000),
  });
  if (!r.ok) throw new Error("OpenAI: " + r.status + " " + (await r.text()).slice(0, 180));
  const j = await r.json();
  return (j.data ?? []).map((d: any) => d.embedding);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return risposta({ errore: "solo POST" }, 405);
  if (!SERVIZIO) return risposta({ errore: "manca POILOVE_SERVICE_JWT" }, 500);
  if (!OPENAI_KEY) return risposta({ errore: "manca la chiave OpenAI: senza, i pezzi restano senza numero" }, 503);
  if (!(await eAdmin(req))) return risposta({ errore: "solo un amministratore" }, 403);

  let corpo: any = {};
  try { corpo = await req.json(); } catch { /* corpo vuoto: si lavora e basta */ }
  const azione = corpo.azione ?? "lavora";

  try {
    if (azione === "cerca") {
      const domanda = String(corpo.domanda ?? "").trim();
      if (!domanda) return risposta({ errore: "serve una domanda" }, 400);
      const [v] = await numeri([domanda]);
      const trovati = await rpc("conoscenza_cerca", {
        p_vettore: JSON.stringify(v), p_ambito: corpo.ambito ?? "entrambi", p_quanti: corpo.quanti ?? 6,
      });
      return risposta({ ok: true, trovati });
    }

    // "lavora": prende i pezzi in attesa, in gruppi, finche ce ne sono o finche
    // il tempo stringe. Non si blocca su un pezzo storto: lo salta e va avanti.
    const inizio = Date.now();
    let sistemati = 0, giri = 0;
    while (Date.now() - inizio < 50000) {
      const pezzi: any[] = await rpc("conoscenza_da_vettorizzare", { p_quanti: 40 });
      if (!pezzi?.length) break;
      const vs = await numeri(pezzi.map((p) => p.testo));
      for (let i = 0; i < pezzi.length; i++) {
        if (!vs[i]) continue;
        try {
          await rpc("conoscenza_segna_vettore", { p_id: pezzi[i].id, p_vettore: JSON.stringify(vs[i]) });
          sistemati++;
        } catch (e) { console.error("pezzo saltato", pezzi[i].id, String(e)); }
      }
      giri++;
      if (giri > 30) break;
    }
    const restano: any[] = await rpc("conoscenza_da_vettorizzare", { p_quanti: 1 });
    return risposta({ ok: true, sistemati, restano: restano?.length ? "si" : "no" });
  } catch (e) {
    return risposta({ errore: String(e) }, 500);
  }
});
