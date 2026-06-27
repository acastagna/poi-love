/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 */
// Edge Function: admin-ai
// Copilota AI riservato all'amministratore di POI•LOVE.
//
// SICUREZZA (non negoziabile):
//   1) legge il JWT dall'header Authorization;
//   2) crea un client Supabase con ANON key + quel JWT e chiama auth.getUser();
//   3) con un client service_role (segreto, mai esposto al client) verifica che il profilo
//      abbia is_admin = true E moderation_status = 'active'. Solo dopo questo gate la funzione
//      tocca dati/statistiche con i privilegi service_role.
//
// La service_role key vive SOLO qui dentro come segreto (Deno.env). Non esce mai dalla funzione.
//
// Tetto di spesa: rate limit per-admin giornaliero. Ogni chiamata AI viene loggata in
// admin_audit_log (action='ai_call', meta con token e costo in euro). Prima di chiamare l'AI
// si somma il costo del giorno per quell'admin; se supera DAILY_EUR_CAP si risponde 429.
//
// Provider: Claude (Anthropic) di default, fallback OpenAI. Chiavi come segreti.

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

// ── System prompt base (italiano, niente trattini lunghi, niente emoji a raffica) ──
function baseSystemPrompt(mode: Mode): string {
  const common =
    "Sei il copilota dell'amministratore di POI•LOVE, la mappa comunitaria dei luoghi amati " +
    "(primo lancio a Tirana). Parli sempre in italiano, in modo conciso e diretto. " +
    "Stile: niente trattini lunghi, usa virgole o due punti al loro posto. Niente emoji a raffica. " +
    "Rispondi solo su dati reali: usa le statistiche fresche fornite nel contesto, non inventare numeri. " +
    "Se non hai un dato, dillo con onesta'.";

  if (mode === "route") {
    return (
      common +
      "\n\nMODALITA' ROTTA: l'admin descrive un percorso o un'idea di itinerario. " +
      "Proponi una sequenza di tappe ordinate e sensata. " +
      "Per ogni tappa fornisci un nome chiaro e un breve hint. Se conosci coordinate plausibili, indicale, " +
      "altrimenti lascia lat/lng a null (non inventare coordinate precise). " +
      "Dopo il testo, includi SEMPRE un blocco JSON delimitato da ```json e ``` con questa forma esatta: " +
      '{"stops":[{"name":"...","hint":"...","lat":null,"lng":null}]}. ' +
      "Il blocco JSON deve essere valido e parsabile."
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
    "e sull'operativita'. Suggerisci azioni concrete quando ha senso."
  );
}

// ── Raccolta statistiche fresche con service_role (dopo il gate admin) ──────────
async function gatherStats(svc: ReturnType<typeof createClient>) {
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
async function spentTodayEur(
  svc: ReturnType<typeof createClient>,
  adminId: string,
): Promise<number> {
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

// ── Provider: Anthropic ─────────────────────────────────────────────────────────
async function callAnthropic(
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<{ reply: string; tokIn: number; tokOut: number }> {
  // Anthropic vuole system separato e solo ruoli user/assistant nel body.
  const conv = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

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
      messages: conv,
    }),
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`anthropic_${r.status}: ${detail.slice(0, 400)}`);
  }

  const data = await r.json();
  const reply = Array.isArray(data?.content)
    ? data.content
        .filter((b: { type?: string }) => b?.type === "text")
        .map((b: { text?: string }) => b?.text ?? "")
        .join("")
    : "";
  const tokIn = Number(data?.usage?.input_tokens) || 0;
  const tokOut = Number(data?.usage?.output_tokens) || 0;
  return { reply, tokIn, tokOut };
}

