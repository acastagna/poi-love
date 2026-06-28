/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 */
// Edge Function: admin-ai
// Copilota AI AGENTICO riservato all'amministratore di POI•LOVE.
//
// SICUREZZA (non negoziabile):
//   1) legge il JWT dall'header Authorization;
//   2) crea un client Supabase con ANON key + quel JWT e chiama auth.getUser();
//   3) con un client service_role (segreto, mai esposto al client) verifica che il profilo
//      abbia is_admin = true E moderation_status = 'active'. Solo dopo questo gate la funzione
//      tocca dati/statistiche con i privilegi service_role.
//   4) richiede il secondo fattore (aal2) decodificando il claim aal del JWT.
//
// La service_role key vive SOLO qui dentro come segreto (Deno.env). Non esce mai dalla funzione.
//
// Tetto di spesa: rate limit per-admin giornaliero. Ogni chiamata AI viene loggata in
// admin_audit_log (action='ai_call', meta con token e costo in euro). Prima di chiamare l'AI
// si somma il costo del giorno per quell'admin; se supera DAILY_EUR_CAP si risponde 429.
//
// AGENTICITA' (tool use nativo del provider):
//   - 5 tool dichiarati: query_data, historic_analysis (READ), propose_poi,
//     propose_historic_route, propose_project (WRITE).
//   - I tool READ vengono eseguiti dalla edge nel loop (max 4 round) con service_role,
//     SOLO select/count whitelisted su pois/profiles/reports/trips/user_routes, mai scritture.
//   - I tool WRITE NON vengono eseguiti: la edge valida il payload, inserisce una riga in
//     ai_proposals (status=pending, admin_id=user.id) e la mette in proposals[]. L'admin
//     approva/rifiuta dal pannello; l'azione si materializza via RPC apply_ai_proposal.
//
// Provider: Claude (Anthropic) di default, fallback OpenAI. Chiavi come segreti. Il tool use
// e' implementato in entrambi i dialetti (Anthropic tools / OpenAI tools).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── CORS ──────────────────────────────────────────────────────────────────────
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

// ── Env ──────────────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_KEY") ?? "";
const OPENAI_KEY = Deno.env.get("OPENAI_KEY") ?? "";

const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6";
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o";

// Tetto di spesa giornaliero per-admin, in euro. Default 5.
const DAILY_EUR_CAP = (() => {
  const n = Number(Deno.env.get("DAILY_EUR_CAP"));
  return Number.isFinite(n) && n > 0 ? n : 5;
})();

// Conversione USD -> EUR (approssimata, prezzi AI quotati in USD).
const USD_TO_EUR = (() => {
  const n = Number(Deno.env.get("USD_TO_EUR"));
  return Number.isFinite(n) && n > 0 ? n : 0.92;
})();

// Cap rigido sui token di output, indipendente dalla richiesta del client.
const MAX_OUTPUT_TOKENS = 1500;

// Massimo numero di round agentici (chiamata AI + esecuzione tool READ).
const MAX_ROUNDS = 4;

// ── Whitelist modelli ─────────────────────────────────────────────────────────
const ANTHROPIC_ALLOWED = new Set<string>([
  "claude-sonnet-4-6",
  "claude-sonnet-4-5",
  "claude-3-5-sonnet-latest",
  "claude-3-5-haiku-latest",
  "claude-opus-4-1",
]);
const OPENAI_ALLOWED = new Set<string>([
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
]);

// Prezzi per milione di token (USD). Sonnet: ~3$/M in, ~15$/M out.
const PRICE_USD_PER_MTOK: Record<string, { in: number; out: number }> = {
  "claude-sonnet-4-6": { in: 3, out: 15 },
  "claude-sonnet-4-5": { in: 3, out: 15 },
  "claude-3-5-sonnet-latest": { in: 3, out: 15 },
  "claude-3-5-haiku-latest": { in: 0.8, out: 4 },
  "claude-opus-4-1": { in: 15, out: 75 },
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4.1": { in: 2, out: 8 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
};

function costEur(model: string, tokIn: number, tokOut: number): number {
  const p = PRICE_USD_PER_MTOK[model] ?? { in: 3, out: 15 };
  const usd = (tokIn / 1_000_000) * p.in + (tokOut / 1_000_000) * p.out;
  return Math.round(usd * USD_TO_EUR * 1_000_000) / 1_000_000;
}

// ── Tipi ──────────────────────────────────────────────────────────────────────
type Role = "user" | "assistant" | "system";
interface ChatMessage {
  role: Role;
  content: string;
}
type Mode = "chat" | "route" | "write";

type SvcClient = ReturnType<typeof createClient>;

// Proposta raccolta da un tool WRITE, gia' persistita in ai_proposals.
interface ProposalOut {
  id: string;
  kind: "poi" | "route" | "project";
  title: string;
  summary: string;
  payload: Record<string, unknown>;
}

