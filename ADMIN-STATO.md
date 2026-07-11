# Stato del Pannello Admin — POI•LOVE

> Fotografia reale al **11/07/2026**, ricavata leggendo il codice di `admin/panel.html` (4060 righe) e `admin/index.html`, e **verificata contro il database live**: tutte le tabelle e tutte le funzioni (RPC) che il pannello usa **esistono davvero** su Supabase.
> URL: **https://admin.poilove.com/** (login `index.html`, pannello `panel.html`).
>
> **In una riga:** il pannello NON è finto e NON è vuoto di codice. Ha 15 sezioni, tutte collegate a tabelle e funzioni reali. Quello che manca è: (a) qualche rifinitura che avevi chiesto (palette calda/neutra/fredda, form "Crea" ricco come l'app, mini-guide AI), (b) dati dentro le sezioni (es. rotte pubblicate = poche), e soprattutto (c) l'accesso col secondo fattore, che se non è completato fa sembrare che "non funzioni niente".

---

## 1. Come si entra (ed è qui il primo motivo del "non funziona")

Il pannello è blindato. All'apertura di `panel.html` controlla, in quest'ordine:

1. C'è una sessione Supabase valida? (login Google) altrimenti torna al login.
2. Il profilo ha `is_admin = true` e `moderation_status = 'active'`? altrimenti ti butta fuori e fa logout.
3. **La sessione è salita al secondo fattore (MFA "aal2")?** Cioè: hai inserito il codice dell'authenticator (TOTP) o la biometria in questa sessione? Se NO, ti rimanda al login per completare l'MFA.

**Conseguenza pratica:** se entri col solo Google ma non completi il secondo fattore, il pannello ti sbatte fuori e sembra rotto. Non è rotto: è la sicurezza che chiede il secondo fattore. È il punto da verificare per primo quando "non funziona".

| Cosa serve per entrare | Stato |
|---|---|
| Login Google (`index.html`) | ✅ reale |
| Ruolo admin sul tuo profilo (`is_admin`) | ✅ tu sei admin |
| Secondo fattore TOTP (authenticator) | ✅ attivo e obbligatorio, va inserito ogni sessione |
| Biometria (passkey WebAuthn) | 🟡 codice pronto, ma l'abilitazione lato Supabase aveva dato errore 422 (da riprovare quando serve) |

---

## 2. La barra laterale: 15 sezioni

Dashboard · Moderazione · Messaggi · Utenti · Limiti AI · Copilota · Crea · POI · Rotte · Itinerari · Categorie · Tag · Knowledge · Media · Audit.

Ognuna, quando la apri, chiama una funzione che legge/scrive dati veri. Nessuna è un mockup.

---

## 3. Cosa fa ogni sezione e con cosa "parla"

Legenda stato: ✅ completo e reale · 🟡 funziona ma essenziale (da arricchire) · 🔴 manca (da fare) · ⚠️ dipende da un'azione tua

### Dashboard
- **Cosa fa:** 4 numeri chiave (utenti totali, POI totali, segnalazioni aperte, nuovi utenti negli ultimi 7 giorni) + ultimi 6 POI + ultimi 6 utenti + allarme richieste di proprietà POI.
- **Parla con:** `profiles`, `pois`, `reports`, `poi_ownership_requests`.
- **Stato:** ✅ reale. I numeri sono conteggi veri dal DB, non inventati.

### Moderazione
- **Cosa fa:** elenco segnalazioni aperte con azioni (in revisione / risolvi / archivia; per gli utenti: sospendi 7 giorni / banna). In cima, le richieste di "proprietà POI" (chi chiede un luogo, chi lo cede, codice embed da copiare).
- **Parla con:** `reports`, RPC `admin_set_user_status`, RPC `decide_poi_ownership`, `poi_ownership_requests`.
- **Stato:** ✅ reale. Il ban/sospensione passa da una funzione sicura server-side (mai toccando `is_admin` dal browser). Se vuoto, è perché non ci sono segnalazioni.

### Messaggi (chat team ↔ utente)
- **Cosa fa:** lista conversazioni di supporto con badge dei non letti, apri conversazione, rispondi, segna letto, avvia una nuova chat cercando un utente.
- **Parla con:** RPC `admin_support_threads`, `admin_list_support`, `admin_send_support_message`, `admin_mark_support_read`.
- **Stato:** ✅ reale end-to-end.

### Utenti
- **Cosa fa:** ricerca utenti, per ognuno: livello (tier) con menu a tendina, stato (attivo/sospeso/bannato), azioni (messaggia, sospendi, banna, riattiva).
- **Parla con:** `profiles`, RPC `admin_set_user_tier`, RPC `admin_set_user_status`.
- **Stato:** ✅ reale. Il cambio tier e lo stato passano da funzioni sicure.

### Limiti AI (+ motore di ILLI)
- **Cosa fa:** (1) tabella limiti per tier (messaggi/giorno, token massimi, modello) modificabile e salvabile; (2) scelta del **motore di ILLI**: provider (OpenAI o Anthropic) + modello, con l'indicazione se la chiave è configurata (senza mai mostrarne il valore).
- **Parla con:** `gamification_config` (chiavi `ai_limits_per_tier` e `illi_engine`), edge `illi-chat` (per lo stato chiavi).
- **Stato:** ✅ reale e multi-provider. 🟡 Manca la "mini-guida + link ufficiale per creare la chiave" per ciascun provider (quella l'hai chiesta, per ora c'è solo il selettore).

### Copilota AI
- **Cosa fa:** chat amministrativa che legge le statistiche, suggerisce moderazioni, e soprattutto **propone** contenuti (nuovo POI / rotta storica / progetto). Le proposte appaiono come schede con Approva / Rifiuta / Dettagli. Approvando, crea le bozze in transazione. La chat viene **ricordata** (persiste).
- **Parla con:** edge `admin-ai` (gate admin + tetto di spesa), tabella `ai_proposals`, RPC `apply_ai_proposal`, tabella `ai_chats`.
- **Stato:** ✅ reale. L'AI non scrive mai da sola nel DB: propone, tu approvi.

### Crea (POI e percorsi a mano)
- **Cosa fa:** form per creare un POI ufficiale (nome, descrizione, categoria, visibilità, coordinate con "usa la mia posizione") e per creare una rotta storica con tappe (ricerca luogo tipo Google via OpenStreetMap + descrizione tappa generabile con AI).
- **Parla con:** `pois`, `trips`, `trip_stops`, Photon/Nominatim (ricerca luoghi), edge `admin-ai` (descrizioni tappe).
- **Stato:** 🟡 **funziona ma è più povero dell'app.** Il form "Crea POI" qui NON ha: foto/upload, EXIF dalla foto, indirizzo con geocodifica, tag. Tu li avevi chiesti ("Crea come l'app"). Curiosamente ci sono già tutti nell'editor di **modifica** POI (vedi sotto): vanno portati anche nel "Crea".

### POI
- **Cosa fa:** elenco POI con miniatura, categoria(e), stato (bozza/pubblicato/ufficiale/AI/rimosso), filtri (tutti/AI/ufficiali/bozze/rimossi), ricerca. Per ognuno: **Vedi**, **Modifica** (editor ricco), **Pubblica**, **Rimuovi** (soft-delete), e per i rimossi Ripristina / Elimina definitivo.
- **Editor Modifica (ricco):** striscia foto con rimuovi + "rendi principale" + aggiungi da URL/upload + lightbox, fino a 3 categorie a chip, tag, indirizzo con geocodifica nei due sensi, coordinate.
- **Parla con:** `pois`, `poi_categories`, RPC `admin_soft_delete_poi`, `admin_restore_poi`.
- **Stato:** ✅ reale e completo. Questo è il pezzo più ricco del pannello.

### Rotte (storiche)
- **Cosa fa:** gestione rotte storiche: pubblica/ritira, badge **Ufficiale** e **Indispensabile**, badge **Più votato** (dai salvataggi reali), editor tappe (trascina, foto, descrizione, AI), modo linea/strada, modifica (nome/badge/descrizione/copertina), duplica, elimina. In cima: suggerimenti di rotta e POI proposti come tappa.
- **Parla con:** `trips` (`is_historic=true`), `trip_stops`, RPC `trip_save_counts`, `route_suggestions`, RPC `admin_route_from_suggestion`, `admin_dismiss_route_suggestion`, `admin_clear_poi_route_proposal`.
- **Stato:** ✅ reale e ricca. ⚠️ **Sembra vuota perché nel DB ci sono pochissime (o zero) rotte pubblicate.** Gli strumenti ci sono tutti: manca il contenuto (le rotte vere vanno create).

### Itinerari (viaggi degli utenti)
- **Cosa fa:** elenco itinerari pubblici/privati degli utenti, con autore, tappe, visibilità, "in evidenza", e "Rendi ufficiale" (trasforma un itinerario proposto in rotta ufficiale bozza, accreditando l'autore). Editor tappe, elimina.
- **Parla con:** `trips` (non storici), `trip_stops`.
- **Stato:** ✅ reale.

### Categorie
- **Cosa fa:** (1) crea/modifica categorie ufficiali (chiave, famiglia, etichette IT/SQ/EN, icona, colore, ordine); (2) approva/rifiuta le **categorie personalizzate** proposte dagli utenti, con barra "usi verso 20" (a 20 diventa pubblica da sola).
- **Parla con:** `poi_categories`, RPC `admin_list_custom_categories`, `admin_approve_category`, `admin_reject_category`.
- **Stato:** ✅ reale.

### Tag
- **Cosa fa:** curatela dei tag: elenco con numero di usi, metti in evidenza / blocca / rinomina (fonde) / elimina.
- **Parla con:** RPC `admin_list_tags`, `admin_curate_tag`, `admin_rename_tag`, `admin_delete_tag`.
- **Stato:** ✅ reale.

### Knowledge (cervello di ILLI)
- **Cosa fa:** base di conoscenza che alimenta l'AI ILLI: titolo, parole chiave, contenuto, lingua, attivo/spento. Crea/modifica/elimina.
- **Parla con:** `illi_knowledge`.
- **Stato:** ✅ reale.

### Media (Zona Media, aggiunta 11/07)
- **Cosa fa:** 4 schede. **Email:** mittente + template (invio/automatiche/invito) + "Prova". **OpenGraph:** anteprime dei link condivisi. **Deep-link:** short-link tracciati con conteggio clic. **Pixel:** ID dei social con mini-manuale e link ufficiali.
- **Parla con:** `email_templates`, `media_settings`, edge `send-email`, `og_templates`, `deep_links`, `social_pixels`.
- **Stato:** ✅ reale. ⚠️ Due cose spettano a te: l'invio email vero parte solo quando metti la chiave AcumbaMail nei segreti Supabase (finché manca, dice onestamente "motore non configurato"); i pixel si attivano quando inserisci gli ID.

### Audit
- **Cosa fa:** registro delle ultime 50 azioni amministrative (quando, chi, azione, bersaglio).
- **Parla con:** `admin_audit_log`.
- **Stato:** ✅ reale.

---

## 4. Riepilogo: cosa è reale (la maggior parte)

- **Backend completo e verificato:** tutte le 19 tabelle e le 22 funzioni che il pannello usa esistono nel database live. Non manca nessuna migrazione.
- **Sicurezza vera:** ogni azione delicata (ban, tier, moderazione, applicazione proposte AI) passa da funzioni server-side protette; il pannello richiede il secondo fattore; niente `innerHTML` grezzo (niente XSS).
- **Sezioni ricche già pronte:** editor POI, gestione rotte con badge e tappe, copilota che propone e tu approvi, categorie/tag/knowledge, Zona Media.

## 5. Perché a volte SEMBRA rotto (ma non lo è)

1. **Secondo fattore non completato** → ti rimanda al login. È la causa n.1.
2. **Sezione vuota** → non c'è ancora contenuto (es. rotte pubblicate = poche, segnalazioni = zero). Gli strumenti ci sono, mancano i dati.
3. **"Nessuna riga aggiornata" su un'azione** → è la sicurezza (RLS) che ha rifiutato: succede se la sessione non è più admin-aal2 o se provi a toccare un dato non tuo. Va riletto come "permesso negato", non come bug.

## 6. Cosa manca DAVVERO o è da migliorare (onesto)

| # | Cosa | Priorità | Nota |
|---|---|---|---|
| 1 | **Palette calda/neutra/fredda** oltre a chiaro/scuro | 🔴 da fare | Oggi c'è solo l'interruttore chiaro/scuro. La scelta a 3 famiglie di colore che avevi chiesto non c'è. |
| 2 | **"Crea" ricco come l'app** (foto/upload, EXIF dalla foto, indirizzo con geocodifica, tag) | 🔴 da fare | Tutti questi campi ESISTONO già nell'editor di *modifica* POI: vanno riusati nel form *Crea*. |
| 3 | **Mini-guida + link ufficiali per le chiavi AI** (per ogni provider) | 🟡 parziale | Il selettore provider/modello c'è; manca la guida "dove prendere la chiave" come quella dei Pixel. |
| 4 | **Contenuti reali nelle Rotte** | ⚠️ tuo/nostro | Il pannello è pronto; vanno create e pubblicate le prime rotte storiche vere. |
| 5 | **Invio email + Pixel accesi** | ⚠️ tuo | Chiave AcumbaMail nei segreti + ID pixel + SPF/DKIM. |
| 6 | **Biometria (passkey)** in login | 🟡 da riabilitare | Codice pronto, l'abilitazione lato Supabase aveva dato 422. |
| 7 | **Rifinitura estetica/UX** | 🟡 soggettiva | Se "non ti piace" a livello di look, va definito insieme cosa cambiare (spaziature, tipografia, densità desktop). |

## 7. In sintesi

Il pannello admin è **reale e per la gran parte funzionante**, con un backend completo e verificato. La sensazione di "non funziona / mancano parti" nasce soprattutto da: il secondo fattore da completare per entrare, alcune sezioni ancora senza dati, e tre rifiniture che avevi chiesto e non sono ancora state fatte (palette a 3 famiglie, form "Crea" ricco come l'app, mini-guide AI). Nessuna di queste è un lavoro grande: sono aggiunte mirate sopra una base solida.

*Documento generato dallo stato del codice e del database al 11/07/2026. Aggiornare quando si chiudono i punti della sezione 6.*
