/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Lo studio di doppiaggio: dal copione all audio.
 *
 * Prende il copione scelto per un luogo in una lingua, le due voci decise nel
 * pannello e la regia, e li manda a Google. Torna indietro un file audio pronto
 * da ascoltare. Non lo salva: lo salva il pannello, con il biglietto
 * dell amministratore, cosi vale una regola sola per tutti i file.
 *
 * Due cose importanti:
 *  - il copione a due voci vuole il prefisso "Speaker 1:" e "Speaker 2:";
 *    con una voce sola il testo va nudo, senza nessun prefisso;
 *  - Google restituisce suono grezzo, senza intestazione. Qui gli si mette
 *    davanti l intestazione WAV, altrimenti nessun lettore lo apre.
 *
 * Ogni chiamata si paga, anche quella che poi si butta: il conto lo segna il
 * pannello subito dopo, con l esito.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REST = "https://poilove.com/db/rest/v1";
const AUTH = "https://poilove.com/db/auth/v1";
const SERVIZIO = Deno.env.get("POILOVE_SERVICE_JWT") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GOOGLE_TTS_KEY = Deno.env.get("GOOGLE_TTS_KEY") ?? "";

// 25 gettoni per ogni secondo di audio, 20 dollari per milione. A lotti, meta.
const DOLLARI_AL_SECONDO = 25 * 20 / 1_000_000;