// ── System prompt base (italiano, niente trattini lunghi, niente emoji a raffica) ──
function baseSystemPrompt(mode: Mode): string {
  const common =
    "Sei il copilota dell'amministratore di POI•LOVE, la mappa comunitaria dei luoghi amati (primo lancio a Tirana). Parli sempre in italiano, conciso e diretto. Niente trattini lunghi, niente emoji a raffica.\n\n" +
    "SEI PROATTIVO, NON un modulo da compilare. Quando l'admin chiede di creare un POI o una rotta, lo FAI TU: compili tutti i campi da solo e chiami SUBITO il tool di proposta. NON chiedere all'admin dati che puoi determinare da te.\n" +
    "- POSIZIONE: per un luogo noto usi le coordinate che gia conosci (es. Piazza Skanderbeg a Tirana ~41.3275, 19.8189; Piramide di Tirana ~41.3175, 19.8203; Castello di Scutari, Moschea Et'hem Bey, ecc.). Sono una BOZZA che l'admin aggiusta dopo: non serve la precisione al metro, serve proporre subito.\n" +
    "- DESCRIZIONE: la scrivi TU, da conoscitore del posto, calda e concreta (max ~180 caratteri). Non inventare premi, date o fatti specifici falsi, ma descrivi il luogo per quello che e.\n" +
    "- CATEGORIA: la scegli TU tra: cibo, lavoro, pernottare, natura, festa, cultura, pratico, benessere, love, audioguida, mappa, open_source. Per piazze, monumenti, storia usa 'cultura'.\n" +
    "- TAG: 2 o 3 pertinenti.\n" +
    "- Chiedi all'admin SOLO se il luogo e davvero ambiguo o inventato e non puoi saperne nulla. In ogni altro caso: PROPONI e basta, poi l'admin approva o corregge dalla scheda.\n\n" +
    "Strumenti:\n" +
    "- query_data, historic_analysis: SOLA LETTURA del database, servono per non duplicare un POI gia esistente o per contare/cercare. NON sono geocoding: per le coordinate di un luogo noto usa la tua conoscenza, non aspettarti che un tool te le dia.\n" +
    "- propose_poi, propose_historic_route, propose_project: creano una PROPOSTA (bozza non pubblica) che l'admin approva o rifiuta dal pannello. Chiamali APPENA l'admin chiede di creare qualcosa, con i campi gia compilati.";

  if (mode === "route") {
    return (
      common +
      "\n\nMODALITA' ROTTA: l'admin descrive un percorso o un'idea di itinerario storico. " +
      "Studia la zona con i tool di lettura, poi usa propose_historic_route con una sequenza di tappe ordinate e sensata. " +
      "Per ogni tappa fornisci un nome chiaro; se conosci coordinate plausibili indicale, altrimenti lasciale a null."
    );
  }
  if (mode === "write") {
    return (
      common +
      "\n\nMODALITA' SCRITTURA: aiuti a scrivere testi per la piattaforma, descrizioni di POI, " +
      "annunci, comunicazioni. Tono caldo ma sobrio, coerente col brand POI•LOVE. " +
      "Quando utile proponi 2 o 3 varianti brevi tra cui scegliere."
    );
  }
  return (
    common +
    "\n\nMODALITA' CHAT: rispondi alle domande dell'admin sulla piattaforma, sui dati, sulla moderazione " +
    "e sull'operativita'. Suggerisci azioni concrete quando ha senso, e quando serve interroga i dati reali."
  );
}

// ── Raccolta statistiche fresche con service_role (dopo il gate admin) ──────────
async function gatherStats(svc: SvcClient) {
  const out: Record<string, unknown> = {};

  const usersCount = await svc
    .from("profiles")
    .select("id", { count: "exact", head: true });
  out.users_total = usersCount.count ?? 0;

  const poisCount = await svc
    .from("pois")
    .select("id", { count: "exact", head: true });
  out.pois_total = poisCount.count ?? 0;

  const openReports = await svc
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");
  out.reports_open = openReports.count ?? 0;

  const suspended = await svc
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .neq("moderation_status", "active");
  out.users_moderated = suspended.count ?? 0;

  const recent = await svc
    .from("profiles")
    .select("id, username, special_tier, moderation_status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  out.recent_users = recent.data ?? [];

  return out;
}

function statsToSystemMessage(stats: Record<string, unknown>): string {
  const recent = Array.isArray(stats.recent_users)
    ? (stats.recent_users as Array<Record<string, unknown>>)
        .map((u) => {
          const name = u.username ? String(u.username) : "(senza username)";
          const tier = u.special_tier ? String(u.special_tier) : "free";
          const mod = u.moderation_status ? String(u.moderation_status) : "active";
          return `- ${name} (tier: ${tier}, stato: ${mod})`;
        })
        .join("\n")
    : "(nessuno)";

  return (
    "STATISTICHE FRESCHE DELLA PIATTAFORMA (dati reali, lette ora dal database):\n" +
    `Utenti totali: ${stats.users_total}\n` +
    `POI totali: ${stats.pois_total}\n` +
    `Segnalazioni aperte: ${stats.reports_open}\n` +
    `Utenti sotto moderazione (non attivi): ${stats.users_moderated}\n` +
    `Ultimi 5 utenti iscritti:\n${recent}`
  );
}

// ── Somma del costo AI gia' speso oggi dall'admin (UTC day) ─────────────────────
async function spentTodayEur(svc: SvcClient, adminId: string): Promise<number> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);

  const { data, error } = await svc
    .from("admin_audit_log")
    .select("meta")
    .eq("admin_id", adminId)
    .eq("action", "ai_call")
    .gte("created_at", since.toISOString());

  if (error || !Array.isArray(data)) return 0;

  let total = 0;
  for (const row of data) {
    const meta = (row as { meta?: { cost_eur?: unknown } }).meta;
    const c = meta && typeof meta.cost_eur === "number" ? meta.cost_eur : 0;
    if (Number.isFinite(c)) total += c;
  }
  return total;
}

// ════════════════════════════════════════════════════════════════════════════
//  DEFINIZIONE DEI TOOL (schema neutro, poi tradotto nei due dialetti provider)
// ════════════════════════════════════════════════════════════════════════════

