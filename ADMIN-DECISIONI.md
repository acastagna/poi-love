# Revisione Pannello Admin — Decisioni e Avanzamento

> Companion operativo di `ORCHESTRAZIONE-ADMIN-POILOVE.md`. Qui vivono: le decisioni chiuse col founder, ciò che ho risolto da solo con verifica sul DB live, e il tracker di avanzamento per fase/task. Aggiornare a ogni giro.
> Avvio lavori: 12/07/2026.

## Decisioni del founder (chiuse il 12/07/2026)

| # | Tema | Decisione |
|---|------|-----------|
| Architettura | panel.html monolite vs moduli | **Moduli JS.** Componenti condivisi in `admin/js/*.js` caricati da panel.html. Deploy resta rsync di più file su admin.poilove.com. |
| A4 · Ricerca immagini | fonte foto "da internet" | **Wikimedia + Openverse + Unsplash** (tutte e tre). Chiave Unsplash nei Segreti Supabase. |
| A4 · Generazione AI | motore immagini | **fal.ai** (gateway SKUADRA), via edge function, chiave nei Segreti. |
| T5 · Provider AI | motori ILLI/copilota/embedding | **Grok (xAI) + OpenAI + Anthropic + Google Gemini + Mistral.** Chiavi solo nei Segreti, scritte via edge dedicata; il pannello mostra solo "configurata il [data]". |

## Default che applico io (fase 3, non bloccanti, correggibili quando vuole)

- **Embedding PDF (T11):** OpenAI `text-embedding-3-small` (economico). Rivedibile verso Gemini/Mistral.
- **Dominio landing vanity (T12):** sottodominio di poilove.com (proposta `vai.poilove.com`).
- **Retention IP iscritti (T1/D8):** 12 mesi, base giuridica legittimo interesse (sicurezza/antifrode), da annotare nel registro trattamenti.

## Risolto da solo (verificato sul DB live, niente domanda al founder)

- **Compagnie (T7.4):** l'entità ESISTE già → `companions(id,owner_id,code,name,description,type,start_date,start_time,end_date,end_time,avatar_url,...)` + `companion_members`. Riuso questa; aggiungerò `assigned_user_id`, collegamento POI e contatti quando serve (A3/T7).
- **Badge/assegnazione (A3):** oggi esistono solo `badge_official`/`badge_essential` su `trips`. Serve una migrazione mia: colonne uniformi `badge_type`, `badge_tier`, `assigned_user_id` su pois/trips/companions + RPC `admin_set_badge_and_owner` con audit.
- **pgvector (T11):** NON installato (solo postgis). Lo abilito io (`create extension vector`) quando arrivo a T11.
- **Libreria Media (A5):** esiste già la tabella `media` (foto POI) + bucket `poi_photos` (pubblico). Estendo, non riparto da zero. Serve un bucket generico `media` + metadati varianti.
- **Bug Messaggi (T3):** l'admin scrive bene (`support_messages`, `sender='admin'`, user_id giusto; 3 messaggi in DB, 0 letti). La RLS lato utente PERMETTE la lettura (`user_id = auth.uid()`). La webapp HA la casella dentro ILLI•AI con realtime, badge, toast; `support_messages` È nella pubblicazione realtime. **A lettura statica il flusso è corretto end-to-end**: nessun guasto evidente. Piano: costruire "genera messaggio di prova" + test reale; probabile causa era invio a un user_id diverso da quello controllato. Da confermare col test.

## Tracker avanzamento

Legenda: ⬜ da fare · 🔨 in corso · ✅ fatto e verificato · ⏸️ in attesa di dato/founder

