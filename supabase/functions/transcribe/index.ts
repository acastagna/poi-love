// © Alessandro Castagna — 321.al / EVOLAB
// Tutti i diritti riservati. Uso non autorizzato vietato.
// info@321.al · https://321.al
//
// transcribe — trascrive un vocale della bacheca compagnia con OpenAI Whisper.
// Flusso: il client registra l'audio, lo carica nel bucket privato companion_audio e inserisce la riga
// in companion_messages (transcript vuota); poi chiama qui con { message_id }. Questa funzione:
//   1) verifica il JWT dell'utente (deve essere l'autore del messaggio);
//   2) scarica l'audio via service_role dal bucket;
//   3) lo manda a Whisper (whisper-1, verbose_json per avere la lingua);
//   4) scrive transcript+lang sulla riga (service_role); il realtime porta l'aggiornamento in bacheca.
// L'audio resta SEMPRE: se la trascrizione fallisce, il vocale c'e' lo stesso.

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OPENAI_KEY = Deno.env.get("OPENAI_KEY") ?? "";

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-1";
const TIMEOUT_MS = 45000;
const MAX_TRANSCRIPT = 4000;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) return json({ error: "server_misconfigured" }, 500);
    if (!OPENAI_KEY) return json({ error: "no_key" }, 503);

    // 1) Autenticazione: JWT dall'header Authorization.
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!jwt) return json({ error: "unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);
    const uid = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const messageId = String(body?.message_id ?? "").trim();
    if (!messageId) return json({ error: "message_id_required" }, 400);

    const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // 2) Recupera il messaggio e verifica che il chiamante sia l'autore.
    const { data: msg, error: msgErr } = await svc
      .from("companion_messages")
      .select("id, author_id, audio_path, transcript")
      .eq("id", messageId)
      .single();
    if (msgErr || !msg) return json({ error: "message_not_found" }, 404);
    if (msg.author_id !== uid) return json({ error: "forbidden" }, 403);
    if (!msg.audio_path) return json({ error: "no_audio" }, 400);
    if (msg.transcript && msg.transcript.length > 0) return json({ ok: true, transcript: msg.transcript, cached: true });

    // 3) Scarica l'audio dal bucket privato.
    const { data: blob, error: dlErr } = await svc.storage.from("companion_audio").download(msg.audio_path);
    if (dlErr || !blob) return json({ error: "audio_download_failed" }, 502);

    // 4) Whisper (verbose_json per ottenere la lingua rilevata).
    const form = new FormData();
    const fname = msg.audio_path.split("/").pop() || "audio.webm";
    form.append("file", new File([blob], fname, { type: blob.type || "audio/webm" }));
    form.append("model", WHISPER_MODEL);
    form.append("response_format", "verbose_json");

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let wr: Response;
    try {
      wr = await fetch(WHISPER_URL, { method: "POST", headers: { Authorization: `Bearer ${OPENAI_KEY}` }, body: form, signal: ctrl.signal });
    } finally { clearTimeout(to); }
    if (!wr.ok) {
      const errTxt = await wr.text().catch(() => "");
      return json({ error: "whisper_failed", detail: errTxt.slice(0, 200) }, 502);
    }
    const wj = await wr.json().catch(() => ({}));
    let transcript = String(wj?.text ?? "").trim();
    const lang = (wj?.language ? String(wj.language) : "").slice(0, 24);
    if (transcript.length > MAX_TRANSCRIPT) transcript = transcript.slice(0, MAX_TRANSCRIPT);

    // 5) Scrive la trascrizione (service_role). Se vuota, lascia null: l'audio basta comunque.
    const { error: upErr } = await svc
      .from("companion_messages")
      .update({ transcript: transcript || null, lang: lang || null })
      .eq("id", messageId);
    if (upErr) return json({ error: "update_failed", detail: upErr.message }, 500);

    return json({ ok: true, transcript, lang });
  } catch (e) {
    return json({ error: "internal", detail: String((e as Error)?.message || e).slice(0, 200) }, 500);
  }
});