interface ToolDef {
  name: string;
  description: string;
  // JSON Schema dell'input (oggetto). Usato sia da Anthropic (input_schema) sia
  // da OpenAI (function.parameters).
  schema: Record<string, unknown>;
  // 'read' viene eseguito dalla edge nel loop; 'write' diventa una proposta.
  kind: "read" | "write";
}

// Tabelle leggibili dai tool READ e relative whitelist di campi/filtri.
const READ_TABLES: Record<string, { columns: string; filters: string[] }> = {
  pois: {
    columns:
      "id,title,description,category,tags,lat,lng,address,city,visibility,is_approved,created_via,created_at",
    filters: ["category", "city", "visibility", "is_approved", "created_via"],
  },
  profiles: {
    columns: "id,username,special_tier,moderation_status,created_at",
    filters: ["special_tier", "moderation_status"],
  },
  reports: {
    columns: "id,status,created_at",
    filters: ["status"],
  },
  trips: {
    columns: "id,name,badge,is_historic,is_published,created_at",
    filters: ["is_historic", "is_published"],
  },
  user_routes: {
    columns: "id,name,created_at",
    filters: [],
  },
};

const TOOLS: ToolDef[] = [
  {
    name: "query_data",
    kind: "read",
    description:
      "Legge dati reali dal database (sola lettura). Restituisce conteggio o righe da una tabella " +
      "consentita con filtri uguaglianza whitelisted. Tabelle: pois, profiles, reports, trips, user_routes. " +
      "Usa mode='count' per contare, mode='rows' per leggere fino a 50 righe.",
    schema: {
      type: "object",
      properties: {
        table: {
          type: "string",
          enum: Object.keys(READ_TABLES),
          description: "Tabella da leggere.",
        },
        mode: {
          type: "string",
          enum: ["count", "rows"],
          description: "count = solo numero righe; rows = righe (max 50).",
        },
        filters: {
          type: "object",
          description:
            "Filtri di uguaglianza opzionali, solo su colonne whitelisted della tabella. " +
            "Es. {\"city\":\"Tirana\",\"visibility\":\"official\"}.",
          additionalProperties: { type: ["string", "number", "boolean"] },
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          description: "Numero massimo di righe per mode='rows'. Default 20.",
        },
      },
      required: ["table", "mode"],
      additionalProperties: false,
    },
  },
  {
    name: "historic_analysis",
    kind: "read",
    description:
      "Analizza le rotte storiche e i POI ufficiali esistenti in una citta' (sola lettura). " +
      "Utile prima di proporre una rotta storica o un progetto, per non duplicare e per orientarsi. " +
      "Restituisce il conteggio delle rotte storiche pubblicate e un campione di POI ufficiali della citta'.",
    schema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "Citta' su cui analizzare i POI ufficiali. Es. 'Tirana'.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          description: "Numero massimo di POI ufficiali da campionare. Default 20.",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "propose_poi",
    kind: "write",
    description:
      "Propone la creazione di un singolo POI ufficiale (bozza non pubblica). NON scrive nel database: " +
      "crea una proposta che l'admin approva o rifiuta a mano. Usa 'name' per il titolo del POI.",
    schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Titolo del POI (colonna title)." },
        description: { type: "string", description: "Descrizione del POI." },
        category: { type: "string", description: "Categoria (stringa)." },
        tags: { type: "array", items: { type: "string" }, description: "Tag opzionali." },
        lat: { type: "number", description: "Latitudine (numero)." },
        lng: { type: "number", description: "Longitudine (numero)." },
        address: { type: "string", description: "Indirizzo opzionale." },
        city: { type: "string", description: "Citta'." },
        rationale: { type: "string", description: "Perche' proponi questo POI." },
      },
      required: ["name"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_historic_route",
    kind: "write",
    description:
      "Propone una rotta storica (trip is_historic, bozza non pubblicata) con una sequenza di tappe. " +
      "NON scrive nel database: crea una proposta che l'admin approva o rifiuta. " +
      "Le tappe possono collegare POI esistenti (link_existing_poi_id) o nuovi POI proposti nel payload.",
    schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Nome della rotta storica." },
        badge: { type: "string", description: "Etichetta breve / badge della rotta." },
        city: { type: "string", description: "Citta' della rotta." },
        stops: {
          type: "array",
          description: "Tappe ordinate della rotta (max 30).",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              lat: { type: "number" },
              lng: { type: "number" },
              link_existing_poi_id: {
                type: "string",
                description: "UUID di un POI esistente da collegare (opzionale).",
              },
              new_poi_ref: {
                type: "string",
                description: "Riferimento a un nuovo POI presente in new_pois (opzionale).",
              },
            },
            required: ["name"],
            additionalProperties: false,
          },
        },
        new_pois: {
          type: "array",
          description: "Nuovi POI creati insieme alla rotta, referenziati dalle tappe via ref.",
          items: {
            type: "object",
            properties: {
              ref: { type: "string", description: "Identificatore locale referenziato da new_poi_ref." },
              name: { type: "string" },
              description: { type: "string" },
              category: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              lat: { type: "number" },
              lng: { type: "number" },
              city: { type: "string" },
            },
            required: ["ref", "name"],
            additionalProperties: false,
          },
        },
        rationale: { type: "string", description: "Perche' questa rotta storica." },
      },
      required: ["title", "stops"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_project",
    kind: "write",
    description:
      "Propone un progetto intero: una rotta storica piu' un set di nuovi POI collegati, in un colpo solo. " +
      "NON scrive nel database: crea una proposta che l'admin approva o rifiuta. " +
      "Tutto nasce in bozza non pubblica; l'applicazione e' transazionale lato DB.",
    schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titolo del progetto." },
        route: {
          type: "object",
          description: "La rotta storica del progetto.",
          properties: {
            name: { type: "string" },
            badge: { type: "string" },
            stops: {
              type: "array",
              description: "Tappe ordinate (max 30).",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  lat: { type: "number" },
                  lng: { type: "number" },
                  link_existing_poi_id: { type: "string" },
                  new_poi_ref: { type: "string" },
                },
                required: ["name"],
                additionalProperties: false,
              },
            },
          },
          required: ["name", "stops"],
          additionalProperties: false,
        },
        new_pois: {
          type: "array",
          description: "Nuovi POI del progetto, referenziati dalle tappe via ref.",
          items: {
            type: "object",
            properties: {
              ref: { type: "string" },
              name: { type: "string" },
              description: { type: "string" },
              category: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              lat: { type: "number" },
              lng: { type: "number" },
              city: { type: "string" },
            },
            required: ["ref", "name"],
            additionalProperties: false,
          },
        },
        rationale: { type: "string", description: "Perche' questo progetto." },
      },
      required: ["title", "route"],
      additionalProperties: false,
    },
  },
];

