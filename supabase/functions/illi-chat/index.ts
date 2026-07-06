/**
 * © Alessandro Castagna : 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 */
// Edge Function: illi-chat
// Proxy server-side per le chiamate di ILLI•AI. MULTI-PROVIDER: il motore (OpenAI o
// Anthropic) e il modello si scelgono dal PANNELLO ADMIN (config gamification_config
// key "illi_engine" = { provider, model }). Le CHIAVI (OPENAI_KEY, ANTHROPIC_KEY)
// restano SEGRETI in Deno.env, MAI nel client ne nel repo: il pannello sceglie solo
// QUALE motore usare, mai la chiave. Fail-safe: se il provider scelto non ha la
// chiave configurata, si ripiega su OpenAI. La risposta e' SEMPRE normalizzata alla
// shape OpenAI (json.choices[0].message.content), cosi il client non cambia.
//
// SICUREZZA (non negoziabile, stesso schema di admin-ai):
//   1) legge il JWT dall'header Authorization;
//   2) crea un client Supabase con ANON key + quel JWT e chiama auth.getUser():
//      senza utente valido risponde 401 { error: "auth_required" };
//   3) con un client service_role (segreto, mai esposto al client) legge il tier
//      dell'utente (profiles.special_tier), i limiti AI per tier e il motore attivo;
//   4) conta i messaggi del giorno via RPC increment_ai_usage(p_user): oltre la
//      soglia del tier risponde 429 { error: "daily_limit", limit: N }.
//
// SANITIZZAZIONE: dei messages in ingresso passano al provider SOLO { role, content }
// (max 14 messaggi, content max 4000 caratteri). Campi extra tipo "places" vengono
// scartati qui e non arrivano mai al provider.

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
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_KEY") ?? "";

// ── Costanti ──────────────────────────────────────────────────────────────────
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_ANTHROPIC_MODEL = "claude-3-5-haiku-latest";

// Difese di default se la config non c'e o e incompleta (tier free).
const DEFAULT_DAILY_MESSAGES = 10;
const DEFAULT_MAX_TOKENS = 800;

// Massimo numero di messaggi inoltrati e lunghezza massima di ogni content.
const MAX_MESSAGES = 14;
const MAX_CONTENT_CHARS = 4000;

// Timeout verso il provider: su mobile stallato meglio un errore chiaro che uno spinner infinito.
const PROVIDER_TIMEOUT_MS = 20000;

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
interface Engine {
  provider: "openai" | "anthropic";
  model: string;
}

// ── Sanitizzazione messages ───────────────────────────────────────────────────
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
  return out.slice(-MAX_MESSAGES);
}

// ── Risoluzione limiti del tier dalla config ──────────────────────────────────
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

  if (typeof entry.model === "string" && entry.model.trim()) limits.model = entry.model.trim();

  return limits;
}

// ── Risoluzione del MOTORE attivo (scelto dall'admin) ─────────────────────────
// Config attesa: { provider: "openai"|"anthropic", model: "..." }.
// Default: OpenAI gpt-4o-mini (comportamento storico, zero regressione).
// L'admin e' fidato ma il valore viene validato per formato; se il provider scelto
// non ha la chiave configurata si ripiega su OpenAI (fail-safe).
function resolveEngine(configValue: unknown): Engine {
  let provider: "openai" | "anthropic" = "openai";
  let model = DEFAULT_MODEL;
  if (configValue && typeof configValue === "object") {
    const c = configValue as Record<string, unknown>;
    const p = typeof c.provider === "string" ? c.provider.trim().toLowerCase() : "";
    if (p === "anthropic") { provider = "anthropic"; model = DEFAULT_ANTHROPIC_MODEL; }
    const m = typeof c.model === "string" ? c.model.trim() : "";
    if (m) model = m;
  }
  // Validazione formato: niente stringhe assurde nel nome modello.
  if (provider === "anthropic" && !/^claude-[a-z0-9._-]+$/i.test(model)) model = DEFAULT_ANTHROPIC_MODEL;
  if (provider === "openai" && !/^gpt-[a-z0-9._-]+$/i.test(model)) model = DEFAULT_MODEL;
  // Fail-safe: provider scelto senza chiave -> OpenAI.
  if (provider === "anthropic" && !ANTHROPIC_KEY) { provider = "openai"; model = DEFAULT_MODEL; }
  return { provider, model };
}