### Fase 0 — Fondamenta
- ✅ A6 Tema a 6 palette (calda/neutra/fredda × chiaro/scuro) + 2 fix visivi (topbar Dashboard padding, contatore Tag leggibile). LIVE su admin.poilove.com. File: `admin/css/palette.css` (definizione unica), `admin/js/theme.js` (controller), selettore a 3 pastiglie in barra. Verificato dal vivo con harness (6 combinazioni). Bonifica: nav attiva ora segue la palette (color-mix su --gold/--red); il rosso brand resta costante (elimina/banna restano rossi).
- ✅ Scaffolding moduli JS avviato (`admin/css/`, `admin/js/` creati sul repo e sul server)
- ✅ A1 Scheda POI ricca COME L'APP: `admin/css/poi-card.css` + `admin/js/poi-card.js` (foto strip, fascia rossa titolo+tag, indirizzo+coordinate+mappa, descrizione, cuori, autore) + azioni admin (Modifica ricco, Pubblica, Rimuovi) + badge/assegnazione. **I POI ora si cliccano** in Dashboard e lista POI → apre la scheda. **Verificato DAL VIVO sul pannello reale** (Chrome loggato del founder). Da fare: modalità "crea" (oggi apre l'editor esistente per la modifica); rifinire lo stile del blocco badge sul fondo chiaro.
- ✅ A2 Scheda Utente ricca COME L'APP: `admin/js/user-card.js` (copertina, avatar, nome/@handle, badge stato+livello, statistiche reali, bio, LISTA luoghi creati con foto+cuori cliccabili → scheda POI, azioni admin). **I profili si cliccano** in Utenti e Dashboard. **Verificato DAL VIVO**: profilo con 9 luoghi creati reali. Da espandere: segnalazioni dell'utente, conversazioni supporto, IP (Parte D8).
- **NB accesso live SBLOCCATO:** via Claude-in-Chrome sul Chrome loggato del founder → d'ora in poi ogni pezzo si verifica sul pannello reale. Fix chiave: `window.sb` esposto (era const, i moduli non lo vedevano).
- ✅ A3 Badge = **SISTEMA PERSONALIZZABILE come le Categorie** (mig 074): sezione admin "Badge" per creare/modificare/eliminare badge (nome, icona Phosphor, colore sfondo, colore testo/icona, livello utente, anteprima live); nei pannelli il selettore mostra i badge come chip colorati da scegliere (blocco CHIARO). Verificato dal vivo. Da fare: mostrare i badge personalizzati anche nell'app/webapp (oggi Ufficiale/Indispensabile si vedono via i booleani sincronizzati); montare il selettore anche in rotte/itinerari/compagnie/Crea.
  Storico A3 base: **COMPLETO e verificato.** Lato DB: mig 073 (colonne `badge_official/essential/tier` + `assigned_user_id` su pois/trips/companions; RPC `admin_set_badge_and_owner` gate is_active_admin + audit; anon→permesso negato). Lato UI: modulo riusabile `admin/js/badge-picker.js` (toggle Ufficiale/Indispensabile, select livello, ricerca-assegna utente) caricato in panel.html; verificato dal vivo con harness — produce ESATTAMENTE gli argomenti RPC corretti. Resta solo da **montarlo dentro gli editor** (si fa in A1/T7/T8, non è un lavoro a sé).
- ⬜ A4 Elaboratore immagini + A5 Libreria media

### Fase 1 — Correzioni alto impatto
- ⬜ T3 bug Messaggi (test + fix se confermato)
- ⬜ T1 Dashboard (click-through + blocco consumi server)
- ⬜ T10 Tag + T9 Categorie (3 colonne + fix visivi)
- ⬜ T2 Moderazione (stato vuoto + test end-to-end)

### Fase 2 — Creazione e contenuti
- ⬜ T7 Quattro pulsantoni Crea (POI/Itinerario/Percorso/Compagnia)
- ⬜ T8 POI (badge in editor + colonna/filtro)
- ⬜ T4 Utenti (scheda A2)

### Fase 3 — Intelligenza e media
- ⬜ T5 Pannello motori AI + tier
- ⬜ T6 Copilota intervento diretto (tool-calling ristretto)
- ⬜ T11 Knowledge (PDF/pgvector, multilingua, notizie, immagini)
- ⬜ T12 Media (editor drag-and-drop, OpenGraph, deep-link, pixel, SMTP, guide)

### Fase 4 — Rifiniture
- ⬜ T13/A7 Impostazioni personali, biometria/passkey, pulizia, documentazione

## Domande ancora aperte (fase 3, non urgenti)
Nessuna bloccante. I default sopra coprono embedding/dominio/retention; li riconfermo col founder quando arrivo alle rispettive fasi.