const TOOL_BY_NAME: Record<string, ToolDef> = Object.fromEntries(
  TOOLS.map((t) => [t.name, t]),
);

// ── Dialetti dei tool per i due provider ────────────────────────────────────────
function anthropicTools() {
  return TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.schema,
  }));
}

function openaiTools() {
  return TOOLS.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.schema,
    },
  }));
}

// ════════════════════════════════════════════════════════════════════════════
//  ESECUZIONE TOOL READ (service_role, solo SELECT/COUNT whitelisted)
// ════════════════════════════════════════════════════════════════════════════

function clampLimit(v: unknown, def = 20): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.min(50, Math.max(1, Math.floor(n)));
}

async function runQueryData(
  svc: SvcClient,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const table = String(input?.table ?? "");
  const spec = READ_TABLES[table];
  if (!spec) return { error: `tabella non consentita: ${table}` };

  const mode = input?.mode === "rows" ? "rows" : "count";

  // Filtri: solo colonne whitelisted, solo uguaglianza.
  const rawFilters =
    input?.filters && typeof input.filters === "object" && !Array.isArray(input.filters)
      ? (input.filters as Record<string, unknown>)
      : {};
  const appliedFilters: Record<string, unknown> = {};

  if (mode === "count") {
    let q = svc.from(table).select("id", { count: "exact", head: true });
    for (const [k, v] of Object.entries(rawFilters)) {
      if (!spec.filters.includes(k)) continue;
      if (typeof v !== "string" && typeof v !== "number" && typeof v !== "boolean") continue;
      q = q.eq(k, v);
      appliedFilters[k] = v;
    }
    const { count, error } = await q;
    if (error) return { error: error.message };
    return { table, mode, count: count ?? 0, applied_filters: appliedFilters };
  }

  // rows
  const limit = clampLimit(input?.limit);
  let q = svc.from(table).select(spec.columns).order("created_at", { ascending: false }).limit(limit);
  for (const [k, v] of Object.entries(rawFilters)) {
    if (!spec.filters.includes(k)) continue;
    if (typeof v !== "string" && typeof v !== "number" && typeof v !== "boolean") continue;
    q = q.eq(k, v);
    appliedFilters[k] = v;
  }
  const { data, error } = await q;
  if (error) return { error: error.message };
  return { table, mode, rows: data ?? [], count: (data ?? []).length, applied_filters: appliedFilters };
}

async function runHistoricAnalysis(
  svc: SvcClient,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const city = typeof input?.city === "string" ? input.city : "";
  const limit = clampLimit(input?.limit);

  const historicCount = await svc
    .from("trips")
    .select("id", { count: "exact", head: true })
    .eq("is_historic", true)
    .eq("is_published", true);

  let poiQuery = svc
    .from("pois")
    .select("id,title,category,city,lat,lng,visibility")
    .eq("visibility", "official")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (city) poiQuery = poiQuery.eq("city", city);

  const officialPois = await poiQuery;

  return {
    city: city || "(tutte)",
    historic_routes_published: historicCount.count ?? 0,
    official_pois_sample: officialPois.data ?? [],
    official_pois_count: (officialPois.data ?? []).length,
  };
}

async function executeReadTool(
  svc: SvcClient,
  name: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  try {
    if (name === "query_data") return await runQueryData(svc, input);
    if (name === "historic_analysis") return await runHistoricAnalysis(svc, input);
    return { error: `tool di lettura sconosciuto: ${name}` };
  } catch (e) {
    return { error: String(e instanceof Error ? e.message : e) };
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  VALIDAZIONE PAYLOAD TOOL WRITE (lato server, prima di inserire la proposta)
// ════════════════════════════════════════════════════════════════════════════

function asTrimmedString(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

function isFiniteNum(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v);
}

function sanitizeTags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => typeof x === "string")
    .map((x) => (x as string).trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 20);
}

interface ValidationResult {
  ok: boolean;
  error?: string;
  kind?: "poi" | "route" | "project";
  title?: string;
  summary?: string;
  payload?: Record<string, unknown>;
}

