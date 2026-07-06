# SAL — Stato Avanzamento Lavori · POI•LOVE

> **Prossima ripresa: teaser misterioso di condivisione POI (zona + immagine + invito a registrarsi), poi avanti col contratto. Collaudi manuali di Alessandro in attesa (checklist 04/07 + claim a pagamento + copilota foto).**
> Checkpoint sessione: `57984f5`, tag `checkpoint-2026-07-04` (HEAD su origin/main). **Nessun lavoro non committato.**

## Sessione 06/07/2026 — Ricerca avanzata, lente nera, teaser condivisione (v2.14 → v2.49)

- **ILLI grounding RIFATTO: trova posti VERI nella città giusta (webapp v2.49 + edge place-enrich v12 discover)**. Il founder ha mostrato ILLI rotto: chiede "sushi vicino Valona" e ILLI risponde "non trovo... a Zugliano" (città GPS sbagliata, nessun posto reale). Diagnosi: (1) la scoperta posti usava SOLO OpenStreetMap, vuoto in Albania, mentre Google (place-enrich) trova tutto; Google serviva solo ad arricchire, mai a scoprire. (2) "Vicino Valona" non veniva riconosciuto (regex città solo "a/in/verso/per"). (3) "Valona" geocodificato senza bias finiva in **Belgio**. (4) la città chiesta non veniva ricordata nei follow-up → riappariva Zugliano. (5) il prompt bloccava su Zugliano ("MAI altre città"). Fix completo:
  - **Scoperta Google**: `_googleNearbyPlaces` (nearby, come la lente) + nuova modalità **discover** in place-enrich v12 (searchText mirato per cucine specifiche tipo sushi/kebab, cache 7gg). `_fetchRealPlaces` ora fonde OSM + POI•LOVE + Google; per una cucina specifica usa discover filtrato per distanza, e se davvero non c'è nulla ripiega su ristoranti generici ("sushi dedicati non ne trovo a X, ma questi ristoranti sì").
  - **Riconoscimento città**: regex ampliato (vicino, presso, zona di, nei pressi di, dalle parti di, dintorni di) + **bias geografico Italia+Balcani** (viewbox) così Valona→Vlorë Albania, Berat/Durazzo/Saranda corretti, non più Belgio.
  - **Memoria città** per i follow-up + `_looksLikeFollowUp` ampliato (tira fuori, cerca, dai, mostra, segnala...) → "tiramelo fuori tu" ora ri-cerca a Valona, non a Zugliano.
  - **Prompt** ammorbidito: usa la città chiesta, si fida del blocco GROUNDING.
  - Collaudo live reale: "sushi a Tirana" → Watami ⭐4.8, Sakura Sushi Bar, SushiCo (sushi veri); "sushi vicino Valona" → UMAMI Sushi Restaurant Vlore ⭐4.9, Valis Japanese Gastrobar ⭐4.7 (città giusta!); Berat/Durazzo geocodati bene. Zero errori JS. Deployato (webapp v2.49, edge place-enrich v12).

- **Segnalazioni di rotte storiche dagli utenti + credito pubblico (mig 045 + webapp v2.48 + panel)**. Richiesta founder: gli utenti segnalano rotte storiche → popup di ringraziamento → l'amministrazione valuta, sceglie le immagini giuste e la descrizione attinente, pubblica con "Ringraziamento a: Nome" linkato al profilo. Implementato tutto:
  - Backend (mig 045): tabella `route_suggestions` (RLS: l'utente crea/vede le sue, l'admin tutte); colonne `trips.description` (contenuto editabile) e `trips.suggested_by` (credito, scrivibile SOLO via RPC così nessuno si autoaccredita); 3 RPC SECURITY DEFINER — `submit_route_suggestion` (login obbligatorio, anti-spam max 5 in attesa), `admin_route_from_suggestion` (crea rotta bozza col credito già attaccato, marca la segnalazione published), `admin_dismiss_route_suggestion`.
  - Webapp (v2.48): bottone "Segnala una rotta storica" nell'area Rotte, form (nome/zona/descrizione) → RPC → **popup di ringraziamento** ("Grazie di cuore! Se la pubblichiamo apparirà col tuo nome linkato al profilo"). Nel rendering delle rotte: riga "Ringraziamento a: [Nome]" cliccabile che apre il profilo REALE del segnalatore (`openProfileByUsername` → `openUserProfile`). Tutto in 3 lingue.
  - Admin: nuova sezione "Segnalazioni dalla community" in Rotte (lista in attesa con nome segnalatore, "Crea rotta"/"Scarta"); il modal di modifica rotta ora ha **descrizione + immagine di copertina** (l'admin trova l'immagine giusta e scrive la descrizione attinente); ogni rotta mostra il credito 🙏 nella lista admin.
  - Collaudo e2e reale con utente usa-e-getta (poi eliminato): utente segnala via RPC REST → admin crea la rotta (credito attaccato) → join pubblico mostra il credito col username del segnalatore → segnalazione marcata published+linkata. Popup ringraziamento verificato in preview, zero errori JS. Deployato (webapp v2.48, panel md5 match).

- **Motore ILLI multi-provider, scelto dal pannello admin (mig 044 + edge illi-chat v5 + panel)**. Richiesta founder: "il motore illi lo si fa dal pannello admin". Prima illi-chat era OpenAI hardcoded (gpt-4o-mini). Ora legge la config `gamification_config.illi_engine` ({provider, model}) e instrada a OpenAI o Anthropic; la risposta Anthropic è normalizzata alla shape OpenAI, così il client non cambia. Le CHIAVI restano nei segreti Deno.env (OPENAI_KEY, ANTHROPIC_KEY): il pannello sceglie SOLO provider+modello, mai la chiave (regola di ferro). Fail-safe: se il provider scelto non ha la chiave, ripiega su OpenAI. Nuova modalità admin-only `engine_status` (403 per i non-admin) che dice al pannello quali chiavi sono configurate senza esporle. Pannello: card "Motore di ILLI" nella sezione Limiti AI (provider+modello, stato chiavi, nota che Anthropic va abilitato coi segreti Supabase), 3 lingue. Collaudo e2e reale con utente usa-e-getta (poi eliminato): OpenAI risponde (zero regressione), engine_status respinge i non-admin, admin vede {openai:true, anthropic:false}, e con motore=anthropic senza chiave la chat ripiega su OpenAI e funziona. Default resta OpenAI gpt-4o-mini. **Per Alessandro**: per accendere Claude, imposta ANTHROPIC_KEY nei segreti Supabase (Edge Functions), poi scegli Anthropic nel pannello.

- **Cache Google Places sulla lente (mig 043 + edge place-enrich v11)**. La modalità NEARBY (la lente, il vero costo Google) ora passa da una cache condivisa: utenti diversi che guardano la STESSA zona ricevono un'unica risposta, si taglia drasticamente la spesa API al lancio. Tabella `places_cache` (chiave: coordinate ~110m + raggio bucket 100m + lingua, TTL 7 giorni perché rating/tipo sono stabili), accessibile solo dal service_role (RLS on, nessuna policy → invisibile a anon/authenticated; l'edge bypassa). Design FAIL-OPEN tassativo: se la cache è giù o in errore, l'edge chiama Google esattamente come prima, la lente non si rompe MAI. La modalità TEXT (arricchimento singolo posto) resta LIVE, non cachata, perché include openNow che scade a ore. Deployato io via Management API (v11, verify_jwt=false preservato per gli ospiti). Collaudo live reale: Tirana e Trieste restituiscono 20 POI veri (Piazza Skënderbeg, L'Antica Pizzeria da Michele), 2a chiamata identica byte-per-byte = HIT con zero chiamate Google, TEXT mode ancora vivo (rating 4.5, openNow true), bad_request gestito. 2 righe in cache dopo il test.

- **Verifica avversariale finale (workflow 6 agenti, Opus) + v2.47**. Rivisti in parallelo 4 fronti toccati oggi: coerenza trilingue tassonomia+SOS, integrità admin (tag+soft-delete), pipeline immagini, sicurezza RPC nuove (041/042). Le dimensioni i18n-tassonomia e rpc-security: PULITE, zero problemi (conferma che la tassonomia è pienamente trilingue e le 6 RPC sono SECURITY DEFINER + is_admin gate + REVOKE/GRANT corretti). Trovati e CORRETTI 2 bug minori reali (verificati avversarialmente): (1) chiave i18n `pf_removed` mancante nel blocco albanese del pannello → un admin SQ vedeva l'ultima voce del filtro POI in italiano; aggiunta traduzione SQ. (2) `compressToDataURL`: un throw dentro `img.onload` (es. getContext null) lasciava la Promise appesa e non revocava l'objectURL; ora il corpo di onload è in try/catch che revoca e risolve ''. Collaudato in preview: caso normale comprime in WebP, caso degradato risolve '' invece di appendere. Entrambi deployati e verificati live (webapp v2.47, admin md5 identico, pf_removed SQ live).

- **v2.46 ottimizzazione immagini + soft-delete POI admin (mig 042)**.
  - **Immagini ottimizzate** (lamentela founder "le immagini non sono ottimizzate"). Trovato il vero problema: avatar, sfondi profilo e copertine itinerario venivano salvati come data-URL base64 PIENO (una foto da 5 MB → ~6.7 MB di stringa in profiles.avatar_url/cover_url, ritrascinata a ogni join autore/muro sostenitori). Le foto dei POI erano già compresse (compressToWebP 1200px); avatar/sfondi/copertine no. Aggiunto helper `compressToDataURL` (canvas → WebP, lato max configurabile) e instradati: avatar 384px q0.85, sfondi 1280px q0.82, copertine itinerario 1280px q0.82. Collaudo reale in preview: PNG 3.2 MB → avatar WebP 13 KB (247x più leggero), sfondo WebP 35 KB (92x). Verificato: nessun avatar/cover base64 esistente in DB da ripulire (tutti URL), la compressione vale da qui in avanti. Zero errori JS, deployato (v2.46 live).
  - **Soft-delete POI reversibile nell admin** (regola di ferro "niente si cancella"). Il delete admin era HARD (irreversibile). Le RLS di pois sono 4 policy SELECT permissive (rischio alto a toccarle): scelto un approccio SENZA modifica RLS. Mig 042: colonne removed_at/removed_by/removed_reason/prev_visibility/prev_is_public + 2 RPC SECURITY DEFINER gate is_admin — `admin_soft_delete_poi` (salva stato, mette private+non-public+non-approvato → le policy esistenti lo nascondono ai non-proprietari, audita) e `admin_restore_poi` (ripristina lo stato esatto di prima). UI admin: filtro "Rimossi (nascosti)", i rimossi esclusi dalla vista normale, bottoni Rimuovi (soft, con motivo)/Ripristina; "Elimina per sempre" (hard) resta solo sui già-rimossi. Collaudo e2e reale (JWT admin + rollback): soft-delete nasconde e salva prev (community→private), restore riporta identico, gate respinge i non-admin, dati reali intatti. Deployato (panel md5 identico).

