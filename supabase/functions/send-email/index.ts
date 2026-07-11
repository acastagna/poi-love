/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 */
// Edge Function: send-email
// Invio email della Zona Media, provider-agnostico (primo motore: AcumbaMail).
//
// SICUREZZA:
//   1) legge il JWT dall'header Authorization e verifica l'utente (anon client + getUser);
//   2) con un client service_role verifica profiles.is_admin = true AND moderation_status='active';
//   3) la chiave del provider (ACUMBA_KEY) vive SOLO qui come segreto (Deno.env), mai nel DB nÃ© nel client.
//
// Corpo richiesta: { to, template_key?, lang?, subject?, html?, vars? }
//   - se template_key: legge email_templates(key,lang), rende {{var}} con vars;
//   - altrimenti usa subject/html passati direttamente.
// Logga ogni invio in email_sends. Ritorna { ok, id? } oppure { ok:false, error }.
//
// DEPLOY (fa Alessandro): `supabase functions deploy send-email` + segreto `ACUMBA_KEY` (auth_token AcumbaMail).
// Finché la chiave non c'è, la funzione risponde ok:false 'engine not configured' (onesto, mai finto).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function render(tpl: string, vars: Record<string, string>): string {
  return (tpl || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k) => (vars && vars[k] != null ? String(vars[k]) : ""));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ACUMBA_KEY = Deno.env.get("ACUMBA_KEY") || "";

  // 1) autenticazione
  const authz = req.headers.get("Authorization") || "";
  const jwt = authz.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ ok: false, error: "no auth" }, 401);
  const asUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
  const { data: uData } = await asUser.auth.getUser();
  const uid = uData?.user?.id;
  if (!uid) return json({ ok: false, error: "invalid auth" }, 401);

  // 2) gate admin con service_role
  const svc = createClient(SUPABASE_URL, SERVICE);
  const { data: prof } = await svc.from("profiles").select("is_admin,moderation_status").eq("id", uid).maybeSingle();
  if (!prof || prof.is_admin !== true || prof.moderation_status !== "active") return json({ ok: false, error: "not admin" }, 403);

  let payload: any = {};
  try { payload = await req.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
  const to = String(payload.to || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return json({ ok: false, error: "bad recipient" }, 400);
  const vars = (payload.vars && typeof payload.vars === "object") ? payload.vars : {};

  // 3) risolvi soggetto/corpo (template o diretti)
  let subject = String(payload.subject || "");
  let html = String(payload.html || "");
  if (payload.template_key) {
    const { data: tpl } = await svc.from("email_templates")
      .select("subject,body_html").eq("key", payload.template_key).eq("lang", payload.lang || "it").maybeSingle();
    if (!tpl) return json({ ok: false, error: "template not found" }, 404);
    subject = render(tpl.subject, vars);
    html = render(tpl.body_html, vars);
  } else {
    subject = render(subject, vars); html = render(html, vars);
  }
  if (!subject || !html) return json({ ok: false, error: "empty subject/body" }, 400);

  // 4) mittente dalle impostazioni Zona Media
  const { data: setRow } = await svc.from("media_settings").select("value").eq("key", "email").maybeSingle();
  const cfg: any = (setRow && setRow.value) || {};
  const fromEmail = cfg.from || "no-reply@poilove.com";
  const fromName = cfg.from_name || "POI•LOVE";

  // 5) motore non configurato → risposta onesta (nessun invio finto)
  if (!ACUMBA_KEY) {
    return json({ ok: false, error: "engine not configured", detail: "manca il segreto ACUMBA_KEY nei Supabase Edge Secrets" }, 200);
  }

  // 6) invio via AcumbaMail (transazionale). NB: verificare endpoint/param sulla doc AcumbaMail al primo uso.
  let ok = false, err = "";
  try {
    const form = new URLSearchParams();
    form.set("auth_token", ACUMBA_KEY);
    form.set("from_email", fromEmail);
    form.set("from_name", fromName);
    form.set("to_email", to);
    form.set("subject", subject);
    form.set("body", html);
    const r = await fetch("https://acumbamail.com/api/1/sendOne/", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString(),
    });
    ok = r.ok;
    if (!ok) err = "provider " + r.status + " " + (await r.text()).slice(0, 200);
  } catch (e) { err = String(e).slice(0, 200); }

  // 7) log invio
  try {
    await svc.from("email_sends").insert({
      to_email: to, subject, status: ok ? "sent" : "failed", provider: "acumbamail",
      error: ok ? null : err, notification_id: payload.notification_id || null,
    });
  } catch (_) { /* log best-effort */ }

  return json(ok ? { ok: true } : { ok: false, error: err || "send failed" }, 200);
});
