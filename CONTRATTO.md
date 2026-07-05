<!--
© Alessandro Castagna : 321.al / EVOLAB
Tutti i diritti riservati. Uso non autorizzato vietato.
info@321.al · https://321.al
-->

# CONTRATTO DI LAVORO · POI•LOVE

> **Questa è la traccia ufficiale del progetto.** Ogni passo che facciamo è definito qui: cosa, in quale settore, con quale stato e quale tempistica. Si aggiorna a OGNI giro di lavoro, insieme a SAL.md (il diario) e TODO.md (la lista operativa).
> Versione app corrente: **2.00** (partenza ufficiale 04/07/2026). Lancio pubblico: **lunedì 17/08/2026, Tirana**.

## Le regole del contratto (valgono per ogni passo)

1. Un passo è FATTO solo se: scritto, validato, deployato, **verificato dal vivo**. Mai "dovrebbe funzionare".
2. Tutto il nuovo esce in **3 lingue** (SQ, IT, EN) con apertura automatica sulla lingua del telefono.
3. Niente trattini lunghi nei testi. Chiavi e segreti solo lato server. Passi atomici e reversibili.
4. Le tendine di scelta esistono SOLO sul campo indirizzo (ricerca manuale). I titoli li propone il sistema.
5. Ogni sessione chiude con: commit, tag se importante, SAL aggiornato, questo contratto aggiornato.

## Stato per settore

### 1. Webapp · creazione POI
| Passo | Stato | Quando |
|---|---|---|
| EXIF compila campi visibili, posizione obbligatoria, stop coordinate finte | ✅ Fatto e live | 04/07 |
| Titolo intelligente del luogo (capisce aeroporto/mall/museo, non la via) | ✅ Fatto e live | 04-05/07 |
| Titoli nella lingua dell'app (it/sq/en da OpenStreetMap) | ✅ Fatto e live | 05/07 |
| Tendina rimossa dal campo nome (resta solo sull'indirizzo) | ✅ Fatto e live | 05/07 |
| Descrizione AI dai dati reali, mai cancellare gli appunti | ✅ Fatto e live | 04/07 |
| Mini-mappa del punto POI nello sheet (zoom con le dita) | ✅ Fatto e live | 05/07 |
| Mini-mappa come strumento: mirino + "Fissa il punto" prende i riferimenti | ✅ Fatto e live | 05/07 |
| Versione visibile anche nel footer nero della mappa | ✅ Fatto e live | 05/07 |
| Scheda POI senza slot foto vuoti: + nel cerchio, foto a larghezza adattiva (1=100%, 2=50/50, 3=33x3) | ✅ Fatto e live | 05/07 |
| Descrizione 200 caratteri nella fascia rossa del dettaglio POI | ⬜ Da fare | prossimo giro |
| Immagini licenziate del luogo (Wikimedia, con attribuzione) | ⬜ Da fare | prossimo giro |
| Ricerca indirizzo più intelligente (errori di battitura + contesto città) | 🔶 In parte (Albania-first fatto) | da rifinire |

### 2. ILLI (l'AI degli utenti)
| Passo | Stato | Quando |
|---|---|---|
| Solo utenti loggati, limiti giornalieri per livello, rimborso su errore | ✅ Fatto e live | 04/07 |
| Chat riparata dal 2° messaggio, errori gentili in 3 lingue | ✅ Fatto e live | 04/07 |
| Cerca nella città nominata nella domanda, non solo vicino a te | ✅ Fatto e live | 04/07 |
| Voce e audio (POIVOICE) | ⬜ Fase 2 | dopo il lancio |

### 3. Copilota e pannello admin
| Passo | Stato | Quando |
|---|---|---|
| Copilota che crea POI completi (descrizione da ricerca web, indirizzo vero) | ✅ Fatto e live | 04/07 |
| Sezione "POI creati": vedi, modifica, pubblica, elimina | ✅ Fatto e live | 04/07 |
| Storico chat del copilota | ✅ Fatto e live | 04/07 |
| Sicurezza: doppio fattore obbligatorio senza scappatoie | ✅ Fatto e live | 04/07 |
| Rotte storiche gestite dal pannello | ⬜ Da fare | prima del lancio |
| Sistema email + AcumbaMail (serve la chiave da Alessandro) | ⬜ Da fare | prima del lancio |
| Cambio tier utenti da admin + tier Professionista Plus + livello Influencer | ⬜ Da fare | prima del lancio |
| Claim proprietà POI (a pagamento, con allarme in admin) | ⬜ Da fare | prima del lancio |

### 4. Backend, database e sicurezza
| Passo | Stato | Quando |
|---|---|---|
| Migrazioni 012-017 applicate (moderazione, copilota, chat, contatori, audit) | ✅ Fatto e verificato | 04/07 |
| Chiave AI solo server-side, file pubblico ripulito | ✅ Fatto e verificato | 04/07 |
| Collaudo automatico end-to-end (utente vero usa-e-getta) | ✅ Fatto | 04/07 |
| verify_jwt esplicito per funzione (config.toml versionato) | ⬜ Da fare | prossimo giro |

### 5. Condivisione e landing
| Passo | Stato | Quando |
|---|---|---|
| Condivisione POI col teaser misterioso (zona + immagine AI + registrati) | ⬜ Da fare | prima del lancio |
| Landing personale del profilo (sfondo + avatar + Entra in POI•LOVE) | ⬜ Da fare | prima del lancio |
| Itinerari → Rotte Storiche con pagina propria | 🔶 In parte (tab fatto) | prima del lancio |

### 6. Legale e lancio
| Passo | Stato | Quando |
|---|---|---|
| Termini e Privacy online in 3 lingue | ✅ Fatto e live | 27/06 |
| Validazione legale dei testi (professionista) | ⬜ Da fare | prima del lancio |
| Collaudo finale di Alessandro (checklist 5 prove) | ⬜ In attesa | adesso |
| Lancio pubblico Tirana | 🎯 Obiettivo | 17/08/2026 |

---
*Aggiornato: 05/07/2026 mattina · si aggiorna a ogni giro di lavoro*