- **v2.45 numeri SOS ufficiali + admin gestione TAG + coerenza trilingue tassonomia**. Tre direttive del founder chiuse e live.
  - **Numeri di emergenza VERI nella scheda SOS** (v2.45): blocco toccabile con 112 unico (Europa/Albania/Italia/internazionale, tel: diretto), Albania 129 polizia / 127 ambulanza / 128 pompieri, Italia 118 / 115 / 113, internazionale 112 GSM / 911 USA-Canada / 999 UK, nota "112 funziona da qualsiasi cellulare anche senza credito o SIM". Tutto in 3 lingue (it/sq/en). Verificato nel DOM live: titolo giusto, 10 link tel: presenti, zero errori JS. Deployato (md5 identico, footer v2.45).
  - **Coerenza trilingue tassonomia — VERIFICATA**. Categorie/sottocategorie UFFICIALI già pienamente trilingui (poi_categories.label_it/sq/en + _catLabel + gruppi + famiglie agganciati a `lang`). L autopromozione a 20 richieste (mig 039/040) popola sempre le 3 label (non-null) e mette la sottocategoria nella famiglia giusta, official=false così l admin la rifinisce. I tag restano liberi/mono-parola per scelta del founder. Nessuna modifica necessaria: era già a posto.
  - **Admin = cuore: gestione TAG** (mig 041 + nuova sezione "Tag" nel pannello). Backend: tabella `curated_tags` (featured/blocked) + 4 RPC SECURITY DEFINER gate is_admin — `admin_list_tags` (elenco community con conteggi + stato), `admin_rename_tag` (rinomina/unisce su tutti i POI con dedup), `admin_delete_tag` (rimuove da tutti i POI), `admin_curate_tag` (evidenzia/blocca). `suggest_tags` aggiornata: include gli evidenziati, esclude i bloccati. UI admin: lista tag con ×conteggio, filtro, azioni Rinomina/Evidenzia/Blocca/Elimina, form evidenzia-tag, tutto in it/sq/en. Collaudo e2e reale (JWT admin simulato + rollback): gate respinge i non-admin, admin vede i tag veri (monumenti/piazza/tirana), rename fa il dedup, blocco fa sparire il tag dai suggerimenti, dati reali intatti dopo rollback. Deployato (panel md5 identico).
  - **AI auto-compilazione RIMOSSA dal pannello POI** (v2.43, "togli l ai che compila"): tolti i bottoni nome-AI e descrizione-AI, disattivato l auto-suggerimento nome. Resta dettatura (microfono) + scrittura manuale; ILLI chat resta e funziona. Corretti anche (v2.40-2.42) i punti dello screenshot: chiavi tier grezze tradotte, bottone crea compagni, foto che restava tra un POI e l altro (reset), copertina itinerario caricabile.

- **Verifica finale end-to-end (workflow 7 agenti) + v2.36-2.38**. v2.36-2.37: coppa VERDE entro 60s, MEDAGLIA "Complimenti" con messaggio caldo oltre 60s (non piu coppa). Verifica finale: verdetto PRONTO CON NOTE, ZERO bloccanti, sicurezza pulita al 100% (edge protette, RLS su 28 tabelle, colonne pois/trips scrivibili solo via RPC, nessuna chiave nel client, 14 RPC client-server coerenti). Sweep live: 4 URL 200, tutte le RPC/tabelle presenti, 6 tier nei limiti AI. Unico bug funzionale trovato e CORRETTO (v2.38): i chip-filtro CATEGORIA cercavano l etichetta sottocategoria ma la riga aveva solo il macro, davano "Nessun risultato"; ora l etichetta e nel testo cercabile. Collaudato (chip "Pizzeria" trova "Da Mario"). +2 note cosmetiche chiuse. TUTTO live (v2.38).

- **v2.35 QR business (perk Professionista+) — CLUSTER TIER COMPLETO**: nel dettaglio di un proprio POI, il professionista trova "QR business" che apre un QR stampabile (blu, punta a poilove.com/?poi=id) con nome del posto e download ad alta risoluzione. Collaudato in browser (bottone visibile al pro proprietario, modale, QR col poi id, download). Con questo TUTTI i 7 vantaggi tier sono reali e live: limiti ILLI per tier, spunta verifica, punti x2, POI in evidenza (tetto), Muro dei Sostenitori, itinerario in evidenza, adotta rotta, QR business. Live (v2.35).

- **v2.34 adotta una rotta (perk Professionista+)**: un professionista sostiene una rotta storica pubblica con una dedica visibile (mig 038: adopt_route/release_route RPC definer, colonne adopted_by/dedication protette). Nella lista rotte compare "Adottata da @utente: <dedica>" e un bottone Adotta/Rilascia per i tier idonei; la dedica appare anche nel popup della rotta sulla mappa. Collaudo e2e: pro adotta con dedica, join adottante ok, un altro pro non puo rubarla (already adopted), rilascio ok; TROVATO E CORRETTO un baco NULL (v_tier NULL not in (...) e NULL, non true: un free passava il controllo) con is null or not in. Live (v2.34). Resta 1 solo perk tier: QR business.

- **v2.33 itinerario in evidenza (perk Mecenate/Plus)**: stesso schema sicuro dei POI in evidenza (mig 037): colonna trips.is_featured protetta (revoca UPDATE + grant colonne, scrive solo la RPC), set_trip_featured con tetto per tier (Mecenate/Plus 1), badge "In evidenza" sulle card e toggle stella per i tier idonei. Aggiunte anche colonne adopted_by + dedication (pronte per "adotta una rotta"). Collaudo e2e: edit trip ok, is_featured diretto 403, RPC mecenate ok; in browser badge e toggle funzionanti. Live (v2.33). Restano 2 perk tier: adotta rotta, QR business.

- **Audit backend completo (workflow 22 agenti) + hardening (mig 034/035, v2.32)**. Verifica live: RLS su tutte le 28 tabelle, tutte le RPC SECURITY DEFINER col search_path, edge sane (illi-chat/admin-ai 401, place-enrich Google reale), flussi business collaudati (cessione POI, richiesta proprieta con embed_code, love, featured, tier, punti). L audit del codice ha trovato 12 problemi; distinti i veri dai falsi (i finding "official/enum" nascono da database/schema.sql VECCHIO: il DB vivo ha visibility text con official valido, i POI ufficiali funzionano). CORRETTI i veri: (1) colonne sensibili di pois (is_featured, love_count, is_approved, author_id) erano scrivibili in diretta dal client bypassando i perk e i controlli: ora revocate a livello colonna, si toccano SOLO via RPC/trigger definer (trigger love reso definer per continuare a funzionare); collaudato: edit normale ok, is_featured/love_count diretti 403, RPC featured/love ok. (2) tier nuovi professionista_plus/influencer ricadevano sui limiti AI free: aggiunti in config. (3) referral: un iscrizione confermava TUTTE le referral pendenti del referrer: ora ne conferma una sola. (4) category_requests: insert diretto anonimo illimitato tolto, solo via RPC. (5) place-enrich era un proxy Google aperto (chiunque con la anon key bruciava quota): aggiunto gate auth utente nell edge + client manda il token; Scoperto che bloccare gli ospiti svuotava la lente (la riserva OSM/Overpass e flaky): soluzione migliore e allineata al founder = rate limit PER IP (mig 036, rl_hit 150/ora) invece dell auth, cosi la lente resta piena di POI Google per TUTTI ma nessuno brucia la quota. **Deployato LIVE da me via Management API (place-enrich v10)**: niente comando per Alessandro. Verificato: ospite ottiene 20 POI Google, il limitatore conta per IP. Webapp v2.32 live.

- **v2.31 filtri POI + compliance tappa**: chip filtro (categorie + tag) nella lista POI, tocco e vedo solo quelli, combinati con la ricerca. Tolta la tendina dal nome della tappa itinerario (regola tendine-solo-sull-indirizzo). Collaudo e2e ok. Live (v2.31).

- **v2.30 Muro dei Sostenitori**: vetrina pubblica di chi ha un tier di sostegno, raggruppata per livello (Mecenate, Professionista Plus, Professionista, Influencer, Sostenitore) con le card nello stile del tier (avatar, nome, badge). Si apre dal popup livelli ("Vedi il Muro dei Sostenitori") con CTA "Unisciti a loro". Parte vuota finche non ci sono sostenitori; collaudato in browser assegnando 2 tier reali (Mecenate viola + Sostenitore blu, raggruppati giusti), poi tier rimessi a null. Live (v2.30).

- **Sprint pre-14/07 (nuova deadline: tutto perfetto per il 14 luglio) — cluster tier/featured + BACO GAMIFICATION**. v2.29: POI "in evidenza" (perk tier) con RPC set_poi_featured a tetto server-side (Sostenitore/Pro 3, Mecenate/Plus/Influencer 5, free 0), badge nel dettaglio e accento sul marker; 3 bandierine di stato (Ufficiale, In evidenza, Suggerito per autori Plus/Influencer/Mecenate); punti x2 per i tier che lo promettono (mig 032). Collaudo e2e reale: tetto rispettato (3 ok, 4° bloccato, slot liberato riapre), x2 verificato (professionista 20 pt vs free 10 su stesso POI). **BACO GROSSO trovato e risolto (mig 033)**: il trigger protect_gamification_columns azzerava OGNI aumento di punti fatto da award_points (perche arriva con un JWT) e annullava pure il cambio tier dell RPC admin (reset di special_tier non condizionato ad admin_op). Risultato: point_events accumulava (225 pt su 22 eventi) ma profiles.points restava a 0 per TUTTI, badge e livelli morti, e il pannello tier non attecchiva. Fix: punti modificabili solo con app.points_op='1' (impostato da award_points), tier solo con app.admin_op='1' (RPC admin); ricostruiti i totali dai point_events. Verificato che ora i punti salgono davvero via app. Deployato e live (v2.29).

- **Testi legali allineati alla realta (privacy + termini)**. Audit multi-agente (4 agenti: inventario reale dal codice, estrazione claim dai due doc, riconciliazione DPO) che ha confrontato i documenti (datati 27/06) con quello che l app fa DAVVERO al 06/07. Verdetto: ben scritti ma disallineati, non pubblicabili cosi. Gap piu grave: il media server media.poilove.com (processore foto esterno) del tutto assente dai destinatari, e una lista fornitori dichiarata "completa" che ometteva qrserver (che riceve lo username), ui-avatars, pollinations, tile ESRI/CDN/font, deep-link mappe; OAuth incompleti (mancavano Facebook e Apple); tier obsoleti (mancavano Professionista Plus e Influencer); novita non coperte (tag community, category_requests con user_id, cessione/reclamo POI, knowledge base ILLI). Applicati 12 edit chirurgici (7 privacy, 5 termini), data portata a 06/07/2026, deployati e verificati live (md5 identici, rendering confermato: 36 righe di tabella, 6 nuove righe fornitori, nuove sezioni presenti). Restano i nodi che solo un legale puo sciogliere (elencati in CONTRATTO): consenso lente pre-login verso Google, contratti SCC/DPF di trasferimento extra-UE, ruolo formale del media server, nomina DPO e rappresentante in Albania, dati di terzi. La nota "Bozza da validare" resta in testa ai documenti, correttamente.
- **NOTA per Alessandro**: i testi legali sono ancora SOLO in italiano (con nota che saranno in 3 lingue). La traduzione professionale SQ/EN conviene farla DOPO la validazione legale, cosi si traduce la versione definitiva una volta sola.

