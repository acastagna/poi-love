# POI•VOICE — come si fa parlare Google

Verificato sulle pagine ufficiali il 21/08/2026. I numeri qui dentro non sono
a memoria: ognuno ha la sua pagina.

> Avvertenza di metodo: le pagine di Google tradotte in italiano sono tradotte
> da una macchina e la tabella delle lingue arriva corrotta ("Inglese | it",
> "Ebraico | lui"). Si legge la versione inglese, sempre.

## La scelta: Gemini TTS, non le voci normali

Le voci classiche di Google Cloud (Chirp 3 HD, Studio, Neural2, WaveNet)
coprono 61 lingue e **l'albanese non c'è**. Ci sono serbo, croato, sloveno.
L'albanese esiste solo su **Gemini TTS**, come `sq`, e su Google Cloud è
dichiarato **Preview**: non definitivo, può cambiare senza preavviso. La lingua
del nostro mercato principale è la meno garantita delle tre. Va saputo.

Modello scelto da Alessandro: **gemini-2.5-pro-tts**, la resa migliore.

## Le voci

Trenta voci, quattordici femminili e sedici maschili. Il genere lo dichiara
Google nella tabella di cloud.google.com/text-to-speech/docs/gemini-tts.

**Una voce non è legata a una lingua.** Se scegli Kore, Kore parla albanese,
italiano e inglese: il modello riconosce la lingua dal testo. Basta scegliere
una voce femminile e una maschile e valgono per tutte e tre.

Femminili: Zephyr (chiara), Kore (ferma), Leda (giovane), Aoede (leggera),
Callirrhoe (tranquilla), Autonoe (chiara), Despina (morbida), Erinome (nitida),
Laomedeia (allegra), Achernar (dolce), Gacrux (matura), Pulcherrima (decisa),
Vindemiatrix (gentile), Sulafat (calda).

Maschili: Puck (allegro), Charon (informativo), Fenrir (acceso), Orus (fermo),
Enceladus (soffiato), Iapetus (nitido), Umbriel (tranquillo), Algieba (liscio),
Algenib (roco), Rasalgethi (informativo), Alnilam (fermo), Schedar (regolare),
Achird (amichevole), Zubenelgenubi (informale), Sadachbia (vivace),
Sadaltager (competente).

Per una audioguida partirei da **Sulafat** (calda) e **Sadaltager**
(competente), ma si provano e si cambiano dal pannello.

## La trappola dell'albanese

Nella chiamata esiste un campo `languageCode`. Accetta trenta valori e
**l'albanese non è fra questi**. Per l'albanese quel campo va lasciato vuoto e
si lascia fare al riconoscimento automatico. Impostarlo rompe la chiamata.

## Come si scrive la chiamata

Il nome del parametro della voce cambia a seconda dell'interfaccia. È il punto
dove si sbaglia:

| Interfaccia | Dove si mette la voce |
|---|---|
| Gemini API `generateContent` | `speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName` |
| Interactions API (la nuova) | `generation_config.speech_config[].voice` |
| Cloud Text-to-Speech | `voice.name` più `voice.model_name` |

Due campi separati, ed è la logica dello studio di doppiaggio: **`prompt`** dice
come recitare, a parole normali; **`text`** dice cosa leggere.

## Un parlante o due

Con una voce sola il testo si manda nudo: **non** si scrive "Speaker 1:"
davanti. Il prefisso col nome serve solo nella modalità a due voci, dove i nomi
sono liberi (l'esempio di Google usa Joe e Jane) e il limite è **due**.
`voiceConfig` e `multiSpeakerVoiceConfig` non stanno insieme.

## I limiti di una chiamata sola

| | |
|---|---|
| Testo in ingresso | 8.192 gettoni (un copione da 10 minuti ne fa ~2.500) |
| Audio in uscita | 16.384 gettoni, cioè **circa 11 minuti** |
| Formato | PCM grezzo, 24.000 Hz, mono, 16 bit |

Una audioguida da 10 minuti ci sta, ma di poco. Oltre, si spezza e si uniscono
i pezzi.

## Quanto costa

Prezzo di `gemini-2.5-pro-tts`: 1 dollaro per milione di gettoni di testo,
**20 dollari per milione di gettoni di audio**. L'audio si conta **25 gettoni
per ogni secondo**. A lotti (consegna entro 24 ore) si paga la metà.

Per 210 luoghi in 3 lingue, cioè 630 file:

| Durata | Subito | A lotti |
|---|---|---|
| 5 minuti l'una | 95 dollari | 48 dollari |
| 10 minuti l'una | 191 dollari | 95 dollari |

Il testo è meno dell'uno per cento della spesa: conta solo l'audio.

## Il credito residuo non si legge

Nessuna chiamata di Google restituisce il saldo. La documentazione lo dice:
la gestione del credito sta solo dentro la pagina di AI Studio. La Cloud
Billing API legge la configurazione, non la spesa.

Quello che si può fare, ed è esatto:
- ogni generazione restituisce i gettoni usati, quindi il **costo di quella
  singola audioguida** si calcola e si scrive;
- il totale di oggi e del mese si somma dai nostri dati;
- il credito caricato lo scrive a mano Alessandro, e il pannello mostra
  "caricato meno speso".

Con ritardo di ore si potrebbe leggere la spesa vera esportandola su BigQuery
o con gli avvisi di budget: si valuta dopo, non serve per partire.

## Dove si prende la chiave

https://aistudio.google.com/apikey

Entrare col proprio account, creare la chiave, poi due cose: limitarla alla
sola Gemini API, e attivare il pagamento (la voce **non** è nel livello
gratuito). La chiave comincia per `AIza` e non deve passare per la chat: si
mette in un file e si carica nei segreti del server.
