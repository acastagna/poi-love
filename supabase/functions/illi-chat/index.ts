/**
 * © Alessandro Castagna : 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 */
// Edge Function: illi-chat
// Proxy server-side per le chiamate di ILLI•AI a OpenAI. La chiave (OPENAI_KEY) vive
// come SEGRETO sul server, MAI nel client ne nel repo.
//
// SICUREZZA (non negoziabile, stesso schema di admin-ai):
//   1) legge il JWT dall'header Authorization;
//   2) crea un client Supabase con ANON key + quel JWT e chiama auth.getUser():
//      senza utente valido risponde 401 { error: "auth_required" };
//   3) con un client service_role (segreto, mai esposto al client) legge il tier
//      dell'utente (profiles.special_tier) e i limiti AI per tier dalla config
//      gamification_config key "ai_limits_per_tier";
//   4) conta i messaggi del giorno via RPC increment_ai_usage(p_user): oltre la
//      soglia del tier risponde 429 { error: "daily_limit", limit: N }.
//
// SANITIZZAZIONE: dei messages in ingresso passano a OpenAI SOLO { role, content }
// (max 14 messaggi, content max 4000 caratteri). Campi extra tipo "places" vengono
// scartati qui e non arrivano mai al provider.
//
// STATUS HTTP VERI: 401 auth, 429 limite, 400 body vuoto, 503 no_key/eccezione,
// status reale di OpenAI se il provider risponde non-ok. Successo: 200 con il body
// OpenAI tale e quale (il client legge json.choices).

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

// ── Env (solo segreti da Deno.env, mai hardcoded) ─────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OPENAI_KEY = Deno.env.get("OPENAI_KEY") ?? "";

// ── Costanti ──────────────────────────────────────────────────────────────────
// Modelli ammessi dal client: solo i piccoli/economici. Niente gpt-4 pieno.
const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o-mini-2024-07-18"]);
const DEFAULT_MODEL = "gpt-4o-mini";

// Difese di default se la config non c'e o e incompleta (tier free).
const DEFAULT_DAILY_MESSAGES = 10;
const DEFAULT_MAX_TOKENS = 800;

// Massimo numero di messaggi inoltrati e lunghezza massima di ogni content.
const MAX_MESSAGES = 14;
const MAX_CONTENT_CHARS = 4000;

// Timeout verso OpenAI: su mobile stallato meglio un errore chiaro che uno spinner infinito.
const OPENAI_TIMEOUT_MS = 20000;

// ── Tipi ──────────────────────────────────────────────────────────────────────
type Role = "user" | "assistant" | "system";
interface ChatMessage {
  role: Role;
  content: string;
}
interface TierLimits {
  messages: number;
  maxTokens: number;
  model: string | null;
}

// ── Sanitizzazione messages ───────────────────────────────────────────────────
// Riduce ogni elemento a { role, content } puliti: role solo tra i tre ammessi,
// content stringa troncata. Tutto il resto (campi extra, tipi strani) si butta.
function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const role = (m as Record<string, unknown>).role;
    const content = (m as Record<string, unknown>).content;
    if (role !== "user" && role !== "assistant" && role !== "system") continue;
    if (typeof content !== "string" || !content.trim()) continue;
    out.push({ role, content: content.slice(0, MAX_CONTENT_CHARS) });
  }
  // Tengo gli ultimi 14: il contesto recente vale piu di quello vecchio.
  return out.slice(-MAX_MESSAGES);
}