- **v2.28 knowledge base ILLI**. Tabella illi_knowledge (mig 031): voci curate dall admin (titolo, parole chiave, contenuto, lingua opzionale, attiva); RLS lettura pubblica delle attive + scrittura admin. Pannello admin: nuova sezione "Knowledge ILLI" con form (titolo, parole chiave, contenuto, lingua, attiva) e lista con modifica/elimina. Client (v2.28): la KB si carica al boot; quando la domanda a ILLI contiene una parola chiave di una voce attiva, la voce viene iniettata nel grounding come CONOSCENZE VERIFICATE (whitelist di fatti veri, prima dei luoghi OSM). Cosi ILLI sa cose che l AI generica non conosce, senza inventare. Collaudo e2e: inserita "Bunk Art 2" (parole chiave bunkart/bunker), la domanda "cosa mi dici del bunker a Tirana" fa match e inietta il fatto, "dove mangio una pizza" no. Voce di test eliminata. Webapp e panel deployati e verificati live (md5 identici, v2.28).

- **Fase finale, cluster tier+badge (pannello + v2.27)**. Trovato e corretto un baco DB: c erano DUE vincoli CHECK su special_tier in conflitto, l intersezione ammetteva solo sostenitore/mecenate, quindi impostare "professionista" falliva (mig 029: un unico vincolo con 5 tier). Nuova RPC sicura admin_set_user_tier (solo admin aal2, passa l anti-tamper, audita; mig 030): collaudata (non-admin respinto "not authorized", vincolo accetta i 5 tier e blocca gli inventati). Pannello admin: nella sezione Utenti il tier ora e un menu a tendina che cambia il livello all istante. Webapp v2.27: due nuovi tier renderizzati (Professionista Plus verde-teal, Influencer rosa-magenta) con badge, pitch e perk trilingui; badge UFFICIALE sui POI (sigillo oro nel dettaglio con la sottocategoria nell etichetta, e marker sulla mappa con anello oro + sigillo). Collaudato in browser (tier mostrati, POI ufficiale con sigillo e marker oro). Tutto deployato e verificato live (panel md5 identico, webapp v2.27).

- **Review code-quality (v2.22-2.25) + pannello categorie admin + v2.26 fix**. La revisione ha dato PRONTO CON RISERVE: 1 BLOCKER (XSS reale) + 3 MAJOR. BLOCKER: i suggerimenti tag e il selettore categorie costruivano i bottoni con onclick STRINGATO interpolando dati utente; le entity HTML nell attributo onclick vengono decodificate dal browser prima del JS, quindi un tag salvato come `x'"'"');codice;('"'"'` eseguiva codice arbitrario verso un altro utente. Riscritti entrambi con createElement + addEventListener + dataset (niente onclick stringato): collaudato con un tag malevolo, ZERO esecuzione, nessun onclick nel markup, il tag entra come testo puro. MAJOR corretti: window._pendingOpened azzerato a ogni ciclo auth (un secondo login nella stessa sessione non blocca piu l apertura del profilo/POI condiviso); commento obsoleto di sharePoiByKey; em dash tolto dal testo di condivisione. NIT enum verificato (benessere e lavoro esistono davvero). **Pannello admin: nuova sezione "Categorie"** (curation della tassonomia): triage delle richieste della community raggruppate per termine con conteggio, "Promuovi" che precompila il form categoria, creazione/modifica con macro+3 lingue+icona+colore+ordine, accensione/spegnimento categorie; scrive su poi_categories (mig 028: policy DELETE admin su category_requests). Panel deployato e verificato live. Webapp v2.26 live (md5 identico).

- **v2.25 condivisione proprietaria**: prima ogni condivisione apriva il menu di sistema del telefono (navigator.share) in 9 punti sparsi, con comportamento diverso e fuori dal brand. Ora c e UN solo foglio POI•LOVE: sezione "Community POI•LOVE" (Follower/Amici, visibile solo per i POI) e "Manda il link" (WhatsApp, Telegram, Email, Facebook, X, Copia via web intent, che l utente completa). Instradati TUTTI i 9 punti (dettaglio POI, lista, itinerario landing, luogo personale, lente, ILLI place card, contatto preciso dalla mappa, disambig). Tolto del tutto navigator.share (verificato: 0 occorrenze nel sorgente e nel live) e il bottone "Altro..." di sistema. Collaudo in browser: foglio unico apre da piu punti, community nascosta per le liste e visibile per i POI, WhatsApp genera l intent corretto senza menu di sistema. Live verificato (md5 identico, v2.25).

- **v2.24 tassonomia POI a 3 livelli (data-driven)**. L1 CATEGORIA ora e un set RICCO e curato: 29 sottocategorie trilingui (Ristorante, Pizzeria, Bar/Caffe, Hotel, B&B, Museo, Parco, Spiaggia, Negozio, Benessere/Spa, Locale/Notte...) in una TABELLA (poi_categories, mig 026), non piu array hardcoded: si aggiornano senza toccare il codice. Nel form il finto "0/3 categorie" e sostituito da un selettore a scelta SINGOLA, raggruppato in 6 famiglie con icone e colori. La categoria macro (enum) resta stabile; la sottocategoria fine va nella nuova colonna pois.subcategory. L3 TAG: la colonna tags[] esisteva ma non veniva MAI salvata, ora si salva davvero, con AUTOCOMPLETE dai tag gia usati dalla community (RPC suggest_tags) e niente duplicati; i tag entrano nella ricerca (lista POI e mappa). Autoaggiornamento data-driven: "Altra categoria" e le richieste lasciano una traccia in category_requests (RPC log_category_request, anche da ospite) che l admin analizzera per promuoverle. **Collaudo end-to-end VERO** con utente usa-e-getta: picker con 6 gruppi e 29 voci, Pizzeria selezionata, tag preso dall autocomplete (storico) + tag manuale, POI salvato e riletto a DB con category=cibo, subcategory=pizzeria, tags=[romantico,storico,forno a legna]; richiesta "spiaggia per cani" registrata. Utente e dati eliminati. Live verificato (md5 identico, v2.24). Resta la UI admin per curare le categorie proposte.

- **v2.23 review avversariale del giorno: 16 difetti confermati, tutti corretti**. Squadra di 24 agenti (4 revisori + verifica scettica di ogni finding, 4 confutati). Il piu grave: il fix del love atomico era agganciato a una funzione MORTA, il bottone vero usava ancora il vecchio percorso, e sui POI degli altri il contatore non si salvava affatto (bloccato in silenzio dalle RLS): ora il bottone vivo chiama la RPC e il collaudo incrociato vero (utente B che lovva il POI di A dal bottone) da 0 a 1 a 0 anche a DB. Gli altri: XSS da attributo nelle miniature liste (escape completo), love possibile ai bannati via SECURITY DEFINER (mig 025: blocco is_active + search_path blindato), policy anti-bannati mai arrivate su poi_lists (il loop della 012 puntava alla tabella inesistente), selezione liste azzerata dal refresh token col form aperto, pending POI cancellato entrando da ospite (funnel rotto) e CTA morta in guest mode, riordino liste con salvataggi sovrapposti (ora in coda), pending senza scadenza (ora 7 giorni) e doppio modal possibile, query teaser che scaricava comunque nome e coordinate (ora select minimale), tagline e tooltip non tradotti, 2 funzioni morte rimosse. Tutto deployato e verificato live (md5 identico, v2.23).

- **v2.22 box foto fluidi**: i 3 riquadri foto del form Crea POI erano fissi a 350px (enormi, sbordavano dalla spalla con uno scroll orizzontale scomodo). Ora sono un terzo della larghezza del pannello ciascuno, quadrati, e si adattano da soli al ridimensionamento. Misurato dal vivo: spalla 626px, box 184px; telefono 375px, box 105px; mai overflow.

- **v2.21 love atomico + 2 difetti audit trovati e corretti**: il toggle love faceva 4 query separate (due tocchi simultanei perdevano love) e usava una chiamata RPC malformata. Ora un unica RPC transazionale `toggle_love` (mig 023): il contatore e sempre il conteggio vero, solo utenti loggati (anonimo respinto 42501, verificato). Collaudando ho trovato: 1) ogni love scriveva una riga di audit perche love_count era tra i campi sensibili (rumore infinito), 2) eliminare un utente con anche una sola riga di audit era IMPOSSIBILE (admin_id NOT NULL + FK SET NULL). Mig 024 corregge entrambi. Test REST reali con utente usa e getta: love on 1, love off 0, anonimo respinto. Live verificato (md5 identico, v2.21).

- **v2.20 POI dentro le liste (e bug grosso trovato)**: la webapp interrogava la tabella `list_pois` che NON è mai esistita (quella vera si chiama `poi_lists`): per questo i conteggi delle liste erano sempre a zero e nessun POI si poteva collegare. Corretto il nome ovunque. Ora il dettaglio lista mostra i POI VERI (miniatura, nome, indirizzo), con: aggiunta dal picker dei propri POI, riordino con le frecce (persistito a DB, migrazione 022 con la policy UPDATE che mancava), rimozione, e tocco che apre il POI sulla mappa. I chip "Aggiungi a una lista" nel form di creazione ora salvano davvero il collegamento. Bonificati 3 duplicati di chiavi di traduzione. **Collaudo end-to-end VERO** con utente usa-e-getta: 2 POI + 1 lista creati, aggiunti dal picker (conteggio 0→1→2), riordino persistito dopo ricarica dal DB, rimozione (2→1), tocco che apre la scheda, conteggio card allineato, chip con id nel form. Utente e dati di prova eliminati. Live verificato (md5 identico, v2.20 nei footer).

- **v2.19 landing personale del profilo**: chi apre `poilove.com?@nome` (o /@nome) da sloggato non vede piu il login nudo: vede la vetrina della persona a tutto schermo (copertina scelta come sfondo, avatar, nome, @handle, bio, numeri veri di POI pubblici e love, bottone "Entra in POI•LOVE" nelle 3 lingue). Dopo il login il profilo si apre da solo (handle in localStorage, regge il giro OAuth); da ospite pure, perche il profilo pubblico e visibile anche senza account. Collaudato in browser: vetrina con 5 POI e 1 love, CTA che scopre il login, ingresso ospite che apre il profilo giusto. Live verificato (md5 identico, v2.19 nei footer).

- **v2.18 menu e lente su richiesta**: "Segna un luogo" rinominato "Crea POI" e messo al primo posto del menu +, Lente di ingrandimento al secondo, nelle 3 lingue. Tolto il long-press sulla mappa che apriva la lente da sola dopo 300ms: ora la lente si apre SOLO quando la chiedi (menu + o "Tocca mappa" nella creazione POI). Verificato in browser: long-press simulato non la apre, dal menu si apre. Live verificato (md5 identico, v2.18 nei footer).