// Modello effettivo: il motore (illi_engine) fissa provider + modello globale, ma il
// campo "model" per-tier (ai_limits_per_tier) puo' ancora scegliere un modello DIVERSO
// per un livello, purche' compatibile col provider attivo. Un valore non valido per il
// provider (o vuoto) viene ignorato e si usa il modello del motore.
function pickModel(engine: Engine, tierModel: string | null): string {
  if (tierModel) {
    if (engine.provider === "anthropic" && /^claude-[a-z0-9._-]+$/i.test(tierModel)) return tierModel;
    if (engine.provider === "openai" && /^gpt-[a-z0-9._-]+$/i.test(tierModel)) return tierModel;
  }
  return engine.model;
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Rimborso quota: se il messaggio e' gia' stato contato ma il provider fallisce,
  // lo si restituisce all'utente (RPC decrement_ai_usage, mig 017).
  let refundQuota: (() => Promise<void>) | null = null;
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
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

    // Client service_role: la chiave non esce mai da qui.
    const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));

    // ── engine_status: solo admin, sola lettura, nessuna quota consumata ───────
    // Serve al pannello per mostrare quali chiavi sono configurate e quale motore
    // e' attivo, senza mai esporre le chiavi.
    if (body?.mode === "engine_status") {
      const { data: prof } = await svc.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      if (!(prof as { is_admin?: boolean } | null)?.is_admin) return json({ error: "forbidden" }, 403);
      const { data: eng } = await svc.from("gamification_config").select("value").eq("key", "illi_engine").maybeSingle();
      const active = resolveEngine((eng as { value?: unknown } | null)?.value);
      return json({
        providers: { openai: !!OPENAI_KEY, anthropic: !!ANTHROPIC_KEY },
        active,
      }, 200);
    }

    // ── 2) Body sanitizzato PRIMA di contare: un body vuoto non brucia quota ───
    const messages = sanitizeMessages(body?.messages);
    if (!messages.length) return json({ error: "bad_request" }, 400);

    // ── 3) Tier, limiti e motore con service_role ─────────────────────────────
    const [profileRes, configRes, engineRes] = await Promise.all([
      svc.from("profiles").select("special_tier").eq("id", user.id).maybeSingle(),
      svc.from("gamification_config").select("value").eq("key", "ai_limits_per_tier").maybeSingle(),
      svc.from("gamification_config").select("value").eq("key", "illi_engine").maybeSingle(),
    ]);
    if (profileRes.error) console.error("illi-chat: lettura profilo fallita:", profileRes.error.message);
    if (configRes.error) console.error("illi-chat: lettura config fallita:", configRes.error.message);

    const rawTier = (profileRes.data as { special_tier?: unknown } | null)?.special_tier;
    const tier = typeof rawTier === "string" && rawTier.trim() ? rawTier.trim() : "free";
    const limits = resolveTierLimits((configRes.data as { value?: unknown } | null)?.value, tier);
    const engine = resolveEngine((engineRes.data as { value?: unknown } | null)?.value);
    // provider dal motore globale; modello = override per-tier se valido, altrimenti motore
    const model = pickModel(engine, limits.model);

    // Chiave del provider effettivo: senza chiave inutile consumare quota utente.
    if (engine.provider === "openai" && !OPENAI_KEY) return json({ error: "no_key" }, 503);
    if (engine.provider === "anthropic" && !ANTHROPIC_KEY) return json({ error: "no_key" }, 503);

    // ── 4) Contatore giornaliero via RPC: oltre soglia si rifiuta con 429 ──────
    const { data: usageData, error: usageErr } = await svc.rpc("increment_ai_usage", {
      p_user: user.id,
    });
    if (usageErr) {
      console.error("illi-chat: increment_ai_usage non disponibile (fail-open):", usageErr.message);
    } else {
      const count = typeof usageData === "number" ? usageData : Number(usageData);
      if (Number.isFinite(count) && count > limits.messages) {
        return json({ error: "daily_limit", limit: limits.messages }, 429);
      }
      refundQuota = async () => {
        refundQuota = null; // idempotente
        const { error: refundErr } = await svc.rpc("decrement_ai_usage", { p_user: user.id });
        if (refundErr) console.error("illi-chat: rimborso quota fallito:", refundErr.message);
      };
    }

    const temperature = typeof body?.temperature === "number" ? body.temperature : 0.7;
    const maxTokens = Math.min(Number(body?.max_completion_tokens) || 512, limits.maxTokens);

    // ── 5) Dispatch al provider scelto ────────────────────────────────────────
    if (engine.provider === "anthropic") {
      // Anthropic vuole il system separato e solo ruoli user/assistant nei messages.
      const systemPrompt = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
      const amsgs = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));
      if (!amsgs.length) { if (refundQuota) await refundQuota(); return json({ error: "bad_request" }, 400); }

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          ...(systemPrompt ? { system: systemPrompt } : {}),
          messages: amsgs,
        }),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });
      if (!r.ok) {
        const detail = await r.text().catch(() => "");
        console.error(`illi-chat: Anthropic ${r.status}:`, detail.slice(0, 500));
        if (refundQuota) await refundQuota();
        return json({ error: "upstream", status: r.status }, r.status);
      }
      const ad = await r.json();
      const text = Array.isArray(ad?.content)
        ? ad.content.filter((b: any) => b?.type === "text").map((b: any) => b.text).join("")
        : "";
      // Normalizzo alla shape OpenAI: il client legge json.choices[0].message.content.
      return json({
        choices: [{
          index: 0,
          message: { role: "assistant", content: text },
          finish_reason: ad?.stop_reason ?? "stop",
        }],
        usage: {
          prompt_tokens: ad?.usage?.input_tokens ?? null,
          completion_tokens: ad?.usage?.output_tokens ?? null,
        },
        model: ad?.model ?? model,
        provider: "anthropic",
      }, 200);
    }

    // ── OpenAI (default) ──────────────────────────────────────────────────────
    const payload = {
      model,
      messages,
      temperature,
      max_completion_tokens: maxTokens,
    };
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error(`illi-chat: OpenAI ${r.status}:`, detail.slice(0, 500));
      if (refundQuota) await refundQuota();
      return json({ error: "upstream", status: r.status }, r.status);
    }
    const data = await r.json();
    return json(data, 200);
  } catch (e) {
    console.error("illi-chat: eccezione:", String(e));
    if (refundQuota) await refundQuota();
    return json({ error: "internal" }, 503);
  }
});