// ── Provider: OpenAI (fallback) ─────────────────────────────────────────────────
async function callOpenAI(
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<{ reply: string; tokIn: number; tokOut: number }> {
  const conv: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.filter((m) => m.role === "user" || m.role === "assistant"),
  ];

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: conv,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.6,
    }),
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`openai_${r.status}: ${detail.slice(0, 400)}`);
  }

  const data = await r.json();
  const reply = data?.choices?.[0]?.message?.content ?? "";
  const tokIn = Number(data?.usage?.prompt_tokens) || 0;
  const tokOut = Number(data?.usage?.completion_tokens) || 0;
  return { reply, tokIn, tokOut };
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

  // Richiedi il secondo fattore (MFA, aal2): il copilota AI costa, va protetto come le altre azioni
  // admin. Coerente con is_admin() lato DB: se il JWT non porta il claim aal (caso raro) non si blocca.
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

  // ── Chiamata AI con fallback ──────────────────────────────────────────────────
  let reply = "";
  let tokIn = 0;
  let tokOut = 0;
  let usedModel = model;
  let usedProvider = provider;

  try {
    if (provider === "anthropic") {
      const res = await callAnthropic(model, systemPrompt, messages);
      reply = res.reply;
      tokIn = res.tokIn;
      tokOut = res.tokOut;
    } else {
      const res = await callOpenAI(model, systemPrompt, messages);
      reply = res.reply;
      tokIn = res.tokIn;
      tokOut = res.tokOut;
    }
  } catch (primaryErr) {
    // Fallback verso l'altro provider, se disponibile.
    try {
      if (provider === "anthropic" && OPENAI_KEY) {
        usedProvider = "openai";
        usedModel = OPENAI_ALLOWED.has(OPENAI_MODEL) ? OPENAI_MODEL : "gpt-4o";
        const res = await callOpenAI(usedModel, systemPrompt, messages);
        reply = res.reply;
        tokIn = res.tokIn;
        tokOut = res.tokOut;
      } else if (provider === "openai" && ANTHROPIC_KEY) {
        usedProvider = "anthropic";
        usedModel = ANTHROPIC_ALLOWED.has(ANTHROPIC_MODEL)
          ? ANTHROPIC_MODEL
          : "claude-sonnet-4-6";
        const res = await callAnthropic(usedModel, systemPrompt, messages);
        reply = res.reply;
        tokIn = res.tokIn;
        tokOut = res.tokOut;
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

  // ── Mode route: estrai le tappe dal blocco json e pulisci la reply mostrata ───
  // Senza questo il pannello non riceve mai data.route e il bottone "Crea questo
  // percorso" non comparirebbe: la modalita route resterebbe solo testo.
  let routeOut:
    | { stops: Array<{ name: string; hint: string; lat: number | null; lng: number | null }> }
    | null = null;
  if (mode === "route") {
    const block = reply.match(/```json\s*([\s\S]*?)```/i);
    if (block) {
      try {
        const parsed = JSON.parse(block[1].trim());
        if (parsed && Array.isArray(parsed.stops) && parsed.stops.length) {
          const stops = (parsed.stops as Array<Record<string, unknown>>)
            .slice(0, 30)
            .map((s) => ({
              name: String(s?.name ?? "").slice(0, 200),
              hint: String(s?.hint ?? "").slice(0, 400),
              lat: typeof s?.lat === "number" ? s.lat : null,
              lng: typeof s?.lng === "number" ? s.lng : null,
            }))
            .filter((s) => s.name);
          if (stops.length) routeOut = { stops };
        }
      } catch (_e) {
        routeOut = null;
      }
      // togli il blocco JSON grezzo dal testo che vede l'admin
      reply = reply.replace(/```json\s*[\s\S]*?```/i, "").trim();
    }
  }

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
      },
    });
  } catch (_e) {
    // Il log non deve bloccare la risposta all'admin. Si prosegue.
  }

  return json({
    reply,
    usage: { in: tokIn, out: tokOut, cost_eur: cost },
    data: {
      provider: usedProvider,
      model: usedModel,
      mode,
      route: routeOut,
      stats,
      spent_today_eur: Number((spent + cost).toFixed(4)),
      cap_eur: DAILY_EUR_CAP,
    },
  });
});