- **v2.17 teaser condivisione POI**: chi apre un link `?poi=<id>` da sloggato non vede più solo il login: vede una card misteriosa sopra (foto del posto SFOCATA con lucchetto, categoria e zona senza via né civico, conteggio love, bottone "Registrati e scoprilo" nelle 3 lingue). Il nome e il punto esatto restano nascosti. L id resta in localStorage: dopo il login il POI si apre da solo, anche se la registrazione passa dal giro OAuth che perde i parametri URL. Da ospite il gate resta (niente auto-rivelazione). **Collaudo end-to-end VERO**: utente usa-e-getta creato, login in pagina, POI "Opa" aperto da solo con teaser chiuso e chiave pulita; utente eliminato. Live verificato (md5 identico, v2.17 nei footer). Commit di questo giro.

- **v2.14**: menu "+" riordinato con la Lente di ingrandimento al primo posto, lente e mappa precaricate all'avvio con zoom medio-largo (14); frecce della ghiera incise a 3 passate con punta grande.
- **v2.15**: ricerca con correzione avanzata: normalizzazione accenti/ç/ë, tolleranza refusi fino a 2 lettere (fuzzy+Levenshtein), "Forse cercavi" istantaneo su un dizionario di luoghi albanesi, Albania sempre prima nei risultati (Nominatim countrycodes=al prima del resto), rotte storiche cercabili. Commit `9f82b3a`.
- **v2.16**: "Sono qui: crea POI" rimosso dal menu "+" (il POI si crea dalla lente con "Salva il POI"); lente NERA al posto del grigio che non si vedeva: ghiera, mirino e campana in nero quasi pieno, faccette della zigrinatura chiare sul nero, frecce orario/antiorario e segni +/− BIANCHI nitidi come le marcature degli obiettivi fotografici. Verificata in browser (screenshot ok) e live (md5 identico, versione nei footer). Commit `2d65e85`.

## Sessione 04/07/2026 — Review avversariale completa: 51 fix confermati, TUTTO deployato e verificato live

Review multi-agente su tutto il sistema AI e creazione POI (6 revisori paralleli + verifica avversariale di ogni finding: 51 confermati, 1 confutato). Tutti corretti, deployati, verificati dal vivo. Commit `34d797c` (pannello+edge+migrazioni) e `57984f5` (webapp), tag `checkpoint-2026-07-04`.

- **Sicurezza chiave OpenAI**: la vecchia chiave esposta in `poilove.com/config.js` era GIA MORTA (verificato live: OpenAI risponde 401; quasi certamente revocata dallo scanner anti-leak di OpenAI, da cui il "ha smesso di funzionare dopo 3 centesimi"). File svuotato sul server (ack di Alessandro) e verificato. La chiave viva (`sk-...xW0A`) sta SOLO nei secrets Supabase: non serve ruotarla, non serve toccarla.
- **Edge `illi-chat` blindata e deployata**: auth JWT obbligatoria (verificato live: 401 senza login), limiti giornalieri per tier applicati (RPC `increment_ai_usage` + config `ai_limits_per_tier`), status HTTP veri (fine dei 200 finti mascherati da "Nessuna risposta."), storia sanitizzata (il campo `places` rompeva OpenAI dal 2° turno), timeout 20s.
- **Webapp (22 fix, deployata)**: EXIF ora compila campi VISIBILI (la causa del "non prende i dati" era il pannello display:none); stato posizione `currentLocLatLng` (stop alle coordinate finte di Tirana o ereditate dal POI precedente; salvataggio bloccato senza posizione reale); toast onesti per foto senza GPS e da fotocamera in-app; fallback CDN exifr; `aiSummarize` usa i dati reali del posto e non cancella MAI gli appunti dell'utente; auto-suggerimento nome+categoria appena c'è la posizione; ILLI con token di sessione su tutte le chiamate (`_aiAuthHeaders`), errori 401/429 tradotti e mai salvati in storia, grounding ereditato solo sui follow-up, geocoding della città nominata nella domanda, timeout allineati; rimossi config.js/_groqKey dal client.
- **Edge `admin-ai` (10 fix, deployata)**: loop non muore più su finish_reason; regex intento con boundary veri; sintesi finale a MAX_ROUNDS; descrizione (>=40 char) e coordinate OBBLIGATORIE nel validatore delle proposte; retry provider con backoff; fallback senza proposte duplicate; tetto spesa fail-closed; parità proattiva Anthropic.
- **Pannello admin (10 fix, deployato)**: sezione "POI creati" LIVE (vedi/modifica/pubblica/elimina + filtri AI/ufficiali/bozze); storico chat copilota persistente; `title` al posto di `name` in createPoi (prima la creazione manuale falliva SEMPRE); categorie form allineate all'enum reale (prima erano inglesi, insert impossibile); visibility `official`; rilevamento falso successo RLS; proposte pending recuperabili al reload.
- **DB**: migrazioni **015** (ai_chats + policy admin su pois) e **016** (apply_ai_proposal robusta: tetti caratteri, coordinate obbligatorie, risoluzione link sicura, audit title; trigger updated_at; ai_daily_usage + RPC testata; audit modifiche sensibili POI) **APPLICATE e verificate con query**.
- **Nota di processo (ultimatum)**: la frustrazione nasceva dal pannello nuovo MAI deployato dalla sessione precedente, interrotta a metà giro. Regola permanente (memoria `regole-di-ferro`): ogni modifica chiude il giro scrivi→valida→deploya→verifica live, e gli stati a metà si dichiarano SEMPRE qui.
- **Limite onesto**: il percorso autenticato (ILLI da utente loggato, copilota con MFA) non è collaudabile da terminale: serve il collaudo di Alessandro (checklist consegnata in chat).
- **Collaudo totale automatico (stesso 04/07, commit `f078167`)**: superficie live tutta 200 (webapp, admin, panel, privacy, terms, project) con live=repo bit per bit; CORS preflight OK su entrambe le edge; DB sano (RLS ovunque tranne la tabella di sistema PostGIS, 4 RPC, 3 trigger, zero proposte bloccate, zero POI monchi). **Test end-to-end VERO con utente usa-e-getta**: signup → login → ILLI risponde (200) → contatore segna 1 → limite forzato a 10 → 429 daily_limit → non-admin respinto da admin-ai (403) → utente distrutto e pulizia verificata. Webapp avviata in browser reale: zero errori console, guard posizione verificato dal vivo ("Imposta prima la posizione"), ILLI da sloggato mostra "Accedi per usare ILLI". Bonus: eliminati i 16 trattini lunghi dalle stringhe visibili (regola del founder), rideployata e verificata.
- **Secondo giro qualità (code-quality, stesso 04/07, commit `a7ba1f8`)**: verdetto PRONTO CON RISERVE → riserve chiuse e rideployate tutte: check aal2 dell'edge copilota reso FAIL-CLOSED (prima un errore di parsing del JWT faceva passare senza secondo fattore), quota ILLI rimborsata se OpenAI fallisce (mig 017 `decrement_ai_usage`, applicata e testata), categoria delle proposte normalizzata sui 12 valori enum (la card mostra ciò che finisce davvero a DB), rimosso dal pannello il percorso morto `createRouteFromAi` che poteva scavalcare la coda approvazioni. Un finding del revisore (off-by-one sul limite giornaliero) verificato e SMENTITO: il limite è esatto, aggiunto commento anti-equivoco. Verifiche live: entrambe le edge 401 senza token, pannello live senza bypass.

- **Titolo intelligente del luogo + versione 2.00 (stesso 04/07, commit `7deb621`, LIVE)**: nella creazione POI la riga blu e il pannello posizione non mostrano piu la via ma il POSTO vero: nuova `_smartPlaceTitle` (OSM doppio raggio: 80m locale preciso, 400m grande struttura tipo aeroporto/mall/stazione/museo), titolo composto "Locale · Struttura" o "Interno Struttura", trilingue. Verificata in browser sul caso reale del founder (lounge aeroporto Tirana): "Lahuta · Tirana International Airport Nënë Tereza". Versione app ufficiale v2.00 visibile nel footer del login e nella brand strip (costante APP_VERSION, unica fonte).


## Sessione 05/07/2026 (mattina) — Titoli in lingua, stop tendina sul nome, CONTRATTO.md

Feedback di Alessandro dal collaudo live (aeroporto di Tirana). Commit `33bb50f`, tutto deployato e verificato.