function risposta(corpo: unknown, stato = 200) {
  return new Response(JSON.stringify(corpo), {
    status: stato, headers: { ...CORS, "Content-Type": "application/json" },
  });
}
function testa(): Record<string, string> {
  return { apikey: SERVIZIO, Authorization: `Bearer ${SERVIZIO}`, "Content-Type": "application/json" };
}
async function leggi(q: string): Promise<any[]> {
  const r = await fetch(`${REST}/${q}`, { headers: testa(), signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`lettura ${q}: ${r.status}`);
  return await r.json();
}
async function eAdmin(req: Request): Promise<string | null> {
  const h = req.headers.get("Authorization") ?? "";
  if (!/^Bearer eyJ/.test(h)) return null;
  const u = await fetch(`${AUTH}/user`, { headers: { Authorization: h, apikey: SERVIZIO } });
  if (!u.ok) return null;
  const me = await u.json();
  if (!me?.id) return null;
  const p = await leggi(`profiles?id=eq.${me.id}&select=is_admin`);
  return p[0]?.is_admin ? String(me.id) : null;
}

/** Suono grezzo a 24.000 Hz, mono, 16 bit: gli si mette davanti l intestazione WAV. */
function inWav(pcm: Uint8Array, hz = 24000): Uint8Array {
  const testa = new ArrayBuffer(44);
  const v = new DataView(testa);
  const scriviTesto = (p: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(p + i, s.charCodeAt(i)); };
  scriviTesto(0, "RIFF");
  v.setUint32(4, 36 + pcm.length, true);
  scriviTesto(8, "WAVEfmt ");
  v.setUint32(16, 16, true);          // lunghezza del blocco formato
  v.setUint16(20, 1, true);           // 1 = suono non compresso
  v.setUint16(22, 1, true);           // mono
  v.setUint32(24, hz, true);
  v.setUint32(28, hz * 2, true);      // byte al secondo
  v.setUint16(32, 2, true);           // byte per campione
  v.setUint16(34, 16, true);          // bit per campione
  scriviTesto(36, "data");
  v.setUint32(40, pcm.length, true);
  const tutto = new Uint8Array(44 + pcm.length);
  tutto.set(new Uint8Array(testa), 0);
  tutto.set(pcm, 44);
  return tutto;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return risposta({ errore: "solo POST" }, 405);
  if (!SERVIZIO) return risposta({ errore: "manca POILOVE_SERVICE_JWT" }, 500);
  if (!GOOGLE_TTS_KEY) {
    return risposta({
      errore: "manca la chiave di Google",
      spiegazione: "La si prende su aistudio.google.com/apikey e si carica nel segreto GOOGLE_TTS_KEY. " +
                   "Finche non c'e, il copione si scrive e si corregge, ma la voce non si puo fare.",
    }, 503);
  }
  const chi = await eAdmin(req);
  if (!chi) return risposta({ errore: "solo un amministratore" }, 403);

  let corpo: any = {};
  try { corpo = await req.json(); } catch { /* niente */ }
  const poi = String(corpo.poi ?? "");
  const lingua = /^(it|sq|en)$/.test(String(corpo.lingua ?? "")) ? String(corpo.lingua) : "it";

  // ── Assaggio: poche parole per sentire com e una voce ─────────────────────
  // Serve a scegliere, non a produrre. Sono tre secondi scarsi, ma si pagano
  // come tutto il resto: chi chiama li segna nel conto come prova buttata.
  if (corpo.assaggio) {
    const nome = String(corpo.voce ?? "").trim();
    if (!/^[A-Za-z]{2,24}$/.test(nome)) return risposta({ errore: "nome della voce non valido" }, 400);
    const FRASE = {
      it: "Benvenuto a Berat. Alza gli occhi: quelle finestre ti guardano da cinquecento anni.",
      sq: "Miresevini ne Berat. Ngri syte: ato dritare te veshtrojne prej pesёqind vjetesh.",
      en: "Welcome to Berat. Look up: those windows have been watching for five hundred years.",
    }[lingua];
    const u = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-tts:generateContent?key=${GOOGLE_TTS_KEY}`;
    const rr = await fetch(u, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: FRASE }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: nome } } },
        },
      }),
      signal: AbortSignal.timeout(90000),
    });
    const tt = await rr.text();
    if (!rr.ok) return risposta({ errore: "Google ha rifiutato l'assaggio", dettaglio: tt.slice(0, 300) }, 502);
    const pa = JSON.parse(tt)?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!pa?.data) return risposta({ errore: "Google non ha mandato audio" }, 502);
    const gr = Uint8Array.from(atob(pa.data), (c) => c.charCodeAt(0));
    const hz2 = Number((String(pa.mimeType || "").match(/rate=(\d+)/) || [])[1] || 24000);
    const w = inWav(gr, hz2);
    let b = "";
    for (let i = 0; i < w.length; i += 0x8000) b += String.fromCharCode(...w.subarray(i, i + 0x8000));
    const sec = gr.length / (hz2 * 2);
    return risposta({
      ok: true, wav: btoa(b), secondi: Number(sec.toFixed(1)), voce: nome,
      costo_stimato: Number((sec * DOLLARI_AL_SECONDO).toFixed(4)), assaggio: true,
    });
  }

  if (!poi) return risposta({ errore: "serve il luogo" }, 400);

  try {
    // il copione scelto, le voci e la regia: tutto viene dal pannello
    const [copioni, voci, impo] = await Promise.all([
      leggi(`poi_materiale?poi_id=eq.${poi}&fase=eq.copione&lingua=eq.${lingua}&scelto=is.true&select=id,testo`),
      leggi(`voci?scelta_per=not.is.null&select=nome,genere,scelta_per`),
      leggi(`voce_impostazioni?id=eq.1&select=regia,modello,a_lotti`),
    ]);
    const copione = copioni[0];
    if (!copione) return risposta({ errore: "per questo luogo non c'e un copione scelto in " + lingua }, 400);

    const f = voci.filter((v: any) => v.scelta_per === "femminile")[0];
    const m = voci.filter((v: any) => v.scelta_per === "maschile")[0];
    if (!f || !m) return risposta({ errore: "prima vanno scelte le due voci nel pannello" }, 400);

    const testo = String(copione.testo || "");
    const dueVoci = /^\s*Speaker\s*2\s*:/im.test(testo);
    const regia = String(impo[0]?.regia || "").trim();
    const modello = String(impo[0]?.modello || "gemini-2.5-pro-tts");

    const parlato = {
      // La regia e un campo a parte: Google la legge come istruzione a chi
      // recita, non come parole da leggere ad alta voce.
      ...(regia ? { prompt: regia } : {}),
      ...(dueVoci
        ? {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: "Speaker 1", voiceConfig: { prebuiltVoiceConfig: { voiceName: f.nome } } },
              { speaker: "Speaker 2", voiceConfig: { prebuiltVoiceConfig: { voiceName: m.nome } } },
            ],
          },
        }
        : { voiceConfig: { prebuiltVoiceConfig: { voiceName: f.nome } } }),
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modello}:generateContent?key=${GOOGLE_TTS_KEY}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: testo }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: parlato },
      }),
      signal: AbortSignal.timeout(300000),
    });
    const t = await r.text();
    if (!r.ok) return risposta({ errore: "Google ha rifiutato", dettaglio: t.slice(0, 400) }, 502);

    const j = JSON.parse(t);
    const parte = j?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!parte?.data) return risposta({ errore: "Google non ha mandato audio", dettaglio: t.slice(0, 300) }, 502);

    const grezzo = Uint8Array.from(atob(parte.data), (c) => c.charCodeAt(0));
    const hz = Number((String(parte.mimeType || "").match(/rate=(\d+)/) || [])[1] || 24000);
    const wav = inWav(grezzo, hz);
    const secondi = grezzo.length / (hz * 2);
    const gettoniAudio = Math.round(secondi * 25);
    const aLotti = !!impo[0]?.a_lotti;
    const costo = secondi * DOLLARI_AL_SECONDO * (aLotti ? 0.5 : 1);

    // base64 a pezzi: su un audio di dieci minuti la conversione in un colpo
    // solo sfonda la pila degli argomenti e la funzione muore senza dire perche.
    let b64 = "";
    for (let i = 0; i < wav.length; i += 0x8000) {
      b64 += String.fromCharCode(...wav.subarray(i, i + 0x8000));
    }

    return risposta({
      ok: true,
      wav: btoa(b64),
      secondi: Number(secondi.toFixed(1)),
      gettoni_in: Number(j?.usageMetadata?.promptTokenCount ?? 0),
      gettoni_out: gettoniAudio,
      costo_stimato: Number(costo.toFixed(4)),
      voce_f: f.nome, voce_m: m.nome,
      due_voci: dueVoci, modello, copione_id: copione.id,
    });
  } catch (e) {
    return risposta({ errore: String(e) }, 500);
  }
});