// Valida un singolo POI (sia standalone sia annidato in new_pois).
function validatePoiObj(
  src: Record<string, unknown>,
  requireRef: boolean,
): { ok: boolean; error?: string; value?: Record<string, unknown> } {
  const name = asTrimmedString(src?.name, 200);
  if (!name) return { ok: false, error: "POI senza name" };

  const out: Record<string, unknown> = { name };

  if (requireRef) {
    const ref = asTrimmedString(src?.ref, 80);
    if (!ref) return { ok: false, error: `POI '${name}' senza ref` };
    out.ref = ref;
  }

  if (src?.description !== undefined) out.description = asTrimmedString(src.description, 4000);
  if (src?.category !== undefined) {
    if (typeof src.category !== "string") return { ok: false, error: `category non stringa per '${name}'` };
    out.category = asTrimmedString(src.category, 80);
  }
  if (src?.address !== undefined) out.address = asTrimmedString(src.address, 300);
  if (src?.city !== undefined) out.city = asTrimmedString(src.city, 120);
  if (src?.tags !== undefined) out.tags = sanitizeTags(src.tags);

  if (src?.lat !== undefined && src.lat !== null) {
    if (!isFiniteNum(src.lat) || (src.lat as number) < -90 || (src.lat as number) > 90) {
      return { ok: false, error: `lat non valida per '${name}'` };
    }
    out.lat = src.lat;
  }
  if (src?.lng !== undefined && src.lng !== null) {
    if (!isFiniteNum(src.lng) || (src.lng as number) < -180 || (src.lng as number) > 180) {
      return { ok: false, error: `lng non valida per '${name}'` };
    }
    out.lng = src.lng;
  }

  return { ok: true, value: out };
}

// Valida le tappe di una rotta (max 30).
function validateStops(
  stops: unknown,
): { ok: boolean; error?: string; value?: Array<Record<string, unknown>> } {
  if (!Array.isArray(stops) || stops.length === 0) {
    return { ok: false, error: "rotta senza tappe" };
  }
  if (stops.length > 30) {
    return { ok: false, error: `troppe tappe: ${stops.length}, massimo 30` };
  }
  const out: Array<Record<string, unknown>> = [];
  for (const s of stops as Array<Record<string, unknown>>) {
    const name = asTrimmedString(s?.name, 200);
    if (!name) return { ok: false, error: "tappa senza name" };
    const stop: Record<string, unknown> = { name };
    if (s?.lat !== undefined && s.lat !== null) {
      if (!isFiniteNum(s.lat) || (s.lat as number) < -90 || (s.lat as number) > 90) {
        return { ok: false, error: `lat tappa '${name}' non valida` };
      }
      stop.lat = s.lat;
    }
    if (s?.lng !== undefined && s.lng !== null) {
      if (!isFiniteNum(s.lng) || (s.lng as number) < -180 || (s.lng as number) > 180) {
        return { ok: false, error: `lng tappa '${name}' non valida` };
      }
      stop.lng = s.lng;
    }
    if (s?.link_existing_poi_id !== undefined) {
      stop.link_existing_poi_id = asTrimmedString(s.link_existing_poi_id, 80);
    }
    if (s?.new_poi_ref !== undefined) {
      stop.new_poi_ref = asTrimmedString(s.new_poi_ref, 80);
    }
    out.push(stop);
  }
  return { ok: true, value: out };
}

function validateNewPois(
  newPois: unknown,
): { ok: boolean; error?: string; value?: Array<Record<string, unknown>> } {
  if (newPois === undefined || newPois === null) return { ok: true, value: [] };
  if (!Array.isArray(newPois)) return { ok: false, error: "new_pois non e' un array" };
  if (newPois.length > 30) return { ok: false, error: `troppi new_pois: ${newPois.length}, massimo 30` };
  const out: Array<Record<string, unknown>> = [];
  for (const p of newPois as Array<Record<string, unknown>>) {
    const v = validatePoiObj(p, true);
    if (!v.ok) return { ok: false, error: v.error };
    out.push(v.value!);
  }
  return { ok: true, value: out };
}