- **Titoli nella lingua dell'app**: il titolo intelligente ora sceglie name:it / name:sq / name:en da OSM in base alla lingua, e tra i candidati vince chi HA il nome tradotto. Verificato in browser: "Lahuta · Aeroporto Internazionale di Tirana Madre Teresa" (prima usciva in inglese).
- **Tendina sul campo NOME rimossa (deprecata per regola del founder)**: le scelte a tendina esistono SOLO sull'indirizzo (ricerca manuale). Era la causa dei suggerimenti folli dal Kosovo: il prefill "Lahuta" riapriva la ricerca Nominatim globale. onNameInput ridotta a validazione, markup e handler eliminati.
- **suggestPoiName** ora propone il titolo contestuale intelligente come prima scelta (non piu la prima parola secca), nomi vicini solo come ripiego; categoria sempre dal tipo OSM.
- **Mini-mappa del punto POI (commit successivo, LIVE)**: nello sheet "Salva questo posto", tra i riferimenti del luogo e le foto, mappa interattiva larga tutta (180px mobile / 230px desktop), pallino rosso brand, pinch-zoom e trascinamento; appare quando c'e una posizione reale, si nasconde su nuovo POI, segue anche il flusso modifica. Verificata in browser (tile+marker+show/hide).
- **Mini-mappa strumento attivo (LIVE)**: si apre SUBITO nello sheet anche senza posizione, centrata sul GPS o sul centro mappa; mirino al centro, bottone "Fissa il punto" in alto a destra che geocodifica il centro e compila tutti i riferimenti (verificato in browser: Skanderbeg → coordinate+indirizzo+marker). Versione v2.00 anche nel footer nero della mappa. 3 lingue.
- **LENTE ESPLORATORE, v2.04 (LIVE)**: dentro il cerchio ora c'e una vista IBRIDA a colori (stradale sotto + satellite Esri sopra al 40% di trasparenza + etichette nitide, via il filtro grigio); i PUNTI DI INTERESSE REALI compaiono dentro la lente (OSM raggio adattivo allo zoom, pallini colorati per tipo + etichette per gli 8 piu vicini + cuoricini POI•LOVE); NUOVO GESTO: sfiorando il bordo tondo in senso orario lo zoom si rafforza, antiorario si allontana fino a livello mondo (~5 livelli a giro completo, badge di feedback); il titolo della lente usa il titolo intelligente; "Tocca mappa" ora APRE LA LENTE sul punto e il bottone diventa "Usa questo punto": conferma la posizione nel form gia aperto SENZA toccare i campi scritti. Bug trovato al collaudo e corretto: una risposta Overpass fallita veniva messa in cache e la lente restava vuota. Verificato in browser: 3 strati, zoom anello 4-19, 9 punti reali con 8 etichette su Skanderbeg, screenshot.
- **Correzione di ricerca avanzata + contesto Albania, v2.15 (LIVE)**: motore fuzzy locale (accenti ignorati, refusi fino a 2 lettere per parola, prefissi, parole estranee respinte) su POI propri e ROTTE STORICHE (ora cercabili dalla barra); Nominatim con chiamata dedicata all'ALBANIA in testa + mondo in coda (dedup); "Forse cercavi" ISTANTANEO da gazetteer albanese (citta', Blloku, Skanderbej...) prima di qualsiasi AI. Verificato in browser: tirna->Tirana, blloko->Blloku, "tirana storca" trova la rotta.
- **Frecce INCISE davvero, v2.14 (LIVE)**: via l'effetto adesivo nero appoggiato: incisione a 3 passate (ombra sul bordo alto del solco, filo di luce sul bordo basso, fondo quasi nero ben visibile) su frecce, punte e segni +/-. Verificata con screenshot.
- **Lente nel menu +, precaricata, v2.13 (LIVE)**: prima voce del menu + e' ora "Lente di ingrandimento" (icona viola), "Sono qui: crea POI" scala al secondo posto; la lente si apre sulla posizione con zoom MEDIO-LARGO gia' impostato (14: la ghiera ha strada in entrambe le direzioni) e viene PRECARICATA al boot (istanza + tile scaldate con overlay invisibile): la prima apertura e' istantanea. Verificato in browser: istanza viva prima dell'apertura, ordine menu, zoom 14 esatto.
- **Rotte Storiche vive, v2.12 (LIVE, mig 021 applicata)**: le rotte pubblicate sono PUBBLICHE (verificato da anonimo via REST) e l'admin le governa tutte; seminata la prima rotta VERA "Tirana Storica" (5 tappe reali: Skanderbeg, Et'hem Bej, Torre dell'Orologio, Bunk'Art 2, Kalaja); webapp: via la polyline demo, le rotte vere si disegnano sulla mappa (linea viola + tappe numerate) e compaiono nel tab Itinerari>Rotte con "Vedi sulla mappa" (il "presto disponibili" sparisce da solo); pannello: sezione Rotte Storiche completa (crea bozza, pubblica/nascondi, tappe con aggiungi/elimina, rinomina, elimina). Bug trovato al collaudo browser e corretto: il caricamento rotte era chiuso dietro il login, ora parte per tutti al boot.
- **Foto libere dei luoghi (Wikimedia), v2.11 (LIVE, mig 020 applicata)**: per i luoghi noti il form propone LA foto rappresentativa dell'articolo Wikipedia (coerente e a licenza libera): chip con anteprima + "Usa", se accettata diventa la principale; nel dettaglio ogni foto Wikimedia porta il credito "CC · Wikimedia" che linka la pagina Commons (attribuzione); il copilota admin allega la foto da solo alle proposte e l'approvazione la salva nel POI (mig 020). Verificato in browser: Skanderbeg trova la foto vera di Commons, chip funziona, credito presente, derivazione pagina corretta anche dalle thumb. Limite onesto: il giro copilota+approvazione con foto lo collauda Alessandro (MFA).
- **Claim proprieta' POI a pagamento, v2.10 (LIVE, mig 019 applicata)**: "Reclama questo luogo" sul dettaglio dei POI altrui (utenti loggati); solo i TIER PAGANTI passano (il free riceve il messaggio onesto e gli si aprono i livelli, upsell gentile); pratica con codice PLB-XXXX-XXXX; ALLARME in admin (Moderazione) con codice embed iframe copiabile, nome richiedente, nome cedente, messaggio, Approva-e-trasferisci/Rifiuta via RPC; badge sidebar somma segnalazioni+richieste. BONUS: sistemato il CHECK obsoleto su special_tier che RIFIUTAVA 'professionista' (ora 4 tier ammessi, incluso professionista_plus futuro). Collaudo end-to-end reale: free respinto, pagante ok (PLB-Q6U5-E3YS), doppione respinto, non-admin respinto; gating browser su anonimo/proprietario/non-proprietario tutto verde. Limite onesto: l'approvazione dall'admin la collauda Alessandro (serve MFA).
- **Frecce piene + zoom istantaneo, v2.09 (LIVE)**: frecce piu spesse quasi nere con PUNTE GRANDI (prima quasi assenti); lo zoom dell'anello ora risponde ai primi gradi (passo 0.25, sensibilita ~9 livelli/giro, fascia tocco piu larga, vibrazione al passo dove supportata). Verificato in browser: 12 gradi antiorari muovono gia lo zoom (19 -> 18.75), quarto di giro = 2.5 livelli.
- **Ghiera raffinata con frecce incise, v2.08 (LIVE)**: zigrinatura piu fine e realistica (144 faccette, 72 creste sottili, luce del metallo dall'alto, bordi incisi) e al posto dei segni secchi due FRECCE INCISE lungo la ghiera: oraria che finisce sul +, antioraria sul -, effetto incisione a doppia passata (scuro + filo di luce). Screenshot verificato.
- **Ghiera zigrinata stile orologio, v2.07 (LIVE)**: via tacche bianche e cerchietti (giudicati orrendi dal founder), la ghiera ora e' zigrinata come il bordo di un quadrante: 72 faccette alternate luce/ombra sul grigio brand, bordi incisi, + e - incisi discreti. Screenshot di verifica in browser.
- **Scheda pulita + il POI ha un NOME SUO, v2.06 (LIVE)**: aprendo qualunque scheda il menu del + si chiude (prima le pillole flottavano sopra la scheda, screenshot del founder); il titolo del POI si rinomina IN LOCO dal proprietario (matita nella fascia rossa, autosave, mai vuoto); la riga indirizzo non resta mai vuota (reverse geocode al volo + autosave silenzioso se proprietario); REGOLA DURA: mai la via o la citta come nome del POI, salvataggio bloccato con messaggio trilingue (verificato in browser: "Via Ca' Nova" e "Zugliano" respinti) e il suggerimento EXIF non precompila piu il campo col nome della strada.
- **Ghiera visibile + punti Google nella lente, v2.05 (LIVE)**: la ghiera dello zoom ora SI VEDE (48 tacche da obiettivo attorno al bordo, segni + e -, suggerimento trilingue al primo uso); i punti di interesse della lente arrivano da GOOGLE (place-enrich mode nearby, Places v1 searchNearby per POPOLARITA', lingua dell'app, ordinati per recensioni, chiave sempre server-side) con il voto nella etichetta (es. "Bunk'Art 2 ★4.3"), OSM resta come riserva se Google tace. Verificato live: Skanderbeg → Piazza ★4.5 (13827 rec.), Bunk'Art 2, Toptani, Castello, Moschea Et'hem Bej; in browser 20 punti, 48 tacche, screenshot.
- **POI del proprietario: modifica con AUTOSAVE + codice di migrazione, v2.03 (LIVE)**: quando il POI e' tuo, dalla scheda modifichi foto (max 3, upload WebP sul media server, mai base64 nel DB, rollback se l'upload fallisce) e descrizione (INLINE nella fascia rossa, matita + contatore 200, salvataggio automatico con verifica righe); azioni visibili solo al proprietario. Mig 018 APPLICATA e collaudata end-to-end con 2 utenti veri: generate_poi_transfer_code (solo owner/admin, PL-XXXX-XXXX, 30gg, nuovo codice revoca il vecchio) + redeem_poi_transfer_code (uso singolo, trasferisce author_id, audit): A genera, B riscatta, proprieta' passata, riuso rifiutato, ex proprietario rifiutato. UI: bottone "Cedi il POI" nella scheda + "Riscatta codice" nel profilo, 3 lingue. Scoperto e aggirato nel collaudo: profiles_username_check limita lo username a 30 caratteri (email lunghe in signup falliscono, nota per il futuro).
- **Titoli informativi + descrizioni sui FATTI, v2.02 (LIVE)**: il titolo dice cos'e il posto (etichetta tipo OSM in lingua: "Ristorante Lahuta · Aeroporto..."), con guardia anti-doppione. Motore descrizioni rifatto: _gatherPoiFacts raccoglie tag OSM ricchi (orari, cucina, costi, wifi, asporto), struttura contenitore, estratto Wikipedia (CORS origin=*) e Google (voto, recensioni, fascia prezzo, aperto ora) via place-enrich; prompt severo (cosa/costi/come funziona, lista parole vietate, niente inventato), temperatura 0.9->0.4. Verificata la pipeline in browser su Sheshi Skenderbej (Wikipedia + Google 4.5/13827 + aperto ora). Il testo finale AI va collaudato da Alessandro loggato.
- **Scheda POI: striscia foto adattiva (LIVE)**: niente piu linguette vuote nel dettaglio POI. Zero foto = fascia bassa con solo il + nel cerchio bianco in alto a destra; 1 foto = piena larghezza (16:9); 2 = 50/50; 3 = 33/33/33; il + resta finche c'e posto, cancellando una foto le altre si allargano. Verificato in browser (classi n0-n3 e flex-basis calcolati).
- **CONTRATTO.md creato**: la traccia madre chiesta da Alessandro, ogni passo per settore con stato e tempistiche, da aggiornare a ogni giro insieme a SAL e TODO.

## Sessione 28/06/2026 (sera e notte) — ILLI, Itinerari, profilo, fix vari + TODO riscritto

Sessione lunghissima, tutto deployato e verificato dal vivo. Commit fino a `ae70c35`.

- **Itinerari: Liste → Rotte Storiche**. Sub-tab Liste rimosso (le liste sono gia nei POI), al suo posto Rotte Storiche con intro tematica + badge "presto disponibili", 3 lingue SQ/IT/EN.
- **Fix AI suggerimenti POI**: il "suggerisci nome" ora legge i locali reali da OSM (`_realNamesNear`) invece di inventare dal nome della via (caso "Contra della Ceramica" → "Pizzeria Scaligera"); la descrizione AI non allucina piu. Verificato dal vivo.
- **ILLI cerca davvero**: il grounding eredita la categoria dai messaggi precedenti (`_lastPlaceCatFromHistory`), i follow-up ("E domani?") continuano a cercare posti reali; il prompt vieta lo scarica-barile e le risposte vaghe. Verificato che il contesto si eredita.
- **Profilo snellito**: fascia "Come mi vedono" piu sottile; rimosse Le mie liste, Le mie rotte storiche, I miei tag; restano Connessioni e I miei POI. Handle apre solo la modifica handle (non piu "Diffondi"); handle sempre slug pulito (minuscolo, niente %20), il nome resta come scritto; la statistica "Liste" porta ai POI/Liste.
- **Mega-ricerca nel tab POI**: ogni riga ha `data-search` con nome+categoria+indirizzo+citta+descrizione+tag; `_poiSearch` cerca li dentro. Verificato dal vivo.
- **Termini/Privacy nel footer**: pulsanti bianchi ai lati del logo nel footer nero della mappa, e a pie di pagina nella schermata di accesso.
- **TODO.md riscritto** ordinato e prioritizzato.
- **(notte fonda, in autonomia)** indirizzo POI **Albania-first** (Nominatim, risultati AL per primi); **estetica pannello admin ONLINE** (icone Phosphor ovunque + tema chiaro crema morbido/scuro con interruttore sole-luna, persistito); **copilota AI agentico PROGETTATO** (tool use nativo, proposte con approvazione umana, 5 poteri: query_data/historic_analysis/propose_poi/propose_historic_route/propose_project) + **migration `014_ai_copilot.sql` PRONTA nel repo ma NON applicata** (tabella ai_proposals, pois.is_approved/visibility 'official', trips.is_historic, RPC apply_ai_proposal; tocca pois/trips → serve OK). Design completo in scratchpad `copilota_design.md`.

