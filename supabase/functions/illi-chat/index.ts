/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 */
// Edge Function: illi-chat
// Proxy server-side per le chiamate di ILLI•AI a OpenAI. La chiave (OPENAI_KEY) vive
// come SEGRETO sul server, MAI nel client ne nel repo. Il client manda lo stesso body
// stile OpenAI (model, messages, temperature, max_completion_tokens) a questa funzione,
// che lo inoltra a OpenAI aggiungendo la chiave. Tetto su modello e token per evitare
// che, essendo pubblica, qualcuno la usi per richieste costose. Degrada con { error }.

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

// Modelli ammessi: solo i piccoli/economici. Niente gpt-4 pieno via funzione pubblica.
const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o-mini-2024-07-18"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const KEY = Deno.env.get("OPENAI_KEY");
    if (!KEY) return json({ error: "no_key" }, 200);

    const body = await req.json().catch(() => ({}));
    const model = ALLOWED_MODELS.has(body?.model) ? body.model : "gpt-4o-mini";
    const messages = Array.isArray(body?.messages) ? body.messages.slice(-24) : [];
    if (!messages.length) return json({ error: "bad_request" }, 400);

    const payload = {
      model,
      messages,
      temperature: typeof body?.temperature === "number" ? body.temperature : 0.7,
      max_completion_tokens: Math.min(Number(body?.max_completion_tokens) || 512, 800),
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${KEY}` },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    // Inoltro la risposta di OpenAI tale e quale: il client legge json.choices[0].message.content
    return json(data, 200);
  } catch (e) {
    return json({ error: "exception", detail: String(e) }, 200);
  }
});