// Valida il payload di un tool WRITE e produce {kind, title, summary, payload} normalizzato.
function validateWritePayload(
  name: string,
  input: Record<string, unknown>,
): ValidationResult {
  if (name === "propose_poi") {
    const v = validatePoiObj(input, false);
    if (!v.ok) return { ok: false, error: v.error };
    const poi = v.value!;
    if (input?.rationale !== undefined) poi.rationale = asTrimmedString(input.rationale, 2000);
    const title = String(poi.name);
    return {
      ok: true,
      kind: "poi",
      title,
      summary: `POI proposto: ${title}` + (poi.city ? ` (${poi.city})` : ""),
      payload: poi,
    };
  }

  if (name === "propose_historic_route") {
    const title = asTrimmedString(input?.title, 200);
    if (!title) return { ok: false, error: "rotta senza title" };

    const stopsRes = validateStops(input?.stops);
    if (!stopsRes.ok) return { ok: false, error: stopsRes.error };

    const newPoisRes = validateNewPois(input?.new_pois);
    if (!newPoisRes.ok) return { ok: false, error: newPoisRes.error };

    // Forma payload allineata alla RPC apply_ai_proposal: route.{name,badge,stops} + new_pois.
    const payload: Record<string, unknown> = {
      title,
      route: {
        name: title,
        badge: asTrimmedString(input?.badge, 80) || undefined,
        stops: stopsRes.value,
      },
      new_pois: newPoisRes.value,
    };
    if (input?.city !== undefined) (payload.route as Record<string, unknown>).city = asTrimmedString(input.city, 120);
    if (input?.rationale !== undefined) payload.rationale = asTrimmedString(input.rationale, 2000);

    return {
      ok: true,
      kind: "route",
      title,
      summary: `Rotta storica proposta: ${title} (${stopsRes.value!.length} tappe, ${newPoisRes.value!.length} nuovi POI)`,
      payload,
    };
  }

  if (name === "propose_project") {
    const title = asTrimmedString(input?.title, 200);
    if (!title) return { ok: false, error: "progetto senza title" };

    const route =
      input?.route && typeof input.route === "object" && !Array.isArray(input.route)
        ? (input.route as Record<string, unknown>)
        : null;
    if (!route) return { ok: false, error: "progetto senza route" };

    const routeName = asTrimmedString(route?.name, 200) || title;
    const stopsRes = validateStops(route?.stops);
    if (!stopsRes.ok) return { ok: false, error: stopsRes.error };

    const newPoisRes = validateNewPois(input?.new_pois);
    if (!newPoisRes.ok) return { ok: false, error: newPoisRes.error };

    const payload: Record<string, unknown> = {
      title,
      route: {
        name: routeName,
        badge: asTrimmedString(route?.badge, 80) || undefined,
        stops: stopsRes.value,
      },
      new_pois: newPoisRes.value,
    };
    if (input?.rationale !== undefined) payload.rationale = asTrimmedString(input.rationale, 2000);

    return {
      ok: true,
      kind: "project",
      title,
      summary: `Progetto proposto: ${title} (rotta '${routeName}', ${stopsRes.value!.length} tappe, ${newPoisRes.value!.length} nuovi POI)`,
      payload,
    };
  }

  return { ok: false, error: `tool di scrittura sconosciuto: ${name}` };
}

// Inserisce la proposta validata in ai_proposals (pending) e logga in admin_audit_log.
async function persistProposal(
  svc: SvcClient,
  adminId: string,
  res: ValidationResult,
): Promise<{ ok: boolean; proposal?: ProposalOut; error?: string }> {
  const { kind, title, summary, payload } = res;
  const rationale =
    payload && typeof payload.rationale === "string" ? (payload.rationale as string) : null;

  const { data, error } = await svc
    .from("ai_proposals")
    .insert({
      admin_id: adminId,
      kind,
      title,
      payload,
      status: "pending",
      rationale,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { ok: false, error: error?.message ?? "insert ai_proposals failed" };
  }

  const proposalId = String(data.id);

  try {
    await svc.from("admin_audit_log").insert({
      admin_id: adminId,
      action: "ai_proposal_create",
      target_type: kind,
      target_id: proposalId,
      meta: { kind, title, summary },
    });
  } catch (_e) {
    // Il log non deve bloccare: la proposta e' gia' persistita.
  }

  return {
    ok: true,
    proposal: {
      id: proposalId,
      kind: kind!,
      title: title!,
      summary: summary!,
      payload: payload!,
    },
  };
}

// ════════════════════════════════════════════════════════════════════════════
//  PROVIDER ANTHROPIC — loop agentico con tool use nativo
// ════════════════════════════════════════════════════════════════════════════

interface AgentResult {
  reply: string;
  proposals: ProposalOut[];
  tokIn: number;
  tokOut: number;
}

async function anthropicCall(
  model: string,
  systemPrompt: string,
  msgs: unknown[],
): Promise<{ data: any; tokIn: number; tokOut: number }> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: systemPrompt,
      tools: anthropicTools(),
      messages: msgs,
    }),
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`anthropic_${r.status}: ${detail.slice(0, 400)}`);
  }
  const data = await r.json();
  const tokIn = Number(data?.usage?.input_tokens) || 0;
  const tokOut = Number(data?.usage?.output_tokens) || 0;
  return { data, tokIn, tokOut };
}

async function runAnthropic(
  svc: SvcClient,
  adminId: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<AgentResult> {
  // Solo user/assistant nel body; il system va separato.
  const msgs: any[] = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  let totalIn = 0;
  let totalOut = 0;
  const proposals: ProposalOut[] = [];
  let finalText = "";

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const { data, tokIn, tokOut } = await anthropicCall(model, systemPrompt, msgs);
    totalIn += tokIn;
    totalOut += tokOut;

    const blocks: any[] = Array.isArray(data?.content) ? data.content : [];

    // Testo prodotto in questo round.
    const text = blocks
      .filter((b) => b?.type === "text")
      .map((b) => String(b?.text ?? ""))
      .join("");
    if (text) finalText = text;

    const toolUses = blocks.filter((b) => b?.type === "tool_use");

    if (data?.stop_reason !== "tool_use" || toolUses.length === 0) {
      // Nessun tool richiesto: fine del loop.
      break;
    }

    // Rimetti il turno assistant (con i blocchi tool_use) nella conversazione.
    msgs.push({ role: "assistant", content: blocks });

    // Esegui ogni tool e prepara i tool_result.
    const toolResults: any[] = [];
    for (const tu of toolUses) {
      const name = String(tu?.name ?? "");
      const input = (tu?.input && typeof tu.input === "object" ? tu.input : {}) as Record<string, unknown>;
      const def = TOOL_BY_NAME[name];

      let resultObj: Record<string, unknown>;
      if (!def) {
        resultObj = { error: `tool sconosciuto: ${name}` };
      } else if (def.kind === "read") {
        resultObj = await executeReadTool(svc, name, input);
      } else {
        // WRITE: non eseguire. Valida e persisti come proposta.
        const v = validateWritePayload(name, input);
        if (!v.ok) {
          resultObj = { ok: false, error: v.error };
        } else {
          const p = await persistProposal(svc, adminId, v);
          if (!p.ok) {
            resultObj = { ok: false, error: p.error };
          } else {
            proposals.push(p.proposal!);
            resultObj = {
              ok: true,
              proposal_id: p.proposal!.id,
              kind: p.proposal!.kind,
              status: "pending",
              note: "Proposta creata. L'amministratore la approvera' o rifiutera' a mano dal pannello. Niente e' stato scritto nel database.",
            };
          }
        }
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: tu?.id,
        content: JSON.stringify(resultObj),
      });
    }

    // Re-inietta i risultati come messaggio user.
    msgs.push({ role: "user", content: toolResults });
  }

  if (!finalText) {
    finalText = proposals.length
      ? "Ho preparato le proposte qui sotto: rivedile e approva o rifiuta dal pannello."
      : "Ok.";
  }

  return { reply: finalText, proposals, tokIn: totalIn, tokOut: totalOut };
}