**Catturate (memoria `admin-phase2-requirements`, `poi-location-and-lens`):** switch tier da admin, tier Professionista Plus, livello Influencer (badge colore nuovo); schermata POI "dove si trova" (GPS, EXIF prima foto, tocca-mappa→lente, lente che intercetta i POI da OSM/Google; TripAdvisor/Facebook senza API pubbliche).

**Prossimo grande lavoro (con Alessandro sveglio, e critico):** implementare il copilota agentico (applicare mig 014 + edge admin-ai con tool use + UI proposte nel panel).

**Design fissato (NON ancora implementato), in memoria `poi-share-and-integrations`:**
- Condivisione POI = teaser misterioso (zona + immagine AI + CTA; niente titolo/foto/indirizzo reali fino alla registrazione).
- Landing profilo personale (sfondo + avatar + "Entra in POI•LOVE"), generata per ogni profilo.
- Sistema email admin + AcumbaMail (template + webhook), primo mattone del middleware.
- SOS sanitario = progetto a se (delicato, da non improvvisare).

## Sessione 27/06/2026 — Pannello admin, MFA forte, legali aggiornati, fix AI suggerimenti POI

Giornata molto densa. Tutto deployato e verificato dal vivo. Commit chiave fino a `4ddb78b` su origin/main.

**Pannello admin (`admin.poilove.com`) costruito da zero e messo online**

- Sottodominio `admin.poilove.com` creato su Plesk: vhost, SSL Let's Encrypt, `.htaccess` no-cache. DocumentRoot `/var/www/vhosts/poilove.com/admin.poilove.com/`.
- Login (`admin/index.html`): estetica "cammino" (immagine evocativa, card glass), trilingua IT/SQ/EN, accesso con Google OAuth (nessuna password). URL `admin.poilove.com` autorizzato negli allowed-redirect Supabase.
- Database: migration `012_admin.sql` applicata. Introduce: ruolo `is_admin` sui profili, stato moderazione utenti, tabelle `reports` e `admin_audit_log`, limiti AI per tier in `gamification_config`, RLS solo-admin via funzione `is_admin()` SECURITY DEFINER, trigger anti-tamper esteso, RPC `admin_set_user_status`, funzione `is_active()` con policy RESTRICTIVE che rende il ban davvero efficace sul lato data API. Alessandro (it@altrostile.app) promosso admin.
- Proxy AI sicuro `admin-ai` (Edge Function) deployato: gate `is_admin` + `aal2`, tetto di spesa giornaliero, supporto Claude e gpt-4o, `service_role` mai esposta al client.
- Pannello `admin/panel.html` a 7 sezioni: dashboard KPI, moderazione, utenti, limiti AI, copilota Claude, crea POI/percorsi, audit log. XSS neutralizzato, gate `aal2` su tutte le chiamate privilegiate.

**MFA forte attiva e verificata dal vivo**

- Migration `013` applicata: `is_admin()` ora richiede `aal2` (secondo fattore), enforcement lato server.
- TOTP authenticator: enroll via QR nel pannello, confermato dall'utente con codice reale, verificato dal vivo.
- Biometrico WebAuthn: predisposto nel client (codice pronto), ma il dashboard Supabase ha restituito 422 all'abilitazione. Resta da abilitare quando Supabase espone correttamente l'API (azione manuale nel dashboard).

**Legali aggiornati e online**

- `poilove.com/privacy` e `poilove.com/terms` aggiornati al 27/06: aggiunti sub-responsabili del trattamento (Google Places, OpenAI, Anthropic, Supabase), sezioni moderazione, abbonamenti, trasferimenti internazionali, conformi legge AL 124/2024 e GDPR. Resta il disclaimer "bozza da validare da un legale" prima del lancio pubblico.

**Fix bug AI suggerimenti POI (deployato su poilove.com)**

- Il "suggerisci nome" non inventa più dal nome della via: ora cerca i nomi reali dei locali vicini su OpenStreetMap via `_realNamesNear` (caso "Contrà della Ceramica" che suggeriva un nome finto per una pizzeria).
- Il prompt della descrizione AI vieta esplicitamente di inventare fatti e di farsi influenzare dall'indirizzo. Verificato dal vivo: suggerisce "Pizzeria Scaligera".

**Cosa resta (prossime sessioni)**

- Admin FASE 2 (vedi TODO): icone Phosphor duotone ovunque nel pannello, tema chiaro/scuro, rotte storiche, badge elementi ufficiali, tier Professionista Plus nuovo, area knowledge base AI, pannello multi-provider AI, POI ufficiale con badge, categorie più richieste.
- Biometrico WebAuthn: da abilitare nel dashboard Supabase quando l'API lo supporta.
- Presentazione `project.poilove.com` da aggiornare con screenshot delle novità per la demo del 1/07.
- Validazione legale di Privacy e Terms con un consulente prima del lancio del 17/08.

---

## Sessione 26/06/2026 — ILLI con voti Google, sicurezza chiavi, Privacy/Terms, liste e luoghi personali

Giornata molto densa, ~19 commit, tutto deployato e pushato.

**ILLI•AI (qualità della ricerca, il cuore della demo)**
- **Voti Google reali**: Edge Function `place-enrich` (proxy a Google Places API New, chiave segreta server-side) porta voto medio, numero recensioni, fascia prezzo, stato apertura, descrizione (`editorialSummary`) e tipo in chiaro. Ordina per qualità reale. Live `3e580db`.
- **Match sbagliati filtrati** (`85c4a8a`): `_googleMismatch` scarta i match in cui Google restituisce una via (tutti i campi null, es. "Via Ca' Nova") o un'attività di tipo incoerente (gioielleria al posto della pizzeria, caso "Leon d'oro"). `_localPoiPlaces` filtra i POI•LOVE per pertinenza.
- **Filtro categoria + cucine etniche** (`8862ba8`, `4d63c91`): "voglio mangiare sushi" non cade più su "ristorante"; messicano/cinese/indiano/thai/kebab/hamburger con raggio largo (fino a 35 km); ILLI dice onestamente "il più vicino è a 8 km" invece di rifilare ristoranti a caso.
- **Box ridisegnato**: icona per tipo reale (nigiri sushi, peperoncino messicano, pizza, forchetta), voto+prezzo+distanza+stato, descrizione vera senza ripetere il voto. Output a prosa pulita (niente R1/R2, emoji, markdown, inglese misto).
- **Memoria chat persistente** (`fa806ef`): la storia conserva testo **e** risultati (le card dei posti) dopo il reload, con le azioni che puntano al posto giusto.
- **Proxy ILLI** (`c9f7fa9`): le chiamate al modello passano per la Edge Function `illi-chat`, chiave OpenAI come segreto server-side (prima pubblica in `config.js`).

**Sicurezza (era messa male)**
- Chiave Google Maps rimossa dai file e **revocata** lato Google (era nel repo pubblico). `8b62ae1`.
- `.htaccess` che blocca i file interni del repo (CLAUDE.md, sorgenti, deploy.php) dalla docroot pubblica di poilove.com. `35c8ccd`.

**Legale**
- Privacy Policy e Terms of Service **live** su `poilove.com/privacy` e `/terms` (`d9ffb36`): bozze conformi legge AL 124/2024 + GDPR, generate col caso Agi-Kons come checklist anti-violazioni. RESTANO da far validare da un consulente legale prima del lancio.

**POI e liste**
- Cassaforte: dalla lista POI un pulsante manda un POI in un luogo personale.
- Luoghi personali come **scorciatoie** (SPECS, `ff790d6`): tocco categoria → ci vai / scegli / cerchi tra i tuoi POI per assegnarne uno. Card a doppia colonna. Prima icona = "Vai verso" (navigatore); "rimuovi" chiarito (toglie solo la scorciatoia, non il POI).
- **Ricerca interna** nella lista POI (Miei/Loved/Vicini) per nome e indirizzo (`c48859f`).
- **Quarto sub-tab "Liste"** dentro POI (`e827cf1`): riusa il sistema liste esistente (crea, visibilità privata/pubblica/compagnia, condividi, elimina), con conteggio POI e ricerca.

**Limite noto da chiudere (primo punto della ripresa)**: aprendo una lista, il dettaglio non mostra ancora i POI dentro (non carica i `list_pois`).

---

## Sessione 24/06/2026 (parte 5) — Fix popup/handle + i18n completo

- **Fix z-index popup**: stacking dinamico via MutationObserver; l'ultimo overlay/sheet aperto va sempre sopra. Confirm proprietari (`_uiModal`) su contatore separato, sempre in cima. Risolve il caso "popup sotto popup".
- **Fix handle**: funzione unica `_sanitizeHandle` (spazi rimossi, niente simboli, accenti via, solo a-z0-9_-). Corretto bug: l'upsert profilo in `savePOIToDB` resettava l'handle a ogni salvataggio POI — ora insert solo se utente nuovo.
- **i18n COMPLETO delle aree principali** (~220 chiavi nuove IT/SQ/EN): Tier+Referral (48 chiavi), Compagnie+Follow (87), Itinerari+Liste (58), POI+Mappa+Profilo+Varie (32). Le stringhe erano hardcoded in italiano (`showToast`, popup, label). Restano poche varianti minori documentate (varianti POI "non trovato" con emoji, ambiente avatar ILLI•AI, tooltip "rotta ufficiale").
- Commit chiave: `bceec24` (popup+handle), `4732d7e` (i18n tier/ref), `22cb88e` (i18n compagnie/follow), `3c41109` (i18n itinerari/liste), `7b96981` (i18n POI/mappa/profilo).

---

## Sessione 24/06/2026 (parte 4) — Frontend itinerari + Follow + user_routes backend

- **Frontend itinerari agganciato a Supabase**: `saveNewTrip` fa insert su `trips`, `syncTripsFromDB` al login, `_persistTripStops` sincronizza add/delete/suspend/reorder/nota. Migrazione 007 (`trip_stops.note`) + 008 (RPC transazionale `replace_trip_stops`: BLOCKER bloccante risolto, delete+insert non atomico rischiava perdita dati, ora RPC + debounce per la race da drag). Itinerari ora persistenti end-to-end.
- **Fix loremflickr**: sostituito `source.unsplash.com` (deprecato) con `loremflickr` ovunque.
- **Follow persistente (migrazione 009)**: tabella `follows` creata (mancava, il toggle falliva in silenzio). Frontend `togglePublicFollow` era già pronto: ora il follow persiste. Nota pre-lancio: SELECT pubblica = rischio scraping grafo sociale, da rivedere prima del 17/08.
- **Rotte utente (migrazione 010)**: tabella `user_routes` creata, owner-based. Frontend rotte V2 ancora incompleto (creazione via AI non salva, aggiunta POI placeholder): nessun aggancio frontend fatto in questa sessione.
- **CLAUDE.md aggiornato**: tutte le tabelle reali documentate (companions, trips, follows, user_routes, ecc.) + RPC.
- Commit chiave: `d65a274` (frontend itinerari), `6ddb6f0` (follow), `ebd4869` (user_routes).