// ── Risoluzione limiti del tier dalla config ──────────────────────────────────
// Config attesa (seed in 012_admin.sql): { tier: { messages_per_day, max_tokens, model } }.
// Accetto anche la chiave "messages" per robustezza. Fallback: valori free di default.
function resolveTierLimits(configValue: unknown, tier: string): TierLimits {
  const limits: TierLimits = {
    messages: DEFAULT_DAILY_MESSAGES,
    maxTokens: DEFAULT_MAX_TOKENS,
    model: null,
  };
  if (!configValue || typeof configValue !== "object") return limits;
  const byTier = configValue as Record<string, unknown>;
  const entry = (byTier[tier] ?? byTier["free"]) as Record<string, unknown> | undefined;
  if (!entry || typeof entry !== "object") return limits;

  const msgs = Number(entry.messages_per_day ?? entry.messages);
  if (Number.isFinite(msgs) && msgs > 0) limits.messages = Math.floor(msgs);

  const tok = Number(entry.max_tokens);
  if (Number.isFinite(tok) && tok > 0) limits.maxTokens = Math.floor(tok);

  // Il modello del tier vale SOLO se presente in config come stringa non vuota.
  if (typeof entry.model === "string" && entry.model.trim()) limits.model = entry.model.trim();

  return limits;
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Rimborso quota: se il messaggio e' gia' stato contato ma OpenAI fallisce,
  // lo si restituisce all'utente (RPC decrement_ai_usage, mig 017). Dichiarato
  // fuori dal try per essere raggiungibile anche dal catch.
  let refundQuota: (() => Promise<void>) | null = null;
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    // Config minima presente?
    if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
      console.error("illi-chat: env supabase mancante (url/anon/service_role)");
      return json({ error: "internal" }, 503);
    }

    // ── 1) Autenticazione obbligatoria: JWT dall'header Authorization ──────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!jwt) return json({ error: "auth_required" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userErr || !user) return json({ error: "auth_required" }, 401);

    // ── 2) Chiave provider: senza chiave inutile consumare quota utente ────────
    if (!OPENAI_KEY) return json({ error: "no_key" }, 503);

    // ── 3) Body sanitizzato PRIMA di contare: un body vuoto non brucia quota ───
    const body = await req.json().catch(() => ({}));
    const messages = sanitizeMessages(body?.messages);
    if (!messages.length) return json({ error: "bad_request" }, 400);

    // ── 4) Tier e limiti con service_role (la chiave non esce mai da qui) ──────
    const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [profileRes, configRes] = await Promise.all([
      svc.from("profiles").select("special_tier").eq("id", user.id).maybeSingle(),
      svc.from("gamification_config").select("value").eq("key", "ai_limits_per_tier").maybeSingle(),
    ]);
    if (profileRes.error) console.error("illi-chat: lettura profilo fallita:", profileRes.error.message);
    if (configRes.error) console.error("illi-chat: lettura config fallita:", configRes.error.message);

    const rawTier = (profileRes.data as { special_tier?: unknown } | null)?.special_tier;
    const tier = typeof rawTier === "string" && rawTier.trim() ? rawTier.trim() : "free";
    const limits = resolveTierLimits((configRes.data as { value?: unknown } | null)?.value, tier);

    // ── 5) Contatore giornaliero via RPC: oltre soglia si rifiuta con 429 ──────
    // La RPC increment_ai_usage arriva con la migrazione 016: se non esiste ancora
    // fail-open transitorio (loggato), MAI bloccare gli utenti per un deploy a meta.
    const { data: usageData, error: usageErr } = await svc.rpc("increment_ai_usage", {
      p_user: user.id,
    });
    if (usageErr) {
      console.error("illi-chat: increment_ai_usage non disponibile (fail-open):", usageErr.message);
    } else {
      // count e' POST-incremento: con limite N l'N-esimo messaggio ha count=N e passa
      // (giusto: e' l'N-esimo), l'N+1-esimo ha count=N+1 e viene rifiutato. Limite esatto = N.
      const count = typeof usageData === "number" ? usageData : Number(usageData);
      if (Number.isFinite(count) && count > limits.messages) {
        return json({ error: "daily_limit", limit: limits.messages }, 429);
      }
      // Messaggio contato: da qui in poi, se OpenAI fallisce, va rimborsato.
      refundQuota = async () => {
        refundQuota = null; // idempotente: al massimo un rimborso
        const { error: refundErr } = await svc.rpc("decrement_ai_usage", { p_user: user.id });
        if (refundErr) console.error("illi-chat: rimborso quota fallito:", refundErr.message);
      };
    }

    // ── 6) Payload verso OpenAI: solo campi decisi qui, mai il body grezzo ─────
    // Modello: whitelist sul valore chiesto dal client, override dal tier se in config.
    const clientModel = ALLOWED_MODELS.has(body?.model) ? body.model : DEFAULT_MODEL;
    const model = limits.model ?? clientModel;
    const payload = {
      model,
      messages,
      temperature: typeof body?.temperature === "number" ? body.temperature : 0.7,
      max_completion_tokens: Math.min(
        Number(body?.max_completion_tokens) || 512,
        limits.maxTokens,
      ),
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
    });

    // ── 7) Status veri: se OpenAI fallisce si inoltra il SUO status, non 200 ───
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error(`illi-chat: OpenAI ${r.status}:`, detail.slice(0, 500));
      if (refundQuota) await refundQuota(); // il fallimento non e' colpa dell'utente
      return json({ error: "upstream", status: r.status }, r.status);
    }

    // Successo: risposta OpenAI tale e quale, il client legge json.choices.
    const data = await r.json();
    return json(data, 200);
  } catch (e) {
    // Include il timeout (AbortSignal): meglio un 503 chiaro che uno spinner infinito.
    console.error("illi-chat: eccezione:", String(e));
    if (refundQuota) await refundQuota(); // anche qui: quota restituita
    return json({ error: "internal" }, 503);
  }
});