// ════════════════════════════════════════════════════════════════════════════
//  PROVIDER OPENAI — loop agentico con tool use nativo (function calling)
// ════════════════════════════════════════════════════════════════════════════

async function openaiCall(
  model: string,
  msgs: unknown[],
): Promise<{ data: any; tokIn: number; tokOut: number }> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: msgs,
      tools: openaiTools(),
      tool_choice: "auto",
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.6,
    }),
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`openai_${r.status}: ${detail.slice(0, 400)}`);
  }
  const data = await r.json();
  const tokIn = Number(data?.usage?.prompt_tokens) || 0;
  const tokOut = Number(data?.usage?.completion_tokens) || 0;
  return { data, tokIn, tokOut };
}

async function runOpenAI(
  svc: SvcClient,
  adminId: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<AgentResult> {
  const msgs: any[] = [
    { role: "system", content: systemPrompt },
    ...messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content })),
  ];

  let totalIn = 0;
  let totalOut = 0;
  const proposals: ProposalOut[] = [];
  let finalText = "";

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const { data, tokIn, tokOut } = await openaiCall(model, msgs);
    totalIn += tokIn;
    totalOut += tokOut;

    const choice = data?.choices?.[0];
    const message = choice?.message ?? {};
    const toolCalls: any[] = Array.isArray(message?.tool_calls) ? message.tool_calls : [];

    if (typeof message?.content === "string" && message.content.trim()) {
      finalText = message.content;
    }

    if (choice?.finish_reason !== "tool_calls" || toolCalls.length === 0) {
      break;
    }

    // Rimetti il turno assistant (con i tool_calls) nella conversazione.
    msgs.push({
      role: "assistant",
      content: message?.content ?? null,
      tool_calls: toolCalls,
    });

    for (const tc of toolCalls) {
      const name = String(tc?.function?.name ?? "");
      let input: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(tc?.function?.arguments ?? "{}");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          input = parsed as Record<string, unknown>;
        }
      } catch (_e) {
        input = {};
      }

      const def = TOOL_BY_NAME[name];
      let resultObj: Record<string, unknown>;
      if (!def) {
        resultObj = { error: `tool sconosciuto: ${name}` };
      } else if (def.kind === "read") {
        resultObj = await executeReadTool(svc, name, input);
      } else {
        const v = validateWritePayload(name, input);
        if (!v.ok) {
          resultObj = { ok: false, error: v.error };
        } else {
          const p = await persistProposal(svc, adminId, v);
          if (!p.ok) {
            resultObj = { ok: false, error: p.error };
          } else {
            proposals.push(p.proposal!);
            resultObj = {
              ok: true,
              proposal_id: p.proposal!.id,
              kind: p.proposal!.kind,
              status: "pending",
              note: "Proposta creata. L'amministratore la approvera' o rifiutera' a mano dal pannello. Niente e' stato scritto nel database.",
            };
          }
        }
      }

      msgs.push({
        role: "tool",
        tool_call_id: tc?.id,
        content: JSON.stringify(resultObj),
      });
    }
  }

  if (!finalText) {
    finalText = proposals.length
      ? "Ho preparato le proposte qui sotto: rivedile e approva o rifiuta dal pannello."
      : "Ok.";
  }

  return { reply: finalText, proposals, tokIn: totalIn, tokOut: totalOut };
}