### Stato persistenza per modulo

| Modulo | Stato |
|---|---|
| Liste | Completa |
| Compagnie | Completa (manca presence live realtime) |
| Itinerari | Completa |
| Follow | Completa |
| Rotte utente | Backend pronto, frontend V2 da costruire |

## Sessione 24/06/2026 (parte 3) — Persistenza COMPAGNIE + ITINERARI backend + Valore tier paganti

- **Migrazione 005 applicata**: tabelle `companions` + `companion_members`, RLS con funzione SECURITY DEFINER `is_companion_member` (elimina ricorsione), RPC `join_companion`, FK `lists.companion_id`.
- **Frontend compagnie FASE A**: create/edit/delete su Supabase, `syncCompagnieFromDB` al login (merge con locali).
- **Frontend compagnie FASE B**: inviti email via `companion_members`, join da link (`?join=CODE` chiama RPC). Compagnie ora persistenti end-to-end; manca solo presence live realtime.
- **3° stato lista "compagnia"**: `lists.companion_id` persiste la lista associata a una compagnia specifica.
- **Valore reale tier paganti**: Sostenitore e Mecenate hanno perks concreti e differenziati (AI potenziata/illimitata, verifica profilo, POI in evidenza, punti x2, adotta rotta, QR business incluso), mostrati come card nella popup livelli con CTA `becomeSupporter`. Sono PROMESSE: i meccanismi vanno implementati uno a uno.
- **Migrazione 006 applicata**: tabelle `trips` + `trip_stops`, RLS owner-based, FK `lists.itinerary_id`, trigger `set_updated_at` su trips e companions. Frontend itinerari NON ancora agganciato (TRIPS resta in localStorage).
- Ogni step passato per code-quality, commit + deploy + push a ogni passo.
- Commit chiave: `409c1b1` (compagnie FASE A), `8ce7e71` (valore tier), `483cc91` (compagnie FASE B + 3° stato lista), `24503a9` (backend itinerari 006).

## Sessione 24/06/2026 (parte 2) — Persistenza LISTE su Supabase

- **Bug colonna `is_public` vs `visibility`**: il codice usava `is_public` ma lo schema `lists` ha `visibility` (enum `private`/`public`). Le liste non persistevano davvero. Corretto in `createList`, `loadMyLists`, `renderItinLists`.
- **`saveListDetail` e `deleteListDetail`**: agganciati a Supabase (update/delete con guardia `owner_id`). La delete non rimuove dal DOM se il DB fallisce: nessun disallineamento UI-DB.
- **Sicurezza XSS**: escape applicato nei nomi lista e in `_mapPopupCtx.name` negli innerHTML; ripristinato dove l'escape era inappropriato (showToast, input.value).
- **Liste hardcoded rimosse**: eliminate le 3 liste-esempio finte ("Lista libera", "Tirana Top", "Segreti").
- **Migrazione 004 applicata**: colonne `lists.companion_id` e `lists.itinerary_id` aggiunte.
- Processo: 2 round `/code-quality`, 4 BLOCKER intercettati e corretti prima del deploy.
- **CLAUDE.md aggiornato**: documentazione schema `lists` corretta (`visibility`, non `is_public`).
- Commit: `6b0ecaa` (mig 004), `deaa0e0` (persistenza liste), `4ee3dd9` (fix xss). Deployato su `httpdocs/index.html`, pushato su `origin/main`.
- **Ancora in localStorage (prossimo blocco)**: compagnie (`companions`), itinerari (`trips`), follow (`follows`), rotte utente (`user_routes`). Il campo `companion_id` su `lists` si popolerà solo quando esisterà la tabella `companions` (guardia già nel codice).

## Sessione 24/06/2026 (parte 1) — BACKEND avviato + workflow code-quality
- **Migrazione 001 gamification** applicata a Supabase e versionata in `supabase/migrations/`: tabelle `gamification_config` (punti per azione e soglie livelli, regolabili da admin), `point_events` (log azioni, anti-abuso), `referrals` (inviti). Colonne nuove su `profiles`: `points`, `special_tier`, `referred_by`.
- **RLS blindate**: trigger `protect_gamification_columns` impedisce al client di auto-assegnarsi punti/tier; scrittura punti solo server-side (service_role). Referral creabili solo a proprio nome.
- **Workflow code-quality attivato** (richiesto dal founder): la prima stesura aveva 2 BLOCKER di sicurezza RLS, scovati dall'agente e corretti prima di toccare il DB. Da ora ogni migrazione/codice importante passa da code-quality.
- **Push a ogni passaggio** ripristinato come regola (errore del giorno: 41 commit accumulati senza push; ora salvati su GitHub + tag `checkpoint-2026-06-24`).
- **Migrazione 002 accredito punti** applicata: `award_points` (atomica, anti-abuso) + trigger su pois/loves/lists (accredito automatico e verificato dal DB quando l'azione reale avviene) + trigger referral + RPC `award_share` (validazione entità reale + tetto giornaliero). 2° giro code-quality: altri 2 BLOCKER (spam share, REVOKE incompleto) corretti prima del deploy.
- **Aggancio frontend gamification FATTO**: badge e popup "I livelli" leggono i `points` reali da Supabase; il love ricarica i punti (accreditati dal trigger DB); lo share chiama la RPC `award_share`. Display badge passato da "love" a "punti" (livello = punti, formattazione compatta). 4 BLOCKER frontend corretti da code-quality in 2 round.
- Gamification ora END-TO-END per POI/love/share: azione → trigger accredita → badge mostra i punti reali.
- **GAMIFICATION COMPLETA end-to-end**: referral signup fatto (cattura `?ref`, RPC `claim_referral` sicura e atomica al login, +50 all'invitante via trigger). Migrazione 003 applicata. Tutto il backend gamification passato da code-quality: 8 BLOCKER di sicurezza corretti in 4 round (manomissione punti, spam share, REVOKE incompleti, auto-referral, race condition).
- **Prossimo blocco: PERSISTENZA** — tabelle `companions`/`trips`/`follows`/rotte-utente su Supabase (le liste `lists` e le rotte ufficiali `cultural_routes` già esistono); poi aggancio frontend (liste/itinerari/compagnie da localStorage a DB reale e sincronizzato webapp↔app). Poi: email HTML invito, liste pubbliche POI, admin desktop.

## Sessione 24/06/2026 (pomeriggio) — Fase 1 avviata: UI proprietaria
Tutto deployato live su poilove.com, verificato in preview a ogni passo.
- **Modali proprietarie** `uiPrompt`/`uiConfirm` (grafica POI•LOVE, fade, focus, Enter/Esc, variante danger rossa): sostituiti TUTTI i 13 dialoghi nativi del browser (`prompt`/`confirm`). Zero interfacce native.
- **Accesso ospite "Entra e guarda"** ri-aggiunto onesto: si naviga mappa e POI pubblici senza login e senza utente finto (`currentUser` resta null). Trilingue.
- **Popup lista ridisegnato**: due modalità (vista / modifica col pennino), nome+descrizione+visibilità a 3 stati (privata/pubblica/compagnia) inline, selettori chip "quale compagnia" e "quale itinerario" (una lista può entrare in un itinerario). X di chiusura esterna alla card, una sola penna. Tolto un residuo demo (POI a caso nel popup).
- **Tutte le icone Phosphor**: motore `emoToIcons()` converte le emoji in icone Phosphor a runtime (toast + renderer i18n); bandiere → globo Phosphor + sigla; Luoghi Personali, header, chip, badge e ~34 icone HTML/JS convertite. Zero emoji visibili nell'UI.
- Regole nuove in `SPECS.md`: UI proprietaria, X esterna al box, solo Phosphor.
- Resta (Fase 1): persistenza Supabase delle liste (oggi vivono nel profilo senza id reale), rotte modificabili (utente sì, ufficiali bloccate).

## Sessione 24/06/2026 — Fase 0: pulizia del finto COMPLETATA
Rimosso tutto il contenuto finto spacciato per reale dalla webapp (`webapp/index.html`), 8 checkpoint committati, JS valido a ogni passo, verifica preview superata (carica pulita, zero errori console, bottone demo sparito):
- Modalità demo (bottone + `enterDemoMode`) rimossa, l'app richiede login reale
- 3 utenti finti (@test.com) → stati vuoti onesti, pronti per Supabase `follows`
- Compagnie di viaggio finte → solo quelle reali
- Immagini AI (Pollinations/Flux): foto POI rimosse del tutto (slot vuoto col "+"); avatar e sfondo scollegati da Pollinations, l'opzione AI resta come "in arrivo con motore di qualità"
- Array `POIS` hardcoded (5 POI Tirana) svuotato → i POI reali vengono da Supabase
- Statistiche `Math.random()` + bio fissa nel profilo pubblico → neutre, da caricare da Supabase
- Avatar di default col nome del founder → neutro
- Testi UI che citavano "Flux" → puliti
- Itinerari (`TRIPS`) già vuoti da prima.

Restano (minori, NON finti): pulsanti "prossimamente" (onesti), dead code residuo da ripulire (`stopCoords`, `_photoPrompt`, `openUserRowProfile`).

**Deploy LIVE**: webapp pulita su poilove.com, verificata al 100% (zero demo, zero POI finti, zero @test.com, zero Pollinations, zero stats random). La verifica live ha scovato e rimosso altre 4 POI card hardcoded (sezione "I miei POI" + anteprima profilo pubblico) che il postmortem aveva mancato, più stringhe i18n demo e CSS morto. Backup del precedente in `/root/bak-httpdocs-index-20260624.html`.

## Sessione 23/06/2026

### SVOLTA: da prototipo a PRODOTTO REALE + Visione (sera 23/06)
**Postmortem** (vedi `POSTMORTEM.md`): code review completo, 8 BLOCKER + 14 MAJOR. Verdetto: la webapp era una vetrina, infrastruttura vera ma dati quasi tutti finti (utenti @test.com, POI hardcoded, statistiche `Math.random()`, modalità demo, immagini AI scadenti). **Decisione del founder: trasformarla in prodotto REALE.**

**Backend reso più reale stasera:**
- Bucket Supabase `poi_photos` creato + policy (fallback foto). Primario resta media.poilove.com (verificato sano, DNS ora risolve supabase.co).
- Catena upload foto pronta a funzionare end-to-end.

**VISIONE PRODOTTO raccolta in `SPECS.md`** (da implementare, non ancora fatta. È anche materiale di marketing/investitori):
- **Creazione POI ripensata**: menu "+", mirino/lente spostabile, tap breve (mai long-press, lasciato alla copia), timer 60s con coppa verde + media velocità nel profilo.
- **Schermata POI**: nome e descrizione con 3 vie (Suggerisci AI, Detta a voce, Scrivo io); AI che pesca il nome dal contesto geografico; foto opzionali, MAI generate da AI.
- **Sistema codice-POI**: ogni POI ha un codice di trasferimento (come l'authinfo dei domini), si può REGALARE o CEDERE un POI. Feature distintiva, nessun concorrente ce l'ha.
- **3 QR fisici = modello di business**: universale (crescita gratis), del locale (venduto, preciso con coordinate dentro il codice), POIVOICE (audio-guida).
- **Gamification**: lovvare genera PUNTI (per il luogo e per il viaggiatore); badge a livelli regolabili con nome e icona elegante; sfide stagionali e per zona annunciate dall'admin.
- **AI di qualità** (Claude Sonnet o GPT-4o) al posto di Groq scadente; limite 3 consultazioni/giorno/persona; costo stimato $45-450/mese fino a 1.000 utenti.
- **Admin desktop** (admin.poilove.com): moderazione, scelta AI, rotte ufficiali, gamification, analytics.
- **Rotte storiche** con pagina propria (ufficiali curate dall'admin + create dagli utenti).
- **Luoghi Personali** come scorciatoie intelligenti ai propri POI (ricerca, scelta multipla, aggiunta).
- **Avatar e sfondo** generabili con AI di QUALITA' (opzione), oltre a upload, colori e sfumature.

**Pulizia richiesta** (ancora da fare): via tutto il finto, love-count atomico, `prompt()` sostituiti da editing inline.

### Data di lancio pubblico FISSATA
- **17 agosto 2026 (lunedì)** — data ottimale Kairos (score 74/100). È lo stesso "Lancio Tirana" prima previsto a giugno, spostato. Allineati `CLAUDE.md`, `README.md` (IT/EN/SQ) e creato `TIMELINE.md`.

### Accessi — diagnosi completa + fix
Mappato tutto il sistema di login in `webapp/index.html` (ex `webapp/`) e verificata la config Supabase via Management API.
- **Stato reale provider** (Management API): `email`, `google`, `linkedin_oidc`, `x` attivi con credenziali; `facebook`/`apple` off. Site URL + Redirect allow-list già corretti su poilove.com.
- Fix X: il codice chiamava `provider:'twitter'` (OAuth1, spento) invece di `'x'` (OAuth2, attivo) → login X era rotto, ora riparato.
- Fix biometria: rimosso `prompt()` nativo (rotto su iOS PWA) → focus sul campo email + toast.
- Hardening: `getSession()` con fail-safe; `signOut()` pulisce i marker (privacy device condiviso).
- Facebook/Apple: bottoni mostrati come "presto" (disattivati), in attesa dei prerequisiti.
- Aggiunta i18n `auth_soon` (it/sq/en). Sintassi JS verificata, fix testati in preview.
- **Login funzionanti ora: 5** (email/magic link, Google, LinkedIn, X, biometria).

### project.poilove.com — sbloccato e live in HTTPS
Era bloccato (`domains.status=2`, "subscription suspended") perché creato il 22/06 mentre l'account Plesk era sospeso → nessun comando standard lo sbloccava (catch-22: client/customer --on, webspace-on, toggle, repair, tutti falliti). **Risolto** ricreando il sottodominio pulito: backup → `subdomain --remove` → `--create` (rinato `status=0`) → ripristino file dal backup + `chown` → SSL Let's Encrypt. Ora **project.poilove.com è live in HTTPS** con la presentazione marketing (cert valido fino al 21/09/2026). Causa+fix salvati in memoria (`plesk_subdomain_stuck_status2`).

### Pagina marketing (`web/index.html`) — rimossa la parola "demo"
- Bottone hero "Apri la Demo" → "Apri POI•LOVE"; link aggiornato a `https://poilove.com`.
- Meta aggiornata a "poilove.com"; sub-testo "Apri la demo" → "Apri l'app".
- Da deployare su project.poilove.com (path nuovo, richiede ok deploy).

### Date allineate
- **Finestra presentazioni — Tirana: 13-17 luglio 2026** (nuova milestone in `TIMELINE.md`).
- Lancio pubblico confermato **17 agosto 2026**; corretta la tappa nella timeline marketing da "Lug 2026" → "Ago 2026".

## Sessione 21/06/2026

### Fatto
- X (Twitter) OAuth attivato su Supabase
- LinkedIn (OIDC) OAuth attivato su Supabase
- Code review completo: trovati 6 BLOCKER + 8 MAJOR (vedi TODO.md sezione bug)
- Fix: marker Leaflet duplicati ad ogni login OAuth
- Fix: deep-link `name` → `name:title` (link condivisione POI erano rotti)
- Fix: query deep-link aggiunto `.limit(500)`
- Fix: `toggleLoveDB` — `sb.rpc()` usato erroneamente come valore, ora legge count reale dal DB
- Fix: GPS watcher leak in `startLocShare` — `locShareWatchId` salvato e pulito
- Feature: bottone "Sono qui — crea POI" nel FAB menu (GPS → form precompilato)
- Feature: AI descrizione POI migliorata con coordinate, categorie, prompt unicità
- Bottone AI rinominato "Suggerisci"
- Decisione: passare direttamente a poilove.com ufficiale, eliminare demo quando pronti

### Sessione 22/06/2026 — migrazione live

- project.poilove.com creato su Plesk con pagina marketing
- Webapp portata live su poilove.com
- Groq key rimossa dal sorgente HTML — spostata in config.js server-only (gitignore)
- Supabase: Site URL → poilove.com, Redirect URLs aggiornati via Management API
- Vecchio sotto-dominio temporaneo dismesso (tutto su poilove.com)
- URL hardcoded aggiornati a poilove.com nel codice
- Ricerca mappa migliorata: luoghi + vie separate, icone per tipo, correzione spelling AI
- Deploy autonomo abilitato via rsync file singolo

### Data di lancio app mobile (Kairos — Framework Esoterico Integrato)

Analisi condotta con il calcolatore Kairos (kairos/calcolatore-data-favorevole.html) applicando il framework a 6 livelli sul nome "POI LOVE".

**Calcolo Destiny caldeo**: P(8)+O(7)+I(1)+L(3)+O(7)+V(6)+E(5) = **37** → base **1** (Leadership Solare, Compound 37 "Buona Sorte negli Affetti")

**Vincolo critico luglio 2026**: Mercurio retrogrado 29/06-23/07, shadow ±5gg → penalità -60 su tutti i giorni 1-28 luglio. Solo i giorni 29-31 luglio sono liberi. Ulteriore problema: la Luna Piena cade il ~29 luglio (-30) colpendo anche gli ultimi giorni del mese.

**Data suggerita per luglio — 29 luglio 2026 (mercoledì)**
- Primo giorno post-shadow Mercurio
- Universal Day = 28→1 = Destiny (risonanza piena +25)
- Compound giorno 29 = "Prove e Tradimenti" (avverso, -25): i due si bilanciano
- Luna: gibbosa crescente giorno ~14 (neutro, non ancora piena)
- Raggio: Mercurio/R4 +4 | Ora Venere disponibile alle 6:00 +8
- **Score framework: +12 (accettabile, non eccellente)**

**Data ottimale assoluta — 17 agosto 2026 (lunedì)** *(se si vuole posticipare al mese successivo)*
- Luna nuova giorno 3 (+25) — massima apertura per la semina
- Universal Day = 26→8, complementare a Destiny 1 (+12)
- Compound 17 = "Stella dei Magi" — molto favorevole (+25)
- Nessuna retrogradazione attiva
- Ora di Venere disponibile alle 12:00 +8
- **Score framework: 74/100 — uno dei piu' alti possibili**

→ Raccomandazione: **29 luglio** per rispettare il mese di luglio; **17 agosto** se si può slittare di 3 settimane.

### In sospeso
- config.js sul server (chiave Groq) — ILLI•AI non funziona senza
- LinkedIn redirect URI → aggiungere poilove.com nell'app LinkedIn Developer Console
- Facebook OAuth — dopo Terms & Privacy
- Bug rimanenti da code review (vedi TODO.md)

---

## Sessione precedente (11/05/2026)
- 16 commit su origin/main (HEAD 3bc28c0)
- UX overhaul: photo picker, popup OSM, nav picker, profilo pubblico, map search, ILLI•AI, doppio tap mappa
- Fix geolocalizzazione (GPS reale, non Tirana hardcoded)
- Luoghi Personali (Casa/Lavoro) in localStorage
- Fix sistema Love (DB reale, non solo CSS)
- Compressione WebP automatica upload foto


- **v2.39 FIX descrizione AI (bug reale segnalato dal founder da casa)**: creando un POI a casa sua (Via Ca Nova 47, Zugliano) l AI generava "Ristorante... piatti tipici... prezzi variabili... prenotazione consigliata" — puttanate inventate, e Google Maps diceva altro. Causa: _gatherPoiFacts faceva `match = match || primo_locale_vicino`, cioe adottava il locale piu vicino (il ristorante "Opa" a ~80-90m sulla stessa via) come identita di QUESTO posto. Fix: un locale conta come questo posto SOLO se il nome combacia o se e proprio li (distM<=40m); altrimenti niente identita rubata. Inoltre, se non c e identita reale (OSM/Wikipedia/Google) e si sta generando, l AI NON inventa piu: chiede all utente di scrivere lui cos e (toast ai_no_facts). Rinforzato il prompt contro i riempitivi (prezzi/orari/prenotazione se non nei fatti). Collaudo deterministico: Opa a 60m NON adottato (fatti = solo indirizzo), a 15m adottato. Il titolo resta vuoto a casa (nessuna attivita li: giusto, lo scrive lui). Live (v2.39).

- **Bug reali segnalati dal founder dal vivo, corretti (v2.39-2.42)**. (1) Descrizione AI inventava un ristorante rubando l'identita al locale OSM piu vicino: paletto 40m/nome, e se nessuna identita reale l'AI NON inventa (chiede all'utente) — e ammesso onestamente che avevo asserito la distanza di "Opa" senza verificarla. (2) v2.40: i tier Professionista Plus e Influencer mostravano le CHIAVI grezze (tier_proplus_p1...) perche mancavano le traduzioni: aggiunte in 3 lingue + fallback nel render; pulsante CREA aggiunto nella sezione Compagni (c'era solo il FAB della mappa); foto del POI che riappariva nel POI successivo (openAddPOI non azzerava photoData/slot/unsplash): ora ogni nuovo POI parte pulito. (3) v2.41: categorie custom usabili SUBITO per il POI e persistenti nel profilo ("Le mie categorie"), pubbliche per tutti dopo 20 richieste (trigger mig 039). (4) v2.42: copertina itinerario caricabile in creazione, tolta l'immagine AI automatica (pollinations), fallback gradiente. Tutto collaudato in browser e live.

- **v2.43-2.44 su richiesta founder**: (2.43) RIMOSSA l'AI che compilava i campi nel pannello POI (bottone AI su nome e descrizione + auto-suggest del nome): si scrive/detta a mano. ILLI (chat) e la dettatura microfono restano intatte, sono la base. (2.44) Tassonomia definita: TAG liberi; SOTTOCATEGORIE aggiungibili libere con scelta della famiglia (macro), usabili subito per il POI e persistenti nel profilo; dopo 20 volte la stessa sottocategoria diventa ufficiale per tutti NELLA FAMIGLIA GIUSTA (mig 040: macro nella richiesta + promozione col macro corretto). Collaudato: chooser famiglia -> cibo, promozione a 20 in cibo. Live.