// ── Handler ─────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Config minima presente?
  if (!SUPABASE_URL || !ANON_KEY) {
    return json({ error: "server_misconfigured", detail: "missing supabase url/anon" }, 500);
  }
  if (!SERVICE_ROLE_KEY) {
    return json({ error: "server_misconfigured", detail: "missing service role" }, 500);
  }

  // ── 1) JWT dall'header Authorization ──────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!jwt) return json({ error: "unauthorized", detail: "missing bearer token" }, 401);

  // ── 2) Client ANON + JWT, getUser() ───────────────────────────────────────────
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return json({ error: "unauthorized", detail: "invalid session" }, 401);
  }

  // ── 3) Gate admin con service_role (la chiave non esce mai da qui) ─────────────
  const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error: profErr } = await svc
    .from("profiles")
    .select("id, is_admin, moderation_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr) {
    return json({ error: "server_error", detail: "profile lookup failed" }, 500);
  }
  if (!profile || profile.is_admin !== true || profile.moderation_status !== "active") {
    return json({ error: "forbidden", detail: "admin access required" }, 403);
  }

  // Richiedi il secondo fattore (MFA, aal2): il copilota AI costa e ora propone scritture,
  // va protetto come le altre azioni admin. Coerente con is_admin() lato DB: se il JWT non
  // porta il claim aal (caso raro) non si blocca.
  try {
    const payload = JSON.parse(atob((jwt.split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/")));
    if (payload?.aal && payload.aal !== "aal2") {
      return json({ error: "mfa_required", detail: "second factor required" }, 403);
    }
  } catch (_e) { /* JWT non decodificabile: getUser ha gia validato la sessione, proseguo */ }

  // Da qui in poi: l'utente e' admin attivo con MFA. Solo ora usiamo i privilegi service_role.

  // ── Body ──────────────────────────────────────────────────────────────────────
  const body = await req.json().catch(() => ({}));
  const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
  const messages: ChatMessage[] = rawMessages
    .filter(
      (m: unknown): m is ChatMessage =>
        !!m &&
        typeof (m as ChatMessage).content === "string" &&
        ["user", "assistant", "system"].includes((m as ChatMessage).role),
    )
    .slice(-20);

  if (!messages.length) {
    return json({ error: "bad_request", detail: "no messages" }, 400);
  }

  const mode: Mode =
    body?.mode === "route" || body?.mode === "write" ? body.mode : "chat";

  // ── Scelta provider + modello (whitelist) ─────────────────────────────────────
  let provider: "anthropic" | "openai";
  let model: string;

  if (ANTHROPIC_KEY) {
    provider = "anthropic";
    model = ANTHROPIC_ALLOWED.has(ANTHROPIC_MODEL)
      ? ANTHROPIC_MODEL
      : "claude-sonnet-4-6";
  } else if (OPENAI_KEY) {
    provider = "openai";
    model = OPENAI_ALLOWED.has(OPENAI_MODEL) ? OPENAI_MODEL : "gpt-4o";
  } else {
    return json({ error: "no_ai_key", detail: "no AI provider configured" }, 503);
  }

  // ── Tetto di spesa: blocca prima di chiamare l'AI ─────────────────────────────
  let spent = 0;
  try {
    spent = await spentTodayEur(svc, user.id);
  } catch (_e) {
    spent = 0;
  }
  if (spent >= DAILY_EUR_CAP) {
    return json(
      {
        error: "daily_cap_reached",
        detail:
          `Tetto di spesa AI giornaliero raggiunto: ${spent.toFixed(4)} su ${DAILY_EUR_CAP.toFixed(2)} euro. ` +
          "Riprova domani oppure alza DAILY_EUR_CAP nei segreti della funzione.",
        spent_eur: Number(spent.toFixed(4)),
        cap_eur: DAILY_EUR_CAP,
      },
      429,
    );
  }

  // ── Statistiche fresche (service_role) + system message ───────────────────────
  let stats: Record<string, unknown> = {};
  try {
    stats = await gatherStats(svc);
  } catch (_e) {
    stats = {};
  }

  const systemPrompt =
    baseSystemPrompt(mode) + "\n\n" + statsToSystemMessage(stats);

  // ── Loop agentico con fallback provider ───────────────────────────────────────
  let agent: AgentResult | null = null;
  let usedModel = model;
  let usedProvider = provider;

  try {
    agent =
      provider === "anthropic"
        ? await runAnthropic(svc, user.id, model, systemPrompt, messages)
        : await runOpenAI(svc, user.id, model, systemPrompt, messages);
  } catch (primaryErr) {
    // Fallback verso l'altro provider, se disponibile e nessuna proposta e' stata
    // ancora scritta (il fallback riparte da zero, evita duplicati).
    try {
      if (provider === "anthropic" && OPENAI_KEY) {
        usedProvider = "openai";
        usedModel = OPENAI_ALLOWED.has(OPENAI_MODEL) ? OPENAI_MODEL : "gpt-4o";
        agent = await runOpenAI(svc, user.id, usedModel, systemPrompt, messages);
      } else if (provider === "openai" && ANTHROPIC_KEY) {
        usedProvider = "anthropic";
        usedModel = ANTHROPIC_ALLOWED.has(ANTHROPIC_MODEL)
          ? ANTHROPIC_MODEL
          : "claude-sonnet-4-6";
        agent = await runAnthropic(svc, user.id, usedModel, systemPrompt, messages);
      } else {
        throw primaryErr;
      }
    } catch (fallbackErr) {
      return json(
        {
          error: "ai_provider_error",
          detail: String(fallbackErr instanceof Error ? fallbackErr.message : fallbackErr),
        },
        502,
      );
    }
  }

  const { reply, proposals, tokIn, tokOut } = agent!;
  const cost = costEur(usedModel, tokIn, tokOut);

  // ── Log della chiamata in admin_audit_log (per il tetto di spesa) ─────────────
  try {
    await svc.from("admin_audit_log").insert({
      admin_id: user.id,
      action: "ai_call",
      target_type: "ai",
      target_id: usedModel,
      meta: {
        provider: usedProvider,
        model: usedModel,
        mode,
        tokens_in: tokIn,
        tokens_out: tokOut,
        cost_eur: cost,
        proposals: proposals.length,
      },
    });
  } catch (_e) {
    // Il log non deve bloccare la risposta all'admin. Si prosegue.
  }

  // ── Risposta finale come da contratto edge<->panel ────────────────────────────
  return json({
    reply,
    proposals,
    usage: { in: tokIn, out: tokOut, cost_eur: cost },
    data: {
      provider: usedProvider,
      model: usedModel,
      mode,
      stats,
      spent_today_eur: Number((spent + cost).toFixed(4)),
      cap_eur: DAILY_EUR_CAP,
    },
  });
});
